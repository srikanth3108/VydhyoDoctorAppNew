import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {MapPin, Clock, Navigation, Shield, User} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {Job, mockApi} from '../../../services/api';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

type Props = {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onAccepted: (jobId: string) => void;
  videoUnlocked: boolean;
};

export default function AcceptJobModal({
  job,
  visible,
  onClose,
  onAccepted,
  videoUnlocked,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const accept = async () => {
    setSubmitting(true);
    try {
      await mockApi.acceptJob(job.id);
      Toast.show({
        type: 'success',
        text1: 'Visit accepted',
        text2: 'Patient sees you en route. Open navigation when ready.',
      });
      onAccepted(job.id);
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Booking failed',
        text2: 'Another provider may have taken this offer.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerCol}>
      {!videoUnlocked ? (
        <Text style={styles.pathwayNote}>
          First visit is in-home only. Video follow-up unlocks after you complete
          this visit.
        </Text>
      ) : null}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
          <Text style={styles.cancelText}>Not now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, submitting && styles.btnDisabled]}
          onPress={accept}
          disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Navigation color="#FFF" size={moderateScale(18)} />
              <Text style={styles.acceptText}>Accept & navigate</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Accept home visit?"
      subtitle="Patient receives your profile and live ETA once you confirm."
      footer={footer}>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <User color={PROVIDER_THEME.jade} size={moderateScale(24)} />
        </View>
        <View style={styles.heroText}>
          <Text style={styles.name}>{job.patientName}</Text>
          <Text style={styles.service}>{job.serviceType}</Text>
        </View>
        <View style={styles.payoutBox}>
          <Text style={styles.payoutLabel}>You earn</Text>
          <Text style={styles.payout}>₹{job.payout}</Text>
        </View>
      </View>

      <View style={styles.detail}>
        <Clock size={16} color={PROVIDER_THEME.jade} />
        <Text style={styles.detailText}>
          {job.dateTime} · {job.duration}
        </Text>
      </View>
      <View style={styles.detail}>
        <MapPin size={16} color={PROVIDER_THEME.jade} />
        <Text style={styles.detailText}>{job.location}</Text>
      </View>

      <View style={styles.trust}>
        <Shield color={PROVIDER_THEME.jade} size={moderateScale(18)} />
        <Text style={styles.trustText}>
          OTP verification required at patient home. Clinical notes and payout
          release after visit checkout.
        </Text>
      </View>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  avatar: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(16),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {flex: 1, minWidth: 0},
  name: {fontSize: moderateScale(18), fontWeight: '800', color: PROVIDER_THEME.ink},
  service: {fontSize: moderateScale(14), color: PROVIDER_THEME.jade, fontWeight: '600'},
  payoutBox: {alignItems: 'flex-end'},
  payoutLabel: {fontSize: moderateScale(10), color: PROVIDER_THEME.textSoft, fontWeight: '700'},
  payout: {fontSize: moderateScale(22), fontWeight: '800', color: PROVIDER_THEME.amber},
  detail: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
    alignItems: 'flex-start',
  },
  detailText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(19),
  },
  trust: {
    flexDirection: 'row',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
  },
  trustText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.ink,
    lineHeight: moderateScale(17),
  },
  footerCol: {gap: moderateScale(10)},
  pathwayNote: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    textAlign: 'center',
    lineHeight: moderateScale(17),
  },
  footerRow: {flexDirection: 'row', gap: moderateScale(10)},
  cancelBtn: {
    flex: 1,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    alignItems: 'center',
  },
  cancelText: {fontWeight: '700', color: PROVIDER_THEME.textMuted},
  acceptBtn: {
    flex: 1.4,
    flexDirection: 'row',
    gap: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jade,
  },
  acceptText: {fontWeight: '800', color: '#FFF', fontSize: moderateScale(14)},
  btnDisabled: {opacity: 0.7},
});
