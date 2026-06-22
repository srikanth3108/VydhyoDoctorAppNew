import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Clock, MapPin, Zap, Lock} from 'lucide-react-native';
import {Job} from '../../services/api';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';
import VideoCallButton from './VideoCallButton';

type Props = {
  job: Job;
  onAccept: () => void;
  onReject: () => void;
  onVideoCall?: () => void;
  videoUnlocked?: boolean;
};

export default function JobOfferCard({
  job,
  onAccept,
  onReject,
  onVideoCall,
  videoUnlocked = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.liveRibbon}>
        <Zap size={12} color="#FFF" fill="#FFF" />
        <Text style={styles.liveText}>LIVE OFFER</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.patientCol}>
            <Text style={styles.name}>{job.patientName}</Text>
            <Text style={styles.service}>{job.serviceType}</Text>
          </View>
          <View style={styles.payoutBox}>
            <Text style={styles.payoutLabel}>Earn</Text>
            <Text style={styles.payout}>₹{job.payout}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Clock size={14} color={PROVIDER_THEME.textSoft} />
          <Text style={styles.meta}>
            {job.dateTime} · {job.duration}
          </Text>
        </View>
        <View style={styles.row}>
          <MapPin size={14} color={PROVIDER_THEME.textSoft} />
          <Text style={styles.meta} numberOfLines={2}>
            {job.location}
          </Text>
        </View>
        {onVideoCall ? (
          <VideoCallButton
            label="Video follow-up"
            variant="outline"
            onPress={onVideoCall}
            style={styles.videoBtn}
          />
        ) : !videoUnlocked ? (
          <View style={styles.lockedRow}>
            <Lock color={PROVIDER_THEME.textSoft} size={moderateScale(14)} />
            <Text style={styles.lockedText}>
              Home visit first — video unlocks after completion.
            </Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.reject} onPress={onReject} activeOpacity={0.85}>
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accept} onPress={onAccept} activeOpacity={0.85}>
            <Text style={styles.acceptText}>Accept visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: moderateScale(14),
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    backgroundColor: PROVIDER_THEME.surface,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    overflow: 'hidden',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  liveRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: PROVIDER_THEME.amber,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(7),
    borderBottomRightRadius: moderateScale(14),
  },
  liveText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  body: {
    padding: moderateScale(18),
    paddingTop: moderateScale(14),
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: moderateScale(12),
  },
  patientCol: {flex: 1, minWidth: 0},
  name: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.4,
  },
  service: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.primary,
    marginTop: moderateScale(4),
    fontWeight: '700',
  },
  payoutBox: {
    alignItems: 'flex-end',
    backgroundColor: PROVIDER_THEME.pearlMuted,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  payoutLabel: {
    fontSize: moderateScale(9),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  payout: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: PROVIDER_THEME.amber,
    letterSpacing: -0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: moderateScale(10),
    alignItems: 'flex-start',
  },
  meta: {
    flex: 1,
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(19),
  },
  videoBtn: {marginTop: moderateScale(14)},
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(14),
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(230, 138, 46, 0.2)',
  },
  lockedText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(17),
  },
  actions: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginTop: moderateScale(18),
    alignItems: 'center',
  },
  reject: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.borderStrong,
    backgroundColor: PROVIDER_THEME.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    fontWeight: '700',
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.textMuted,
  },
  accept: {
    flex: 1.35,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  acceptText: {
    fontWeight: '800',
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
});
