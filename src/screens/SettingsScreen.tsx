import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { LANGUAGES } from '../i18n/languages';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { useVacations } from '../storage/VacationsContext';
import { PaymentMethod } from '../types/paymentMethod';
import { paymentMethodName } from '../utils/paymentMethodName';
import { scrollNodeIntoViewAboveKeyboard, scrollToFocusedInput } from '../utils/scrollToFocusedInput';
import { EXPENSE_GROUPINGS, useExpenseGrouping } from '../storage/ExpenseGroupingContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import {
  convertedTotal,
  formatTotalsWithLead,
  totalsByCurrencyFor,
} from '../utils/formatCurrency';
import { convertForVacation } from '../utils/vacationExchangeRate';
import {
  buildExpensesCsv,
  buildExpensesHtml,
  exportCsvFile,
  exportPdfFile,
} from '../utils/exportExpenses';

const METHOD_ICON_PALETTE = [
  { color: '#159C87', tint: '#E7F6F1' },
  { color: '#4C9E4C', tint: '#EAF4EA' },
  { color: '#7C3AED', tint: '#F1EAFE' },
  { color: '#3B82D6', tint: '#E9F1FF' },
  { color: '#EA8C3A', tint: '#FFF4E8' },
  { color: '#DB5C8C', tint: '#FDECF2' },
  { color: '#D9A21B', tint: '#FBF0DA' },
];

const KOFI_ID = 'N7J8252YBS';
const KOFI_URL = `https://ko-fi.com/${KOFI_ID}`;

export default function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { languageCode, language, t, isRTL, setLanguage } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const scrollViewRef = useRef<ScrollView>(null);

  const { vacations, activeVacationId, setActiveVacationId } = useVacations();
  const { groupBy, setGroupBy } = useExpenseGrouping();
  const { ensureRates, convert: rawConvert } = useExchangeRates();

  const {
    methods,
    effectiveDefaultMethodId,
    addPaymentMethod,
    deletePaymentMethod,
    setMethodEnabled,
    moveMethod,
    setDefaultMethodId,
  } = usePaymentMethods();
  const { expenses } = useExpenses();
  const [newMethodName, setNewMethodName] = useState('');
  const [pendingDeleteMethod, setPendingDeleteMethod] = useState<PaymentMethod | null>(null);
  const methodInputNodeRef = useRef<unknown>(null);
  const [methodInputFocused, setMethodInputFocused] = useState(false);
  const [exporting, setExporting] = useState(false);

  const selectedVacation = vacations.find((vacation) => vacation.id === activeVacationId) ?? null;
  const currentExpenses = useMemo(
    () => expenses.filter((expense) => expense.vacationId === activeVacationId),
    [expenses, activeVacationId]
  );
  const leadCurrency = selectedVacation?.leadCurrency ?? null;

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);

  // Adding a method inserts a row above this input while the keyboard stays
  // open and the field keeps focus, so the one-shot onFocus scroll isn't enough
  // — the newly grown list pushes the field back under the keyboard. Re-measure
  // once the new row has actually laid out.
  useEffect(() => {
    if (!methodInputFocused) return;
    const timer = setTimeout(() => {
      if (methodInputNodeRef.current) {
        scrollNodeIntoViewAboveKeyboard(scrollViewRef, methodInputNodeRef.current);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [methods.length, methodInputFocused]);

  const methodIdsInUse = useMemo(
    () => new Set(expenses.map((e) => e.paymentMethodId)),
    [expenses]
  );

  const handleAddMethod = async () => {
    const trimmed = newMethodName.trim();
    if (!trimmed) return;
    await addPaymentMethod(trimmed);
    setNewMethodName('');
  };

  const handleConfirmDeleteMethod = async () => {
    if (pendingDeleteMethod) await deletePaymentMethod(pendingDeleteMethod.id);
    setPendingDeleteMethod(null);
  };

  const exportTitle = selectedVacation?.name ?? '';
  const exportTotalsLine = `${t.manage.tripTotal} ${formatTotalsWithLead(
    totalsByCurrencyFor(currentExpenses),
    leadCurrency,
    leadCurrency && selectedVacation
      ? convertedTotal(currentExpenses, (amount, currencyCode) =>
          convertForVacation(selectedVacation, rawConvert, amount, currencyCode)
        )
      : null,
    selectedVacation?.defaultCurrency
  )}`;

  const handleExportCsv = async () => {
    if (!selectedVacation || currentExpenses.length === 0 || exporting) return;
    setExporting(true);
    try {
      const csv = buildExpensesCsv(currentExpenses, vacations, methods, t, language.locale);
      await exportCsvFile(csv, exportTitle);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedVacation || currentExpenses.length === 0 || exporting) return;
    setExporting(true);
    try {
      const html = buildExpensesHtml(
        currentExpenses,
        vacations,
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, { textAlign }]} numberOfLines={1}>
            {t.settings.title}
          </Text>
          <Text style={[styles.subtitle, { textAlign }]} numberOfLines={1}>
            {t.settings.subtitle}
          </Text>
        </View>
      </View>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.vacations}</Text>
        <View style={styles.card}>
          <View style={styles.vacationsCardInner}>
            {vacations.map((vacation, index) => {
              const selected = vacation.id === activeVacationId;
              const hasImage = !!vacation.summaryImageUrl;
              return (
                <TouchableOpacity
                  key={vacation.id}
                  style={[
                    styles.vacationRow,
                    { flexDirection: rowDirection },
                    index < vacations.length - 1 && styles.methodRowBorder,
                  ]}
                  onPress={() => {
                    if (!selected) setActiveVacationId(vacation.id);
                    navigation.goBack();
                  }}
                  activeOpacity={0.7}
                >
                  {hasImage && (
                    <>
                      <Image
                        source={{ uri: vacation.summaryImageUrl }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        cachePolicy="disk"
                      />
                      <LinearGradient
                        colors={['rgba(20, 12, 40, 0.35)', 'rgba(20, 12, 40, 0.7)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </>
                  )}
                  <View
                    style={[styles.vacationIconBadge, hasImage && styles.vacationIconBadgeOnImage]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={hasImage ? '#fff' : '#7C3AED'}
                    />
                  </View>
                  <Text
                    style={[styles.rowLabel, { textAlign }, hasImage && styles.rowLabelOnImage]}
                    numberOfLines={1}
                  >
                    {vacation.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={19} color={hasImage ? '#fff' : colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.newVacationButton, { flexDirection: rowDirection }]}
          onPress={() => (navigation as any).navigate('VacationForm')}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.newVacationButtonText}>{t.vacations.createNew}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.groupBy}</Text>
        <View style={styles.card}>
          {EXPENSE_GROUPINGS.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.groupingRow,
                { flexDirection: rowDirection },
                index < EXPENSE_GROUPINGS.length - 1 && styles.methodRowBorder,
              ]}
              onPress={() => setGroupBy(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { textAlign }]}>
                {t.settings.groupByOptions[option]}
              </Text>
              <Ionicons
                name={groupBy === option ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={groupBy === option ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { textAlign }]}>
          {t.settings.exportCurrentView}
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[
              styles.exportRow,
              styles.methodRowBorder,
              { flexDirection: rowDirection },
              (currentExpenses.length === 0 || exporting) && styles.exportRowDisabled,
            ]}
            onPress={handleExportPdf}
            disabled={currentExpenses.length === 0 || exporting}
            activeOpacity={0.7}
          >
            <Ionicons name="document-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { textAlign }]}>{t.settings.exportToPdf}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.exportRow,
              { flexDirection: rowDirection },
              (currentExpenses.length === 0 || exporting) && styles.exportRowDisabled,
            ]}
            onPress={handleExportCsv}
            disabled={currentExpenses.length === 0 || exporting}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { textAlign }]}>{t.settings.exportToCsv}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.language}</Text>
        <View style={styles.card}>
          {LANGUAGES.map((option, index) => (
            <TouchableOpacity
              key={option.code}
              style={[
                styles.languageRow,
                { flexDirection: rowDirection },
                index < LANGUAGES.length - 1 && styles.methodRowBorder,
              ]}
              onPress={() => setLanguage(option.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { textAlign }]}>{option.nativeLabel}</Text>
              <Ionicons
                name={languageCode === option.code ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={languageCode === option.code ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.paymentMethods}</Text>
        <Text style={[styles.sectionHint, { textAlign }]}>{t.settings.paymentMethodsHint}</Text>
        <View style={styles.card}>
          {methods.map((method, index) => {
            const isDefault = method.id === effectiveDefaultMethodId;
            const inUse = methodIdsInUse.has(method.id);
            const palette = METHOD_ICON_PALETTE[index % METHOD_ICON_PALETTE.length];
            return (
              <View
                key={method.id}
                style={[
                  styles.methodRow,
                  index < methods.length - 1 && styles.methodRowBorder,
                ]}
              >
                <View style={[styles.methodRowTop, { flexDirection: rowDirection }]}>
                  <View style={styles.reorderCol}>
                    <TouchableOpacity
                      onPress={() => moveMethod(method.id, 'up')}
                      disabled={index === 0}
                      hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={index === 0 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveMethod(method.id, 'down')}
                      disabled={index === methods.length - 1}
                      hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={index === methods.length - 1 ? colors.border : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={[
                      styles.methodIconBadge,
                      { backgroundColor: palette.tint },
                      !method.enabled && styles.methodIconBadgeDisabled,
                    ]}
                  >
                    <Ionicons
                      name={method.icon}
                      size={18}
                      color={method.enabled ? palette.color : colors.textMuted}
                    />
                  </View>

                  <View style={styles.methodRowNameBlock}>
                    <View style={[styles.methodRowNameLine, { flexDirection: rowDirection }]}>
                      <Text
                        style={[
                          styles.methodRowName,
                          { textAlign },
                          !method.enabled && styles.methodRowNameDisabled,
                        ]}
                        numberOfLines={1}
                      >
                        {paymentMethodName(method, t)}
                      </Text>
                      {isDefault && (
                        <View style={styles.defaultPill}>
                          <Text style={styles.defaultPillText}>{t.settings.defaultBadge}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.methodRowActions, { flexDirection: rowDirection }]}>
                  {!isDefault && (
                    <TouchableOpacity
                      onPress={() => setDefaultMethodId(method.id)}
                      disabled={!method.enabled}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.actionTextPrimary,
                          !method.enabled && styles.actionTextMuted,
                        ]}
                      >
                        {t.settings.setAsDefault}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {inUse ? (
                    <TouchableOpacity
                      onPress={() => setMethodEnabled(method.id, !method.enabled)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.actionTextSecondary}>
                        {method.enabled ? t.settings.disable : t.settings.enable}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setPendingDeleteMethod(method)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deleteActionText}>{t.manage.delete}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.addRow, { flexDirection: rowDirection }]}>
          <TextInput
            style={[styles.addInput, { textAlign }]}
            value={newMethodName}
            onChangeText={setNewMethodName}
            placeholder={t.paymentMethods.addPlaceholder}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={handleAddMethod}
            onFocus={(e) => {
              methodInputNodeRef.current = e.target;
              setMethodInputFocused(true);
              scrollToFocusedInput(scrollViewRef, e);
            }}
            onBlur={() => setMethodInputFocused(false)}
          />
          <TouchableOpacity
            style={[styles.addButton, !newMethodName.trim() && styles.addButtonDisabled]}
            onPress={handleAddMethod}
            disabled={!newMethodName.trim()}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.addButtonText,
                !newMethodName.trim() && styles.addButtonTextDisabled,
              ]}
            >
              {t.paymentMethods.addButton}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <TouchableOpacity
        style={[
          styles.kofiButton,
          { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 12 },
        ]}
        onPress={() => Linking.openURL(KOFI_URL)}
        activeOpacity={0.85}
      >
        <Ionicons name="cafe-outline" size={19} color="#fff" />
        <Text style={styles.kofiButtonText}>{t.settings.buyMeCoffee}</Text>
      </TouchableOpacity>

      <Modal
        visible={pendingDeleteMethod !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteMethod(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { textAlign }]}>
              {t.settings.deleteMethodConfirmTitle}
            </Text>
            {pendingDeleteMethod && (
              <Text style={[styles.modalDetail, { textAlign }]}>
                {paymentMethodName(pendingDeleteMethod, t)}
              </Text>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setPendingDeleteMethod(null)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDeleteMethod}
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
  scrollContent: { paddingBottom: 110 },
  headerRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
  headerTextBlock: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, color: colors.textMuted },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 20,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  vacationsCardInner: { borderRadius: 20, overflow: 'hidden' },
  vacationRow: {
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  groupingRow: {
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exportRow: {
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  exportRowDisabled: { opacity: 0.4 },
  vacationIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F1EAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vacationIconBadgeOnImage: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  rowLabelOnImage: { color: '#fff' },
  newVacationButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD1FA',
    borderStyle: 'dashed',
    backgroundColor: '#FBF9FF',
  },
  newVacationButtonText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  languageRow: {
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  methodRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  methodRowTop: { alignItems: 'center', gap: 12 },
  reorderCol: { gap: 2 },
  methodIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodIconBadgeDisabled: { opacity: 0.5 },
  methodRowNameBlock: { flex: 1, minWidth: 0 },
  methodRowNameLine: { alignItems: 'center', gap: 8 },
  methodRowName: { fontSize: 16, fontWeight: '600', color: colors.text },
  methodRowNameDisabled: { color: colors.textMuted },
  defaultPill: {
    backgroundColor: '#F5F1FE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  methodRowActions: {
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  actionTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  actionTextMuted: { color: colors.border },
  deleteActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  addRow: { gap: 9, marginHorizontal: 20, marginTop: 12 },
  addInput: {
    flex: 1,
    height: 46,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    width: 78,
    backgroundColor: colors.primary,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: colors.divider },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  addButtonTextDisabled: { color: '#B4B4BE' },
  kofiButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 10,
  },
  kofiButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
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
  modalDetail: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
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
