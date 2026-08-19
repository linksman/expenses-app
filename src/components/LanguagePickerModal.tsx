import React from 'react';
import { Animated, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { LANGUAGES, LanguageCode } from '../i18n/languages';
import { useLanguage } from '../storage/LanguageContext';
import { useDragToDismiss } from '../utils/useDragToDismiss';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePickerModal({ visible, onClose }: Props) {
  const { languageCode, setLanguage, t, isRTL } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const { grabberHandlers, translateY } = useDragToDismiss(onClose, visible);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.grabberArea} {...grabberHandlers}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]}>{t.settings.language}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color="#71717A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const selected = item.code === languageCode;
              return (
                <TouchableOpacity
                  style={[styles.row, selected && styles.rowSelected, { flexDirection: rowDirection }]}
                  onPress={() => {
                    setLanguage(item.code as LanguageCode);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBadge, selected && styles.iconBadgeSelected]}>
                    <Ionicons name="globe-outline" size={17} color={selected ? '#7C3AED' : '#8B8B96'} />
                  </View>
                  <Text style={[styles.name, { textAlign }, selected && styles.nameSelected]}>
                    {item.nativeLabel}
                  </Text>
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
  row: {
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
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  nameSelected: { fontWeight: '700' },
});
