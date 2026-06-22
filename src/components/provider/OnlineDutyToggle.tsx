import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Switch} from 'react-native';
import {Radio, Wifi} from 'lucide-react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type Props = {
  isOnline: boolean;
  onToggle: (value: boolean) => void;
  incomingCount: number;
  variant?: 'hero' | 'sheet';
};

export default function OnlineDutyToggle({
  isOnline,
  onToggle,
  incomingCount,
  variant = 'hero',
}: Props) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (!isOnline) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 900, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.35, duration: 900, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isOnline, pulse]);

  const hint =
    isOnline && incomingCount > 0
      ? `${incomingCount} live booking${incomingCount > 1 ? 's' : ''} near you`
      : isOnline
        ? 'Accepting home-visit requests'
        : 'Switch on to receive bookings';

  const isHero = variant === 'hero';

  return (
    <View style={[styles.wrap, isHero ? styles.wrapHero : styles.wrapSheet]}>
      <View style={styles.iconCol}>
        {isOnline ? (
          <Animated.View style={{opacity: pulse}}>
            <Radio color={PROVIDER_THEME.jade} size={moderateScale(22)} fill={PROVIDER_THEME.jade} />
          </Animated.View>
        ) : (
          <Wifi
            color={isHero ? PROVIDER_THEME.navyMuted : PROVIDER_THEME.textSoft}
            size={moderateScale(22)}
          />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, isHero && styles.titleHero]}>
          {isOnline ? 'On duty' : 'Off duty'}
        </Text>
        <Text style={[styles.hint, isHero && styles.hintHero]}>{hint}</Text>
        {isOnline ? (
          <View style={[styles.liveTag, isHero && styles.liveTagHero]}>
            <View style={styles.liveDot} />
            <Text style={[styles.liveText, isHero && styles.liveTextHero]}>LIVE</Text>
          </View>
        ) : null}
      </View>

      <Switch
        value={isOnline}
        onValueChange={onToggle}
        trackColor={{
          false: PROVIDER_THEME.sandDeep,
          true: PROVIDER_THEME.navy,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={PROVIDER_THEME.sandDeep}
        style={styles.switch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  wrapHero: {},
  wrapSheet: {
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  iconCol: {
    width: moderateScale(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {flex: 1, minWidth: 0},
  title: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.3,
  },
  titleHero: {color: PROVIDER_THEME.textOnMint},
  hint: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(3),
    fontWeight: '500',
    lineHeight: moderateScale(17),
  },
  hintHero: {color: PROVIDER_THEME.textOnMintMuted},
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: moderateScale(8),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  liveTagHero: {
    backgroundColor: PROVIDER_THEME.jadeMuted,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PROVIDER_THEME.jade,
  },
  liveText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: PROVIDER_THEME.jadeDeep,
    letterSpacing: 0.8,
  },
  liveTextHero: {color: PROVIDER_THEME.navy},
  switch: {
    transform: [{scaleX: 1.05}, {scaleY: 1.05}],
  },
});
