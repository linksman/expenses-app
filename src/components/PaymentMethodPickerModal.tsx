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
  const enabledMethods = useMemo(() => methods.filter((m) => m.enabled), [methods]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={[styles.title, { textAlign }]}>{t.paymentMethods.pickerTitle}</Text>
          <FlatList
            data={enabledMethods}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={colors.text}
                    style={styles.icon}
                  />
                  <Text style={[styles.name, { textAlign }]}>
                    {paymentMethodName(item, t)}
                  </Text>
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
    paddingBottom: 20,
    maxHeight: '75%',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  list: { marginBottom: 8, flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.background },
  icon: { width: 40, textAlign: 'center' },
  name: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 },
  check: { fontSize: 16, fontWeight: '700', color: colors.primary, marginRight: 8 },
});
