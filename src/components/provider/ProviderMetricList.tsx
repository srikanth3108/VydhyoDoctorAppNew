import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export type MetricItem = {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
};

type Props = {
  items: MetricItem[];
};

/** Full-width performance metrics — no narrow 3-column grid */
export default function ProviderMetricList({items}: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View
          key={item.key}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
          <View style={styles.iconBox}>{item.icon}</View>
          <View style={styles.body}>
            <Text style={styles.value} numberOfLines={2}>
              {item.value}
            </Text>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
          {item.badge ?? null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PROVIDER_THEME.pearl,
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(12),
    overflow: 'hidden',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(16),
    gap: moderateScale(14),
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PROVIDER_THEME.border,
  },
  iconBox: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {flex: 1, minWidth: 0},
  value: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
    fontWeight: '500',
  },
});
