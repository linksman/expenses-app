import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { CURRENCIES } from '../types/currency';
import { VacationCurrency } from '../types/vacation';
import { useLanguage } from '../storage/LanguageContext';

interface Props {
  visible: boolean;
  currencies: VacationCurrency[];
  onChange: (next: VacationCurrency[]) => void;
  onClose: () => void;
  // Currencies at least one expense on this vacation is logged in — these
  // can't be removed from the set, only added to or left alone.
  currencyCodesInUse: Set<string>;
}

// Unlike CurrencyPickerModal (single-select, closes on tap), this sheet stays
// open while the user builds up a set of currencies with one marked default —
// a persistent checkbox-per-row list with a "Done" button, since the
// interaction model doesn't fit the tap-and-close pattern.
export default function VacationCurrenciesPickerModal({
  visible,
  currencies,
  onChange,
  onClose,
  currencyCodesInUse,
}: Props) {
  const { t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const [blockedHint, setBlockedHint] = useState<string | null>(null);
  const blockedHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;
    sheetTranslateY.setValue(Dimensions.get('window').height);
    Animated.timing(sheetTranslateY, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [sheetTranslateY, visible]);

  useEffect(() => {
    return () => {
      if (blockedHintTimerRef.current) clearTimeout(blockedHintTimerRef.current);
    };
  }, []);

  const flashBlockedHint = (message: string) => {
    setBlockedHint(message);
    if (blockedHintTimerRef.current) clearTimeout(blockedHintTimerRef.current);
    blockedHintTimerRef.current = setTimeout(() => setBlockedHint(null), 2500);
  };

  const toggleCurrency = (code: string) => {
    const existing = currencies.find((c) => c.code === code);
    if (existing) {
      if (currencyCodesInUse.has(code)) {
        flashBlockedHint(t.vacations.cannotRemoveCurrencyInUse);
        return;
      }
      if (currencies.length <= 1) {
        flashBlockedHint(t.vacations.cannotRemoveLastCurrency);
        return;
      }
      const next = currencies.filter((c) => c.code !== code);
      if (existing.isDefault) next[0].isDefault = true;
      onChange(next);
      return;
    }
    onChange([...currencies, { code, isDefault: currencies.length === 0 }]);
  };

  const setAsDefault = (code: string) => {
    onChange(currencies.map((c) => ({ ...c, isDefault: c.code === code })));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessible={false} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]} accessibilityViewIsModal accessibilityRole="none">
          <View style={styles.grabberArea} accessible={false}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]} accessibilityRole="header">
              {t.vacations.currenciesLabel}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
            >
              <Ionicons name="close" size={14} color="#71717A" />
            </TouchableOpacity>
          </View>
          {blockedHint && (
            <Text style={[styles.blockedHint, { textAlign }]}>{blockedHint}</Text>
          )}
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            style={styles.list}
            renderItem={({ item }) => {
              const vacationCurrency = currencies.find((c) => c.code === item.code);
              const selected = !!vacationCurrency;
              // Selected currencies already in use by an expense can't be
              // unchecked (toggleCurrency blocks it with the hint above) — the
              // checkbox itself is colored to look disabled so that's clear
              // before the user even taps it.
              const locked = selected && currencyCodesInUse.has(item.code);
              return (
                <View style={[styles.row, selected && styles.rowSelected, { flexDirection: rowDirection }]}>
                  <TouchableOpacity
                    style={[styles.rowMain, { flexDirection: rowDirection }]}
                    onPress={() => toggleCurrency(item.code)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${item.code}, ${item.name}`}
                    accessibilityState={{ checked: selected, disabled: locked }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        selected && styles.checkboxChecked,
                        locked && styles.checkboxLocked,
                      ]}
                    >
                      {selected && (
                        <Ionicons name="checkmark" size={12} color={locked ? colors.textMuted : '#fff'} />
                      )}
                    </View>
                    <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
                      <Text style={[styles.symbol, selected && styles.symbolSelected]}>{item.symbol}</Text>
                    </View>
                    <View style={styles.rowMiddle}>
                      <Text style={[styles.code, { textAlign }, selected && styles.codeSelected]}>
                        {item.code}
                      </Text>
                      <Text style={[styles.name, { textAlign }]}>{item.name}</Text>
                    </View>
                  </TouchableOpacity>
                  {selected &&
                    (vacationCurrency!.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>{t.vacations.defaultBadgeLabel}</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setAsDefault(item.code)}
                        style={styles.setDefaultButton}
                        accessibilityRole="button"
                        accessibilityLabel={`${t.vacations.setAsDefaultLabel}, ${item.code}`}
                      >
                        <Text style={styles.setDefaultText}>{t.vacations.setAsDefaultLabel}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              );
            }}
          />
          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.85} accessibilityRole="button">
            <Text style={styles.doneButtonText}>{t.common.done}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 24, 27, 0.42)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
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
  grabber: { width: 44, height: 5, borderRadius: 999, backgroundColor: '#E4E4EA' },
  header: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedHint: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  list: { marginBottom: 4 },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 52,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  rowSelected: { backgroundColor: '#F4F4F5', borderRadius: 14 },
  rowMain: { flex: 1, alignItems: 'center', gap: 12, minWidth: 0 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLocked: { backgroundColor: colors.divider, borderColor: colors.divider },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgeSelected: { backgroundColor: '#E4E4E7' },
  symbol: { fontSize: 15, fontWeight: '700', color: '#8B8B96' },
  symbolSelected: { color: '#27272A' },
  rowMiddle: { flex: 1, minWidth: 0 },
  code: { fontSize: 15, fontWeight: '600', color: colors.text },
  codeSelected: { fontWeight: '700' },
  name: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  defaultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E7F6F1',
    flexShrink: 0,
  },
  defaultBadgeText: { fontSize: 11, fontWeight: '700', color: '#159C87' },
  setDefaultButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.background,
    flexShrink: 0,
  },
  setDefaultText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  doneButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
