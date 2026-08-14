import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { CURRENCIES } from '../types/currency';
import { useLanguage } from '../storage/LanguageContext';

interface Props {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
  allowNone?: boolean;
  noneLabel?: string;
}

const NONE_CODE = '';

export default function CurrencyPickerModal({
  visible,
  selectedCode,
  onSelect,
  onClose,
  allowNone,
  noneLabel,
}: Props) {
  const { t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={[styles.title, { textAlign }]}>{t.currency.pickerTitle}</Text>
          <FlatList
            data={CURRENCIES}
            keyExtractor={(item) => item.code}
            style={styles.list}
            ListHeaderComponent={
              allowNone ? (
                <TouchableOpacity
                  style={[
                    styles.row,
                    selectedCode === NONE_CODE && styles.rowSelected,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                  onPress={() => {
                    onSelect(NONE_CODE);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.symbol}>—</Text>
                  <View style={styles.rowMiddle}>
                    <Text style={[styles.code, { textAlign }]}>{noneLabel}</Text>
                  </View>
                  {selectedCode === NONE_CODE && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => {
              const selected = item.code === selectedCode;
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.symbol}>{item.symbol}</Text>
                  <View style={styles.rowMiddle}>
                    <Text style={[styles.code, { textAlign }]}>{item.code}</Text>
                    <Text style={[styles.name, { textAlign }]}>{item.name}</Text>
                  </View>
                  {selected && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(27, 39, 51, 0.45)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  list: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.background },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryDark,
    width: 44,
    textAlign: 'center',
  },
  rowMiddle: { flex: 1, marginHorizontal: 8 },
  code: { fontSize: 15, fontWeight: '600', color: colors.text },
  name: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
  check: { fontSize: 16, fontWeight: '700', color: colors.primary, marginRight: 8 },
});
