import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, MapPin, Navigation, User, Video } from 'lucide-react-native';
import { Job } from '../../../services/api';
import { useProviderDuty } from '../../../context/ProviderDutyContext';
import { useProviderModal } from '../../../context/ProviderModalContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProviderAppointments, acceptProviderAppointment, rejectProviderAppointment } from '../../../services/apiHelpers';
import ProviderShell from '../../../components/provider/ProviderShell';
import ProviderCard from '../../../components/provider/ProviderCard';
import { PROVIDER_THEME } from '../../../theme/providerTheme';
import { moderateScale } from '../../../utils/responsive';
import { jobMatchesSearch } from '../../../utils/jobFilters';
import JobsSearchFilter from '../../../components/JobsSearchFilter';

export default function ProviderJobsTab() {
  const {
    jobs,
    refreshJobs,
    isOnline,
    setIsOnline,
    incomingCount,
    openActiveVisit,
    openPatientDetail,
    openVideoCall,
    canVideoCallForJob,
    activeJob: jobsActiveJob,
  } = useProviderDuty();
  const { showNotifications, showConfirm } =
    useProviderModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'accepted' | 'rejected' | 'completed'>('new');

  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const mapApiStatus = (status: string) => {
    if (status === 'bookingAttempted' || status === 'scheduled') return 'new';
    if (status === 'accepted') return 'accepted';
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'rejected') return 'rejected';
    if (status === 'ongoing') return 'ongoing';
    return 'new';
  };

  const loadApiJobs = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      setLoading(true);
      const res: any = await getProviderAppointments(id);
      if (res?.status === 'success' || res?.data?.status === 'success') {
        const data = res?.data?.data || res?.data || [];
        const mappedJobs = data.map((a: any) => ({
          id: a.appointmentId,
          patientId: a.userId,
          patientName: a.patientDetails?.patientName || 'Patient Name',
          serviceType:  'Home Visit',
          description: a.appointmentReason || '',
          dateTime: `${a.appointmentDate?.split('T')[0] || a.appointmentDate} at ${a.appointmentTime}`,
          duration: '1 hr',
          location: a.completeAddress || '',
          payout: a.amount || 0,
          status: mapApiStatus(a.appointmentStatus),
          executionStatus: a.appointmentStatus
        }));
        setApiJobs(mappedJobs);
      }
    } catch (e) {
      console.log('Error fetching api jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadApiJobs();
    }, [isOnline, activeTab])
  );

  const visibleJobs = useMemo(() => {
    if (activeTab === 'new') {
      return apiJobs.filter(j => j.status === 'new');
    } else if (activeTab === 'accepted') {
      return apiJobs.filter(
        j =>
          j.status === 'accepted' ||
          j.status === 'ongoing',
      );
    } else if (activeTab === 'completed') {
      return apiJobs.filter(j => j.status === 'completed');
    } else {
      return apiJobs.filter(
        j => j.status === 'rejected' || j.status === 'cancelled',
      );
    }
  }, [apiJobs, activeTab]);

  const filteredJobs = useMemo(() => {
    return visibleJobs.filter(
      j => jobMatchesSearch(j, searchQuery),
    );
  }, [visibleJobs, searchQuery]);

  const handleAccept = async (job: Job) => {
    try {
      const res: any = await acceptProviderAppointment({ appointmentId: job.id });
      if (res?.data?.status === 'success' || res.data) {
        loadApiJobs();
      }
    } catch (e) {
      console.log('Error accepting', e);
    }
  };

  const handleReject = (job: Job) => {
    showConfirm({
      title: 'Decline Request?',
      message: `Are you sure you want to decline the request for ${job.patientName}?`,
      confirmLabel: 'Decline',
      destructive: true,
      icon: 'warning',
      onConfirm: async () => {
        try {
          const res: any = await rejectProviderAppointment({ appointmentId: job.id, rejectionReason: 'Provider unavailable' });
          if (res?.data?.status === 'success' || res.data) {
            loadApiJobs();
          }
        } catch (e) {
          console.log('Error rejecting', e);
        }
      }
    });
  };

  const handleDutyToggle = (next: boolean) => {
    if (next) {
      setIsOnline(true);
      loadApiJobs();
      return;
    }
    setIsOnline(false);
  };

  const renderJob = ({ item }: { item: Job }) => {
    const canAccept = item.status === 'new' && isOnline;
    const canContinue =
      item.status === 'accepted' || item.status === 'ongoing';
    const isRejectedItem = item.status === 'rejected' || item.status === 'cancelled';
    const videoOk = canVideoCallForJob(item);

    return (
      <ProviderCard style={StyleSheet.flatten([styles.jobCard, isRejectedItem && styles.jobCardRejected])}>
        <View style={styles.jobHead}>
          <TouchableOpacity
            style={styles.patientTap}
            onPress={() => openPatientDetail(item.patientId)}>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <User color={PROVIDER_THEME.teal} size={moderateScale(14)} />
          </TouchableOpacity>
          <View
            style={[
              styles.statusPill,
              item.status === 'new' && styles.pill_new,
              item.status === 'accepted' && styles.pill_accepted,
              item.status === 'ongoing' && styles.pill_ongoing,
              item.status === 'completed' && styles.pill_completed,
              isRejectedItem && styles.pill_rejected,
            ]}>
            <Text style={[styles.statusText, isRejectedItem && styles.statusTextRejected]}>
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={styles.service}>{item.serviceType}</Text>
        <Text style={styles.desc}>{item.description}</Text>
        <View style={styles.meta}>
          <Clock size={14} color={PROVIDER_THEME.textMuted} />
          <Text style={styles.metaText}>
            {item.dateTime} · {item.duration}
          </Text>
        </View>
        <View style={styles.meta}>
          <MapPin size={14} color={PROVIDER_THEME.textMuted} />
          <Text style={styles.metaText} numberOfLines={2}>
            {item.location}
          </Text>
        </View>
        <Text style={styles.payout}>₹{item.payout}</Text>
        {canAccept ? (
          <View style={styles.rowBtn}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => handleReject(item)}>
              <Text style={styles.outlineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fillBtn}
              onPress={() => handleAccept(item)}>
              <Text style={styles.fillText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {canContinue && item.executionStatus !== 'completed' ? (
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => openActiveVisit(item.id)}>
            <Navigation color="#FFF" size={16} />
            <Text style={styles.fillText}>Continue visit</Text>
          </TouchableOpacity>
        ) : null}
        {videoOk && item.status !== 'new' ? (
          <TouchableOpacity
            style={styles.videoBtn}
            onPress={() =>
              openVideoCall(item.patientName, item.id, 'patient')
            }>
            <Video color={PROVIDER_THEME.violet} size={moderateScale(16)} />
            <Text style={styles.videoBtnText}>Video follow-up</Text>
          </TouchableOpacity>
        ) : null}
      </ProviderCard>
    );
  };

  const getEmptyMessage = () => {
    if (activeTab === 'new') {
      return 'No new orders. Stay online for live requests.';
    } else if (activeTab === 'accepted') {
      return 'No active orders. Your accepted orders will appear here.';
    } else if (activeTab === 'completed') {
      return 'No completed orders yet. Your finished visits will appear here.';
    } else {
      return 'No rejected orders.';
    }
  };

  return (
    <ProviderShell
      title="Jobs"
      subtitle={`${filteredJobs.length} of ${visibleJobs.length} orders`}
      incomingCount={incomingCount}
      onNotifications={showNotifications}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'new', label: 'New' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'completed', label: 'Completed' },
          { key: 'rejected', label: 'Rejected' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
              activeTab === tab.key && tab.key === 'rejected' && styles.tabActiveRejected,
            ]}
            onPress={() => setActiveTab(tab.key as 'new' | 'accepted' | 'rejected' | 'completed')}>
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <JobsSearchFilter
        query={searchQuery}
        onQueryChange={setSearchQuery}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PROVIDER_THEME.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : visibleJobs.length === 0 ? (
        <ProviderCard>
          <Text style={styles.empty}>{getEmptyMessage()}</Text>
        </ProviderCard>
      ) : filteredJobs.length === 0 ? (
        <ProviderCard>
          <Text style={styles.empty}>
            No jobs match your search. Try clearing the search.
          </Text>
        </ProviderCard>
      ) : (
        filteredJobs.map(item => (
          <View key={item.id}>{renderJob({ item })}</View>
        ))
      )}
    </ProviderShell>
  );
}

const styles = StyleSheet.create({
  jobCard: { marginBottom: moderateScale(10) },
  jobCardRejected: {
    borderLeftWidth: 3,
    borderLeftColor: PROVIDER_THEME.error,
    backgroundColor: '#FEF2F2', // Solid color to prevent Android shadow bleed
  },
  jobHead: { flexDirection: 'row', justifyContent: 'space-between' },
  patientTap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  patientName: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  statusPill: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(8),
    backgroundColor: '#E2E8F0',
  },
  pill_new: { backgroundColor: 'rgba(13, 148, 136, 0.15)' },
  pill_accepted: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  pill_ongoing: { backgroundColor: 'rgba(99, 102, 241, 0.15)' },
  pill_completed: { backgroundColor: '#F1F5F9' },
  pill_rejected: {
    backgroundColor: 'rgba(220, 74, 104, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 74, 104, 0.3)',
  },
  statusText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    textTransform: 'capitalize',
    color: PROVIDER_THEME.navy,
  },
  statusTextRejected: {
    color: PROVIDER_THEME.error,
  },
  service: {
    color: PROVIDER_THEME.primary,
    fontWeight: '700',
    marginTop: moderateScale(8),
  },
  desc: {
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(13),
    marginTop: moderateScale(6),
    lineHeight: moderateScale(20),
  },
  meta: { flexDirection: 'row', gap: 8, marginTop: moderateScale(8) },
  metaText: { flex: 1, fontSize: moderateScale(12), color: PROVIDER_THEME.textMuted },
  payout: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginTop: moderateScale(10),
  },
  rowBtn: { flexDirection: 'row', gap: 10, marginTop: moderateScale(14) },
  outlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    alignItems: 'center',
  },
  outlineText: { fontWeight: '700', color: PROVIDER_THEME.textMuted },
  fillBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PROVIDER_THEME.primary,
    alignItems: 'center',
  },
  fillText: { fontWeight: '800', color: '#FFF' },
  continueBtn: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.navy,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: moderateScale(12),
  },
  offlineHint: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.warning,
    fontWeight: '600',
  },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: moderateScale(10),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  videoBtnText: {
    fontWeight: '800',
    color: PROVIDER_THEME.violet,
    fontSize: moderateScale(13),
  },
  empty: { textAlign: 'center', color: PROVIDER_THEME.textMuted },
  loadingContainer: {
    padding: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.pearl,
    borderWidth: 1.5,
    borderColor: PROVIDER_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: PROVIDER_THEME.navy,
    borderColor: PROVIDER_THEME.navy,
    shadowColor: PROVIDER_THEME.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabActiveRejected: {
    backgroundColor: PROVIDER_THEME.error,
    borderColor: PROVIDER_THEME.error,
    shadowColor: PROVIDER_THEME.error,
  },
  tabText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
});
