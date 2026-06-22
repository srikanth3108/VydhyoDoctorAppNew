import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  LogOut,
  Video,
  Wallet,
} from 'lucide-react-native';
import type {ConfirmModalPayload} from '../../../constants/providerModals';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

const ICONS = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  logout: LogOut,
  video: Video,
  wallet: Wallet,
};

const ICON_COLORS = {
  warning: PROVIDER_THEME.amber,
  success: PROVIDER_THEME.jade,
  info: PROVIDER_THEME.jade,
  logout: PROVIDER_THEME.rose,
  video: PROVIDER_THEME.violet,
  wallet: PROVIDER_THEME.jade,
};

type Props = {
  visible: boolean;
  payload: ConfirmModalPayload | null;
  onClose: () => void;
};

export default function ConfirmActionModal({visible, payload, onClose}: Props) {
  const [loading, setLoading] = useState(false);

  if (!payload) return null;

  const Icon = ICONS[payload.icon ?? 'info'];
  const iconColor = ICON_COLORS[payload.icon ?? 'info'];

  const confirm = async () => {
    setLoading(true);
    try {
      await payload.onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={onClose}
        disabled={loading}>
        <Text style={styles.cancelText}>{payload.cancelLabel ?? 'Cancel'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.confirmBtn,
          payload.destructive && styles.destructiveBtn,
          loading && styles.btnDisabled,
        ]}
        onPress={confirm}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.confirmText}>
            {payload.confirmLabel ?? 'Confirm'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title={payload.title}
      footer={footer}>
      <View style={styles.iconWrap}>
        <Icon color={iconColor} size={moderateScale(32)} />
      </View>
      <Text style={styles.message}>{payload.message}</Text>
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignSelf: 'center',
    width: moderateScale(64),
    height: moderateScale(64),
    borderRadius: moderateScale(20),
    backgroundColor: PROVIDER_THEME.pearlMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(16),
  },
  message: {
    fontSize: moderateScale(15),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(22),
    textAlign: 'center',
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
  confirmBtn: {
    flex: 1.2,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: PROVIDER_THEME.jade,
    alignItems: 'center',
  },
  destructiveBtn: {backgroundColor: PROVIDER_THEME.rose},
  confirmText: {fontWeight: '800', color: '#FFF'},
  btnDisabled: {opacity: 0.7},
});
