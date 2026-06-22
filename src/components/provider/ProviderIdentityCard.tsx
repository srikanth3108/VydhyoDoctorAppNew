import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

const defaultAvatar = require('../../assets/doclogo.png');

type Props = {
  displayName: string;
  roleTitle: string;
  isOnline?: boolean;
};

/** Profile block — lives on pearl sheet, always readable */
export default function ProviderIdentityCard({
  displayName,
  roleTitle,
  isOnline,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.avatarWrap}>
        <Image source={defaultAvatar} style={styles.avatar} />
        {isOnline ? <View style={styles.dot} /> : null}
      </View>
      <View style={styles.text}>
        <Text style={styles.greeting}>Good day</Text>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.role} numberOfLines={2}>
          {roleTitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  avatarWrap: {position: 'relative'},
  avatar: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(18),
    borderWidth: 2,
    borderColor: PROVIDER_THEME.jadeMuted,
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PROVIDER_THEME.jade,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.pearl,
  },
  text: {flex: 1, minWidth: 0},
  greeting: {
    ...PROVIDER_FONTS.label,
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.jade,
    textTransform: 'uppercase',
  },
  name: {
    ...PROVIDER_FONTS.title,
    fontSize: moderateScale(22),
    color: PROVIDER_THEME.ink,
    marginTop: moderateScale(2),
  },
  role: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(3),
    lineHeight: moderateScale(18),
  },
});
