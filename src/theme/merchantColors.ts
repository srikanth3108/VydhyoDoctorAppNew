/**
 * Merchant Dashboard Color Theme
 * Professional color scheme for consistent UI design across the merchant dashboard
 */

export const merchantColors = {
  // Primary Colors
  primary: {
    dark: '#1D3557', // Dark navy/teal
    main: '#1D3557',
    light: '#2C4A70',
  },
  secondary: {
    main: '#0D9488', // Vibrant teal
    light: '#14B8A6',
    lighter: '#2DD4BF',
  },
  accent: {
    main: '#7C3AED', // Soft purple
    light: '#A78BFA',
    lighter: '#C4B5FD',
  },

  // Status Colors
  status: {
    pending: {
      main: '#F59E0B', // Amber
      light: '#FCD34D',
      dark: '#D97706',
    },
    processing: {
      main: '#3B82F6', // Blue
      light: '#60A5FA',
      dark: '#1D4ED8',
    },
    shipped: {
      main: '#06B6D4', // Cyan
      light: '#22D3EE',
      dark: '#0891B2',
    },
    delivered: {
      main: '#10B981', // Green
      light: '#6EE7B7',
      dark: '#059669',
    },
    cancelled: {
      main: '#EF4444', // Red
      light: '#F87171',
      dark: '#DC2626',
    },
  },

  // Gradient Colors
  gradients: {
    headerGradient: ['#1D3557', '#0D9488'],
    cardGradient: ['#F3F4F6', '#F9FAFB'],
    successGradient: ['#10B981', '#059669'],
    warningGradient: ['#F59E0B', '#D97706'],
    errorGradient: ['#EF4444', '#DC2626'],
    accentGradient: ['#7C3AED', '#A78BFA'],
  },

  // Neutral Colors
  neutral: {
    // Background Colors
    bg: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      tertiary: '#F3F4F6',
      dark: '#1F2937',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    // Text Colors
    text: {
      primary: '#111827', // Nearly black
      secondary: '#6B7280', // Gray
      tertiary: '#9CA3AF', // Light gray
      light: '#E5E7EB', // Very light gray
      white: '#FFFFFF',
      inverse: '#FFFFFF', // On dark backgrounds
    },
    // Border Colors
    border: {
      light: '#E5E7EB',
      main: '#D1D5DB',
      dark: '#9CA3AF',
    },
    // Shadow Colors
    shadow: {
      light: 'rgba(0, 0, 0, 0.05)',
      main: 'rgba(0, 0, 0, 0.1)',
      dark: 'rgba(0, 0, 0, 0.2)',
    },
  },

  // Semantic Color Mapping
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Additional Utility Colors
  utility: {
    disabled: '#D1D5DB',
    placeholder: '#9CA3AF',
    hover: 'rgba(0, 0, 0, 0.04)',
    focus: 'rgba(13, 148, 136, 0.1)',
    divider: '#E5E7EB',
  },
};

// Type exports for TypeScript support
export type MerchantColorScheme = typeof merchantColors;

/**
 * Helper function to convert hex colors to RGB with opacity
 * @param hex Hex color code
 * @param opacity Opacity value (0-1)
 * @returns RGB color string with opacity
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Helper function to create CSS gradient
 * @param colors Array of color codes
 * @param angle Gradient angle (default: 135deg)
 * @returns CSS gradient string
 */
export const createGradient = (
  colors: string[],
  angle: number = 135
): string => {
  return `linear-gradient(${angle}deg, ${colors.join(', ')})`;
};

export default merchantColors;
