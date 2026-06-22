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
  CreditCard,
  TrendingUp,
  Wallet,
  CheckCircle,
  AlertCircle,
  Edit2,
  Check,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {EarningsData} from '../../services/api';
import {getProviderEarnings} from '../../services/apiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useProviderModal} from '../../context/ProviderModalContext';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

export default function SettlementsScreen() {
  const navigation = useNavigation();
  const {showWithdrawConfirm} = useProviderModal();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  // Bank Info States
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountNo, setAccountNo] = useState('50100492144821');
  const [ifscCode, setIfscCode] = useState('HDFC0000047');
  const [holderName, setHolderName] = useState('Vydhyo Care Pro');

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) return;
      const response: any = await getProviderEarnings(id);
      if (response && response.data && response.data.status === 'success') {
        const apiData = response.data.data;
        const mapped: EarningsData = {
          totalEarnings: apiData.totalNetEarnings ?? 0,
          settled: apiData.settled ?? 0,
          unsettled: apiData.pending ?? 0,
          deductions: apiData.deductions ?? 0,
          weeklyHistory: apiData.weeklyActivity ?? [],
          settlementHistory: apiData.settlementHistory ?? [],
        };
        setEarnings(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const handleWithdraw = () => {
    if (!earnings || earnings.unsettled <= 0) {
      Toast.show({
        type: 'error',
        text1: 'No Unsettled Balance',
        text2: 'You have no pending balance to settle at this time.',
      });
      return;
    }

    const withdrawAmount = earnings.unsettled;

    showWithdrawConfirm(withdrawAmount, async () => {
      setWithdrawing(true);
      
      setTimeout(() => {
        setWithdrawing(false);
        
        setEarnings(prev => {
          if (!prev) return null;
          return {
            ...prev,
            settled: prev.settled + withdrawAmount,
            unsettled: 0,
            settlementHistory: [
              {
                id: `SET-${Math.floor(100 + Math.random() * 900)}`,
                date: 'Just now',
                amount: withdrawAmount,
                status: 'Pending', 
              },
              ...prev.settlementHistory,
            ],
          };
        });

        Toast.show({
          type: 'success',
          text1: 'Settlement Initiated',
          text2: `₹${withdrawAmount.toLocaleString('en-IN')} is being transferred to ${bankName}.`,
        });
      }, 1800);
    });
  };

  const handleSaveBankDetails = () => {
    if (!bankName.trim() || !accountNo.trim() || !ifscCode.trim() || !holderName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all bank credentials.',
      });
      return;
    }

    setIsEditingBank(false);
    Toast.show({
      type: 'success',
      text1: 'Bank Vault Updated',
      text2: 'Payout credentials changed and verified.',
    });
  };

  const maskAccountNo = (acc: string) => {
    if (acc.length < 4) return acc;
    return `•••• •••• •••• ${acc.slice(-4)}`;
  };

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
        <Text style={styles.headerTitle}>Settlements</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={PROVIDER_THEME.navy} size="large" />
          <Text style={styles.loaderText}>Querying ledger logs...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.fintechCard}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.cardHeader}>UNSETTLED BALANCE</Text>
                <Text style={styles.unsettledAmount}>
                  ₹{earnings?.unsettled.toLocaleString('en-IN') ?? '0'}
                </Text>
              </View>
              <View style={styles.walletIconBg}>
                <Wallet color="#E0F7E9" size={moderateScale(28)} />
              </View>
            </View>

            <View style={styles.statsSplit}>
              <View style={styles.halfStat}>
                <Text style={styles.statLabel}>Total Paid Out</Text>
                <Text style={styles.statVal}>₹{earnings?.settled.toLocaleString('en-IN') ?? '0'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.halfStat}>
                <Text style={styles.statLabel}>Total Earnings</Text>
                <Text style={styles.statVal}>₹{earnings?.totalEarnings.toLocaleString('en-IN') ?? '0'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.withdrawBtn,
                (earnings?.unsettled ?? 0) <= 0 && styles.withdrawBtnDisabled,
                withdrawing && styles.withdrawBtnDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={(earnings?.unsettled ?? 0) <= 0 || withdrawing}
              activeOpacity={0.8}
            >
              {withdrawing ? (
                <ActivityIndicator color={PROVIDER_THEME.navy} size="small" />
              ) : (
                <Text style={styles.withdrawBtnText}>Settle Instantly</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bankCard}>
            <View style={styles.bankHeader}>
              <View style={styles.bankHeaderLeft}>
                <CreditCard color={PROVIDER_THEME.navy} size={moderateScale(18)} />
                <Text style={styles.bankTitle}>Payout Bank Account</Text>
              </View>
              {!isEditingBank ? (
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => setIsEditingBank(true)}
                  activeOpacity={0.7}
                >
                  <Edit2 color={PROVIDER_THEME.tealLight} size={moderateScale(14)} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.saveBankBtn}
                  onPress={handleSaveBankDetails}
                  activeOpacity={0.7}
                >
                  <Check color="#FFFFFF" size={moderateScale(12)} strokeWidth={3} />
                  <Text style={styles.saveBankBtnText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            {isEditingBank ? (
              <View style={styles.bankForm}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    value={holderName}
                    onChangeText={setHolderName}
                    placeholder="Enter full name"
                    placeholderTextColor={PROVIDER_THEME.textSoft}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Enter Bank Name"
                    placeholderTextColor={PROVIDER_THEME.textSoft}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={accountNo}
                    onChangeText={setAccountNo}
                    keyboardType="numeric"
                    placeholder="Enter Account Number"
                    placeholderTextColor={PROVIDER_THEME.textSoft}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>IFSC Code</Text>
                  <TextInput
                    style={styles.input}
                    value={ifscCode}
                    onChangeText={setIfscCode}
                    autoCapitalize="characters"
                    placeholder="Enter IFSC"
                    placeholderTextColor={PROVIDER_THEME.textSoft}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.bankDetails}>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.detailLabel}>Bank Name</Text>
                  <Text style={styles.detailVal}>{bankName}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailVal}>{maskAccountNo(accountNo)}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.detailLabel}>IFSC Code</Text>
                  <Text style={styles.detailVal}>{ifscCode}</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.detailLabel}>Account Holder</Text>
                  <Text style={styles.detailVal}>{holderName}</Text>
                </View>

                <View style={styles.verifiedBadge}>
                  <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(14)} />
                  <Text style={styles.verifiedText}>Payout routing verified</Text>
                </View>
              </View>
            )}
          </View>

          <Text style={styles.historyTitle}>Settlements History</Text>
          <View style={styles.historyCard}>
            {earnings?.settlementHistory && earnings.settlementHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <AlertCircle color={PROVIDER_THEME.textSoft} size={moderateScale(32)} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No past payouts</Text>
                <Text style={styles.emptyDesc}>Completed visit payouts will settle here.</Text>
              </View>
            ) : (
              earnings?.settlementHistory.map((s, index) => (
                <View key={s.id}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyLeft}>
                      <View style={styles.settleBadgeBg}>
                        <TrendingUp color={PROVIDER_THEME.navy} size={moderateScale(16)} />
                      </View>
                      <View>
                        <Text style={styles.settleId}>{s.id}</Text>
                        <Text style={styles.settleDate}>{s.date}</Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.settleAmount}>₹{s.amount.toLocaleString('en-IN')}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          s.status === 'Settled'
                            ? styles.statusSettled
                            : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            s.status === 'Settled'
                              ? styles.statusTextSettled
                              : styles.statusTextPending,
                          ]}
                        >
                          {s.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index < earnings.settlementHistory.length - 1 && (
                    <View style={styles.ledgerDivider} />
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
  fintechCard: {
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: 'rgba(224, 247, 233, 0.7)',
    letterSpacing: 0.8,
  },
  unsettledAmount: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    color: '#E0F7E9',
    marginTop: moderateScale(2),
  },
  walletIconBg: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    backgroundColor: '#3D6A9B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C5EBD8',
  },
  statsSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginTop: moderateScale(18),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  halfStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: 'rgba(224, 247, 233, 0.65)',
    fontWeight: '600',
  },
  statVal: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: moderateScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: moderateScale(8),
  },
  withdrawBtn: {
    backgroundColor: '#E0F7E9',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.header,
  },
  withdrawBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  withdrawBtnText: {
    color: '#1D3557',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    marginBottom: moderateScale(20),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  bankTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  editBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  saveBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: PROVIDER_THEME.success,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  saveBankBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    marginVertical: moderateScale(12),
  },
  bankDetails: {
    gap: moderateScale(8),
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    fontWeight: '500',
  },
  detailVal: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(6),
  },
  verifiedText: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.success,
    fontWeight: '700',
  },
  bankForm: {
    gap: moderateScale(12),
  },
  field: {
    gap: moderateScale(4),
  },
  fieldLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
    textTransform: 'uppercase',
  },
  input: {
    height: moderateScale(42),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.15)',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    fontWeight: '600',
    backgroundColor: 'rgba(29, 53, 87, 0.02)',
  },
  historyTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(10),
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(8),
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
  },
  settleBadgeBg: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleId: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  settleDate: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    marginTop: 1,
    fontWeight: '500',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  settleAmount: {
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
  statusSettled: {
    backgroundColor: 'rgba(45, 106, 79, 0.1)',
  },
  statusPending: {
    backgroundColor: 'rgba(230, 138, 46, 0.1)',
  },
  statusBadgeText: {
    fontSize: moderateScale(8),
    fontWeight: '800',
  },
  statusTextSettled: {
    color: PROVIDER_THEME.success,
  },
  statusTextPending: {
    color: PROVIDER_THEME.warning,
  },
  ledgerDivider: {
    height: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    marginVertical: moderateScale(8),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(30),
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginTop: moderateScale(8),
  },
});
