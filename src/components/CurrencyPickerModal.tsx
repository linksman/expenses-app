import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabberArea}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]}>{t.currency.pickerTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color="#71717A" />
            </TouchableOpacity>
          </View>
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
                    { flexDirection: rowDirection },
                  ]}
                  onPress={() => {
                    onSelect(NONE_CODE);
                    onClose();
                  }}
                  activeOpacity={0.7}
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
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected, { flexDirection: rowDirection }]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
                    <Text style={[styles.symbol, selected && styles.symbolSelected]}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 20, 45, 0.42)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '75%',
    shadowColor: '#18142D',
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
    width: 32,
    height: 32,
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
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  rowSelected: { backgroundColor: '#F9F6FE', borderRadius: 14 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBadgeSelected: { backgroundColor: '#F1EAFE' },
  symbol: { fontSize: 15, fontWeight: '700', color: '#8B8B96' },
  symbolSelected: { color: '#7C3AED' },
  rowMiddle: { flex: 1, minWidth: 0 },
  code: { fontSize: 15, fontWeight: '600', color: colors.text },
  codeSelected: { fontWeight: '700' },
  name: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
});
