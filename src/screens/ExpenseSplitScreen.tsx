import React, { useMemo, useRef, useState } from 'react';
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
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { currencyInfo } from '../types/currency';
import { ExpenseSplitShare } from '../types/expense';
import { formatAmount } from '../utils/formatCurrency';
import { setPendingSplit } from '../utils/pendingExpenseSplit';
import { companionAvatarColor } from '../utils/companionAvatar';
import { scrollToFocusedInput } from '../utils/scrollToFocusedInput';

const ME_AVATAR = { color: '#6D28D9', tint: '#F1EAFE' };

interface RouteParams {
  vacationId: string;
  amount: number;
  currencyCode: string;
  initialSplit?: ExpenseSplitShare[];
  isEditing?: boolean;
}

export default function ExpenseSplitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { vacationId, amount, currencyCode, initialSplit, isEditing } = (route.params ??
    {}) as RouteParams;
  const { t, isRTL } = useLanguage();
  const { vacations } = useVacations();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const vacation = vacations.find((v) => v.id === vacationId) ?? null;
  const companions = vacation?.companions ?? [];
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const share of initialSplit ?? []) {
      initial[share.companionId] = share.amount.toString();
    }
    return initial;
  });

  const numericShares = useMemo(() => {
    const result: Record<string, number> = {};
    for (const c of companions) {
      const raw = inputs[c.id];
      const parsed = raw ? parseFloat(raw.replace(',', '.')) : 0;
      result[c.id] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return result;
  }, [inputs, companions]);

  const assignedTotal = useMemo(
    () => Object.values(numericShares).reduce((sum, v) => sum + v, 0),
    [numericShares]
  );
  const meAmount = amount - assignedTotal;
  const overAllocated = assignedTotal > amount + 0.005;

  const commitSplit = (): ExpenseSplitShare[] =>
    companions
      .filter((c) => numericShares[c.id] > 0)
      .map((c) => ({ companionId: c.id, amount: numericShares[c.id] }));

  const handleSave = () => {
    if (overAllocated) return;
    setPendingSplit(commitSplit());
    navigation.goBack();
  };

  // Editing an expense has no separate save step — the split is applied
  // inline as soon as you leave, unless the shares are currently invalid, in
  // which case the change is simply dropped and the last valid split stands.
  const handleBack = () => {
    if (isEditing && !overAllocated) setPendingSplit(commitSplit());
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { textAlign }]} numberOfLines={1}>
          {t.splitScreen.title}
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
          <View style={styles.totalCard}>
            <View style={[styles.totalCardTop, { flexDirection: rowDirection }]}>
              <View>
                <Text style={[styles.totalLabel, { textAlign }]}>{t.splitScreen.totalLabel}</Text>
                <Text style={styles.totalAmount}>{formatAmount(amount, currencyCode)}</Text>
              </View>
              <Text style={styles.assignedLabel}>
                {t.splitScreen.assigned} {formatAmount(assignedTotal, currencyCode)}
              </Text>
            </View>
          </View>

          <View style={[styles.participantRow, { flexDirection: rowDirection }]}>
            <View style={[styles.avatar, { backgroundColor: ME_AVATAR.tint }]}>
              <Text style={[styles.avatarText, { color: ME_AVATAR.color }]}>
                {t.companions.me.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={styles.participantTextBlock}>
              <Text style={[styles.participantName, { textAlign }]}>{t.companions.me}</Text>
              <Text style={[styles.autoHint, { textAlign }]}>{t.splitScreen.autoHint}</Text>
            </View>
            <Text style={[styles.meAmount, overAllocated && styles.meAmountNegative]}>
              {formatAmount(meAmount, currencyCode)}
            </Text>
          </View>

          {companions.length === 0 ? (
            <Text style={[styles.emptyText, { textAlign }]}>{t.splitScreen.emptyCompanions}</Text>
          ) : (
            companions.map((c, index) => {
              const palette = companionAvatarColor(index);
              return (
                <View key={c.id} style={[styles.participantRow, { flexDirection: rowDirection }]}>
                  <View style={[styles.avatar, { backgroundColor: palette.tint }]}>
                    <Text style={[styles.avatarText, { color: palette.color }]}>
                      {c.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.participantName, { textAlign, flex: 1 }]} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <View style={[styles.amountInputWrap, { flexDirection: rowDirection }]}>
                    <Text style={styles.currencyPrefix}>{currencyInfo(currencyCode).symbol}</Text>
                    <TextInput
                      style={[styles.amountInput, { textAlign }]}
                      value={inputs[c.id] ?? ''}
                      onChangeText={(text) => setInputs((prev) => ({ ...prev, [c.id]: text }))}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      onFocus={(e) => scrollToFocusedInput(scrollViewRef, e)}
                    />
                  </View>
                </View>
              );
            })
          )}

          {overAllocated && (
            <View style={styles.overAllocatedBanner}>
              <Ionicons name="alert-circle-outline" size={17} color="#B03A52" />
              <Text style={[styles.overAllocatedText, { textAlign }]}>
                {t.splitScreen.overAllocated}
              </Text>
            </View>
          )}

          {!isEditing && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                { flexDirection: rowDirection },
                overAllocated && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={overAllocated}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={19}
                color={overAllocated ? '#A1A1AA' : '#fff'}
              />
              <Text
                style={[styles.saveButtonText, overAllocated && styles.saveButtonTextDisabled]}
              >
                {t.common.save}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  container: { padding: 20, paddingBottom: 20 },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    gap: 12,
    shadowColor: '#18142D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  totalCardTop: { alignItems: 'flex-end', justifyContent: 'space-between' },
  totalLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  totalAmount: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.4, marginTop: 3 },
  assignedLabel: { fontSize: 12, fontWeight: '600', color: colors.primary, paddingBottom: 3 },
  participantRow: {
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#18142D',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  participantTextBlock: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  autoHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  meAmount: { fontSize: 17, fontWeight: '700', color: colors.text },
  meAmountNegative: { color: colors.danger },
  amountInputWrap: {
    alignItems: 'center',
    gap: 5,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minWidth: 96,
  },
  currencyPrefix: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  amountInput: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, padding: 0 },
  emptyText: { fontSize: 14, color: colors.textMuted, marginBottom: 10, lineHeight: 20 },
  overAllocatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#FDECF0',
    borderWidth: 1,
    borderColor: '#F5CBD5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  overAllocatedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#B03A52',
    lineHeight: 18,
  },
  saveButton: {
    gap: 9,
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  saveButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  saveButtonTextDisabled: { color: '#A1A1AA' },
});
