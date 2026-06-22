import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {Bell, Menu, ChevronLeft} from 'lucide-react-native';
import ProviderBrandMark from './ProviderBrandMark';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {useSideMenu} from '../../context/ProviderSideMenuContext';
import {moderateScale} from '../../utils/responsive';

type Props = {
  incomingCount?: number;
  onNotifications?: () => void;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
};

/** Slim ink bar — brand + actions only */
export default function ProviderTopBar({
  incomingCount = 0,
  onNotifications,
  rightSlot,
  onBack,
}: Props) {
  const {openMenu} = useSideMenu();

  return (
    <View style={styles.row}>
      <View style={styles.leftContainer}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <ChevronLeft color={PROVIDER_THEME.navy} size={moderateScale(24)} strokeWidth={2.4} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={openMenu}
          activeOpacity={0.7}
          style={styles.menuBtn}
        >
          <Menu color={PROVIDER_THEME.navy} size={moderateScale(20)} strokeWidth={2.4} />
        </TouchableOpacity>
        <ProviderBrandMark />
      </View>
      <View style={styles.actions}>
        {rightSlot}
        <TouchableOpacity
          style={styles.bell}
          onPress={onNotifications}
          activeOpacity={0.88}
          disabled={!onNotifications}>
          <Bell color={PROVIDER_THEME.navy} size={moderateScale(20)} strokeWidth={2.2} />
          {incomingCount > 0 ? <View style={styles.badge} /> : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  menuBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  bell: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PROVIDER_THEME.amber,
  },
  backBtn: {
    paddingRight: moderateScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
