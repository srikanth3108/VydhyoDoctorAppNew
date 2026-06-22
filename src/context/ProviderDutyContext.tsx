import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Job, Patient, patientIdFromName} from '../services/api';
import type {VideoCallType} from '../navigation/types';
import { navigationRef } from '../navigation/navigationRef';
import { getProviderAppointments } from '../services/apiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mapApiStatus = (status: string) => {
  if (status === 'bookingAttempted' || status === 'scheduled') return 'new';
  if (status === 'accepted') return 'accepted';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'rejected') return 'rejected';
  if (status === 'ongoing') return 'ongoing';
  return 'new';
};

type ProviderDutyContextValue = {
  isOnline: boolean;
  setIsOnline: (v: boolean) => void;
  jobs: Job[];
  loadingJobs: boolean;
  refreshJobs: () => Promise<void>;
  activeJob: Job | null;
  openActiveVisit: (jobId: string) => void;
  openVideoCall: (
    patientName: string,
    jobId?: string,
    callType?: VideoCallType,
  ) => void;
  canVideoCallForJob: (job: Job) => boolean;
  canVideoCallForPatient: (patientId: string) => boolean;
  openPatientDetail: (patientId: string) => void;
  patients: Patient[];
  refreshPatients: () => Promise<void>;
  incomingCount: number;
};

const ProviderDutyContext = createContext<ProviderDutyContextValue | null>(
  null,
);

export function ProviderDutyProvider({children}: {children: React.ReactNode}) {
  const [isOnline, setIsOnline] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const refreshJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const id = await AsyncStorage.getItem('userId');
      let apiJobs: Job[] = [];
      if (id) {
        const res: any = await getProviderAppointments(id);
        if (res?.status === 'success' || res?.data?.status === 'success') {
          const data = res?.data?.data || res?.data || [];
          apiJobs = data.map((a: any) => ({
            id: a.appointmentId,
            patientId: a.userId,
            providerId: a.providerId,
            patientName: a.patientDetails?.patientName || 'Patient Name',
            patientAge: a.patientDetails?.age || 0,
            patientGender: a.patientDetails?.gender || '',
            serviceType: 'Home Visit',
            description: a.appointmentReason || '',
            dateTime: `${a.appointmentDate?.split('T')[0] || a.appointmentDate} at ${a.appointmentTime}`,
            duration: '1 hr',
            location: a.completeAddress || 'Patient Address',
            payout: a.amount || 0,
            status: mapApiStatus(a.appointmentStatus),
            executionStatus: a.appointmentStatus,
            reports: [],
            otpCode: a.otp || '',
          }));

          // Derive patients from appointments
          const patientMap = new Map<string, Patient>();
          data.forEach((a: any) => {
            const pid = a.userId;
            if (!patientMap.has(pid)) {
              patientMap.set(pid, {
                id: pid,
                name: a.patientDetails?.patientName || pid,
                age: a.patientDetails?.age || 0,
                gender: a.patientDetails?.gender || '',
                conditions: [],
                allergies: [],
                emergencyContact: a.patientPhone || '',
                address: a.completeAddress || '',
                vitals: {},
                visitHistory: [],
                firstHomeVisitCompleted: false,
              });
            }
          });
          
          const patientsList = Array.from(patientMap.values());
          // Update firstHomeVisitCompleted boolean dynamically based on whether there is a completed visit
          patientsList.forEach(p => {
            p.firstHomeVisitCompleted = apiJobs.some(
              j => j.patientId === p.id && j.status === 'completed'
            );
          });
          setPatients(patientsList);
        }
      }
      setJobs(apiJobs);
    } catch (e) {
      console.log('Error refreshing jobs context', e);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    await refreshJobs();
  }, [refreshJobs]);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  const activeJob = useMemo(
    () =>
      jobs.find(
        j =>
          (j.status === 'accepted' || j.status === 'ongoing') &&
          j.executionStatus !== 'completed',
      ) ?? null,
    [jobs],
  );

  const incomingCount = useMemo(
    () => (isOnline ? jobs.filter(j => j.status === 'new').length : 0),
    [isOnline, jobs],
  );

  const openActiveVisit = useCallback((jobId: string) => {
    if (!navigationRef.isReady()) {
      return;
    }
    navigationRef.navigate('Provider', {
      screen: 'ActiveVisit',
      params: {jobId},
    });
  }, []);

  const canVideoCallForPatient = useCallback(
    (patientId: string) => {
      return jobs.some(j => j.patientId === patientId && j.status === 'completed');
    },
    [jobs],
  );

  const canVideoCallForJob = useCallback(
    (job: Job) => {
      return jobs.some(j => j.patientId === job.patientId && j.status === 'completed');
    },
    [jobs],
  );

  const openVideoCall = useCallback(
    (
      patientName: string,
      jobId?: string,
      callType: VideoCallType = 'patient',
    ) => {
      const matched = jobId ? jobs.find(j => j.id === jobId) : undefined;
      const patientId =
        matched?.patientId ?? patientIdFromName(patientName);
      if (!canVideoCallForPatient(patientId)) {
        return;
      }
      if (!navigationRef.isReady()) {
        return;
      }
      navigationRef.navigate('Provider', {
        screen: 'VideoCall',
        params: {patientName, jobId, callType},
      });
    },
    [jobs, canVideoCallForPatient],
  );

  const openPatientDetail = useCallback((patientId: string) => {
    if (!navigationRef.isReady()) {
      return;
    }
    navigationRef.navigate('Provider', {
      screen: 'PatientDetail',
      params: {patientId},
    });
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      setIsOnline,
      jobs,
      loadingJobs,
      refreshJobs,
      activeJob,
      openActiveVisit,
      openVideoCall,
      canVideoCallForJob,
      canVideoCallForPatient,
      openPatientDetail,
      patients,
      refreshPatients,
      incomingCount,
    }),
    [
      isOnline,
      jobs,
      loadingJobs,
      refreshJobs,
      activeJob,
      openActiveVisit,
      openVideoCall,
      canVideoCallForJob,
      canVideoCallForPatient,
      openPatientDetail,
      patients,
      refreshPatients,
      incomingCount,
    ],
  );

  return (
    <ProviderDutyContext.Provider value={value}>
      {children}
    </ProviderDutyContext.Provider>
  );
}

export function useProviderDuty() {
  const ctx = useContext(ProviderDutyContext);
  if (!ctx) {
    throw new Error('useProviderDuty must be used within ProviderDutyProvider');
  }
  return ctx;
}
