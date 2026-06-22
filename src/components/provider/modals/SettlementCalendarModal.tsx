import React, {useMemo, useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import {ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, ArrowRight} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

type Props = {
  visible: boolean;
  selectedMs: number | null;
  rangeStartMs: number | null;
  rangeEndMs: number | null;
  onClose: () => void;
  onSelectSingle: (dateMs: number) => void;
  onSelectRange: (startMs: number, endMs: number) => void;
  initialMonth?: Date;
};

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

const TODAY_MS = startOfDay(Date.now());

export default function SettlementCalendarModal({
  visible,
  selectedMs,
  rangeStartMs,
  rangeEndMs,
  onClose,
  onSelectSingle,
  onSelectRange,
  initialMonth = new Date('2026-05-25'),
}: Props) {
  const insets = useSafeAreaInsets();

  // Mode switcher: 'single' | 'range'
  const [activeMode, setActiveMode] = useState<'single' | 'range'>('single');

  // Local interaction states
  const [localSelectedMs, setLocalSelectedMs] = useState<number | null>(null);
  const [localStartMs, setLocalStartMs] = useState<number | null>(null);
  const [localEndMs, setLocalEndMs] = useState<number | null>(null);

  // Calendar navigation date state
  const [viewDate, setViewDate] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  // Synchronize local states when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedMs(selectedMs);
      setLocalStartMs(rangeStartMs);
      setLocalEndMs(rangeEndMs);
      if (rangeStartMs != null) {
        setActiveMode('range');
      } else {
        setActiveMode('single');
      }
    }
  }, [visible, selectedMs, rangeStartMs, rangeEndMs]);

  const {year, month, cells} = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const first = new Date(y, m, 1);
    // Pad first day (e.g. Monday = 0, Sunday = 6)
    const startPad = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const grid: ({day: number; ms: number} | null)[] = [];
    for (let i = 0; i < startPad; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({day: d, ms: startOfDay(new Date(y, m, d).getTime())});
    }
    return {year: y, month: m, cells: grid};
  }, [viewDate]);

  const shiftMonth = (delta: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const handleDayPress = (dayMs: number) => {
    if (activeMode === 'single') {
      setLocalSelectedMs(dayMs);
      onSelectSingle(dayMs);
      onClose();
    } else {
      // Range mode selection logic
      if (localStartMs === null || (localStartMs !== null && localEndMs !== null)) {
        setLocalStartMs(dayMs);
        setLocalEndMs(null);
      } else {
        if (dayMs >= localStartMs) {
          setLocalEndMs(dayMs);
        } else {
          setLocalStartMs(dayMs);
        }
      }
    }
  };

  const handleApplyRange = () => {
    if (localStartMs !== null && localEndMs !== null) {
      onSelectRange(localStartMs, localEndMs);
      onClose();
    }
  };

  const formattedRangeSelected = useMemo(() => {
    if (localStartMs === null) return 'Start Date → End Date';
    const opt: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'short'};
    const startText = new Date(localStartMs).toLocaleDateString('en-IN', opt);
    if (localEndMs === null) return `${startText} → Choose end date`;
    const endText = new Date(localEndMs).toLocaleDateString('en-IN', opt);
    return `${startText} → ${endText}`;
  }, [localStartMs, localEndMs]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, {paddingBottom: Math.max(insets.bottom, 16)}]}
          onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Select Date</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={PROVIDER_THEME.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          {/* ── Mode Toggle Segmented Control ── */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, activeMode === 'single' && styles.toggleBtnActive]}
              onPress={() => setActiveMode('single')}
              activeOpacity={0.8}>
              <Text style={[styles.toggleText, activeMode === 'single' && styles.toggleTextActive]}>
                Single Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, activeMode === 'range' && styles.toggleBtnActive]}
              onPress={() => setActiveMode('range')}
              activeOpacity={0.8}>
              <Text style={[styles.toggleText, activeMode === 'range' && styles.toggleTextActive]}>
                Date Range
              </Text>
            </TouchableOpacity>
          </View>

          {/* Range Selection Status Banner */}
          {activeMode === 'range' && (
            <View style={styles.rangeBanner}>
              <CalendarIcon color={PROVIDER_THEME.navy} size={16} />
              <Text style={styles.rangeBannerText}>{formattedRangeSelected}</Text>
            </View>
          )}

          {/* Month Navigation */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.navBtn}>
              <ChevronLeft color={PROVIDER_THEME.ink} size={22} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.navBtn}>
              <ChevronRight color={PROVIDER_THEME.ink} size={22} />
            </TouchableOpacity>
          </View>

          {/* Days of Week */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {cells.map((cell, idx) => {
              if (!cell) {
                return <View key={`e-${idx}`} style={styles.cell} />;
              }

              // Highlight matching
              let isSelected = false;
              let isStart = false;
              let isEnd = false;
              let isInBetween = false;

              if (activeMode === 'single') {
                isSelected = localSelectedMs !== null && isSameDay(cell.ms, localSelectedMs);
              } else {
                isStart = localStartMs !== null && isSameDay(cell.ms, localStartMs);
                isEnd = localEndMs !== null && isSameDay(cell.ms, localEndMs);
                isInBetween =
                  localStartMs !== null &&
                  localEndMs !== null &&
                  cell.ms > localStartMs &&
                  cell.ms < localEndMs;
              }

              const isToday = isSameDay(cell.ms, TODAY_MS);

              return (
                <View key={cell.ms} style={styles.cell}>
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      isSelected && styles.daySelected,
                      isStart && styles.dayStartSelected,
                      isEnd && styles.dayEndSelected,
                      isInBetween && styles.dayInBetween,
                      isToday && !isSelected && !isStart && !isEnd && styles.dayToday,
                    ]}
                    onPress={() => handleDayPress(cell.ms)}>
                    <Text
                      style={[
                        styles.dayText,
                        (isSelected || isStart || isEnd) && styles.dayTextSelected,
                        isInBetween && styles.dayTextInBetween,
                        isToday && !isSelected && !isStart && !isEnd && styles.dayTextToday,
                      ]}>
                      {cell.day}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Action buttons footer */}
          <View style={styles.footerRow}>
            {activeMode === 'range' ? (
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  (localStartMs === null || localEndMs === null) && styles.applyBtnDisabled,
                ]}
                onPress={handleApplyRange}
                disabled={localStartMs === null || localEndMs === null}>
                <Text style={styles.applyBtnText}>Apply Date Range</Text>
                <ArrowRight color="#FFFFFF" size={16} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PROVIDER_THEME.pearl,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(8),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: PROVIDER_THEME.sandDeep,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: PROVIDER_THEME.pearlMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Toggle Switch
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    borderRadius: moderateScale(10),
    padding: 3,
    marginBottom: moderateScale(14),
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    borderRadius: moderateScale(8),
  },
  toggleBtnActive: {
    backgroundColor: PROVIDER_THEME.navy,
    ...PROVIDER_THEME.shadowStyles.header,
  },
  toggleText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // Range Selected Banner
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.mintSoft,
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.1)',
  },
  rangeBannerText: {
    fontSize: moderateScale(12.5),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  navBtn: {
    padding: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: PROVIDER_THEME.pearlMuted,
  },
  monthLabel: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(8),
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.textSoft,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: moderateScale(8),
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1.1,
    padding: moderateScale(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(12),
  },
  daySelected: {
    backgroundColor: PROVIDER_THEME.jade,
  },
  dayStartSelected: {
    backgroundColor: PROVIDER_THEME.navy,
    borderTopLeftRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
  },
  dayEndSelected: {
    backgroundColor: PROVIDER_THEME.navy,
    borderTopRightRadius: moderateScale(12),
    borderBottomRightRadius: moderateScale(12),
  },
  dayInBetween: {
    backgroundColor: PROVIDER_THEME.mintSoft,
    borderRadius: 0,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: PROVIDER_THEME.jade,
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
  },
  dayTextToday: {
    fontWeight: '800',
    color: PROVIDER_THEME.jade,
  },
  dayDisabled: {
    opacity: 0.25,
  },
  dayTextDisabled: {
    color: PROVIDER_THEME.textSoft,
  },
  dayText: {
    fontSize: moderateScale(13.5),
    fontWeight: '600',
    color: PROVIDER_THEME.ink,
  },
  dayTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  dayTextInBetween: {
    color: PROVIDER_THEME.success,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: moderateScale(12),
    gap: moderateScale(8),
  },
  cancelBtn: {
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  cancelBtnText: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.navy,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
  },
  applyBtnDisabled: {
    backgroundColor: 'rgba(29, 53, 87, 0.4)',
  },
  applyBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
