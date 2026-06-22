import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import {Video, View} from 'lucide-react-native';
import {moderateScale} from '../../utils/responsive';
import {PROVIDER_THEME} from '../../theme/providerTheme';

type Props = {
  label?: string;
  onPress: () => void;
  variant?: 'filled' | 'outline' | 'compact';
  style?: ViewStyle;
};

export default function VideoCallButton({
  label = 'Video call',
  onPress,
  variant = 'filled',
  style,
}: Props) {
  const isFilled = variant === 'filled';
  const isCompact = variant === 'compact';

  return (
   <View></View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    borderRadius: moderateScale(PROVIDER_THEME.radius.pill),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(18),
  },
  filled: {
    backgroundColor: PROVIDER_THEME.violet,
    ...PROVIDER_THEME.shadowStyles.card,
  },
  outline: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: PROVIDER_THEME.violet,
  },
  compact: {
    width: moderateScale(44),
    height: moderateScale(44),
    padding: 0,
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  text: {fontWeight: '800', fontSize: moderateScale(14)},
  textFilled: {color: '#FFFFFF'},
  textOutline: {color: PROVIDER_THEME.violet},
});
