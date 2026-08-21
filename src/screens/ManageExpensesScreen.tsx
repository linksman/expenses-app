import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Linking,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { categoryInfo } from '../types/expense';
import { DEFAULT_PAYMENT_METHOD_ICON } from '../types/paymentMethod';
import { ME_COMPANION_ID } from '../types/companion';
import {
  formatAmount,
  formatTotalsWithLead,
  convertedTotal,
  totalsByCurrencyFor,
  companionConvertedTotal,
  companionShare,
} from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { companionName } from '../utils/companionName';
import { timeLabel } from '../utils/dateLabel';
import { takePendingNewExpenseHighlight } from '../utils/pendingNewExpenseHighlight';
import { convertForVacation } from '../utils/vacationExchangeRate';
import { ExpenseSection, groupExpenses } from '../utils/groupExpenses';
import { useReducedMotion } from '../utils/useReducedMotion';

const HIGHLIGHT_DURATION_MS = 1000;
const HIGHLIGHT_FADE_MS = 1000;
const HIGHLIGHT_COLOR = '#DFF5E1';

const PAGE_ACCENT = '#27272A';
const PAGE_ACCENT_DARK = '#18181B';
const PAGE_ACCENT_SOFT = '#F4F4F5';
const TOTALS_CARD_GRADIENT = [PAGE_ACCENT, '#FFFFFF'] as const;
const LOADING_SUMMARY_GRADIENT = ['#D4D4D8', '#F4F4F5'] as const;
const WORLD_CAPITALS_COLLAGE = require('../../assets/world-capitals-collage.png');

function localDateKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export default function ManageExpensesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const { methods } = usePaymentMethods();
  const { t, language, isRTL } = useLanguage();
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const { vacations, activeVacationId, loading: vacationsLoading } = useVacations();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const [collapsedOverrides, setCollapsedOverrides] = useState<Record<string, boolean>>({});
  const [highlightedExpenseId, setHighlightedExpenseId] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();
  const selectedVacation = vacations.find((v) => v.id === activeVacationId) ?? null;
  const groupBy = selectedVacation?.groupBy ?? 'date';

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
      AccessibilityInfo.announceForAccessibility(t.add.saved);
      if (reduceMotion) {
        highlightAnim.setValue(0);
        setHighlightedExpenseId(null);
        return;
      }
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
    }, [expenses, groupBy, reduceMotion, t.add.saved])
  );

  const leadCurrency = selectedVacation?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  const convert = (amount: number, fromCode: string) =>
    selectedVacation
      ? convertForVacation(selectedVacation, rawConvert, amount, fromCode)
      : rawConvert(amount, fromCode, leadCurrency);

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

  const sections: ExpenseSection[] = useMemo(
    () => groupExpenses(filteredExpenses, groupBy, methods, selectedVacation, t, language.locale),
    [filteredExpenses, groupBy, methods, selectedVacation, t, language.locale]
  );

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

  const canAdd = !!selectedVacation;

  const openVacationForm = useCallback((vacationId?: string) => {
    (navigation as any).navigate('VacationForm', vacationId ? { vacationId } : undefined);
  }, [navigation]);

  if (vacationsLoading) {
    return <SafeAreaView style={styles.safe} edges={['top']} accessibilityLanguage={language.locale} />;
  }

  if (vacations.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']} accessibilityLanguage={language.locale}>
        <Image
          source={WORLD_CAPITALS_COLLAGE}
          style={styles.noVacationsBackgroundImage}
          contentFit="cover"
          accessible={false}
        />
        <View pointerEvents="none" style={styles.noVacationsBackgroundWash} />
        <View style={[styles.noVacationsHeaderRow, { justifyContent: isRTL ? 'flex-start' : 'flex-end' }]}>
          <TouchableOpacity
            style={styles.settingsButtonBox}
            onPress={() => (navigation as any).navigate('Settings')}
            activeOpacity={0.7}
          accessibilityLabel={t.settings.title}
          accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={17} color="#52525B" />
          </TouchableOpacity>
        </View>
        <View style={styles.noVacationsIconAnchor}>
          <View style={styles.noVacationsIconTile}>
            <Ionicons name="briefcase-outline" size={48} color={PAGE_ACCENT} />
          </View>
        </View>
        <View style={styles.empty}>
          <Text style={styles.noVacationsTitle}>{t.vacations.emptyTitle}</Text>
          <Text style={styles.noVacationsSubtitle}>{t.vacations.emptySubtitle}</Text>
          <TouchableOpacity
            style={[styles.noVacationsButton, { flexDirection: rowDirection }]}
            onPress={() => openVacationForm()}
            activeOpacity={0.85}
            accessibilityRole="button"
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
  const summaryImageUri =
    selectedVacation?.summaryImageUrl && selectedVacation.summaryImagePhotographerName
      ? selectedVacation.summaryImageUrl
      : '';
  const summaryImagePending = selectedVacation?.summaryImageUrl === undefined;

  return (
    <SafeAreaView style={styles.safe} edges={['top']} accessibilityLanguage={language.locale}>
      {summaryImageUri ? (
        <>
          <Image
            source={{ uri: summaryImageUri }}
            style={styles.appBackgroundImage}
            contentFit="cover"
            cachePolicy="disk"
            accessible={false}
          />
          <View pointerEvents="none" style={styles.appBackgroundWash} />
        </>
      ) : null}
      <View style={styles.container}>
        <View style={styles.summaryCard}>
          <View style={styles.totalsCard}>
          {summaryImageUri ? (
            <Image
              key={summaryImageUri}
              source={{ uri: summaryImageUri }}
              style={styles.summaryBackgroundImage}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
              accessible={false}
            />
          ) : null}
          <LinearGradient
            colors={
              summaryImageUri
                ? ['rgba(20, 12, 40, 0.30)', 'rgba(20, 12, 40, 0.78)']
                : summaryImagePending
                  ? LOADING_SUMMARY_GRADIENT
                : TOTALS_CARD_GRADIENT
            }
            start={{ x: isRTL ? 0 : 1, y: 0 }}
            end={{ x: isRTL ? 1 : 0, y: 0 }}
            style={styles.summaryOverlay}
          >
            <View
              style={[
                styles.cardTitleRow,
                {
                  flexDirection: rowDirection,
                  paddingLeft: isRTL ? 42 : 0,
                  paddingRight: isRTL ? 0 : 42,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitleName,
                  summaryImageUri && styles.summaryTextOnImage,
                  { textAlign },
                ]}
                accessibilityRole="header"
              >
                {selectedVacation?.name ?? ''}
              </Text>
            </View>
            <View style={[styles.totalsRow, { flexDirection: rowDirection }]}>
              <View style={styles.totalsMain}>
                <Text
                  style={[
                    styles.totalsAmount,
                    summaryImageUri && styles.summaryTextOnImage,
                    { textAlign },
                  ]}
                >
                  {heroMainTotal}
                </Text>
                {heroOtherText ? (
                  <Text
                    style={[
                      styles.totalsSecondaryAmount,
                      summaryImageUri && styles.summaryTextOnImage,
                      { textAlign },
                    ]}
                  >
                    {heroOtherText}
                  </Text>
                ) : null}
                {heroLeadText ? (
                  <Text
                    style={[
                      styles.totalsConverted,
                      summaryImageUri && styles.summaryMutedTextOnImage,
                      { textAlign },
                    ]}
                  >
                    {heroLeadText}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.countPill,
                  summaryImageUri && styles.countPillOnImage,
                  { flexDirection: rowDirection },
                ]}
              >
                <View
                  style={[
                    styles.countPillDot,
                    summaryImageUri && styles.countPillDotOnImage,
                  ]}
                />
                <Text
                  style={[
                    styles.countPillText,
                    summaryImageUri && styles.summaryTextOnImage,
                  ]}
                >
                  {filteredExpenses.length} {t.manage.expensesCount}
                </Text>
              </View>
            </View>
            {summaryImageUri && selectedVacation?.summaryImagePhotographerName ? (
              <View style={[styles.photoAttribution, { flexDirection: rowDirection }]}>
                <Text style={styles.photoAttributionText}>Photo by </Text>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    if (selectedVacation.summaryImagePhotographerUrl) {
                      Linking.openURL(selectedVacation.summaryImagePhotographerUrl);
                    }
                  }}
                >
                  <Text style={styles.photoAttributionLink}>
                    {selectedVacation.summaryImagePhotographerName}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.photoAttributionText}> on </Text>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    if (selectedVacation.summaryImageUnsplashUrl) {
                      Linking.openURL(selectedVacation.summaryImageUnsplashUrl);
                    }
                  }}
                >
                  <Text style={styles.photoAttributionLink}>Unsplash</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity
              style={[
                styles.summaryEditHandle,
                summaryImageUri && styles.summaryEditHandleOnImage,
              ]}
              onPress={() => {
                if (selectedVacation) openVacationForm(selectedVacation.id);
              }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t.vacations.editTitle}
            >
              <Ionicons
                name="chevron-down"
                size={18}
                color={summaryImageUri ? '#fff' : PAGE_ACCENT}
              />
            </TouchableOpacity>
          </LinearGradient>
          <TouchableOpacity
            style={[
              styles.summarySettingsButton,
              summaryImageUri && styles.summarySettingsButtonOnImage,
              { left: isRTL ? 14 : undefined, right: isRTL ? undefined : 14 },
            ]}
            onPress={() => (navigation as any).navigate('Settings')}
            activeOpacity={0.7}
            accessibilityLabel={t.settings.title}
            accessibilityRole="button"
          >
            <Ionicons
              name="settings-outline"
              size={17}
              color={summaryImageUri ? '#fff' : '#52525B'}
            />
          </TouchableOpacity>
          </View>
        </View>

      </View>

      <View style={styles.expensesArea}>
      {filteredExpenses.length === 0 ? (
        <View
          style={[
            styles.empty,
            { paddingBottom: Math.max(insets.bottom, 12) + 66 },
          ]}
        >
          <View style={styles.emptyIconTile}>
            <Ionicons name="receipt-outline" size={48} color={PAGE_ACCENT} />
          </View>
          <Text style={styles.emptyText}>{t.manage.emptyTitle}</Text>
          <Text style={styles.emptySubtext}>{t.manage.emptySubtitle}</Text>
        </View>
      ) : (
        <SectionList
          style={styles.expensesList}
          sections={displaySections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => {
            // section.data may have been emptied for display while collapsed;
            // look totals up from the full (un-collapsed) section for the header.
            const fullSection = sections.find((s) => s.key === section.key) ?? section;
            const collapsed = isSectionCollapsed(section.key, section.title);
            // Grouped by collaborator: show that person's own share of the
            // trip, not the full amount of every expense they happened to be
            // part of — companionConvertedTotal mirrors that for the
            // lead-currency conversion the same way convertedTotal does for
            // every other grouping.
            const sectionTotals =
              groupBy === 'collaborators' && fullSection.shareTotals
                ? fullSection.shareTotals
                : fullSection.totals;
            const sectionLeadTotal = leadCurrency
              ? groupBy === 'collaborators'
                ? companionConvertedTotal(fullSection.data, section.key, convert)
                : convertedTotal(fullSection.data, convert)
              : null;
            return (
              <TouchableOpacity
                style={[styles.sectionHeader, { flexDirection: rowDirection }]}
                onPress={() => toggleSection(section.key, section.title)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${section.title}, ${formatTotalsWithLead(sectionTotals, leadCurrency, sectionLeadTotal, selectedVacation?.defaultCurrency)}`}
                accessibilityState={{ expanded: !collapsed }}
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
                    sectionTotals,
                    leadCurrency,
                    sectionLeadTotal,
                    selectedVacation?.defaultCurrency
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
          renderItem={({ item, section }) => {
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
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`${descriptionText}, ${method ?? ''}, ${formatAmount(item.amount, item.currencyCode)}${splitLabel ? `, ${splitLabel}` : ''}`}
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
                  <Text style={[styles.rowDescription, { textAlign }]}>
                    {descriptionText}
                  </Text>
                  <Text style={[styles.rowMethod, { textAlign }]}>
                    {method ?? ''}
                  </Text>
                  {splitLabel && (
                    <Text style={[styles.rowSplit, { textAlign }]}>
                      {splitLabel}
                    </Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>
                    {groupBy === 'collaborators' && item.split.length > 0
                      ? `${formatAmount(
                          companionShare(item, section.key),
                          item.currencyCode
                        )} ${t.manage.of} ${formatAmount(item.amount, item.currencyCode)}`
                      : formatAmount(item.amount, item.currencyCode)}
                  </Text>
                  {leadCurrency && leadCurrency !== item.currencyCode && (() => {
                    const converted = convert(item.amount, item.currencyCode);
                    return converted !== null ? (
                      <Text style={styles.rowConverted}>
                        ≈ {formatAmount(converted, leadCurrency)}
                      </Text>
                    ) : null;
                  })()}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
      </View>

      <TouchableOpacity
        style={[
          styles.floatingAddButton,
          { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 12 },
          !canAdd && styles.addButtonDisabled,
        ]}
        onPress={() => {
          if (canAdd && selectedVacation) {
            (navigation as any).navigate('AddExpense', { vacationId: selectedVacation.id });
          }
        }}
        disabled={!canAdd}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canAdd }}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>{t.add.save}</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  appBackgroundImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  appBackgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
  },
  container: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 18 },
  cardTitleRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 7,
    marginBottom: 14,
  },
  cardTitleName: {
    flex: 1,
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    shadowColor: '#18142D',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  settingsButtonBox: {
    width: 48,
    height: 48,
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
  noVacationsBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  noVacationsBackgroundWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  noVacationsIconAnchor: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalsCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  summaryBackgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  summaryOverlay: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  summaryEditHandle: {
    marginHorizontal: -22,
    marginBottom: -20,
    marginTop: 14,
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(39, 39, 42, 0.20)',
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEditHandleOnImage: {
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(10, 5, 24, 0.18)',
  },
  summarySettingsButton: {
    position: 'absolute',
    top: 14,
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(39, 39, 42, 0.16)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  summarySettingsButtonOnImage: {
    borderColor: 'rgba(255, 255, 255, 0.28)',
    backgroundColor: '#241A38',
  },
  summaryTextOnImage: { color: '#fff' },
  summaryMutedTextOnImage: { color: 'rgba(255, 255, 255, 0.82)' },
  photoAttribution: { alignItems: 'center', justifyContent: 'flex-end', marginTop: 10 },
  photoAttributionText: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 10 },
  photoAttributionLink: {
    color: '#fff',
    fontSize: 10,
    textDecorationLine: 'underline',
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
    backgroundColor: PAGE_ACCENT_SOFT,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexShrink: 0,
  },
  countPillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: PAGE_ACCENT_DARK },
  countPillText: { fontSize: 12, fontWeight: '600', color: PAGE_ACCENT },
  countPillOnImage: { backgroundColor: 'rgba(255, 255, 255, 0.20)' },
  countPillDotOnImage: { backgroundColor: '#fff' },
  floatingAddButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 54,
    backgroundColor: PAGE_ACCENT,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PAGE_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 10,
  },
  addButtonDisabled: { backgroundColor: colors.border },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  expensesArea: { flex: 1, overflow: 'hidden' },
  expensesList: { flex: 1, backgroundColor: 'transparent' },
  listContent: { paddingHorizontal: 20, paddingBottom: 110 },
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
  rowSplit: { fontSize: 12, color: PAGE_ACCENT, marginTop: 2, fontWeight: '600' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowConverted: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  emptyIconTile: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: PAGE_ACCENT_SOFT,
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
    backgroundColor: PAGE_ACCENT,
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
    backgroundColor: PAGE_ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: PAGE_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 24,
    shadowColor: PAGE_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  noVacationsButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
