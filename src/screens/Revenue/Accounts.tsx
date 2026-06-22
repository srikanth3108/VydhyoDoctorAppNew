import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  PermissionsAndroid,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { AuthPost, AuthFetch } from '../../auth/auth';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';

import { Dimensions } from 'react-native';
const MODAL_MAX_BODY = Math.floor(Dimensions.get('window').height * 0.6);

// Import iOS Calendar Picker
import IOSCalendarPicker from '../../utility/iosCalendarPicker';

// Import responsive utilities
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  responsiveWidth,
  moderateScale,
  isTablet,
  ICON_SIZE,
  SAFE_AREA,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';
import { AmountIcon, CalendarIcon, DownArrowIcon, UpArrowIcon, ExpenditureIcon, SyncIcon, EyeOpenIcon, BillingIcon } from '../../utility/SvgIcons';

const AccountsScreen = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId = currentuserDetails?.role === 'doctor' ? currentuserDetails?.userId : currentuserDetails?.createdBy;
  const [showFilters, setShowFilters] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [dateRangeActive, setDateRangeActive] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const navigation = useNavigation<any>();
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [serviceModalVisible, setServiceModalVisible] = useState(false); // Replaced Menu with Modal
  
  // iOS Calendar States
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [startCalendarDate, setStartCalendarDate] = useState<Date>(new Date());
  const [endCalendarDate, setEndCalendarDate] = useState<Date>(new Date());
  
  const keyboardVerticalOffset = Platform.select({ ios: moderateScale(80), android: moderateScale(80) }) as number;

  function getServiceName(paymentFrom) {
   switch (paymentFrom) {
     case 'appointments':
     case 'appointment':
       return 'Appointments';
     case 'lab':
       return 'Lab';
     case 'pharmacy':
       return 'Pharmacy';
            default:
       return paymentFrom
         ? String(paymentFrom).charAt(0).toUpperCase() + String(paymentFrom).slice(1)
         : '-';
   }
}

const toNum = (val: any) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

const getPlatformFee = (txn: any) => {
  const candidates = [
    txn?.platformFee,
    txn?.platform_fee,
    txn?.feeDetails?.platformFee,
    txn?.feeDetails?.platform_fee,
    txn?.charges?.platformFee,
    txn?.charges?.platform_fee,
  ];
  for (const c of candidates) {
    const n = toNum(c);
    if (n !== 0) return n; 
  }
 
  return candidates.some((c) => toNum(c) === 0) ? 0 : 0;
};

const isAppointmentService = (paymentFrom?: string) => {
  const v = (paymentFrom || '').toString().trim().toLowerCase();
  return v === 'appointment' || v === 'appointments';
};

  const handleViewTxn = (record) => {
    setSelectedTxn(record);
    setShowTxnModal(true);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return '-';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const [accountSummary, setAccountSummary] = useState({
    totalReceived: 0,
    totalExpenditure: 0,
    pendingTransactions: 0,
    recentTransactions: [],
  });

  const fetchRevenue = async () => {
    try {
      setLoadingRevenue(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(`finance/getDoctorRevenue?doctorId=${doctorId}`, token);

      if (response.status === 'success') {
        const apiData = response.data.data;

        setAccountSummary((prev) => ({
          ...prev,
          totalReceived: apiData.totalRevenue,
          totalExpenditure: apiData.totalExpenditure,
          pendingTransactions: apiData.pendingTransactions || 0,
        }));

        if (apiData.lastThreeTransactions) {
          setRecentTransactions(apiData.lastThreeTransactions.map((txn) => ({
            name: txn.username,
            amount: txn.finalAmount,
          })));
        }
      } else {
        throw new Error('Failed to fetch revenue data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch revenue data');
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (!doctorId) return;

    setLoadingTransactions(true);

    const payload = {
      service: filterService,
      status: filterStatus,
      search: searchText,
      page: currentPage,
      limit: 10,
      doctorId: doctorId,
      startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : '',
      endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
    };
    if (dateRangeActive && startDate && endDate) {
      payload.startDate = dayjs(startDate).format('YYYY-MM-DD');
      payload.endDate = dayjs(endDate).format('YYYY-MM-DD');
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthPost('finance/getTransactionHistory', payload, token);

      if (response?.data?.status === 'success') {
        setTransactions(response.data.data || []);
        setTotalItems(response.data.totalResults || 0);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch transactions');
    } finally {
      setLoadingTransactions(false);
    }
  }, [doctorId, startDate, endDate, searchText, filterService, filterStatus, currentPage]);

  useEffect(() => {
    fetchTransactions();
    fetchRevenue();
  }, [fetchTransactions]);

// Calendar Handlers
const openStartCalendar = () => {
  if (Platform.OS === 'android') {
    setShowStartPicker(true);
  } else {
    // Always use today's date when opening calendar
    setStartCalendarDate(new Date());
    setShowStartCalendar(true);
  }
};

const openEndCalendar = () => {
  if (Platform.OS === 'android') {
    setShowEndPicker(true);
  } else {
    // Always use today's date when opening calendar
    setEndCalendarDate(new Date());
    setShowEndCalendar(true);
  }
};

const handleStartDateChangeIOS = (date: Date) => {
  setStartDate(date);
  setDateRangeActive(true);
  setShowStartCalendar(false);
};

const handleEndDateChangeIOS = (date: Date) => {
  setEndDate(date);
  setDateRangeActive(true);
  setShowEndCalendar(false);
};

const cancelStartCalendarIOS = () => {
  setShowStartCalendar(false);
};

const cancelEndCalendarIOS = () => {
  setShowEndCalendar(false);
};

// Android Date Picker Handlers
  const onStartChange = (_: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setDateRangeActive(true);
    }
  };

  const onEndChange = (_: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setDateRangeActive(true);
    }
  };

  const exportTransactionsToPDF = async () => {
    try {
      setExportingPdf(true);

      if (Platform.OS === 'android' && Platform.Version < 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (granted === PermissionsAndroid.RESULTS.DENIED) {
          Alert.alert('Permission Denied', 'Storage permission is required to save the PDF.');
          return;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission Required',
            'Storage permission is required to save the PDF. Please enable it in Settings > Apps > Your App > Permissions.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Transaction Report</h1>
          <table>
            <tr>
              <th>Patient Name</th>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
            ${transactions
          .map(
            (txn) => `
                  <tr>
                    <td>${txn.patientName || '-'}</td>
                    <td>${txn.paymentId || '-'}</td>
                    <td>₹${txn.finalAmount}</td>
                    <td>${dayjs(txn.paidAt || txn.updatedAt).format('YYYY-MM-DD')}</td>
                    <td>${dayjs(txn.paidAt || txn.updatedAt).format('HH:mm')}</td>
                  </tr>
                `
          )
          .join('')}
          </table>
        </body>
      </html>
    `;

      const timestamp = dayjs().format('YYYYMMDD_HHmmss');
      const fileName = `Transaction_Report_${timestamp}.pdf`;

      const pdf = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Transaction_Report_${timestamp}`,
        base64: false,
      });

      const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      await RNFS.moveFile(pdf.filePath!, downloadsPath);

      Alert.alert('Success', `PDF saved in Files > Downloads as ${fileName}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / 10);
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.paginationInfo}>
          Page {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

const detailRows = useMemo(() => {
  if (!showTxnModal || !selectedTxn) return [];
  const allTxns = selectedTxn?.allTransactions?.length
    ? selectedTxn.allTransactions
    : [selectedTxn];

  const groupMap = new Map();
  allTxns.forEach((t) => {
    const service = getServiceName(t.paymentFrom);
    const minuteKey = t?.paidAt ? dayjs(t.paidAt).format('YYYY-MM-DD HH:mm') : 'Unknown';
    const key = `${service}__${minuteKey}`;

    const prev = groupMap.get(key) || {
      service,
      minuteKey,
      sortTime: t?.paidAt ? dayjs(t.paidAt).startOf('minute').valueOf() : Number.POSITIVE_INFINITY,
      ids: [],
      amount: 0,
      platformFee: 0, 
    };

    // amounts
    const baseAmount = toNum(t.finalAmount ?? t.actualAmount ?? 0);
    prev.amount += baseAmount;

    // platform fee only for appointments
    if (isAppointmentService(t.paymentFrom)) {
      prev.platformFee += toNum(getPlatformFee(t));
    }

    // ids
    prev.ids.push(t.paymentId || t._id);

    groupMap.set(key, prev);
  });

  return Array.from(groupMap.values()).sort((a, b) => {
    if (a.service !== b.service) return a.service.localeCompare(b.service);
    return a.sortTime - b.sortTime;
  });
}, [showTxnModal, selectedTxn]);

 const groupTransactionsByPatient = (txns = []) => {
   const grouped = {};
   txns.forEach((t) => {
     const patientName = t?.userDetails
       ? `${t.userDetails.firstname || ''} ${t.userDetails.lastname || ''}`.trim()
       : t?.patientName || 'unknown';
     if (!grouped[patientName]) {
       grouped[patientName] = {
         count: 0,
         totalAmount: 0,
         latestTxn: t,
         allTxns: [],
         patientName,
         services: new Set(),
         paymentMethods: new Set(),
         statuses: new Set(),
       };
     }
     grouped[patientName].count += 1;
     grouped[patientName].totalAmount += (t.finalAmount !== undefined ? t.finalAmount : (t.actualAmount || 0));
     grouped[patientName].allTxns.push(t);
     if (t.paymentFrom) grouped[patientName].services.add(t.paymentFrom);
     if (t.paymentMethod) grouped[patientName].paymentMethods.add(t.paymentMethod);
     if (t.paymentStatus) grouped[patientName].statuses.add(t.paymentStatus);
     const cur = t?.paidAt ? new Date(t.paidAt) : new Date(0);
     const prev = grouped[patientName].latestTxn?.paidAt ? new Date(grouped[patientName].latestTxn.paidAt) : new Date(0);
     if (cur > prev) grouped[patientName].latestTxn = t;
   });

   return Object.values(grouped).map((g) => ({
     ...g.latestTxn,
     groupedCount: g.count,
     groupedAmount: g.totalAmount,
     allTransactions: g.allTxns,
     patientName: g.patientName,
     services: Array.from(g.services).join(', '),
     paymentMethods: Array.from(g.paymentMethods).join(', '),
     statuses: Array.from(g.statuses).join(', '),
   }));
 };

 const computeGroupedCount = (txns = []) => {
   const map = new Map();
   txns.forEach((t) => {
     const service = getServiceName(t.paymentFrom);
     const minuteKey = t?.paidAt ? dayjs(t.paidAt).format('YYYY-MM-DD HH:mm') : 'Unknown';
     map.set(`${service}__${minuteKey}`, true);
   });
   return map.size || 1;
 };

 const mappedTransactions = useMemo(() => {
   const grouped = groupTransactionsByPatient(transactions);
   return grouped.map((txn) => {
     const allTxns = txn.allTransactions?.length ? txn.allTransactions : [txn];
     const groupedCountForView = computeGroupedCount(allTxns);
     return {
       id: txn.paymentId || txn._id,
       patient: txn.patientName,
       date: txn.paidAt ? dayjs(txn.paidAt).format('DD-MMM-YYYY') : '-',
       service: txn.services || getServiceName(txn.paymentFrom),
       amount: (txn.groupedCount > 1
         ? txn.groupedAmount
         : (txn.finalAmount !== undefined ? txn.finalAmount : (txn.actualAmount || 0))),
       status: txn.paymentStatus !== 'refund_pending'
         ? (txn.statuses || txn.paymentStatus || '-')
         : 'Refunded',
       paymentMethod: txn.paymentMethods
        ? txn.paymentMethods
        : (txn.paymentMethod ? txn.paymentMethod.charAt(0).toUpperCase() + txn.paymentMethod.slice(1) : '-'),
       raw: txn,
       count: groupedCountForView || 1,
       allTransactions: allTxns,
     };
   });
 }, [transactions]);

  return (
     <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={keyboardVerticalOffset}
    style={{ flex: 1 }}
  >

    <CommonHeader title="Accounts" />
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.receivedCard]}>
          {loadingRevenue ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <>
              <View style={styles.cardIconContainer}>
                <View style={[styles.cardIcon, styles.greenIcon]}>
                  <AmountIcon size={moderateScale(20)} color="#fff"/>
                </View>
              </View>
              <Text style={styles.summaryAmount}>₹{accountSummary.totalReceived.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Amount Received</Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.summaryCard, styles.expenditureCard]}
          onPress={() => navigation.navigate('expenditure')}
        >
          {loadingRevenue ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <View style={styles.cardIconContainer}>
                <View style={[styles.cardIcon, styles.redIcon]}>
                  <ExpenditureIcon size={moderateScale(20)} color="#fff" />
                </View>
              </View>
              <Text style={styles.summaryAmount}>₹{accountSummary.totalExpenditure.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>Total Expenditure</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.summaryCard, styles.recentCard]}>
          <View style={styles.cardIconContainer}>
            <View style={[styles.cardIcon, styles.blueIcon]}>
              <SyncIcon size={moderateScale(20)} color="#fff" />
            </View>
          </View>
          <Text style={styles.summaryLabel}>Recent Transactions</Text>
          <ScrollView style={styles.recentTransactionsContainer}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <View key={index} style={styles.transactionItem}>
                  <Text style={styles.transactionName} numberOfLines={1}>
                    {transaction.name}
                  </Text>
                  <Text style={styles.transactionAmount}>₹{transaction.amount}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noTransactionsText}>No recent transactions</Text>
            )}
          </ScrollView>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        style={styles.filterToggle}
      >
        <Text style={styles.filterTitle}>Filters</Text>
        {showFilters ? (
          <UpArrowIcon size={15} color="#111" />
        ) : (
          <DownArrowIcon size={15} color="#111" />
        )}
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filters}>
          <TextInput
            placeholder="Search by Patient Name"
            style={styles.searchInput}
            value={searchText}
            onChangeText={(text) => setSearchText(text)}
            placeholderTextColor="#9CA3AF"
          />

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={openStartCalendar}
            >
              <CalendarIcon size={moderateScale(16)} color="#6B7280" />
              <Text style={styles.dateText}>
                {startDate ? moment(startDate).format('DD/MM/YYYY') : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateInput}
              onPress={openEndCalendar}
            >
              <CalendarIcon size={moderateScale(16)} color="#6B7280" />
              <Text style={styles.dateText}>
                {endDate ? moment(endDate).format('DD/MM/YYYY') : 'End Date'}
              </Text>
            </TouchableOpacity>

            {showStartPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={onStartChange}
                 maximumDate={new Date()}
              />
            )}

            {showEndPicker && Platform.OS === 'android' && (
               <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={onEndChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setServiceModalVisible(true)}
          >
            <Text style={styles.dropdownText}>
              {filterService
                ? filterService.charAt(0).toUpperCase() + filterService.slice(1)
                : 'All Services'}
            </Text>
            <DownArrowIcon size={moderateScale(16)} color="#6B7280" />
          </TouchableOpacity>

          <Modal
            visible={serviceModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setServiceModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.serviceModalContent}>
                <Text style={[styles.modalTitle, { alignSelf: 'flex-start' }]}>Select Service</Text>

                <TouchableOpacity
                  style={[styles.serviceOption, { alignItems: 'flex-start' }]}
                  onPress={() => {
                    setFilterService('');
                    setServiceModalVisible(false);
                  }}
                >
                  <Text style={styles.serviceOptionText}>All Services</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceOption, { alignItems: 'flex-start' }]}
                  onPress={() => {
                    setFilterService('appointment');
                    setServiceModalVisible(false);
                  }}
                >
                  <Text style={styles.serviceOptionText}>Appointments</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceOption, { alignItems: 'flex-start' }]}
                  onPress={() => {
                    setFilterService('lab');
                    setServiceModalVisible(false);
                  }}
                >
                  <Text style={styles.serviceOptionText}>Lab</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceOption, { alignItems: 'flex-start' }]}
                  onPress={() => {
                    setFilterService('pharmacy');
                    setServiceModalVisible(false);
                  }}
                >
                  <Text style={styles.serviceOptionText}>Pharmacy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setServiceModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}

        {Platform.OS === 'ios' && (
          <>
            <IOSCalendarPicker
              visible={showStartCalendar}
              currentDate={startCalendarDate}
              onConfirm={handleStartDateChangeIOS}
              onCancel={cancelStartCalendarIOS}
              title="Select Start Date"
              mode="date"
              maxDate={new Date()}
            />
            
            <IOSCalendarPicker
              visible={showEndCalendar}
              currentDate={endCalendarDate}
              onConfirm={handleEndDateChangeIOS}
              onCancel={cancelEndCalendarIOS}
              title="Select End Date"
              mode="date"
              maxDate={new Date()}
            />
          </>
        )}

      <View style={styles.transactionSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {loadingTransactions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading transactions...</Text>
          </View>
        ) : transactions.length > 0 ? (
          <>
            {mappedTransactions.map((item, index) => (
              <View key={item.id  || index} style={styles.transactionCard}>
                <View style={styles.txnHeader}>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
        <Text style={styles.txnId}>{item?.id}</Text>
        {item.count > 1 && (
           <View style={styles.countBadge}>
             <Text style={styles.countBadgeText}>{item.count} transactions</Text>
           </View>
        )}
       </View>
                  <Text style={styles.txnDate}>
                    {item.date}
                  </Text>
                </View>
                <View style={styles.txnRow}>
                   <Text style={styles.txnName}>{item.patient}</Text>
                   <Text style={styles.txnName}></Text>
                </View>
                <View style={styles.txnRow}>
                 <Text style={styles.txnLabel}>{capitalizeFirstLetter(item.service)}</Text>
       <Text style={styles.txnAmount}>₹{item.amount}</Text>
                </View>
                <View style={styles.txnRow}>
                  <Text style={styles.txnLabel}>{item?.paymentMethod}</Text>
                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.paidStatus,
                        (item.status.split(', ')[0] === 'paid')
                          ? styles.paidStatusSuccess
                           : (item.status.split(', ')[0] === 'pending')
                            ? styles.paidStatusPending
                            : styles.paidStatusRefunded,
                      ]}
                    >
                      {item.status.split(', ')[0] === 'paid'
             ? 'Paid'
             : item.status.split(', ')[0] === 'pending'
               ? 'Pending'
               : 'Refunded'}
                    </Text>
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                      onPress={() => handleViewTxn(item)}
                    >
                      <EyeOpenIcon size={ICON_SIZE.sm} color="#0d51e4ff" style={{ marginRight: 4 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {renderPagination()}
          </>
        ) : (
          <>
          <View style={styles.noDataContainer}>
            <BillingIcon size={moderateScale(40)} color="#9CA3AF"/>
            <Text style={styles.noDataText}>No transactions found</Text>
            
          </View>
          {renderPagination()}
          </>
          
        )}
      </View>

      {showTxnModal && selectedTxn && (
        <Modal
          visible={showTxnModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTxnModal(false)}
        >
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={keyboardVerticalOffset}
    style={{ width: '100%' }}
  >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
<ScrollView 
 style={styles.modalScroll}
  contentContainerStyle={{ paddingBottom: 12 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator>
  {detailRows.map((g, idx) => (
    <View key={`${g.service}-${g.minuteKey}-${idx}`} style={styles.detailCard}>
      <View style={styles.detailCardHeader}>
        <Text style={styles.detailCardTitle}>{g.service}</Text>
        <Text style={styles.detailCardSub}>
          {g.minuteKey === 'Unknown'
            ? '-'
            : dayjs(g.minuteKey, 'YYYY-MM-DD HH:mm').format('DD-MMM-YYYY hh:mm A')}
        </Text>
      </View>

      <View style={styles.detailLine}>
        <Text style={styles.detailLabel}>Transaction ID</Text>
        <Text style={styles.detailValue}>{g.ids?.[0] || '-'}</Text>
      </View>

      <View style={styles.detailLine}>
        <Text style={styles.detailLabel}>Amount</Text>
        <Text style={styles.detailValue}>₹{toNum(g.amount)}</Text>
      </View>

      {g.service === 'Appointments' && (
        <View style={styles.detailLine}>
          <Text style={styles.detailLabel}>Platform Fee</Text>
          <Text style={styles.detailValue}>₹{toNum(g.platformFee)}</Text>
        </View>
      )}
    </View>
  ))}
</ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTxnModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
</KeyboardAvoidingView>
          </View>
        </Modal>
      )}
    </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
  );
};

export default AccountsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: SAFE_AREA.safeTop,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receivedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenditureCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  recentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  cardIconContainer: {
    marginBottom: 8,
  },
  cardIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenIcon: {
    backgroundColor: '#10B981',
  },
  redIcon: {
    backgroundColor: '#EF4444',
  },
  blueIcon: {
    backgroundColor: '#3B82F6',
  },
  summaryAmount: {
    fontSize: moderateScale(isTablet ? 24 : 20),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: moderateScale(isTablet ? FONT_SIZE.sm : FONT_SIZE.xs),
    color: '#6B7280',
    fontWeight: '500',
  },
  recentTransactionsContainer: {
    maxHeight: moderateScale(120),
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  transactionName: {
    fontSize: moderateScale(FONT_SIZE.xs),
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  transactionAmount: {
    fontSize: moderateScale(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#111827',
  },
  noTransactionsText: {
    fontSize: moderateScale(FONT_SIZE.xs),
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontWeight: '600',
    color: '#111827',
    fontSize: moderateScale(FONT_SIZE.lg),
  },
  filters: {
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 24,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    padding: moderateScale(12),
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#111827',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  dateRow: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: moderateScale(12),
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateText: {
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  dropdown: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: moderateScale(12),
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  dropdownText: {
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  exportBtn: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  exportText: {
    color: '#fff',
    fontWeight: '600',
  },
  transactionSection: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: moderateScale(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    marginBottom: 16,
    color: '#111827',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.lg),
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  txnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  txnId: {
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  txnDate: {
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#6B7280',
  },
  txnName: {
    fontSize: moderateScale(FONT_SIZE.lg),
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  txnLabel: {
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  txnAmount: {
    fontWeight: '600',
    color: '#111827',
    fontSize: moderateScale(FONT_SIZE.lg),
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidStatus: {
    paddingHorizontal: 8,
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
    fontSize: moderateScale(FONT_SIZE.sm),
    fontWeight: '500',
  },
  paidStatusSuccess: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  paidStatusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  paidStatusRefunded: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: moderateScale(8),
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    minWidth: moderateScale(80),
  },
  paginationButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  paginationText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  paginationInfo: {
    color: '#6B7280',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  serviceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: moderateScale(FONT_SIZE.lg),
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
    alignSelf: 'flex-start',
  },
  modalLabel: {
    fontWeight: '600',
    marginTop: 8,
    color: '#374151',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  modalValue: {
    marginBottom: 4,
    color: '#000000',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    padding: moderateScale(12),
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  column: {
    width: '48%',
  },
  serviceOption: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: 16,
    width: '100%',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  serviceOptionText: {
    fontSize: moderateScale(FONT_SIZE.md),
    color: '#111827',
    fontWeight: '500',
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: moderateScale(12),
    paddingHorizontal: 8,
    paddingVertical: moderateScale(2),
  },
  countBadgeText: {
    color: '#3730A3',
    fontSize: moderateScale(FONT_SIZE.xs),
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailLabel: {
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#6B7280',
  },
  detailValue: {
    fontSize: moderateScale(FONT_SIZE.md),
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },

  detailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: moderateScale(12),
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailCardHeader: {
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: moderateScale(FONT_SIZE.lg),
    fontWeight: '700',
    color: '#111827',
  },
  detailCardSub: {
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#6B7280',
    marginTop: 2,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  modalScroll: {
    maxHeight: MODAL_MAX_BODY,
  },
});