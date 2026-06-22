import type {Job} from '../services/api';

export type VisitStep = 'travel' | 'arrived' | 'otp' | 'care' | 'rx';

export const VISIT_STEPS: VisitStep[] = ['travel', 'arrived', 'otp', 'care', 'rx'];

/** Maps backend execution status to the UI step shown on Active Visit */
export function stepFromExecution(
  status?: Job['executionStatus'],
): VisitStep {
  switch (status) {
    case 'not_started':
      return 'travel';
    case 'traveling':
      return 'arrived';
    case 'arrived':
      return 'otp';
    case 'otp_verified':
      return 'care';
    case 'in_progress':
      return 'care';
    case 'completed':
      return 'rx';
    default:
      return 'travel';
  }
}
