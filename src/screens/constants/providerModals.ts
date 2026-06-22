import { Job } from "../../services/api";

export type DeclineReasonCode =
  | 'too_far'
  | 'busy'
  | 'wrong_service'
  | 'location_access'
  | 'low_payout'
  | 'other';

export const DECLINE_REASONS: {
  code: DeclineReasonCode;
  label: string;
  description: string;
}[] = [
  {
    code: 'too_far',
    label: 'Too far from me',
    description: 'Travel distance exceeds my dispatch radius',
  },
  {
    code: 'busy',
    label: 'Already on another visit',
    description: 'I cannot reach the patient in time',
  },
  {
    code: 'wrong_service',
    label: 'Not my specialty',
    description: 'Service does not match my profile',
  },
  {
    code: 'location_access',
    label: 'Location / access issue',
    description: 'Address unclear or difficult to access',
  },
  {
    code: 'low_payout',
    label: 'Payout too low',
    description: 'Earnings do not match effort for this visit',
  },
  {
    code: 'other',
    label: 'Other reason',
    description: 'Add a short note for operations team',
  },
];

export type CancelVisitReasonCode =
  | 'patient_unavailable'
  | 'wrong_address'
  | 'safety'
  | 'equipment'
  | 'emergency'
  | 'other';

export const CANCEL_VISIT_REASONS: {
  code: CancelVisitReasonCode;
  label: string;
}[] = [
  {code: 'patient_unavailable', label: 'Patient not available'},
  {code: 'wrong_address', label: 'Wrong or inaccessible address'},
  {code: 'safety', label: 'Safety concern at location'},
  {code: 'equipment', label: 'Missing supplies / equipment'},
  {code: 'emergency', label: 'Personal emergency'},
  {code: 'other', label: 'Other (note required)'},
];

export function cancelReasonLabel(code: CancelVisitReasonCode, note?: string): string {
  const found = CANCEL_VISIT_REASONS.find(r => r.code === code);
  if (code === 'other' && note?.trim()) return note.trim();
  return found?.label ?? code;
}

export type ProviderNotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'offer' | 'visit' | 'payout' | 'system';
};

export const LIVE_OFFER_SECONDS = 45;

export function declineReasonLabel(code: DeclineReasonCode, note?: string): string {
  const found = DECLINE_REASONS.find(r => r.code === code);
  if (code === 'other' && note?.trim()) {
    return note.trim();
  }
  return found?.label ?? code;
}

export type ConfirmModalPayload = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: 'warning' | 'success' | 'info' | 'logout' | 'video' | 'wallet';
  onConfirm: () => void | Promise<void>;
};

export type ProviderModalState =
  | {type: 'none'}
  | {type: 'decline_job'; job: Job}
  | {type: 'accept_job'; job: Job; onAccepted?: (jobId: string) => void}
  | {type: 'confirm'; payload: ConfirmModalPayload}
  | {type: 'visit_complete'; job: Job; onComplete: () => void | Promise<void>}
  | {type: 'invalid_otp'; onRetry?: () => void}
  | {type: 'dispatch_radius'; currentKm: number; onSelect: (km: number) => void}
  | {type: 'incoming_offer'; job: Job; expiresAt: number}
  | {type: 'mark_arrived'; job: Job; onConfirm: () => void | Promise<void>}
  | {type: 'cancel_visit'; job: Job; onCancelled: () => void}
  | {type: 'notifications'}
  | {type: 'support_hotline'};
