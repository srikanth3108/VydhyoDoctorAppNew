import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type Props = {light?: boolean; compact?: boolean};

/** Vydhyo pulse mark — used in heroes */
export default function ProviderBrandMark({light = true, compact}: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <View style={styles.pulse} />
        <View style={styles.core} />
      </View>
      {!compact ? (
        <Text style={[styles.text, light && styles.textLight]}>
          VYDHYO
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(8)},
  mark: {
    width: moderateScale(22),
    height: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompact: {width: moderateScale(18), height: moderateScale(18)},
  pulse: {
    position: 'absolute',
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.jadeGlow,
    opacity: 0.6,
  },
  core: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: 4,
    backgroundColor: PROVIDER_THEME.jadeGlow,
  },
  text: {
    ...PROVIDER_FONTS.brand,
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.ink,
  },
  textLight: {color: PROVIDER_THEME.navyMuted},
});
