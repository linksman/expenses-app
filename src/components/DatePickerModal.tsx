import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useLanguage } from '../storage/LanguageContext';
import { sameDay } from '../utils/dateLabel';

interface Props {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAY_REFERENCE = new Date(2023, 0, 1); // a Sunday

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function DatePickerModal({ visible, selectedDate, onSelect, onClose }: Props) {
  const { t, isRTL, language } = useLanguage();
  const textAlign = isRTL ? 'right' : 'left';
  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const [viewDate, setViewDate] = useState(selectedDate);
  const sheetTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (visible) setViewDate(selectedDate);
  }, [visible, selectedDate]);

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(WEEKDAY_REFERENCE);
    d.setDate(WEEKDAY_REFERENCE.getDate() + i);
    return d.toLocaleDateString(language.locale, { weekday: 'narrow' });
  });

  const monthLabel = viewDate.toLocaleDateString(language.locale, {
    month: 'long',
    year: 'numeric',
  });

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const selectDay = (day: number) => {
    onSelect(new Date(year, month, day));
    onClose();
  };

  const selectToday = () => {
    onSelect(new Date());
    onClose();
  };

  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessible={false} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]} accessibilityViewIsModal accessibilityRole="none">
          <View style={styles.grabberArea} accessible={false}>
            <View style={styles.grabber} />
          </View>
          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <Text style={[styles.title, { textAlign }]} accessibilityRole="header">{t.add.date}</Text>
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

          <View style={[styles.monthHeader, { flexDirection: rowDirection }]}>
            <TouchableOpacity onPress={goPrevMonth} style={styles.monthButton} accessibilityRole="button" accessibilityLabel={t.common.previous}>
              <Text style={styles.navArrow}>{isRTL ? '›' : '‹'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={goNextMonth} style={styles.monthButton} accessibilityRole="button" accessibilityLabel={t.common.next}>
              <Text style={styles.navArrow}>{isRTL ? '‹' : '›'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.weekdayRow, { flexDirection: rowDirection }]}>
            {weekdayLabels.map((label, i) => (
              <Text key={i} style={styles.weekdayLabel}>
                {label}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={[styles.weekRow, { flexDirection: rowDirection }]}>
              {week.map((day, di) => {
                if (day === null) return <View key={di} style={styles.dayCell} />;
                const cellDate = new Date(year, month, day);
                const isSelected = sameDay(cellDate, selectedDate);
                const isToday = sameDay(cellDate, today);
                return (
                  <TouchableOpacity
                    key={di}
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      !isSelected && isToday && styles.dayCellToday,
                    ]}
                    onPress={() => selectDay(day)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityLabel={cellDate.toLocaleDateString(language.locale, { dateStyle: 'full' })}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        !isSelected && isToday && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <TouchableOpacity style={styles.todayButton} onPress={selectToday} activeOpacity={0.8} accessibilityRole="button">
            <Text style={styles.todayButtonText}>{t.manage.today}</Text>
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
    paddingBottom: 24,
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
  header: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#F5F5F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 22, color: colors.primaryDark, fontWeight: '700', paddingHorizontal: 12 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  weekdayRow: { justifyContent: 'space-between', marginBottom: 6 },
  weekdayLabel: {
    width: 48,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  weekRow: { justifyContent: 'space-between' },
  dayCell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellToday: { borderWidth: 1.5, borderColor: colors.primary },
  dayText: { fontSize: 14, fontWeight: '600', color: colors.text },
  dayTextSelected: { color: '#fff' },
  dayTextToday: { color: colors.primaryDark },
  todayButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  todayButtonText: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
});
