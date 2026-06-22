import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Search} from 'lucide-react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export type JobFilterChip = 'all' | 'active' | 'managed' | 'critical';

const CHIPS: {id: JobFilterChip; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'active', label: 'Active'},
  {id: 'managed', label: 'Managed'},
  {id: 'critical', label: 'Critical'},
];

type Props = {
  query: string;
  onQueryChange: (q: string) => void;
  filter: JobFilterChip;
  onFilterChange: (f: JobFilterChip) => void;
};

export default function JobsSearchFilter({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.searchBox}>
        <Search color={PROVIDER_THEME.textSoft} size={moderateScale(18)} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient name, condition, appointment..."
          placeholderTextColor={PROVIDER_THEME.textSoft}
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}>
        {CHIPS.map(chip => {
          const active = filter === chip.id;
          return (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onFilterChange(chip.id)}
              activeOpacity={0.85}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
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
    marginBottom: moderateScale(14),
    gap: moderateScale(12),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.pearl,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.ink,
    padding: 0,
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    paddingRight: moderateScale(4),
  },
  chip: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
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
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
