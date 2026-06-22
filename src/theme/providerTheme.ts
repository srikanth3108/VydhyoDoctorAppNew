import {LAYOUT} from '../utils/responsive';

/**
 * Vydhyo Partner's — client brand palette
 * Mint canvas (#E0F7E9) + navy accents (#1D3557) + white cards
 */
export const PROVIDER_THEME = {
  mint: '#E0F7E9',
  mintSoft: '#D4F2E4',
  mintDeep: '#C5EBD8',
  navy: '#1D3557',
  navySoft: '#2A4A6B',
  navyMuted: '#3D5A73',
  white: '#FFFFFF',

  ink: '#1D3557',
  inkSoft: '#2A4A6B',
  inkMuted: '#3D5A73',
  jade: '#1D3557',
  jadeDeep: '#152A45',
  jadeGlow: '#3D6A9B',
  jadeMuted: 'rgba(29, 53, 87, 0.1)',
  sand: '#E0F7E9',
  sandDeep: '#C5EBD8',
  pearl: '#FFFFFF',
  pearlMuted: '#F4FBF7',
  amber: '#E68A2E',
  amberSoft: 'rgba(230, 138, 46, 0.15)',
  rose: '#DC4A68',
  violet: '#6B5CE7',
  bg: '#E0F7E9',
  bgWarm: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F4FBF7',
  surfaceGlass: 'rgba(255, 255, 255, 0.94)',
  border: 'rgba(29, 53, 87, 0.1)',
  borderStrong: 'rgba(29, 53, 87, 0.22)',
  text: '#1D3557',
  primary: '#1D3557',
  textMuted: '#5A6B7D',
  textSoft: '#8A99A8',
  textOnInk: '#FFFFFF',
  textOnInkMuted: 'rgba(255, 255, 255, 0.78)',
  textOnMint: '#1D3557',
  textOnMintMuted: 'rgba(29, 53, 87, 0.65)',
  success: '#2D6A4F',
  warning: '#E68A2E',
  error: '#DC4A68',
  teal: '#1D3557',
  tealLight: '#3D6A9B',
  tealMuted: 'rgba(29, 53, 87, 0.1)',
  mintAccent: '#3D6A9B',
  gold: '#E68A2E',
  coral: '#DC4A68',
  gradient: {
    hero: ['#E0F7E9', '#D8F5E8', '#CEF0E0'],
    dutyOn: ['#1D3557', '#2A4A6B', '#3D5A73'],
    card: ['#1D3557', '#3D6A9B'],
    video: ['#1D3557', '#2A4A6B', '#6B5CE7'],
  },
  shadow: LAYOUT.shadow.lg,
  shadowStyles: {
    card: {
      shadowColor: '#1D3557',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 4,
    },
    float: {
      shadowColor: '#1D3557',
      shadowOffset: {width: 0, height: 10},
      shadowOpacity: 0.12,
      shadowRadius: 18,
      elevation: 6,
    },
    header: {
      shadowColor: '#1D3557',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
  },
  radius: {sm: 14, md: 18, lg: 24, xl: 32, pill: 999},
  sheetRadius: 28,
  tabBarClearance: 160,
} as const;

export const CARD_SHADOW = PROVIDER_THEME.shadowStyles.card;

export const PROVIDER_FONTS = {
  brand: {fontSize: 10, fontWeight: '800' as const, letterSpacing: 2.4},
  hero: {fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8},
  title: {fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.5},
  pageTitle: {fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.2},
  label: {fontSize: 11, fontWeight: '700' as const, letterSpacing: 1},
  caption: {fontSize: 14, fontWeight: '500' as const},
};
