import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  AccessibilityInfo,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
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
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
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
import { convertForVacationCurrency } from '../utils/vacationExchangeRate';
import { ExpenseSection, groupExpenses } from '../utils/groupExpenses';

const HIGHLIGHT_DURATION_MS = 500;
const HIGHLIGHT_FADE_MS = 500;
const HIGHLIGHT_COLOR = '#E4E4E7';

const PAGE_ACCENT = '#27272A';
const PAGE_ACCENT_DARK = '#18181B';
const PAGE_ACCENT_SOFT = '#F4F4F5';
const TOTALS_CARD_GRADIENT = [PAGE_ACCENT, '#FFFFFF'] as const;
const LOADING_SUMMARY_GRADIENT = ['#D4D4D8', '#F4F4F5'] as const;
const WORLD_CAPITALS_COLLAGE = require('../../assets/world-capitals-collage.png');
const APP_FONT_FAMILY = Platform.select({ ios: 'System', android: 'sans-serif', default: 'system-ui' });
const CHART_COLORS = ['#3B82F6', '#F97316', '#10B981', '#A855F7', '#EAB308', '#EC4899', '#64748B', '#06B6D4'];
type StatisticsGroup = 'category' | 'paymentMethod' | 'collaborators' | 'currency';
type StatisticsPeriod = '7' | '14' | 'all';
const DISTRIBUTION_COLORS: Record<StatisticsGroup, string[]> = {
  category: CHART_COLORS,
  paymentMethod: ['#10B981', '#A855F7', '#EAB308', '#3B82F6', '#EC4899', '#F97316', '#06B6D4', '#64748B'],
  collaborators: ['#EC4899', '#06B6D4', '#F97316', '#64748B', '#A855F7', '#10B981', '#3B82F6', '#EAB308'],
  currency: ['#F97316', '#3B82F6', '#A855F7', '#10B981', '#06B6D4', '#EAB308', '#64748B', '#EC4899'],
};

function pieSlicePath(start: number, end: number, size: number): string {
  const safeEnd = end - start >= Math.PI * 2 ? end - 0.000001 : end;
  const radius = size / 2;
  const point = (angle: number) => ({
    x: radius + radius * Math.cos(angle - Math.PI / 2),
    y: radius + radius * Math.sin(angle - Math.PI / 2),
  });
  const startPoint = point(start);
  const endPoint = point(safeEnd);
  const largeArc = safeEnd - start > Math.PI ? 1 : 0;
  return `M ${radius} ${radius} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y} Z`;
}

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
  const [statisticsVisible, setStatisticsVisible] = useState(false);
  const [statisticsGroup, setStatisticsGroup] = useState<StatisticsGroup>('category');
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>('7');
  const statisticsTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const selectedVacation = vacations.find((v) => v.id === activeVacationId) ?? null;
  const groupBy = selectedVacation?.groupBy ?? 'date';

  useEffect(() => {
    if (!statisticsVisible) return;
    statisticsTranslateY.setValue(Dimensions.get('window').height);
    Animated.timing(statisticsTranslateY, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [statisticsTranslateY, statisticsVisible]);

  // After creating or editing an expense, briefly highlight its row so the user can
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
      highlightAnim.setValue(1);
      Animated.sequence([
        Animated.delay(HIGHLIGHT_DURATION_MS),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: HIGHLIGHT_FADE_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setHighlightedExpenseId(null);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expenses, groupBy, t.add.saved])
  );

  const leadCurrency = selectedVacation?.leadCurrency ?? null;
  const defaultCurrencyCode = selectedVacation?.currencies.find((c) => c.isDefault)?.code ?? 'USD';

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  const convert = (expense: Expense, amount: number) =>
    selectedVacation
      ? convertForVacationCurrency(selectedVacation, rawConvert, expense.currencyCode, expense.rateSnapshot, amount)
      : rawConvert(amount, expense.currencyCode, leadCurrency);

  const filteredExpenses = useMemo(() => {
    const list = expenses.filter((e) => e.vacationId === activeVacationId);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses, activeVacationId]);
  const statisticsExpenses = useMemo(
    () => filteredExpenses.filter((expense) => !expense.excludedFromStatistics),
    [filteredExpenses]
  );

  const totalsByCurrency = useMemo(
    () => totalsByCurrencyFor(filteredExpenses),
    [filteredExpenses]
  );
  const leadTotal = leadCurrency ? convertedTotal(filteredExpenses, convert) : null;
  const statisticsTotalsByCurrency = totalsByCurrencyFor(statisticsExpenses);
  const statisticsLeadTotal = leadCurrency ? convertedTotal(statisticsExpenses, convert) : null;
  const methodName = (id: string): string | null => {
    const method = methods.find((m) => m.id === id);
    return method ? paymentMethodName(method, t) : null;
  };

  const sections: ExpenseSection[] = useMemo(
    () => groupExpenses(filteredExpenses, groupBy, methods, selectedVacation, t, language.locale),
    [filteredExpenses, groupBy, methods, selectedVacation, t, language.locale]
  );

  // All day-groups start collapsed except today's, until the user toggles one.
  // If nothing was spent today, fall back to expanding the most recent date
  // group instead (sections are already newest-first for groupBy === 'date')
  // so the list never opens with every section collapsed.
  // Other grouping modes start expanded so changing the setting reveals the result immediately.
  const hasExpenseToday = sections.some((s) => s.title === t.manage.today);
  const isSectionCollapsed = (key: string, title: string) =>
    collapsedOverrides[`${groupBy}:${key}`] !== undefined
      ? collapsedOverrides[`${groupBy}:${key}`]
      : groupBy === 'date' &&
        title !== t.manage.today &&
        !(!hasExpenseToday && sections[0]?.key === key);
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
    totalsByCurrency.find((t) => t.currencyCode === defaultCurrencyCode) ??
    totalsByCurrency[0] ??
    null;
  const heroMainTotal = heroMainCurrency
    ? formatAmount(heroMainCurrency.amount, heroMainCurrency.currencyCode)
    : formatAmount(0, defaultCurrencyCode);
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
  const statisticsDayCount = statisticsExpenses.length
    ? Math.max(
        1,
        Math.floor(
          (new Date(statisticsExpenses[0].createdAt).setHours(0, 0, 0, 0) -
            new Date(statisticsExpenses[statisticsExpenses.length - 1].createdAt).setHours(0, 0, 0, 0)) /
            86_400_000
        ) + 1
      )
    : 0;
  const dailyAverageTotals = statisticsTotalsByCurrency.map((total) => ({
    ...total,
    amount: total.amount / Math.max(statisticsDayCount, 1),
  }));
  const dailyAverageMain =
    dailyAverageTotals.find((total) => total.currencyCode === defaultCurrencyCode) ??
    dailyAverageTotals[0] ??
    null;
  const dailyAverageMainText = dailyAverageMain
    ? formatAmount(dailyAverageMain.amount, dailyAverageMain.currencyCode)
    : formatAmount(0, defaultCurrencyCode);
  const dailyAverageOtherText = dailyAverageTotals
    .filter((total) => total !== dailyAverageMain)
    .map((total) => formatAmount(total.amount, total.currencyCode))
    .join(' · ');
  const dailyAverageLeadIsRedundant =
    dailyAverageTotals.length === 1 && dailyAverageTotals[0].currencyCode === leadCurrency;
  const dailyAverageLeadText =
    leadCurrency && statisticsLeadTotal !== null && !dailyAverageLeadIsRedundant
      ? `(${formatAmount(statisticsLeadTotal / Math.max(statisticsDayCount, 1), leadCurrency)})`
      : '';
  const dailyChartData = (() => {
    if (!statisticsExpenses.length) return [];
    const latest = new Date(statisticsExpenses[0].createdAt);
    latest.setHours(0, 0, 0, 0);
    const dayCount = statisticsPeriod === 'all'
      ? statisticsDayCount
      : Number(statisticsPeriod);
    const first = new Date(latest);
    first.setDate(first.getDate() - dayCount + 1);
    const values = new Map<string, number>();
    for (const expense of statisticsExpenses) {
      const date = new Date(expense.createdAt);
      date.setHours(0, 0, 0, 0);
      if (date < first || date > latest) continue;
      const amount = leadCurrency ? convert(expense, expense.amount) ?? expense.amount : expense.amount;
      values.set(localDateKey(date.toISOString()), (values.get(localDateKey(date.toISOString())) ?? 0) + amount);
    }
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return {
        date,
        value: values.get(localDateKey(date.toISOString())) ?? 0,
      };
    });
  })();
  const statisticsItems = (() => {
    // Raw per-currency breakdown (for the unconverted text) stays grouped by
    // label the same way as before. The *converted* total can no longer be
    // "sum the raw amounts per currency, then convert the lump" — two
    // expenses sharing a currency can carry different frozen rate snapshots,
    // so each expense/share has to be converted individually and the
    // already-converted amounts summed instead.
    const values = new Map<string, Map<string, number>>();
    const convertedByLabel = new Map<string, number | null>();
    const add = (label: string, amount: number, currencyCode: string) => {
      const currencyValues = values.get(label) ?? new Map<string, number>();
      currencyValues.set(currencyCode, (currencyValues.get(currencyCode) ?? 0) + amount);
      values.set(label, currencyValues);
    };
    const accumulateConverted = (label: string, amount: number, expense: Expense) => {
      if (!leadCurrency || convertedByLabel.get(label) === null) {
        if (!leadCurrency) convertedByLabel.set(label, null);
        return;
      }
      const converted = convert(expense, amount);
      convertedByLabel.set(label, converted === null ? null : (convertedByLabel.get(label) ?? 0) + converted);
    };

    for (const expense of statisticsExpenses) {
      if (statisticsGroup === 'category') {
        const label = expense.category ? t.categories[expense.category] : t.categories.Other;
        add(label, expense.amount, expense.currencyCode);
        accumulateConverted(label, expense.amount, expense);
      } else if (statisticsGroup === 'paymentMethod') {
        const label = methodName(expense.paymentMethodId) ?? expense.paymentMethodId;
        add(label, expense.amount, expense.currencyCode);
        accumulateConverted(label, expense.amount, expense);
      } else if (statisticsGroup === 'currency') {
        add(expense.currencyCode, expense.amount, expense.currencyCode);
        accumulateConverted(expense.currencyCode, expense.amount, expense);
      } else {
        const meAmount = companionShare(expense, ME_COMPANION_ID);
        if (meAmount > 0) {
          add(t.companions.me, meAmount, expense.currencyCode);
          accumulateConverted(t.companions.me, meAmount, expense);
        }
        for (const share of expense.split) {
          const label = companionName(share.companionId, selectedVacation?.companions ?? [], t);
          add(label, share.amount, expense.currencyCode);
          accumulateConverted(label, share.amount, expense);
        }
      }
    }
    return [...values.entries()]
      .map(([label, currencyValues]) => {
        const totals = [...currencyValues.entries()].map(([currencyCode, amount]) => ({ currencyCode, amount }));
        const leadAmount = convertedByLabel.get(label) ?? null;
        const value = leadAmount ?? totals.reduce((sum, total) => sum + total.amount, 0);
        return {
          label,
          value,
          amountLabel: formatTotalsWithLead(
            totals,
            leadCurrency,
            leadAmount,
            selectedVacation?.currencies.find((c) => c.isDefault)?.code ?? 'USD'
          ),
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  })();
  const statisticsTotal = statisticsItems.reduce((sum, item) => sum + item.value, 0);
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
                ? ['rgba(24, 24, 27, 0.30)', 'rgba(24, 24, 27, 0.78)']
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
                  paddingLeft: isRTL ? 98 : 0,
                  paddingRight: isRTL ? 0 : 98,
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
          <TouchableOpacity
            style={[
              styles.summarySettingsButton,
              summaryImageUri && styles.summarySettingsButtonOnImage,
              { left: isRTL ? 70 : undefined, right: isRTL ? undefined : 70 },
            ]}
            onPress={() => setStatisticsVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel={t.manage.statistics}
            accessibilityRole="button"
          >
            <Ionicons
              name="stats-chart-outline"
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
                accessibilityLabel={`${section.title}, ${formatTotalsWithLead(sectionTotals, leadCurrency, sectionLeadTotal, defaultCurrencyCode)}`}
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
                    defaultCurrencyCode
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
                  <View style={[styles.rowMethodLine, { flexDirection: rowDirection }]}>
                    <Text style={[styles.rowMethod, { textAlign }]}>
                      {method ?? ''}
                    </Text>
                    {item.excludedFromStatistics ? (
                      <View style={[styles.rowStatisticsExcluded, { flexDirection: rowDirection }]}>
                        <Ionicons name="stats-chart-outline" size={12} color={colors.textMuted} />
                        <Text style={styles.rowStatisticsExcludedText}>
                          {t.manage.statisticsExcluded}
                        </Text>
                      </View>
                    ) : null}
                  </View>
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
                    const amountToConvert =
                      groupBy === 'collaborators' && item.split.length > 0
                        ? companionShare(item, section.key)
                        : item.amount;
                    const converted = convert(item, amountToConvert);
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

      <View
        pointerEvents="none"
        style={[styles.bottomSystemBarGuard, { height: insets.bottom }]}
      />

      <TouchableOpacity
        style={[
          styles.floatingAddButton,
          { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 4 },
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

      <Modal
        visible={statisticsVisible}
        transparent
        animationType="none"
        onRequestClose={() => setStatisticsVisible(false)}
      >
        <View style={styles.statisticsOverlay}>
          <TouchableOpacity
            style={styles.statisticsBackdrop}
            activeOpacity={1}
            onPress={() => setStatisticsVisible(false)}
            accessible={false}
          />
          <Animated.View
            style={[
              styles.statisticsSheet,
              { transform: [{ translateY: statisticsTranslateY }] },
            ]}
            accessibilityViewIsModal
            accessibilityLanguage={language.locale}
          >
            <TouchableOpacity
              style={styles.statisticsGrabberArea}
              onPress={() => setStatisticsVisible(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
            >
              <View style={styles.statisticsGrabber} />
            </TouchableOpacity>
            <View style={[styles.statisticsHeader, { flexDirection: rowDirection }]}>
              <Text
                style={[styles.statisticsTitle, { textAlign }]}
                accessibilityRole="header"
              >
                {t.manage.statistics}
              </Text>
              <TouchableOpacity
                onPress={() => setStatisticsVisible(false)}
                style={styles.statisticsCloseButton}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.statisticsContent}>
              <View style={styles.statisticsSection}>
                <Text style={[styles.statisticsSectionTitle, { textAlign }]}>
                  {t.manage.dailyAverage}
                </Text>
                <Text style={[styles.statisticsAverageMain, { textAlign }]}>
                  {dailyAverageMainText}
                </Text>
                {dailyAverageOtherText ? (
                  <Text style={[styles.statisticsAverageOther, { textAlign }]}>
                    {dailyAverageOtherText}
                  </Text>
                ) : null}
                {dailyAverageLeadText ? (
                  <Text style={[styles.statisticsAverageLead, { textAlign }]}>
                    {dailyAverageLeadText}
                  </Text>
                ) : null}
                <Text style={[styles.statisticsHint, { textAlign }]}>
                  {statisticsDayCount} {t.manage.days}
                </Text>
                <View style={styles.dailyChartHeader}>
                  <Text style={[styles.dailyChartTitle, { textAlign }]}>
                    {t.manage.expensesOverTime}
                  </Text>
                  <View style={[styles.dailyChartPeriods, { flexDirection: rowDirection }]}>
                    {(['7', '14', 'all'] as StatisticsPeriod[]).map((period) => (
                      <TouchableOpacity
                        key={period}
                        style={[styles.dailyChartPeriod, statisticsPeriod === period && styles.dailyChartPeriodActive]}
                        onPress={() => setStatisticsPeriod(period)}
                      >
                        <Text style={[styles.dailyChartPeriodText, statisticsPeriod === period && styles.dailyChartPeriodTextActive]}>
                          {t.manage.statisticsPeriods[period]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {dailyChartData.length ? (() => {
                  const chartWidth = 320;
                  const chartHeight = 150;
                  const plotTop = 10;
                  const plotBottom = 122;
                  const maxValue = Math.max(...dailyChartData.map((day) => day.value), 1);
                  const slotWidth = chartWidth / dailyChartData.length;
                  const barWidth = Math.max(2, Math.min(24, slotWidth * 0.62));
                  const labelEvery = Math.max(1, Math.ceil(dailyChartData.length / 7));
                  return (
                    <View style={styles.dailyChart}>
                      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        <Line x1="0" y1={plotBottom} x2={chartWidth} y2={plotBottom} stroke="#D4D4D8" strokeWidth="1" />
                        {dailyChartData.map((day, index) => {
                          const height = day.value > 0 ? Math.max(3, (day.value / maxValue) * (plotBottom - plotTop)) : 0;
                          const x = index * slotWidth + (slotWidth - barWidth) / 2;
                          const showLabel = index % labelEvery === 0 || index === dailyChartData.length - 1;
                          return (
                            <React.Fragment key={day.date.toISOString()}>
                              <Rect x={x} y={plotBottom - height} width={barWidth} height={height} rx={Math.min(4, barWidth / 2)} fill="#3B82F6" />
                              {showLabel ? (
                                <SvgText x={x + barWidth / 2} y="141" fontSize="9" fill="#71717A" textAnchor="middle">
                                  {`${day.date.getDate()}/${day.date.getMonth() + 1}`}
                                </SvgText>
                              ) : null}
                            </React.Fragment>
                          );
                        })}
                      </Svg>
                    </View>
                  );
                })() : (
                  <Text style={styles.statisticsEmpty}>{t.manage.noStatistics}</Text>
                )}
              </View>
              <View style={styles.statisticsSection}>
                <Text style={[styles.statisticsSectionTitle, { textAlign }]}>
                  {t.manage.distribution}
                </Text>
                <View style={[styles.statisticsTabs, { flexDirection: rowDirection }]}>
                  {(['category', 'paymentMethod', 'collaborators', 'currency'] as StatisticsGroup[]).map((group) => (
                    <TouchableOpacity
                      key={group}
                      style={[styles.statisticsTab, statisticsGroup === group && styles.statisticsTabActive]}
                      onPress={() => setStatisticsGroup(group)}
                    >
                      <Text style={[styles.statisticsTabText, statisticsGroup === group && styles.statisticsTabTextActive]}>
                        {t.manage.statisticsGroups[group]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {statisticsTotal > 0 ? (
                  <>
                    <View style={styles.pieChart}>
                      <Svg width="100%" height={250} viewBox="0 0 440 260">
                        <G transform="translate(110 20)">
                        {statisticsItems.map((item, index) => {
                          const previous = statisticsItems.slice(0, index).reduce((sum, entry) => sum + entry.value, 0);
                          const start = (previous / statisticsTotal) * Math.PI * 2;
                          const end = ((previous + item.value) / statisticsTotal) * Math.PI * 2;
                          const palette = DISTRIBUTION_COLORS[statisticsGroup];
                          return (
                            <Path key={item.label} d={pieSlicePath(start, end, 220)} fill={palette[index % palette.length]} />
                          );
                        })}
                        </G>
                        {statisticsItems.map((item, index) => {
                          const previous = statisticsItems.slice(0, index).reduce((sum, entry) => sum + entry.value, 0);
                          const start = (previous / statisticsTotal) * Math.PI * 2;
                          const end = ((previous + item.value) / statisticsTotal) * Math.PI * 2;
                          const middle = (start + end) / 2 - Math.PI / 2;
                          const rightSide = Math.cos(middle) >= 0;
                          const edgeX = 220 + Math.cos(middle) * 100;
                          const edgeY = 130 + Math.sin(middle) * 100;
                          const outerX = 220 + Math.cos(middle) * 118;
                          const outerY = 130 + Math.sin(middle) * 118;
                          const lineEndX = rightSide ? 342 : 98;
                          const textX = rightSide ? 348 : 92;
                          const chartLabel = item.label.length > 17
                            ? `${item.label.slice(0, 15)}…`
                            : item.label;
                          const color = DISTRIBUTION_COLORS[statisticsGroup][index % DISTRIBUTION_COLORS[statisticsGroup].length];
                          return (
                            <React.Fragment key={`${item.label}-label`}>
                              <Line x1={edgeX} y1={edgeY} x2={outerX} y2={outerY} stroke={color} strokeWidth="2" />
                              <Line x1={outerX} y1={outerY} x2={lineEndX} y2={outerY} stroke={color} strokeWidth="2" />
                              <SvgText
                                x={textX}
                                y={outerY}
                                fontSize="14"
                                fontFamily={APP_FONT_FAMILY}
                                fontWeight="700"
                                fill="#3F3F46"
                                textAnchor={rightSide ? 'start' : 'end'}
                                alignmentBaseline="middle"
                              >
                                {chartLabel}
                              </SvgText>
                            </React.Fragment>
                          );
                        })}
                      </Svg>
                    </View>
                    <View style={styles.statisticsLegend}>
                      {statisticsItems.map((item, index) => (
                        <View key={item.label} style={[styles.legendRow, { flexDirection: rowDirection }]}>
                          <View style={[styles.legendDot, { backgroundColor: DISTRIBUTION_COLORS[statisticsGroup][index % DISTRIBUTION_COLORS[statisticsGroup].length] }]} />
                          <Text style={[styles.legendLabel, { textAlign }]}>{item.label}</Text>
                          <View style={styles.legendValues}>
                            <Text style={styles.legendPercent}>{((item.value / statisticsTotal) * 100).toFixed(1)}%</Text>
                            <Text style={styles.legendAmount}>{item.amountLabel}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                ) : (
                  <Text style={styles.statisticsEmpty}>{t.manage.noStatistics}</Text>
                )}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.statisticsDoneButton,
                { flexDirection: rowDirection, bottom: 8 },
              ]}
              onPress={() => setStatisticsVisible(false)}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
              <Text style={styles.statisticsDoneButtonText}>{t.common.done}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bottomSystemBarGuard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    zIndex: 9,
  },
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
    shadowColor: '#18181B',
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
    backgroundColor: '#27272A',
  },
  statisticsOverlay: { flex: 1, justifyContent: 'flex-end' },
  statisticsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 24, 27, 0.42)',
  },
  statisticsSheet: {
    height: '92%',
    paddingTop: 14,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#18181B',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  statisticsGrabberArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statisticsGrabber: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
  },
  statisticsHeader: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  statisticsCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F1',
    flexShrink: 0,
  },
  statisticsTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  statisticsContent: { padding: 20, gap: 16, paddingBottom: 110 },
  statisticsSection: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
  statisticsSectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  statisticsAverageMain: { marginTop: 12, fontSize: 32, fontWeight: '800', color: PAGE_ACCENT },
  statisticsAverageOther: { marginTop: 4, fontSize: 20, fontWeight: '700', color: colors.text },
  statisticsAverageLead: { marginTop: 5, fontSize: 14, color: colors.textMuted },
  statisticsHint: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  dailyChartHeader: { marginTop: 24, gap: 12 },
  dailyChartTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  dailyChartPeriods: { gap: 8, flexWrap: 'wrap' },
  dailyChartPeriod: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.background },
  dailyChartPeriodActive: { backgroundColor: PAGE_ACCENT },
  dailyChartPeriodText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  dailyChartPeriodTextActive: { color: '#fff' },
  dailyChart: { marginTop: 12, width: '100%' },
  statisticsTabs: { flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statisticsTab: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.background },
  statisticsTabActive: { backgroundColor: PAGE_ACCENT },
  statisticsTabText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  statisticsTabTextActive: { color: '#fff' },
  pieChart: { alignItems: 'center', marginTop: 24 },
  statisticsLegend: { gap: 12, marginTop: 22 },
  legendRow: { alignItems: 'center', gap: 9 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14, color: colors.text },
  legendPercent: { fontSize: 14, fontWeight: '700', color: colors.text },
  legendValues: { alignItems: 'flex-end', flexShrink: 1 },
  legendAmount: { marginTop: 2, fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  statisticsEmpty: { marginTop: 24, textAlign: 'center', color: colors.textMuted },
  statisticsDoneButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 54,
    borderRadius: 18,
    backgroundColor: PAGE_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: PAGE_ACCENT,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 10,
  },
  statisticsDoneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: '#18181B',
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
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    flexShrink: 0,
  },
  rowMiddle: { flex: 1 },
  rowDescription: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowMethodLine: { alignItems: 'center', gap: 8, marginTop: 1 },
  rowMethod: { fontSize: 13, color: colors.textMuted },
  rowSplit: { fontSize: 12, color: PAGE_ACCENT, marginTop: 2, fontWeight: '600' },
  rowStatisticsExcluded: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F0F0F1',
  },
  rowStatisticsExcludedText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '700', color: colors.text },
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
