import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Users,
  Heart,
  ChevronRight,
  Activity,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import {useProviderDuty} from '../../context/ProviderDutyContext';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type StatusFilter = 'all' | 'stable' | 'monitoring' | 'critical';

export default function MyPatientsScreen() {
  const navigation = useNavigation();
  const {patients, openPatientDetail} = useProviderDuty();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'stable':
        return '#2D6A4F';
      case 'monitoring':
        return PROVIDER_THEME.warning;
      case 'critical':
        return PROVIDER_THEME.error;
      default:
        return PROVIDER_THEME.textSoft;
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'stable':
        return 'rgba(45, 106, 79, 0.08)';
      case 'monitoring':
        return 'rgba(230, 138, 46, 0.08)';
      case 'critical':
        return 'rgba(220, 74, 104, 0.08)';
      default:
        return 'rgba(138, 153, 168, 0.08)';
    }
  };

  const filteredPatients = (patients || []).filter(patient => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.conditions.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      patient.address.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || patient.liveStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft color={PROVIDER_THEME.navy} size={moderateScale(20)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <View style={styles.introLeft}>
            <Text style={styles.introHeading}>In-Home Patients</Text>
            <Text style={styles.introDesc}>
              Track clinical vitals and histories for clients in your care network. Tapping any card opens detail charts.
            </Text>
          </View>
          <View style={styles.heartIconBg}>
            <Heart color="#E0F7E9" size={moderateScale(24)} fill="#E0F7E9" />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Search color={PROVIDER_THEME.textMuted} size={moderateScale(18)} />
          <TextInput
            placeholder="Search by name, illness or address..."
            placeholderTextColor={PROVIDER_THEME.textSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterPill, statusFilter === 'all' && styles.filterPillSelected]}
            onPress={() => setStatusFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.pillText, statusFilter === 'all' && styles.pillTextSelected]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              statusFilter === 'stable' && [styles.filterPillSelected, {backgroundColor: '#2D6A4F'}],
            ]}
            onPress={() => setStatusFilter('stable')}
            activeOpacity={0.8}
          >
            <View style={[styles.pillIndicator, {backgroundColor: '#2D6A4F'}]} />
            <Text style={[styles.pillText, statusFilter === 'stable' && styles.pillTextSelected]}>Stable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              statusFilter === 'monitoring' && [styles.filterPillSelected, {backgroundColor: PROVIDER_THEME.warning}],
            ]}
            onPress={() => setStatusFilter('monitoring')}
            activeOpacity={0.8}
          >
            <View style={[styles.pillIndicator, {backgroundColor: PROVIDER_THEME.warning}]} />
            <Text style={[styles.pillText, statusFilter === 'monitoring' && styles.pillTextSelected]}>Monitoring</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterPill,
              statusFilter === 'critical' && [styles.filterPillSelected, {backgroundColor: PROVIDER_THEME.error}],
            ]}
            onPress={() => setStatusFilter('critical')}
            activeOpacity={0.8}
          >
            <View style={[styles.pillIndicator, {backgroundColor: PROVIDER_THEME.error}]} />
            <Text style={[styles.pillText, statusFilter === 'critical' && styles.pillTextSelected]}>Critical</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Patient Cards Directory</Text>
          <Text style={styles.listCount}>
            {filteredPatients.length} Client{filteredPatients.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {filteredPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users color={PROVIDER_THEME.textSoft} size={moderateScale(42)} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptyDesc}>No care records matched your filtering or search inputs.</Text>
          </View>
        ) : (
          filteredPatients.map(patient => {
            const statusColor = getStatusColor(patient.liveStatus);
            const statusBg = getStatusBg(patient.liveStatus);
            return (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientCard}
                onPress={() => openPatientDetail(patient.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.initialsBg}>
                      <Text style={styles.initialsText}>
                        {patient.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.demographics}>
                        {patient.age} yrs · {patient.gender} {patient.bloodGroup ? `· Blood ${patient.bloodGroup}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statusBadge, {backgroundColor: statusBg}]}>
                    <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
                    <Text style={[styles.statusText, {color: statusColor}]}>
                      {(patient.liveStatus ?? 'stable').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.conditionsRow}>
                  {patient.conditions.map((condition, cIdx) => (
                    <View key={cIdx} style={styles.conditionTag}>
                      <Text style={styles.conditionText}>{condition}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.vitalsRow}>
                  <View style={styles.vitalBlock}>
                    <Text style={styles.vitalLabel}>BP</Text>
                    <Text style={styles.vitalValue}>{patient.vitals?.bp ?? '--/--'}</Text>
                  </View>
                  <View style={styles.vitalDivider} />
                  <View style={styles.vitalBlock}>
                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                    <Text style={styles.vitalValue}>{patient.vitals?.heartRate ?? '---'}</Text>
                  </View>
                  <View style={styles.vitalDivider} />
                  <View style={styles.vitalBlock}>
                    <Text style={styles.vitalLabel}>Glucose</Text>
                    <Text style={styles.vitalValue} numberOfLines={1}>
                      {patient.vitals?.glucose?.replace(' mg/dL', '') ?? '---'}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.vitalActivity}>
                    <Activity color={PROVIDER_THEME.tealLight} size={moderateScale(12)} />
                    <Text style={styles.vitalTime}>
                      {patient.vitals?.recordedAt ?? 'No recent logs'}
                    </Text>
                  </View>
                  <View style={styles.viewCharts}>
                    <Text style={styles.viewChartsText}>View Charts</Text>
                    <ChevronRight color={PROVIDER_THEME.teal} size={moderateScale(14)} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7E9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
  },
  backBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...PROVIDER_FONTS.title,
    color: PROVIDER_THEME.navy,
  },
  placeholder: {
    width: moderateScale(40),
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  introLeft: {
    flex: 1,
  },
  introHeading: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#E0F7E9',
    marginBottom: moderateScale(4),
  },
  introDesc: {
    fontSize: moderateScale(12),
    color: 'rgba(224, 247, 233, 0.72)',
    lineHeight: moderateScale(18),
  },
  heartIconBg: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: '#3D6A9B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C5EBD8',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    marginBottom: moderateScale(14),
  },
  searchInput: {
    flex: 1,
    height: moderateScale(42),
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    paddingLeft: moderateScale(8),
    fontWeight: '500',
  },
  filterScroll: {
    marginBottom: moderateScale(18),
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    marginRight: moderateScale(8),
    gap: moderateScale(6),
  },
  filterPillSelected: {
    backgroundColor: '#1D3557',
    ...PROVIDER_THEME.shadowStyles.header,
  },
  pillIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  pillTextSelected: {
    color: '#E0F7E9',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  listTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  listCount: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
  },
  initialsBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  patientName: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  demographics: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
    gap: moderateScale(4),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: moderateScale(8),
    fontWeight: '800',
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(6),
    marginTop: moderateScale(12),
  },
  conditionTag: {
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  conditionText: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.navy,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    marginVertical: moderateScale(12),
  },
  vitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
  },
  vitalBlock: {
    flex: 1,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: moderateScale(9),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.navy,
    fontWeight: '800',
    marginTop: 2,
  },
  vitalDivider: {
    width: 1,
    height: moderateScale(22),
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(12),
  },
  vitalActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
  },
  vitalTime: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '500',
  },
  viewCharts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewChartsText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: PROVIDER_THEME.teal,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: moderateScale(18),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(29, 53, 87, 0.15)',
  },
  emptyTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
    marginTop: moderateScale(10),
  },
  emptyDesc: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    textAlign: 'center',
    marginTop: 4,
  },
});
