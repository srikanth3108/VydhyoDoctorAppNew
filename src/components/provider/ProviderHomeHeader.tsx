import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Bell} from 'lucide-react-native';
import OnlineDutyToggle from './OnlineDutyToggle';
import ProviderBrandMark from './ProviderBrandMark';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

const defaultAvatar = require('../../assets/images/defaultProfile.png');

type Props = {
  displayName: string;
  roleTitle: string;
  isOnline: boolean;
  onToggleOnline: (v: boolean) => void;
  incomingCount: number;
  onNotifications?: () => void;
};

export default function ProviderHomeHeader({
  displayName,
  roleTitle,
  isOnline,
  onToggleOnline,
  incomingCount,
  onNotifications,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <ProviderBrandMark />
        <TouchableOpacity
          style={styles.bell}
          onPress={onNotifications}
          activeOpacity={0.88}>
          <Bell color={PROVIDER_THEME.navy} size={moderateScale(20)} strokeWidth={2.2} />
          {incomingCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {incomingCount > 9 ? '9+' : incomingCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.profileBlock}>
        <View style={styles.avatarRing}>
          <Image source={defaultAvatar} style={styles.avatar} />
        </View>
        <View style={styles.greeting}>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.role} numberOfLines={2}>
            {roleTitle}
          </Text>
        </View>
      </View>

      <OnlineDutyToggle
        isOnline={isOnline}
        onToggle={onToggleOnline}
        incomingCount={incomingCount}
        variant="hero"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: moderateScale(22),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(8),
    gap: moderateScale(20),
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bell: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PROVIDER_THEME.amber,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.inkSoft,
  },
  badgeText: {fontSize: 10, fontWeight: '800', color: PROVIDER_THEME.ink},
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(16),
  },
  avatarRing: {
    padding: 3,
    borderRadius: moderateScale(22),
    borderWidth: 2,
    borderColor: PROVIDER_THEME.jadeGlow,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: moderateScale(58),
    height: moderateScale(58),
    borderRadius: moderateScale(18),
  },
  greeting: {flex: 1, minWidth: 0},
  welcome: {
    ...PROVIDER_FONTS.label,
    color: PROVIDER_THEME.navyMuted,
    fontSize: moderateScale(10),
  },
  name: {
    ...PROVIDER_FONTS.hero,
    fontSize: moderateScale(26),
    color: PROVIDER_THEME.textOnMint,
    marginTop: moderateScale(4),
  },
  role: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textOnMintMuted,
    marginTop: moderateScale(4),
    lineHeight: moderateScale(18),
    fontWeight: '500',
  },
});
