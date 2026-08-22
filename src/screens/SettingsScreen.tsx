import React, { useMemo, useState } from 'react';
import {
  AccessibilityInfo,
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
    <SafeAreaView style={styles.safe} edges={['top']} accessibilityLanguage={language.locale}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.title, { textAlign }]} accessibilityRole="header">
            {t.settings.title}
          </Text>
          <Text style={[styles.subtitle, { textAlign }]}>
            {t.settings.subtitle}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.backButton}
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
                      style={styles.reorderButton}
                      onPress={() => {
                        moveMethod(method.id, 'up');
                        AccessibilityInfo.announceForAccessibility(`${paymentMethodName(method, t)}, ${index}`);
                      }}
                      disabled={index === 0}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.common.previous}, ${paymentMethodName(method, t)}`}
                      accessibilityState={{ disabled: index === 0 }}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
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
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.common.next}, ${paymentMethodName(method, t)}`}
                      accessibilityState={{ disabled: index === methods.length - 1 }}
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
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !method.enabled }}
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
                      accessibilityRole="switch"
                      accessibilityState={{ checked: method.enabled }}
                    >
                      <Text style={styles.actionTextSecondary}>
                        {method.enabled ? t.settings.disable : t.settings.enable}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setPendingDeleteMethod(method)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.manage.delete}, ${paymentMethodName(method, t)}`}
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

        <TouchableOpacity
          style={[
            styles.kofiButton,
            {
              flexDirection: rowDirection,
              marginBottom: Math.max(insets.bottom, 12) + 12,
            },
          ]}
          onPress={() => Linking.openURL(KOFI_URL)}
          activeOpacity={0.85}
          accessibilityRole="link"
        >
          <Ionicons name="cafe-outline" size={19} color="#fff" />
          <Text style={styles.kofiButtonText}>{t.settings.buyMeCoffee}</Text>
        </TouchableOpacity>

      </ScrollView>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 0 },
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
    backgroundColor: '#F0F0F1',
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  methodRowTop: { alignItems: 'center', gap: 12 },
  reorderCol: { gap: 2 },
  reorderButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
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
    backgroundColor: '#F0F0F1',
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
  kofiButton: {
    height: 52,
    marginHorizontal: 20,
    marginTop: 24,
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
