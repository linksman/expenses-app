import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { useExchangeRates } from '../storage/ExchangeRatesContext';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { currencyInfo } from '../types/currency';
import { TravelCompanion } from '../types/companion';
import { EXPENSE_GROUPINGS } from '../types/expenseGrouping';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import { companionAvatarColor } from '../utils/companionAvatar';
import { scrollNodeIntoViewAboveKeyboard, scrollToFocusedInput } from '../utils/scrollToFocusedInput';
import { findDestinationImage } from '../utils/destinationImage';
import { convertedTotal, formatTotalsWithLead, totalsByCurrencyFor } from '../utils/formatCurrency';
import { convertForVacation } from '../utils/vacationExchangeRate';
import { buildExpensesCsv, buildExpensesHtml, exportCsvFile, exportPdfFile } from '../utils/exportExpenses';

interface RouteParams {
  vacationId?: string;
}

export default function VacationFormScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { vacationId } = (route.params ?? {}) as RouteParams;

  const { t, isRTL, language } = useLanguage();
  const {
    vacations,
    addVacation,
    updateVacation,
    deleteVacation,
    setVacationSummaryImage,
    setVacationFixedExchangeRate,
    setVacationGroupBy,
  } = useVacations();
  const { expenses, deleteExpensesByVacation } = useExpenses();
  const { methods } = usePaymentMethods();
  const { ensureRates, convert: rawConvert } = useExchangeRates();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const vacation = vacationId ? vacations.find((v) => v.id === vacationId) ?? null : null;
  const isEditing = !!vacation;

  const [name, setName] = useState(vacation?.name ?? '');
  const [defaultCurrency, setDefaultCurrency] = useState(vacation?.defaultCurrency ?? 'USD');
  const [leadCurrency, setLeadCurrency] = useState<string | null>(vacation?.leadCurrency ?? null);
  const [rateAuto, setRateAuto] = useState(vacation?.fixedExchangeRate == null);
  const [fixedRateInput, setFixedRateInput] = useState(
    vacation?.fixedExchangeRate != null ? String(vacation.fixedExchangeRate) : ''
  );
  const [companions, setCompanions] = useState<TravelCompanion[]>(vacation?.companions ?? []);
  const [newCompanionName, setNewCompanionName] = useState('');
  const [defaultCurrencyModalVisible, setDefaultCurrencyModalVisible] = useState(false);
  const [leadCurrencyModalVisible, setLeadCurrencyModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const closingRef = useRef(false);
  const [pendingDeleteCompanion, setPendingDeleteCompanion] = useState<TravelCompanion | null>(
    null
  );

  const canSave = name.trim().length > 0;
  const nameInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const companionInputNodeRef = useRef<unknown>(null);
  const [companionInputFocused, setCompanionInputFocused] = useState(false);

  // Adding a companion inserts a row above this input while the keyboard stays
  // open and the field keeps focus, so the one-shot onFocus scroll isn't enough
  // — the newly grown list pushes the field back under the keyboard. Re-measure
  // once the new row has actually laid out.
  useEffect(() => {
    if (!companionInputFocused) return;
    const timer = setTimeout(() => {
      if (companionInputNodeRef.current) {
        scrollNodeIntoViewAboveKeyboard(scrollViewRef, companionInputNodeRef.current);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [companions.length, companionInputFocused]);

  // Reaching this screen via the vacation-picker's "New Vacation" row closes that
  // Modal and navigates in the same tick; the Modal's own close animation is still
  // resigning first-responder when TextInput.autoFocus would fire, so the keyboard
  // never opens (the plain "create your first vacation" entry point has no Modal
  // in the way and works fine with autoFocus). Deferring past the transition fixes it.
  useFocusEffect(
    useCallback(() => {
      if (isEditing) return;
      const timer = setTimeout(() => nameInputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }, [isEditing])
  );

  // Editing a vacation has no separate save step — every field change is
  // persisted immediately, like AddExpenseScreen does for an existing expense.
  // Skip the first run (mount's initial state already matches disk).
  const didMountRef = useRef(false);
  const lastImageLookupNameRef = useRef(vacation?.name ?? '');
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (!isEditing || !vacation || !canSave) return;
    updateVacation(vacation.id, name.trim(), defaultCurrency, leadCurrency, companions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, defaultCurrency, leadCurrency, companions]);

  useEffect(() => {
    if (!isEditing || !vacation) return;
    const trimmed = fixedRateInput.trim();
    const parsed = parseFloat(trimmed.replace(',', '.'));
    const nextRate =
      !rateAuto && trimmed && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    if (nextRate === (vacation.fixedExchangeRate ?? null)) return;
    setVacationFixedExchangeRate(vacation.id, nextRate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rateAuto, fixedRateInput]);

  useEffect(() => {
    if (leadCurrency) ensureRates(leadCurrency);
  }, [leadCurrency, ensureRates]);
  const automaticRate = leadCurrency ? rawConvert(1, defaultCurrency, leadCurrency) : null;

  const imageLookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isEditing || !vacation || !canSave) return;
    const lookupName = name.trim();
    if (lookupName === lastImageLookupNameRef.current) return;
    if (imageLookupTimerRef.current) clearTimeout(imageLookupTimerRef.current);
    const vacationId = vacation.id;
    imageLookupTimerRef.current = setTimeout(async () => {
      lastImageLookupNameRef.current = lookupName;
      const image = await findDestinationImage(lookupName);
      if (lastImageLookupNameRef.current === lookupName) {
        setVacationSummaryImage(vacationId, image);
      }
    }, 900);
    // Deliberately no cleanup-on-unmount: setVacationSummaryImage writes to
    // VacationsContext, which outlives this screen, so closing the sheet
    // right after typing a new name (a very normal flow) shouldn't cancel a
    // lookup that's already in flight — it should just finish in the
    // background instead of silently leaving the old photo in place. The
    // timer is still reset (debounced) on every keystroke while mounted via
    // the manual clearTimeout above.
  }, [name, isEditing, vacation, canSave, setVacationSummaryImage]);

  const companionIdsInUse = useMemo(() => {
    if (!vacation) return new Set<string>();
    const ids = new Set<string>();
    for (const e of expenses) {
      if (e.vacationId !== vacation.id) continue;
      for (const s of e.split) ids.add(s.companionId);
    }
    return ids;
  }, [expenses, vacation]);

  const vacationExpenses = useMemo(
    () => (vacation ? expenses.filter((expense) => expense.vacationId === vacation.id) : []),
    [expenses, vacation]
  );

  const exportTotalsLine = vacation
    ? `${t.manage.tripTotal} ${formatTotalsWithLead(
        totalsByCurrencyFor(vacationExpenses),
        vacation.leadCurrency,
        vacation.leadCurrency
          ? convertedTotal(vacationExpenses, (amount, currencyCode) =>
              convertForVacation(vacation, rawConvert, amount, currencyCode)
            )
          : null,
        vacation.defaultCurrency
      )}`
    : '';

  const exportConvert = (amount: number, currencyCode: string) =>
    vacation ? convertForVacation(vacation, rawConvert, amount, currencyCode) : null;

  const handleExportCsv = async () => {
    if (!vacation || vacationExpenses.length === 0 || exporting) return;
    setExporting(true);
    try {
      const csv = buildExpensesCsv(
        vacationExpenses,
        vacations,
        methods,
        t,
        language.locale,
        { groupBy: vacation.groupBy, vacation, convert: exportConvert },
        exportTotalsLine
      );
      await exportCsvFile(csv, vacation.name);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!vacation || vacationExpenses.length === 0 || exporting) return;
    setExporting(true);
    try {
      const html = buildExpensesHtml(
        vacationExpenses,
        vacations,
        methods,
        t,
        language.locale,
        vacation.name,
        exportTotalsLine,
        isRTL,
        { groupBy: vacation.groupBy, vacation, convert: exportConvert }
      );
      await exportPdfFile(html, vacation.name);
    } finally {
      setExporting(false);
    }
  };

  const handleAddCompanion = () => {
    const trimmed = newCompanionName.trim();
    if (!trimmed) return;
    setCompanions((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: trimmed },
    ]);
    setNewCompanionName('');
    AccessibilityInfo.announceForAccessibility(`${trimmed}, ${t.companions.addButton}`);
  };

  const handleConfirmDeleteCompanion = () => {
    if (pendingDeleteCompanion) {
      setCompanions((prev) => prev.filter((c) => c.id !== pendingDeleteCompanion.id));
    }
    setPendingDeleteCompanion(null);
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const createdVacation = await addVacation(
        name.trim(),
        defaultCurrency,
        leadCurrency,
        companions
      );
      if (createdVacation.summaryImageUrl) {
        try {
          await ExpoImage.prefetch(createdVacation.summaryImageUrl, 'disk');
        } catch {
          // The lookup is complete; let the screen's Image retry the cached URL.
        }
      }
      (navigation as any).popTo('Expenses');
      AccessibilityInfo.announceForAccessibility(t.vacations.createButton);
    } catch {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vacation) return;
    await deleteExpensesByVacation(vacation.id);
    await deleteVacation(vacation.id);
    AccessibilityInfo.announceForAccessibility(t.vacations.deleteLink);
    setDeleteConfirmVisible(false);
    navigation.goBack();
  };

  const handleClose = useCallback(() => {
    if (saving || closingRef.current || !navigation.canGoBack()) return;
    closingRef.current = true;
    navigation.goBack();
  }, [navigation, saving]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
          disabled={saving}
          accessible={false}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <TouchableOpacity
            style={styles.grabberArea}
            onPress={handleClose}
            disabled={saving}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <View style={styles.grabber} />
          </TouchableOpacity>
          <SafeAreaView style={styles.safe} edges={[]} accessibilityLanguage={language.locale}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleClose}
          disabled={saving}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <Text
          style={[styles.title, { textAlign }]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel={`${isEditing ? t.vacations.editTitle : t.vacations.createTitle}, ${t.common.close}`}
        >
          {isEditing ? t.vacations.editTitle : t.vacations.createTitle}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.container, styles.containerWithBottomSave]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.nameCard,
              { flexDirection: rowDirection },
              !name.trim() && styles.nameCardInvalid,
            ]}
          >
            <View style={styles.nameIconBadge}>
              <Ionicons name="pencil" size={16} color="#7C3AED" />
            </View>
            <View style={styles.nameTextBlock}>
              <Text style={[styles.fieldLabel, { textAlign }]}>{t.vacations.nameLabel}</Text>
              <TextInput
                ref={nameInputRef}
                style={[styles.nameInput, { textAlign }]}
                value={name}
                onChangeText={setName}
                placeholder={t.vacations.namePlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
                accessibilityLabel={t.vacations.nameLabel}
                accessibilityState={{ disabled: saving }}
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.vacations.defaultCurrency}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowBorder, { flexDirection: rowDirection }]}
              onPress={() => setDefaultCurrencyModalVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${t.vacations.defaultCurrency}, ${defaultCurrency}`}
            >
              <View style={[styles.currencyIconBadge, { backgroundColor: '#F1EAFE' }]}>
                <Text style={[styles.currencyIconText, { color: '#7C3AED' }]}>
                  {currencyInfo(defaultCurrency).symbol}
                </Text>
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t.vacations.defaultCurrency}</Text>
                <Text style={[styles.rowValue, { textAlign }]}>{defaultCurrency}</Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.border}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.row,
                isEditing && leadCurrency && styles.rowBorder,
                { flexDirection: rowDirection },
              ]}
              onPress={() => setLeadCurrencyModalVisible(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${t.vacations.leadCurrency}, ${leadCurrency ?? t.vacations.leadCurrencyNone}`}
            >
              <View style={[styles.currencyIconBadge, { backgroundColor: '#E7F6F1' }]}>
                <Text style={[styles.currencyIconText, { color: '#159C87' }]}>
                  {leadCurrency ? currencyInfo(leadCurrency).symbol : '—'}
                </Text>
              </View>
              <View style={styles.rowTextBlock}>
                <Text style={[styles.fieldLabel, { textAlign }]}>{t.vacations.leadCurrency}</Text>
                <Text style={[styles.rowValue, { textAlign }]}>
                  {leadCurrency ? leadCurrency : t.vacations.leadCurrencyNone}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={16}
                color={colors.border}
              />
            </TouchableOpacity>

            {isEditing && leadCurrency && (
              <View style={[styles.rateRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.rateEquation, { textAlign }]}>
                  {`1 ${defaultCurrency} =`}
                </Text>
                <TextInput
                  style={[
                    styles.rateInput,
                    { textAlign },
                    !rateAuto && styles.rateInputEditable,
                  ]}
                  value={rateAuto ? (automaticRate !== null ? automaticRate.toFixed(4) : '') : fixedRateInput}
                  onChangeText={setFixedRateInput}
                  editable={!rateAuto}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={`${t.vacations.defaultCurrency} ${t.vacations.leadCurrency}`}
                  accessibilityState={{ disabled: rateAuto }}
                />
                <Text style={styles.rateCurrency}>{leadCurrency}</Text>
                <TouchableOpacity
                  style={[styles.rateAutoToggle, { flexDirection: rowDirection }]}
                  onPress={() => {
                    setRateAuto((wasAuto) => {
                      const nextAuto = !wasAuto;
                      if (!nextAuto && !fixedRateInput && automaticRate !== null) {
                        setFixedRateInput(automaticRate.toFixed(4));
                      }
                      return nextAuto;
                    });
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="checkbox"
                  accessibilityLabel={t.vacations.autoRateLabel}
                  accessibilityState={{ checked: rateAuto }}
                >
                  <View style={[styles.checkbox, rateAuto && styles.checkboxChecked]}>
                    {rateAuto && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.rateAutoLabel}>{t.vacations.autoRateLabel}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {isEditing && vacation && (
            <>
              <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.groupBy}</Text>
              <View style={styles.card}>
                {EXPENSE_GROUPINGS.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionRow,
                      { flexDirection: rowDirection },
                      index < EXPENSE_GROUPINGS.length - 1 && styles.rowBorder,
                    ]}
                    onPress={() => setVacationGroupBy(vacation.id, option)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: vacation.groupBy === option }}
                  >
                    <Text style={[styles.optionLabel, { textAlign }]}>
                      {t.settings.groupByOptions[option]}
                    </Text>
                    <Ionicons
                      name={vacation.groupBy === option ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={vacation.groupBy === option ? colors.primary : colors.textMuted}
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
                    styles.optionRow,
                    styles.rowBorder,
                    { flexDirection: rowDirection },
                    (vacationExpenses.length === 0 || exporting) && styles.optionRowDisabled,
                  ]}
                  onPress={handleExportPdf}
                  disabled={vacationExpenses.length === 0 || exporting}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: vacationExpenses.length === 0 || exporting, busy: exporting }}
                >
                  <Ionicons name="document-outline" size={20} color={colors.primary} />
                  <Text style={[styles.optionLabel, { textAlign }]}>{t.settings.exportToPdf}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionRow,
                    { flexDirection: rowDirection },
                    (vacationExpenses.length === 0 || exporting) && styles.optionRowDisabled,
                  ]}
                  onPress={handleExportCsv}
                  disabled={vacationExpenses.length === 0 || exporting}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: vacationExpenses.length === 0 || exporting, busy: exporting }}
                >
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={[styles.optionLabel, { textAlign }]}>{t.settings.exportToCsv}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.companions.title}</Text>
          <Text style={[styles.sectionHint, { textAlign }]}>{t.companions.hint}</Text>
          {companions.length > 0 && (
            <View style={styles.card}>
              {companions.map((c, index) => {
                const inUse = companionIdsInUse.has(c.id);
                const palette = companionAvatarColor(index);
                return (
                  <View
                    key={c.id}
                    style={[
                      styles.companionRow,
                      { flexDirection: rowDirection },
                      index < companions.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: palette.tint }]}>
                      <Text style={[styles.avatarText, { color: palette.color }]}>
                        {c.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.companionTextBlock}>
                      <Text style={[styles.companionName, { textAlign }]}>
                        {c.name}
                      </Text>
                      {inUse && (
                        <Text style={[styles.companionInUseHint, { textAlign }]} numberOfLines={2}>
                          {t.companions.inUseHint}
                        </Text>
                      )}
                    </View>
                    {!inUse && (
                      <TouchableOpacity
                        onPress={() => setPendingDeleteCompanion(c)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.companionDeleteButton}
                        accessibilityRole="button"
                        accessibilityLabel={`${t.manage.delete}, ${c.name}`}
                      >
                        <Ionicons name="close" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View style={[styles.addRow, { flexDirection: rowDirection }]}>
            <TextInput
              style={[styles.addInput, { textAlign }]}
              value={newCompanionName}
              onChangeText={setNewCompanionName}
              placeholder={t.companions.namePlaceholder}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleAddCompanion}
              onFocus={(e) => {
                companionInputNodeRef.current = e.target;
                setCompanionInputFocused(true);
                scrollToFocusedInput(scrollViewRef, e);
              }}
              onBlur={() => setCompanionInputFocused(false)}
              accessibilityLabel={t.companions.namePlaceholder}
            />
            <TouchableOpacity
              style={[styles.addButton, !newCompanionName.trim() && styles.addButtonDisabled]}
              onPress={handleAddCompanion}
              disabled={!newCompanionName.trim()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ disabled: !newCompanionName.trim() }}
            >
              <Text
                style={[
                  styles.addButtonText,
                  !newCompanionName.trim() && styles.addButtonTextDisabled,
                ]}
              >
                {t.companions.addButton}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <TouchableOpacity
              style={[styles.deleteVacationButton, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}
              onPress={() => setDeleteConfirmVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Text style={styles.deleteLinkText}>{t.vacations.deleteLink}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        {isEditing ? (
          <TouchableOpacity
            style={[
              styles.saveButton,
              { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 8 },
            ]}
            onPress={handleClose}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>{t.common.done}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.saveButton,
              { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 8 },
              !canSave && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave || saving}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave || saving, busy: saving }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>{t.common.save}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
      </View>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay} accessibilityViewIsModal>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]} accessibilityRole="header">
              {t.vacations.deleteConfirmTitle}
            </Text>
            <Text style={[styles.confirmMessage, { textAlign }]}>
              {t.vacations.deleteConfirmMessage}
            </Text>
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

      <Modal
        visible={pendingDeleteCompanion !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteCompanion(null)}
      >
        <View style={styles.confirmOverlay} accessibilityViewIsModal>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]} accessibilityRole="header">
              {t.companions.deleteConfirmTitle}
            </Text>
            {pendingDeleteCompanion && (
              <Text style={[styles.confirmMessage, { textAlign }]}>
                {pendingDeleteCompanion.name}
              </Text>
            )}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setPendingDeleteCompanion(null)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.confirmCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={handleConfirmDeleteCompanion}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.confirmDeleteText}>{t.manage.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CurrencyPickerModal
        visible={defaultCurrencyModalVisible}
        selectedCode={defaultCurrency}
        onSelect={setDefaultCurrency}
        onClose={() => setDefaultCurrencyModalVisible(false)}
      />
      <CurrencyPickerModal
        visible={leadCurrencyModalVisible}
        selectedCode={leadCurrency ?? ''}
        onSelect={(code) => setLeadCurrency(code === '' ? null : code)}
        onClose={() => setLeadCurrencyModalVisible(false)}
        allowNone
        noneLabel={t.vacations.leadCurrencyNone}
      />
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 20, 45, 0.42)' },
  sheet: {
    height: '92%',
    paddingTop: 14,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#18142D',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  grabberArea: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 10 },
  grabber: { width: 46, height: 5, borderRadius: 999, backgroundColor: '#D4D4D8' },
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 24 },
  containerWithBottomSave: { paddingBottom: 104 },
  headerRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F1FE',
    flexShrink: 0,
  },
  deleteVacationButton: { minHeight: 48, justifyContent: 'center', marginTop: 4, marginBottom: 8 },
  deleteLinkText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  nameCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 13,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  nameCardInvalid: { borderColor: '#F1C7D2' },
  nameIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1EAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameTextBlock: { flex: 1, minWidth: 0 },
  fieldLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  nameInput: { fontSize: 16, fontWeight: '600', color: colors.text, padding: 0, marginTop: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 9,
  },
  sectionHint: { fontSize: 13, color: colors.textMuted, marginTop: -5, marginBottom: 9 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  row: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  optionRow: {
    minHeight: 52,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  optionRowDisabled: { opacity: 0.4 },
  rowTextBlock: { flex: 1, minWidth: 0 },
  rowValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 1 },
  rateRow: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rateEquation: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 0 },
  rateCurrency: { fontSize: 14, fontWeight: '600', color: colors.text, flexShrink: 0 },
  rateInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: 0,
  },
  rateInputEditable: { color: colors.text },
  rateAutoToggle: { alignItems: 'center', gap: 6, flexShrink: 0 },
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
  rateAutoLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
  currencyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  currencyIconText: { fontSize: 16, fontWeight: '700' },
  companionRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  companionTextBlock: { flex: 1, minWidth: 0 },
  companionName: { fontSize: 16, fontWeight: '600', color: colors.text },
  companionInUseHint: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  companionDeleteButton: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addRow: { gap: 9, marginBottom: 24 },
  addInput: {
    flex: 1,
    minHeight: 48,
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
  saveButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 56,
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
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 27, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 22,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  confirmMessage: { fontSize: 15, color: colors.textMuted, marginTop: 8 },
  confirmActions: { flexDirection: 'row', marginTop: 22, gap: 10 },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmCancelButton: { backgroundColor: colors.background },
  confirmCancelText: { color: colors.text, fontWeight: '600', fontSize: 15 },
  confirmDeleteButton: { backgroundColor: colors.danger },
  confirmDeleteText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
