import AsyncStorage from '@react-native-async-storage/async-storage';
import {CommonActions} from '@react-navigation/native';
import type {KycStatus, ProviderRole, RootStackParamList} from '../navigation/types';
import {navigationRef} from '../navigation/navigationRef';
import { getToken, removeToken } from './secureStorage';

const KEYS = {
  HAS_SEEN_INTRO: '@vydhyo/hasSeenIntro',
  PROVIDER_ROLE: '@vydhyo/providerRole',
  KYC_STATUS: '@vydhyo/kycStatus',
  ONBOARDING_SUBMITTED: '@vydhyo/onboardingSubmitted',
  USER_PHONE: '@vydhyo/userPhone',
} as const;

export type AuthBootstrap = {
  isAuthenticated: boolean;
  rootRoute: keyof RootStackParamList;
  authInitialRoute: keyof import('../navigation/types').AuthStackParamList;
  authInitialParams?: Record<string, unknown>;
};

const ROLE_ALIASES: Record<string, ProviderRole> = {
  nurse: 'nurse',
  physio: 'physio',
  physiotherapist: 'physio',
  caregiver: 'caregiver',
  elderly: 'elderly',
  doctor: 'doctor',
  cleaner: 'cleaner',
  housekeeping: 'cleaner',
  sample: 'sample',
  collector: 'sample',
  marchet: 'merchant',
};

export function normalizeProviderRole(
  role?: string | null,
): ProviderRole | null {
  if (!role) {
    return null;
  }
  const key = role.toLowerCase().trim();
  return ROLE_ALIASES[key] ?? (key as ProviderRole);
}

export async function getHasSeenIntro(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.HAS_SEEN_INTRO);
  return value === 'true';
}

export async function setHasSeenIntro(): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_SEEN_INTRO, 'true');
}

export async function getProviderRole(): Promise<ProviderRole | null> {
  const value = await AsyncStorage.getItem(KEYS.PROVIDER_ROLE);
  return normalizeProviderRole(value);
}

export async function setProviderRole(role: ProviderRole): Promise<void> {
  await AsyncStorage.setItem(KEYS.PROVIDER_ROLE, role);
}

export async function getKycStatus(): Promise<KycStatus> {
  const value = await AsyncStorage.getItem(KEYS.KYC_STATUS);
  if (
    value === 'approved' ||
    value === 'rejected' ||
    value === 'under_review' ||
    value === 'pending'
  ) {
    return value;
  }
  return 'none';
}

export async function setKycStatus(status: KycStatus): Promise<void> {
  await AsyncStorage.setItem(KEYS.KYC_STATUS, status);
}

export async function getOnboardingSubmitted(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.ONBOARDING_SUBMITTED)) === 'true';
}

export async function setOnboardingSubmitted(
  submitted: boolean,
): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.ONBOARDING_SUBMITTED,
    submitted ? 'true' : 'false',
  );
}

export async function getUserPhone(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.USER_PHONE);
}

export async function setUserPhone(phone: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PHONE, phone);
}

export async function clearAuthSession(): Promise<void> {
  await removeToken();
  await AsyncStorage.multiRemove([
    KEYS.PROVIDER_ROLE,
    KEYS.KYC_STATUS,
    KEYS.ONBOARDING_SUBMITTED,
    KEYS.USER_PHONE,
    'userId',
  ]);
}

export async function bootstrapAuth(): Promise<AuthBootstrap> {
  const token = await getToken();
  const hasSeenIntro = await getHasSeenIntro();
  const kycStatus = await getKycStatus();
  const onboardingSubmitted = await getOnboardingSubmitted();
  const role = await getProviderRole();
  const phone = await getUserPhone();

  if (!token) {
    return {
      isAuthenticated: false,
      rootRoute: 'Auth',
      authInitialRoute: hasSeenIntro ? 'Login' : 'Intro',
    };
  }

  if (kycStatus === 'approved' && role) {
    return {
      isAuthenticated: true,
      rootRoute: 'Provider',
      authInitialRoute: 'Login',
    };
  }

  if (kycStatus === 'under_review' || onboardingSubmitted) {
    return {
      isAuthenticated: false,
      rootRoute: 'Auth',
      authInitialRoute: 'VerificationStatus',
      authInitialParams: {phone: phone ?? undefined, role: role ?? 'nurse'},
    };
  }

  return {
    isAuthenticated: false,
    rootRoute: 'Auth',
    authInitialRoute: 'Onboarding',
  };
}

type PostLoginUser = {
  role?: string;
  providerRole?: string;
  kycStatus?: string;
  firstname?: string;
  mobile?: string;
  phone?: string;
};

export async function persistLoginSession(
  userData?: PostLoginUser,
  phoneNumber?: string,
): Promise<void> {
  const role = normalizeProviderRole(
    userData?.providerRole ?? userData?.role,
  );
  if (role) {
    await setProviderRole(role);
  }

  const phone =
    phoneNumber ?? userData?.mobile ?? userData?.phone ?? undefined;
  if (phone) {
    await setUserPhone(phone);
  }

  const apiKyc = userData?.kycStatus?.toLowerCase();
  if (apiKyc === 'approved') {
    await setKycStatus('approved');
    await setOnboardingSubmitted(true);
  } else if (apiKyc === 'rejected') {
    await setKycStatus('rejected');
  } else if (apiKyc === 'under_review' || apiKyc === 'pending') {
    await setKycStatus('under_review');
    await setOnboardingSubmitted(true);
  }
}

export async function markOnboardingSubmitted(
  role: ProviderRole,
  phone?: string,
): Promise<void> {
  await setProviderRole(role);
  await setKycStatus('under_review');
  await setOnboardingSubmitted(true);
  if (phone) {
    await setUserPhone(phone);
  }
}

export function resetToProvider(): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{name: 'Provider'}],
    }),
  );
}

export function resetToAuth(
  screen: keyof import('../navigation/types').AuthStackParamList = 'Login',
  params?: Record<string, unknown>,
): void {
  if (!navigationRef.isReady()) {
    return;
  }
  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: 'Auth',
          state: {
            routes: [{name: screen, params}],
            index: 0,
          },
        },
      ],
    }),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function navigateAfterLogin(
  navigation: any,
  userData?: PostLoginUser,
  phoneNumber?: string,
): Promise<void> {
  await persistLoginSession(userData, phoneNumber);

  const kyc = await getKycStatus();
  const role = await getProviderRole();

  if (kyc === 'approved' && role) {
    resetToProvider();
    return;
  }

  if (kyc === 'under_review' || (await getOnboardingSubmitted())) {
    navigation.navigate('VerificationStatus', {
      phone: phoneNumber ?? (await getUserPhone()) ?? undefined,
      role: role ?? 'merchant',
    });
    return;
  }

  navigation.navigate('Onboarding');
}

export async function activateProviderDashboard(
  role: ProviderRole,
  phone?: string,
): Promise<void> {
  await setProviderRole(role);
  await setKycStatus('approved');
  await setOnboardingSubmitted(true);
  if (phone) {
    await setUserPhone(phone);
  }
  resetToProvider();
}

export async function logout(): Promise<void> {
  await clearAuthSession();
  resetToAuth('Login');
}
