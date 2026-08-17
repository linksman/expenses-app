import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { useVacations } from '../storage/VacationsContext';
import { useExpenses } from '../storage/ExpensesContext';
import { Vacation } from '../types/vacation';
import { formatTotals, totalsByCurrencyFor } from '../utils/formatCurrency';

export const ALL_VACATIONS = 'all';

interface Props {
  visible: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  allowCreate?: boolean;
  onCreateNew?: () => void;
  allowAll?: boolean;
  onEditVacation?: (vacation: Vacation) => void;
}

export default function VacationPickerModal({
  visible,
  selectedId,
  onSelect,
  onClose,
  allowCreate,
  onCreateNew,
  allowAll,
  onEditVacation,
}: Props) {
  const { t, isRTL } = useLanguage();
  const { vacations } = useVacations();
  const { expenses } = useExpenses();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  const data: (Vacation | typeof ALL_VACATIONS)[] = allowAll
    ? [ALL_VACATIONS, ...vacations]
    : vacations;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]}>{t.vacations.pickerTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={14} color="#71717A" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => (typeof item === 'string' ? item : item.id)}
            style={styles.list}
            renderItem={({ item, index }) => {
              const isAll = item === ALL_VACATIONS;
              const id = isAll ? ALL_VACATIONS : (item as Vacation).id;
              const label = isAll ? t.vacations.allVacations : (item as Vacation).name;
              const selected = id === selectedId;
              const isLast = index === data.length - 1;
              const vacationExpenses = isAll
                ? []
                : expenses.filter((e) => e.vacationId === (item as Vacation).id);
              const statsText = isAll
                ? null
                : `${vacationExpenses.length} ${t.manage.expensesCount} · ${formatTotals(
                    totalsByCurrencyFor(vacationExpenses),
                    (item as Vacation).defaultCurrency
                  )}`;
              return (
                <View
                  style={[
                    styles.row,
                    { flexDirection: rowDirection },
                    selected && styles.rowSelected,
                    !isLast && styles.rowBorder,
                  ]}
                >
                  <View style={styles.checkSlot}>
                    {selected && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </View>
                  <TouchableOpacity
                    style={[styles.rowSelectable, { flexDirection: rowDirection }]}
                    onPress={() => {
                      onSelect(id);
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.iconBadge, { backgroundColor: selected ? '#F1EAFE' : '#F5F5F8' }]}
                    >
                      <Ionicons
                        name={isAll ? 'grid-outline' : 'location-outline'}
                        size={17}
                        color={selected ? '#7C3AED' : '#8B8B96'}
                      />
                    </View>
                    <View style={styles.textBlock}>
                      <Text
                        style={[styles.name, { textAlign }, selected && styles.nameSelected]}
                        numberOfLines={1}
                      >
                        {label}
                      </Text>
                      {statsText && (
                        <Text style={[styles.stats, { textAlign }]} numberOfLines={1}>
                          {statsText}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  {!isAll && onEditVacation ? (
                    <TouchableOpacity
                      onPress={() => {
                        onClose();
                        onEditVacation(item as Vacation);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={[
                        styles.editButton,
                        { backgroundColor: selected ? '#F1EAFE' : '#F5F5F8' },
                      ]}
                    >
                      <Ionicons name="pencil" size={13} color={selected ? '#6D28D9' : '#71717A'} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.editButtonSpacer} />
                  )}
                </View>
              );
            }}
            ListFooterComponent={
              allowCreate ? (
                <TouchableOpacity
                  style={[styles.createNewButton, { flexDirection: rowDirection }]}
                  onPress={() => {
                    onClose();
                    onCreateNew?.();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.primary} />
                  <Text style={styles.createNew}>{t.vacations.createNew}</Text>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24, 20, 45, 0.42)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    paddingTop: 14,
    paddingHorizontal: 20,
    paddingBottom: 26,
    maxHeight: '75%',
    shadowColor: '#18142D',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 8,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#E4E4EA',
    alignSelf: 'center',
    marginBottom: 14,
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
  row: { alignItems: 'center', gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowSelected: { backgroundColor: '#F9F6FE', borderRadius: 14 },
  checkSlot: { width: 17, flexShrink: 0, alignItems: 'center' },
  rowSelectable: { flex: 1, alignItems: 'center', gap: 12, paddingVertical: 14, minWidth: 0 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: { flex: 1, minWidth: 0, gap: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  nameSelected: { fontWeight: '700' },
  stats: { fontSize: 12, color: colors.textMuted },
  editButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  editButtonSpacer: { width: 30, flexShrink: 0 },
  createNewButton: {
    height: 50,
    marginTop: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD1FA',
    borderStyle: 'dashed',
    backgroundColor: '#FBF9FF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createNew: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
