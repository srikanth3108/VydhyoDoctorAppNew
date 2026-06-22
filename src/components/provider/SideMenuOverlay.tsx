import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Calendar,
  Lock,
  BarChart2,
  CreditCard,
  Users,
  LogOut,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProviderStackParamList} from '../../navigation/types';
import {useSideMenu} from '../../context/ProviderSideMenuContext';
import {useProviderDuty} from '../../context/ProviderDutyContext';
import {useProviderModal} from '../../context/ProviderModalContext';
import {logout, getProviderRole} from '../../services/authSession';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export default function SideMenuOverlay() {
  const {isOpen, closeMenu} = useSideMenu();
  const {isOnline} = useProviderDuty();
  const {showLogoutConfirm} = useProviderModal();
  const navigation = useNavigation<NativeStackNavigationProp<ProviderStackParamList>>();
  
  const [shouldRender, setShouldRender] = useState(false);
  const [roleTitle, setRoleTitle] = useState('Home care provider');
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Sync drawer animations with isOpen state
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Load current role configuration dynamically
      getProviderRole().then(role => {
        if (role) {
          const capitalized = role.charAt(0).toUpperCase() + role.slice(1);
          setRoleTitle(`${capitalized} Partner`);
        }
      });
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          setShouldRender(false);
        }
      });
    }
  }, [isOpen, slideAnim]);

  if (!shouldRender) return null;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_WIDTH, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const handleNavigate = (screenName: keyof ProviderStackParamList) => {
    closeMenu();
    // Use setTimeout to allow the menu close animation to play smoothly before pushing screen
    setTimeout(() => {
      navigation.navigate(screenName as any);
    }, 100);
  };

  const handleLogout = () => {
    closeMenu();
    setTimeout(() => {
      showLogoutConfirm(() => {
        logout();
      });
    }, 100);
  };

  const menuItems = [
    {
      name: 'Availability',
      label: 'My Availability',
      icon: Calendar,
      screen: 'ProviderAvailability',
    },
    {
      name: 'PinManagement',
      label: 'Security & PIN',
      icon: Lock,
      screen: 'ProviderPinManagement',
    },
    {
      name: 'Reports',
      label: 'Clinical Reports',
      icon: BarChart2,
      screen: 'Reports',
    },
    {
      name: 'Settlements',
      label: 'Settlements & Bank',
      icon: CreditCard,
      screen: 'Settlements',
    },
    {
      name: 'MyPatients',
      label: 'Patient Directory',
      icon: Users,
      screen: 'MyPatients',
    },
    {
      name: 'AddressUpdate',
      label: 'Update Address',
      icon: MapPin,
      screen: 'AddressUpdate',
    },
  ];

  return (
    <Modal
      transparent
      visible={true}
      onRequestClose={closeMenu}
      animationType="none"
    >
      <View style={styles.container}>
        {/* Semi-transparent Backdrop */}
        <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View style={styles.backdropPressable} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Sliding Menu content */}
        <Animated.View style={[styles.drawer, {transform: [{translateX}]}]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.drawerHeader}>
              <View style={styles.brandContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>VCP</Text>
                </View>
                <View style={styles.brandDetails}>
                  <Text style={styles.brandName}>VYDHYO CARE</Text>
                  <Text style={styles.brandSubtitle}>{roleTitle}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeMenu} style={styles.closeBtn} activeOpacity={0.8}>
                <X color="#FFFFFF" size={moderateScale(20)} />
              </TouchableOpacity>
            </View>

            {/* Duty status banner */}
            <View style={styles.statusBanner}>
              <View style={[styles.statusIndicator, isOnline ? styles.indicatorOnline : styles.indicatorOffline]} />
              <Text style={styles.statusText}>
                Duty Status: <Text style={isOnline ? styles.boldOnline : styles.boldOffline}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Nav list */}
            <View style={styles.menuContainer}>
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.menuItem}
                    onPress={() => handleNavigate(item.screen as any)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.iconWrapper}>
                        <Icon color="#E0F7E9" size={moderateScale(20)} />
                      </View>
                      <Text style={styles.menuItemText}>{item.label}</Text>
                    </View>
                    <ChevronRight color="rgba(255, 255, 255, 0.4)" size={moderateScale(18)} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Footer containing App version & Logout button */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={handleLogout}
                activeOpacity={0.8}
              >
                <LogOut color={PROVIDER_THEME.error} size={moderateScale(18)} />
                <Text style={styles.logoutText}>Sign out of Duty</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Partner app v1.4.2</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1D3557',
  },
  backdropPressable: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#1D3557',
    borderTopRightRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    ...PROVIDER_THEME.shadowStyles.float,
  },
  safeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(12),
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  avatarCircle: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: '#3D6A9B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C5EBD8',
  },
  avatarText: {
    color: '#E0F7E9',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  brandDetails: {
    justifyContent: 'center',
  },
  brandName: {
    fontSize: moderateScale(14),
    fontWeight: '900',
    color: '#E0F7E9',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: moderateScale(11),
    color: 'rgba(224, 247, 233, 0.7)',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(12),
    marginTop: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: moderateScale(8),
  },
  indicatorOnline: {
    backgroundColor: '#3D6A9B',
  },
  indicatorOffline: {
    backgroundColor: PROVIDER_THEME.error,
  },
  statusText: {
    fontSize: moderateScale(12),
    color: '#E0F7E9',
    fontWeight: '500',
  },
  boldOnline: {
    fontWeight: '800',
    color: '#C5EBD8',
  },
  boldOffline: {
    fontWeight: '800',
    color: PROVIDER_THEME.error,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: moderateScale(20),
    marginVertical: moderateScale(16),
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(12),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(4),
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  iconWrapper: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(224, 247, 233, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  drawerFooter: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    backgroundColor: 'rgba(220, 74, 104, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(220, 74, 104, 0.18)',
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    marginBottom: moderateScale(16),
  },
  logoutText: {
    color: PROVIDER_THEME.error,
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  versionText: {
    textAlign: 'center',
    fontSize: moderateScale(11),
    color: 'rgba(224, 247, 233, 0.4)',
    fontWeight: '500',
  },
});
