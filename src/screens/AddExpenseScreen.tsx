import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { CATEGORIES, Category, ExpenseSplitShare } from '../types/expense';
import { currencyInfo } from '../types/currency';
import { formatAmount } from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { companionName } from '../utils/companionName';
import { setPendingNewExpenseHighlight } from '../utils/pendingNewExpenseHighlight';
import { dayLabel } from '../utils/dateLabel';
import { scrollToFocusedInput } from '../utils/scrollToFocusedInput';
import { companionAvatarColor } from '../utils/companionAvatar';
import { guessCategory } from '../utils/categoryGuess';
import { convertForVacationCurrency } from '../utils/vacationExchangeRate';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import PaymentMethodPickerModal from '../components/PaymentMethodPickerModal';
import DatePickerModal from '../components/DatePickerModal';

interface RouteParams {
  vacationId: string;
  expenseId?: string;
}

const FIELD_ICON_STYLES = {
  description: { color: '#3F3F46', tint: '#F0F0F1' },
  payment: { color: '#159C87', tint: '#E7F6F1' },
  date: { color: '#EA8C3A', tint: '#FFF4E8' },
  split: { color: '#3B82D6', tint: '#E9F1FF' },
};

const ME_AVATAR = { color: '#27272A', tint: '#F0F0F1' };

// Vertical gap kept even between every section of the form (the amount card,
// each field card, the payment-method/category chip rows, ...). Chip rows
// reuse `categoryChip`'s own marginBottom for the gutter between wrapped
// rows, so their section-level margin only needs to make up the difference.
const SECTION_GAP = 14;
const CHIP_ROW_GAP = SECTION_GAP - 12;

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const route = useRoute();
  const { vacationId, expenseId } = (route.params ?? {}) as RouteParams;
  const isEditing = !!expenseId;

  const { addExpense, updateExpense, deleteExpense, setExpenseStatisticsExcluded, expenses } = useExpenses();
  const { methods, effectiveDefaultMethodId } = usePaymentMethods();
  const { t, isRTL, language } = useLanguage();
  const { vacations, setActiveVacationId } = useVacations();
  const { ensureRates, convert: rawConvert, captureSnapshot } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const vacation = vacations.find((v) => v.id === vacationId) ?? null;
  const companions = vacation?.companions ?? [];
  const existingExpense = isEditing ? expenses.find((e) => e.id === expenseId) : undefined;

  const [amount, setAmount] = useState(() =>
    existingExpense ? existingExpense.amount.toString() : ''
  );
  const [category, setCategory] = useState<Category | null>(
    () => existingExpense?.category ?? null
  );
  const [description, setDescription] = useState(() => existingExpense?.description ?? '');
  const [expenseDate, setExpenseDate] = useState(
    () => new Date(existingExpense?.createdAt ?? Date.now())
  );
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [currencyCode, setCurrencyCode] = useState(
    () =>
      existingExpense?.currencyCode ??
      vacation?.currencies.find((c) => c.isDefault)?.code ??
      'USD'
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    () => existingExpense?.paymentMethodId ?? ''
  );
  const [excludedFromStatistics, setExcludedFromStatistics] = useState(
    () => existingExpense?.excludedFromStatistics ?? false
  );
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const [splitExpanded, setSplitExpanded] = useState(false);
  const [splitInputs, setSplitInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (existingExpense?.split ?? []).map((share) => [share.companionId, share.amount.toString()])
    )
  );
  const [showSplitLockedHint, setShowSplitLockedHint] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const saveButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollViewportHeightRef = useRef(0);
  const revealSplitOnLayoutRef = useRef(false);
  const closingRef = useRef(false);
  const submittingRef = useRef(false);
  // Once true, the description-based category guess never runs again for
  // this expense — set the moment the user touches a category chip
  // themselves (whether picking one or toggling it back off), and seeded
  // from whatever an existing expense already has so opening it for editing
  // never silently overwrites an already-set category.
  const categoryManuallySetRef = useRef(!!existingExpense?.category);
  const categoryGuessRequestRef = useRef(0);
  const amountFocusTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Focusing a TextInput the instant the screen mounts often loses the race
  // against the Modal's own slide-in presentation on native, especially iOS —
  // the input can end up reporting itself "focused" without the keyboard
  // ever actually appearing. Retry at a couple of delays and again once the
  // Modal reports itself fully shown, resetting any stale focus first so the
  // retry actually re-triggers the keyboard instead of being a no-op.
  const scheduleAmountFocus = useCallback(() => {
    if (isEditing) return;
    amountFocusTimersRef.current.forEach(clearTimeout);
    amountFocusTimersRef.current = [100, 550].map((delay) =>
      setTimeout(() => {
        const input = amountInputRef.current;
        if (!input) return;
        if (input.isFocused() && (Platform.OS === 'web' || Keyboard.isVisible())) return;
        if (input.isFocused()) input.blur();
        requestAnimationFrame(() => input.focus());
      }, delay)
    );
  }, [isEditing]);

  useEffect(() => {
    scheduleAmountFocus();
    return () => amountFocusTimersRef.current.forEach(clearTimeout);
  }, [scheduleAmountFocus]);

  const leadCurrency = vacation?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  // Warms the snapshot-anchor cache so captureSnapshot() at submit time
  // (see handleSubmit) usually resolves instantly instead of blocking on a
  // fresh network round trip.
  useEffect(() => {
    if (!isEditing) ensureRates('USD');
  }, [isEditing, ensureRates]);

  useEffect(() => {
    if (!paymentMethodId && effectiveDefaultMethodId) {
      setPaymentMethodId(effectiveDefaultMethodId);
    }
  }, [effectiveDefaultMethodId, paymentMethodId]);

  // No rateSnapshot yet since the expense doesn't exist — always resolves via
  // the vacation's current fixed rate (if set for this currency) or the live
  // rate, same as the eventual saved expense would show before any snapshot
  // exists for it.
  const convert = (amount: number, fromCode: string) =>
    vacation
      ? convertForVacationCurrency(vacation, rawConvert, fromCode, undefined, amount)
      : rawConvert(amount, fromCode, leadCurrency);

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const split = useMemo<ExpenseSplitShare[]>(
    () =>
      companions.flatMap((companion) => {
        const parsed = parseFloat((splitInputs[companion.id] ?? '').replace(',', '.'));
        return Number.isFinite(parsed) && parsed > 0
          ? [{ companionId: companion.id, amount: parsed }]
          : [];
      }),
    [splitInputs, companions]
  );
  const assignedTotal = split.reduce((sum, share) => sum + share.amount, 0);
  const meAmount = Number.isFinite(parsedAmount) ? parsedAmount - assignedTotal : 0;
  const overAllocated = Number.isFinite(parsedAmount) && assignedTotal > parsedAmount + 0.005;
  const canSave =
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !!paymentMethodId &&
    !!vacation &&
    !overAllocated;
  const convertedAmount =
    leadCurrency && !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? convert(parsedAmount, currencyCode)
      : null;
  const exchangeRate = leadCurrency ? convert(1, currencyCode) : null;
  const hasSplit = split.length > 0;

  useEffect(() => {
    if (!hasSplit) setShowSplitLockedHint(false);
  }, [hasSplit]);

  const handleDateSelect = (pickedDay: Date) => {
    const combined = new Date(expenseDate);
    combined.setFullYear(pickedDay.getFullYear(), pickedDay.getMonth(), pickedDay.getDate());
    setExpenseDate(combined);
  };

  // Re-guess on every description change, not just on blur/submit, so the
  // category chip updates live as the user types. Debounced so it settles
  // once typing pauses rather than firing a classify call per keystroke —
  // cleared on unmount since, unlike e.g. the vacation image lookup,
  // there's nothing to finish in the background for a closed screen
  // (setCategory is local state, not something persisted elsewhere).
  useEffect(() => {
    if (categoryManuallySetRef.current) return;
    const trimmed = description.trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      const requestId = ++categoryGuessRequestRef.current;
      guessCategory(trimmed).then((guessed) => {
        // Bail if superseded by a newer guess, or the user picked a category
        // manually while this request was still in flight.
        if (categoryGuessRequestRef.current !== requestId || categoryManuallySetRef.current) return;
        setCategory(guessed);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [description]);

  // Editing an existing expense saves every field change immediately — there's
  // no explicit save step, so skip the first run (the mount's initial state is
  // already what's on disk) and only persist once something actually changes.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!isEditing || !expenseId || !canSave) return;
    updateExpense(
      expenseId,
      parsedAmount,
      category,
      description,
      currencyCode,
      paymentMethodId,
      expenseDate.toISOString(),
      split
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, category, description, currencyCode, paymentMethodId, expenseDate, split]);

  const handleSubmit = async () => {
    if (!canSave || !vacation || submittingRef.current) return;
    submittingRef.current = true;
    try {
      // The description-blur guess is fire-and-forget for a snappy UI, but
      // its debounce easily loses the race against a save tapped right
      // after typing — the most common flow for a brand-new expense. Await
      // a fresh guess here as a correctness safety net so the saved expense
      // never just misses out on it.
      let finalCategory = category;
      if (!categoryManuallySetRef.current && !finalCategory && description.trim()) {
        finalCategory = await guessCategory(description);
        if (!categoryManuallySetRef.current) setCategory(finalCategory);
      }
      const createdAt = expenseDate.toISOString();
      // Frozen forever once set — never recaptured on a later edit, which is
      // why this only runs on the create path.
      const rateSnapshot = isEditing ? null : await captureSnapshot();
      const newExpenseId = await addExpense(
        parsedAmount,
        finalCategory,
        description,
        currencyCode,
        paymentMethodId,
        vacation.id,
        createdAt,
        split,
        excludedFromStatistics,
        rateSnapshot
      );
      setActiveVacationId(vacation.id);
      setPendingNewExpenseHighlight(newExpenseId);
      AccessibilityInfo.announceForAccessibility(t.add.saved);
      navigation.goBack();
    } finally {
      submittingRef.current = false;
    }
  };

  const selectedMethod = methods.find((m) => m.id === paymentMethodId);
  // The 4th box is always the "more" entry point into the full picker. If the
  // current selection isn't one of the first three quick-pick methods, it
  // bumps the 3rd default one out and takes that spot instead, so the active
  // method stays visible without needing to open the picker.
  const quickMethods = useMemo(() => {
    const base = methods.filter((m) => m.enabled).slice(0, 3);
    if (selectedMethod && !base.some((m) => m.id === selectedMethod.id)) {
      return [...base.slice(0, 2), selectedMethod];
    }
    return base;
  }, [methods, selectedMethod]);

  const handleClose = useCallback(() => {
    if (closingRef.current || !navigation.canGoBack()) return;
    closingRef.current = true;
    if (isEditing && vacation) {
      setActiveVacationId(vacation.id);
      if (expenseId) setPendingNewExpenseHighlight(expenseId);
    }
    navigation.goBack();
  }, [expenseId, isEditing, navigation, setActiveVacationId, vacation]);

  const handleDelete = async () => {
    if (!expenseId) return;
    await deleteExpense(expenseId);
    AccessibilityInfo.announceForAccessibility(t.add.deleteExpense);
    setDeleteConfirmVisible(false);
    if (vacation) setActiveVacationId(vacation.id);
    navigation.goBack();
  };

  useEffect(() => {
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetTranslateY]);

  if (!vacation) {
    return null;
  }

  const payerNames =
    split.length === 0
      ? t.add.splitNotSplit
      : [
          t.companions.me,
          ...split.map((s) => companionName(s.companionId, vacation.companions, t)),
        ].join(', ');

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={handleClose}
      onShow={scheduleAmountFocus}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} accessible={false} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
          accessibilityViewIsModal
          accessibilityLanguage={language.locale}
        >
          <TouchableOpacity style={styles.grabberArea} onPress={handleClose} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t.common.close}>
            <View style={styles.grabber} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={[styles.container, styles.containerWithFloatingSave]}
              keyboardShouldPersistTaps="handled"
              onLayout={(event) => {
                scrollViewportHeightRef.current = event.nativeEvent.layout.height;
              }}
            >
              <TouchableOpacity
                style={styles.amountBlock}
                onPress={() => {
                  if (hasSplit) setShowSplitLockedHint(true);
                  else amountInputRef.current?.focus();
                }}
                activeOpacity={hasSplit ? 1 : 0.8}
                accessible={false}
              >
                <View style={[styles.amountRow, { flexDirection: rowDirection }]}>
                  <View
                    style={[styles.amountColumn, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}
                  >
                    <TextInput
                      ref={amountInputRef}
                      style={[
                        styles.amountInput,
                        { textAlign },
                        hasSplit && styles.amountInputLocked,
                      ]}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      showSoftInputOnFocus
                      returnKeyType="next"
                      onSubmitEditing={() => descriptionInputRef.current?.focus()}
                      blurOnSubmit={false}
                      editable={!hasSplit}
                      onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
                      accessibilityLabel={t.manage.amount}
                      accessibilityState={{ disabled: hasSplit }}
                    />
                    <View
                      style={[
                        styles.convertedHintRow,
                        { flexDirection: rowDirection },
                        (convertedAmount === null || !leadCurrency) && styles.convertedHintHidden,
                      ]}
                    >
                      <Text style={[styles.convertedHint, { textAlign }]}>
                        {convertedAmount !== null && leadCurrency
                          ? `≈ ${formatAmount(convertedAmount, leadCurrency)}`
                          : ' '}
                      </Text>
                      {exchangeRate !== null && leadCurrency && (
                        <Text style={styles.exchangeRateHint}>
                          {`(1 ${currencyCode} = ${exchangeRate.toFixed(4)} ${leadCurrency})`}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.currencyButton}
                    onPress={() => setCurrencyModalVisible(true)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.currency.pickerTitle}, ${currencyCode}`}
                  >
                    <Text style={styles.currencySign}>{currencyInfo(currencyCode).symbol}</Text>
                    <View style={[styles.currencyCodeRow, { flexDirection: rowDirection }]}>
                      <Text style={styles.currencyCode}>{currencyCode}</Text>
                      <Text style={styles.currencyChevron}>⌄</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {showSplitLockedHint && (
                  <Text style={[styles.splitLockedHint, { textAlign }]}>
                    {t.add.splitLockedHint}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fieldCard,
                  { flexDirection: rowDirection },
                ]}
                onPress={() => descriptionInputRef.current?.focus()}
                activeOpacity={0.8}
                accessible={false}
              >
                <View
                  style={[
                    styles.fieldIconBadge,
                    isRTL ? styles.fieldIconBadgeRTL : styles.fieldIconBadgeLTR,
                    { backgroundColor: FIELD_ICON_STYLES.description.tint },
                  ]}
                >
                  <Ionicons name="chatbox-outline" size={18} color={FIELD_ICON_STYLES.description.color} />
                </View>
                <View style={styles.fieldTextBlock}>
                  <TextInput
                    ref={descriptionInputRef}
                    style={[
                      styles.fieldValueInput,
                      styles.fieldValueInputAlone,
                      { textAlign, writingDirection: isRTL ? 'rtl' : 'ltr' },
                    ]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t.add.descriptionPlaceholder}
                    placeholderTextColor={colors.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={() => saveButtonRef.current?.focus?.()}
                    onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
                    accessibilityLabel={t.add.description}
                  />
                </View>
              </TouchableOpacity>

              <View style={[styles.paymentMethodRow, { flexDirection: rowDirection }]}>
                {quickMethods.map((m) => {
                  const selected = m.id === paymentMethodId;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setPaymentMethodId(m.id)}
                      style={[
                        styles.categoryChip,
                        styles.paymentMethodChip,
                        selected && styles.categoryChipSelected,
                      ]}
                      activeOpacity={0.8}
                      accessibilityLabel={paymentMethodName(m, t)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Ionicons
                        name={m.icon}
                        size={21}
                        color={selected ? colors.primary : FIELD_ICON_STYLES.payment.color}
                      />
                      <Text
                        style={[
                          styles.categoryChipLabel,
                          selected && styles.categoryChipLabelSelected,
                        ]}
                      >
                        {paymentMethodName(m, t)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => setMethodModalVisible(true)}
                  style={[styles.categoryChip, styles.paymentMethodChip]}
                  activeOpacity={0.8}
                  accessibilityLabel={t.add.moreMethods}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={21}
                    color={FIELD_ICON_STYLES.payment.color}
                  />
                  <Text style={styles.categoryChipLabel}>
                    {t.add.moreMethods}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.fieldCard, { flexDirection: rowDirection }]}
                onPress={() => setDateModalVisible(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${t.add.date}, ${dayLabel(expenseDate.toISOString(), t, language.locale)}`}
              >
                <View
                  style={[
                    styles.fieldIconBadge,
                    isRTL ? styles.fieldIconBadgeRTL : styles.fieldIconBadgeLTR,
                    { backgroundColor: FIELD_ICON_STYLES.date.tint },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color={FIELD_ICON_STYLES.date.color} />
                </View>
                <View style={styles.fieldTextBlock}>
                  <Text
                    style={[styles.fieldValue, styles.fieldValueAlone, { textAlign }]}
                  >
                    {dayLabel(expenseDate.toISOString(), t, language.locale)}
                  </Text>
                </View>
                <Text style={styles.fieldChevron}>{isRTL ? '‹' : '›'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fieldCard, { flexDirection: rowDirection }]}
                onPress={() => {
                  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
                  setSplitExpanded((expanded) => {
                    revealSplitOnLayoutRef.current = !expanded;
                    return !expanded;
                  });
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${t.add.split}, ${payerNames}`}
                accessibilityState={{ expanded: splitExpanded, disabled: Number.isNaN(parsedAmount) || parsedAmount <= 0 }}
              >
                <View
                  style={[
                    styles.fieldIconBadge,
                    isRTL ? styles.fieldIconBadgeRTL : styles.fieldIconBadgeLTR,
                    { backgroundColor: FIELD_ICON_STYLES.split.tint },
                  ]}
                >
                  <Ionicons name="people-outline" size={18} color={FIELD_ICON_STYLES.split.color} />
                </View>
                <View style={styles.fieldTextBlock}>
                  <Text
                    style={[styles.fieldValue, styles.fieldValueAlone, { textAlign }]}
                  >
                    {payerNames}
                  </Text>
                </View>
                <Ionicons
                  name={splitExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {splitExpanded && (
                <View
                  style={styles.splitEditor}
                  onLayout={(event) => {
                    if (!revealSplitOnLayoutRef.current) return;
                    revealSplitOnLayoutRef.current = false;
                    const { y, height } = event.nativeEvent.layout;
                    const visibleHeight = Math.max(0, scrollViewportHeightRef.current - 92);
                    requestAnimationFrame(() => {
                      scrollViewRef.current?.scrollTo({
                        y: Math.max(0, y + height - visibleHeight + 12),
                        animated: true,
                      });
                    });
                  }}
                >
                  {vacation.companions.length === 0 ? (
                    <Text style={[styles.emptySplitText, { textAlign }]}>
                      {t.splitScreen.emptyCompanions}
                    </Text>
                  ) : (
                    <>
                      <View style={[styles.splitTotalsRow, { flexDirection: rowDirection }]}>
                        <Text style={[styles.splitTotalText, { textAlign }]}>
                          {t.splitScreen.totalLabel} {formatAmount(parsedAmount, currencyCode)}
                        </Text>
                      </View>

                      <View style={[styles.participantRow, { flexDirection: rowDirection }]}>
                        <View style={[styles.avatar, { backgroundColor: ME_AVATAR.tint }]}>
                          <Text style={[styles.avatarText, { color: ME_AVATAR.color }]}>
                            {t.companions.me.slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.participantTextBlock}>
                          <Text style={[styles.participantName, { textAlign }]}>
                            {t.companions.me}
                          </Text>
                          <Text style={[styles.autoHint, { textAlign }]}>
                            {t.splitScreen.autoHint}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.splitAmountInputWrap,
                            styles.splitAmountInputWrapDisabled,
                            { flexDirection: rowDirection },
                          ]}
                        >
                          <Text style={styles.splitCurrencyPrefix}>
                            {currencyInfo(currencyCode).symbol}
                          </Text>
                          <TextInput
                            style={[
                              styles.splitAmountInput,
                              styles.splitAmountInputDisabled,
                              overAllocated && styles.splitAmountInputNegative,
                              { textAlign },
                            ]}
                            value={meAmount.toFixed(2)}
                            editable={false}
                            accessibilityLabel={`${t.companions.me}, ${t.manage.amount}`}
                          />
                        </View>
                      </View>

                      {vacation.companions.map((companion, index) => {
                        const palette = companionAvatarColor(index);
                        return (
                          <View
                            key={companion.id}
                            style={[styles.participantRow, { flexDirection: rowDirection }]}
                          >
                            <View style={[styles.avatar, { backgroundColor: palette.tint }]}>
                              <Text style={[styles.avatarText, { color: palette.color }]}>
                                {companion.name.slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                            <Text
                              style={[styles.participantName, { textAlign, flex: 1 }]}
                            >
                              {companion.name}
                            </Text>
                            <View
                              style={[
                                styles.splitAmountInputWrap,
                                { flexDirection: rowDirection },
                              ]}
                            >
                              <Text style={styles.splitCurrencyPrefix}>
                                {currencyInfo(currencyCode).symbol}
                              </Text>
                              <TextInput
                                style={[styles.splitAmountInput, { textAlign }]}
                                value={splitInputs[companion.id] ?? ''}
                                onChangeText={(text) =>
                                  setSplitInputs((previous) => ({
                                    ...previous,
                                    [companion.id]: text,
                                  }))
                                }
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="decimal-pad"
                                accessibilityLabel={`${companion.name}, ${t.manage.amount}`}
                              />
                            </View>
                          </View>
                        );
                      })}

                      {overAllocated && (
                        <View style={[styles.overAllocatedBanner, { flexDirection: rowDirection }]} accessibilityRole="alert" accessibilityLiveRegion="assertive">
                          <Ionicons name="alert-circle-outline" size={17} color="#B03A52" />
                          <Text style={[styles.overAllocatedText, { textAlign }]}>
                            {t.splitScreen.overAllocated}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              <View style={styles.categoryGrid}>
                {CATEGORIES.map((c) => {
                  const selected = c.key === category;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => {
                        categoryManuallySetRef.current = true;
                        setCategory(selected ? null : c.key);
                      }}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                      activeOpacity={0.8}
                      accessibilityLabel={t.categories[c.key]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: selected }}
                    >
                      <Ionicons name={c.icon} size={21} color={selected ? colors.primary : c.color} />
                      <Text
                        style={[
                          styles.categoryChipLabel,
                          selected && styles.categoryChipLabelSelected,
                        ]}
                      >
                        {t.categories[c.key]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={[styles.expenseActionsRow, { flexDirection: rowDirection }]}>
                <TouchableOpacity
                  style={[styles.statisticsToggleButton, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => {
                    const next = !excludedFromStatistics;
                    setExcludedFromStatistics(next);
                    if (existingExpense) {
                      setExpenseStatisticsExcluded(existingExpense.id, next);
                    }
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: excludedFromStatistics }}
                >
                  <View style={[styles.checkbox, excludedFromStatistics && styles.checkboxChecked]}>
                    {excludedFromStatistics && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.statisticsToggleText}>{t.add.excludeFromStatistics}</Text>
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.deleteExpenseButton}
                    onPress={() => setDeleteConfirmVisible(true)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                  >
                    <Text style={styles.deleteExpenseText}>{t.add.deleteExpense}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
            {isEditing ? (
              <TouchableOpacity
                style={[
                  styles.floatingSaveButton,
                  { flexDirection: rowDirection, bottom: 8 },
                ]}
                onPress={handleClose}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
                <Text style={styles.saveButtonText}>{t.common.done}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                ref={saveButtonRef}
                style={[
                  styles.floatingSaveButton,
                  { flexDirection: rowDirection, bottom: 8 },
                  !canSave && styles.saveButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSave}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ disabled: !canSave }}
              >
                <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
                <Text style={styles.saveButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            )}
          </KeyboardAvoidingView>
          </View>
        </Animated.View>
      </View>

      <CurrencyPickerModal
        visible={currencyModalVisible}
        selectedCode={currencyCode}
        onSelect={setCurrencyCode}
        onClose={() => setCurrencyModalVisible(false)}
        restrictToCodes={vacation?.currencies.map((c) => c.code)}
      />
      <PaymentMethodPickerModal
        visible={methodModalVisible}
        selectedId={paymentMethodId}
        onSelect={setPaymentMethodId}
        onClose={() => setMethodModalVisible(false)}
      />
      <DatePickerModal
        visible={dateModalVisible}
        selectedDate={expenseDate}
        onSelect={handleDateSelect}
        onClose={() => setDateModalVisible(false)}
      />
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay} accessibilityViewIsModal>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]} accessibilityRole="header">
              {t.manage.deleteConfirmTitle}
            </Text>
            {existingExpense && (
              <Text style={[styles.confirmMessage, { textAlign }]}>
                {formatAmount(existingExpense.amount, existingExpense.currencyCode)}
                {existingExpense.description ? ` — ${existingExpense.description}` : ''}
              </Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.confirmCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={handleDelete}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.confirmDeleteText}>{t.manage.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 24, 27, 0.42)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    height: '92%',
    shadowColor: '#18181B',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  grabberArea: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
  },
  grabber: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
  },
  container: { padding: 20, paddingBottom: 20 },
  containerWithFloatingSave: { paddingBottom: 104 },
  convertedHintRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginTop: 3,
    gap: 8,
  },
  convertedHint: {
    fontSize: 13,
    color: colors.textMuted,
  },
  exchangeRateHint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  convertedHintHidden: {
    opacity: 0,
  },
  splitLockedHint: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 10,
  },
  amountBlock: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 14,
    paddingBottom: 12,
    marginBottom: SECTION_GAP,
    minHeight: 112,
    shadowColor: '#18181B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  amountRow: { flex: 1, alignItems: 'stretch', gap: 10 },
  amountColumn: { flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'flex-start' },
  currencyButton: {
    flexShrink: 0,
    width: 64,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencySign: { fontSize: 18, fontWeight: '800', color: colors.primary, lineHeight: 20 },
  currencyCodeRow: { alignItems: 'center', gap: 3 },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  currencyChevron: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  amountInput: {
    width: '100%',
    fontSize: 40,
    fontWeight: '700',
    color: colors.text,
  },
  amountInputLocked: {
    color: colors.textMuted,
  },
  fieldCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: SECTION_GAP,
    shadowColor: '#18181B',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fieldIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldIconBadgeLTR: { marginRight: 10 },
  fieldIconBadgeRTL: { marginLeft: 10 },
  fieldTextBlock: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  fieldValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  fieldValueAlone: { marginTop: 0 },
  fieldValueInput: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
    padding: 0,
  },
  fieldValueInputAlone: { marginTop: 0 },
  fieldChevron: { fontSize: 20, color: colors.textMuted, marginLeft: 8 },
  splitEditor: { marginBottom: SECTION_GAP },
  splitTotalsRow: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  splitTotalText: { width: 100, fontSize: 13, fontWeight: '700', color: colors.text },
  participantRow: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  participantTextBlock: { flex: 1 },
  participantName: { fontSize: 15, fontWeight: '600', color: colors.text },
  autoHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  splitAmountInputWrap: {
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
    width: 100,
  },
  splitAmountInputWrapDisabled: { backgroundColor: colors.divider },
  splitCurrencyPrefix: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  splitAmountInput: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '700', color: colors.text, padding: 0 },
  splitAmountInputDisabled: { color: colors.textMuted },
  splitAmountInputNegative: { color: colors.danger },
  emptySplitText: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: 8 },
  overAllocatedBanner: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDECF0',
    borderWidth: 1,
    borderColor: '#F5CBD5',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  overAllocatedText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#B03A52' },
  paymentMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: CHIP_ROW_GAP,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: -12,
  },
  categoryChip: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 18,
    backgroundColor: colors.card,
    marginBottom: 12,
    paddingHorizontal: 4,
    shadowColor: '#18181B',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  // Category has 8 chips wrapping into 2 rows, where a square aspect ratio
  // keeps the grid tidy. Payment methods are just 4 chips in a single row
  // with no wrapping to line up, so the same square shape only added empty
  // space above/below the icon — this trims it back down to content height.
  paymentMethodChip: {
    aspectRatio: undefined,
    height: 64,
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  categoryChipSelected: {
    backgroundColor: '#F0F0F1',
    borderColor: '#D4D4D8',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  categoryChipLabelSelected: { color: colors.primaryDark, fontWeight: '700' },
  expenseActionsRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deleteExpenseButton: { minHeight: 20, justifyContent: 'center' },
  deleteExpenseText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  statisticsToggleButton: { minHeight: 20, alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  statisticsToggleText: { fontSize: 13, fontWeight: '600', color: colors.text },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmCard: { width: '100%', backgroundColor: colors.card, borderRadius: 20, padding: 22 },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  confirmMessage: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
  confirmActions: { flexDirection: 'row', marginTop: 22, gap: 10 },
  confirmButton: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  confirmCancelButton: { backgroundColor: colors.background },
  confirmCancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  confirmDeleteButton: { backgroundColor: colors.danger },
  confirmDeleteText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  floatingSaveButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    zIndex: 10,
  },
  saveButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
