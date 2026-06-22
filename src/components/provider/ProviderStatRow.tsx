import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export type StatItem = {
  key: string;
  label: string;
  value: string;
  valueColor?: string;
  icon?: React.ReactNode;
};

type Props = {
  items: StatItem[];
};

/** Full-width stat rows — avoids 3-column squeeze / text overlap */
export default function ProviderStatRow({items}: Props) {
  return (
    <View style={styles.wrap}>
      {items.map((item, index) => (
        <View
          key={item.key}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
          <View style={styles.left}>
            {item.icon ? <View style={styles.icon}>{item.icon}</View> : null}
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
          <Text
            style={[styles.value, item.valueColor ? {color: item.valueColor} : null]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {item.value}
          </Text>
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
    justifyContent: 'space-between',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(12),
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PROVIDER_THEME.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    flex: 1,
    minWidth: 0,
  },
  icon: {flexShrink: 0},
  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: PROVIDER_THEME.textMuted,
    flex: 1,
  },
  value: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    flexShrink: 0,
    maxWidth: '45%',
    textAlign: 'right',
  },
});
