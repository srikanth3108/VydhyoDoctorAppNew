import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Calendar} from 'lucide-react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export type SettlementDateRange =
  | 'all'
  | 'week'
  | 'month'
  | 'last30'
  | 'custom'
  | 'range';

const RANGES: {id: SettlementDateRange; label: string}[] = [
  {id: 'all', label: 'All time'},
  {id: 'week', label: 'This week'},
  {id: 'month', label: 'This month'},
  {id: 'last30', label: 'Last 30 days'},
];

type Props = {
  range: SettlementDateRange;
  onRangeChange: (r: SettlementDateRange) => void;
  resultCount: number;
  selectedDayLabel?: string | null;
  onOpenCalendar: () => void;
};

export default function SettlementDateFilter({
  range,
  onRangeChange,
  resultCount,
  selectedDayLabel,
  onOpenCalendar,
}: Props) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onOpenCalendar}
        activeOpacity={0.85}>
        <View style={styles.titleRow}>
          <View style={styles.calIconWrap}>
            <Calendar color={PROVIDER_THEME.jade} size={moderateScale(18)} />
          </View>
          <View>
            <Text style={styles.title}>Filter by date</Text>
            {selectedDayLabel ? (
              <Text style={styles.selectedDay}>{selectedDayLabel}</Text>
            ) : (
              <Text style={styles.tapHint}>Tap to open calendar</Text>
            )}
          </View>
        </View>
        <Text style={styles.count}>
          {resultCount} record{resultCount === 1 ? '' : 's'}
        </Text>
      </TouchableOpacity>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {RANGES.map(r => {
          const active = range === r.id;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onRangeChange(r.id)}
              activeOpacity={0.85}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: moderateScale(12),
    gap: moderateScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(10)},
  calIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  tapHint: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    marginTop: 2,
  },
  selectedDay: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.jade,
    fontWeight: '700',
    marginTop: 2,
  },
  count: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: PROVIDER_THEME.textSoft,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingRight: moderateScale(4),
  },
  chip: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(9),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: PROVIDER_THEME.pearl,
  },
  chipActive: {
    backgroundColor: PROVIDER_THEME.jade,
    borderColor: PROVIDER_THEME.jade,
  },
  chipText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
