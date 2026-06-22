import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import {Phone, MessageCircle, Shield} from 'lucide-react-native';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

const HOTLINE = '18002022027';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function SupportHotlineModal({visible, onClose}: Props) {
  const call = () => {
    Linking.openURL(`tel:${HOTLINE}`);
    onClose();
  };

  const sms = () => {
    Linking.openURL(`sms:+91${HOTLINE}`);
    onClose();
  };

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="24×7 operations desk"
      subtitle="For emergencies during an active visit, call immediately.">
      <TouchableOpacity style={styles.action} onPress={call}>
        <Phone color={PROVIDER_THEME.jade} size={moderateScale(22)} />
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>Call hotline</Text>
          <Text style={styles.actionSub}>1800-202-CARE</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={sms}>
        <MessageCircle color={PROVIDER_THEME.jade} size={moderateScale(22)} />
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>Message dispatch</Text>
          <Text style={styles.actionSub}>Share visit ID & location</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.note}>
        <Shield color={PROVIDER_THEME.textSoft} size={moderateScale(16)} />
        <Text style={styles.noteText}>
          All calls are recorded for patient safety and quality review.
        </Text>
      </View>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(14),
    padding: moderateScale(16),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(10),
    backgroundColor: PROVIDER_THEME.pearlMuted,
  },
  actionText: {flex: 1},
  actionLabel: {fontSize: moderateScale(15), fontWeight: '700', color: PROVIDER_THEME.ink},
  actionSub: {fontSize: moderateScale(12), color: PROVIDER_THEME.textMuted, marginTop: 2},
  note: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  noteText: {
    flex: 1,
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    lineHeight: moderateScale(16),
  },
});
