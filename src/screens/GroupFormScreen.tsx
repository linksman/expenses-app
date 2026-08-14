import React, { useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useGroups } from '../storage/GroupsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { currencyInfo } from '../types/currency';
import { GROUP_COLORS } from '../types/group';
import CurrencyPickerModal from '../components/CurrencyPickerModal';

interface RouteParams {
  groupId?: string;
}

export default function GroupFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = (route.params ?? {}) as RouteParams;

  const { t, isRTL } = useLanguage();
  const { groups, addGroup, updateGroup, deleteGroup } = useGroups();
  const { deleteExpensesByGroup } = useExpenses();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const group = groupId ? groups.find((g) => g.id === groupId) ?? null : null;
  const isEditing = !!group;

  const [name, setName] = useState(group?.name ?? '');
  const [color, setColor] = useState(group?.color ?? GROUP_COLORS[0]);
  const [defaultCurrency, setDefaultCurrency] = useState(group?.defaultCurrency ?? 'USD');
  const [leadCurrency, setLeadCurrency] = useState<string | null>(group?.leadCurrency ?? null);
  const [defaultCurrencyModalVisible, setDefaultCurrencyModalVisible] = useState(false);
  const [leadCurrencyModalVisible, setLeadCurrencyModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    if (isEditing && group) {
      await updateGroup(group.id, name.trim(), color, defaultCurrency, leadCurrency);
    } else {
      await addGroup(name.trim(), color, defaultCurrency, leadCurrency);
    }
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!group) return;
    await deleteExpensesByGroup(group.id);
    await deleteGroup(group.id);
    setDeleteConfirmVisible(false);
    navigation.goBack();
  };

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
          <Text style={[styles.title, { textAlign }]}>
            {isEditing ? t.groups.editTitle : t.groups.createTitle}
          </Text>

          <TextInput
            style={[styles.nameInput, { textAlign }]}
            value={name}
            onChangeText={setName}
            placeholder={t.groups.namePlaceholder}
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            autoFocus
          />

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.groups.color}</Text>
          <View style={[styles.colorGrid, { flexDirection: rowDirection }]}>
            {GROUP_COLORS.map((c) => {
              const selected = c === color;
              return (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatchWrap, selected && styles.colorSwatchWrapSelected]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: c }]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionLabel, { textAlign }]}>
            {t.groups.defaultCurrency}
          </Text>
          <TouchableOpacity
            style={[styles.row, { flexDirection: rowDirection }]}
            onPress={() => setDefaultCurrencyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>
              {currencyInfo(defaultCurrency).symbol} {defaultCurrency}
            </Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.groups.leadCurrency}</Text>
          <TouchableOpacity
            style={[styles.row, { flexDirection: rowDirection }]}
            onPress={() => setLeadCurrencyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>
              {leadCurrency
                ? `${currencyInfo(leadCurrency).symbol} ${leadCurrency}`
                : t.groups.leadCurrencyNone}
            </Text>
            <Text style={styles.chevron}>{isRTL ? '‹' : '›'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? t.common.save : t.groups.createButton}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteLink}
              onPress={() => setDeleteConfirmVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.deleteLinkText}>{t.groups.deleteLink}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]}>
              {t.groups.deleteConfirmTitle}
            </Text>
            <Text style={[styles.confirmMessage, { textAlign }]}>
              {t.groups.deleteConfirmMessage}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancelButton]}
                onPress={() => setDeleteConfirmVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={handleDelete}
                activeOpacity={0.8}
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
        noneLabel={t.groups.leadCurrencyNone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  backRow: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primaryDark },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 24 },
  nameInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  colorGrid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  colorSwatchWrap: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  colorSwatchWrapSelected: { borderColor: colors.text },
  colorSwatch: { width: '70%', aspectRatio: 1, borderRadius: 999 },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  chevron: { fontSize: 20, color: colors.textMuted },
  saveButton: {
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
  deleteLink: { alignItems: 'center', marginTop: 20, paddingVertical: 4 },
  deleteLinkText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 39, 51, 0.45)',
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
