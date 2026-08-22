import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Easing,
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

const METHOD_ICON_PALETTE = [
  { color: '#159C87', tint: '#E7F6F1' },
  { color: '#4C9E4C', tint: '#EAF4EA' },
  { color: '#3F3F46', tint: '#F0F0F1' },
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

  const { vacations, activeVacationId, setActiveVacationId } = useVacations();

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
  const [actionSheetMethod, setActionSheetMethod] = useState<PaymentMethod | null>(null);
  const actionSheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (!actionSheetMethod) return;
    actionSheetTranslateY.setValue(Dimensions.get('window').height);
    Animated.timing(actionSheetTranslateY, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [actionSheetMethod, actionSheetTranslateY]);

  const methodIdsInUse = useMemo(
    () => new Set(expenses.map((e) => e.paymentMethodId)),
    [expenses]
  );

  const handleAddMethod = async () => {
    const trimmed = newMethodName.trim();
    if (!trimmed) return;
    await addPaymentMethod(trimmed);
    AccessibilityInfo.announceForAccessibility(`${trimmed}, ${t.paymentMethods.addButton}`);
    setNewMethodName('');
  };

  const handleConfirmDeleteMethod = async () => {
    if (pendingDeleteMethod) await deletePaymentMethod(pendingDeleteMethod.id);
    if (pendingDeleteMethod) AccessibilityInfo.announceForAccessibility(`${paymentMethodName(pendingDeleteMethod, t)}, ${t.manage.delete}`);
    setPendingDeleteMethod(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']} accessibilityLanguage={language.locale}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, { textAlign }]} accessibilityRole="header">
            {t.settings.title}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerIconButton, styles.coffeeHeaderButton]}
          onPress={() => Linking.openURL(KOFI_URL)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="link"
          accessibilityLabel={t.settings.buyMeCoffee}
        >
          <Ionicons name="cafe-outline" size={19} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView
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
                <View
                  key={vacation.id}
                  style={[
                    styles.vacationRow,
                    index < vacations.length - 1 && styles.methodRowBorder,
                  ]}
                >
                  {hasImage && (
                    <>
                      <Image
                        source={{ uri: vacation.summaryImageUrl }}
                        style={StyleSheet.absoluteFillObject}
                        contentFit="cover"
                        cachePolicy="disk"
                        accessible={false}
                      />
                      <LinearGradient
                        colors={['rgba(24, 24, 27, 0.35)', 'rgba(24, 24, 27, 0.72)']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </>
                  )}
                  <TouchableOpacity
                    style={[styles.vacationSelectArea, { flexDirection: rowDirection }]}
                    onPress={() => {
                      if (!selected) setActiveVacationId(vacation.id);
                      navigation.goBack();
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityLabel={vacation.name}
                    accessibilityState={{ selected }}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={21}
                      color={hasImage ? '#fff' : colors.primary}
                    />
                    <Text
                      style={[styles.rowLabel, { textAlign }, hasImage && styles.rowLabelOnImage]}
                    >
                      {vacation.name}
                    </Text>
                  </TouchableOpacity>
                  {selected && (
                    <TouchableOpacity
                      style={[
                        styles.vacationEditButton,
                        hasImage && styles.vacationEditButtonOnImage,
                        isRTL ? styles.vacationEditButtonRTL : styles.vacationEditButtonLTR,
                      ]}
                      onPress={() =>
                        (navigation as any).replace('VacationForm', { vacationId: vacation.id })
                      }
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.vacations.editTitle}, ${vacation.name}`}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={17}
                        color={hasImage ? '#fff' : colors.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.newVacationButton, { flexDirection: rowDirection }]}
          onPress={() => (navigation as any).navigate('VacationForm')}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.newVacationButtonText}>{t.vacations.createNew}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.paymentMethods}</Text>
        <Text style={[styles.sectionHint, { textAlign }]}>{t.settings.paymentMethodsHint}</Text>
        <View style={styles.card}>
          {methods.map((method, index) => {
            const isDefault = method.id === effectiveDefaultMethodId;
            const palette = METHOD_ICON_PALETTE[index % METHOD_ICON_PALETTE.length];
            return (
              <View
                key={method.id}
                style={[
                  styles.methodRow,
                  { flexDirection: rowDirection },
                  index < methods.length - 1 && styles.methodRowBorder,
                ]}
              >
                <View style={styles.reorderCol}>
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => {
                      moveMethod(method.id, 'up');
                      AccessibilityInfo.announceForAccessibility(`${paymentMethodName(method, t)}, ${index}`);
                    }}
                    disabled={index === 0}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.common.previous}, ${paymentMethodName(method, t)}`}
                    accessibilityState={{ disabled: index === 0 }}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={14}
                      color={index === 0 ? colors.border : colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.reorderButton}
                    onPress={() => {
                      moveMethod(method.id, 'down');
                      AccessibilityInfo.announceForAccessibility(`${paymentMethodName(method, t)}, ${index + 2}`);
                    }}
                    disabled={index === methods.length - 1}
                    hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.common.next}, ${paymentMethodName(method, t)}`}
                    accessibilityState={{ disabled: index === methods.length - 1 }}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={14}
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
                    size={16}
                    color={method.enabled ? palette.color : colors.textMuted}
                  />
                </View>

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

                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setActionSheetMethod(method)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.common.moreActions}, ${paymentMethodName(method, t)}`}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                </TouchableOpacity>
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
            accessibilityLabel={t.paymentMethods.addPlaceholder}
          />
          <TouchableOpacity
            style={[styles.addButton, !newMethodName.trim() && styles.addButtonDisabled]}
            onPress={handleAddMethod}
            disabled={!newMethodName.trim()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ disabled: !newMethodName.trim() }}
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
              accessibilityRole="radio"
              accessibilityState={{ selected: languageCode === option.code }}
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

      </ScrollView>

      <TouchableOpacity
        style={[
          styles.floatingDoneButton,
          { flexDirection: rowDirection, bottom: Math.max(insets.bottom, 12) + 4 },
        ]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
        <Text style={styles.floatingDoneButtonText}>{t.common.done}</Text>
      </TouchableOpacity>

      <Modal
        visible={pendingDeleteMethod !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteMethod(null)}
      >
        <View style={styles.modalOverlay} accessibilityViewIsModal>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, { textAlign }]} accessibilityRole="header">
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
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={handleConfirmDeleteMethod}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.modalDeleteText}>{t.manage.delete}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={actionSheetMethod !== null}
        transparent
        animationType="none"
        onRequestClose={() => setActionSheetMethod(null)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setActionSheetMethod(null)}
            accessible={false}
          />
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: actionSheetTranslateY }] }]}
            accessibilityViewIsModal
            accessibilityRole="none"
          >
            <View style={styles.grabberArea} accessible={false}>
              <View style={styles.grabber} />
            </View>
            {actionSheetMethod && (
              <>
                <Text style={[styles.sheetTitle, { textAlign }]} accessibilityRole="header">
                  {paymentMethodName(actionSheetMethod, t)}
                </Text>

                {actionSheetMethod.id !== effectiveDefaultMethodId && (
                  <TouchableOpacity
                    style={[styles.sheetOption, { flexDirection: rowDirection }]}
                    onPress={() => {
                      setDefaultMethodId(actionSheetMethod.id);
                      setActionSheetMethod(null);
                    }}
                    disabled={!actionSheetMethod.enabled}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !actionSheetMethod.enabled }}
                  >
                    <Ionicons
                      name="star-outline"
                      size={19}
                      color={actionSheetMethod.enabled ? colors.primary : colors.border}
                    />
                    <Text
                      style={[
                        styles.sheetOptionText,
                        { textAlign },
                        !actionSheetMethod.enabled && styles.sheetOptionTextMuted,
                      ]}
                    >
                      {t.settings.setAsDefault}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.sheetOption, { flexDirection: rowDirection }]}
                  onPress={() => {
                    setMethodEnabled(actionSheetMethod.id, !actionSheetMethod.enabled);
                    setActionSheetMethod(null);
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: actionSheetMethod.enabled }}
                >
                  <Ionicons
                    name={actionSheetMethod.enabled ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={colors.text}
                  />
                  <Text style={[styles.sheetOptionText, { textAlign }]}>
                    {actionSheetMethod.enabled ? t.settings.disable : t.settings.enable}
                  </Text>
                </TouchableOpacity>

                {!methodIdsInUse.has(actionSheetMethod.id) && (
                  <TouchableOpacity
                    style={[styles.sheetOption, { flexDirection: rowDirection }]}
                    onPress={() => {
                      const method = actionSheetMethod;
                      setActionSheetMethod(null);
                      setPendingDeleteMethod(method);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${t.manage.delete}, ${paymentMethodName(actionSheetMethod, t)}`}
                  >
                    <Ionicons name="trash-outline" size={19} color={colors.danger} />
                    <Text style={[styles.sheetOptionText, styles.sheetOptionTextDanger, { textAlign }]}>
                      {t.manage.delete}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 96 },
  headerRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F1',
    flexShrink: 0,
  },
  coffeeHeaderButton: { backgroundColor: colors.primary },
  headerTextBlock: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
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
    shadowColor: '#18181B',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  vacationsCardInner: { borderRadius: 20, overflow: 'hidden' },
  vacationRow: {
    minHeight: 66,
    justifyContent: 'center',
  },
  vacationSelectArea: {
    minHeight: 66,
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingEnd: 64,
  },
  vacationEditButton: {
    position: 'absolute',
    top: 9,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vacationEditButtonLTR: { right: 8 },
  vacationEditButtonRTL: { left: 8 },
  vacationEditButtonOnImage: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
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
    borderColor: '#D4D4D8',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 52,
  },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  reorderCol: { gap: 0 },
  reorderButton: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center' },
  methodIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  methodIconBadgeDisabled: { opacity: 0.5 },
  methodRowNameLine: { flex: 1, minWidth: 0, alignItems: 'center', gap: 8 },
  methodRowName: { flexShrink: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  methodRowNameDisabled: { color: colors.textMuted },
  defaultPill: {
    backgroundColor: '#F0F0F1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 0,
  },
  defaultPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addRow: { gap: 9, marginHorizontal: 20, marginTop: 12 },
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
  floatingDoneButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 54,
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
  floatingDoneButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
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
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 24, 27, 0.42)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    marginBottom: 4,
    marginTop: -10,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E4E4EA',
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
    marginBottom: 6,
  },
  sheetOption: {
    alignItems: 'center',
    gap: 14,
    minHeight: 52,
    paddingHorizontal: 4,
  },
  sheetOptionText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  sheetOptionTextMuted: { color: colors.border },
  sheetOptionTextDanger: { color: colors.danger },
});
