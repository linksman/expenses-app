import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useGroups } from '../storage/GroupsContext';
import { ExpenseGroup } from '../types/group';

export const ALL_GROUPS = 'all';

interface Props {
  visible: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  allowAll?: boolean;
  onEditGroup?: (group: ExpenseGroup) => void;
}

export default function GroupPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  allowCreate,
  onCreateNew,
  allowAll,
  onEditGroup,
}: Props) {
  const { t, isRTL } = useLanguage();
  const { groups } = useGroups();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const data: (ExpenseGroup | typeof ALL_GROUPS)[] = allowAll
    ? [ALL_GROUPS, ...groups]
    : groups;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={[styles.title, { textAlign }]}>{t.groups.pickerTitle}</Text>
          <FlatList
            data={data}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
            style={styles.list}
            renderItem={({ item }) => {
              const isAll = item === ALL_GROUPS;
              const id = isAll ? ALL_GROUPS : (item as ExpenseGroup).id;
              const label = isAll ? t.groups.allGroups : (item as ExpenseGroup).name;
              const selected = id === selectedId;
              return (
                <View
                  style={[
                    styles.row,
                    selected && styles.rowSelected,
                    { flexDirection: rowDirection },
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.rowSelectable, { flexDirection: rowDirection }]}
                    onPress={() => {
                      onSelect(id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.nameRow, { flexDirection: rowDirection }]}>
                      {!isAll && (
                        <View
                          style={[styles.dot, { backgroundColor: (item as ExpenseGroup).color }]}
                        />
                      )}
                      <Text style={[styles.name, { textAlign }]}>{label}</Text>
                    </View>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                  {!isAll && onEditGroup && (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onEditGroup(item as ExpenseGroup);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.editButton}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListFooterComponent={
              allowCreate ? (
                <TouchableOpacity
                  style={[styles.rowSelectable, { flexDirection: rowDirection }]}
                  onPress={() => {
                    onClose();
                    onCreateNew?.();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.createNew, { textAlign }]}>{t.groups.createNew}</Text>
                </TouchableOpacity>
              ) : null
            }
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
  list: { marginBottom: 4 },
  row: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: { backgroundColor: colors.background },
  rowSelectable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  nameRow: { flex: 1, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  check: { fontSize: 16, fontWeight: '700', color: colors.primary },
  editButton: { paddingHorizontal: 10, paddingVertical: 14 },
  editIcon: { fontSize: 16 },
  createNew: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.primary },
});
