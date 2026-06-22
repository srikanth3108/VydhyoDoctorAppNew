import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Wallet, TrendingUp, RefreshCw, Info, Lock, ChevronDown, CheckCircle} from 'lucide-react-native';
import {EarningsData} from '../../../services/api';
import {useProviderModal} from '../../../context/ProviderModalContext';
import ProviderShell from '../../../components/provider/ProviderShell';
import ProviderCard from '../../../components/provider/ProviderCard';
import ProviderStatRow from '../../../components/provider/ProviderStatRow';
import SettlementDateFilter, {
  SettlementDateRange,
} from '../../../components/provider/SettlementDateFilter';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';
import {
  filterSettlements,
  formatSettlementDay,
} from '../../../utils/settlementFilters';
import SettlementCalendarModal from '../../../components/provider/modals/SettlementCalendarModal';
import Toast from 'react-native-toast-message';

import {getProviderEarnings} from '../../../services/apiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProviderEarningsTab() {
  const {showWithdrawConfirm, showNotifications} = useProviderModal();
  const [data, setData] = useState<EarningsData | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  
  // Advanced dual date filter state
  const [settlementRange, setSettlementRange] =
    useState<SettlementDateRange>('all');
  const [customDayMs, setCustomDayMs] = useState<number | null>(null);
  const [customRangeStartMs, setCustomRangeStartMs] = useState<number | null>(null);
  const [customRangeEndMs, setCustomRangeEndMs] = useState<number | null>(null);
  
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setLocalUserId(id);
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    fetchUserId();
  }, []);

  const filteredSettlements = useMemo(
    () =>
      filterSettlements(
        data?.settlementHistory ?? [],
        settlementRange,
        customDayMs,
        customRangeStartMs,
        customRangeEndMs,
      ),
    [data?.settlementHistory, settlementRange, customDayMs, customRangeStartMs, customRangeEndMs],
  );

  const selectedDayLabel = useMemo(() => {
    if (settlementRange === 'custom' && customDayMs != null) {
      return formatSettlementDay(customDayMs);
    }
    if (settlementRange === 'range' && customRangeStartMs != null && customRangeEndMs != null) {
      const opt: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'short', year: 'numeric'};
      const start = new Date(customRangeStartMs).toLocaleDateString('en-IN', opt);
      const end = new Date(customRangeEndMs).toLocaleDateString('en-IN', opt);
      return `${start} — ${end}`;
    }
    return null;
  }, [settlementRange, customDayMs, customRangeStartMs, customRangeEndMs]);

  const handleRangeChange = (r: SettlementDateRange) => {
    setSettlementRange(r);
    if (r !== 'custom' && r !== 'range') {
      setCustomDayMs(null);
      setCustomRangeStartMs(null);
      setCustomRangeEndMs(null);
    }
  };

  const load = useCallback(async () => {
    if (!localUserId) return;
    try {
      const response: any = await getProviderEarnings(localUserId);
      if (response && response.data && response.data.status === 'success') {
        const apiData = response.data.data;
        // Map API field names to EarningsData interface
        const mapped: EarningsData = {
          totalEarnings: apiData.totalNetEarnings ?? 0,
          settled: apiData.settled ?? 0,
          unsettled: apiData.pending ?? 0,
          deductions: apiData.deductions ?? 0,
          weeklyHistory: apiData.weeklyActivity ?? [],
          settlementHistory: apiData.settlementHistory ?? [],
        };
        setData(mapped);
      } else {
        console.log('Unexpected earnings response format:', response?.data);
      }
    } catch (e) {
      console.error('Error fetching earnings:', e);
    }
  }, [localUserId]);

  useEffect(() => {
    if (localUserId) {
      load();
    }
  }, [load, localUserId]);

  const runSettlement = () => {
    setIsSettling(true);
    setTimeout(() => {
      setIsSettling(false);
      Toast.show({
        type: 'success',
        text1: 'Settlement initiated',
        text2: `₹${data?.unsettled} has been queued for bank transfer.`,
      });
      setData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          settled: prev.settled + prev.unsettled,
          unsettled: 0,
          settlementHistory: [
            {
              id: `SET-${Math.floor(Math.random() * 900) + 100}`,
              date: 'Just Now',
              dateMs: Date.now(),
              amount: prev.unsettled,
              status: 'Settled',
            },
            ...prev.settlementHistory,
          ],
        };
      });
    }, 1500);
  };

  const handleManualSettlement = () => {
    if ((data?.unsettled ?? 0) <= 0) {
      Toast.show({
        type: 'info',
        text1: 'No pending earnings',
        text2: 'Complete visits to build balance.',
      });
      return;
    }
    showWithdrawConfirm(data?.unsettled ?? 0, runSettlement);
  };

  const weeklyActivity = data?.weeklyHistory?.length
    ? data.weeklyHistory
    : [
        { day: 'Mon', amount: 0 },
        { day: 'Tue', amount: 0 },
        { day: 'Wed', amount: 0 },
        { day: 'Thu', amount: 0 },
        { day: 'Fri', amount: 0 },
        { day: 'Sat', amount: 0 },
        { day: 'Sun', amount: 0 },
      ];

  const maxWeek = Math.max(...(weeklyActivity.map(d => d.amount) ?? [1]), 1);

  return (
    <ProviderShell
      title="Earnings"
      subtitle="Real-time wallet & settlements"
      onNotifications={showNotifications}
      headerRight={
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <RefreshCw color={PROVIDER_THEME.navy} size={moderateScale(20)} />
        </TouchableOpacity>
      }>
      
      {/* Premium Fin-Tech Card */}
      <View style={styles.walletCardOuter}>
        <View style={styles.walletCardBg}>
          <View style={styles.walletCardRow}>
            <View style={styles.walletCardLeft}>
              <Text style={styles.totalLabel}>TOTAL NET EARNINGS</Text>
              <Text style={styles.totalValue}>
                ₹{data?.totalEarnings?.toLocaleString('en-IN') ?? '0'}
              </Text>
            </View>
            <View style={styles.walletCardIconBg}>
              <Wallet color="#FFFFFF" size={moderateScale(28)} />
            </View>
          </View>
          
          <View style={styles.payoutButtonRow}>
            <TouchableOpacity 
              style={[styles.instantPayoutBtn, isSettling && {opacity: 0.8}]} 
              onPress={handleManualSettlement}
              disabled={isSettling}
            >
              <Text style={styles.instantPayoutText}>
                {isSettling ? 'Transferring...' : 'Withdraw Pending'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ProviderStatRow
        items={[
          {
            key: 'settled',
            label: 'Settled',
            value: `₹${(data?.settled ?? 0).toLocaleString('en-IN')}`,
            valueColor: PROVIDER_THEME.success,
            icon: (
              <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(16)} />
            ),
          },
          {
            key: 'pending',
            label: 'Pending',
            value: `₹${(data?.unsettled ?? 0).toLocaleString('en-IN')}`,
            valueColor: PROVIDER_THEME.warning,
            icon: <Lock color={PROVIDER_THEME.warning} size={moderateScale(16)} />,
          },
          {
            key: 'deductions',
            label: 'Deductions',
            value: `₹${(data?.deductions ?? 0).toLocaleString('en-IN')}`,
            valueColor: PROVIDER_THEME.textMuted,
          },
        ]}
      />

      {/* Real Payouts explanation accordion */}
      <ProviderCard style={styles.explanationCard}>
        <TouchableOpacity 
          style={styles.explanationHeader} 
          onPress={() => setShowExplanation(!showExplanation)}
        >
          <View style={styles.explanationTitleRow}>
            <Info color={PROVIDER_THEME.teal} size={moderateScale(18)} />
            <Text style={styles.explanationTitle}>How Real Earnings Work</Text>
          </View>
          <ChevronDown 
            color={PROVIDER_THEME.textMuted} 
            size={moderateScale(18)} 
            style={{transform: [{rotate: showExplanation ? '180deg' : '0deg'}]}} 
          />
        </TouchableOpacity>
        
        {showExplanation && (
          <View style={styles.explanationBody}>
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>1. Completed Visit Credit</Text>
              <Text style={styles.stepDesc}>When a patient visit is checked out and compliance vitals are submitted, earnings are credited instantly to your Pending wallet.</Text>
            </View>
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>2. Weekly Settlements</Text>
              <Text style={styles.stepDesc}>Pending earnings are auto-settled to your registered bank account every Monday at 08:00 AM. Or utilize the manual Withdraw button for instant credit.</Text>
            </View>
            <View style={styles.explanationStep}>
              <Text style={styles.stepTitle}>3. Platform Commission</Text>
              <Text style={styles.stepDesc}>Vydhyo Care charges a 12.5% platform commission included in Deductions. This covers continuous clinical liability insurance and support hotlines.</Text>
            </View>
          </View>
        )}
      </ProviderCard>

      <Text style={styles.section}>This Week's Activity</Text>
      <ProviderCard>
        <View style={styles.chart}>
          {weeklyActivity.map(day => (
            <View key={day.day} style={styles.barCol}>
              <Text style={styles.barValueText}>₹{day.amount > 0 ? (day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount) : ''}</Text>
              <View
                style={[
                  styles.bar,
                  {height: moderateScale(Math.max(6, (day.amount / maxWeek) * 72))},
                  day.amount > 0 && styles.barActive,
                ]}
              />
              <Text style={styles.barLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
      </ProviderCard>

      <Text style={styles.section}>Settlements</Text>
      
      {/* Interactive Date Range Filter */}
      <SettlementDateFilter
        range={settlementRange}
        onRangeChange={handleRangeChange}
        resultCount={filteredSettlements.length}
        selectedDayLabel={selectedDayLabel}
        onOpenCalendar={() => setCalendarOpen(true)}
      />
      
      {/* Dynamic Dual Calendar Modal */}
      <SettlementCalendarModal
        visible={calendarOpen}
        selectedMs={customDayMs}
        rangeStartMs={customRangeStartMs}
        rangeEndMs={customRangeEndMs}
        onClose={() => setCalendarOpen(false)}
        onSelectSingle={(ms: number) => {
          setCustomDayMs(ms);
          setCustomRangeStartMs(null);
          setCustomRangeEndMs(null);
          setSettlementRange('custom');
        }}
        onSelectRange={(startMs: number, endMs: number) => {
          setCustomRangeStartMs(startMs);
          setCustomRangeEndMs(endMs);
          setCustomDayMs(null);
          setSettlementRange('range');
        }}
      />
      
      {filteredSettlements.length === 0 ? (
        <ProviderCard style={styles.settleCard}>
          <Text style={styles.emptySettlements}>
            No settlements in this date range.
          </Text>
        </ProviderCard>
      ) : null}
      {filteredSettlements.map(s => (
        <ProviderCard key={s.id} style={styles.settleCard}>
          <View style={styles.settleRow}>
            <View>
              <Text style={styles.settleId}>{s.id}</Text>
              <Text style={styles.settleDate}>{s.date}</Text>
            </View>
            <View style={styles.settleRight}>
              <Text style={styles.settleAmt}>₹{s.amount}</Text>
              <View
                style={[
                  styles.settleBadge,
                  s.status === 'Pending' && styles.settlePending,
                ]}>
                <Text style={[styles.settleBadgeText, s.status === 'Pending' && {color: PROVIDER_THEME.warning}]}>{s.status}</Text>
              </View>
            </View>
          </View>
        </ProviderCard>
      ))}

      <ProviderCard style={styles.tipCard}>
        <View style={styles.tipRow}>
          <TrendingUp color={PROVIDER_THEME.jade} size={moderateScale(20)} />
          <Text style={styles.tip}>
            Visits completed with pristine clinical checkouts speed up compliance approvals!
          </Text>
        </View>
      </ProviderCard>
      <View style={styles.bottomSpacer} />
    </ProviderShell>
  );
}

const styles = StyleSheet.create({
  refreshBtn: {padding: moderateScale(8)},
  walletCardOuter: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
    marginBottom: moderateScale(14),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  walletCardBg: {
    backgroundColor: PROVIDER_THEME.navy,
    padding: moderateScale(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  walletCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  walletCardLeft: {flex: 1},
  totalLabel: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '800',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: moderateScale(34),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: moderateScale(4),
    letterSpacing: -0.6,
  },
  walletCardIconBg: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  payoutButtonRow: {
    marginTop: moderateScale(20),
  },
  instantPayoutBtn: {
    backgroundColor: PROVIDER_THEME.jade,
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantPayoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  explanationCard: {
    marginTop: moderateScale(12),
    padding: moderateScale(14),
    borderColor: 'rgba(13, 148, 136, 0.1)',
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  explanationTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  explanationBody: {
    marginTop: moderateScale(14),
    borderTopWidth: 1,
    borderTopColor: PROVIDER_THEME.border,
    paddingTop: moderateScale(10),
  },
  explanationStep: {
    marginBottom: moderateScale(12),
  },
  stepTitle: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: PROVIDER_THEME.teal,
  },
  stepDesc: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(3),
    lineHeight: moderateScale(16),
  },
  section: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginVertical: moderateScale(10),
    letterSpacing: -0.2,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: moderateScale(120),
    paddingTop: moderateScale(14),
    paddingBottom: moderateScale(8),
  },
  barCol: {alignItems: 'center', flex: 1},
  barValueText: {
    fontSize: moderateScale(9),
    color: PROVIDER_THEME.teal,
    fontWeight: '700',
    marginBottom: moderateScale(4),
  },
  bar: {
    width: moderateScale(16),
    backgroundColor: '#E2E8F0',
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  barActive: {
    backgroundColor: PROVIDER_THEME.jade,
  },
  barLabel: {fontSize: moderateScale(10), color: PROVIDER_THEME.textMuted, fontWeight: '600'},
  settleCard: {
    borderColor: 'rgba(10, 22, 40, 0.04)',
    padding: moderateScale(14),
    marginBottom: moderateScale(8),
  },
  settleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  settleId: {fontWeight: '800', color: PROVIDER_THEME.navy, fontSize: moderateScale(14)},
  settleDate: {fontSize: moderateScale(12), color: PROVIDER_THEME.textMuted, marginTop: moderateScale(2)},
  settleRight: {alignItems: 'flex-end'},
  settleAmt: {fontWeight: '800', color: PROVIDER_THEME.navy, fontSize: moderateScale(14)},
  settleBadge: {
    marginTop: moderateScale(4),
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  settlePending: {backgroundColor: 'rgba(245, 158, 11, 0.08)'},
  settleBadgeText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.success,
  },
  tipCard: {
    borderColor: 'rgba(13, 148, 136, 0.1)',
    padding: moderateScale(12),
  },
  tipRow: {flexDirection: 'row', gap: moderateScale(10), alignItems: 'center'},
  tip: {
    flex: 1,
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    fontWeight: '500',
    lineHeight: moderateScale(18),
  },
  bottomSpacer: {height: moderateScale(16)},
  emptySettlements: {
    textAlign: 'center',
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(13),
    fontWeight: '500',
  },
});
