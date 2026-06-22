import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Phone,
  MapPin,
  FileText,
  Heart,
  Droplets,
  Thermometer,
  Activity,
  AlertCircle,
  Clock,
  Video,
  Lock,
} from 'lucide-react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProviderStackParamList} from '../../navigation/types';
import type {Patient} from '../../services/api';
import {useProviderDuty} from '../../context/ProviderDutyContext';
import {useProviderModal} from '../../context/ProviderModalContext';
import CarePathwayBanner from '../../components/provider/CarePathwayBanner';
import VideoCallButton from '../../components/provider/VideoCallButton';
import ProviderCard from '../../components/provider/ProviderCard';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type RouteProps = RouteProp<ProviderStackParamList, 'PatientDetail'>;
type Nav = NativeStackNavigationProp<ProviderStackParamList, 'PatientDetail'>;

export default function PatientDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {openVideoCall, jobs, patients, canVideoCallForPatient} = useProviderDuty();
  const {showConfirm} = useProviderModal();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const patientId = route.params.patientId;
    const matchedPatient = patients.find(p => p.id === patientId);
    if (matchedPatient) {
      setPatient(matchedPatient);
    } else {
      setPatient(null);
    }
    setLoading(false);
  }, [route.params.patientId, patients]);

  useEffect(() => {
    load();
  }, [load]);

  const patientJobs = jobs.filter(
    j =>
      (j.patientId ?? '') === route.params.patientId ||
      j.patientName === patient?.name,
  );
  const activeJob = patientJobs.find(
    j =>
      (j.status === 'accepted' || j.status === 'ongoing') &&
      j.executionStatus !== 'completed',
  );
  const videoAllowed = canVideoCallForPatient(route.params.patientId);

  const handleVideo = () => {
    if (!videoAllowed || !patient) {
      showConfirm({
        title: 'Home visit required',
        message:
          'Complete the first in-home visit with this patient before starting a video consultation.',
        confirmLabel: 'Got it',
        icon: 'info',
        onConfirm: () => {},
      });
      return;
    }
    openVideoCall(patient.name, activeJob?.id, 'patient');
  };

  if (loading || !patient) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PROVIDER_THEME.primary} />
      </View>
    );
  }

  const vitals = [
    {label: 'Blood pressure', value: patient.vitals.bp, icon: Heart},
    {label: 'Heart rate', value: patient.vitals.heartRate, icon: Activity},
    {label: 'SpO₂', value: patient.vitals.spo2, icon: Droplets},
    {label: 'Glucose', value: patient.vitals.glucose, icon: Activity},
    {label: 'Temperature', value: patient.vitals.temperature, icon: Thermometer},
  ].filter(v => v.value);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PROVIDER_THEME.bg} />
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <ArrowLeft color={PROVIDER_THEME.navy} size={moderateScale(22)} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>Patient chart</Text>
            <Text style={styles.topSub}>Real-time clinical record</Text>
          </View>
          <View style={styles.liveChip}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor:
                    patient.liveStatus === 'critical'
                      ? PROVIDER_THEME.error
                      : patient.liveStatus === 'monitoring'
                        ? PROVIDER_THEME.warning
                        : PROVIDER_THEME.success,
                },
              ]}
            />
            <Text style={styles.liveText}>
              {(patient.liveStatus ?? 'stable').toUpperCase()}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroInitial}>{patient.name.charAt(0)}</Text>
          </View>
          <Text style={styles.heroName}>{patient.name}</Text>
          <Text style={styles.heroMeta}>
            {patient.age} years · {patient.gender}
            {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
          </Text>
        </View>

        <CarePathwayBanner homeVisitDone={patient.firstHomeVisitCompleted} />

        {videoAllowed ? (
          <VideoCallButton
            label="Start video consultation"
            onPress={handleVideo}
            style={styles.videoBtn}
          />
        ) : (
          <View style={styles.lockedVideo}>
            <Lock color={PROVIDER_THEME.textMuted} size={moderateScale(18)} />
            <Text style={styles.lockedText}>
              Video unlocks after you complete the first home visit with this patient.
            </Text>
          </View>
        )}

        <Text style={styles.section}>Live vitals</Text>
        <View style={styles.vitalsGrid}>
          {vitals.map(v => {
            const Icon = v.icon;
            return (
              <ProviderCard key={v.label} style={styles.vitalCard}>
                <Icon color={PROVIDER_THEME.teal} size={moderateScale(18)} />
                <Text style={styles.vitalValue}>{v.value}</Text>
                <Text style={styles.vitalLabel}>{v.label}</Text>
              </ProviderCard>
            );
          })}
        </View>
        {patient.vitals.recordedAt ? (
          <View style={styles.vitalsTime}>
            <Clock size={12} color={PROVIDER_THEME.textSoft} />
            <Text style={styles.vitalsTimeText}>
              Last sync: {patient.vitals.recordedAt}
            </Text>
          </View>
        ) : null}

        <Text style={styles.section}>Clinical profile</Text>
        <ProviderCard>
          <Text style={styles.fieldLabel}>Conditions</Text>
          {patient.conditions.map(c => (
            <Text key={c} style={styles.fieldValue}>
              • {c}
            </Text>
          ))}
          <Text style={[styles.fieldLabel, {marginTop: moderateScale(12)}]}>
            Allergies
          </Text>
          <View style={styles.allergyRow}>
            <AlertCircle color={PROVIDER_THEME.coral} size={moderateScale(16)} />
            <Text style={styles.allergyText}>
              {patient.allergies.join(', ')}
            </Text>
          </View>
        </ProviderCard>

        <Text style={styles.section}>Contact & location</Text>
        <ProviderCard>
          <View style={styles.contactRow}>
            <Phone color={PROVIDER_THEME.teal} size={moderateScale(18)} />
            <Text style={styles.contactText}>{patient.emergencyContact}</Text>
          </View>
          <View style={[styles.contactRow, {marginTop: moderateScale(10)}]}>
            <MapPin color={PROVIDER_THEME.teal} size={moderateScale(18)} />
            <Text style={styles.contactText}>{patient.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.address)}`,
              )
            }>
            <Text style={styles.mapBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </ProviderCard>

        <Text style={styles.section}>Visit timeline</Text>
        {patient.visitHistory.length === 0 ? (
          <ProviderCard>
            <Text style={styles.emptyTimeline}>No completed visits yet.</Text>
          </ProviderCard>
        ) : (
          patient.visitHistory.map((v, i) => (
            <ProviderCard key={`${v.jobId}-${i}`} style={styles.timelineCard}>
              <View style={styles.timelineHead}>
                <Text style={styles.timelineService}>{v.serviceType}</Text>
                <View
                  style={[
                    styles.timelineBadge,
                    v.status === 'completed' && styles.timelineDone,
                  ]}>
                  <Text style={styles.timelineBadgeText}>{v.status}</Text>
                </View>
              </View>
              <Text style={styles.timelineDate}>{v.date}</Text>
              {v.summary ? (
                <Text style={styles.timelineSummary}>{v.summary}</Text>
              ) : null}
            </ProviderCard>
          ))
        )}

        {patientJobs.some(j => j.reports?.length) ? (
          <>
            <Text style={styles.section}>Medical reports</Text>
            {patientJobs[0].reports.map(r => (
              <TouchableOpacity key={r.name} style={styles.reportRow}>
                <FileText color={PROVIDER_THEME.teal} size={moderateScale(18)} />
                <Text style={styles.reportName}>{r.name}</Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: PROVIDER_THEME.bg},
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.bg,
  },
  safeTop: {backgroundColor: PROVIDER_THEME.bg},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingBottom: moderateScale(12),
  },
  back: {padding: moderateScale(8)},
  topCenter: {flex: 1},
  topTitle: {
    ...PROVIDER_FONTS.title,
    fontSize: moderateScale(18),
    color: PROVIDER_THEME.navy,
  },
  topSub: {fontSize: moderateScale(12), color: PROVIDER_THEME.textMuted},
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PROVIDER_THEME.jadeMuted,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
  },
  liveDot: {width: 8, height: 8, borderRadius: 4},
  liveText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    letterSpacing: 0.6,
  },
  scroll: {padding: moderateScale(18), paddingBottom: moderateScale(40)},
  hero: {alignItems: 'center', marginBottom: moderateScale(16)},
  heroAvatar: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(24),
    backgroundColor: PROVIDER_THEME.jade,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(10),
  },
  heroInitial: {fontSize: moderateScale(32), fontWeight: '800', color: '#FFF'},
  heroName: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    letterSpacing: -0.5,
  },
  heroMeta: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
    fontWeight: '600',
  },
  videoBtn: {marginBottom: moderateScale(14)},
  lockedVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.surface,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  lockedText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    lineHeight: moderateScale(18),
    fontWeight: '600',
  },
  section: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(10),
    marginTop: moderateScale(4),
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
  },
  vitalCard: {
    width: '47%',
    padding: moderateScale(14),
    minHeight: moderateScale(100),
  },
  vitalValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginTop: moderateScale(8),
  },
  vitalLabel: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
    fontWeight: '600',
  },
  vitalsTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: moderateScale(12),
  },
  vitalsTimeText: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: PROVIDER_THEME.textSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.navy,
    marginTop: moderateScale(6),
    fontWeight: '600',
  },
  allergyRow: {flexDirection: 'row', gap: 8, marginTop: moderateScale(6)},
  allergyText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.coral,
    fontWeight: '700',
  },
  contactRow: {flexDirection: 'row', gap: moderateScale(10), alignItems: 'flex-start'},
  contactText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    lineHeight: moderateScale(20),
    fontWeight: '600',
  },
  mapBtn: {
    marginTop: moderateScale(14),
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  mapBtnText: {color: PROVIDER_THEME.teal, fontWeight: '800', fontSize: moderateScale(12)},
  timelineCard: {padding: moderateScale(14)},
  timelineHead: {flexDirection: 'row', justifyContent: 'space-between'},
  timelineService: {fontWeight: '800', color: PROVIDER_THEME.navy, fontSize: moderateScale(14)},
  timelineBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
    backgroundColor: '#E2E8F0',
  },
  timelineDone: {backgroundColor: 'rgba(16, 185, 129, 0.15)'},
  timelineBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    textTransform: 'capitalize',
    color: PROVIDER_THEME.navy,
  },
  timelineDate: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(4),
  },
  timelineSummary: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
    lineHeight: moderateScale(18),
  },
  emptyTimeline: {textAlign: 'center', color: PROVIDER_THEME.textMuted},
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    backgroundColor: PROVIDER_THEME.surface,
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(8),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  reportName: {fontWeight: '700', color: PROVIDER_THEME.navy, flex: 1},
});
