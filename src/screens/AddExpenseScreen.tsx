import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { CATEGORIES, Category, ExpenseSplitShare } from '../types/expense';
import { currencyInfo } from '../types/currency';
import { DEFAULT_PAYMENT_METHOD_ICON } from '../types/paymentMethod';
import { formatAmount } from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { companionName } from '../utils/companionName';
import { takePendingSplit } from '../utils/pendingExpenseSplit';
import { setPendingNewExpenseHighlight } from '../utils/pendingNewExpenseHighlight';
import { dayLabel } from '../utils/dateLabel';
import { scrollToFocusedInput } from '../utils/scrollToFocusedInput';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import PaymentMethodPickerModal from '../components/PaymentMethodPickerModal';
import DatePickerModal from '../components/DatePickerModal';

interface RouteParams {
  vacationId: string;
  expenseId?: string;
}

const FIELD_ICON_STYLES = {
  description: { color: '#7C3AED', tint: '#F1EAFE' },
  payment: { color: '#159C87', tint: '#E7F6F1' },
  date: { color: '#EA8C3A', tint: '#FFF4E8' },
  split: { color: '#3B82D6', tint: '#E9F1FF' },
};

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vacationId, expenseId } = (route.params ?? {}) as RouteParams;
  const isEditing = !!expenseId;

  const { addExpense, updateExpense, expenses } = useExpenses();
  const { methods, effectiveDefaultMethodId } = usePaymentMethods();
  const { t, isRTL, language } = useLanguage();
  const { vacations, setActiveVacationId } = useVacations();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const vacation = vacations.find((v) => v.id === vacationId) ?? null;
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
    () => existingExpense?.currencyCode ?? vacation?.defaultCurrency ?? 'USD'
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    () => existingExpense?.paymentMethodId ?? ''
  );
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const [split, setSplit] = useState<ExpenseSplitShare[]>(() => existingExpense?.split ?? []);
  const [showSplitLockedHint, setShowSplitLockedHint] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const saveButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const leadCurrency = vacation?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  useEffect(() => {
    if (!paymentMethodId && effectiveDefaultMethodId) {
      setPaymentMethodId(effectiveDefaultMethodId);
    }
  }, [effectiveDefaultMethodId, paymentMethodId]);

  // ExpenseSplitScreen hands its result back through a module-level ref rather
  // than route params: navigating back to this already-mounted route would
  // replace (not merge) its params, wiping the in-progress amount/description
  // the user hasn't saved yet. See utils/pendingExpenseSplit.ts.
  useFocusEffect(
    useCallback(() => {
      const pending = takePendingSplit();
      if (pending) setSplit(pending);
    }, [])
  );

  const convert = (amount: number, fromCode: string) =>
    rawConvert(amount, fromCode, leadCurrency);

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const canSave =
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !!paymentMethodId &&
    !!vacation &&
    description.trim().length > 0;
  const convertedAmount =
    leadCurrency && !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? convert(parsedAmount, currencyCode)
      : null;
  const hasSplit = split.length > 0;

  useEffect(() => {
    if (!hasSplit) setShowSplitLockedHint(false);
  }, [hasSplit]);

  const handleDateSelect = (pickedDay: Date) => {
    const combined = new Date(expenseDate);
    combined.setFullYear(pickedDay.getFullYear(), pickedDay.getMonth(), pickedDay.getDate());
    setExpenseDate(combined);
  };

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
    if (!canSave || !vacation) return;
    const createdAt = expenseDate.toISOString();
    const newExpenseId = await addExpense(
      parsedAmount,
      category,
      description,
      currencyCode,
      paymentMethodId,
      vacation.id,
      createdAt,
      split
    );
    setActiveVacationId(vacation.id);
    setPendingNewExpenseHighlight(newExpenseId);
    navigation.goBack();
  };

  const selectedMethod = methods.find((m) => m.id === paymentMethodId);

  if (!vacation) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  const splitSummary =
    split.length === 0
      ? t.add.splitNotSplit
      : `${t.add.splitWith} ${split
          .map((s) => companionName(s.companionId, vacation.companions, t))
          .join(', ')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (isEditing && vacation) setActiveVacationId(vacation.id);
            navigation.goBack();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign }]} numberOfLines={1}>
          {isEditing ? t.add.editTitle : t.add.title}
        </Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {!isEditing && (
            <TouchableOpacity
              ref={saveButtonRef}
              style={[
                styles.saveButton,
                { flexDirection: rowDirection },
                !canSave && styles.saveButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
              <Text style={styles.saveButtonText}>{t.common.save}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.amountBlock, !amount.trim() && styles.amountBlockInvalid]}
            onPress={() => {
              if (hasSplit) setShowSplitLockedHint(true);
              else amountInputRef.current?.focus();
            }}
            activeOpacity={hasSplit ? 1 : 0.8}
          >
            <View style={[styles.amountRow, { flexDirection: rowDirection }]}>
              <View style={[styles.amountColumn, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <TextInput
                  ref={amountInputRef}
                  style={[styles.amountInput, { textAlign }, hasSplit && styles.amountInputLocked]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  autoFocus={!isEditing}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionInputRef.current?.focus()}
                  blurOnSubmit={false}
                  editable={!hasSplit}
                  onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
                />
                <Text
                  style={[
                    styles.convertedHint,
                    { textAlign },
                    (convertedAmount === null || !leadCurrency) && styles.convertedHintHidden,
                  ]}
                >
                  {convertedAmount !== null && leadCurrency
                    ? `≈ ${formatAmount(convertedAmount, leadCurrency)}`
                    : ' '}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.currencyButton}
                onPress={() => setCurrencyModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.currencySign}>{currencyInfo(currencyCode).symbol}</Text>
                <View style={[styles.currencyCodeRow, { flexDirection: rowDirection }]}>
                  <Text style={styles.currencyCode}>{currencyCode}</Text>
                  <Text style={styles.currencyChevron}>⌄</Text>
                </View>
              </TouchableOpacity>
            </View>
            {showSplitLockedHint && (
              <Text style={[styles.splitLockedHint, { textAlign }]}>{t.add.splitLockedHint}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fieldCard,
              { flexDirection: rowDirection },
              !description.trim() && styles.fieldCardInvalid,
            ]}
            onPress={() => descriptionInputRef.current?.focus()}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.fieldIconBadge,
                isRTL ? styles.fieldIconBadgeRTL : styles.fieldIconBadgeLTR,
                { backgroundColor: FIELD_ICON_STYLES.description.tint },
              ]}
            >
              <Ionicons name="pencil" size={18} color={FIELD_ICON_STYLES.description.color} />
            </View>
            <View style={styles.fieldTextBlock}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t.add.description}</Text>
              <TextInput
                ref={descriptionInputRef}
                style={[styles.fieldValueInput, { textAlign }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t.add.descriptionPlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onSubmitEditing={() => saveButtonRef.current?.focus?.()}
                onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fieldCard, { flexDirection: rowDirection }]}
            onPress={() => setMethodModalVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.fieldIconBadge,
                isRTL ? styles.fieldIconBadgeRTL : styles.fieldIconBadgeLTR,
                { backgroundColor: FIELD_ICON_STYLES.payment.tint },
              ]}
            >
              <Ionicons
                name={selectedMethod?.icon ?? DEFAULT_PAYMENT_METHOD_ICON}
                size={18}
                color={FIELD_ICON_STYLES.payment.color}
              />
            </View>
            <View style={styles.fieldTextBlock}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t.add.paymentMethod}</Text>
              <Text style={[styles.fieldValue, { textAlign }]} numberOfLines={1}>
                {selectedMethod ? paymentMethodName(selectedMethod, t) : t.add.selectMethod}
              </Text>
            </View>
            <Text style={styles.fieldChevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fieldCard, { flexDirection: rowDirection }]}
            onPress={() => setDateModalVisible(true)}
            activeOpacity={0.8}
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
              <Text style={[styles.fieldLabel, { textAlign }]}>{t.add.date}</Text>
              <Text style={[styles.fieldValue, { textAlign }]} numberOfLines={1}>
                {dayLabel(expenseDate.toISOString(), t, language.locale)}
              </Text>
            </View>
            <Text style={styles.fieldChevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fieldCard, { flexDirection: rowDirection }]}
            onPress={() => {
              if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return;
              (navigation as any).navigate('ExpenseSplit', {
                vacationId: vacation.id,
                amount: parsedAmount,
                currencyCode,
                initialSplit: split,
                isEditing,
              });
            }}
            activeOpacity={0.8}
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
              <Text style={[styles.fieldLabel, { textAlign }]}>{t.add.split}</Text>
              <Text style={[styles.fieldValue, { textAlign }]} numberOfLines={1}>
                {splitSummary}
              </Text>
            </View>
            <Text style={styles.fieldChevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.add.category}</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((c) => {
              const selected = c.key === category;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(selected ? null : c.key)}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  activeOpacity={0.8}
                  accessibilityLabel={t.categories[c.key]}
                >
                  <Ionicons name={c.icon} size={21} color={selected ? colors.primary : c.color} />
                  <Text
                    style={[styles.categoryChipLabel, selected && styles.categoryChipLabelSelected]}
                    numberOfLines={1}
                  >
                    {t.categories[c.key]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CurrencyPickerModal
        visible={currencyModalVisible}
        selectedCode={currencyCode}
        onSelect={setCurrencyCode}
        onClose={() => setCurrencyModalVisible(false)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 20 },
  headerRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F1FE',
    flexShrink: 0,
  },
  convertedHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 3,
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 18,
    paddingBottom: 14,
    marginBottom: 24,
    minHeight: 132,
    shadowColor: '#18142D',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  amountBlockInvalid: { borderColor: '#F1C7D2' },
  amountRow: { flex: 1, alignItems: 'stretch', gap: 14 },
  amountColumn: { flex: 1, minWidth: 0, justifyContent: 'center', alignItems: 'flex-start' },
  currencyButton: {
    flexShrink: 0,
    width: 74,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencySign: { fontSize: 20, fontWeight: '800', color: colors.primary, lineHeight: 22 },
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
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  amountInputLocked: {
    color: colors.textMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  fieldCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  fieldCardInvalid: { borderColor: '#F1C7D2' },
  fieldIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fieldIconBadgeLTR: { marginRight: 12 },
  fieldIconBadgeRTL: { marginLeft: 18 },
  fieldTextBlock: { flex: 1 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  fieldValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 1 },
  fieldValueInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
    padding: 0,
  },
  fieldChevron: { fontSize: 20, color: colors.textMuted, marginLeft: 8 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginTop: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#F5F1FE',
    borderColor: '#DDD1FA',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  categoryChipLabelSelected: { color: colors.primaryDark, fontWeight: '700' },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  saveButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
