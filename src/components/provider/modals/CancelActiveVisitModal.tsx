import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {AlertTriangle} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import {Job, mockApi} from '../../../services/api';
import { CANCEL_VISIT_REASONS, CancelVisitReasonCode, cancelReasonLabel } from '../../../screens/constants/providerModals';  
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

type Props = {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onCancelled: () => void;
};

export default function CancelActiveVisitModal({
  job,
  visible,
  onClose,
  onCancelled,
}: Props) {
  const [selected, setSelected] = useState<CancelVisitReasonCode | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    selected !== null && (selected !== 'other' || note.trim().length >= 3);

  const submit = async () => {
    if (!selected || !canSubmit) return;
    setSubmitting(true);
    try {
      const reason = cancelReasonLabel(selected, note);
      await mockApi.cancelActiveVisit(job.id, reason);
      Toast.show({
        type: 'info',
        text1: 'Visit cancelled',
        text2: 'Patient and operations have been notified.',
      });
      onCancelled();
      onClose();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Could not cancel',
        text2: 'Try again or contact support.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
        <Text style={styles.cancelText}>Keep visit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.dangerBtn, !canSubmit && styles.btnDisabled]}
        onPress={submit}
        disabled={!canSubmit || submitting}>
        {submitting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.dangerText}>Cancel visit</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Cancel active visit?"
      subtitle="Use only when you cannot complete care. This may affect your reliability score."
      footer={footer}
      tall>
      <View style={styles.warn}>
        <AlertTriangle color={PROVIDER_THEME.amber} size={moderateScale(18)} />
        <Text style={styles.warnText}>
          {job.patientName} · {job.serviceType}
        </Text>
      </View>
      {CANCEL_VISIT_REASONS.map(r => {
        const active = selected === r.code;
        return (
          <TouchableOpacity
            key={r.code}
            style={[styles.reasonRow, active && styles.reasonRowOn]}
            onPress={() => setSelected(r.code)}>
            <View style={[styles.radio, active && styles.radioOn]}>
              {active ? <View style={styles.radioDot} /> : null}
            </View>
            <Text style={[styles.reasonLabel, active && styles.reasonLabelOn]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      {selected === 'other' ? (
        <TextInput
          style={styles.noteInput}
          placeholder="Brief note for operations"
          placeholderTextColor={PROVIDER_THEME.textSoft}
          value={note}
          onChangeText={setNote}
          multiline
        />
      ) : null}
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  warn: {
    flexDirection: 'row',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.amberSoft,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  warnText: {flex: 1, fontSize: moderateScale(13), color: PROVIDER_THEME.ink, fontWeight: '600'},
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(8),
  },
  reasonRowOn: {
    borderColor: PROVIDER_THEME.rose,
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  radio: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PROVIDER_THEME.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {borderColor: PROVIDER_THEME.rose},
  radioDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: 5,
    backgroundColor: PROVIDER_THEME.rose,
  },
  reasonLabel: {flex: 1, fontSize: moderateScale(14), fontWeight: '600', color: PROVIDER_THEME.ink},
  reasonLabelOn: {color: PROVIDER_THEME.rose},
  noteInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    minHeight: moderateScale(64),
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.ink,
    marginBottom: moderateScale(8),
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
  dangerBtn: {
    flex: 1.2,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.rose,
    alignItems: 'center',
  },
  dangerText: {fontWeight: '800', color: '#FFF'},
  btnDisabled: {opacity: 0.45},
});
