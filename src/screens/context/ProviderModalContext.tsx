import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type {
  ConfirmModalPayload,
  ProviderModalState,
} from '../constants/providerModals';
import { Job } from '../../services/api';

type ProviderModalContextValue = {
  modal: ProviderModalState;
  closeModal: () => void;
  showDeclineJob: (job: Job) => void;
  showAcceptJob: (job: Job, onAccepted?: (jobId: string) => void) => void;
  showConfirm: (payload: ConfirmModalPayload) => void;
  showCompleteVisit: (
    job: Job,
    onComplete: () => void | Promise<void>,
  ) => void;
  showInvalidOtp: (onRetry?: () => void) => void;
  showDispatchRadius: (currentKm: number, onSelect: (km: number) => void) => void;
  showGoOfflineConfirm: (activeVisitCount: number, onConfirm: () => void) => void;
  showEndVideoCall: (patientName: string, onConfirm: () => void) => void;
  showWithdrawConfirm: (amount: number, onConfirm: () => void | Promise<void>) => void;
  showLogoutConfirm: (onConfirm: () => void) => void;
  showIncomingOffer: (job: Job, expiresAt: number) => void;
  showMarkArrived: (job: Job, onConfirm: () => void | Promise<void>) => void;
  showCancelActiveVisit: (job: Job, onCancelled: () => void) => void;
  showNotifications: () => void;
  showSupportHotline: () => void;
  showPolicyInfo: () => void;
};

const ProviderModalContext = createContext<ProviderModalContextValue | null>(
  null,
);

export function ProviderModalProvider({children}: {children: React.ReactNode}) {
  const [modal, setModal] = useState<ProviderModalState>({type: 'none'});

  const closeModal = useCallback(() => setModal({type: 'none'}), []);

  const showDeclineJob = useCallback((job: Job) => {
    setModal({type: 'decline_job', job});
  }, []);

  const showAcceptJob = useCallback(
    (job: Job, onAccepted?: (jobId: string) => void) => {
      setModal({type: 'accept_job', job, onAccepted});
    },
    [],
  );

  const showConfirm = useCallback((payload: ConfirmModalPayload) => {
    setModal({type: 'confirm', payload});
  }, []);

  const showCompleteVisit = useCallback(
    (job: Job, onComplete: () => void | Promise<void>) => {
      setModal({type: 'visit_complete', job, onComplete});
    },
    [],
  );

  const showInvalidOtp = useCallback((onRetry?: () => void) => {
    setModal({type: 'invalid_otp', onRetry});
  }, []);

  const showDispatchRadius = useCallback(
    (currentKm: number, onSelect: (km: number) => void) => {
      setModal({type: 'dispatch_radius', currentKm, onSelect});
    },
    [],
  );

  const showGoOfflineConfirm = useCallback(
    (activeVisitCount: number, onConfirm: () => void) => {
      showConfirm({
        title: 'Go off duty?',
        message:
          activeVisitCount > 0
            ? `You have ${activeVisitCount} active visit${activeVisitCount > 1 ? 's' : ''}. Finish or hand off before going offline, or you may miss patient updates.`
            : 'You will stop receiving live home-visit offers until you turn duty back on.',
        confirmLabel: 'Go offline',
        destructive: true,
        icon: 'warning',
        onConfirm,
      });
    },
    [showConfirm],
  );

  const showEndVideoCall = useCallback(
    (patientName: string, onConfirm: () => void) => {
      showConfirm({
        title: 'End video call?',
        message: `Disconnect your consultation with ${patientName}? You can call again if video follow-up is unlocked.`,
        confirmLabel: 'End call',
        destructive: true,
        icon: 'video',
        onConfirm,
      });
    },
    [showConfirm],
  );

  const showWithdrawConfirm = useCallback(
    (amount: number, onConfirm: () => void | Promise<void>) => {
      showConfirm({
        title: 'Withdraw pending earnings?',
        message: `₹${amount.toLocaleString('en-IN')} will be queued for transfer to your registered bank account. Processing usually completes within a few minutes.`,
        confirmLabel: 'Withdraw now',
        icon: 'wallet',
        onConfirm,
      });
    },
    [showConfirm],
  );

  const showLogoutConfirm = useCallback(
    (onConfirm: () => void) => {
      showConfirm({
        title: 'Sign out of duty?',
        message:
          'You will need to log in again to accept visits. Active sessions on this device will end.',
        confirmLabel: 'Sign out',
        destructive: true,
        icon: 'logout',
        onConfirm,
      });
    },
    [showConfirm],
  );

  const showIncomingOffer = useCallback((job: Job, expiresAt: number) => {
    setModal({type: 'incoming_offer', job, expiresAt});
  }, []);

  const showMarkArrived = useCallback(
    (job: Job, onConfirm: () => void | Promise<void>) => {
      setModal({type: 'mark_arrived', job, onConfirm});
    },
    [],
  );

  const showCancelActiveVisit = useCallback((job: Job, onCancelled: () => void) => {
    setModal({type: 'cancel_visit', job, onCancelled});
  }, []);

  const showNotifications = useCallback(() => {
    setModal({type: 'notifications'});
  }, []);

  const showSupportHotline = useCallback(() => {
    setModal({type: 'support_hotline'});
  }, []);

  const showPolicyInfo = useCallback(() => {
    showConfirm({
      title: 'Privacy & professional conduct',
      message:
        'Vydhyo providers must follow HIPAA-aligned documentation, obtain patient consent before procedures, and never share OTP or clinical data outside the app.',
      confirmLabel: 'Understood',
      cancelLabel: 'Close',
      icon: 'info',
      onConfirm: () => {},
    });
  }, [showConfirm]);

  const value = useMemo(
    () => ({
      modal,
      closeModal,
      showDeclineJob,
      showAcceptJob,
      showConfirm,
      showCompleteVisit,
      showInvalidOtp,
      showDispatchRadius,
      showGoOfflineConfirm,
      showEndVideoCall,
      showWithdrawConfirm,
      showLogoutConfirm,
      showIncomingOffer,
      showMarkArrived,
      showCancelActiveVisit,
      showNotifications,
      showSupportHotline,
      showPolicyInfo,
    }),
    [
      modal,
      closeModal,
      showDeclineJob,
      showAcceptJob,
      showConfirm,
      showCompleteVisit,
      showInvalidOtp,
      showDispatchRadius,
      showGoOfflineConfirm,
      showEndVideoCall,
      showWithdrawConfirm,
      showLogoutConfirm,
      showIncomingOffer,
      showMarkArrived,
      showCancelActiveVisit,
      showNotifications,
      showSupportHotline,
      showPolicyInfo,
    ],
  );

  return (
    <ProviderModalContext.Provider value={value}>
      {children}
    </ProviderModalContext.Provider>
  );
}

export function useProviderModal() {
  const ctx = useContext(ProviderModalContext);
  if (!ctx) {
    throw new Error('useProviderModal must be used within ProviderModalProvider');
  }
  return ctx;
}
