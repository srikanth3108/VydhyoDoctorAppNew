import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {CheckCircle, FileText} from 'lucide-react-native';
import {Job} from '../../../services/api';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

type Props = {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function CompleteVisitModal({
  job,
  visible,
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <TouchableOpacity
      style={[styles.btn, loading && styles.btnDisabled]}
      onPress={submit}
      disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <>
          <CheckCircle color="#FFF" size={moderateScale(20)} />
          <Text style={styles.btnText}>Complete & submit records</Text>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Complete home visit?"
      subtitle="Patient app receives your notes and prescription. Earnings move to pending wallet."
      footer={footer}>
      <View style={styles.card}>
        <Text style={styles.patient}>{job.patientName}</Text>
        <Text style={styles.service}>{job.serviceType}</Text>
      </View>
      <View style={styles.checklist}>
        <View style={styles.checkRow}>
          <CheckCircle color={PROVIDER_THEME.jade} size={18} />
          <Text style={styles.checkText}>OTP verified at patient location</Text>
        </View>
        <View style={styles.checkRow}>
          <FileText color={PROVIDER_THEME.jade} size={18} />
          <Text style={styles.checkText}>Clinical notes & handoff saved</Text>
        </View>
        <View style={styles.checkRow}>
          <CheckCircle color={PROVIDER_THEME.jade} size={18} />
          <Text style={styles.checkText}>
            ₹{job.payout} credited to pending balance
          </Text>
        </View>
      </View>
      <Text style={styles.hint}>
        You must finish the post-visit learning module before your next booking.
      </Text>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PROVIDER_THEME.pearlMuted,
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(14),
  },
  patient: {fontSize: moderateScale(17), fontWeight: '800', color: PROVIDER_THEME.ink},
  service: {fontSize: moderateScale(14), color: PROVIDER_THEME.jade, marginTop: 4},
  checklist: {gap: moderateScale(10), marginBottom: moderateScale(12)},
  checkRow: {flexDirection: 'row', alignItems: 'center', gap: moderateScale(10)},
  checkText: {flex: 1, fontSize: moderateScale(13), color: PROVIDER_THEME.ink},
  hint: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(17),
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    gap: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.jade,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
  },
  btnText: {fontWeight: '800', color: '#FFF', fontSize: moderateScale(15)},
  btnDisabled: {opacity: 0.7},
});
