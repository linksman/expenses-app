import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { LANGUAGES } from '../i18n/languages';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { PaymentMethod } from '../types/paymentMethod';
import { paymentMethodName } from '../utils/paymentMethodName';
import LanguagePickerModal from '../components/LanguagePickerModal';

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
  const { languageCode, t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign }]}>{t.settings.title}</Text>
          <Text style={[styles.subtitle, { textAlign }]}>{t.settings.subtitle}</Text>
        </View>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.language}</Text>
        <TouchableOpacity
          style={[styles.card, styles.row, { flexDirection: rowDirection }]}
          onPress={() => setLanguageModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.rowLabel}>{currentLanguage?.nativeLabel}</Text>
          <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.paymentMethods}</Text>
        <Text style={[styles.sectionHint, { textAlign }]}>{t.settings.paymentMethodsHint}</Text>
        <View style={styles.card}>
          {methods.map((method, index) => {
            const isDefault = method.id === effectiveDefaultMethodId;
            const inUse = methodIdsInUse.has(method.id);
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

                  <Ionicons
                    name={method.icon}
                    size={18}
                    color={method.enabled ? colors.text : colors.textMuted}
                    style={styles.methodRowIcon}
                  />

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
                </View>

                <View style={[styles.methodRowActions, { flexDirection: rowDirection }]}>
                  <TouchableOpacity
                    onPress={() => setDefaultMethodId(method.id)}
                    disabled={!method.enabled || isDefault}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[
                        styles.actionText,
                        (isDefault || !method.enabled) && styles.actionTextMuted,
                      ]}
                    >
                      {isDefault ? t.settings.defaultBadge : t.settings.setAsDefault}
                    </Text>
                  </TouchableOpacity>

                  {inUse ? (
                    <TouchableOpacity
                      onPress={() => setMethodEnabled(method.id, !method.enabled)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.actionText}>
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
          />
          <TouchableOpacity
            style={[styles.addButton, !newMethodName.trim() && styles.addButtonDisabled]}
            onPress={handleAddMethod}
            disabled={!newMethodName.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>{t.paymentMethods.addButton}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionLabel, { textAlign }]}>{t.settings.support}</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.kofiWebWrap}>
            <KofiWebWidget />
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.card, styles.row, styles.kofiButton, { flexDirection: rowDirection }]}
            onPress={() => Linking.openURL(KOFI_URL)}
            activeOpacity={0.85}
          >
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
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text },
  subtitle: { marginTop: 4, fontSize: 15, color: colors.textMuted },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: 16,
    marginHorizontal: 20,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 20, color: colors.textMuted },
  methodRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  methodRowTop: { alignItems: 'center' },
  reorderCol: { marginHorizontal: 4 },
  methodRowIcon: { marginHorizontal: 8 },
  methodRowName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  methodRowNameDisabled: { color: colors.textMuted },
  methodRowActions: {
    alignItems: 'center',
    gap: 20,
    marginTop: 8,
    marginHorizontal: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  actionTextMuted: { color: colors.textMuted },
  deleteActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  addRow: { gap: 10, marginHorizontal: 20, marginTop: 12 },
  addInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButton: {
    backgroundColor: colors.buttonGrey,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: colors.border },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  kofiButton: { backgroundColor: '#8d21f3', justifyContent: 'center' },
  kofiButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  kofiWebWrap: { marginHorizontal: 20 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 39, 51, 0.45)',
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
