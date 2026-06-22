import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {MapPin, ShieldCheck} from 'lucide-react-native';
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

export default function MarkArrivedModal({job, visible, onClose, onConfirm}: Props) {
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
        <Text style={styles.cancelText}>Not yet</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.confirmBtn, loading && styles.btnDisabled]}
        onPress={confirm}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmText}>Confirm arrival</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="At patient location?"
      subtitle="Patient app unlocks OTP step once you confirm you are at the address."
      footer={footer}>
      <View style={styles.iconRow}>
        <MapPin color={PROVIDER_THEME.jade} size={moderateScale(28)} />
        <View style={styles.copy}>
          <Text style={styles.name}>{job.patientName}</Text>
          <Text style={styles.addr} numberOfLines={3}>
            {job.location}
          </Text>
        </View>
      </View>
      <View style={styles.trust}>
        <ShieldCheck color={PROVIDER_THEME.jade} size={moderateScale(18)} />
        <Text style={styles.trustText}>
          Only confirm when you are at the doorstep. False arrival flags are reviewed
          by operations.
        </Text>
      </View>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  iconRow: {flexDirection: 'row', gap: moderateScale(14), marginBottom: moderateScale(14)},
  copy: {flex: 1},
  name: {fontSize: moderateScale(17), fontWeight: '800', color: PROVIDER_THEME.ink},
  addr: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
    lineHeight: moderateScale(19),
  },
  trust: {
    flexDirection: 'row',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  trustText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.ink,
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
  confirmBtn: {
    flex: 1.3,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jade,
    alignItems: 'center',
  },
  confirmText: {fontWeight: '800', color: '#FFF'},
  btnDisabled: {opacity: 0.7},
});
