import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import {
  Briefcase,
  Navigation,
  ChevronRight,
  Clock,
  Calendar,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ProviderTabParamList } from '../../../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProviderAvailability, IProviderDateAvailability, getUserProfile } from '../../../services/apiHelpers';
import { useProviderDuty } from '../../../context/ProviderDutyContext';
import { useProviderModal } from '../../../context/ProviderModalContext';
import ProviderScreenFrame from '../../../components/provider/ProviderScreenFrame';
import ProviderTopBar from '../../../components/provider/ProviderTopBar';
import ProviderIdentityCard from '../../../components/provider/ProviderIdentityCard';
import ProviderCard from '../../../components/provider/ProviderCard';
import ProviderMetricList from '../../../components/provider/ProviderMetricList';
import { PROVIDER_THEME } from '../../../theme/providerTheme';
import { moderateScale } from '../../../utils/responsive';

export default function ProviderHomeTab() {
  const tabNav = useNavigation<BottomTabNavigationProp<ProviderTabParamList>>();
  const scheduleScrollX = useRef(new Animated.Value(0)).current;
  const rootNav = useNavigation<any>();
  const {
    isOnline,
    incomingCount,
    activeJob,
    openActiveVisit,
    jobs,
    refreshJobs,
  } = useProviderDuty();
  const { showGoOfflineConfirm, showNotifications } =
    useProviderModal();
  const [roleTitle, setRoleTitle] = useState('Home Care Provider');
  const [refreshing, setRefreshing] = useState(false);
  const [todaySlots, setTodaySlots] = useState<IProviderDateAvailability | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [providerName, setProviderName] = useState('Vydhyo Care Pro');
  const hasLoadedSlotsRef = useRef(false);

  const loadAvailability = useCallback(async (showLoading = true) => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;

      // Fetch user profile to get the real name and profession
      try {
        const profileRes: any = await getUserProfile(id);
        const resData = profileRes?.data?.data || profileRes?.data || profileRes;

        const user = resData?.user;
        const profile = resData?.profile;

        if (user) {
          const fname = user.firstname || '';
          const lname = user.lastname || '';
          const fullName = `${fname} ${lname}`.trim();
          if (fullName) setProviderName(fullName);

          if (user.specialization && typeof user.specialization === 'object' && user.specialization.name) {
            setRoleTitle(user.specialization.name);
          } else if (user.specialization && typeof user.specialization === 'string') {
            setRoleTitle(user.specialization);
          } else if (profile?.profession) {
            setRoleTitle(profile.profession);
          }
        } else if (profile) {
          if (profile.fullName) setProviderName(profile.fullName);
          if (profile.profession) setRoleTitle(profile.profession);
        } else if (profileRes?.data?.fullName) {
          setProviderName(profileRes.data.fullName);
          if (profileRes?.data?.profession) setRoleTitle(profileRes.data.profession);
        }
      } catch (err) {
        console.log('Error fetching provider profile:', err);
      }

      if (showLoading) setIsLoadingSlots(true);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const response: any = await getProviderAvailability(id, todayStr, todayStr);
      if (response?.status === 'success' || response?.data?.status === 'success') {
        const data = response?.data || response;
        if (data.dates && data.dates.length > 0) {
          setTodaySlots(data.dates[0]);
        } else {
          setTodaySlots(null);
        }
      } else {
        setTodaySlots(null);
      }
    } catch (e) {
      setTodaySlots(null);
    } finally {
      if (showLoading) setIsLoadingSlots(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch availability, but only show loader on first focus
      loadAvailability(!hasLoadedSlotsRef.current);
      hasLoadedSlotsRef.current = true;
      // Refresh jobs silently in the background
      refreshJobs();
    }, [loadAvailability, refreshJobs])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshJobs(), loadAvailability(false)]);
    setRefreshing(false);
  };

  // Compute today's upcoming jobs sorted by time, with new orders first
  const todayJobs = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    return jobs
      .filter(j => {
        const status = j.status;
        const isToday = j.dateTime?.startsWith(todayStr);
        return (
          isToday && (status === 'new' || status === 'accepted' || status === 'ongoing')
        );
      })
      .sort((a, b) => {
        // Prioritize new orders first
        if (a.status === 'new' && b.status !== 'new') return -1;
        if (a.status !== 'new' && b.status === 'new') return 1;
        // Then sort by appointmentTime embedded in dateTime string
        const timeA = a.dateTime?.split(' at ')[1] || '';
        const timeB = b.dateTime?.split(' at ')[1] || '';
        return timeA.localeCompare(timeB);
      });
  }, [jobs]);

  return (
    <ProviderScreenFrame
      hero={
        <ProviderTopBar
          incomingCount={incomingCount}
          onNotifications={showNotifications}
          onBack={() => rootNav.navigate('DoctorDashboard')}
        />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}>
      <ProviderIdentityCard
        displayName={providerName}
        roleTitle={roleTitle}
        isOnline={isOnline}
      />
      <View style={styles.spacer} />

      {/* Active Home Visit Banner */}
      {activeJob ? (
        <ProviderCard accent stripe="jade" style={styles.activeVisitCard}>
          <View style={styles.activeHeader}>
            <View style={styles.activeLabelContainer}>
              <View style={styles.activeLabelDot} />
              <Text style={styles.activeLabel}>ACTIVE HOME VISIT</Text>
            </View>
            <Text style={styles.activeTime}>{activeJob.dateTime}</Text>
          </View>
          <Text style={styles.activePatient}>{activeJob.patientName}</Text>
          <Text style={styles.activeService}>{activeJob.serviceType}</Text>
          <Text style={styles.activeLoc} numberOfLines={1}>
            {activeJob.location}
          </Text>
          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => openActiveVisit(activeJob.id)}>
            <Navigation color="#FFF" size={moderateScale(18)} />
            <Text style={styles.continueText}>Continue visit</Text>
            <ChevronRight color="#FFF" size={moderateScale(18)} />
          </TouchableOpacity>
        </ProviderCard>
      ) : null}

      {/* Today's Schedule */}
      <View style={styles.sectionHead}>
        <Calendar color={PROVIDER_THEME.teal} size={moderateScale(18)} />
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todayJobs.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{todayJobs.length}</Text>
          </View>
        )}
      </View>

      {todayJobs.length === 0 ? (
        <ProviderCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No appointments for today. Check back later.
          </Text>
          <TouchableOpacity
            style={styles.jobBoardBtn}
            onPress={() => tabNav.navigate('Jobs')}>
            <Text style={styles.jobBoardText}>View all jobs</Text>
            <ChevronRight color={PROVIDER_THEME.teal} size={moderateScale(14)} />
          </TouchableOpacity>
        </ProviderCard>
      ) : (
        <Animated.FlatList
          data={todayJobs}
          keyExtractor={(item: any) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={moderateScale(300) + moderateScale(12)}
          decelerationRate="fast"
          contentContainerStyle={[
            styles.scheduleScrollContainer,
            todayJobs.length === 1 && { flexGrow: 1, justifyContent: 'center' }
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scheduleScrollX } } }],
            { useNativeDriver: true }
          )}
          renderItem={({ item: job, index }) => {
            const timeStr = job.dateTime?.split(' at ')[1] || job.dateTime;
            const isActive =
              job.status === 'accepted' || job.status === 'ongoing';
            const isNew = job.status === 'new';

            const ITEM_WIDTH = moderateScale(300);
            const SPACING = moderateScale(12);
            const FULL_SIZE = ITEM_WIDTH + SPACING;

            const inputRange = [
              (index - 1) * FULL_SIZE,
              index * FULL_SIZE,
              (index + 1) * FULL_SIZE,
            ];

            const scale = scheduleScrollX.interpolate({
              inputRange,
              outputRange: [0.95, 1, 0.95],
              extrapolate: 'clamp'
            });

            const opacity = scheduleScrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1, 0.8],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View style={{ transform: [{ scale }], opacity }}>
                <ProviderCard
                  style={{
                    ...styles.scheduleCard,
                    ...(isNew && styles.scheduleCardNew),
                    ...(isActive && !isNew && styles.scheduleCardActive)
                  }}>
                  <View style={styles.scheduleRow}>
                    <View style={styles.timeBlock}>
                      <Clock
                        size={moderateScale(14)}
                        color={isNew ? '#FBBF24' : isActive ? PROVIDER_THEME.teal : PROVIDER_THEME.textMuted}
                      />
                      <Text
                        style={[
                          styles.scheduleTime,
                          isActive && { color: PROVIDER_THEME.teal, fontWeight: '800' },
                          isNew && { color: '#FBBF24', fontWeight: '800' },
                        ]}>
                        {timeStr}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            job.status === 'new'
                              ? '#FBBF24'
                              : job.status === 'ongoing'
                                ? 'rgba(220, 74, 104, 0.15)'
                                : 'rgba(29, 53, 87, 0.1)',
                          borderColor: 'transparent',
                          borderWidth: 0,
                        },
                      ]}
                    >
                      <Text style={[
                        styles.statusBadgeText,
                        {
                          color:
                            job.status === 'new'
                              ? PROVIDER_THEME.navy
                              : job.status === 'ongoing'
                                ? PROVIDER_THEME.error
                                : PROVIDER_THEME.teal,
                        }
                      ]}>
                        {job.status === 'new' ? 'NEW REQUEST' : job.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scheduleInfo}>
                    <Text style={[styles.schedulePatient, isNew && { color: '#FFFFFF' }]}>{job.patientName}</Text>
                    <Text style={[styles.scheduleService, isNew && { color: '#FBBF24' }]}>{job.serviceType}</Text>
                    <Text style={[styles.scheduleLoc, isNew && { color: '#94A3B8' }]} numberOfLines={1}>
                      {job.location}
                    </Text>
                  </View>
                  <View style={[styles.scheduleDivider, isNew && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
                  {isActive ? (
                    <TouchableOpacity
                      style={styles.continueMiniBtn}
                      onPress={() => openActiveVisit(job.id)}>
                      <Navigation color="#FFF" size={moderateScale(14)} />
                      <Text style={styles.continueMiniText}>Continue visit</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.viewJobBtn,
                        isNew && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      ]}
                      onPress={() => tabNav.navigate('Jobs')}>
                      <Text style={[styles.viewJobText, isNew && { color: '#FFFFFF' }]}>View details</Text>
                      <ChevronRight
                        color={isNew ? '#FFFFFF' : PROVIDER_THEME.primary}
                        size={moderateScale(14)}
                      />
                    </TouchableOpacity>
                  )}
                </ProviderCard>
              </Animated.View>
            );
          }}
        />
      )}

      {/* Today's Availability */}
      <View style={styles.sectionHead}>
        <Clock color={PROVIDER_THEME.teal} size={moderateScale(18)} />
        <Text style={styles.sectionTitle}>Today's Availability</Text>
      </View>
      <ProviderCard style={{ paddingHorizontal: moderateScale(20), paddingVertical: moderateScale(18), marginBottom: moderateScale(14) }}>
        {isLoadingSlots ? (
          <View style={{ paddingVertical: moderateScale(10) }}>
            <ActivityIndicator color={PROVIDER_THEME.teal} size="small" />
          </View>
        ) : todaySlots && todaySlots.slots && todaySlots.slots.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              rowGap: moderateScale(10),
            }}
          >
            {todaySlots.slots.map((slot, index) => {
              const [hourStr, minuteStr] = slot.time.split(':');
              const h = parseInt(hourStr, 10);
              const m = parseInt(minuteStr, 10);
              const period = h >= 12 ? 'PM' : 'AM';
              const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
              const displayTime = `${displayHour}:${minuteStr} ${period}`;

              const isAvailable = slot.status === 'available';

              const now = new Date();
              // Add a small offset check or just rely on local hours
              const isPast = h < now.getHours() || (h === now.getHours() && m < now.getMinutes());

              // Determine distinct colors based on state
              let bgColor = '#FFFFFF';
              let borderColor = 'rgba(61, 188, 138, 0.3)';
              let dotColor: string = PROVIDER_THEME.teal;
              let textColor: string = PROVIDER_THEME.navy;
              let useShadow = true;

              if (!isAvailable) {
                // Booked Slots (Light Green Highlight - takes priority even if past)
                bgColor = '#DCFCE7';
                borderColor = '#86EFAC';
                dotColor = '#16A34A';
                textColor = '#166534'; // Deep green text
                useShadow = false;
              } else if (isPast) {
                // Time Completed / Past Slots (Grayed out)
                bgColor = '#F1F5F9';
                borderColor = '#E2E8F0';
                dotColor = '#94A3B8';
                textColor = '#64748B';
                useShadow = false;
              }

              return (
                <View
                  key={index}
                  style={{
                    width: '23.5%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: moderateScale(12),
                    paddingHorizontal: moderateScale(6),
                    borderRadius: moderateScale(10),
                    backgroundColor: bgColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    gap: moderateScale(4),
                    ...(useShadow ? PROVIDER_THEME.shadowStyles.header : {}),
                  }}>
                  {/* Status Indicator Dot */}
                  <View style={{
                    width: moderateScale(6),
                    height: moderateScale(6),
                    borderRadius: moderateScale(3),
                    backgroundColor: dotColor,
                  }} />
                  <Text
                    style={{
                      fontSize: moderateScale(10.5),
                      fontWeight: '800',
                      color: textColor,
                      letterSpacing: 0.2,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {displayTime}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text
            style={{
              fontSize: moderateScale(13),
              color: PROVIDER_THEME.textMuted,
            }}>
            No availability set for today.
          </Text>
        )}
        <TouchableOpacity
          style={{
            marginTop: moderateScale(16),
            alignItems: 'center',
            backgroundColor: PROVIDER_THEME.pearlMuted,
            paddingVertical: moderateScale(12),
            borderRadius: moderateScale(10),
            borderWidth: 1,
            borderColor: PROVIDER_THEME.border,
          }}
          activeOpacity={0.7}
          onPress={() => rootNav.navigate('Availability')}>
          <Text
            style={{
              color: PROVIDER_THEME.navy,
              fontWeight: '700',
              fontSize: moderateScale(14),
            }}>
            Manage Availability
          </Text>
        </TouchableOpacity>
      </ProviderCard>

      {/* Link to job board */}
      <TouchableOpacity
        style={styles.linkCard}
        onPress={() => tabNav.navigate('Jobs')}>
        <View style={styles.linkLeft}>
          <Briefcase color={PROVIDER_THEME.teal} size={moderateScale(20)} />
          <Text style={styles.linkTitle}>Job board & bookings</Text>
        </View>
        <ChevronRight color={PROVIDER_THEME.primary} size={moderateScale(20)} />
      </TouchableOpacity>
    </ProviderScreenFrame>
  );
}

const styles = StyleSheet.create({
  spacer: { height: moderateScale(8) },
  activeVisitCard: {
    padding: moderateScale(16),
    borderColor: 'rgba(13, 148, 136, 0.15)',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  activeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  activeLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PROVIDER_THEME.error,
  },
  activeLabel: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.error,
    letterSpacing: 1,
  },
  activeTime: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: PROVIDER_THEME.textMuted,
  },
  activePatient: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  activeService: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.teal,
    marginTop: moderateScale(2),
  },
  activeLoc: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.navy,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  continueText: { color: '#FFF', fontWeight: '800', fontSize: moderateScale(14) },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
    marginBottom: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.2,
    flex: 1,
  },
  countBadge: {
    backgroundColor: PROVIDER_THEME.teal,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
  },
  countBadgeText: {
    color: '#FFF',
    fontSize: moderateScale(11),
    fontWeight: '800',
  },
  emptyCard: {
    padding: moderateScale(16),
    marginBottom: moderateScale(14),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  jobBoardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(10),
    gap: moderateScale(4),
  },
  jobBoardText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.teal,
  },
  scheduleScrollContainer: {
    gap: moderateScale(12),
    paddingBottom: moderateScale(10),
  },
  scheduleCard: {
    width: moderateScale(300),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  scheduleCardActive: {
    borderColor: PROVIDER_THEME.teal,
    borderWidth: 1.5,
    backgroundColor: '#F9FDFB', // solid color equivalent of rgba(61, 188, 138, 0.03) on white
  },
  scheduleCardNew: {
    backgroundColor: PROVIDER_THEME.navy,
    borderColor: PROVIDER_THEME.navy,
    borderWidth: 1.5,
    shadowColor: PROVIDER_THEME.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  scheduleTime: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  statusBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scheduleInfo: {
    marginBottom: moderateScale(12),
  },
  schedulePatient: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    marginBottom: moderateScale(4),
  },
  scheduleService: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.teal,
  },
  scheduleLoc: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: PROVIDER_THEME.border,
    marginBottom: moderateScale(12),
  },
  continueMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.navy,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  continueMiniText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  viewJobBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(4),
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  viewJobText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.primary,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(3),
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  starText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: PROVIDER_THEME.gold,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PROVIDER_THEME.pearlMuted,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginTop: moderateScale(12),
    borderWidth: 1,
    marginBottom: moderateScale(10),
    borderColor: PROVIDER_THEME.border,
    ...PROVIDER_THEME.shadowStyles.card,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  linkTitle: {
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
    fontSize: moderateScale(14),
  },
  availabilityScroll: {
    marginHorizontal: -moderateScale(16),
    marginBottom: moderateScale(2),
  },
  availabilityScrollContainer: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    borderRadius: moderateScale(24),
    padding: moderateScale(4),
    marginHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: PROVIDER_THEME.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: PROVIDER_THEME.textSoft,
  },
  tabTextActive: {
    color: PROVIDER_THEME.navy,
    fontWeight: '700',
  },
});
