import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
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
} from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { companionName } from '../utils/companionName';
import { dayLabel, timeLabel } from '../utils/dateLabel';
import { takePendingNewExpenseHighlight } from '../utils/pendingNewExpenseHighlight';
import { useExpenseGrouping } from '../storage/ExpenseGroupingContext';

const HIGHLIGHT_DURATION_MS = 1000;
const HIGHLIGHT_FADE_MS = 1000;
const HIGHLIGHT_COLOR = '#DFF5E1';

const TOTALS_CARD_GRADIENT = ['#702ADC', '#FFFFFF'] as const;

function localDateKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

interface Section {
  key: string;
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
  const { vacations, activeVacationId, loading: vacationsLoading } = useVacations();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const { groupBy } = useExpenseGrouping();
  const textAlign = isRTL ? 'right' : 'left';
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [collapsedOverrides, setCollapsedOverrides] = useState<Record<string, boolean>>({});
  const [highlightedExpenseId, setHighlightedExpenseId] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // After creating a new expense, briefly highlight its row so the user can
  // spot it in the list. Also force-expand its day section in case it isn't
  // today (and would otherwise be collapsed and invisible).
  useFocusEffect(
    useCallback(() => {
      const id = takePendingNewExpenseHighlight();
      if (!id) return;
      const newExpense = expenses.find((e) => e.id === id);
      if (newExpense && groupBy === 'date') {
        const key = localDateKey(newExpense.createdAt);
        setCollapsedOverrides((prev) => ({ ...prev, [`date:${key}`]: false }));
      }
      setHighlightedExpenseId(id);
      highlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(HIGHLIGHT_DURATION_MS),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: HIGHLIGHT_FADE_MS,
          useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished) setHighlightedExpenseId(null);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, groupBy])
  );

  const selectedVacation = vacations.find((v) => v.id === activeVacationId) ?? null;
  const leadCurrency = selectedVacation?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  const convert = (amount: number, fromCode: string) =>
    rawConvert(amount, fromCode, leadCurrency);

  const filteredExpenses = useMemo(() => {
    const list = expenses.filter((e) => e.vacationId === activeVacationId);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses, activeVacationId]);

  const totalsByCurrency = useMemo(
    () => totalsByCurrencyFor(filteredExpenses),
    [filteredExpenses]
  );
  const leadTotal = leadCurrency ? convertedTotal(filteredExpenses, convert) : null;
  const methodName = (id: string): string | null => {
    const method = methods.find((m) => m.id === id);
    return method ? paymentMethodName(method, t) : null;
  };

  const sections: Section[] = useMemo(() => {
    const grouped = new Map<string, { title: string; data: Expense[] }>();
    const addToGroup = (key: string, title: string, expense: Expense) => {
      if (!grouped.has(key)) grouped.set(key, { title, data: [] });
      grouped.get(key)!.data.push(expense);
    };

    for (const e of filteredExpenses) {
      if (groupBy === 'date') {
        const dateKey = localDateKey(e.createdAt);
        addToGroup(dateKey, dayLabel(e.createdAt, t, language.locale), e);
      } else if (groupBy === 'paymentMethod') {
        addToGroup(e.paymentMethodId, methodName(e.paymentMethodId) ?? e.paymentMethodId, e);
      } else if (groupBy === 'category') {
        const category = e.category ?? 'Other';
        addToGroup(category, t.categories[category], e);
      } else if (groupBy === 'currency') {
        addToGroup(e.currencyCode, e.currencyCode, e);
      } else {
        const participantIds = [ME_COMPANION_ID, ...e.split.map((share) => share.companionId)];
        for (const participantId of participantIds) {
          addToGroup(
            participantId,
            companionName(participantId, selectedVacation?.companions ?? [], t),
            e
          );
        }
      }
    }

    return Array.from(grouped.entries()).map(([key, { title, data }]) => {
      const sortedByDate = [...data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        key,
        title,
        data: sortedByDate,
        totals: totalsByCurrencyFor(sortedByDate),
      };
    });
  }, [filteredExpenses, groupBy, methods, selectedVacation, t, language.locale]);

  // All day-groups start collapsed except today's, until the user toggles one.
  // Other grouping modes start expanded so changing the setting reveals the result immediately.
  const isSectionCollapsed = (key: string, title: string) =>
    collapsedOverrides[`${groupBy}:${key}`] !== undefined
      ? collapsedOverrides[`${groupBy}:${key}`]
      : groupBy === 'date' && title !== t.manage.today;
  const toggleSection = (key: string, title: string) =>
    setCollapsedOverrides((prev) => ({
      ...prev,
      [`${groupBy}:${key}`]: !isSectionCollapsed(key, title),
    }));
  const displaySections = sections.map((s) =>
    isSectionCollapsed(s.key, s.title) ? { ...s, data: [] } : s
  );

  const confirmDelete = (expense: Expense) => setPendingDelete(expense);

  const handleConfirmDelete = () => {
    if (pendingDelete) deleteExpense(pendingDelete.id);
    setPendingDelete(null);
  };

  const canAdd = !!selectedVacation;

  const openVacationForm = (vacationId?: string) => {
    (navigation as any).navigate('VacationForm', vacationId ? { vacationId } : undefined);
  };

  if (vacationsLoading) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  if (vacations.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.noVacationsHeaderRow, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
          <TouchableOpacity
            style={styles.settingsButtonBox}
            onPress={() => (navigation as any).navigate('Settings')}
            activeOpacity={0.7}
            accessibilityLabel={t.settings.title}
          >
            <Ionicons name="settings-outline" size={17} color="#52525B" />
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <View style={styles.noVacationsIconTile}>
            <Ionicons name="briefcase-outline" size={48} color="#7C3AED" />
          </View>
          <Text style={styles.noVacationsTitle}>{t.vacations.emptyTitle}</Text>
          <Text style={styles.noVacationsSubtitle}>{t.vacations.emptySubtitle}</Text>
          <TouchableOpacity
            style={[styles.noVacationsButton, { flexDirection: rowDirection }]}
            onPress={() => openVacationForm()}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.noVacationsButtonText}>{t.vacations.emptyButton}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const heroMainCurrency =
    totalsByCurrency.find((t) => t.currencyCode === selectedVacation?.defaultCurrency) ??
    totalsByCurrency[0] ??
    null;
  const heroMainTotal = heroMainCurrency
    ? formatAmount(heroMainCurrency.amount, heroMainCurrency.currencyCode)
    : formatAmount(0, selectedVacation?.defaultCurrency ?? 'USD');
  const heroOtherText = totalsByCurrency
    .filter((t) => t !== heroMainCurrency)
    .map((t) => formatAmount(t.amount, t.currencyCode))
    .join('  ·  ');
  const heroLeadIsRedundant =
    totalsByCurrency.length === 1 && totalsByCurrency[0].currencyCode === leadCurrency;
  const heroLeadText =
    leadCurrency && leadTotal !== null && !heroLeadIsRedundant
      ? `(${formatAmount(leadTotal, leadCurrency)})`
      : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={[styles.topRow, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
          <TouchableOpacity
            style={styles.settingsButtonBox}
            onPress={() => (navigation as any).navigate('Settings')}
            activeOpacity={0.7}
            accessibilityLabel={t.settings.title}
          >
            <Ionicons name="settings-outline" size={17} color="#52525B" />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={TOTALS_CARD_GRADIENT}
          start={{ x: isRTL ? 0 : 1, y: 0 }}
          end={{ x: isRTL ? 1 : 0, y: 0 }}
          style={styles.totalsCard}
        >
          <View style={[styles.cardTitleRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.cardTitleName, { textAlign }]} numberOfLines={1}>
              {selectedVacation?.name ?? ''}
            </Text>
            {selectedVacation && (
              <TouchableOpacity
                style={styles.editNameButton}
                onPress={() => openVacationForm(selectedVacation.id)}
                activeOpacity={0.7}
                accessibilityLabel={t.vacations.editTitle}
              >
                <Ionicons name="pencil" size={13} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.totalsRow, { flexDirection: rowDirection }]}>
            <View style={styles.totalsMain}>
              <Text style={[styles.totalsAmount, { textAlign }]}>{heroMainTotal}</Text>
              {heroOtherText ? (
                <Text style={[styles.totalsSecondaryAmount, { textAlign }]}>{heroOtherText}</Text>
              ) : null}
              {heroLeadText ? (
                <Text style={[styles.totalsConverted, { textAlign }]}>{heroLeadText}</Text>
              ) : null}
            </View>
            <View style={[styles.countPill, { flexDirection: rowDirection }]}>
              <View style={styles.countPillDot} />
              <Text style={styles.countPillText}>
                {filteredExpenses.length} {t.manage.expensesCount}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.actionsRow, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            style={[
              styles.addButton,
              { flexDirection: rowDirection },
              !canAdd && styles.addButtonDisabled,
            ]}
            onPress={() => {
              if (canAdd && selectedVacation) {
                (navigation as any).navigate('AddExpense', { vacationId: selectedVacation.id });
              }
            }}
            disabled={!canAdd}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>{t.add.save}</Text>
          </TouchableOpacity>
        </View>

      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconTile}>
            <Ionicons name="receipt-outline" size={48} color="#7C3AED" />
          </View>
          <Text style={styles.emptyText}>{t.manage.emptyTitle}</Text>
          <Text style={styles.emptySubtext}>{t.manage.emptySubtitle}</Text>
        </View>
      ) : (
        <SectionList
          sections={displaySections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => {
            // section.data may have been emptied for display while collapsed;
            // look totals up from the full (un-collapsed) section for the header.
            const fullSection = sections.find((s) => s.key === section.key) ?? section;
            const collapsed = isSectionCollapsed(section.key, section.title);
            const sectionLeadTotal = leadCurrency
              ? convertedTotal(fullSection.data, convert)
              : null;
            return (
              <TouchableOpacity
                style={[styles.sectionHeader, { flexDirection: rowDirection }]}
                onPress={() => toggleSection(section.key, section.title)}
                activeOpacity={0.7}
              >
                <View style={[styles.sectionTitleRow, { flexDirection: rowDirection }]}>
                  <Ionicons
                    name={collapsed ? (isRTL ? 'chevron-back' : 'chevron-forward') : 'chevron-down'}
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                </View>
                <Text style={styles.sectionTotal}>
                  {formatTotalsWithLead(
                    fullSection.totals,
                    leadCurrency,
                    sectionLeadTotal,
                    selectedVacation?.defaultCurrency
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
          renderItem={({ item }) => {
            const category = item.category;
            const info = category ? categoryInfo(category) : null;
            const method = methodName(item.paymentMethodId);
            const methodIcon =
              methods.find((m) => m.id === item.paymentMethodId)?.icon ??
              DEFAULT_PAYMENT_METHOD_ICON;
            const badgeTint = info ? info.tint : colors.background;
            const iconColor = info ? info.color : colors.textMuted;
            const descriptionText = item.description
              ? item.description
              : timeLabel(item.createdAt, language.locale);
            const itemVacation = vacations.find((g) => g.id === item.vacationId);
            const splitLabel =
              item.split.length > 0
                ? `${t.manage.splitBadge}: ${[ME_COMPANION_ID, ...item.split.map((s) => s.companionId)]
                    .map((id) => companionName(id, itemVacation?.companions ?? [], t))
                    .join(', ')}`
                : null;
            const isHighlighted = item.id === highlightedExpenseId;
            return (
              <TouchableOpacity
                style={[styles.row, { flexDirection: rowDirection }]}
                onPress={() =>
                  (navigation as any).navigate('AddExpense', {
                    vacationId: item.vacationId,
                    expenseId: item.id,
                  })
                }
                onLongPress={() => confirmDelete(item)}
                activeOpacity={0.6}
              >
                {isHighlighted && (
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.highlightOverlay, { opacity: highlightAnim }]}
                  />
                )}
                <View style={[styles.iconBadge, { backgroundColor: badgeTint }]}>
                  <Ionicons name={info ? info.icon : methodIcon} size={19} color={iconColor} />
                </View>
                <View style={styles.rowMiddle}>
                  <Text style={[styles.rowDescription, { textAlign }]} numberOfLines={1}>
                    {descriptionText}
                  </Text>
                  <Text style={[styles.rowMethod, { textAlign }]} numberOfLines={1}>
                    {method ?? ''}
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 18 },
  topRow: {
    flexDirection: 'row',
    minHeight: 32,
  },
  cardTitleRow: {
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  cardTitleName: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  editNameButton: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: '#F5F1FE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingsButtonBox: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  noVacationsHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  totalsCard: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 22,
    shadowColor: '#18142D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  totalsRow: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  totalsMain: { flex: 1, minWidth: 0 },
  totalsAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.7,
    flexWrap: 'wrap',
  },
  totalsSecondaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
    marginTop: 4,
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
  addButton: {
    flex: 1,
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 18,
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
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 32 },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 5,
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
  highlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: HIGHLIGHT_COLOR,
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  emptyIconTile: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: '#F5F1FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 28,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 9,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noVacationsIconTile: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: '#F5F1FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  noVacationsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 28,
  },
  noVacationsSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 9,
  },
  noVacationsButton: {
    minWidth: 210,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  noVacationsButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
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
});
