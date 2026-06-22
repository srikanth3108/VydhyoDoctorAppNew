import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {MapPin, Clock, AlertCircle} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {Job, mockApi} from '../../../services/api';

import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';
import { DECLINE_REASONS, DeclineReasonCode, declineReasonLabel } from '../../../screens/constants/providerModals';

type Props = {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onDeclined: () => void;
};

export default function DeclineJobModal({
  job,
  visible,
  onClose,
  onDeclined,
}: Props) {
  const [selected, setSelected] = useState<DeclineReasonCode | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setSelected(null);
    setNote('');
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit =
    selected !== null && (selected !== 'other' || note.trim().length >= 3);

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    try {
      const reason = declineReasonLabel(selected, note);
      await mockApi.rejectJob(job.id, reason);
      Toast.show({
        type: 'success',
        text1: 'Offer declined',
        text2: 'Patient will be matched with another care pro nearby.',
      });
      reset();
      onDeclined();
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not decline',
        text2: 'Check connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={submitting}>
        <Text style={styles.cancelText}>Keep offer</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.declineBtn, !canSubmit && styles.btnDisabled]}
        onPress={submit}
        disabled={!canSubmit || submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.declineText}>Decline booking</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={handleClose}
      title="Decline home visit?"
      subtitle="Patient is notified in real time. Frequent declines may affect your dispatch score."
      footer={footer}
      tall>
      <View style={styles.jobCard}>
        <Text style={styles.patient}>{job.patientName}</Text>
        <Text style={styles.service}>{job.serviceType}</Text>
        <View style={styles.metaRow}>
          <Clock size={14} color={PROVIDER_THEME.textSoft} />
          <Text style={styles.meta}>
            {job.dateTime} · ₹{job.payout}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={PROVIDER_THEME.textSoft} />
          <Text style={styles.meta} numberOfLines={2}>
            {job.location}
          </Text>
        </View>
      </View>

      <View style={styles.notice}>
        <AlertCircle color={PROVIDER_THEME.amber} size={moderateScale(18)} />
        <Text style={styles.noticeText}>
          Select a reason. Operations uses this to improve matching and patient
          experience.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Why are you declining?</Text>
      {DECLINE_REASONS.map(r => {
        const active = selected === r.code;
        return (
          <TouchableOpacity
            key={r.code}
            style={[styles.reasonRow, active && styles.reasonRowOn]}
            onPress={() => setSelected(r.code)}
            activeOpacity={0.85}>
            <View style={[styles.radio, active && styles.radioOn]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
            <View style={styles.reasonCopy}>
              <Text style={[styles.reasonLabel, active && styles.reasonLabelOn]}>
                {r.label}
              </Text>
              <Text style={styles.reasonDesc}>{r.description}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {selected === 'other' ? (
        <TextInput
          style={styles.noteInput}
          placeholder="Brief note (min. 3 characters)"
          placeholderTextColor={PROVIDER_THEME.textSoft}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={200}
        />
      ) : null}
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  jobCard: {
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  patient: {fontSize: moderateScale(17), fontWeight: '800', color: PROVIDER_THEME.ink},
  service: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.jade,
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  metaRow: {flexDirection: 'row', gap: 8, marginTop: moderateScale(8), alignItems: 'flex-start'},
  meta: {flex: 1, fontSize: moderateScale(12), color: PROVIDER_THEME.textMuted},
  notice: {
    flexDirection: 'row',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.amberSoft,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  noticeText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.ink,
    lineHeight: moderateScale(17),
  },
  sectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: PROVIDER_THEME.textSoft,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: moderateScale(10),
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(8),
    backgroundColor: PROVIDER_THEME.pearl,
  },
  reasonRowOn: {
    borderColor: PROVIDER_THEME.jade,
    backgroundColor: PROVIDER_THEME.jadeMuted,
  },
  radio: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOn: {borderColor: PROVIDER_THEME.jade},
  radioDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: 6,
    backgroundColor: PROVIDER_THEME.jade,
  },
  reasonCopy: {flex: 1},
  reasonLabel: {fontSize: moderateScale(14), fontWeight: '700', color: PROVIDER_THEME.ink},
  reasonLabelOn: {color: PROVIDER_THEME.jadeDeep},
  reasonDesc: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(3),
    lineHeight: moderateScale(16),
  },
  noteInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    minHeight: moderateScale(72),
    textAlignVertical: 'top',
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.ink,
    marginBottom: moderateScale(8),
    backgroundColor: PROVIDER_THEME.pearlMuted,
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
  declineBtn: {
    flex: 1.2,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.rose,
    alignItems: 'center',
  },
  declineText: {fontWeight: '800', color: '#FFF'},
  btnDisabled: {opacity: 0.45},
});
