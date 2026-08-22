import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { CURRENCIES, currencyColors } from '../types/currency';
import { useLanguage } from '../storage/LanguageContext';

interface Props {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  allowNone?: boolean;
  noneLabel?: string;
  // When provided, only these currency codes are offered — except the
  // currently selected one, which always stays visible even if it's outside
  // this list (e.g. an expense whose currency was since removed from its
  // vacation's set still needs to render as the current selection).
  restrictToCodes?: string[];
}

const NONE_CODE = '';

export default function CurrencyPickerModal({
  visible,
  selectedCode,
  onSelect,
  onClose,
  allowNone,
  noneLabel,
  restrictToCodes,
}: Props) {
  const { t, isRTL } = useLanguage();
  const data = restrictToCodes
    ? CURRENCIES.filter((c) => restrictToCodes.includes(c.code) || c.code === selectedCode)
    : CURRENCIES;
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessible={false} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]} accessibilityViewIsModal accessibilityRole="none">
          <View style={styles.grabberArea} accessible={false}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]} accessibilityRole="header">{t.currency.pickerTitle}</Text>
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
          <FlatList
            data={data}
            keyExtractor={(item) => item.code}
            style={styles.list}
            ListHeaderComponent={
              allowNone ? (
                <TouchableOpacity
                  style={[
                    styles.row,
                    selectedCode === NONE_CODE && styles.rowSelected,
                    { flexDirection: rowDirection },
                  ]}
                  onPress={() => {
                    onSelect(NONE_CODE);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={noneLabel}
                  accessibilityState={{ selected: selectedCode === NONE_CODE }}
                >
                  <View style={styles.iconBadge}>
                    <Text style={styles.symbol}>—</Text>
                  </View>
                  <View style={styles.rowMiddle}>
                    <Text style={[styles.code, { textAlign }]}>{noneLabel}</Text>
                  </View>
                  {selectedCode === NONE_CODE && (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => {
              const selected = item.code === selectedCode;
              const itemColors = currencyColors(item.code);
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected, { flexDirection: rowDirection }]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={`${item.code}, ${item.name}`}
                  accessibilityState={{ selected }}
                >
                  <View
                    style={[styles.iconBadge, { backgroundColor: itemColors.backgroundColor }]}
                  >
                    <Text style={[styles.symbol, { color: itemColors.color }]}>
                      {item.symbol}
                    </Text>
                  </View>
                  <View style={styles.rowMiddle}>
                    <Text style={[styles.code, { textAlign }, selected && styles.codeSelected]}>
                      {item.code}
                    </Text>
                    <Text style={[styles.name, { textAlign }]}>{item.name}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
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
    maxHeight: '75%',
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
  list: { marginBottom: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  rowSelected: { backgroundColor: '#F4F4F5', borderRadius: 14 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  symbol: { fontSize: 15, fontWeight: '700', color: '#8B8B96' },
  rowMiddle: { flex: 1, minWidth: 0 },
  code: { fontSize: 15, fontWeight: '600', color: colors.text },
  codeSelected: { fontWeight: '700' },
  name: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
