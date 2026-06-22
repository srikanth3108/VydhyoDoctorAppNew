import { Dimensions, Platform } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const { width: SCREEN_WIDTH_FULL, height: SCREEN_HEIGHT_FULL } = Dimensions.get("screen");

// Reference dimensions for different device classes
const REFERENCE = {
  PHONE: { width: 375, height: 812 }, // iPhone 13/14
  PHONE_LARGE: { width: 428, height: 926 }, // iPhone 14 Pro Max/Plus
  PHONE_SMALL: { width: 320, height: 568 }, // iPhone SE
  TABLET: { width: 768, height: 1024 }, // iPad
  TABLET_LARGE: { width: 1024, height: 1366 }, // iPad Pro
};

// Comprehensive device detection
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isTablet = SCREEN_WIDTH >= 768;
const isSmallDevice = SCREEN_HEIGHT < 700;
const isLargeDevice = SCREEN_WIDTH > 428;
const isExtraSmallDevice = SCREEN_WIDTH < 375;
const hasNotch = isIOS && (SCREEN_HEIGHT > 800 || SCREEN_WIDTH > 800);
const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;

// Detect specific device types for granular control
const isIPad = isIOS && isTablet;
const isAndroidTablet = isAndroid && isTablet;
const isSmallTablet = isTablet && SCREEN_WIDTH < 900;
const isLargeTablet = isTablet && SCREEN_WIDTH >= 900;

// Detect Android navigation bar (soft keys)
const hasAndroidNavigationBar = isAndroid && SCREEN_HEIGHT < SCREEN_HEIGHT_FULL;

// Detect specific Android devices with hardware buttons
const hasHardwareButtons = isAndroid && (SCREEN_HEIGHT_FULL - SCREEN_HEIGHT) === 0;

// Dynamic bottom safe area calculation
const getDynamicBottomSafeArea = (): number => {
  if (isIOS) {
    if (hasNotch) {
      return isLandscape ? 21 : 34; // iPhone notch devices
    }
    // iPad safe area
    if (isIPad) {
      return isLandscape ? 21 : 20;
    }
    return 0;
  }
  
  if (isAndroid) {
    // Android devices with soft navigation bars
    const navigationBarHeight = SCREEN_HEIGHT_FULL - SCREEN_HEIGHT;
    
    if (navigationBarHeight > 0) {
      // Devices with soft navigation bars
      return navigationBarHeight;
    } else {
      // Devices with hardware buttons or gesture navigation
      // Add extra padding for devices with hardware buttons
      return hasHardwareButtons ? 10 : 0;
    }
  }
  
  return 0;
};

// Dynamic top safe area (for devices with camera cutouts)
const getDynamicTopSafeArea = (): number => {
  if (isIOS) {
    return hasNotch ? 44 : 20;
  }

  if (isAndroid) {
    // Android devices with camera cutouts/notches
    const statusBarHeight =
      Number(Platform.Version) >= 23 ? 24 : 25;

    // Additional padding for devices with camera cutouts
    const hasCutout =
      SCREEN_HEIGHT_FULL > SCREEN_HEIGHT + 50;

    return hasCutout
      ? statusBarHeight + 10
      : statusBarHeight;
  }

  return 0;
};

// Platform-specific constants
const PLATFORM = {
  STATUS_BAR_HEIGHT: getDynamicTopSafeArea(),
  BOTTOM_SAFE_AREA: getDynamicBottomSafeArea(),
  HEADER_HEIGHT: isIOS ? 44 : 56,
  TAB_BAR_HEIGHT: isIOS ? (hasNotch ? 83 : 49) : 56,
  HAS_NAVIGATION_BAR: hasAndroidNavigationBar,
  HAS_HARDWARE_BUTTONS: hasHardwareButtons,
  IS_IPAD: isIPad,
  IS_ANDROID_TABLET: isAndroidTablet,
};

// --- Move responsive helpers BEFORE they are used by LAYOUT/GRID etc. ---

// Responsive percentage calculations with safe areas
const responsiveWidth = (percentage: number): number => {
  const maxWidth = isTablet ? SCREEN_WIDTH * 0.9 : SCREEN_WIDTH * 0.95;
  const calculated = SCREEN_WIDTH * (percentage / 100);
  return Math.min(calculated, maxWidth);
};

const responsiveHeight = (percentage: number): number => {
  const maxHeight = DYNAMIC_DIMENSIONS.SCROLL_VIEW_HEIGHT * 0.95;
  const calculated = DYNAMIC_DIMENSIONS.SCROLL_VIEW_HEIGHT * (percentage / 100);
  return Math.min(calculated, maxHeight);
};

// Safe area responsive height (excludes status bar and navigation bar)
const responsiveSafeHeight = (percentage: number): number => {
  const maxHeight = DYNAMIC_DIMENSIONS.SAFE_SCREEN_HEIGHT * 0.95;
  const calculated = DYNAMIC_DIMENSIONS.SAFE_SCREEN_HEIGHT * (percentage / 100);
  return Math.min(calculated, maxHeight);
};

// Universal scaling function with device-specific adjustments
const scale = (size: number): number => {
  let scaleFactor = SCREEN_WIDTH / REFERENCE.PHONE.width;
  
  // Adjust scaling for different device types
  if (isExtraSmallDevice) scaleFactor *= 0.9;
  if (isLargeDevice) scaleFactor *= 1.1;
  if (isTablet) scaleFactor *= 1.3;
  
  return Math.round(size * Math.min(scaleFactor, 1.5)); // Cap maximum scaling
};

const verticalScale = (size: number): number => {
  let scaleFactor = SCREEN_HEIGHT / REFERENCE.PHONE.height;
  
  // Adjust vertical scaling
  if (isSmallDevice) scaleFactor *= 0.9;
  if (isTablet) scaleFactor *= 1.2;
  
  return Math.round(size * Math.min(scaleFactor, 1.4));
};

const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaledSize = size + (scale(size) - size) * factor;
  return Math.round(scaledSize);
};

// Dynamic dimensions that account for safe areas
const DYNAMIC_DIMENSIONS = {
  // Safe screen dimensions (excluding status bar and navigation bar)
  SAFE_SCREEN_WIDTH: SCREEN_WIDTH,
  SAFE_SCREEN_HEIGHT: SCREEN_HEIGHT - PLATFORM.STATUS_BAR_HEIGHT - PLATFORM.BOTTOM_SAFE_AREA,
  
  // Content area dimensions
  CONTENT_HEIGHT: SCREEN_HEIGHT - PLATFORM.STATUS_BAR_HEIGHT - PLATFORM.BOTTOM_SAFE_AREA,
  CONTENT_WIDTH: SCREEN_WIDTH,
  
  // Available height for scroll views
  SCROLL_VIEW_HEIGHT: SCREEN_HEIGHT - PLATFORM.STATUS_BAR_HEIGHT - PLATFORM.BOTTOM_SAFE_AREA,
  
  // Full screen dimensions
  FULL_SCREEN_WIDTH: SCREEN_WIDTH_FULL,
  FULL_SCREEN_HEIGHT: SCREEN_HEIGHT_FULL,
};

// Perfect responsive text scaling function
const responsiveText = (baseSize: number): number => {
  let scaled = baseSize * (SCREEN_WIDTH / REFERENCE.PHONE.width);
  
  // Platform-specific text scaling limits
  const maxScale = isAndroid ? 1.15 : 1.2;
  const minScale = isAndroid ? 0.9 : 0.85;
  
  // Adjust for device types
  if (isTablet) {
    scaled *= 1.1; // Slightly larger text on tablets
  }
  if (isExtraSmallDevice) {
    scaled *= 0.95; // Slightly smaller text on very small devices
  }
  
  return Math.min(Math.max(baseSize * minScale, scaled), baseSize * maxScale);
};

// Perfect spacing system for both platforms
const SPACING = {
  // Micro spacing (0-8px)
  xxs: isTablet ? moderateScale(6) : moderateScale(4),
  xs: isTablet ? moderateScale(8) : moderateScale(6),
  
  // Base spacing (8-16px) - Universal
  sm: moderateScale(8),
  md: moderateScale(12),
  base: moderateScale(16),
  
  // Macro spacing (16-32px)
  lg: moderateScale(20),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  
  // Section spacing (32px+)
  section: moderateScale(40),
  screen: moderateScale(48),
};

// Add safe area calculations AFTER SPACING is defined
const SAFE_AREA = {
  safeTop: PLATFORM.STATUS_BAR_HEIGHT + (isIOS ? SPACING.sm : 0),
  safeBottom: PLATFORM.BOTTOM_SAFE_AREA + (isIOS ? SPACING.sm : SPACING.xs),
  safeHorizontal: isTablet ? SPACING.lg : SPACING.md,
};

// Universal typography scale
const FONT_SIZE = {
  // Caption & helper text
  xxs: isTablet ? moderateScale(12) : moderateScale(10),
  xs: isTablet ? moderateScale(14) : moderateScale(12),
  
  // Body text
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  
  // Headings
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(28),
  
  // Display text
  display: isTablet ? moderateScale(36) : moderateScale(32),
  
  // Platform-specific text adjustments
  button: isIOS ? moderateScale(17) : moderateScale(16),
  input: isIOS ? moderateScale(17) : moderateScale(16),
};

// Universal icon sizing
const ICON_SIZE = {
  // Small icons (UI elements)
  xs: isTablet ? moderateScale(18) : moderateScale(16),
  sm: isTablet ? moderateScale(22) : moderateScale(20),
  
  // Medium icons (action buttons)
  md: moderateScale(24),
  lg: moderateScale(28),
  
  // Large icons (feature icons)
  xl: moderateScale(32),
  xxl: moderateScale(40),
  xxxl: moderateScale(48),
  
  // Tab bar icons
  tabBar: isIOS ? moderateScale(28) : moderateScale(24),
  
  // Special sizes
  avatar: isTablet ? moderateScale(60) : moderateScale(50),
  avatarSmall: isTablet ? moderateScale(40) : moderateScale(35),
};

// Universal layout dimensions
const LAYOUT = {
  // Heights
  headerHeight: PLATFORM.HEADER_HEIGHT + PLATFORM.STATUS_BAR_HEIGHT,
  tabBarHeight: PLATFORM.TAB_BAR_HEIGHT + PLATFORM.BOTTOM_SAFE_AREA,
  footerHeight: isTablet ? verticalScale(80) : verticalScale(60) + PLATFORM.BOTTOM_SAFE_AREA,
  buttonHeight: isIOS ? moderateScale(44) : moderateScale(48),
  inputHeight: isIOS ? moderateScale(44) : moderateScale(48),
  
  // Bottom padding that accounts for navigation bars
  bottomPadding: PLATFORM.BOTTOM_SAFE_AREA > 0 ? PLATFORM.BOTTOM_SAFE_AREA + SPACING.sm : SPACING.md,
  
  // Card dimensions
  card: {
    small: isTablet ? responsiveWidth(45) : responsiveWidth(90),
    medium: isTablet ? responsiveWidth(60) : responsiveWidth(95),
    large: isTablet ? responsiveWidth(80) : responsiveWidth(100),
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: isIOS ? moderateScale(4) : moderateScale(2),
    md: isIOS ? moderateScale(8) : moderateScale(6),
    lg: isIOS ? moderateScale(12) : moderateScale(8),
    xl: isIOS ? moderateScale(16) : moderateScale(12),
    pill: moderateScale(25),
    full: 9999,
  },
  
  // Shadows (platform specific)
  shadow: {
    sm: isIOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    } : {
      elevation: 2,
    },
    md: isIOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    } : {
      elevation: 4,
    },
    lg: isIOS ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    } : {
      elevation: 8,
    },
  },
};

// Responsive percentage calculations with safe areas handled earlier
// (responsiveWidth / responsiveHeight already declared above)

// Universal grid system
const GRID = {
  columns: isTablet ? (isLandscape ? 3 : 2) : 1,
  gap: isTablet ? SPACING.lg : SPACING.md,
  margin: {
    horizontal: isTablet ? responsiveWidth(4) : responsiveWidth(5),
    vertical: isTablet ? SPACING.xl : SPACING.lg,
  },
  item: {
    width: isTablet ? responsiveWidth(45) : responsiveWidth(90),
    height: isTablet ? verticalScale(200) : verticalScale(160),
  }
};

// Device-specific responsive helpers
const responsive = {
  // Text scaling with platform considerations
  text: responsiveText,

  // Padding adjustments
  padding: (base: number, multiplier: number = 1): number => {
    const adjusted = base * multiplier;
    return isTablet ? adjusted * 1.2 : adjusted;
  },

  // Margin adjustments
  margin: (base: number, multiplier: number = 1): number => {
    const adjusted = base * multiplier;
    return isTablet ? adjusted * 1.3 : adjusted;
  },

  // Aspect ratio helper
  aspectRatio: (ratio: number = 1): number => SCREEN_WIDTH / ratio,

  // Bottom safe area helper
  bottomSpace: (additionalSpace: number = 0): number => {
    return PLATFORM.BOTTOM_SAFE_AREA + additionalSpace;
  },

  // Top safe area helper
  topSpace: (additionalSpace: number = 0): number => {
    return PLATFORM.STATUS_BAR_HEIGHT + additionalSpace;
  },
};

// Platform-specific hit slops
const HIT_SLOP = {
  sm: {
    top: SPACING.xs,
    bottom: SPACING.xs,
    left: SPACING.xs,
    right: SPACING.xs,
  },
  md: {
    top: SPACING.sm,
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
  },
  lg: {
    top: SPACING.md,
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
};

// Function to update dimensions on orientation change
const updateDimensions = (): void => {
  const { width, height } = Dimensions.get('window');
  // Note: In a real app, you might want to use a state management solution
  // to handle dimension changes across the app
  console.log('Dimensions updated:', { width, height });
};

// Listen to dimension changes
// Keep this for debug; in production consider using an event subscription in a component
Dimensions.addEventListener('change', updateDimensions);

// Export everything
export { 
  // Dimensions
  SCREEN_WIDTH, 
  SCREEN_HEIGHT,
  DYNAMIC_DIMENSIONS,
  
  // Device detection
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  isExtraSmallDevice,
  hasNotch,
  isLandscape,
  hasAndroidNavigationBar,
  isIPad,
  isAndroidTablet,
  isSmallTablet,
  isLargeTablet,
  hasHardwareButtons,
  
  // Platform constants
  PLATFORM,
  SAFE_AREA,
  
  // Scaling systems
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  
  // Responsive functions
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  responsive,
  
  // Grid system
  GRID,
  
  // Utilities
  scale,
  verticalScale,
  moderateScale,
  HIT_SLOP,
  getDynamicBottomSafeArea,
  getDynamicTopSafeArea,
  updateDimensions,
  
  // References
  REFERENCE,
};
