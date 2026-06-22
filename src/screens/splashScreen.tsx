import React, {useCallback, useEffect} from 'react';
import { Image, TouchableOpacity , StyleSheet, Platform
} from 'react-native';
import { useNavigation} from '@react-navigation/native';

// Import responsive utilities
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  hasNotch,
  isLandscape,
  PLATFORM,
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  GRID,
  responsive,
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  scale,
  verticalScale,
  moderateScale,
  HIT_SLOP,
} from '../utility/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
        const storedToken = await AsyncStorage.getItem('authToken');
      // here we need to check platform and navigate accordingly

        if (Platform.OS === "ios" && !storedToken) {
        navigation.navigate('DoctorDashboard');
        return;
      }

    navigation.navigate('Authloader');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleLogin();
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timeout); // cleanup if component unmounts
  }, []);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleLogin} 
      activeOpacity={0.9}
    >
      <Image
        source={require('../assets/doclogo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom,
    paddingTop: SAFE_AREA.safeTop,
  },
  logo: {
    width: isTablet ? responsiveWidth(50) : responsiveWidth(60),
    height: isTablet ? responsiveWidth(50) : responsiveWidth(60),
    maxWidth: moderateScale(400),
    maxHeight: moderateScale(400),
    // Add minimum size for very small screens
    minWidth: moderateScale(120),
    minHeight: moderateScale(120),
  },
});

export default SplashScreen;