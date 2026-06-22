import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Job } from '../services/api';

export type ProviderRole =
  | 'nurse'
  | 'physio'
  | 'caregiver'
  | 'doctor'
  | 'elderly'
  | 'sample'
  | 'cleaner'
  | 'collector'
  | 'merchant';

export type KycStatus =
  | 'none'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Provider: NavigatorScreenParams<ProviderStackParamList> | undefined;
};

export type AuthStackParamList = {
  Intro: undefined;
  Login: undefined;
  Onboarding: { phone?: string; source?: string } | undefined;
  VerificationStatus: { phone?: string; role?: ProviderRole };
  OtpVerification: { phone: string; flow?: 'login' | 'forgot_pin' };
  PinManagement: { action?: 'set' | 'change' | 'forgot'; phoneNumber?: string };
  ResetPin: { phone?: string };
};

export type VideoCallType = 'patient' | 'support' | 'pre_visit';

export type ProviderStackParamList = {
  ProviderTabs: NavigatorScreenParams<ProviderTabParamList> | { role?: ProviderRole } | undefined;
  ActiveVisit: { jobId: string };
  VisitPatientRating: { jobId?: string; job?: Job };
  PostVisitLearning: { jobId: string };
  PatientDetail: { patientId: string };
  VideoCall: {
    patientName: string;
    jobId?: string;
    callType?: VideoCallType;
  };
  MerchantDashboard: { merchantId?: string; merchantName?: string } | undefined;
  ProviderAvailability: undefined;
  ProviderPinManagement: undefined;
  Reports: undefined;
  Settlements: undefined;
  MyPatients: undefined;
  AddressUpdate: undefined;
};

export type ProviderTabParamList = {
  Home: undefined;
  Jobs: undefined;
  Earnings: undefined;
  Profile: undefined;
};
