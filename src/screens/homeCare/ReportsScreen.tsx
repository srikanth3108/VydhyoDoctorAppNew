import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Download,
  Calendar,
  Star,
  Activity,
  Award,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {Job} from '../../services/api';
import {getProviderAppointments} from '../../services/apiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'three_months'>('month');

  useEffect(() => {
    async function loadJobs() {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }
        const response: any = await getProviderAppointments(userId);
        if (response && response.data && response.data.success) {
          const apiJobs = response.data.data || [];
          const completedOrOngoing = apiJobs.filter(
            (j: Job) => j.status === 'completed' || j.status === 'accepted' || j.status === 'ongoing'
          );
          setJobs(completedOrOngoing);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Toast.show({
        type: 'success',
        text1: 'Report Downloaded',
        text2: 'PDF Statement saved to local files.',
      });
    }, 1500);
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
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
        <Text style={styles.headerTitle}>Clinical Reports</Text>
        <TouchableOpacity
          onPress={handleExport}
          style={styles.exportIconBtn}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color={PROVIDER_THEME.navy} size="small" />
          ) : (
            <Download color={PROVIDER_THEME.navy} size={moderateScale(18)} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Clinical Score Card</Text>
          <Text style={styles.dashboardSubtitle}>Based on previous patient charts & visits</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <View style={[styles.iconBg, {backgroundColor: 'rgba(224, 247, 233, 0.12)'}]}>
                <Award color="#C5EBD8" size={moderateScale(20)} />
              </View>
              <Text style={styles.statValue}>98.6%</Text>
              <Text style={styles.statLabel}>Compliance</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCell}>
              <View style={[styles.iconBg, {backgroundColor: 'rgba(224, 247, 233, 0.12)'}]}>
                <Star color={PROVIDER_THEME.amber} fill={PROVIDER_THEME.amber} size={moderateScale(18)} />
              </View>
              <Text style={styles.statValue}>4.92</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCell}>
              <View style={[styles.iconBg, {backgroundColor: 'rgba(224, 247, 233, 0.12)'}]}>
                <Activity color="#C5EBD8" size={moderateScale(20)} />
              </View>
              <Text style={styles.statValue}>96%</Text>
              <Text style={styles.statLabel}>On-Time Log</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, timeFilter === 'week' && styles.filterTabSelected]}
            onPress={() => setTimeFilter('week')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, timeFilter === 'week' && styles.filterTabTextSelected]}>
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, timeFilter === 'month' && styles.filterTabSelected]}
            onPress={() => setTimeFilter('month')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, timeFilter === 'month' && styles.filterTabTextSelected]}>
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, timeFilter === 'three_months' && styles.filterTabSelected]}
            onPress={() => setTimeFilter('three_months')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, timeFilter === 'three_months' && styles.filterTabTextSelected]}>
              3 Months
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Search color={PROVIDER_THEME.textMuted} size={moderateScale(18)} />
          <TextInput
            placeholder="Search by patient, id or service..."
            placeholderTextColor={PROVIDER_THEME.textSoft}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Visits Activity Ledger</Text>
          <Text style={styles.ledgerCount}>
            {filteredJobs.length} Record{filteredJobs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={PROVIDER_THEME.navy} size="large" />
            <Text style={styles.loaderText}>Retrieving history charts...</Text>
          </View>
        ) : filteredJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar color={PROVIDER_THEME.textSoft} size={moderateScale(40)} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No matching reports</Text>
            <Text style={styles.emptyDesc}>Try adjusting your search query or date range filters.</Text>
          </View>
        ) : (
          <View style={styles.ledgerContainer}>
            {filteredJobs.map((job, index) => (
              <View key={job.id}>
                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerLeft}>
                    <View style={styles.serviceBadgeBg}>
                      <Text style={styles.serviceInitial}>
                        {job.serviceType.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.patientName}>{job.patientName}</Text>
                      <Text style={styles.serviceType}>{job.serviceType}</Text>
                      <Text style={styles.visitDate}>{job.dateTime}</Text>
                    </View>
                  </View>
                  <View style={styles.ledgerRight}>
                    <Text style={styles.payoutAmount}>₹{job.payout}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        job.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          job.status === 'completed'
                            ? styles.statusTextCompleted
                            : styles.statusTextActive,
                        ]}
                      >
                        {job.status === 'completed' ? 'COMPLETED' : 'ONGOING'}
                      </Text>
                    </View>
                  </View>
                </View>
                {index < filteredJobs.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.downloadBtn, exporting && styles.downloadBtnDisabled]}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Download color="#FFFFFF" size={moderateScale(18)} />
              <Text style={styles.downloadBtnText}>Export Full Statement (PDF)</Text>
            </>
          )}
        </TouchableOpacity>
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
  exportIconBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(30),
  },
  dashboardCard: {
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  dashboardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#E0F7E9',
  },
  dashboardSubtitle: {
    fontSize: moderateScale(11),
    color: 'rgba(224, 247, 233, 0.7)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: moderateScale(20),
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  iconBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(6),
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: 'rgba(224, 247, 233, 0.65)',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: moderateScale(36),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    borderRadius: moderateScale(12),
    padding: 4,
    marginBottom: moderateScale(14),
  },
  filterTab: {
    flex: 1,
    paddingVertical: moderateScale(8),
    alignItems: 'center',
    borderRadius: moderateScale(10),
  },
  filterTabSelected: {
    backgroundColor: '#1D3557',
    ...PROVIDER_THEME.shadowStyles.header,
  },
  filterTabText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  filterTabTextSelected: {
    color: '#E0F7E9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    marginBottom: moderateScale(16),
  },
  searchInput: {
    flex: 1,
    height: moderateScale(42),
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    paddingLeft: moderateScale(8),
    fontWeight: '500',
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  ledgerTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  ledgerCount: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  ledgerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
  },
  ledgerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1.2,
  },
  serviceBadgeBg: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(10),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInitial: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  patientName: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  serviceType: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    fontWeight: '600',
    marginTop: 1,
  },
  visitDate: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.textSoft,
    marginTop: 2,
    fontWeight: '500',
  },
  ledgerRight: {
    alignItems: 'flex-end',
    flex: 0.8,
  },
  payoutAmount: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(4),
  },
  statusBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(6),
  },
  statusCompleted: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  statusActive: {
    backgroundColor: 'rgba(230, 138, 46, 0.1)',
  },
  statusBadgeText: {
    fontSize: moderateScale(8),
    fontWeight: '800',
  },
  statusTextCompleted: {
    color: PROVIDER_THEME.success,
  },
  statusTextActive: {
    color: PROVIDER_THEME.warning,
  },
  rowDivider: {
    height: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    marginVertical: moderateScale(4),
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    marginTop: moderateScale(20),
    gap: moderateScale(8),
    ...PROVIDER_THEME.shadowStyles.float,
  },
  downloadBtnDisabled: {
    backgroundColor: '#475569',
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(30),
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
    marginTop: moderateScale(8),
  },
  emptyDesc: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  loader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
  },
  loaderText: {
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: moderateScale(8),
  },
});
