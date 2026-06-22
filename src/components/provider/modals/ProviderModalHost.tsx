import React, {useCallback} from 'react';
import {StyleSheet, View} from 'react-native';
import Toast from 'react-native-toast-message';
import {useProviderModal} from '../../../context/ProviderModalContext';
import {useProviderDuty} from '../../../context/ProviderDutyContext';
import {mockApi} from '../../../services/api';
import DeclineJobModal from './DeclineJobModal';
import AcceptJobModal from './AcceptJobModal';
import ConfirmActionModal from './ConfirmActionModal';
import CompleteVisitModal from './CompleteVisitModal';
import DispatchRadiusModal from './DispatchRadiusModal';
import IncomingLiveOfferModal from './IncomingLiveOfferModal';
import CancelActiveVisitModal from './CancelActiveVisitModal';
import MarkArrivedModal from './MarkArrivedModal';
import NotificationsModal from './NotificationsModal';
import SupportHotlineModal from './SupportHotlineModal';

export default function ProviderModalHost() {
  const {modal, closeModal, showDeclineJob} = useProviderModal();
  const {refreshJobs, openActiveVisit, canVideoCallForJob} = useProviderDuty();

  const handleOfferExpired = useCallback(async () => {
    if (modal.type !== 'incoming_offer') return;
    try {
      await mockApi.rejectJob(modal.job.id, 'Offer expired (no response in time)');
      Toast.show({
        type: 'info',
        text1: 'Offer expired',
        text2: 'Dispatch sent this booking to another provider.',
      });
      await refreshJobs();
    } catch {
      /* ignore */
    }
    closeModal();
  }, [modal, closeModal, refreshJobs]);

  const overlay = (content: React.ReactNode) => (
    <View style={styles.overlay} pointerEvents="box-none">
      {content}
    </View>
  );

  if (modal.type === 'none') {
    return null;
  }

  if (modal.type === 'decline_job') {
    return overlay(
      <DeclineJobModal
        job={modal.job}
        visible
        onClose={closeModal}
        onDeclined={refreshJobs}
      />,
    );
  }

  if (modal.type === 'accept_job') {
    return overlay(
      <AcceptJobModal
        job={modal.job}
        visible
        onClose={closeModal}
        videoUnlocked={canVideoCallForJob(modal.job)}
        onAccepted={jobId => {
          refreshJobs();
          modal.onAccepted?.(jobId);
          openActiveVisit(jobId);
        }}
      />,
    );
  }

  if (modal.type === 'incoming_offer') {
    return overlay(
      <IncomingLiveOfferModal
        job={modal.job}
        visible
        expiresAt={modal.expiresAt}
        onClose={closeModal}
        onAccept={job => {
          refreshJobs();
          openActiveVisit(job.id);
        }}
        onDecline={job => {
          closeModal();
          showDeclineJob(job);
        }}
        onExpired={handleOfferExpired}
      />,
    );
  }

  if (modal.type === 'mark_arrived') {
    return overlay(
      <MarkArrivedModal
        job={modal.job}
        visible
        onClose={closeModal}
        onConfirm={modal.onConfirm}
      />,
    );
  }

  if (modal.type === 'cancel_visit') {
    return overlay(
      <CancelActiveVisitModal
        job={modal.job}
        visible
        onClose={closeModal}
        onCancelled={() => {
          modal.onCancelled();
          refreshJobs();
        }}
      />,
    );
  }

  if (modal.type === 'notifications') {
    return overlay(<NotificationsModal visible onClose={closeModal} />);
  }

  if (modal.type === 'support_hotline') {
    return overlay(<SupportHotlineModal visible onClose={closeModal} />);
  }

  if (modal.type === 'confirm') {
    return overlay(
      <ConfirmActionModal visible payload={modal.payload} onClose={closeModal} />,
    );
  }

  if (modal.type === 'visit_complete') {
    return overlay(
      <CompleteVisitModal
        job={modal.job}
        visible
        onClose={closeModal}
        onConfirm={modal.onComplete}
      />,
    );
  }

  if (modal.type === 'invalid_otp') {
    return overlay(
      <ConfirmActionModal
        visible
        payload={{
          title: 'Invalid OTP',
          message:
            'The code does not match the patient app. Ask the patient to read the 4-digit OTP on their screen.',
          confirmLabel: 'Try again',
          cancelLabel: 'Close',
          icon: 'warning',
          onConfirm: () => {
            modal.onRetry?.();
          },
        }}
        onClose={closeModal}
      />,
    );
  }

  if (modal.type === 'dispatch_radius') {
    return overlay(
      <DispatchRadiusModal
        visible
        currentKm={modal.currentKm}
        onClose={closeModal}
        onSelect={modal.onSelect}
      />,
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
