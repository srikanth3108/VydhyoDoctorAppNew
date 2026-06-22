import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useMemo,
} from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
// AntDesign replaced by local FullStar SVG component to control color/size via props
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthFetch } from '../../auth/auth';
import moment from 'moment';
import dayjs from 'dayjs';
import { PieChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';
import IOSCalendarPicker from '../../utility/iosCalendarPicker';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveText,
  moderateScale,
  isTablet,
  isSmallDevice as isSmallDeviceUtil,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utility/responsive';
import {
  CalendarIcon,
  HamburgerMenuIcon,
  LeftIndicatorIcon,
  RightIndicatorIcon,
  SyncIcon,
  FullStarIcon,
} from '../../utility/SvgIcons';

const PLACEHOLDER_IMAGE = require('../../assets/img.png');
const { width } = Dimensions.get('window');
const screenWidth = Dimensions.get('window').width;

interface FormData {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  practice: string;
  consultationPreferences: string;
  bank: string;
  accountNumber: string;
}
interface Clinic {
  addressId: string;
  clinicName: string;
  address: string;
  status: string;
}
interface Slot {
  _id: string;
  addressId: string;
  date: string;
  slots: { _id: string; time: string; status?: string }[];
}
interface PatientAppointmentsProps {
  date: Date;
  doctorId: string;
  onDateChange: (date: Date) => void;
  onViewAll?: () => void;
}

/* ---------- Helpers to match web chips ---------- */
const getStatusColors = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'scheduled') return { bg: '#e8f5e8', fg: '#16A34A' };
  if (s === 'completed') return { bg: '#e3f2fd', fg: '#2563EB' };
  if (s === 'rescheduled') return { bg: '#fff3e0', fg: '#F59E0B' };
  if (s === 'canceled' || s === 'cancelled')
    return { bg: '#ffebee', fg: '#EF4444' };
  return { bg: '#F3F4F6', fg: '#374151' };
};
const getTypeInfo = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'new-walkin' || t === 'home-visit' || t === 'new')
    return { label: 'New', bg: '#DBEAFE', fg: '#1E40AF' };
  if (t === 'follow-up' || t === 'followup')
    return { label: 'Follow-up', bg: '#e8f5e8', fg: '#16A34A' };
  return { label: type || 'N/A', bg: '#F3F4F6', fg: '#374151' };
};
const fmtYYYYMMDD = (d: Date | string) => moment(d).format('YYYY-MM-DD');
const fmtNice = (d?: string) => (d ? moment(d).format('MMM D, YYYY') : '—');

/** Robust formatter → "6 Sep 2025 11:45AM" */
// Assumes moment is available. If you use moment-timezone and want to force IST,
// you can set: moment.tz.setDefault('Asia/Kolkata');

const formatApptDateTime = (dateStr?: string, timeStr?: string) => {
  const j = (a?: string, b?: string) => [a, b].filter(Boolean).join(' ');
  const s = (x?: string) => (x || '').trim();
  const D = s(dateStr),
    T = s(timeStr),
    TN = T ? T.toUpperCase().replace(/\s+/g, '') : '';
  const hasTime = !!TN || /(\d{1,2}:\d{2})|\b[AP]M\b/i.test(D);
  const OUT = hasTime ? 'D MMM YYYY h:mmA' : 'D MMM YYYY';
  const ISOZ = (x: string) => /T\d{2}:\d{2}|Z$|[+-]\d{2}:?\d{2}$/.test(x);
  const FDT = [
    'DD-MMM-YYYY h:mmA',
    'D-MMM-YYYY h:mmA',
    'DD-MMM-YYYY h:mm A',
    'D-MMM-YYYY h:mm A',
    'YYYY-MM-DD HH:mm',
    'YYYY-MM-DD h:mmA',
    'YYYY-MM-DD h:mm A',
    'DD/MM/YYYY h:mmA',
    'D/M/YYYY h:mmA',
    'DD/MM/YYYY h:mm A',
    'D/M/YYYY h:mm A',
    'h:mmA',
    'h:mm A',
    'HH:mm',
  ];
  const FD = [
    'DD-MMM-YYYY',
    'D-MMM-YYYY',
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'D/M/YYYY',
  ];
  const C = j(D, TN);

  if (C && ISOZ(C)) {
    const z = moment.parseZone(C);
    if (z.isValid()) return z.local().format(OUT);
  }

  let m = hasTime ? moment(C, FDT, true) : moment(D, FD, true);
  if (!m.isValid() && hasTime) m = moment(D, FDT, true);
  if (!m.isValid() && !D && TN)
    m = moment(TN, ['h:mmA', 'h:mm A', 'HH:mm'], true);
  if (m.isValid()) return m.format(OUT);

  if (!hasTime && /^\d{4}-\d{2}-\d{2}$/.test(D))
    return moment(D, 'YYYY-MM-DD', true).format(OUT);

  const m2 = moment(j(D, T), hasTime ? FDT : FD, false);
  return m2.isValid() ? m2.format(OUT) : j(D, T).trim();
};

/* ---------- Patient Appointments (with chips) ---------- */
const PatientAppointments = memo(
  ({ date, doctorId, onDateChange, onViewAll }: PatientAppointmentsProps) => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [viewAll, setViewAll] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showDateCalendar, setShowDateCalendar] = useState(false);
    const [calendarDate, setCalendarDate] = useState<Date>(date);
    const getAppointments = useCallback(
      async (selectedDate: Date) => {
        setLoading(true);
        try {
          const storedToken = await AsyncStorage.getItem('authToken');
          if (!storedToken) return;
          const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');
          const response = await AuthFetch(
            `appointment/getAppointmentsByDoctorID/dashboardAppointment?date=${formattedDate}&doctorId=${doctorId}&limit=6`,
            storedToken,
          );

          if (response?.data?.status === 'success') {
            setAppointments(response.data.data?.appointments || []);
          } else if (
            response?.status === 'success' &&
            'data' in response &&
            response.data
          ) {
            setAppointments((response.data as any).data?.appointments || []);
          } else {
            const storedData = await AsyncStorage.getItem('appointments');
            const fallbackData = storedData
              ? JSON.parse(storedData)
              : { totalAppointments: [] };
            const filteredAppointments =
              fallbackData?.totalAppointments?.filter((appt: any) => {
                const apptDate = dayjs(appt.appointmentDate).format(
                  'YYYY-MM-DD',
                );
                return apptDate === formattedDate;
              }) || [];

            setAppointments(filteredAppointments);
          }
        } catch (error) {
          const storedData = await AsyncStorage.getItem('appointments');
          const fallbackData = storedData
            ? JSON.parse(storedData)
            : { totalAppointments: [] };
          const formattedDate = dayjs(date).format('YYYY-MM-DD');
          const filteredAppointments =
            fallbackData?.totalAppointments?.filter((appt: any) => {
              const apptDate = dayjs(appt.appointmentDate).format('YYYY-MM-DD');
              return apptDate === formattedDate;
            }) || [];

          setAppointments(filteredAppointments);
        } finally {
          setLoading(false);
        }
      },
      [doctorId],
    );

    useEffect(() => {
      getAppointments(date);
    }, [date, getAppointments]);

    const handleDateChangeAndroid = useCallback(
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowPicker(false);
        if (event.type === 'dismissed' || !selectedDate) return;
        onDateChange(selectedDate);
      },
      [onDateChange],
    );

    const openDatePicker = () => {
      if (Platform.OS === 'android') {
        setShowPicker(true);
      } else {
        setCalendarDate(new Date());
        setShowDateCalendar(true);
      }
    };
    const handleDateChangeIOS = (selectedDate: Date) => {
      onDateChange(selectedDate);
      setShowDateCalendar(false);
    };

    const cancelDateCalendarIOS = () => {
      setShowDateCalendar(false);
    };

    const handleViewAll = useCallback(() => {
      if (onViewAll) {
        onViewAll();
      } else {
        setViewAll(true);
      }
    }, [onViewAll]);

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} onPress={openDatePicker}>
          <Text style={styles.title}>Patient Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.datePicker} onPress={openDatePicker}>
          <CalendarIcon size={moderateScale(20)} color="#333" />

          <Text style={styles.dateText}>
            {moment(date).format('DD MMM YYYY')}
          </Text>
        </TouchableOpacity>
        {Platform.OS === 'android' && showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleDateChangeAndroid}
            minimumDate={new Date(1900, 0, 1)}
          />
        )}

        {loading ? (
          <View style={styles.spinningContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={{ color: 'black' }}>Loading Appointments...</Text>
          </View>
        ) : appointments.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 1 }]}>Name</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Type</Text>
              <Text style={[styles.headerCell, { flex: 1 }]}>Status</Text>
            </View>

            {appointments
              .slice(0, viewAll ? appointments.length : 5)
              .map((item, index) => {
                const typeInfo = getTypeInfo(item.appointmentType);
                const statusInfo = getStatusColors(item.appointmentStatus);
                return (
                  <View key={index} style={styles.tableRow}>
                    <View style={[styles.nameColumn, { flex: 2 }]}>
                      <Text style={styles.nameText}>
                        {item.patientName || 'Unknown'}
                      </Text>
                      <Text style={styles.datetimeText}>
                        {formatApptDateTime(
                          item.appointmentDate,
                          item.appointmentTime,
                        )}
                      </Text>
                    </View>

                    <View style={[styles.nameColumn, { flex: 1 }]}>
                      <Text style={[styles.pillText, { color: typeInfo.fg }]}>
                        {item.appointmentType}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.pill,
                        { flex: 1, backgroundColor: statusInfo.bg },
                      ]}
                    >
                      <Text style={[styles.pillText, { color: statusInfo.fg }]}>
                        {item.appointmentStatus
                          ? `${item.appointmentStatus[0].toUpperCase()}${item.appointmentStatus.slice(
                            1,
                          )}`
                          : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        ) : (
          <Text
            style={{
              textAlign: 'center',
              marginTop: SPACING.lg,
              color: 'black',
              fontSize: responsiveText(FONT_SIZE.sm),
            }}
          >
            No appointments on this date.
          </Text>
        )}

        {appointments.length > 5 && !viewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewAll}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}

        {Platform.OS === 'ios' && (
          <IOSCalendarPicker
            visible={showDateCalendar}
            currentDate={calendarDate}
            onConfirm={handleDateChangeIOS}
            onCancel={cancelDateCalendarIOS}
            title="Select Appointment Date"
            mode="date"
            minDate={new Date(1900, 0, 1)}
          />
        )}
      </View>
    );
  },
);

/* ---------- Main Dashboard ---------- */
const DoctorDashboard = () => {
  const navigation = useNavigation<any>();
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeWorkTab, setActiveWorkTab] = useState<'hospital' | 'home'>('hospital');

  useFocusEffect(
    useCallback(() => {
      setActiveWorkTab('hospital');
    }, [])
  );
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    practice: '',
    consultationPreferences: '',
    bank: '',
    accountNumber: '',
  });

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [showTodayRevenue, setShowTodayRevenue] = useState(false);
  const [showMonthRevenue, setShowMonthRevenue] = useState(false);

  // Revenue Summary (RN chart-kit shape)
  const [revenueSummaryData, setRevenueSummaryData] = useState([
    {
      name: 'Appointment',
      population: 0,
      color: '#4285f4',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Lab',
      population: 0,
      color: '#34a853',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
    {
      name: 'Pharmacy',
      population: 0,
      color: '#fbbc04',
      legendFontColor: '#7F7F7F',
      legendFontSize: 15,
    },
  ]);

  // Parity: totals + percentage changes (already present)
  const [dashboardData, setDashboardData] = useState({
    appointmentCounts: { today: 0, newAppointments: 0, followUp: 0 },
    percentageChanges: { today: 0, newAppointments: 0, followUp: 0 },
  });

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [currentClinicIndex, setCurrentClinicIndex] = useState(0);
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [nextAvailableSlot, setNextAvailableSlot] = useState<Slot[]>([]);

  const [reviews, setReviews] = useState<
    Array<{
      id: string;
      patientName: string;
      date?: string;
      rating: number;
      review: string;
      avatar?: string;
    }>
  >([]);

  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;

  /* ---------- Revenue Summary RANGE (new) ---------- */
  const today = fmtYYYYMMDD(new Date());
  const [revenueStartDate, setRevenueStartDate] = useState<string>(today);
  const [revenueEndDate, setRevenueEndDate] = useState<string>(today);
  const [whichRangePicker, setWhichRangePicker] = useState<
    'start' | 'end' | null
  >(null);
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);
  const [rangeCalendarDate, setRangeCalendarDate] = useState<Date>(new Date());
  const [rangeCalendarType, setRangeCalendarType] = useState<
    'start' | 'end' | null
  >(null);

  const pieState = useMemo(() => {
    const total = revenueSummaryData.reduce(
      (s, d) => s + (Number(d.population) || 0),
      0,
    );

    const hasData = total > 0;

    if (!hasData) {
      const zeroData = revenueSummaryData.map(d => ({
        ...d,
        population: 0,
      }));
      return {
        data: zeroData,
        accessor: 'population',
        absolute: false,
        hasData: false,
      };
    }

    return {
      data: revenueSummaryData,
      accessor: 'population',
      absolute: true,
      hasData: true,
    };
  }, [revenueSummaryData]);

  const getRevenueData = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) return;
      const response = await AuthFetch(
        'finance/getTodayRevenuebyDoctorId',
        storedToken,
      );
      const rev = response?.data?.data || (response?.data || {}).data || {};
      setTodayRevenue(rev.todayRevenue || 0);
      setMonthRevenue(rev.monthRevenue || 0);
    } catch (error) { }
  }, []);

  const getRevenueSummaryThisMonth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) return;
      const response = await AuthFetch(
        'finance/getDoctorRevenueSummaryThismonth',
        storedToken,
      );
      if (response?.data?.status === 'success') {
        const data = response.data.data;
        setRevenueSummaryData([
          {
            name: 'Appointment',
            population: data.appointment || 0,
            color: '#4285f4',
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
          },
          {
            name: 'Lab',
            population: data.lab || 0,
            color: '#34a853',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15,
          },
          {
            name: 'Pharmacy',
            population: data.pharmacy || 0,
            color: '#fbbc04',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15,
          },
        ]);
      }
    } catch (error) { }
  }, []);

  const getRevenueSummaryRange = useCallback(
    async (start?: string, end?: string) => {
      try {
        if (!start || !end) {
          setRevenueSummaryData([
            {
              name: 'Appointment',
              population: 0,
              color: '#4285f4',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
            {
              name: 'Lab',
              population: 0,
              color: '#34a853',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
            {
              name: 'Pharmacy',
              population: 0,
              color: '#fbbc04',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
          ]);
          return;
        }
        const storedToken = await AsyncStorage.getItem('authToken');
        if (!storedToken) return;
        const url = `finance/getDoctorRevenueSummaryThismonth?startDate=${start}&endDate=${end}`;
        const response = await AuthFetch(url, storedToken);

        if (response?.data?.status === 'success') {
          const data = response.data.data;
          setRevenueSummaryData([
            {
              name: 'Appointment',
              population: data?.appointment || 0,
              color: '#4285f4',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
            {
              name: 'Lab',
              population: data?.lab || 0,
              color: '#34a853',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
            {
              name: 'Pharmacy',
              population: data?.pharmacy || 0,
              color: '#fbbc04',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
          ]);
        } else {
          setRevenueSummaryData([
            {
              name: 'Appointment',
              population: 0,
              color: '#4285f4',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            },
            {
              name: 'Lab',
              population: 0,
              color: '#34a853',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
            {
              name: 'Pharmacy',
              population: 0,
              color: '#fbbc04',
              legendFontColor: '#7F7F7F',
              legendFontSize: 15,
            },
          ]);
        }
      } catch (error) {
        setRevenueSummaryData([
          {
            name: 'Appointment',
            population: 0,
            color: '#4285f4',
            legendFontColor: '#7F7F7F',
            legendFontSize: 12,
          },
          {
            name: 'Lab',
            population: 0,
            color: '#34a853',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15,
          },
          {
            name: 'Pharmacy',
            population: 0,
            color: '#fbbc04',
            legendFontColor: '#7F7F7F',
            legendFontSize: 15,
          },
        ]);
      }
    },
    [],
  );

  const getTodayAppointmentCount = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) return;
      const response = await AuthFetch(
        `appointment/getTodayAppointmentCount?doctorId=${doctorId}`,
        storedToken,
      );
      const ok = response?.data?.status === 'success';
      const dat = ok ? response.data.data : {};
      setDashboardData({
        appointmentCounts: {
          today: dat?.totalAppointments?.today || 0,
          newAppointments: dat?.newAppointments?.today || 0,
          followUp: dat?.followupAppointments?.today || 0,
        },
        percentageChanges: {
          today: dat?.totalAppointments?.percentageChange || 0,
          newAppointments: dat?.newAppointments?.percentageChange || 0,
          followUp: dat?.followupAppointments?.percentageChange || 0,
        },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch appointment count',
        position: 'top',
      });
    }
  }, [doctorId]);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      await AsyncStorage.setItem('stepNo', '7');
      const response = await AuthFetch('users/getUser', token);
      if (response.data.status !== 'success')
        throw new Error(response.data.message || 'Failed to fetch user data');

      const userData = response.data.data;
      const rawMobile = userData.mobile || '';
      const formattedPhone =
        rawMobile.length === 10
          ? `+91 ${rawMobile.slice(0, 3)} ${rawMobile.slice(
            3,
            6,
          )} ${rawMobile.slice(6, 10)}`
          : '';
      const maskAccountNumber = (accountNumber: string) =>
        accountNumber
          ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
          : '';

      setFormData({
        name: `${userData.firstname || ''} ${userData.lastname || ''}`.trim(),
        email: userData.email || '',
        phone: formattedPhone,
        specialization: userData.specialization?.name || '',
        practice: userData.addresses?.length > 0 ? userData.addresses[0] : '',
        consultationPreferences:
          userData.consultationModeFee?.length > 0
            ? userData.consultationModeFee.map((m: any) => m.type).join(', ')
            : '',
        bank: userData.bankDetails?.bankName || '',
        accountNumber: maskAccountNumber(
          userData.bankDetails?.accountNumber || '',
        ),
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch user data',
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClinics = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(
        `users/getClinicAddress?doctorId=${doctorId}`,
        token,
      );
      if (response?.data?.status === 'success') {
        const activeClinics = (response.data.data || []).filter(
          (clinic: Clinic) => clinic.status === 'Active',
        );
        setClinics(activeClinics || []);
      }
    } catch (err) { }
  }, [doctorId]);

  const fetchAvailableSlots = useCallback(async () => {
    if (!doctorId || clinics.length === 0) return;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(
        `appointment/getNextAvailableSlotsByDoctor?doctorId=${doctorId}`,
        token,
      );
      if (response?.data?.status === 'success') {
        const slotsData: Slot[] = response.data.data || [];
        const todayStr = moment().format('YYYY-MM-DD');
        const tomorrowStr = moment().add(1, 'day').format('YYYY-MM-DD');
        setAvailableSlots(slotsData.filter(s => s.date === todayStr));
        setNextAvailableSlot(slotsData.filter(s => s.date === tomorrowStr));
      }
    } catch (err) { }
  }, [doctorId, clinics]);

  const fetchReviews = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(
        `users/getFeedbackByDoctorId/${doctorId}`,
        token,
      );

      const ok =
        response?.data?.status === 'success' || response?.status === 'success';

      const doctorData =
        ok && response?.data?.doctor
          ? response.data.doctor
          : response?.data?.data && response.data.data.doctor
            ? response.data.data.doctor
            : null;

      const fbArr = (doctorData?.feedback || []).map((f: any, idx: number) => ({
        id: f.feedbackId || f.id || String(idx),
        patientName: f.patientName || 'Unknown User',
        date: f.date || f.createdAt,
        rating: typeof f.rating === 'number' ? f.rating : Number(f.rating || 0),
        review: f.comment || f.review || 'No review provided',
        avatar: f.avatar || undefined,
      }));

      setReviews(fbArr);
    } catch (err) { }
  }, [doctorId]);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      try {
        if (currentuserDetails) {
          await Promise.all([
            fetchUserData(),
            getRevenueData(),
            getTodayAppointmentCount(),
            fetchClinics(),
            fetchReviews(),
          ]);
          await getRevenueSummaryRange(revenueStartDate, revenueEndDate);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [
    fetchUserData,
    getRevenueData,
    getTodayAppointmentCount,
    fetchClinics,
    getRevenueSummaryRange,
    fetchReviews,
  ]);

  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  const handleDateChange = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);

  const handleViewAllAppointments = useCallback(() => {
    navigation.navigate('Appointments');
  }, [navigation]);

  const handleRangePickedAndroid = useCallback(
    (kind: 'start' | 'end') =>
      (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed') {
          setWhichRangePicker(null);
          return;
        }

        const iso = fmtYYYYMMDD(selectedDate || new Date());

        if (kind === 'start') {
          if (revenueEndDate && moment(iso).isAfter(revenueEndDate)) {
            setRevenueStartDate(iso);
            setRevenueEndDate(iso);
            getRevenueSummaryRange(iso, iso);
          } else {
            setRevenueStartDate(iso);
            getRevenueSummaryRange(iso, revenueEndDate);
          }
        } else {
          if (revenueStartDate && moment(iso).isBefore(revenueStartDate)) {
            Toast.show({
              type: 'error',
              text1: 'Invalid range',
              text2: 'End date cannot be before start date',
              position: 'top',
            });
            setWhichRangePicker(null);
            return;
          }
          setRevenueEndDate(iso);
          getRevenueSummaryRange(revenueStartDate, iso);
        }

        setWhichRangePicker(null);
      },
    [revenueStartDate, revenueEndDate, getRevenueSummaryRange],
  );

  const openRangeDatePicker = (type: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      setWhichRangePicker(type);
    } else {
      setRangeCalendarDate(new Date());
      setRangeCalendarType(type);
      setShowRangeCalendar(true);
    }
  };

  const handleRangeDateChangeIOS = (date: Date) => {
    const iso = fmtYYYYMMDD(date);

    if (rangeCalendarType === 'start') {
      if (revenueEndDate && moment(iso).isAfter(revenueEndDate)) {
        setRevenueStartDate(iso);
        setRevenueEndDate(iso);
        getRevenueSummaryRange(iso, iso);
      } else {
        setRevenueStartDate(iso);
        getRevenueSummaryRange(iso, revenueEndDate);
      }
    } else if (rangeCalendarType === 'end') {
      if (revenueStartDate && moment(iso).isBefore(revenueStartDate)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid range',
          text2: 'End date cannot be before start date',
          position: 'top',
        });
        setShowRangeCalendar(false);
        setRangeCalendarType(null);
        return;
      }
      setRevenueEndDate(iso);
      getRevenueSummaryRange(revenueStartDate, iso);
    }

    setShowRangeCalendar(false);
    setRangeCalendarType(null);
  };

  const cancelRangeCalendarIOS = () => {
    setShowRangeCalendar(false);
    setRangeCalendarType(null);
  };

  const clearRange = useCallback(() => {
    setRevenueStartDate(today);
    setRevenueEndDate(today);
    getRevenueSummaryRange(today, today);
  }, [getRevenueSummaryRange]);

  /* ---------- Render ---------- */
  const currentClinic = clinics[currentClinicIndex];
  const selectedClinicToday = availableSlots.find(
    each => each.addressId === currentClinic?.addressId,
  );
  const selectedClinicTomorrow = nextAvailableSlot.find(
    each => each.addressId === currentClinic?.addressId,
  );
  const formatSlotTime = (time: string) =>
    moment(time, 'HH:mm').format('hh:mm A');

  const isSmallDevice = isSmallDeviceUtil;

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.spinningContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text
            style={{ color: 'black', fontSize: responsiveText(FONT_SIZE.md) }}
          >
            Loading Dashboard...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate('Sidebar')}>
              <HamburgerMenuIcon size={28} color="#000000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>
              {(() => {
                const hour = new Date().getHours();
                if (hour < 12) return 'Good Morning,';
                if (hour < 17) return 'Good Afternoon,';
                return 'Good Evening,';
              })()}
              {'\n'}
              {currentuserDetails?.role === 'doctor' && 'Dr. '}
              {formData?.name}
            </Text>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeWorkTab === 'hospital' && styles.tabActive]}
              onPress={() => setActiveWorkTab('hospital')}
            >
              <Text style={[styles.tabText, activeWorkTab === 'hospital' && styles.tabTextActive]}>
                Hospital Work
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeWorkTab === 'home' && styles.tabActive]}
              onPress={() => {
                setActiveWorkTab('home');
                navigation.navigate('ProviderTabDashboard');
              }}
            >
              <Text style={[styles.tabText, activeWorkTab === 'home' && styles.tabTextActive]}>
                Home Care
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.appointmentButton,
              {
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddAppointment')}
            >
              <Text style={styles.addButtonText}>+ Add Appointment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <View style={styles.appointmentsCard}>
              <View style={styles.centered}>
                <Text style={styles.mainNumber}>
                  {dashboardData.appointmentCounts.today}
                </Text>

                <Text
                  style={[
                    styles.subText,
                    isSmallDevice && { fontSize: moderateScale(14) },
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  allowFontScaling={false}
                >
                  Today's Appointments
                </Text>
              </View>
              <View style={styles.gridRow}>
                <View style={styles.newCard}>
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendBadgeText}>
                      {dashboardData.percentageChanges.newAppointments}%{' '}
                      {dashboardData.percentageChanges.newAppointments >= 0
                        ? '↑'
                        : '↓'}
                    </Text>
                  </View>
                  <Text style={styles.newNumber}>
                    {dashboardData.appointmentCounts.newAppointments}
                  </Text>
                  <Text style={styles.newLabel}>New Appointments</Text>
                </View>
                <View style={styles.followUpCard}>
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendBadgeText}>
                      {dashboardData.percentageChanges.followUp}%
                      {dashboardData.percentageChanges.followUp >= 0
                        ? '↑'
                        : '↓'}
                    </Text>
                  </View>
                  <Text style={styles.followUpNumber}>
                    {dashboardData.appointmentCounts.followUp}
                  </Text>
                  <Text style={styles.followUpLabel}>Follow-ups</Text>
                </View>
              </View>
            </View>

            {currentuserDetails?.role === 'doctor' && (
              <View style={styles.revenueCard}>
                <View style={styles.revenueRow}>

                  {/* ── Today's Revenue box ── */}
                  <View style={styles.revenueBoxPurple}>
                    {/* Real content always rendered underneath */}
                    <Text style={styles.revenueAmountPurple}>
                      ₹{todayRevenue}
                    </Text>
                    <Text style={styles.revenueSubLabel}>Today's Revenue</Text>

                    {/* Overlay covers full box when hidden */}
                    {!showTodayRevenue && (
                      <TouchableOpacity
                        style={styles.revealOverlayPurple}
                        onPress={() => setShowTodayRevenue(true)}
                        activeOpacity={1}
                      >
                        <View style={styles.revealPillPurple}>
                          <Text style={styles.revealPillTextPurple}>
                            tap to reveal
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* hide link shown after reveal */}
                    {showTodayRevenue && (
                      <TouchableOpacity
                        onPress={() => setShowTodayRevenue(false)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.hideTextPurple}>hide</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ── This Month box ── */}
                  <View style={styles.revenueBoxOrange}>
                    {/* Real content always rendered underneath */}
                    <Text style={styles.revenueAmountOrange}>
                      ₹{monthRevenue}
                    </Text>
                    <Text style={styles.revenueSubLabelOrange}>This Month</Text>

                    {/* Overlay covers full box when hidden */}
                    {!showMonthRevenue && (
                      <TouchableOpacity
                        style={styles.revealOverlayOrange}
                        onPress={() => setShowMonthRevenue(true)}
                        activeOpacity={1}
                      >
                        <View style={styles.revealPillOrange}>
                          <Text style={styles.revealPillTextOrange}>
                            tap to reveal
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* hide link shown after reveal */}
                    {showMonthRevenue && (
                      <TouchableOpacity
                        onPress={() => setShowMonthRevenue(false)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.hideTextOrange}>hide</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                </View>
              </View>
            )}
          </View>


          <View style={styles.card}>
            <Text style={styles.title}>Clinic Availability</Text>
            <View style={styles.clinicNavContainer}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentClinicIndex(p =>
                    p > 0 ? p - 1 : clinics.length - 1,
                  )
                }
              >
                <LeftIndicatorIcon size={moderateScale(24)} color="black" />
              </TouchableOpacity>
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName}>
                  {currentClinic?.clinicName || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  setCurrentClinicIndex(p =>
                    p < clinics.length - 1 ? p + 1 : 0,
                  )
                }
              >
                <RightIndicatorIcon size={moderateScale(24)} color="black" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Available Slots (Today):</Text>
            <ScrollView horizontal contentContainerStyle={styles.slotContainer}>
              {selectedClinicToday ? (
                selectedClinicToday.slots
                  .filter(s =>
                    (s as any).status
                      ? (s as any).status === 'available'
                      : true,
                  )
                  .slice(0, 5)
                  .map(slot => (
                    <View key={slot._id} style={styles.slot}>
                      <Text style={styles.slotText}>
                        {formatSlotTime(slot.time)}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text style={styles.unavailableText}>No slots available</Text>
              )}
            </ScrollView>

          </View>

          {currentuserDetails?.role === 'doctor' && (
            <View
              style={[
                styles.card,
                { alignItems: 'flex-start', paddingLeft: 0 },
              ]}
            >
              <View style={{ paddingHorizontal: SPACING.lg, width: '100%' }}>
                <Text style={styles.title}>Revenue Summary</Text>

                <View style={styles.rangeRow}>
                  <CalendarIcon size={moderateScale(20)} color="#333" />

                  <TouchableOpacity
                    style={styles.rangeBtn}
                    onPress={() => openRangeDatePicker('start')}
                  >
                    <Text style={styles.rangeBtnLabel}>Start</Text>
                    <Text style={styles.rangeBtnValue}>
                      {fmtNice(revenueStartDate)}
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      marginHorizontal: SPACING.sm,
                      color: '#6b7280',
                      fontSize: responsiveText(FONT_SIZE.sm),
                    }}
                  >
                    {' '}
                    —
                  </Text>

                  <TouchableOpacity
                    style={styles.rangeBtn}
                    onPress={() => openRangeDatePicker('end')}
                  >
                    <Text style={styles.rangeBtnLabel}>End</Text>
                    <Text style={styles.rangeBtnValue}>
                      {fmtNice(revenueEndDate)}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={clearRange}
                  >
                    <SyncIcon
                      size={moderateScale(16)}
                      color="#6b7280"
                    />
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {Platform.OS === 'android' && whichRangePicker === 'start' && (
                <DateTimePicker
                  value={moment(revenueStartDate, 'YYYY-MM-DD').toDate()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={handleRangePickedAndroid('start')}
                />
              )}
              {Platform.OS === 'android' && whichRangePicker === 'end' && (
                <DateTimePicker
                  value={moment(revenueEndDate, 'YYYY-MM-DD').toDate()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={handleRangePickedAndroid('end')}
                />
              )}

              {pieState.hasData ? (
                <PieChart
                  data={pieState.data}
                  width={responsiveWidth(95)}
                  height={moderateScale(200)}
                  chartConfig={{
                    color: () => `rgba(0, 0, 0, 1)`,
                    decimalPlaces: 0,
                  }}
                  accessor={pieState.accessor}
                  backgroundColor={'transparent'}
                  paddingLeft={'0'}
                  hasLegend={true}
                  absolute={pieState.absolute}
                  style={{
                    alignSelf: 'flex-start',
                    marginLeft: SPACING.sm,
                    paddingRight: SPACING.md,
                  }}
                />
              ) : (
                <View style={styles.noRevenueContainer}>
                  <Text style={styles.noRevenueText}>
                    No revenue data available
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Patient Feedback</Text>
              <View style={styles.navButtons}></View>
            </View>
            <ScrollView style={{ maxHeight: moderateScale(220) }}>
              {reviews.length === 0 ? (
                <View style={styles.noReviewsContainer}>
                  <Text style={styles.noReviewsText}>No reviews yet.</Text>
                </View>
              ) : (
                reviews.slice(0, 10).map((fb, i) => {
                  const daysAgo = fb.date ? moment(fb.date).fromNow() : '';
                  return (
                    <View key={fb.id || i} style={styles.feedbackItem}>
                      <View style={styles.avatarRow}>
                        <View style={styles.placeholderCircle}>
                          <Text style={styles.placeholderText}>
                            {fb.patientName[0].toUpperCase() || ''}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{fb.patientName}</Text>
                          <View style={styles.ratingRow}>
                            {[
                              ...Array(
                                Math.max(0, Math.min(5, fb.rating || 0)),
                              ),
                            ].map((_, j) => (
                              <FullStarIcon
                                key={j}
                                size={moderateScale(14)}
                                color="#fbbf24"
                                style={{ marginRight: 2 }}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.comment}>"{fb.review}"</Text>
                      {!!daysAgo && (
                        <Text style={styles.dateText}>{daysAgo}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </ScrollView>
      )}

      {Platform.OS === 'ios' && (
        <IOSCalendarPicker
          visible={showRangeCalendar}
          currentDate={rangeCalendarDate}
          onConfirm={handleRangeDateChangeIOS}
          onCancel={cancelRangeCalendarIOS}
          title={
            rangeCalendarType === 'start'
              ? 'Select Start Date'
              : 'Select End Date'
          }
          mode="date"
          minDate={new Date(1900, 0, 1)}
          maxDate={new Date()}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: isTablet ? SPACING.lg : SPACING.md,
    backgroundColor: '#F0FDF4',
  },
  spinningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  noReviewsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: moderateScale(100),
    marginTop: -SPACING.lg,
    marginBottom: -SPACING.lg,
  },
  noRevenueContainer: {
    width: responsiveWidth(95),
    height: moderateScale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  noRevenueText: {
    color: '#6c757d',
    fontSize: responsiveText(FONT_SIZE.md),
    textAlign: 'center',
  },
  noReviewsText: {
    color: '#6c757d',
    textAlign: 'center',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  placeholderCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(30),
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  placeholderText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },
  headerText: {
    color: '#000',
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    flex: 1,
    marginLeft: SPACING.md,
    marginTop: SPACING.md,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 0,
    margin: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
  },
  appointmentsCard: {
    backgroundColor: '#16a8a0',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    shadowColor: '#20d0c4',
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(16),
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    minHeight: moderateScale(130),
  },
  centered: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '100%',
  },
  mainNumber: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxxl : FONT_SIZE.xxl),
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.md : FONT_SIZE.sm),
    color: '#fff',
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  newCard: {
    backgroundColor: '#F0FDF4',
    flex: 1,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    position: 'relative',
  },
  trendBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.md,
  },
  trendBadgeText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#166534',
    fontWeight: '600',
  },
  newNumber: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#16A34A',
  },
  newLabel: {
    color: '#16A34A',
    marginTop: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  followUpCard: {
    backgroundColor: '#EFF6FF',
    flex: 1,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    position: 'relative',
  },
  followUpNumber: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#2563EB',
  },
  followUpLabel: {
    color: '#2563EB',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  revenueCard: {
    marginTop: SPACING.md,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  /* position:relative + overflow:hidden so absolute child clips to box */
  revenueBoxPurple: {
    flex: 1,
    backgroundColor: '#FAF5FF',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: SPACING.sm,
    minHeight: moderateScale(90),
    position: 'relative',
    overflow: 'hidden',
  },
  revenueBoxOrange: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    marginLeft: SPACING.sm,
    minHeight: moderateScale(90),
    position: 'relative',
    overflow: 'hidden',
  },
  revenueAmountPurple: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxxl : FONT_SIZE.xxl),
    fontWeight: '700',
    color: '#9333EA',
  },
  revenueAmountOrange: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxl : FONT_SIZE.xl),
    fontWeight: '700',
    color: '#EA580C',
  },
  revenueSubLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#9333EA',
    marginTop: SPACING.xs,
  },
  revenueSubLabelOrange: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#EA580C',
    marginTop: SPACING.xs,
  },
  /* Full-box frosted overlay — top/left/right/bottom: 0 fills entire parent */
  revealOverlayPurple: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(233,213,255,0.82)',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: SPACING.lg,
  },
  revealOverlayOrange: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(254,215,170,0.82)',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    padding: SPACING.lg,
  },
  /* Pill chip — top-left of the overlay, matches screenshot exactly */
  revealPillPurple: {
    backgroundColor: 'rgba(192,132,252,0.45)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
  },
  revealPillOrange: {
    backgroundColor: 'rgba(253,186,116,0.55)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(20),
  },
  revealPillTextPurple: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#7E22CE',
    fontWeight: '600',
  },
  revealPillTextOrange: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#C2410C',
    fontWeight: '600',
  },
  hideTextPurple: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#9333EA',
    opacity: 0.55,
    textDecorationLine: 'underline',
    marginTop: SPACING.xs,
  },
  hideTextOrange: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#EA580C',
    opacity: 0.55,
    textDecorationLine: 'underline',
    marginTop: SPACING.xs,
  },
  addButton: {
    backgroundColor: '#007bff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  card: {
    backgroundColor: '#F9FBFC',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(6),
    elevation: 3,
    color: 'black',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: '600',
    color: 'black',
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  table: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  nameColumn: {
    paddingRight: SPACING.sm,
  },
  nameText: {
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#0A2342',
  },
  datetimeText: {
    color: '#777',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  pill: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: moderateScale(16),
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
  },
  viewAllButton: {
    marginTop: SPACING.md,
    alignSelf: 'flex-end',
  },
  viewAllText: {
    color: '#16a8a0',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  clinicNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  clinicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  clinicName: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    color: '#0A2342',
    marginTop: SPACING.md,
  },
  sectionLabel: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    color: 'black',
  },
  slotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  slot: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#f0f8f0',
    borderRadius: LAYOUT.borderRadius.pill,
    borderWidth: 1,
    borderColor: '#1b5e20',
  },
  slotText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#1b5e20',
  },
  unavailableText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: SPACING.md,
  },
  navButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  feedbackItem: {
    marginBottom: SPACING.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#f3f4f6',
  },
  name: {
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
    color: 'black',
  },
  ratingRow: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
    gap: SPACING.xxs,
  },
  comment: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  rangeBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: moderateScale(140),
  },
  rangeBtnLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6b7280',
    marginBottom: SPACING.xxs,
  },
  rangeBtnValue: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#111827',
    fontWeight: '500',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginLeft: 'auto',
  },
  clearText: {
    color: '#6b7280',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#fff',
    paddingBottom: SAFE_AREA.safeBottom + SPACING.base,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
  },
  modalCancel: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  modalDone: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
  },
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 168, 160, 0.08)',
    borderRadius: moderateScale(24),
    padding: moderateScale(4),
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(22, 168, 160, 0.08)',
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
    shadowColor: '#16a8a0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  tabText: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#16a8a0',
    fontWeight: '700',
  },
});

export default DoctorDashboard;