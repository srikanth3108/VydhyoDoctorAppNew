// utility/responsive.ts

import { Dimensions, Platform } from 'react-native';

/* =========================================================
   SCREEN DIMENSIONS
========================================================= */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

const { width: SCREEN_WIDTH_FULL, height: SCREEN_HEIGHT_FULL } =
  Dimensions.get('screen');

/* =========================================================
   REFERENCE DEVICES
========================================================= */

const REFERENCE = {
  PHONE: {
    width: 375,
    height: 812,
  },

  TABLET: {
    width: 768,
    height: 1024,
  },
};

/* =========================================================
   DEVICE TYPES
========================================================= */

const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

const isTablet = SCREEN_WIDTH >= 768;
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

const isSmallDevice = SCREEN_HEIGHT < 700;
const isExtraSmallDevice = SCREEN_WIDTH < 375;
const isLargeDevice = SCREEN_WIDTH > 428;

const hasNotch =
  isIOS && (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812);

const isIPad = isIOS && isTablet;
const isAndroidTablet = isAndroid && isTablet;

/* =========================================================
   SAFE AREAS
========================================================= */

const getDynamicTopSafeArea = (): number => {
  if (isIOS) {
    return hasNotch ? 44 : 20;
  }

  if (isAndroid) {
    return Platform.Version >= 23 ? 24 : 25;
  }

  return 0;
};

const getDynamicBottomSafeArea = (): number => {
  if (isIOS) {
    return hasNotch ? 34 : 0;
  }

  if (isAndroid) {
    return SCREEN_HEIGHT_FULL - SCREEN_HEIGHT;
  }

  return 0;
};

/* =========================================================
   PLATFORM CONSTANTS
========================================================= */

const PLATFORM = {
  STATUS_BAR_HEIGHT: getDynamicTopSafeArea(),

  BOTTOM_SAFE_AREA: getDynamicBottomSafeArea(),

  HEADER_HEIGHT: isIOS ? 44 : 56,

  TAB_BAR_HEIGHT: isIOS
    ? hasNotch
      ? 83
      : 49
    : 56,

  IS_IPAD: isIPad,

  IS_ANDROID_TABLET: isAndroidTablet,
};

/* =========================================================
   SAFE AREA
========================================================= */

const SAFE_AREA = {
  safeTop: PLATFORM.STATUS_BAR_HEIGHT,

  safeBottom: PLATFORM.BOTTOM_SAFE_AREA,

  safeHorizontal: isTablet ? 24 : 16,
};

/* =========================================================
   SCALE FUNCTIONS
========================================================= */

const scale = (size: number): number => {
  const widthScale =
    SCREEN_WIDTH / REFERENCE.PHONE.width;

  const scaleFactor = isTablet
    ? widthScale * 1.2
    : Math.min(widthScale, 1);

  return Math.round(size * scaleFactor);
};

const verticalScale = (size: number): number => {
  const heightScale =
    SCREEN_HEIGHT / REFERENCE.PHONE.height;

  const scaleFactor = isTablet
    ? heightScale * 1.1
    : Math.min(heightScale, 1);

  return Math.round(size * scaleFactor);
};

const moderateScale = (
  size: number,
  factor: number = 0.5,
): number => {
  return size + (scale(size) - size) * factor;
};

/* =========================================================
   RESPONSIVE TEXT
========================================================= */

const responsiveText = (size: number): number => {
  const scaled = moderateScale(size);

  return Math.round(scaled);
};

/* =========================================================
   RESPONSIVE HELPERS
========================================================= */

const responsiveWidth = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

const responsiveHeight = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

const responsiveSafeHeight = (
  percentage: number,
): number => {
  const safeHeight =
    SCREEN_HEIGHT -
    PLATFORM.STATUS_BAR_HEIGHT -
    PLATFORM.BOTTOM_SAFE_AREA;

  return (safeHeight * percentage) / 100;
};

/* =========================================================
   SPACING
========================================================= */

const SPACING = {
  xxs: moderateScale(4),

  xs: moderateScale(6),

  sm: moderateScale(8),

  md: moderateScale(12),

  lg: moderateScale(16),

  xl: moderateScale(20),

  xxl: moderateScale(24),

  section: moderateScale(32),

  screen: moderateScale(40),
};

/* =========================================================
   FONT SIZES
========================================================= */

const FONT_SIZE = {
  xxs: responsiveText(10),

  xs: responsiveText(12),

  sm: responsiveText(13),

  md: responsiveText(15),

  lg: responsiveText(17),

  xl: responsiveText(20),

  xxl: responsiveText(24),

  xxxl: responsiveText(28),

  display: responsiveText(32),

  button: responsiveText(16),

  input: responsiveText(15),
};

/* =========================================================
   ICON SIZES
========================================================= */

const ICON_SIZE = {
  xs: moderateScale(14),

  sm: moderateScale(18),

  md: moderateScale(22),

  lg: moderateScale(26),

  xl: moderateScale(32),

  xxl: moderateScale(40),

  avatar: moderateScale(48),
};

/* =========================================================
   LAYOUT
========================================================= */

const LAYOUT = {
  headerHeight:
    PLATFORM.HEADER_HEIGHT +
    PLATFORM.STATUS_BAR_HEIGHT,

  tabBarHeight:
    PLATFORM.TAB_BAR_HEIGHT +
    PLATFORM.BOTTOM_SAFE_AREA,

  buttonHeight: moderateScale(46),

  inputHeight: moderateScale(46),

  borderRadius: {
    sm: moderateScale(6),

    md: moderateScale(10),

    lg: moderateScale(14),

    xl: moderateScale(18),

    full: 9999,
  },

  shadow: {
    sm: isIOS
      ? {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }
      : {
          elevation: 2,
        },

    md: isIOS
      ? {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }
      : {
          elevation: 4,
        },
  },
};

/* =========================================================
   GRID
========================================================= */

const GRID = {
  columns: isTablet ? 2 : 1,

  gap: SPACING.md,
};

/* =========================================================
   HIT SLOP
========================================================= */

const HIT_SLOP = {
  sm: {
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
  },

  md: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },

  lg: {
    top: 14,
    bottom: 14,
    left: 14,
    right: 14,
  },
};

/* =========================================================
   RESPONSIVE OBJECT
========================================================= */

const responsive = {
  text: responsiveText,

  padding: (size: number) =>
    moderateScale(size),

  margin: (size: number) =>
    moderateScale(size),

  topSpace: (extra: number = 0) =>
    PLATFORM.STATUS_BAR_HEIGHT + extra,

  bottomSpace: (extra: number = 0) =>
    PLATFORM.BOTTOM_SAFE_AREA + extra,
};

/* =========================================================
   UPDATE DIMENSIONS
========================================================= */

const updateDimensions = () => {
  return Dimensions.get('window');
};

Dimensions.addEventListener?.(
  'change',
  updateDimensions,
);

/* =========================================================
   EXPORTS
========================================================= */

export {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,

  SCREEN_WIDTH_FULL,
  SCREEN_HEIGHT_FULL,

  REFERENCE,

  isIOS,
  isAndroid,
  isTablet,
  isLandscape,
  isSmallDevice,
  isExtraSmallDevice,
  isLargeDevice,
  hasNotch,
  isIPad,
  isAndroidTablet,

  PLATFORM,
  SAFE_AREA,

  scale,
  verticalScale,
  moderateScale,

  responsiveText,

  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,

  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  GRID,

  HIT_SLOP,

  responsive,

  getDynamicTopSafeArea,
  getDynamicBottomSafeArea,

  updateDimensions,
};