import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import {moderateScale} from '../../utils/responsive';
import {PROVIDER_THEME} from '../../theme/providerTheme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  accent?: boolean;
  stripe?: 'jade' | 'violet' | 'amber' | 'rose' | 'none';
};

export default function ProviderCard({
  children,
  style,
  accent,
  stripe = 'none',
}: Props) {
  const stripeColor =
    stripe === 'violet'
      ? PROVIDER_THEME.violet
      : stripe === 'amber'
        ? PROVIDER_THEME.amber
        : stripe === 'rose'
          ? PROVIDER_THEME.rose
          : stripe === 'jade'
            ? PROVIDER_THEME.jade
            : 'transparent';

  return (
    <View style={[styles.outer, style]}>
      {/* {stripe !== 'none' ? (
        <View style={[styles.stripe, {backgroundColor: stripeColor}]} />
      ) : null} */}
      <View style={[styles.card, accent && styles.accent]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    overflow: 'hidden',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  stripe: {
    height: 3,
    width: '100%',
  },
  card: {
    backgroundColor: PROVIDER_THEME.pearl,
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  accent: {
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderColor: PROVIDER_THEME.borderStrong,
  },
});
