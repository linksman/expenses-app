import React, { useEffect, useRef, useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useExpenses } from '../storage/ExpensesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { useGroups } from '../storage/GroupsContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { CATEGORIES, Category } from '../types/expense';
import { currencyInfo } from '../types/currency';
import { DEFAULT_PAYMENT_METHOD_ICON } from '../types/paymentMethod';
import { formatAmount } from '../utils/formatCurrency';
import { paymentMethodName } from '../utils/paymentMethodName';
import { dayLabel } from '../utils/dateLabel';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import PaymentMethodPickerModal from '../components/PaymentMethodPickerModal';
import DatePickerModal from '../components/DatePickerModal';

interface RouteParams {
  groupId: string;
  expenseId?: string;
}

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, expenseId } = (route.params ?? {}) as RouteParams;
  const isEditing = !!expenseId;

  const { addExpense, updateExpense, expenses } = useExpenses();
  const { methods, effectiveDefaultMethodId } = usePaymentMethods();
  const { t, isRTL, language } = useLanguage();
  const { groups, setActiveGroupId } = useGroups();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const group = groups.find((g) => g.id === groupId) ?? null;
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
    () => existingExpense?.currencyCode ?? group?.defaultCurrency ?? 'USD'
  );
  const [paymentMethodId, setPaymentMethodId] = useState(
    () => existingExpense?.paymentMethodId ?? ''
  );
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [methodModalVisible, setMethodModalVisible] = useState(false);
  const descriptionInputRef = useRef<TextInput>(null);
  const saveButtonRef = useRef<React.ElementRef<typeof TouchableOpacity>>(null);

  const leadCurrency = group?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  useEffect(() => {
    if (!paymentMethodId && effectiveDefaultMethodId) {
      setPaymentMethodId(effectiveDefaultMethodId);
    }
  }, [effectiveDefaultMethodId, paymentMethodId]);

  const convert = (amount: number, fromCode: string) =>
    rawConvert(amount, fromCode, leadCurrency);

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const canSave =
    !Number.isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !!paymentMethodId &&
    !!group &&
    description.trim().length > 0;
  const convertedAmount =
    leadCurrency && !Number.isNaN(parsedAmount) && parsedAmount > 0
      ? convert(parsedAmount, currencyCode)
      : null;

  const handleDateSelect = (pickedDay: Date) => {
    setExpenseDate((prev) => {
      const combined = new Date(prev);
      combined.setFullYear(pickedDay.getFullYear(), pickedDay.getMonth(), pickedDay.getDate());
      return combined;
    });
  };

  const handleSubmit = async () => {
    if (!canSave || !group) return;
    const createdAt = expenseDate.toISOString();
    if (isEditing && expenseId) {
      await updateExpense(
        expenseId,
        parsedAmount,
        category,
        description,
        currencyCode,
        paymentMethodId,
        createdAt
      );
    } else {
      await addExpense(
        parsedAmount,
        category,
        description,
        currencyCode,
        paymentMethodId,
        group.id,
        createdAt
      );
    }
    setActiveGroupId(group.id);
    navigation.goBack();
  };

  const selectedMethod = methods.find((m) => m.id === paymentMethodId);

  if (!group) {
    return <SafeAreaView style={styles.safe} edges={['top']} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity
        style={[styles.backRow, { flexDirection: rowDirection }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Text style={styles.backText}>
          {isRTL ? '›' : '‹'} {t.common.back}
        </Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.saveRow, { flexDirection: rowDirection }]}>
            <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
            <TouchableOpacity
              ref={saveButtonRef}
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? t.common.save : t.add.save}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountBlock}>
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setCurrencyModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.currencySign}>{currencyInfo(currencyCode).symbol}</Text>
              <View style={styles.currencyCodeRow}>
                <Text style={styles.currencyCode}>{currencyCode}</Text>
                <Text style={styles.currencyChevron}>⌄</Text>
              </View>
            </TouchableOpacity>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              autoFocus={!isEditing}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => descriptionInputRef.current?.focus()}
              blurOnSubmit={false}
            />
          </View>
          {convertedAmount !== null && leadCurrency && (
            <Text style={[styles.convertedHint, { textAlign: 'center' }]}>
              ≈ {formatAmount(convertedAmount, leadCurrency)}
            </Text>
          )}

          <View style={[styles.inlineRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.inlineLabel, { textAlign }]}>{t.add.description}</Text>
            <TextInput
              ref={descriptionInputRef}
              style={[styles.descriptionInput, styles.inlineField, { textAlign }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t.add.descriptionPlaceholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={() => saveButtonRef.current?.focus?.()}
            />
          </View>

          <View style={[styles.inlineRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.inlineLabel, { textAlign }]}>{t.add.paymentMethod}</Text>
            <TouchableOpacity
              style={[styles.methodButton, styles.inlineField, { flexDirection: rowDirection }]}
              onPress={() => setMethodModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={selectedMethod?.icon ?? DEFAULT_PAYMENT_METHOD_ICON}
                size={20}
                color={colors.text}
                style={styles.methodIcon}
              />
              <Text style={[styles.methodName, { textAlign }]} numberOfLines={1}>
                {selectedMethod ? paymentMethodName(selectedMethod, t) : t.add.selectMethod}
              </Text>
              <Text style={styles.methodChevron}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inlineRow, { flexDirection: rowDirection }]}>
            <Text style={[styles.inlineLabel, { textAlign }]}>{t.add.date}</Text>
            <TouchableOpacity
              style={[styles.dateButton, styles.inlineField, { flexDirection: rowDirection }]}
              onPress={() => setDateModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.text}
                style={styles.dateIcon}
              />
              <Text style={[styles.dateText, { textAlign }]} numberOfLines={1}>
                {dayLabel(expenseDate.toISOString(), t, language.locale)}
              </Text>
              <Text style={styles.methodChevron}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>
          </View>

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
                  <Ionicons name={c.icon} size={26} color={selected ? '#fff' : colors.text} />
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
  container: { padding: 20, paddingBottom: 40 },
  backRow: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primaryDark },
  saveRow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  groupColorDot: { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  convertedHint: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: -16,
    marginBottom: 20,
  },
  amountBlock: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 22,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  currencyButton: {
    position: 'absolute',
    left: 16,
    top: 12,
    bottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencySign: { fontSize: 26, fontWeight: '700', color: colors.primaryDark },
  currencyCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  currencyCode: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  currencyChevron: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: 2,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    minWidth: 140,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  inlineRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 10,
    flexShrink: 0,
  },
  inlineField: { flex: 1, marginBottom: 0 },
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
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.card,
    marginBottom: 12,
  },
  categoryChipSelected: { backgroundColor: colors.text, borderColor: colors.text },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateIcon: { marginRight: 10 },
  dateText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodIcon: { marginRight: 10 },
  methodName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  methodChevron: { fontSize: 20, color: colors.textMuted },
  descriptionInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.buttonGrey,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
