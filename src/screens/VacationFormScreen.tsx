import React, { useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { currencyInfo } from '../types/currency';
import { TravelCompanion } from '../types/companion';
import CurrencyPickerModal from '../components/CurrencyPickerModal';
import { companionAvatarColor } from '../utils/companionAvatar';

interface RouteParams {
  vacationId?: string;
}

export default function VacationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vacationId } = (route.params ?? {}) as RouteParams;

  const { t, isRTL } = useLanguage();
  const { vacations, addVacation, updateVacation, deleteVacation } = useVacations();
  const { expenses, deleteExpensesByVacation } = useExpenses();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const vacation = vacationId ? vacations.find((v) => v.id === vacationId) ?? null : null;
  const isEditing = !!vacation;

  const [name, setName] = useState(vacation?.name ?? '');
  const [defaultCurrency, setDefaultCurrency] = useState(vacation?.defaultCurrency ?? 'USD');
  const [leadCurrency, setLeadCurrency] = useState<string | null>(vacation?.leadCurrency ?? null);
  const [companions, setCompanions] = useState<TravelCompanion[]>(vacation?.companions ?? []);
  const [newCompanionName, setNewCompanionName] = useState('');
  const [defaultCurrencyModalVisible, setDefaultCurrencyModalVisible] = useState(false);
  const [leadCurrencyModalVisible, setLeadCurrencyModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [pendingDeleteCompanion, setPendingDeleteCompanion] = useState<TravelCompanion | null>(
    null
  );

  const canSave = name.trim().length > 0;

  const companionIdsInUse = useMemo(() => {
    if (!vacation) return new Set<string>();
    const ids = new Set<string>();
    for (const e of expenses) {
      if (e.vacationId !== vacation.id) continue;
      for (const s of e.split) ids.add(s.companionId);
    }
    return ids;
  }, [expenses, vacation]);

  const handleAddCompanion = () => {
    const trimmed = newCompanionName.trim();
    if (!trimmed) return;
    setCompanions((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: trimmed },
    ]);
    setNewCompanionName('');
  };

  const handleConfirmDeleteCompanion = () => {
    if (pendingDeleteCompanion) {
      setCompanions((prev) => prev.filter((c) => c.id !== pendingDeleteCompanion.id));
    }
    setPendingDeleteCompanion(null);
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (isEditing && vacation) {
      await updateVacation(vacation.id, name.trim(), defaultCurrency, leadCurrency, companions);
    } else {
      await addVacation(name.trim(), defaultCurrency, leadCurrency, companions);
    }
    navigation.goBack();
  };

  const handleDelete = async () => {
    if (!vacation) return;
    await deleteExpensesByVacation(vacation.id);
    await deleteVacation(vacation.id);
    setDeleteConfirmVisible(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={[styles.backButton, { flexDirection: rowDirection }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={14} color={colors.primary} />
          <Text style={styles.backText}>{t.common.back}</Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity onPress={() => setDeleteConfirmVisible(true)} activeOpacity={0.7}>
            <Text style={styles.deleteLinkText}>{t.vacations.deleteLink}</Text>
          </TouchableOpacity>
        )}
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { textAlign }]}>
            {isEditing ? t.vacations.editTitle : t.vacations.createTitle}
          </Text>

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
                style={[styles.nameInput, { textAlign }]}
                value={name}
                onChangeText={setName}
                placeholder={t.vacations.namePlaceholder}
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                autoFocus
              />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { textAlign }]}>{t.vacations.defaultCurrency}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.row, styles.rowBorder, { flexDirection: rowDirection }]}
              onPress={() => setDefaultCurrencyModalVisible(true)}
              activeOpacity={0.7}
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
              style={[styles.row, { flexDirection: rowDirection }]}
              onPress={() => setLeadCurrencyModalVisible(true)}
              activeOpacity={0.7}
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
          </View>

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
                      <Text style={[styles.companionName, { textAlign }]} numberOfLines={1}>
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
            />
            <TouchableOpacity
              style={[styles.addButton, !newCompanionName.trim() && styles.addButtonDisabled]}
              onPress={handleAddCompanion}
              disabled={!newCompanionName.trim()}
              activeOpacity={0.8}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.saveWrap}>
        <TouchableOpacity
          style={[styles.saveButton, { flexDirection: rowDirection }, !canSave && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {isEditing ? t.common.save : t.vacations.createButton}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]}>
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

      <Modal
        visible={pendingDeleteCompanion !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteCompanion(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={[styles.confirmTitle, { textAlign }]}>
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
              >
                <Text style={styles.confirmCancelText}>{t.manage.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDeleteButton]}
                onPress={handleConfirmDeleteCompanion}
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
        noneLabel={t.vacations.leadCurrencyNone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 24 },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: { alignItems: 'center', gap: 4 },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  deleteLinkText: { fontSize: 13, fontWeight: '600', color: colors.danger },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.3, marginBottom: 16 },
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
  rowTextBlock: { flex: 1, minWidth: 0 },
  rowValue: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 1 },
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
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addRow: { gap: 9, marginBottom: 24 },
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
  saveWrap: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26 },
  saveButton: {
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
    elevation: 3,
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
