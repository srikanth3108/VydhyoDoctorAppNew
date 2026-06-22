import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import ProviderScreenFrame from './ProviderScreenFrame';
import ProviderTopBar from './ProviderTopBar';
import {moderateScale} from '../../utils/responsive';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  headerRight?: React.ReactNode;
  contentStyle?: ViewStyle;
  headerExtra?: React.ReactNode;
  incomingCount?: number;
  onNotifications?: () => void;
};

export default function ProviderShell({
  title,
  subtitle,
  children,
  scroll = true,
  headerRight,
  contentStyle,
  headerExtra,
  incomingCount,
  onNotifications,
}: Props) {
  const hero = (
    <View style={styles.heroBlock}>
      <ProviderTopBar
        incomingCount={incomingCount}
        onNotifications={onNotifications}
        rightSlot={headerRight}
      />
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  return (
    <ProviderScreenFrame hero={hero} scroll={scroll} contentStyle={contentStyle}>
      {headerExtra}
      {children}
    </ProviderScreenFrame>
  );
}

const styles = StyleSheet.create({
  heroBlock: {paddingBottom: moderateScale(14)},
  titles: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(4),
  },
  title: {
    ...PROVIDER_FONTS.pageTitle,
    fontSize: moderateScale(32),
    color: PROVIDER_THEME.textOnMint,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.textOnMintMuted,
    marginTop: moderateScale(4),
    fontWeight: '500',
  },
});
