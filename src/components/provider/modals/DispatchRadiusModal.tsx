import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Compass} from 'lucide-react-native';
import ProviderBottomSheet from './ProviderBottomSheet';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

const OPTIONS = [10, 15, 20, 30];

type Props = {
  visible: boolean;
  currentKm: number;
  onClose: () => void;
  onSelect: (km: number) => void;
};

export default function DispatchRadiusModal({
  visible,
  currentKm,
  onClose,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState(currentKm);

  const footer = (
    <TouchableOpacity
      style={styles.saveBtn}
      onPress={() => {
        onSelect(selected);
        onClose();
      }}>
      <Text style={styles.saveText}>Save radius</Text>
    </TouchableOpacity>
  );

  return (
    <ProviderBottomSheet
      visible={visible}
      onClose={onClose}
      title="Dispatch radius"
      subtitle="Only patients within this distance can send you live offers."
      footer={footer}>
      <View style={styles.iconRow}>
        <Compass color={PROVIDER_THEME.jade} size={moderateScale(28)} />
        <Text style={styles.current}>{selected} km from your location</Text>
      </View>
      {OPTIONS.map(km => {
        const active = selected === km;
        return (
          <TouchableOpacity
            key={km}
            style={[styles.option, active && styles.optionOn]}
            onPress={() => setSelected(km)}>
            <Text style={[styles.optionText, active && styles.optionTextOn]}>
              {km} km{km === 15 ? ' · Recommended' : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ProviderBottomSheet>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    marginBottom: moderateScale(16),
    justifyContent: 'center',
  },
  current: {fontSize: moderateScale(16), fontWeight: '700', color: PROVIDER_THEME.ink},
  option: {
    padding: moderateScale(16),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(8),
    alignItems: 'center',
  },
  optionOn: {
    borderColor: PROVIDER_THEME.jade,
    backgroundColor: PROVIDER_THEME.jadeMuted,
  },
  optionText: {fontSize: moderateScale(15), fontWeight: '600', color: PROVIDER_THEME.textMuted},
  optionTextOn: {color: PROVIDER_THEME.jadeDeep, fontWeight: '800'},
  saveBtn: {
    backgroundColor: PROVIDER_THEME.jade,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(14),
    alignItems: 'center',
  },
  saveText: {fontWeight: '800', color: '#FFF'},
});
