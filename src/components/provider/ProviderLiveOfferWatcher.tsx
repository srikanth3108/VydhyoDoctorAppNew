import {useEffect, useRef} from 'react';
import {useProviderDuty} from '../../context/ProviderDutyContext';
import {useProviderModal} from '../../context/ProviderModalContext';
import { LIVE_OFFER_SECONDS } from '../../screens/constants/providerModals';

/**
 * Surfaces urgent incoming-offer sheet when provider is on duty and a new booking appears.
 */
export default function ProviderLiveOfferWatcher() {
  const {isOnline, jobs, activeJob} = useProviderDuty();
  const {modal, showIncomingOffer, closeModal} = useProviderModal();
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isOnline || activeJob) return;

    const modalBlocks =
      modal.type !== 'none' &&
      modal.type !== 'incoming_offer' &&
      modal.type !== 'decline_job';

    if (modalBlocks) return;

    const incoming = jobs.filter(j => j.status === 'new');
    const fresh = incoming.find(j => !seenIds.current.has(j.id));
    if (!fresh) return;

    seenIds.current.add(fresh.id);
    showIncomingOffer(fresh, Date.now() + LIVE_OFFER_SECONDS * 1000);
  }, [isOnline, jobs, activeJob, modal.type, showIncomingOffer]);

  useEffect(() => {
    if (modal.type !== 'incoming_offer') return;
    const jobId = modal.job.id;
    const stillNew = jobs.some(j => j.id === jobId && j.status === 'new');
    if (!stillNew) closeModal();
  }, [jobs, modal, closeModal]);

  return null;
}
