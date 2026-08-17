import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useGroups } from '../storage/GroupsContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { categoryInfo, Expense } from '../types/expense';
import { DEFAULT_PAYMENT_METHOD_ICON } from '../types/paymentMethod';
import { ME_COMPANION_ID } from '../types/companion';
import {
  CurrencyTotal,
  formatAmount,
  formatTotalsWithLead,
  convertedTotal,
  totalsByCurrencyFor,
  companionCurrencyTotals,
  companionConvertedTotal,
} from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { companionName } from '../utils/companionName';
import { dayLabel, timeLabel } from '../utils/dateLabel';
import {
  buildExpensesCsv,
  buildExpensesHtml,
  exportCsvFile,
  exportPdfFile,
} from '../utils/exportExpenses';
import GroupPickerModal, { ALL_GROUPS } from '../components/GroupPickerModal';

interface Section {
  title: string;
  totals: CurrencyTotal[];
  data: Expense[];
}

export default function ManageExpensesScreen() {
  const navigation = useNavigation();
  const { expenses, deleteExpense } = useExpenses();
  const { methods } = usePaymentMethods();
  const { t, language, isRTL } = useLanguage();
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const { groups, activeGroupId, loading: groupsLoading } = useGroups();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [viewGroupId, setViewGroupId] = useState<string>(ALL_GROUPS);
  // True once the initial filter has been resolved to the real active group (or,
  // failing that, confirmed to legitimately be "all groups"). Prevents an initial
  // paint of the ALL_GROUPS state — with its group-colored row dots — before the
  // effect below has a chance to switch to the actual active group.
  const [filterReady, setFilterReady] = useState(false);
  const userTouchedFilter = useRef(false);
  const pendingGroupSync = useRef(false);

  useEffect(() => {
    if (!groupsLoading && !userTouchedFilter.current) {
      if (activeGroupId) setViewGroupId(activeGroupId);
      setFilterReady(true);
    }
  }, [groupsLoading, activeGroupId]);

  // After creating, editing, or deleting a group on the GroupForm screen, follow
  // whatever GroupsContext now considers the active group once we regain focus.
  useFocusEffect(
    useCallback(() => {
      if (pendingGroupSync.current) {
        pendingGroupSync.current = false;
        userTouchedFilter.current = true;
        setViewGroupId(activeGroupId ?? ALL_GROUPS);
      }
    }, [activeGroupId])
  );

  const selectedGroup = groups.find((g) => g.id === viewGroupId) ?? null;
  const leadCurrency = selectedGroup?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  const convert = (amount: number, fromCode: string) =>
    rawConvert(amount, fromCode, leadCurrency);

  const filteredExpenses = useMemo(() => {
    const list =
      viewGroupId === ALL_GROUPS ? expenses : expenses.filter((e) => e.groupId === viewGroupId);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses, viewGroupId]);

  const totalsByCurrency = useMemo(
    () => totalsByCurrencyFor(filteredExpenses),
    [filteredExpenses]
  );
  const leadTotal = leadCurrency ? convertedTotal(filteredExpenses, convert) : null;
  const hasAnySplit = useMemo(
    () => filteredExpenses.some((e) => e.split.length > 0),
    [filteredExpenses]
  );
  const splitParticipantIds = useMemo(
    () =>
      selectedGroup ? [ME_COMPANION_ID, ...selectedGroup.companions.map((c) => c.id)] : [],
    [selectedGroup]
  );

  const sections: Section[] = useMemo(() => {
    const byDay = new Map<string, Expense[]>();
    for (const e of filteredExpenses) {
      const label = dayLabel(e.createdAt, t, language.locale);
      if (!byDay.has(label)) byDay.set(label, []);
      byDay.get(label)!.push(e);
    }
    return Array.from(byDay.entries()).map(([title, data]) => ({
      title,
      data,
      totals: totalsByCurrencyFor(data),
    }));
  }, [filteredExpenses, t, language.locale]);

  const methodName = (id: string): string | null => {
    const method = methods.find((m) => m.id === id);
    return method ? paymentMethodName(method, t) : null;
  };

  const groupName = (id: string): string =>
    groups.find((g) => g.id === id)?.name ?? '';

  const confirmDelete = (expense: Expense) => setPendingDelete(expense);

  const handleConfirmDelete = () => {
    if (pendingDelete) deleteExpense(pendingDelete.id);
    setPendingDelete(null);
  };

  const exportTitle = selectedGroup ? selectedGroup.name : t.groups.allGroups;
  const exportTotalsLine = `${t.manage.tripTotal} ${formatTotalsWithLead(
    totalsByCurrency,
    leadCurrency,
    leadTotal,
    selectedGroup?.defaultCurrency
  )}`;

  const handleExportCsv = async () => {
    setExportModalVisible(false);
    setExporting(true);
    try {
      const csv = buildExpensesCsv(filteredExpenses, groups, methods, t, language.locale);
      await exportCsvFile(csv, exportTitle);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportModalVisible(false);
    setExporting(true);
    try {
      const html = buildExpensesHtml(
        filteredExpenses,
        groups,
        methods,
        t,
        language.locale,
        exportTitle,
        exportTotalsLine,
        isRTL
      );
      await exportPdfFile(html, exportTitle);
    } finally {
      setExporting(false);
    }
  };

  const canAdd = viewGroupId !== ALL_GROUPS && !!selectedGroup;

  const openGroupForm = (groupId?: string) => {
    pendingGroupSync.current = true;
    (navigation as any).navigate('GroupForm', groupId ? { groupId } : undefined);
  };

  if (groupsLoading || !filterReady) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧳</Text>
          <Text style={styles.emptyText}>{t.groups.emptyTitle}</Text>
          <Text style={styles.emptySubtext}>{t.groups.emptySubtitle}</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => openGroupForm()}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyButtonText}>{t.groups.emptyButton}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalsText = formatTotalsWithLead(
    totalsByCurrency,
    leadCurrency,
    leadTotal,
    selectedGroup?.defaultCurrency
  );
  const parenIndex = totalsText.indexOf(' (');
  const heroMainTotal = parenIndex >= 0 ? totalsText.slice(0, parenIndex) : totalsText;
  const heroConvertedTotal = parenIndex >= 0 ? totalsText.slice(parenIndex) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.titleButton, { flexDirection: rowDirection }]}
            onPress={() => setGroupModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.titleName}>
              {selectedGroup ? selectedGroup.name : t.groups.allGroups}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
          {selectedGroup && (
            <TouchableOpacity
              style={[styles.editNameButton, isRTL ? { left: 0 } : { right: 0 }]}
              onPress={() => openGroupForm(selectedGroup.id)}
              activeOpacity={0.7}
              accessibilityLabel={t.groups.editTitle}
            >
              <Ionicons name="pencil" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.totalsCard}>
          <View style={[styles.totalsRow, { flexDirection: rowDirection }]}>
            <View style={styles.totalsMain}>
              <Text style={[styles.totalsAmount, { textAlign }]}>{heroMainTotal}</Text>
              {heroConvertedTotal ? (
                <Text style={[styles.totalsConverted, { textAlign }]}>{heroConvertedTotal}</Text>
              ) : null}
            </View>
            <View style={[styles.countPill, { flexDirection: rowDirection }]}>
              <View style={styles.countPillDot} />
              <Text style={styles.countPillText}>
                {filteredExpenses.length} {t.manage.expensesCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.actionsRow, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            style={[
              styles.addButton,
              { flexDirection: rowDirection },
              !canAdd && styles.addButtonDisabled,
            ]}
            onPress={() => {
              if (canAdd && selectedGroup) {
                (navigation as any).navigate('AddExpense', { groupId: selectedGroup.id });
              }
            }}
            disabled={!canAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>{t.add.save}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportCircle}
            onPress={() => setExportModalVisible(true)}
            disabled={filteredExpenses.length === 0 || exporting}
            activeOpacity={0.7}
            accessibilityLabel={t.manage.export}
          >
            <Ionicons
              name="share-outline"
              size={18}
              color={filteredExpenses.length === 0 || exporting ? colors.border : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {selectedGroup && selectedGroup.companions.length > 0 && hasAnySplit && (
          <View style={styles.splitCard}>
            <Text style={[styles.splitCardTitle, { textAlign }]}>
              {t.manage.splitTotalsTitle}
            </Text>
            {splitParticipantIds.map((id) => {
              const totals = companionCurrencyTotals(filteredExpenses, id);
              if (totals.length === 0) return null;
              const personLeadTotal = leadCurrency
                ? companionConvertedTotal(filteredExpenses, id, convert)
                : null;
              return (
                <View key={id} style={[styles.splitCardRow, { flexDirection: rowDirection }]}>
                  <Text style={[styles.splitCardName, { textAlign }]} numberOfLines={1}>
                    {companionName(id, selectedGroup.companions, t)}
                  </Text>
                  <Text style={[styles.splitCardAmount, { textAlign }]} numberOfLines={1}>
                    {formatTotalsWithLead(
                      totals,
                      leadCurrency,
                      personLeadTotal,
                      selectedGroup.defaultCurrency
                    )}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧳</Text>
          <Text style={styles.emptyText}>{t.manage.emptyTitle}</Text>
          <Text style={styles.emptySubtext}>{t.manage.emptySubtitle}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => {
            const sectionLeadTotal = leadCurrency
              ? convertedTotal(section.data, convert)
              : null;
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionTotal}>
                  {formatTotalsWithLead(
                    section.totals,
                    leadCurrency,
                    sectionLeadTotal,
                    selectedGroup?.defaultCurrency
                  )}
                </Text>
              </View>
            );
          }}
          renderItem={({ item }) => {
            const category = item.category;
            const info = category ? categoryInfo(category) : null;
            const method = methodName(item.paymentMethodId);
            const methodIcon =
              methods.find((m) => m.id === item.paymentMethodId)?.icon ??
              DEFAULT_PAYMENT_METHOD_ICON;
            const showGroupTag = viewGroupId === ALL_GROUPS;
            const badgeTint = info ? info.tint : colors.background;
            const iconColor = info ? info.color : colors.textMuted;
            const descriptionText = item.description
              ? item.description
              : timeLabel(item.createdAt, language.locale);
            const itemGroup = groups.find((g) => g.id === item.groupId);
            const splitLabel =
              item.split.length > 0
                ? `${t.manage.splitBadge}: ${[ME_COMPANION_ID, ...item.split.map((s) => s.companionId)]
                    .map((id) => companionName(id, itemGroup?.companions ?? [], t))
                    .join(', ')}`
                : null;
            return (
              <TouchableOpacity
                style={[styles.row, { flexDirection: rowDirection }]}
                onPress={() =>
                  (navigation as any).navigate('AddExpense', {
                    groupId: item.groupId,
                    expenseId: item.id,
                  })
                }
                onLongPress={() => confirmDelete(item)}
                activeOpacity={0.6}
              >
                <View style={[styles.iconBadge, { backgroundColor: badgeTint }]}>
                  <Ionicons name={info ? info.icon : methodIcon} size={19} color={iconColor} />
                </View>
                <View style={styles.rowMiddle}>
                  <Text style={[styles.rowDescription, { textAlign }]} numberOfLines={1}>
                    {descriptionText}
                  </Text>
                  <Text style={[styles.rowMethod, { textAlign }]} numberOfLines={1}>
                    {method ?? ''}
                    {showGroupTag ? `  ·  ${groupName(item.groupId)}` : ''}
                  </Text>
                  {splitLabel && (
                    <Text style={[styles.rowSplit, { textAlign }]} numberOfLines={1}>
                      {splitLabel}
                    </Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>
                    {formatAmount(item.amount, item.currencyCode)}
                  </Text>
                  {leadCurrency && leadCurrency !== item.currencyCode && (() => {
                    const converted = convert(item.amount, item.currencyCode);
                    return converted !== null ? (
                      <Text style={styles.rowConverted}>
                        ≈ {formatAmount(converted, leadCurrency)}
                      </Text>
                    ) : null;
                  })()}
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.deleteText}>{t.manage.delete}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal
        visible={pendingDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDelete(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { textAlign }]}>
              {t.manage.deleteConfirmTitle}
            </Text>
            {pendingDelete && (
              <View style={[styles.modalDetailRow, { flexDirection: rowDirection }]}>
                {pendingDelete.category && (
                  <Ionicons
                    name={categoryInfo(pendingDelete.category).icon}
                    size={16}
                    color={categoryInfo(pendingDelete.category).color}
                    style={styles.modalDetailIcon}
                  />
                )}
                <Text style={[styles.modalDetail, { textAlign }]}>
                  {formatAmount(pendingDelete.amount, pendingDelete.currencyCode)}
                  {pendingDelete.description ? ` — ${pendingDelete.description}` : ''}
                </Text>
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPendingDelete(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.modalDeleteText}>{t.manage.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={exportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { textAlign }]}>{t.manage.exportTitle}</Text>
            <TouchableOpacity
              style={[styles.exportOption, { flexDirection: rowDirection }]}
              onPress={handleExportCsv}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.text} />
              <Text style={[styles.exportOptionText, { textAlign }]}>{t.manage.exportCsv}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportOption, { flexDirection: rowDirection }]}
              onPress={handleExportPdf}
              activeOpacity={0.7}
            >
              <Ionicons name="document-outline" size={20} color={colors.text} />
              <Text style={[styles.exportOptionText, { textAlign }]}>{t.manage.exportPdf}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, styles.exportCancelButton]}
              onPress={() => setExportModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>{t.manage.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <GroupPickerModal
        visible={groupModalVisible}
        selectedId={viewGroupId}
        onSelect={(id) => {
          userTouchedFilter.current = true;
          setViewGroupId(id);
        }}
        onClose={() => setGroupModalVisible(false)}
        allowAll
        allowCreate
        onCreateNew={() => openGroupForm()}
        onEditGroup={(group) => openGroupForm(group.id)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 16 },
  topRow: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 32,
    paddingHorizontal: 44,
  },
  titleButton: { alignItems: 'center', gap: 7, maxWidth: '100%' },
  titleName: {
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  editNameButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#F5F1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#18142D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  totalsRow: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalsMain: { flex: 1, minWidth: 0 },
  totalsAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    flexWrap: 'wrap',
  },
  totalsConverted: { fontSize: 14, color: colors.textMuted, marginTop: 5, flexWrap: 'wrap' },
  countPill: {
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#F5F1FE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  countPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryDark },
  countPillText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  actionsRow: { gap: 10 },
  exportCircle: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  addButton: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  addButtonDisabled: { backgroundColor: colors.border },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  splitCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  splitCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  splitCardRow: { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  splitCardName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  splitCardAmount: { fontSize: 14, fontWeight: '700', color: colors.text, marginLeft: 8 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 18,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTotal: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    flexShrink: 0,
  },
  rowMiddle: { flex: 1 },
  rowDescription: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMethod: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  rowSplit: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowConverted: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  deleteText: { fontSize: 12, color: colors.danger, marginTop: 4, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalDetailRow: { alignItems: 'center', marginTop: 8 },
  modalDetailIcon: { marginHorizontal: 4 },
  modalDetail: { fontSize: 15, color: colors.textMuted },
  modalActions: { flexDirection: 'row', marginTop: 22, gap: 10 },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  modalCancelButton: { backgroundColor: colors.background },
  modalCancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  modalDeleteButton: { backgroundColor: colors.danger },
  modalDeleteText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  exportOption: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exportOptionText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  exportCancelButton: { marginTop: 16 },
});
