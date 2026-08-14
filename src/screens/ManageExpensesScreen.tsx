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
import {
  CurrencyTotal,
  formatAmount,
  formatTotalsWithLead,
  convertedTotal,
  totalsByCurrencyFor,
} from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {groups.length > 0 && (
        <TouchableOpacity
          style={[styles.groupBar, { flexDirection: rowDirection }]}
          onPress={() => setGroupModalVisible(true)}
          activeOpacity={0.7}
        >
          {selectedGroup ? (
            <View
              style={[
                styles.groupBarDot,
                { backgroundColor: selectedGroup.color },
              ]}
            />
          ) : (
            <Ionicons
              name="folder-outline"
              size={18}
              color={colors.textMuted}
              style={styles.groupBarIcon}
            />
          )}
          <Text style={[styles.groupBarName, { textAlign }]} numberOfLines={1}>
            {selectedGroup ? selectedGroup.name : t.groups.allGroups}
          </Text>
          <Text style={styles.groupBarChevron}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.header,
          { flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' },
        ]}
      >
        <Text style={[styles.subtitle, { textAlign }]}>
          {t.manage.tripTotal}{' '}
          <Text style={styles.subtitleStrong}>
            {formatTotalsWithLead(
              totalsByCurrency,
              leadCurrency,
              leadTotal,
              selectedGroup?.defaultCurrency
            )}
          </Text>
        </Text>
        <TouchableOpacity
          onPress={() => setExportModalVisible(true)}
          disabled={filteredExpenses.length === 0 || exporting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t.manage.export}
        >
          <Ionicons
            name="download-outline"
            size={22}
            color={filteredExpenses.length === 0 || exporting ? colors.border : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
        onPress={() => {
          if (canAdd && selectedGroup) {
            (navigation as any).navigate('AddExpense', { groupId: selectedGroup.id });
          }
        }}
        disabled={!canAdd}
        activeOpacity={0.85}
      >
        <Text style={styles.addButtonText}>+ {t.add.save}</Text>
      </TouchableOpacity>

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
            const itemGroup = showGroupTag ? groups.find((g) => g.id === item.groupId) : null;
            const descriptionText = item.description
              ? item.description
              : timeLabel(item.createdAt, language.locale);
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
                activeOpacity={0.7}
              >
                <View style={styles.iconBadge}>
                  {showGroupTag ? (
                    <View
                      style={[
                        styles.groupDot,
                        { backgroundColor: itemGroup?.color ?? colors.textMuted },
                      ]}
                    />
                  ) : (
                    <Ionicons
                      name={info ? info.icon : methodIcon}
                      size={20}
                      color={info ? colors.text : colors.textMuted}
                    />
                  )}
                </View>
                <View style={styles.rowMiddle}>
                  <Text style={[styles.rowDescription, { textAlign }]} numberOfLines={1}>
                    {descriptionText}
                  </Text>
                  <Text style={[styles.rowMethod, { textAlign }]} numberOfLines={1}>
                    {method ?? ''}
                    {showGroupTag ? `  ·  ${groupName(item.groupId)}` : ''}
                  </Text>
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
                    color={colors.textMuted}
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
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  subtitle: { fontSize: 15, color: colors.textMuted },
  subtitleStrong: { color: colors.primaryDark, fontWeight: '700' },
  groupBar: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupBarIcon: { fontSize: 16, marginHorizontal: 6 },
  groupBarDot: { width: 14, height: 14, borderRadius: 7, marginHorizontal: 6 },
  groupBarName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  groupBarChevron: { fontSize: 18, color: colors.textMuted },
  addButton: {
    backgroundColor: colors.buttonGrey,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  addButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0 },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTotal: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.background,
  },
  groupDot: { width: 20, height: 20, borderRadius: 10 },
  rowMiddle: { flex: 1 },
  rowDescription: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMethod: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
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
    backgroundColor: colors.buttonGrey,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 39, 51, 0.45)',
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
