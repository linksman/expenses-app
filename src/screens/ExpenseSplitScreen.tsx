import React, { useMemo, useState } from 'react';
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
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useGroups } from '../storage/GroupsContext';
import { currencyInfo } from '../types/currency';
import { ExpenseSplitShare } from '../types/expense';
import { formatAmount } from '../utils/formatCurrency';
import { setPendingSplit } from '../utils/pendingExpenseSplit';

interface RouteParams {
  groupId: string;
  amount: number;
  currencyCode: string;
  initialSplit?: ExpenseSplitShare[];
}

export default function ExpenseSplitScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId, amount, currencyCode, initialSplit } = (route.params ?? {}) as RouteParams;
  const { t, isRTL } = useLanguage();
  const { groups } = useGroups();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const group = groups.find((g) => g.id === groupId) ?? null;
  const companions = group?.companions ?? [];

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

  const handleSave = () => {
    if (overAllocated) return;
    const split: ExpenseSplitShare[] = companions
      .filter((c) => numericShares[c.id] > 0)
      .map((c) => ({ companionId: c.id, amount: numericShares[c.id] }));
    setPendingSplit(split);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.headerRow, { flexDirection: rowDirection }]}>
        <Text style={styles.headerTitle}>{t.splitScreen.title}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>{t.common.back}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.totalCard}>
            <Text style={[styles.totalLabel, { textAlign }]}>{t.splitScreen.totalLabel}</Text>
            <Text style={styles.totalAmount}>{formatAmount(amount, currencyCode)}</Text>
          </View>

          <View style={[styles.participantRow, { flexDirection: rowDirection }]}>
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
            companions.map((c) => (
              <View key={c.id} style={[styles.participantRow, { flexDirection: rowDirection }]}>
                <Text style={[styles.participantName, { textAlign }]} numberOfLines={1}>
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
                  />
                </View>
              </View>
            ))
          )}

          {overAllocated && (
            <Text style={[styles.overAllocatedText, { textAlign }]}>
              {t.splitScreen.overAllocated}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.saveButton, overAllocated && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={overAllocated}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>{t.splitScreen.save}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  backButton: { alignItems: 'center' },
  backText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  container: { padding: 20, paddingBottom: 20 },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#18142D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 1 },
  totalAmount: { fontSize: 30, fontWeight: '800', color: colors.text, marginTop: 4 },
  participantRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
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
  participantTextBlock: { flex: 1 },
  participantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  autoHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  meAmount: { fontSize: 17, fontWeight: '700', color: colors.text },
  meAmountNegative: { color: colors.danger },
  amountInputWrap: {
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 90,
  },
  currencyPrefix: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  amountInput: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text, padding: 0 },
  emptyText: { fontSize: 14, color: colors.textMuted, marginBottom: 10, lineHeight: 20 },
  overAllocatedText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 54,
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
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
