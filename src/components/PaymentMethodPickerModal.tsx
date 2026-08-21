import React, { useMemo } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { usePaymentMethods } from '../storage/PaymentMethodsContext';
import { useLanguage } from '../storage/LanguageContext';
import { paymentMethodName } from '../utils/paymentMethodName';

interface Props {
  visible: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export default function PaymentMethodPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { methods } = usePaymentMethods();
  const { t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const enabledMethods = useMemo(() => methods.filter((m) => m.enabled), [methods]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessible={false} />
        <View style={styles.sheet} accessibilityViewIsModal accessibilityRole="none">
          <View style={styles.grabberArea} accessible={false}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]} accessibilityRole="header">{t.paymentMethods.pickerTitle}</Text>
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
            data={enabledMethods}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected, { flexDirection: rowDirection }]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityLabel={paymentMethodName(item, t)}
                  accessibilityState={{ selected }}
                >
                  <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={selected ? '#7C3AED' : '#8B8B96'}
                    />
                  </View>
                  <Text style={[styles.name, { textAlign }, selected && styles.nameSelected]}>
                    {paymentMethodName(item, t)}
                  </Text>
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
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { marginBottom: 4, flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingVertical: 6,
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
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  nameSelected: { fontWeight: '700' },
});
