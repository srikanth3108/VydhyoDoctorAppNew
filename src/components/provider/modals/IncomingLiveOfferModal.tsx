import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {MapPin, Clock, Zap} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {Job, mockApi} from '../../../services/api';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';
import { LIVE_OFFER_SECONDS } from '../../../screens/constants/providerModals';

type Props = {
  job: Job;
  visible: boolean;
  expiresAt: number;
  onClose: () => void;
  onAccept: (job: Job) => void;
  onDecline: (job: Job) => void;
  onExpired: () => void;
};

export default function IncomingLiveOfferModal({
  job,
  visible,
  expiresAt,
  onClose,
  onAccept,
  onDecline,
  onExpired,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(LIVE_OFFER_SECONDS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        onExpired();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [visible, expiresAt, onExpired]);

  const timerPct = secondsLeft / LIVE_OFFER_SECONDS;

  const footer = (
    <View style={styles.footerCol}>
      <TouchableOpacity
        style={styles.declineOutline}
        onPress={() => onDecline(job)}
        disabled={busy}>
        <Text style={styles.declineOutlineText}>Decline</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.acceptPulse, busy && styles.btnDisabled]}
        onPress={async () => {
          setBusy(true);
          try {
            await mockApi.acceptJob(job.id);
            Toast.show({
              type: 'success',
              text1: 'Booking secured',
              text2: 'Open navigation when you are ready to leave.',
            });
            onAccept(job);
            onClose();
          } catch {
            Toast.show({
              type: 'error',
              text1: 'Offer taken',
              text2: 'Another care pro accepted this visit.',
            });
            onClose();
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy || secondsLeft <= 0}>
        {busy ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Zap color="#FFF" size={moderateScale(18)} fill="#FFF" />
            <Text style={styles.acceptText}>Accept in {secondsLeft}s</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Live booking"
      subtitle="Respond before the offer routes to another provider nearby."
      footer={footer}>
      <View style={styles.timerTrack}>
        <View style={[styles.timerFill, {width: `${timerPct * 100}%`}]} />
      </View>
      <Text style={styles.timerLabel}>
        {secondsLeft > 0
          ? `Auto-decline in ${secondsLeft}s if you do not respond`
          : 'Offer expired — matching another provider'}
      </Text>

      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>PATIENT WAITING</Text>
      </View>

      <Text style={styles.patient}>{job.patientName}</Text>
      <Text style={styles.service}>{job.serviceType}</Text>
      <View style={styles.metaRow}>
        <Clock size={14} color={PROVIDER_THEME.jade} />
        <Text style={styles.meta}>
          {job.dateTime} · {job.duration}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <MapPin size={14} color={PROVIDER_THEME.jade} />
        <Text style={styles.meta} numberOfLines={2}>
          {job.location}
        </Text>
      </View>
      <View style={styles.payoutRow}>
        <Text style={styles.payoutLabel}>Your payout</Text>
        <Text style={styles.payout}>₹{job.payout}</Text>
      </View>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  timerTrack: {
    height: moderateScale(6),
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: moderateScale(8),
  },
  timerFill: {
    height: '100%',
    backgroundColor: PROVIDER_THEME.amber,
    borderRadius: 3,
  },
  timerLabel: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    marginBottom: moderateScale(14),
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PROVIDER_THEME.rose,
  },
  liveText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.rose,
    letterSpacing: 0.8,
  },
  patient: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  service: {
    fontSize: moderateScale(15),
    color: PROVIDER_THEME.jade,
    fontWeight: '600',
    marginTop: moderateScale(4),
    marginBottom: moderateScale(12),
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: moderateScale(8),
    alignItems: 'flex-start',
  },
  meta: {flex: 1, fontSize: moderateScale(13), color: PROVIDER_THEME.textMuted},
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(12),
    padding: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    borderRadius: moderateScale(14),
  },
  payoutLabel: {fontSize: moderateScale(12), fontWeight: '700', color: PROVIDER_THEME.ink},
  payout: {fontSize: moderateScale(24), fontWeight: '800', color: PROVIDER_THEME.amber},
  footerCol: {gap: moderateScale(10)},
  declineOutline: {
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  declineOutlineText: {fontWeight: '700', color: PROVIDER_THEME.textMuted},
  acceptPulse: {
    flexDirection: 'row',
    gap: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(16),
    backgroundColor: PROVIDER_THEME.jade,
  },
  acceptText: {fontWeight: '800', color: '#FFF', fontSize: moderateScale(15)},
  btnDisabled: {opacity: 0.6},
});
