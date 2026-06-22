import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Key, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { AuthPost, AuthFetch } from '../../auth/auth';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utility/responsive';

// Import iOS Calendar Picker
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import CommonHeader from '../../utility/CommonHeader';

interface Appointment {
  doctorId: string;
  patientId: string;
  label: ReactNode;
  value: Key | null | undefined;
  _id: string;
  appointmentDate: string;
  appointmentType: string;
  patientName: string;
  id: string;
  phone: string;
  clinic: string;
  type: string;
  date: string;           // DISPLAY (DD-MMM-YYYY)
  rawDate: string;        // YYYY-MM-DD
  status: string;         // scheduled/completed/rescheduled/cancelled
  statusColor: string;
  typeIcon: string;
  avatar?: string;
  appointmentTime: string;   // raw HH:mm from API
  displayTime: string;       // DISPLAY h:mm A
  addressId: string;
  appointmentDepartment?: string;
  appointmentReason?: string;
}

const STATUS_COLORS = {
  scheduled: { bg: '#e8f5e8', fg: '#16A34A', label: 'Scheduled' },
  completed: { bg: '#e3f2fd', fg: '#2563EB', label: 'Completed' },
  rescheduled: { bg: '#fff3e0', fg: '#F59E0B', label: 'Rescheduled' },
  cancelled: { bg: '#ffebee', fg: '#EF4444', label: 'Cancelled' },
  canceled: { bg: '#ffebee', fg: '#EF4444', label: 'Cancelled' },
};

const formatWebDate = (d: string) =>
  moment(d).isValid() ? moment(d).format('DD-MMM-YYYY') : d;

const format12h = (t?: string) =>
  t ? moment(t, ['HH:mm', 'H:mm']).format('h:mm A') : 'N/A';

// safely parse “appointment moment”; if invalid → null
const parseApptMoment = (rawDate?: string, rawTime?: string) => {
  if (!rawDate || !rawTime) return null;
  const m = moment(`${rawDate} ${rawTime}`, 'YYYY-MM-DD HH:mm', true);
  return m.isValid() ? m : null;
};

const AppointmentsScreen = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;

  const navigation = useNavigation<any>();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null); // existing STATUS
  const [selectedApptType, setSelectedApptType] = useState<string>('all'); // TYPE
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);     // NEW: type popup like status
  const [filterDate, setFilterDate] = useState<string>(); // YYYY-MM-DD (default today)
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  // Action sheet (menu) + action modal
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<Appointment | null>(null);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'Cancel' | 'Reschedule' | 'Mark as Completed' | ''>('');

  // Reschedule / Cancel shared fields
  const [reason, setReason] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{ time: string }[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRescheduleDatePicker, setShowRescheduleDatePicker] = useState(false);

  // Cards counts
  const [totalAppointmentsCount, setTotalAppointmentsCount] = useState(0);
  const [scheduledAppointmentsCount, setScheduledAppointmentsCount] = useState(0);
  const [completedAppointmentsCount, setCompletedAppointmentsCount] = useState(0);
  const [cancledAppointmentsCount, setCancledAppointmentsCount] = useState(0);

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });

  // Date range for CARDS (like web)
  const thisMonthStart = moment().startOf('month').format('YYYY-MM-DD');
  const thisMonthEnd = moment().endOf('month').format('YYYY-MM-DD');
  const [startDate, setStartDate] = useState<string>(thisMonthStart);
  const [endDate, setEndDate] = useState<string>(thisMonthEnd);
  const [whichRangePicker, setWhichRangePicker] = useState<'start' | 'end' | null>(null);
  const [loader, setLoader] = useState(false);

  // Previous prescriptions presence (for disabling)
  const [hasPrescriptions, setHasPrescriptions] = useState<Record<string, boolean>>({});

  // Calendar states for iOS
  const [showRangeCalendar, setShowRangeCalendar] = useState(false);
  const [rangeCalendarType, setRangeCalendarType] = useState<'start' | 'end' | null>(null);
  const [rangeCalendarDate, setRangeCalendarDate] = useState<Date>(new Date());
  
  const [showFilterCalendar, setShowFilterCalendar] = useState(false);
  const [filterCalendarDate, setFilterCalendarDate] = useState<Date>(new Date());
  
  const [showRescheduleCalendar, setShowRescheduleCalendar] = useState(false);
  const [rescheduleCalendarDate, setRescheduleCalendarDate] = useState<Date>(new Date());

  const fetchAppointments = async (page = 1, limit = 5) => {
    try {
      setLoader(true)
      const queryParams = new URLSearchParams({
        doctorId: String(doctorId ?? ''),
        ...(search ? { searchText: String(search) } : {}),
        ...(selectedType && selectedType !== 'all' ? { status: String(selectedType) } : {}),
        ...(selectedApptType && selectedApptType !== 'all' ? { appointmentType: String(selectedApptType) } : {}),
        ...(filterDate ? { date: String(filterDate) } : {}),
        page: String(page),
        limit: String(limit),
      });

      const token = await AsyncStorage.getItem('authToken');
      const res = await AuthFetch(
        `appointment/getAppointmentsByDoctorID/appointment?${queryParams.toString()}`,
        token
      );

      const { appointments: apiAppointments = [], pagination: serverPg = {} } =
        res?.data?.data || {};

      const formatted: Appointment[] = apiAppointments.map((appt: any) => {
        const rawDate = appt.appointmentDate
          ? moment(appt.appointmentDate).format('YYYY-MM-DD')
          : '';
        const status = String(appt.appointmentStatus || '').toLowerCase();

        return {
          label: appt.patientName || '',
          value: appt.appointmentId || '',
          _id: appt._id || appt.appointmentId || '',
          appointmentDate: appt.appointmentDate || '',
          appointmentType: appt.appointmentType || '',
          appointmentDepartment: appt.appointmentDepartment,
          appointmentReason: appt.appointmentReason || '',
          walkinDoctorRegistrationNumber: appt.walkinDoctorRegistrationNumber || '',
          walkinReferredBy: appt.walkinReferredBy || '',
          patientName: appt.patientName || '',
          patientId: appt.userId || '',
          id: appt.appointmentId || '',
          doctorId: appt.doctorId || '',
          phone: appt.phone || '',
          clinic: appt.clinicName || 'Unknown Clinic',
          type: appt.appointmentType || 'General',
          rawDate,
          date: rawDate ? formatWebDate(rawDate) : 'Unknown Date',
          status,
          statusColor: '',
          typeIcon: 'General',
          avatar: 'https://i.pravatar.cc/150?img=12',
          appointmentTime: appt.appointmentTime || '',
          displayTime: format12h(appt.appointmentTime),
          addressId: appt.addressId,
        };
      });

      setPagination({
        current: serverPg.currentPage || page,
        pageSize: serverPg.pageSize || limit,
        total: serverPg.totalItems || formatted.length,
      });

      setAppointments(formatted);
      setLoader(false)

      // Precompute flags for "View Previous Prescription"
      try {
        const token2 = await AsyncStorage.getItem('authToken');
        const pairs = await Promise.all(
          formatted.map(async (a) => {
            if (!a.patientId) return [a.id, false] as const;
            try {
              const resp = await AuthFetch(
                `pharmacy/getEPrescriptionByPatientId/${a.patientId}`,
                token2
              );
              // Support both success shapes
              const ok =
                resp?.data?.success === true ||
                resp?.data?.status === 'success';
              const arr =
                resp?.data?.data && Array.isArray(resp.data.data)
                  ? resp.data.data
                  : [];
              return [a.id, ok && arr.length > 0] as const;
            } catch {
              return [a.id, false] as const;
            }
          })
        );
        const map: Record<string, boolean> = {};
        pairs.forEach(([id, val]) => (map[id] = val));
        setHasPrescriptions(map);
      } catch {
        // ignore
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch appointments');
    } finally {
      setLoader(false)
    }
  };

  useEffect(() => {
    if (currentuserDetails && doctorId) {
      fetchAppointments(1, pagination.pageSize, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedType, selectedApptType, filterDate]);

  useEffect(() => {
    if (currentuserDetails && doctorId) {
      fetchAppointments(pagination.current, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedType, selectedApptType, filterDate]);

  // Cleanup effect to reset modal states when component unmounts or key states change
  useEffect(() => {
    return () => {
      // Cleanup function to reset all modal states
      resetAllModalStates();
    };
  }, []);

  const TYPE_OPTIONS = useMemo(
    () => [
      { label: 'All Types', value: 'all' },
      { label: 'New Walkin', value: 'new-walkin' },
      { label: 'New HomeCare', value: 'new-homecare' },
      { label: 'Followup Walkin', value: 'followup-walkin' },
      { label: 'Followup Video', value: 'followup-video' },
      { label: 'Followup Homecare', value: 'followup-homecare' },
    ],
    []
  );
  const selectedApptTypeLabel = useMemo(
    () => TYPE_OPTIONS.find(o => o.value === selectedApptType)?.label ?? 'All Types',
    [TYPE_OPTIONS, selectedApptType]
  );

  const getAppointmentsCount = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const s = startDate || thisMonthStart;
      const e = endDate || thisMonthEnd;
      const response = await AuthFetch(
        `appointment/getAppointmentsCountByDoctorID?doctorId=${doctorId}&startDate=${s}&endDate=${e}`,
        token
      );

      const ok = response?.data?.status === 'success';
      const count = ok ? response?.data?.data : null;
      if (count) {
        setTotalAppointmentsCount(count.total ?? 0);
        setScheduledAppointmentsCount(count.scheduled ?? 0);
        setCompletedAppointmentsCount(count.completed ?? 0);
        setCancledAppointmentsCount(count.cancelled ?? 0);
      } else {
        Alert.alert('Failed to fetch appointments count');
      }
    } catch (error) {
      Alert.alert('Failed to fetch appointments count');
    }
  };

  useEffect(() => {
    if (currentuserDetails && doctorId) {
      getAppointmentsCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchTimeSlots = async (date: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const response = await AuthFetch(
        `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${formattedDate}&addressId=${selectedClinicId}`,
        token
      );

      if (response?.data?.status === 'success') {
        const today = moment().format('YYYY-MM-DD');
        const available = (response.data.data.slots || [])
          .filter((slot: any) => slot?.status === 'available')
          .filter((slot: any) => {
            if (formattedDate === today) {
              const slotDateTime = moment(`${formattedDate} ${slot.time}`, 'YYYY-MM-DD HH:mm');
              return slotDateTime.isAfter(moment());
            }
            return true;
          })
          .map((slot: any) => ({ time: slot.time }));

        setAvailableTimeSlots(available);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.data?.message?.message || 'Failed to fetch timeslots',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message?.message || 'Error fetching timeslots',
      });
    }
  };




  useEffect(() => {
    if (newDate && selectedClinicId) {
      fetchTimeSlots(newDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newDate, selectedClinicId]);

  // --- Utilities ---
  const fetchAndOpenPrevPrescriptions = async (patientId: string, patientName: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(`pharmacy/getEPrescriptionByPatientId/${patientId}`, token);
      console.log("Prescription response:", response);
      const ok =
        response?.data?.success === true ||
        response?.data?.status === 'success';
      const list =
        response?.data?.data && Array.isArray(response.data.data)
          ? response?.data?.data
          : [];

      if (ok && list.length > 0) {
        navigation.navigate('PreviousPrescription', {
          prescriptions: list,
          patientName,
        });
      } else {
        Toast.show({ type: 'info', text1: 'No previous prescriptions found' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error opening prescriptions' });
    }
  };
  const [button, setButton] = useState(false)
  const handleStatusChange = async (
    id: string,
    status: 'Cancel' | 'Reschedule' | 'Mark as Completed' | 'Prescription' | 'View Previous Prescription',
    _id: string,
    patientName: string,
    patientId: string
  ) => {
    try {
      setButton(true)
      const token = await AsyncStorage.getItem('authToken');

      if (status === 'Prescription') {
        setActionModalVisible(false);

        // Format the time before sending it to PatientDetails
        const formattedPatientDetails = {
          ...patientDetails,
          appointmentTime: patientDetails?.appointmentTime
            ? format12h(patientDetails.appointmentTime)
            : patientDetails?.appointmentTime,
            appointmentReason: patientDetails?.appointmentReason || 'N/A', // NEW
            
        };
        navigation.navigate('PatientDetails', { patientDetails: formattedPatientDetails });
        return;
      }
      if (status === 'View Previous Prescription') {
        setActionModalVisible(false);
        await fetchAndOpenPrevPrescriptions(patientId, patientName);
        return;
      }

      // Remaining: Cancel / Reschedule / Complete
      if (status === 'Cancel') {
        if (!reason.trim()) {
          Toast.show({ type: 'error', text1: 'Enter a reason for cancellation' });
          return;
        }
        const response = await AuthPost(
          'appointment/cancelAppointment',
          { appointmentId: id, reason },
          token
        );
        if (response?.data?.status === 'success') {
          Toast.show({ type: 'success', text1: 'Appointment cancelled' });
          fetchAppointments(pagination.current, pagination.pageSize);
          getAppointmentsCount();
        } else {
          Alert.alert('Error', response?.message?.message || 'Failed to cancel appointment');
        }
      } else if (status === 'Reschedule') {
        if (!newDate || !newTime) {
          Alert.alert('Error', 'Please select a date and time for rescheduling');
          setButton(false);
          return;
        }
        const rescheduleData = {
          appointmentId: id,
          newDate: moment(newDate).format('YYYY-MM-DD'),
          newTime,
          reason,
        };
        const response = await AuthPost('appointment/rescheduleAppointment', rescheduleData, token);
        if (response?.data?.status === 'success') {
          Toast.show({ type: 'success', text1: 'Appointment rescheduled' });
          // Reset all modal states immediately after successful API call
          setActionModalVisible(false);
          setActionMenuVisible(false);
          setSelectedAction('');
          setSelectedAppointmentId(null);
          setPatientDetails(null);
          setNewDate('');
          setNewTime('');
          setReason('');
          setAvailableTimeSlots([]);
          setShowRescheduleDatePicker(false);
          setShowRescheduleCalendar(false);
          
          // Fetch updated data
          await fetchAppointments(pagination.current, pagination.pageSize);
          await getAppointmentsCount();
        } else {
          Alert.alert('Error', response?.data?.message?.message || 'Failed to reschedule');
        }
      } else if (status === 'Mark as Completed') {
        const response = await AuthPost(
          'appointment/completeAppointment',
          { appointmentId: id, reason },
          token
        );
        if (response?.data?.status === 'success') {
          Toast.show({ type: 'success', text1: 'Appointment marked completed' });
          fetchAppointments(pagination.current, pagination.pageSize);
          getAppointmentsCount();
        } else {
          Alert.alert('Error', response?.data?.message || 'Failed to complete appointment');
        }
      }
    } catch {
      Alert.alert('Error', 'An error occurred while processing the request');
    } finally {
      // Complete reset of all modal and action states
      resetAllModalStates();
    }
  };

  // Function to completely reset all modal states
  const resetAllModalStates = () => {
    setActionModalVisible(false);
    setActionMenuVisible(false);
    setSelectedAction('');
    setSelectedAppointmentId(null);
    setPatientDetails(null);
    setNewDate('');
    setNewTime('');
    setReason('');
    setAvailableTimeSlots([]);
    setShowRescheduleDatePicker(false);
    setShowRescheduleCalendar(false);
    setShowDatePicker(false);
    setButton(false);
  };

  const handleMenuPress = (appt: Appointment) => {
    // Reset any stale action modal before opening the menu to avoid “double popup”
    resetAllModalStates();

    setSelectedAppointmentId(appt.id);
    setPatientDetails(appt);
    setSelectedClinicId(appt.addressId || '');
    setActionMenuVisible(true);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.max(1, Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)));
    const next = Math.min(Math.max(1, newPage), totalPages);
    fetchAppointments(next, pagination.pageSize);
    setPagination((prev) => ({ ...prev, current: next }));
  };

  // ----- DATE RANGE (cards) handlers -----
const handleRangePickedAndroid = (kind: 'start' | 'end') => (
  event: any,
  selected?: Date
) => {
  if (event?.type === 'dismissed') {
    setWhichRangePicker(null);
    return;
  }
  
  const iso = moment(selected || new Date()).format('YYYY-MM-DD');
  
  if (kind === 'start') {
    if (endDate && moment(iso).isAfter(endDate)) {
    setStartDate(iso);
      setEndDate(iso); // Update end date to match start date
    } else {
      setStartDate(iso);
    }
  } else {
    if (startDate && moment(iso).isBefore(startDate)) {
      Toast.show({ 
        type: 'error', 
        text1: 'Invalid range', 
        text2: 'End date cannot be before start date' 
      });
      setWhichRangePicker(null);
      return;
    }
 
    setEndDate(iso);
  }
  
  setWhichRangePicker(null);
};

  // ----- iOS Calendar Handlers -----
  const openRangeCalendar = (type: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      setWhichRangePicker(type);
    } else {
      const currentDate = type === 'start' 
        ? moment(startDate, 'YYYY-MM-DD').toDate()
        : moment(endDate, 'YYYY-MM-DD').toDate();
      setRangeCalendarDate(currentDate);
      setRangeCalendarType(type);
      setShowRangeCalendar(true);
    }
  };

const handleRangeDateChangeIOS = (date: Date) => {
  const iso = moment(date).format('YYYY-MM-DD');

  if (rangeCalendarType === 'start') {
    // If start date is after current end date, update both dates to the new start date
    if (endDate && moment(iso).isAfter(endDate)) {
      setStartDate(iso);
      setEndDate(iso); // Update end date to match start date
    } else {
      setStartDate(iso);
    }
  } else if (rangeCalendarType === 'end') {
    // End date cannot be before start date
    if (startDate && moment(iso).isBefore(startDate)) {
      Toast.show({ 
        type: 'error', 
        text1: 'Invalid range', 
        text2: 'End date cannot be before start date' 
      });
      setShowRangeCalendar(false);
      setRangeCalendarType(null);
      return;
    }
    setEndDate(iso);
  }

  setShowRangeCalendar(false);
  setRangeCalendarType(null);
};

  const cancelRangeCalendarIOS = () => {
    setShowRangeCalendar(false);
    setRangeCalendarType(null);
  };

  const openFilterCalendar = () => {
    if (Platform.OS === 'android') {
      setShowFilterDatePicker(true);
    } else {
      const currentDate = filterDate ? moment(filterDate, 'YYYY-MM-DD').toDate() : new Date();
      setFilterCalendarDate(currentDate);
      setShowFilterCalendar(true);
    }
  };

  const handleFilterDateChangeIOS = (date: Date) => {
    setFilterDate(moment(date).format('YYYY-MM-DD'));
    setShowFilterCalendar(false);
  };

  const cancelFilterCalendarIOS = () => {
    setShowFilterCalendar(false);
  };

  const openRescheduleCalendar = () => {
    console.log('Opening reschedule calendar for platform:', Platform.OS);
    
    if (Platform.OS === 'android') {
      setShowRescheduleDatePicker(true);
    } else {
      // iOS - Use both the custom modal and native picker
      const currentDate = newDate ? moment(newDate, 'YYYY-MM-DD').toDate() : new Date();
      console.log('Setting reschedule calendar date:', currentDate);
      
      // Try custom picker first
      setRescheduleCalendarDate(currentDate);
      setShowRescheduleCalendar(true);
      
      // Also trigger native picker as backup
      setShowRescheduleDatePicker(true);
      
      console.log('Both iOS pickers triggered');
    }
  };

  const handleRescheduleDateChangeIOS = (date: Date) => {
    const iso = moment(date).format('YYYY-MM-DD');
    setNewDate(iso);
    setShowRescheduleCalendar(false);
  };

  const cancelRescheduleCalendarIOS = () => {
    setShowRescheduleCalendar(false);
  };

  const handleFilterDateChangeAndroid = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      setFilterDate(moment(selectedDate).format('YYYY-MM-DD'));
    }
  };

  const handleRescheduleDateChangeAndroid = (event: any, selectedDate?: Date) => {
    setShowRescheduleDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      const iso = moment(selectedDate).format('YYYY-MM-DD');
      setNewDate(iso);
    }
};

  const clearRange = () => {
    setStartDate(thisMonthStart);
    setEndDate(thisMonthEnd);
  };

  const formattedRangeLabel = useMemo(() => {
    const s = startDate ? moment(startDate).format('MMM D, YYYY') : '—';
    const e = endDate ? moment(endDate).format('MMM D, YYYY') : '—';
    return `${s} - ${e}`;
  }, [startDate, endDate]);

  // ----- Action menu: compute disables like web -----
  const computeDisables = (appt?: Appointment) => {
    if (!appt) {
      return {
        disablePrescription: true,
        disableViewPrev: true,
        disableComplete: true,
        disableReschedule: true,
        disableCancel: true,
      };
    }

    const status = (appt.status || '').toLowerCase();
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled' || status === 'canceled';
    const isPhysio = (appt.appointmentDepartment || '') === 'Physiotherapist';

    const isReceptionist = currentuserDetails?.role === 'receptionist';
    const isDoctor = currentuserDetails?.role === 'doctor';
    const canCreatePrescription = isDoctor || isReceptionist;

    const m = parseApptMoment(appt.rawDate, appt.appointmentTime);
    const disabledByTime = !m ? true : moment().isBefore(m.clone().subtract(1, 'hour'));

    const disablePrescription = !canCreatePrescription || isCompleted || isCancelled || isPhysio;
    const disableComplete = isCompleted || isCancelled || disabledByTime;
    const disableReschedule = isCompleted || isCancelled || !!hasPrescriptions[appt.id];
    const disableCancel = isCompleted || isCancelled;

    const hasPrev = !!hasPrescriptions[appt.id];
    const disableViewPrev = !hasPrev || isPhysio;

    return {
      disablePrescription,
      disableViewPrev,
      disableComplete,
      disableReschedule,
      disableCancel,
    };
  };

  const renderAppointmentCard = ({ item: appt }: { item: Appointment }) => {
    const statusKey = (appt.status || '').toLowerCase() as keyof typeof STATUS_COLORS;
    const statusSty = STATUS_COLORS[statusKey] || { bg: '#F3F4F6', fg: '#374151', label: appt.status || 'Unknown' };
    return (
      <View style={styles.apptCard}>

        {loader ? (
          <View style={styles.spinningContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <Text style={{ color: 'black' }}>Loading Appointments...</Text>
          </View>
        ) : (
          <>
            <View style={styles.cardRow}>
              <View style={styles.placeholderCircle}>
                <Text style={styles.placeholderText}>{(appt.patientName && appt.patientName[0] ? appt.patientName[0].toUpperCase() : "")}</Text>
              </View>
              
              <View style={styles.cardInfo}>
                <Text style={styles.name} numberOfLines={1}>{appt.patientName}</Text>
                <Text style={styles.id}>{appt.appointmentDepartment}</Text>
                <Text style={styles.id}>ID: {appt.id}</Text>

              </View>
              <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuPress(appt)}>
                <Text style={styles.menuButtonText}>⋯</Text>
              </TouchableOpacity>
            </View>

          </>

        )}

        <View style={[styles.cardRow, styles.bottomRow]}>
          <View style={[styles.tag, { backgroundColor: '#EFF6FF' }]}>
            <Text style={[styles.tagText, { color: '#3B82F6' }]}>
              {appt.type || 'General'}
            </Text>
          </View>

          <Text style={styles.date}>
            {appt.date} {appt.displayTime}
          </Text>

          <View style={[styles.status, { backgroundColor: statusSty.bg }]}>
            <Text style={[styles.statusText, { color: statusSty.fg }]}>{statusSty.label}</Text>
          </View>
        </View>

        <Modal
          visible={actionModalVisible && selectedAppointmentId === appt.id}
          transparent
          animationType="fade"
          onRequestClose={() => {
            // Complete cleanup on modal close
            resetAllModalStates();
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              // Complete cleanup on overlay press
              resetAllModalStates();
            }}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{selectedAction || 'Action'}</Text>

              {selectedAction === 'Cancel' && (
                <>
                  <Text style={styles.label}>Reason for cancellation</Text>
                  <TextInput
                    placeholder="Enter reason"
                    style={styles.input}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    placeholderTextColor={'gray'}
                  />
                </>
              )}

              {selectedAction === 'Reschedule' && (
                <>
                  <View style={styles.rescheduleInfoContainer}>
                    <Text style={styles.infoText}>Patient: {appt.patientName}</Text>
                    <Text style={styles.infoText}>Current Date: {formatWebDate(appt.rawDate)}</Text>
                    <Text style={styles.infoText}>Current Time: {format12h(appt.appointmentTime)}</Text>
                  </View>

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Select New Date:</Text>
                    <TouchableOpacity onPress={openRescheduleCalendar} style={styles.dateTimePickerButton}>
                      <View style={styles.dateTimePickerContent}>
                        <Text style={styles.dateTimePickerIcon}>📅</Text>
                        <Text style={styles.dateTimePickerText}>
                          {newDate ? moment(newDate).format('DD-MMM-YYYY') : 'Choose a date'}
                        </Text>
                        <Text style={styles.dateTimePickerArrow}>▶</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {Platform.OS === 'android' && showRescheduleDatePicker && (
                    <DateTimePicker
                      value={newDate ? new Date(newDate) : new Date()}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={handleRescheduleDateChangeAndroid}
                    />
                  )}

                  {/* iOS fallback native picker */}
                  {Platform.OS === 'ios' && showRescheduleDatePicker && (
                    <View style={styles.iosDatePickerContainer}>
                      <DateTimePicker
                        value={newDate ? new Date(newDate) : new Date()}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        onChange={(event, selectedDate) => {
                          setShowRescheduleDatePicker(false);
                          if (event.type === 'set' && selectedDate) {
                            const iso = moment(selectedDate).format('YYYY-MM-DD');
                            setNewDate(iso);
                          }
                        }}
                      />
                    </View>
                  )}

                  {availableTimeSlots.length > 0 ? (
                    <View style={styles.formSection}>
                      <Text style={styles.sectionLabel}>Select New Time:</Text>
                      <View style={styles.timeSlotContainer}>
                        <ScrollView 
                          horizontal={false} 
                          showsVerticalScrollIndicator={false}
                          style={styles.timeSlotScrollView}
                          contentContainerStyle={styles.timeSlotGrid}
                        >
                          {availableTimeSlots.map((slot) => {
                            const isSelected = newTime === slot.time;
                            return (
                              <TouchableOpacity
                                key={slot.time}
                                style={[
                                  styles.timeSlotButton,
                                  isSelected && styles.timeSlotButtonSelected
                                ]}
                                onPress={() => setNewTime(slot.time)}
                              >
                                <Text style={[
                                  styles.timeSlotText,
                                  isSelected && styles.timeSlotTextSelected
                                ]}>
                                  {format12h(slot.time)}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        {newTime && (
                          <View style={styles.selectedTimeIndicator}>
                            <Text style={styles.selectedTimeText}>✓ Selected: {format12h(newTime)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ) : (
                    newDate && (
                      <View style={styles.noSlotsContainer}>
                        <Text style={styles.noSlotsText}>⚠️ No available time slots for the selected date</Text>
                        <Text style={styles.noSlotsSubText}>Please select a different date</Text>
                      </View>
                    )
                  )}

                  <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Reason (optional)</Text>
                    <TextInput
                      placeholder="Enter reason for rescheduling"
                      style={styles.reasonInput}
                      value={reason}
                      onChangeText={setReason}
                      multiline
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </>
              )}

              {selectedAction === 'Mark as Completed' && (
                <Text style={styles.infoText}>
                  Are you sure you want to mark this appointment as completed?
                </Text>
              )}

              {selectedAction ? (
                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      // Complete modal cleanup
                      resetAllModalStates();
                    }}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.confirmButton, button && styles.disableButton]}
                    onPress={() => {
                      if (selectedAppointmentId) {
                        handleStatusChange(
                          selectedAppointmentId,
                          selectedAction,
                          appt._id,
                          appt.patientName ?? '',
                          appt.patientId ?? ''
                        );
                      }
                    }}
                    disabled={button}
                  >
                    <Text style={styles.buttonText}>Confirm</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </Pressable>
        </Modal>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <CommonHeader title="Appointments" />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>

          <View style={styles.rangeWrap}>
            <View style={styles.rangeControls}>
                <View style={styles.rangeRow}>
                  <TouchableOpacity
                    style={styles.rangeBtn}
                    onPress={() => openRangeCalendar('start')}
                  >
                    <Text style={styles.rangeBtnLabel}>Start</Text>
                    <Text style={styles.rangeBtnValue} numberOfLines={1}>
                      {moment(startDate).format('MMM D, YYYY')}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.rangeSeparator}>—</Text>

                  <TouchableOpacity
                    style={styles.rangeBtn}
                    onPress={() => openRangeCalendar('end')}
                  >
                    <Text style={styles.rangeBtnLabel}>End</Text>
                    <Text style={styles.rangeBtnValue} numberOfLines={1}>
                      {moment(endDate).format('MMM D, YYYY')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.clearBtn} onPress={clearRange}>
                    <Text style={styles.clearText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {Platform.OS === 'android' && whichRangePicker === 'start' && (
                <DateTimePicker
                  value={moment(startDate, 'YYYY-MM-DD').toDate()}
                  mode="date"
                  display="spinner"
                  onChange={handleRangePickedAndroid('start')}
                />
              )}
              {Platform.OS === 'android' && whichRangePicker === 'end' && (
                <DateTimePicker
                  value={moment(endDate, 'YYYY-MM-DD').toDate()}
                  mode="date"
                  display="spinner"
                  minimumDate={moment(startDate, 'YYYY-MM-DD').toDate()}
                  onChange={handleRangePickedAndroid('end')}
                />
              )}
            </View>

            <View style={styles.summaryContainer}>

              <View style={[styles.totalCard, { borderColor: '#FBBF24' }]}>
                <Text style={[styles.totalCardTitle, { color: '#FBBF24' }]}>{totalAppointmentsCount}</Text>
                <Text style={styles.totalCardLabel}>Total Appointments</Text>
              </View>

              <View style={styles.statusCardsRow}>
                <View style={[styles.statusCard, { borderColor: '#10B981' }]}>
                  <Text style={[styles.cardTitle, { color: '#10B981' }]}>{scheduledAppointmentsCount}</Text>
                  <Text style={styles.cardLabel}>Upcoming</Text>
                </View>
                <View style={[styles.statusCard, { borderColor: '#6366F1' }]}>
                  <Text style={[styles.cardTitle, { color: '#6366F1' }]}>{completedAppointmentsCount}</Text>
                  <Text style={styles.cardLabel}>Completed</Text>
                </View>
                <View style={[styles.statusCard, { borderColor: '#EF4444' }]}>
                  <Text style={[styles.cardTitle, { color: '#EF4444' }]}>{cancledAppointmentsCount}</Text>
                  <Text style={styles.cardLabel}>Cancelled</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search by Appointment ID or Patient Name"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.filterButton} onPress={() => setDropdownVisible(true)}>
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inlineFiltersRow}>

            <View style={styles.filterColumn}>
              <Text style={styles.filterLabel}>Type</Text>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setTypeDropdownVisible(true)}>
                <Text style={styles.selectBtnText} numberOfLines={1}>{selectedApptTypeLabel}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterColumn}>
              <Text style={styles.filterLabel}>Date</Text>
              <View style={styles.dateFilterRow}>
                <TouchableOpacity style={styles.dateBtn} onPress={openFilterCalendar}>
                  <Text style={styles.dateBtnText} numberOfLines={1}>
                    {filterDate ? moment(filterDate, 'YYYY-MM-DD').format('DD-MMM-YYYY') : 'DD-MMM-YYYY'}
                  </Text>
                </TouchableOpacity>
                {!!filterDate && (
                  <TouchableOpacity style={styles.clearDateBtn} onPress={() => setFilterDate('')}>
                    <Text style={styles.clearDateText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {Platform.OS === 'android' && showFilterDatePicker && (
                <DateTimePicker
                  value={filterDate ? moment(filterDate, 'YYYY-MM-DD').toDate() : new Date()}
                  mode="date"
                  display="spinner"
                  onChange={handleFilterDateChangeAndroid}
                />
              )}
            </View>
          </View>

          <Modal
            visible={typeDropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setTypeDropdownVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setTypeDropdownVisible(false)}>
              <View style={styles.dropdown}>
                {TYPE_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    style={styles.option}
                    onPress={() => {
                      setSelectedApptType(opt.value);
                      setTypeDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>

          <Modal
            visible={dropdownVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDropdownVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
              <View style={styles.dropdown}>
                {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
                  <Pressable
                    key={status}
                    style={styles.option}
                    onPress={() => {
                      setSelectedType(status);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>

          <Modal
            visible={actionMenuVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setActionMenuVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setActionMenuVisible(false)}>
              <View style={styles.dropdown}>
                {(() => {
                  const appt = patientDetails || undefined;
                  const dis = computeDisables(appt);

                  const MenuItem = ({
                    label,
                    disabled,
                    onPress,
                  }: {
                    label: string;
                    disabled?: boolean;
                    onPress: () => void;
                  }) => (
                    <Pressable
                      key={label}
                      style={[styles.option, disabled ? { opacity: 0.4 } : null]}
                      onPress={() => {
                        if (disabled) return;
                        onPress();
                      }}
                    >
                      <Text style={styles.optionText}>{label}</Text>
                    </Pressable>
                  );

                  if (!appt) {
                    return <Text style={{ padding: 10, color: '#000' }}>No appointment selected</Text>;
                  }

                  return (
                    <>

                      <MenuItem
                        label="Digital-Prescription"
                        disabled={dis.disablePrescription}
                        onPress={() => {
                          setActionMenuVisible(false);
                          handleStatusChange(appt.id, 'Prescription', appt._id, appt.patientName, appt.patientId);
                        }}
                      />
                      <MenuItem
                        label="View Previous Prescriptions"
                        disabled={dis.disableViewPrev}
                        onPress={() => {
                          setActionMenuVisible(false);
                          handleStatusChange(appt.id, 'View Previous Prescription', appt._id, appt.patientName, appt.patientId);
                        }}
                      />

                      <MenuItem
                        label="Mark as Completed"
                        disabled={dis.disableComplete}
                        onPress={() => {
                          setActionMenuVisible(false);
                          setSelectedAction('Mark as Completed');
                          setActionModalVisible(true);
                        }}
                      />
                      <MenuItem
                        label="Reschedule"
                        disabled={dis.disableReschedule}
                        onPress={() => {
                          setActionMenuVisible(false);
                          setSelectedAction('Reschedule');
                          setActionModalVisible(true);
                        }}
                      />
                      <MenuItem
                        label="Cancel"
                        disabled={dis.disableCancel}
                        onPress={() => {
                          setActionMenuVisible(false);
                          setSelectedAction('Cancel');
                          setActionModalVisible(true);
                        }}
                      />
                    </>
                  );
                })()}
              </View>
            </Pressable>
          </Modal>

          {loader ? (
            <View style={styles.spinningContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading Appointments...</Text>
            </View>
          ) : appointments?.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No Appointments Found</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={appointments}
                keyExtractor={(item) => item.id}
                renderItem={renderAppointmentCard}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
              />

              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => handlePageChange(pagination.current - 1)}
                  disabled={pagination.current === 1}
                  style={[
                    styles.paginationButton,
                    pagination.current === 1 && styles.disabledButton
                  ]}
                >
                  <Text style={[
                    styles.paginationText,
                    pagination.current === 1 && styles.disabledText
                  ]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <Text style={styles.paginationInfo}>
                  Page {pagination.current} of{' '}
                  {Math.max(1, Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)))}
                </Text>

                <TouchableOpacity
                  onPress={() => handlePageChange(pagination.current + 1)}
                  disabled={
                    pagination.current >=
                    Math.ceil((pagination.total || 1) / (pagination.pageSize || 1))
                  }
                  style={[
                    styles.paginationButton,
                    pagination.current >= Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)) && styles.disabledButton
                  ]}
                >
                  <Text style={[
                    styles.paginationText,
                    pagination.current >= Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)) && styles.disabledText
                  ]}>
                    Next
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {Platform.OS === 'ios' && (
        <>

          <IOSCalendarPicker
            visible={showRangeCalendar}
            currentDate={rangeCalendarDate}
            onConfirm={handleRangeDateChangeIOS}
            onCancel={cancelRangeCalendarIOS}
            title={rangeCalendarType === 'start' ? 'Select Start Date' : 'Select End Date'}
            mode="date"
          />

          <IOSCalendarPicker
            visible={showFilterCalendar}
            currentDate={filterCalendarDate}
            onConfirm={handleFilterDateChangeIOS}
            onCancel={cancelFilterCalendarIOS}
            title="Select Filter Date"
            mode="date"
          />

          <IOSCalendarPicker
            visible={showRescheduleCalendar}
            currentDate={rescheduleCalendarDate}
            onConfirm={handleRescheduleDateChangeIOS}
            onCancel={cancelRescheduleCalendarIOS}
            title="Select Reschedule Date"
            mode="date"
            minDate={new Date()}
          />
          
          {/* Debug info for iOS calendar */}
          {Platform.OS === 'ios' && console.log('iOS Calendar state:', {
            showRescheduleCalendar,
            rescheduleCalendarDate,
            newDate
          })}
        </>
      )}
    </KeyboardAvoidingView>
  );
};

export default AppointmentsScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  placeholderCircle: {
    width: moderateScale(isTablet ? 60 : 50),
    height: moderateScale(isTablet ? 60 : 50),
    borderRadius: moderateScale(25),
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  placeholderText: {
    fontSize: moderateScale(isTablet ? 28 : 22),
    fontWeight: 'bold',
    color: '#fff',
  },
  rangeWrap: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: '#fff',
    ...LAYOUT.shadow.sm,
  },
  rangeHeader: {
    marginBottom: SPACING.md,
  },
  rangeTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  rangeControls: {
    marginBottom: SPACING.sm,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.xs,
    backgroundColor: '#fff',
    minHeight: moderateScale(50),
    justifyContent: 'center',
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
  rangeSeparator: {
    marginHorizontal: SPACING.xs,
    color: '#6b7280',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  clearBtn: {
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(44),
  },
  clearText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  summaryContainer: {
    marginBottom: SPACING.lg,
  },
  totalCard: {
    borderWidth: 2,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  totalCardTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxxl : FONT_SIZE.xxl),
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  totalCardLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    textAlign: 'center',
  },
  statusCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  statusCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  cardTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    marginBottom: SPACING.xxs,
  },
  cardLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  searchInput: {
    flex: 1,
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: 'black',
    ...LAYOUT.shadow.sm,
  },
  filterButton: {
    paddingHorizontal: SPACING.lg,
    height: moderateScale(45),
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  inlineFiltersRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  filterColumn: {
    flex: 1,
  },
  filterLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#111827',
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    height: moderateScale(44),
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fff',
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  selectBtnText: {
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fff',
    height: moderateScale(44),
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  dateBtnText: {
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  clearDateBtn: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#EEF2FF',
    minWidth: moderateScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    height: moderateScale(44),
  },
  clearDateText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  apptCard: {
    backgroundColor: '#fff',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    marginTop: SPACING.sm,
  },
  cardInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#111827',
    marginBottom: SPACING.xxs,
  },
  id: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.md,
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  tagText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#3B82F6',
    fontWeight: '500',
  },
  date: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#4B5563',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  status: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.pill,
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  statusText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
  },
  menuButton: {
    padding: SPACING.xs,
    backgroundColor: '#ffffffff',
    borderRadius: LAYOUT.borderRadius.sm,
    minWidth: moderateScale(36),
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: moderateScale(500),
    backgroundColor: '#fff',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.lg,
  },
  modalTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
    minHeight: moderateScale(80),
  },
  label: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
    color: '#444',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  datePickerButton: {
    padding: SPACING.md,
    backgroundColor: '#f0f0f0',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
  },
  datePickerText: {
    color: '#333',
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.md,
    backgroundColor: '#fff',
  },
  picker: {
    height: moderateScale(150),
    color: '#333',
  },
  infoText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#555',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  disableButton: {
    backgroundColor: '#555',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  dropdown: {
    width: responsiveWidth(80),
    maxWidth: moderateScale(300),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...LAYOUT.shadow.md,
  },
  option: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  optionText: {
    color: '#000',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  spinningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.md),
    marginTop: SPACING.md,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(10),
  },
  emptyText: {
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  listContent: {
    paddingBottom: SPACING.sm,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom,
  },
  paginationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    backgroundColor: '#3b82f6',
    borderRadius: LAYOUT.borderRadius.md,
    minWidth: moderateScale(80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  paginationText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  disabledText: {
    color: '#9ca3af',
  },
  paginationInfo: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
  // New styles for improved date/time picker UI
  rescheduleInfoContainer: {
    backgroundColor: '#F8FAFC',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  formSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: SPACING.sm,
  },
  dateTimePickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#fff',
    minHeight: moderateScale(56),
    justifyContent: 'center',
    ...LAYOUT.shadow.sm,
  },
  dateTimePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  dateTimePickerIcon: {
    fontSize: responsiveText(FONT_SIZE.lg),
    marginRight: SPACING.md,
  },
  dateTimePickerText: {
    flex: 1,
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#374151',
    fontWeight: '500',
  },
  dateTimePickerArrow: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#9CA3AF',
    transform: [{ rotate: '90deg' }],
  },
  timePickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#fff',
    ...LAYOUT.shadow.sm,
  },
  pickerItem: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#374151',
  },
  selectedTimeIndicator: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedTimeText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#3B82F6',
    fontWeight: '600',
  },
  noSlotsContainer: {
    backgroundColor: '#FEF3CD',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    marginVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  noSlotsText: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  noSlotsSubText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#A16207',
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#374151',
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    ...LAYOUT.shadow.sm,
  },
  // Time slot picker styles
  timeSlotContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: LAYOUT.borderRadius.lg,
    backgroundColor: '#fff',
    ...LAYOUT.shadow.sm,
  },
  timeSlotScrollView: {
    maxHeight: moderateScale(200),
    padding: SPACING.sm,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  timeSlotButton: {
    minWidth: moderateScale(85),
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  timeSlotButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#2563EB',
    ...LAYOUT.shadow.sm,
  },
  timeSlotText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#374151',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  iosDatePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    marginVertical: SPACING.md,
    padding: SPACING.md,
    ...LAYOUT.shadow.md,
  },
});