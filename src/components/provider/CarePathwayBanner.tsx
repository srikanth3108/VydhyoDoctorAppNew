import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Home, Video, Lock} from 'lucide-react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type Props = {
  homeVisitDone: boolean;
};

export default function CarePathwayBanner({homeVisitDone}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Care pathway</Text>
      <View style={styles.track}>
        <View style={styles.node}>
          <View style={[styles.circle, styles.circleDone]}>
            <Home color="#FFF" size={moderateScale(16)} />
          </View>
          <Text style={styles.nodeLabel}>Home visit</Text>
        </View>
        <View style={[styles.line, homeVisitDone && styles.lineDone]} />
        <View style={styles.node}>
          <View
            style={[
              styles.circle,
              homeVisitDone ? styles.circleDone : styles.circleLock,
            ]}>
            {homeVisitDone ? (
              <Video color="#FFF" size={moderateScale(16)} />
            ) : (
              <Lock color={PROVIDER_THEME.textSoft} size={moderateScale(14)} />
            )}
          </View>
          <Text style={[styles.nodeLabel, !homeVisitDone && styles.nodeMuted]}>
            Video care
          </Text>
        </View>
      </View>
      <Text style={styles.note}>
        {homeVisitDone
          ? 'Telehealth is available for follow-up visits.'
          : 'Complete the first home visit to unlock video consultations.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: PROVIDER_THEME.navy,
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    padding: moderateScale(18),
    marginBottom: moderateScale(14),
    ...PROVIDER_THEME.shadowStyles.float,
  },
  title: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: moderateScale(14),
  },
  track: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  node: {alignItems: 'center', width: moderateScale(88)},
  circle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDone: {backgroundColor: PROVIDER_THEME.jade},
  circleLock: {backgroundColor: 'rgba(255,255,255,0.1)'},
  nodeLabel: {
    marginTop: moderateScale(8),
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  nodeMuted: {color: 'rgba(255,255,255,0.4)'},
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: moderateScale(22),
    maxWidth: moderateScale(48),
  },
  lineDone: {backgroundColor: PROVIDER_THEME.mint},
  note: {
    marginTop: moderateScale(14),
    fontSize: moderateScale(12),
    color: 'rgba(255,255,255,0.7)',
    lineHeight: moderateScale(18),
    textAlign: 'center',
  },
});
