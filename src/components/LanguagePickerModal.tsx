import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { LANGUAGES, LanguageCode } from '../i18n/languages';
import { useLanguage } from '../storage/LanguageContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePickerModal({ visible, onClose }: Props) {
  const { languageCode, setLanguage, t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={[styles.title, { textAlign }]}>{t.settings.language}</Text>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const selected = item.code === languageCode;
              return (
                <TouchableOpacity
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                  onPress={() => {
                    setLanguage(item.code as LanguageCode);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.name, { textAlign }]}>{item.nativeLabel}</Text>
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
    maxHeight: '70%',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.background },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  check: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
