import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { LANGUAGES } from '../i18n/languages';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { PaymentMethod } from '../types/paymentMethod';
import { paymentMethodName } from '../utils/paymentMethodName';
import LanguagePickerModal from '../components/LanguagePickerModal';
import { scrollNodeIntoViewAboveKeyboard, scrollToFocusedInput } from '../utils/scrollToFocusedInput';

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

// Rendered inside an iframe (not injected into the app's own document) because the
// Ko-fi widget script calls document.write(), which — if run against a document that
// has already finished loading, as ours has — wipes out the entire page.
const KOFI_IFRAME_SRC_DOC = `
<!DOCTYPE html>
<html>
  <head>
    <style>html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; }</style>
  </head>
  <body>
    <script type='text/javascript' src='https://storage.ko-fi.com/cdn/widget/Widget_2.js'></script>
    <script type='text/javascript'>
      kofiwidget2.init('Buy me a Coffee', '#9d5efb', '${KOFI_ID}');
      kofiwidget2.draw();
    </script>
  </body>
</html>
`;

function KofiWebWidget() {
  return React.createElement('iframe', {
    srcDoc: KOFI_IFRAME_SRC_DOC,
    title: 'Ko-fi',
    scrolling: 'no',
    style: { border: 'none', width: 230, height: 62 },
  });
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { languageCode, t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const currentLanguage = LANGUAGES.find((l) => l.code === languageCode);

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
        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.language}</Text>
        <TouchableOpacity
          style={[styles.card, styles.row, { flexDirection: rowDirection }]}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.languageIconBadge]}>
            <Ionicons name="globe-outline" size={19} color="#7C3AED" />
          </View>
          <Text style={[styles.rowLabel, { textAlign }]}>{currentLanguage?.nativeLabel}</Text>
          <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
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

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.support}</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.kofiWebWrap}>
            <KofiWebWidget />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.kofiButton, { flexDirection: rowDirection }]}
            onPress={() => Linking.openURL(KOFI_URL)}
            activeOpacity={0.85}
          >
            <Ionicons name="cafe-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.kofiButtonText}>{t.settings.buyMeCoffee}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <LanguagePickerModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />

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
  scrollContent: { paddingBottom: 32 },
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
  row: {
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  languageIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#F1EAFE',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 20, color: colors.textMuted },
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
    height: 52,
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD1FA',
    backgroundColor: '#F5F1FE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  kofiButtonText: { fontSize: 16, fontWeight: '700', color: colors.primaryDark },
  kofiWebWrap: { marginHorizontal: 20 },
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
