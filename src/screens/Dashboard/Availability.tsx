import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { AuthPost, AuthFetch, AuthPut, authdelete } from '../../auth/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

// Import responsive utilities
import {
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
import { CalendarIcon, DropdownIcon } from '../../utility/SvgIcons';

// Define interfaces for type safety
interface Clinic {
  label: string;
  value: string;
  addressData: {
    clinicName: string;
    addressId: string;
    status: string;
  };
}

interface Slot {
  time: string;
  available: boolean;
  id: string;
  originalTime: string;
  reason?: string;
}

interface UserDetails {
  role: string;
  userId: string;
  createdBy: string;
}

const AvailabilityScreen: React.FC = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser) as UserDetails;
  const doctorId = currentuserDetails?.role === 'doctor' ? currentuserDetails?.userId : currentuserDetails?.createdBy;
  const navigation = useNavigation<any>();

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('Clinic Availability');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [duration, setDuration] = useState<string>('15 mins');
  const [fromDate, setFromDate] = useState<Date>(new Date()); // Initialize as Date
  const [toDate, setToDate] = useState<Date>(new Date()); // Initialize as Date
  const [whichPicker, setWhichPicker] = useState<'from' | 'to' | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<string>(moment().format('ddd')); // e.g., "Mon"
  const [startTime, setStartTime] = useState<string>('09');
  const [endTime, setEndTime] = useState<string>('11');
  const [startPeriod, setStartPeriod] = useState<string>('AM');
  const [endPeriod, setEndPeriod] = useState<string>('PM');
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [unAvailableSlots, setUnAvailableSlots] = useState<Slot[]>([]);
  const [unavailableStartTime, setUnavailableStartTime] = useState<number>(9);
  const [unavailableStartPeriod, setUnavailableStartPeriod] = useState<string>('AM');
  const [unavailableEndTime, setUnavailableEndTime] = useState<number>(11);
  const [unavailableEndPeriod, setUnavailableEndPeriod] = useState<string>('PM');
  const [isAddingSlots, setIsAddingSlots] = useState<boolean>(false);
  const [isDeletingSlots, setIsDeletingSlots] = useState<boolean>(false);
  const [isClinicModalVisible, setIsClinicModalVisible] = useState<boolean>(false);
  const [isDurationModalVisible, setIsDurationModalVisible] = useState<boolean>(false);
  const [showEndTimeAs1159, setShowEndTimeAs1159] = useState<boolean>(false);
  const [selectedDaysForSlots, setSelectedDaysForSlots] = useState<string[]>([]); // Independent day selection for time section
  
  // Calendar States
  const [showFromCalendar, setShowFromCalendar] = useState<boolean>(false);
  const [showToCalendar, setShowToCalendar] = useState<boolean>(false);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarType, setCalendarType] = useState<'from' | 'to'>('from');

  // ── NEW: View by Date Range states ──────────────────────────────────────────
  const [viewRangeFrom, setViewRangeFrom] = useState<Date | null>(null);
  const [viewRangeTo, setViewRangeTo] = useState<Date | null>(null);
  const [viewDaysInRange, setViewDaysInRange] = useState<{ date: string; dayName: string; displayDate: string }[]>([]);
  const [selectedViewDay, setSelectedViewDay] = useState<string | null>(null);
  const [slotsForViewRange, setSlotsForViewRange] = useState<{ [date: string]: { availableSlots: Slot[]; unavailableSlots: Slot[] } }>({});
  const [showViewRangeFromPicker, setShowViewRangeFromPicker] = useState<boolean>(false);
  const [showViewRangeFromCalendar, setShowViewRangeFromCalendar] = useState<boolean>(false);
  const [showViewRangeToPicker, setShowViewRangeToPicker] = useState<boolean>(false);
  const [showViewRangeToCalendar, setShowViewRangeToCalendar] = useState<boolean>(false);
  const [viewRangeCalendarDate, setViewRangeCalendarDate] = useState<Date>(new Date());
  const [viewRangeCalendarType, setViewRangeCalendarType] = useState<'from' | 'to'>('from');

  // ── NEW: Delete Selected Slots (single date) states ─────────────────────────
  const [singleDateDeleteModal, setSingleDateDeleteModal] = useState<boolean>(false);
  const [singleDateDeleteDate, setSingleDateDeleteDate] = useState<Date | null>(null);
  const [singleDateDeleteSlots, setSingleDateDeleteSlots] = useState<string[]>([]);
  const [singleDateAvailableSlots, setSingleDateAvailableSlots] = useState<Slot[]>([]);
  const [selectAllSlots, setSelectAllSlots] = useState<boolean>(false);
  const [showSingleDatePicker, setShowSingleDatePicker] = useState<boolean>(false);
  const [showSingleDateCalendar, setShowSingleDateCalendar] = useState<boolean>(false);
  const [singleDateCalendarDate, setSingleDateCalendarDate] = useState<Date>(new Date());

  // ── NEW: Delete by Date Range states ────────────────────────────────────────
  const [deleteRangeModal, setDeleteRangeModal] = useState<boolean>(false);
  const [deleteRangeFrom, setDeleteRangeFrom] = useState<Date | null>(null);
  const [deleteRangeTo, setDeleteRangeTo] = useState<Date | null>(null);
  const [deleteWeeksInRange, setDeleteWeeksInRange] = useState<{ date: string; dayName: string; displayDate: string }[]>([]);
  const [deleteSelectedDates, setDeleteSelectedDates] = useState<string[]>([]);
  const [deleteSelectedSlots, setDeleteSelectedSlots] = useState<string[]>([]);
  const [deleteRangeSlotsData, setDeleteRangeSlotsData] = useState<{ [date: string]: Slot[] }>({});
  const [isDeletingRange, setIsDeletingRange] = useState<boolean>(false);
  const [showDeleteRangeFromPicker, setShowDeleteRangeFromPicker] = useState<boolean>(false);
  const [showDeleteRangeFromCalendar, setShowDeleteRangeFromCalendar] = useState<boolean>(false);
  const [showDeleteRangeToPicker, setShowDeleteRangeToPicker] = useState<boolean>(false);
  const [showDeleteRangeToCalendar, setShowDeleteRangeToCalendar] = useState<boolean>(false);
  const [deleteRangeCalendarDate, setDeleteRangeCalendarDate] = useState<Date>(new Date());
  const [deleteRangeCalendarType, setDeleteRangeCalendarType] = useState<'from' | 'to'>('from');
  // ── Show delete sub-menu ─────────────────────────────────────────────────────
  const [showDeleteMenu, setShowDeleteMenu] = useState<boolean>(false);

  const fullToShortMap: { [key: string]: string } = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayFullName = moment().format('dddd');
  const todayShortName = fullToShortMap[todayFullName];
  const startIndex = weekdays.indexOf(todayShortName);
  const orderedDays = [...weekdays.slice(startIndex), ...weekdays.slice(0, startIndex)];
  const getMinimumStartTime = (): number => {
    if (!moment(fromDate).isSame(moment(), 'day')) {
      return 1; // Minimum is 1 AM for future dates
    }

    const currentHour = moment().hour();
    const current12Hour = currentHour > 12 ? currentHour - 12 : currentHour;
    return current12Hour === 0 ? 12 : current12Hour; // Convert to 12-hour format
  };
  const adjustTime = (type: 'start' | 'end', direction: 'up' | 'down', section: 'available' | 'unavailable') => {
    const isToday = moment(fromDate).isSame(moment(), 'day');
    if (section === 'available') {
      if (type === 'start') {
        setStartTime((prev) => {
          const prevNum = parseInt(prev, 10);
          if (isToday && direction === 'down') {
            const currentHour = moment().hour();
            const current12Hour = currentHour > 12 ? currentHour - 12 : currentHour;
            const current12HourFormatted = current12Hour === 0 ? 12 : current12Hour;

            // Don't allow going below current hour for today
            if (prevNum <= current12HourFormatted) {
              return prev; // Keep current value
            }
          }
          const newNum = direction === 'up' ? (prevNum === 12 ? 1 : prevNum + 1) : (prevNum === 1 ? 12 : prevNum - 1);
          return newNum.toString().padStart(2, '0');
        });
      } else {
        if (showEndTimeAs1159) {
          if (direction === 'down') {
            setShowEndTimeAs1159(false);
            setEndTime('11');
            setEndPeriod('PM');
          }
          return;
        } else {
          setEndTime((prev) => {
            const prevNum = parseInt(prev, 10);
            if (direction === 'up') {
              if (prevNum === 11 && endPeriod === 'PM') {
                setShowEndTimeAs1159(true);
                return '11'; // Keep the value as 11 but we'll display it differently
              }
              const newNum = prevNum === 12 ? 1 : prevNum + 1;
              return newNum.toString().padStart(2, '0');
            } else {
              const newNum = prevNum === 1 ? 12 : prevNum - 1;
              return newNum.toString().padStart(2, '0');
            }
          });
        }
      }
    } else {
      if (type === 'start') {
        setUnavailableStartTime((prev) => (direction === 'up' ? (prev === 12 ? 1 : prev + 1) : (prev === 1 ? 12 : prev - 1)));
      } else {
        setUnavailableEndTime((prev) => (direction === 'up' ? (prev === 12 ? 1 : prev + 1) : (prev === 1 ? 12 : prev - 1)));
      }
    }
  };

  const convertTo24Hour = (hour: string, period: string): string => {
    let h = parseInt(hour);
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h < 12) h += 12;
    return h.toString().padStart(2, '0') + ':00';
  };

  const start24 = convertTo24Hour(startTime, startPeriod);
  const end24 = showEndTimeAs1159 && endPeriod === 'PM'
    ? '23:59'
    : convertTo24Hour(endTime, endPeriod);

  // Check if end time is after start time
  const isEndTimeValid = () => {
    const startMinutes = moment(start24, 'HH:mm').minutes() + moment(start24, 'HH:mm').hours() * 60;
    const endMinutes = moment(end24, 'HH:mm').minutes() + moment(end24, 'HH:mm').hours() * 60;
    return endMinutes > startMinutes;
  };

  const durations = ['10 mins', '15 mins', '30 mins', '60 mins'];

  const fetchClinicsForDoctor = async (doctorId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response: any = await AuthFetch(`users/getClinicAddress?doctorId=${doctorId}`, token);
      if (response.status === 'success') {
        const activeClinics: Clinic[] = response?.data?.data
          .filter((address: any) => address.status === 'Active')
          .map((address: any) => ({
            label: address.clinicName,
            value: address.addressId,
            addressData: address,
          }));
        setClinics(activeClinics.reverse());
        if (activeClinics.length > 0) {
          setSelectedClinic(activeClinics[0].value);
        } else {
          setSelectedClinic('');
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'No active clinics available',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch clinics');
      }
    } catch (error: any) {

      Alert.alert('Error', error?.message || 'Failed to fetch clinic data. Please try again.');
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchClinicsForDoctor(doctorId);
    }
  }, [doctorId]);

  const fetchSlotsForDate = async (date: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response :any = await AuthFetch(
        `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${date}&addressId=${selectedClinic}`,
        token
      );
      if (response.status !== 'success') {
        setUnAvailableSlots([]);
        setAvailableSlots([]);
      } else {
        const slotsData = response.data.data;
        const available: Slot[] = [];
        const unavailable: Slot[] = [];
        if (slotsData?.slots && Array.isArray(slotsData.slots)) {
          slotsData.slots.forEach((slot: any) => {
            const timeStr = moment(slot.time, 'HH:mm').format('hh:mm A');
            if (slot.status === 'available') {
              available.push({
                time: timeStr,
                available: true,
                id: slot._id,
                originalTime: slot.time,
              });
            } else {
              unavailable.push({
                time: timeStr,
                available: false,
                id: slot._id,
                reason: slot.reason || 'Not available',
                originalTime: slot.time,
              });
            }
          });
        }
        setAvailableSlots(available);
        setUnAvailableSlots(unavailable);
      }
    } catch (err :any) {
      const errorMessage = err?.message || 'Please Retry';
      Alert.alert('Error', errorMessage);

    }
  };

  useEffect(() => {
    if (moment(fromDate).isSame(moment(), 'day')) {
      const currentHour = moment().hour();
      const current12Hour = currentHour > 12 ? currentHour - 12 : currentHour;
      const formattedHour = (current12Hour === 0 ? 12 : current12Hour).toString().padStart(2, '0');
      setStartTime(formattedHour);

      // Also set appropriate period
      setStartPeriod(currentHour >= 12 ? 'PM' : 'AM');
    }
  }, [fromDate]);

  useEffect(() => {
    const date = new Date().toISOString().split('T')[0];
    if (doctorId && selectedClinic) {
      if (fromDate) {
        fetchSlotsForDate(dayjs(fromDate).format('YYYY-MM-DD'));
      } else {
        fetchSlotsForDate(date);
      }
    }
  }, [fromDate, doctorId, selectedClinic]);

  // ── NEW: Generate dates in range helper ──────────────────────────────────────
  const generateDatesInRange = (startDate: Date, endDate: Date) => {
    const dates: { date: string; dayName: string; displayDate: string }[] = [];
    let current = moment(startDate);
    const end = moment(endDate);
    while (current.isSameOrBefore(end, 'day')) {
      dates.push({
        date: current.format('YYYY-MM-DD'),
        dayName: current.format('dddd'),
        displayDate: current.format('DD MMM'),
      });
      current = current.clone().add(1, 'day');
    }
    return dates;
  };

  // ── NEW: Fetch slots for a single view-range date ────────────────────────────
  const fetchSlotsForViewDate = async (date: string) => {
    try {
      if (!doctorId || !selectedClinic) return;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response: any = await AuthFetch(
        `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${date}&addressId=${selectedClinic}`,
        token
      );
      if (response?.status === 'success') {
        const slotsData = response?.data?.data;
        const available: Slot[] = [];
        const unavailable: Slot[] = [];
        if (slotsData?.slots && Array.isArray(slotsData.slots)) {
          slotsData.slots.forEach((slot: any) => {
            const timeStr = moment(slot.time, 'HH:mm').format('hh:mm A');
            if (slot.status === 'available') {
              available.push({ time: timeStr, available: true, id: slot._id, originalTime: slot.time });
            } else {
              unavailable.push({ time: timeStr, available: false, id: slot._id, reason: slot.reason || 'Not available', originalTime: slot.time });
            }
          });
        }
        setSlotsForViewRange(prev => ({ ...prev, [date]: { availableSlots: available, unavailableSlots: unavailable } }));
      } else {
        setSlotsForViewRange(prev => ({ ...prev, [date]: { availableSlots: [], unavailableSlots: [] } }));
      }
    } catch {
      setSlotsForViewRange(prev => ({ ...prev, [date]: { availableSlots: [], unavailableSlots: [] } }));
    }
  };

  // ── NEW: View range effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (viewRangeFrom && viewRangeTo) {
      const dates = generateDatesInRange(viewRangeFrom, viewRangeTo);
      setViewDaysInRange(dates);
      if (dates.length > 0) {
        const first = dates[0].date;
        setSelectedViewDay(first);
        fetchSlotsForViewDate(first);
      }
    } else {
      setViewDaysInRange([]);
      setSlotsForViewRange({});
      setSelectedViewDay(null);
    }
  }, [viewRangeFrom, viewRangeTo]);

  useEffect(() => {
    if (selectedViewDay && doctorId && selectedClinic) {
      fetchSlotsForViewDate(selectedViewDay);
    }
  }, [selectedViewDay, doctorId, selectedClinic]);

  // ── NEW: Fetch slots for delete date range ───────────────────────────────────
  const fetchSlotsForDateRange = async (dates: { date: string; dayName: string; displayDate: string }[]) => {
    try {
      if (!doctorId || !selectedClinic) return;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const slotsData: { [date: string]: Slot[] } = {};
      for (const day of dates) {
        try {
          const response: any = await AuthFetch(
            `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${day.date}&addressId=${selectedClinic}`,
            token
          );
          if (response?.status === 'success') {
            const slots = response?.data?.data?.slots || [];
            slotsData[day.date] = slots
              .filter((s: any) => s.status === 'available')
              .map((s: any) => ({
                time: moment(s.time, 'HH:mm').format('hh:mm A'),
                originalTime: s.time,
                id: s._id,
                available: true,
              }));
          } else {
            slotsData[day.date] = [];
          }
        } catch {
          slotsData[day.date] = [];
        }
      }
      setDeleteRangeSlotsData(slotsData);
    } catch (error) {
      console.error('Error fetching slots for date range:', error);
    }
  };

  // ── NEW: Delete range effect ─────────────────────────────────────────────────
  useEffect(() => {
    if (deleteRangeFrom && deleteRangeTo) {
      const dates = generateDatesInRange(deleteRangeFrom, deleteRangeTo);
      setDeleteWeeksInRange(dates);
      setDeleteSelectedDates(dates.map(d => d.date));
      fetchSlotsForDateRange(dates);
    } else {
      setDeleteWeeksInRange([]);
      setDeleteSelectedDates([]);
      setDeleteRangeSlotsData({});
    }
  }, [deleteRangeFrom, deleteRangeTo]);

  // ── NEW: Get all unique slot times from selected delete dates ────────────────
  const getAllUniqueSlotTimes = (): Slot[] => {
    if (!deleteSelectedDates.length || !Object.keys(deleteRangeSlotsData).length) return [];
    const uniqueSlotMap = new Map<string, Slot>();
    deleteSelectedDates.forEach(date => {
      const slots = deleteRangeSlotsData[date] || [];
      slots.forEach(slot => {
        if (!uniqueSlotMap.has(slot.originalTime)) {
          uniqueSlotMap.set(slot.originalTime, slot);
        }
      });
    });
    return Array.from(uniqueSlotMap.values()).sort((a, b) => {
      return moment(a.originalTime, 'HH:mm').diff(moment(b.originalTime, 'HH:mm'));
    });
  };

  // ── NEW: Fetch slots for single date delete modal ────────────────────────────
  const fetchSlotsForDeleteModal = async (date: string) => {
    try {
      if (!doctorId || !selectedClinic) return;
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response: any = await AuthFetch(
        `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${date}&addressId=${selectedClinic}`,
        token
      );
      if (response?.status === 'success') {
        const slotsData = response?.data?.data;
        const available: Slot[] = [];
        if (slotsData?.slots && Array.isArray(slotsData.slots)) {
          slotsData.slots.forEach((slot: any) => {
            if (slot.status === 'available') {
              available.push({
                time: moment(slot.time, 'HH:mm').format('hh:mm A'),
                originalTime: slot.time,
                id: slot._id,
                available: true,
              });
            }
          });
        }
        setSingleDateAvailableSlots(available);
      } else {
        setSingleDateAvailableSlots([]);
      }
    } catch {
      setSingleDateAvailableSlots([]);
    }
  };

  // ── NEW: Handle single date slot delete ──────────────────────────────────────
  const handleSingleDateDelete = async () => {
    if (!singleDateDeleteDate || singleDateDeleteSlots.length === 0) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select at least one slot to delete', position: 'top', visibilityTime: 3000 });
      return;
    }
    try {
      setIsDeletingSlots(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const dateStr = dayjs(singleDateDeleteDate).format('YYYY-MM-DD');
      const payload = {
        doctorId,
        addressId: selectedClinic,
        date: dateStr,
        slotTimes: singleDateDeleteSlots,
      };
      const res: any = await authdelete(
        `appointment/deleteDoctorSlots?doctorId=${doctorId}&addressId=${selectedClinic}&date=${dateStr}`,
        payload,
        token
      );
      console.log("111",res)
      if (res.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Slots deleted successfully', position: 'top', visibilityTime: 3000 });
        setSingleDateDeleteModal(false);
        setSingleDateDeleteDate(null);
        setSingleDateDeleteSlots([]);
        setSingleDateAvailableSlots([]);
        setSelectAllSlots(false);
        await fetchSlotsForDate(dayjs(fromDate).format('YYYY-MM-DD'));
        if (viewRangeFrom && viewRangeTo && selectedViewDay) {
          await fetchSlotsForViewDate(selectedViewDay);
        }
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please Retry', position: 'top', visibilityTime: 3000 });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Error deleting slots', position: 'top', visibilityTime: 3000 });
    } finally {
      setIsDeletingSlots(false);
    }
  };

  // ── NEW: Handle delete date range ────────────────────────────────────────────
  const handleDeleteDateRange = async () => {
    if (!deleteRangeFrom || !deleteRangeTo) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select a valid date range', position: 'top', visibilityTime: 3000 });
      return;
    }
    if (deleteSelectedDates.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select at least one date',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    if (deleteSelectedSlots.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select at least one slot',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }
    try {
      setIsDeletingRange(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const payload: any = {
        doctorId,
        addressId: selectedClinic,
        dates: deleteSelectedDates,
        slotTimes: deleteSelectedSlots.length > 0 ? deleteSelectedSlots : [],
      };
      const res: any = await authdelete(
        `appointment/deleteDoctorSlots`,
        payload,
        token
      );
      console.log("222payload",payload)
      console.log("222",res)
      if (res.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: res.message || 'Slots deleted successfully', position: 'top', visibilityTime: 3000 });
        setDeleteRangeModal(false);
        setDeleteRangeFrom(null);
        setDeleteRangeTo(null);
        setDeleteSelectedDates([]);
        setDeleteSelectedSlots([]);
        setDeleteWeeksInRange([]);
        await fetchSlotsForDate(dayjs(fromDate).format('YYYY-MM-DD'));
        if (viewRangeFrom && viewRangeTo) {
          const datesInRange = generateDatesInRange(viewRangeFrom, viewRangeTo);
          for (const day of datesInRange) {
            await fetchSlotsForViewDate(day.date);
          }
          if (selectedViewDay) {
            await fetchSlotsForViewDate(selectedViewDay);
          }
        }
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Please Retry', position: 'top', visibilityTime: 3000 });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error?.message || 'Error deleting slots for date range', position: 'top', visibilityTime: 3000 });
    } finally {
      setIsDeletingRange(false);
    }
  };

  const generateTimeSlots = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
        //show alert after 3 seconds navigate to login screen
        Alert.alert('Error', 'Authentication token missing. Please login ');
        setTimeout(() => {
          navigation.navigate('Authloader');
        }, 3000);
        return;
      }

    if (!isEndTimeValid()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'End time must be after start time',
        position: 'top',
        visibilityTime: 3000,
      });
      return;
    }

    setIsAddingSlots(true);
    try {
      const startDateObj = dayjs(fromDate);
      const endDateObj = dayjs(toDate);

      const getDateRangeArray = (fromDate: string, toDate: string): string[] => {
        const dates: string[] = [];
        const start = moment(fromDate, 'YYYY-MM-DD');
        const end = moment(toDate, 'YYYY-MM-DD');
        if (end.isAfter(start)) {
          let currentDate = start.clone();
          while (currentDate.isSameOrBefore(end)) {
            dates.push(currentDate.format('YYYY-MM-DD'));
            currentDate.add(1, 'days');
          }
        } else {
          dates.push(start.format('YYYY-MM-DD'));
        }
        return dates;
      };

      const startDate = dayjs(fromDate).format('YYYY-MM-DD');
      const endDate = dayjs(toDate).format('YYYY-MM-DD');
      let selectedDates = fromDate && endDate ? getDateRangeArray(startDate, endDate) : [startDate];

      // Filter dates by selected days if any days are selected
      if (selectedDaysForSlots.length > 0) {
        selectedDates = selectedDates.filter(date => {
          const dayShort = moment(date, 'YYYY-MM-DD').format('ddd');
          return selectedDaysForSlots.includes(dayShort);
        });
      }

      const start24 = convertTo24Hour(startTime, startPeriod);
      const end24 = showEndTimeAs1159 && endPeriod === 'PM'
        ? '23:59'
        : convertTo24Hour(endTime, endPeriod);
    
      const payload = {
        doctorId,
        dates: selectedDates,
        startTime: start24,
        endTime: end24,
        interval: parseInt(duration),
        isAvailable: true,
        addressId: selectedClinic,
      };
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response :any = await AuthPost('appointment/createSlotsForDoctor', payload, token);

      if (response?.data && response?.data?.status === 'success') {
        // Always refresh the slots after a successful API call
        await fetchSlotsForDate(dayjs(fromDate).format('YYYY-MM-DD'));

        // Check if these properties exist before accessing them
        const overlap = response?.data?.results?.[0]?.reason;
        const clinicname = response?.data?.results?.[0]?.overlaps?.[0]?.clinic;

        // Only show success toast if there are no overlaps
        if (!overlap) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Slots Added Successfully',
            position: 'top',
            visibilityTime: 3000,
          });
        }

        if (overlap && clinicname) {
          Alert.alert(overlap, `Clinic Name: ${clinicname}`);
        }else if (overlap) {
          Alert.alert('overlap', overlap);
        }
      } else {
        const errorMessage = response?.data?.message || response?.message || 'Please Retry';
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 3000,
        });

      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Please Retry';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setIsAddingSlots(false);
    }
  };
  const generateUnavailableTimeSlots = async () => {
    try {
      const startTime = moment(`${unavailableStartTime}:00 ${unavailableStartPeriod}`, 'hh:mm A').format('HH:mm');
      const endTime = moment(`${unavailableEndTime}:00 ${unavailableEndPeriod}`, 'hh:mm A').format('HH:mm');

      const getUnavailableTimeSlots = (start: string, end: string, interval: number): string[] => {
        const slots: string[] = [];
        let current = moment(start, 'HH:mm');
        const endMoment = moment(end, 'HH:mm');
        while (current.isBefore(endMoment)) {
          slots.push(current.format('HH:mm'));
          current.add(interval, 'minutes');
        }
        return slots;
      };

      const slotsToMarkUnavailable: string[] = getUnavailableTimeSlots(startTime, endTime, parseInt(duration));
      const existingUnavailableTimes: string[] = unAvailableSlots.map((slot: Slot) => slot.originalTime);
      const newSlotsToMark: string[] = slotsToMarkUnavailable.filter((time) => !existingUnavailableTimes.includes(time));

      if (newSlotsToMark.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Info',
          text2: 'All selected slots are already marked as unavailable',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      const overlappingAvailableSlots = availableSlots.filter((slot: Slot) => newSlotsToMark.includes(slot.originalTime));
      const newUnavailableSlots: Slot[] = [
        ...unAvailableSlots,
        ...newSlotsToMark
          .filter((time) => !availableSlots.some((slot: Slot) => slot.originalTime === time))
          .map((time) => ({
            time: moment(time, 'HH:mm').format('hh:mm A'),
            available: false,
            id: `temp-${Date.now()}-${time}`,
            reason: 'Not available',
            originalTime: time,
          })),
      ];

      if (overlappingAvailableSlots.length > 0) {
        overlappingAvailableSlots.forEach((slot: Slot) => {
          newUnavailableSlots.push({
            ...slot,
            available: false,
            reason: 'Not available',
          });
        });
      }

      const updatedAvailableSlots = availableSlots.filter((slot: Slot) => !newSlotsToMark.includes(slot.originalTime));
      setAvailableSlots(updatedAvailableSlots);
      setUnAvailableSlots(newUnavailableSlots);

      const payload = {
        doctorId,
        date: dayjs(fromDate).format('YYYY-MM-DD'),
        timeSlots: newUnavailableSlots.map((slot: Slot) => slot.originalTime),
        addressId: selectedClinic,
      };
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response :any = await AuthPut('appointment/updateDoctorSlots', payload, token);

      if (response.data && response.data.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Unavailable slots updated successfully',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        throw new Error(response.data?.message || 'Failed to update slots');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update unavailable slots. Please try again.');
    }
  };

  const toggleSlotSelection = (time: string) => {
    setSelectedSlots((prev) => (prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]));
  };

  const handleDeleteSlots = async () => {
    setIsDeletingSlots(true);
    const date = dayjs(fromDate).format('YYYY-MM-DD');
    const convertTo24Hour = (time12h: string): string => {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours !== 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const payload = {
      doctorId,
      addressId: selectedClinic,
      date,
      slotTimes: selectedSlots.length > 0 ? selectedSlots.map(convertTo24Hour) : availableSlots.map((item: Slot) => convertTo24Hour(item.time)),
    };

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const res = await authdelete(
        `appointment/deleteDoctorSlots?doctorId=${doctorId}&addressId=${selectedClinic}&date=${date}`,
        payload,
        token
      );
      console.log("333",res)
      if (res.status === 'success') {
        fetchSlotsForDate(date);
        setSelectedSlots([]);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Slots deleted successfully',
          position: 'top',
          visibilityTime: 3000,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Please Retry',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to delete slots. Please try again.');
    } finally {
      setIsDeletingSlots(false); // Stop loading regardless of success/error
    }
  };

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
    const todayIndex = moment().isoWeekday(); // 1 (Monday) - 7 (Sunday)
    const selectedIndex = weekdays.indexOf(day) + 1; // 1-based to match isoWeekday
    let diff = selectedIndex - todayIndex;
    if (diff < 0) {
      diff += 7; // Move to next week if the selected day is before today
    }
    // Convert Moment object to Date object
    const date = moment().add(diff, 'days').toDate(); // Use .toDate() to ensure Date object
    setFromDate(date);
    // Also update toDate to be the same as fromDate
    setToDate(date);
  };

  // Convert "HH:mm" or "h:mm AM/PM" => minutes since midnight
  const slotStringToMinutes = (s) => {
    if (!s) return 0;
    const raw = s.trim().toUpperCase();
    const hasAMPM = /\bAM\b|\bPM\b/.test(raw);
    const cleaned = raw.replace(/\s?(AM|PM)\b/, '').trim();
    const [hStr, mStr = '0'] = cleaned.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;

    if (hasAMPM) {
      const isPM = /\bPM\b/.test(raw);
      if (isPM && h !== 12) h += 12;
      if (!isPM && h === 12) h = 0; // 12:xx AM -> 00:xx
    }
    return h * 60 + m;
  };

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  /**
   * Disable if:
   *  - selected date is strictly before today, OR
   *  - selected date is today AND slot time is <= current time
   */
  const isPastSlot = (slotTimeStr, fromDate) => {
    const now = new Date();
    const today0 = startOfDay(now).getTime();
    const sel0 = startOfDay(fromDate).getTime();

    if (sel0 < today0) return true;
    if (sel0 > today0) return false;               // future day – all enabled

    const slotMins = slotStringToMinutes(slotTimeStr);
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return slotMins <= nowMins;                    // today: past or current minute
  };

  // Calendar Handlers
const openCalendar = (type: 'from' | 'to') => {
  if (Platform.OS === 'android') {
    setWhichPicker(type);
    setShowDatePicker(true);
  } else {
    setCalendarType(type);
    // Set calendarDate to the CURRENT value (not always today)
    if (type === 'from') {
      setCalendarDate(fromDate); // Use current fromDate
      setShowFromCalendar(true);
    } else {
      setCalendarDate(toDate); // Use current toDate
      setShowToCalendar(true);
    }
  }
};

  const handleCalendarDateChangeIOS = (date: Date) => {
    if (calendarType === 'from') {
      setFromDate(date);
      if (date > toDate) {
        setToDate(date);
      }
    } else {
      if (date >= fromDate) {
        setToDate(date);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'End date cannot be before start date',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    }
    if (calendarType === 'from') {
      setShowFromCalendar(false);
    } else {
      setShowToCalendar(false);
    }
  };

  const cancelCalendarIOS = () => {
    if (calendarType === 'from') {
      setShowFromCalendar(false);
    } else {
      setShowToCalendar(false);
    }
  };

  // Android Date Picker Handler
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      if (whichPicker === 'from') {
        setFromDate(selectedDate);
        if (selectedDate > toDate) {
          setToDate(selectedDate);
        }
      } else if (whichPicker === 'to') {
        if (selectedDate >= fromDate) {
          setToDate(selectedDate);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'End date cannot be before start date',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      }
    }
    setWhichPicker(null);
  };

  // ── NEW: View range calendar/picker handlers ─────────────────────────────────
  const openViewRangeCalendar = (type: 'from' | 'to') => {
    if (Platform.OS === 'android') {
      setViewRangeCalendarType(type);
      if (type === 'from') setShowViewRangeFromPicker(true);
      else setShowViewRangeToPicker(true);
    } else {
      setViewRangeCalendarType(type);
      setViewRangeCalendarDate(type === 'from' ? (viewRangeFrom || new Date()) : (viewRangeTo || new Date()));
      if (type === 'from') setShowViewRangeFromCalendar(true);
      else setShowViewRangeToCalendar(true);
    }
  };

  const handleViewRangeDateChangeAndroid = (event: any, selectedDate?: Date, type?: 'from' | 'to') => {
    if (type === 'from') setShowViewRangeFromPicker(false);
    else setShowViewRangeToPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (type === 'from') {
        setViewRangeFrom(selectedDate);
        if (viewRangeTo && selectedDate > viewRangeTo) setViewRangeTo(selectedDate);
      } else {
        if (!viewRangeFrom || selectedDate >= viewRangeFrom) setViewRangeTo(selectedDate);
        else Toast.show({ type: 'error', text1: 'Error', text2: 'End date cannot be before start date', position: 'top', visibilityTime: 3000 });
      }
    }
  };

  const handleViewRangeDateChangeIOS = (date: Date) => {
    if (viewRangeCalendarType === 'from') {
      setViewRangeFrom(date);
      if (viewRangeTo && date > viewRangeTo) setViewRangeTo(date);
      setShowViewRangeFromCalendar(false);
    } else {
      if (!viewRangeFrom || date >= viewRangeFrom) {
        setViewRangeTo(date);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'End date cannot be before start date', position: 'top', visibilityTime: 3000 });
      }
      setShowViewRangeToCalendar(false);
    }
  };

  // ── NEW: Delete range calendar/picker handlers ───────────────────────────────
  const openDeleteRangeCalendar = (type: 'from' | 'to') => {
    if (Platform.OS === 'android') {
      setDeleteRangeCalendarType(type);
      if (type === 'from') setShowDeleteRangeFromPicker(true);
      else setShowDeleteRangeToPicker(true);
    } else {
      setDeleteRangeCalendarType(type);
      setDeleteRangeCalendarDate(type === 'from' ? (deleteRangeFrom || new Date()) : (deleteRangeTo || new Date()));
      if (type === 'from') setShowDeleteRangeFromCalendar(true);
      else setShowDeleteRangeToCalendar(true);
    }
  };

  const handleDeleteRangeDateChangeAndroid = (event: any, selectedDate?: Date, type?: 'from' | 'to') => {
    if (type === 'from') setShowDeleteRangeFromPicker(false);
    else setShowDeleteRangeToPicker(false);
    if (event.type === 'set' && selectedDate) {
      if (type === 'from') {
        setDeleteRangeFrom(selectedDate);
        if (deleteRangeTo && selectedDate > deleteRangeTo) setDeleteRangeTo(selectedDate);
      } else {
        if (!deleteRangeFrom || selectedDate >= deleteRangeFrom) setDeleteRangeTo(selectedDate);
        else Toast.show({ type: 'error', text1: 'Error', text2: 'End date cannot be before start date', position: 'top', visibilityTime: 3000 });
      }
    }
  };

  const handleDeleteRangeDateChangeIOS = (date: Date) => {
    if (deleteRangeCalendarType === 'from') {
      setDeleteRangeFrom(date);
      if (deleteRangeTo && date > deleteRangeTo) setDeleteRangeTo(date);
      setShowDeleteRangeFromCalendar(false);
    } else {
      if (!deleteRangeFrom || date >= deleteRangeFrom) {
        setDeleteRangeTo(date);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'End date cannot be before start date', position: 'top', visibilityTime: 3000 });
      }
      setShowDeleteRangeToCalendar(false);
    }
  };

  // ── NEW: Single date delete calendar/picker handlers ─────────────────────────
  const openSingleDateCalendar = () => {
    if (Platform.OS === 'android') {
      setShowSingleDatePicker(true);
    } else {
      setSingleDateCalendarDate(singleDateDeleteDate || new Date());
      setShowSingleDateCalendar(true);
    }
  };

  const handleSingleDatePickerChangeAndroid = (event: any, selectedDate?: Date) => {
    setShowSingleDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setSingleDateDeleteDate(selectedDate);
      setSingleDateDeleteSlots([]);
      setSelectAllSlots(false);
      fetchSlotsForDeleteModal(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };

  const handleSingleDatePickerChangeIOS = (date: Date) => {
    setSingleDateDeleteDate(date);
    setSingleDateDeleteSlots([]);
    setSelectAllSlots(false);
    fetchSlotsForDeleteModal(dayjs(date).format('YYYY-MM-DD'));
    setShowSingleDateCalendar(false);
  };

  // Determine which slots to display (view range vs day view)
  const displayAvailableSlots = selectedViewDay
    ? (slotsForViewRange[selectedViewDay]?.availableSlots || [])
    : availableSlots;

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <CommonHeader title="Clinic Availability" />

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => setIsClinicModalVisible(true)}
        >
          <Text style={styles.selectionButtonText} numberOfLines={1}>
            {selectedClinic ? clinics.find((c) => c.value === selectedClinic)?.label || 'Select Clinic' : 'Select Clinic'}
          </Text>
          <DropdownIcon size={moderateScale(20)} color="#333"/>
        </TouchableOpacity>
      </View>

      <View style={styles.dateSection}>
        <View style={styles.dateRow}>
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openCalendar('from')}
            >
              <Text style={styles.dateButtonText}>{dayjs(fromDate).format('DD/MM/YYYY')}</Text>
             <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateColumn}>
            <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => openCalendar('to')}
              >
                <Text style={styles.dateButtonText}>{dayjs(toDate).format('DD/MM/YYYY')}</Text>
             <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
              </TouchableOpacity>
            </View>
          </View>
      </View>

      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={whichPicker === 'from' ? fromDate : toDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <>
          <IOSCalendarPicker
            visible={showFromCalendar}
            currentDate={calendarDate}
            onConfirm={handleCalendarDateChangeIOS}
            onCancel={cancelCalendarIOS}
            title="Select Start Date"
               mode="date"
               minDate={new Date()} 
          />
          <IOSCalendarPicker
            visible={showToCalendar}
            currentDate={calendarDate}
            onConfirm={handleCalendarDateChangeIOS}
            onCancel={cancelCalendarIOS}
            title="Select End Date"
               mode="date"
               minDate={new Date()} 
          />
        </>
      )}

      <View style={styles.weekdaySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekdayScrollContent}
        >
          {orderedDays.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.weekdayButton,
                selectedDay === day ? styles.weekdayButtonSelected : styles.weekdayButtonDefault,
              ]}
              onPress={() => handleDayClick(day)}
            >
              <Text style={[
                styles.weekdayText,
                selectedDay === day && styles.weekdayTextSelected
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.timeSection}>
        <View style={styles.timeRow}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <View style={styles.timeControl}>
              <Text style={styles.timeValue}>{startTime}</Text>
              <View style={styles.timeArrows}>
                <TouchableOpacity 
                  onPress={() => adjustTime('start', 'up', 'available')} 
                  style={styles.arrowButton}
                >
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustTime('start', 'down', 'available')}
                  style={styles.arrowButton}
                  disabled={moment(fromDate).isSame(moment(), 'day') && parseInt(startTime, 10) <= getMinimumStartTime()}
                >
                  <Text style={[
                    styles.arrowText,
                    moment(fromDate).isSame(moment(), 'day') && parseInt(startTime, 10) <= getMinimumStartTime() && styles.arrowDisabled
                  ]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  { backgroundColor: startPeriod === 'PM' ? '#ffeaa7' : '#fff' }
                ]}
                onPress={() => setStartPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'))}
              >
                <Text style={styles.periodText}>{startPeriod}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timeColumn}>
            <Text style={styles.timeLabel}>End Time</Text>
            <View style={styles.timeControl}>
              <Text style={[styles.timeValue, !isEndTimeValid() && styles.timeValueInvalid]}>
                {showEndTimeAs1159 ? '11:59' : endTime}
              </Text>
              <View style={styles.timeArrows}>
                <TouchableOpacity 
                  onPress={() => adjustTime('end', 'up', 'available')} 
                  style={styles.arrowButton}
                >
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => adjustTime('end', 'down', 'available')}
                  style={styles.arrowButton}
                  disabled={showEndTimeAs1159 ? false : parseInt(endTime, 10) === 1 && endPeriod === 'AM'}
                >
                  <Text style={[
                    styles.arrowText,
                    (showEndTimeAs1159 ? false : parseInt(endTime, 10) === 1 && endPeriod === 'AM') && styles.arrowDisabled
                  ]}>
                    ▼
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[
                  styles.periodButton,
                  {
                    backgroundColor: showEndTimeAs1159 ? '#ffeaa7' : (endPeriod === 'PM' ? '#ffeaa7' : '#fff'),
                  }
                ]}
                onPress={() => {
                  if (!showEndTimeAs1159) {
                    setEndPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'));
                  }
                }}
                disabled={showEndTimeAs1159}
              >
                <Text style={[
                  styles.periodText,
                  showEndTimeAs1159 && styles.periodTextDisabled
                ]}>
                  {endPeriod}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {!isEndTimeValid() && (
          <Text style={styles.errorText}>End time must be after start time</Text>
        )}

        <View style={styles.durationSection}>
          <Text style={styles.durationLabel}>Duration</Text>
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={() => setIsDurationModalVisible(true)}
          >
            <Text style={styles.selectionButtonText}>{duration || 'Select Duration'}</Text>
            <DropdownIcon size={moderateScale(20)} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.daySelectionNote}>Select the days of the week on which you are available</Text>
        <View style={styles.daySelectionRow}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => {
            const isSelected = selectedDaysForSlots.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedDaysForSlots(prev => prev.filter(d => d !== day));
                  } else {
                    setSelectedDaysForSlots(prev => [...prev, day]);
                  }
                }}
              >
                <Text style={[
                  styles.dayChipText,
                  isSelected && styles.dayChipTextSelected,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.addButton,
              (!isEndTimeValid() || isAddingSlots) && styles.buttonDisabled
            ]}
            onPress={generateTimeSlots}
            disabled={isAddingSlots || !isEndTimeValid()}
          >
            {isAddingSlots ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Add Slots</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.deleteButton,
              (isDeletingSlots || availableSlots.length === 0) && styles.buttonDisabled
            ]}
            onPress={handleDeleteSlots}
            disabled={isDeletingSlots || availableSlots.length === 0}
          >
            {isDeletingSlots ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionButtonText}>Delete All</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── NEW: Delete sub-menu button ─────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.deleteMenuButton}
          onPress={() => setShowDeleteMenu(true)}
        >
          <Text style={styles.deleteMenuButtonText}>Delete ▾</Text>
        </TouchableOpacity>

        {/* ── NEW: View by Date Range section ────────────────────────────────── */}
        <View style={styles.viewRangeSection}>
          <Text style={styles.viewRangeSectionTitle}>View Slots by Date Range</Text>
          <View style={styles.dateRow}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>From</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openViewRangeCalendar('from')}>
                <Text style={styles.dateButtonText}>{viewRangeFrom ? dayjs(viewRangeFrom).format('DD/MM/YYYY') : 'Select'}</Text>
                <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
              </TouchableOpacity>
            </View>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>To</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => openViewRangeCalendar('to')}>
                <Text style={styles.dateButtonText}>{viewRangeTo ? dayjs(viewRangeTo).format('DD/MM/YYYY') : 'Select'}</Text>
                <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
              </TouchableOpacity>
            </View>
          </View>
          {(viewRangeFrom || viewRangeTo) && (
            <TouchableOpacity
              style={styles.clearRangeButton}
              onPress={() => {
                setViewRangeFrom(null);
                setViewRangeTo(null);
                setSelectedViewDay(null);
                setViewDaysInRange([]);
                setSlotsForViewRange({});
              }}
            >
              <Text style={styles.clearRangeButtonText}>Clear Range</Text>
            </TouchableOpacity>
          )}

          {viewDaysInRange.length > 0 && (
            <View style={styles.viewRangeDaysContainer}>
              <Text style={styles.viewRangeDaysTitle}>Select Day in Range:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekdayScrollContent}>
                {viewDaysInRange.map((day) => {
                  const isSelected = selectedViewDay === day.date;
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.viewRangeDayButton,
                        isSelected && styles.viewRangeDayButtonSelected,
                      ]}
                      onPress={() => {
                        setSelectedViewDay(day.date);
                        fetchSlotsForViewDate(day.date);
                      }}
                    >
                      <Text style={[styles.viewRangeDayText, isSelected && styles.viewRangeDayTextSelected]}>{day.dayName.substring(0, 3)}</Text>
                      <Text style={[styles.viewRangeDaySubText, isSelected && styles.viewRangeDayTextSelected]}>{day.displayDate}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Android view range pickers */}
        {showViewRangeFromPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={viewRangeFrom || new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(e, d) => handleViewRangeDateChangeAndroid(e, d, 'from')}
          />
        )}
        {showViewRangeToPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={viewRangeTo || new Date()}
            mode="date"
            display="default"
            minimumDate={viewRangeFrom || new Date()}
            onChange={(e, d) => handleViewRangeDateChangeAndroid(e, d, 'to')}
          />
        )}
        {Platform.OS === 'ios' && (
          <>
            <IOSCalendarPicker
              visible={showViewRangeFromCalendar}
              currentDate={viewRangeCalendarDate}
              onConfirm={handleViewRangeDateChangeIOS}
              onCancel={() => setShowViewRangeFromCalendar(false)}
              title="Select View Range Start"
              mode="date"
              minDate={new Date()}
            />
            <IOSCalendarPicker
              visible={showViewRangeToCalendar}
              currentDate={viewRangeCalendarDate}
              onConfirm={handleViewRangeDateChangeIOS}
              onCancel={() => setShowViewRangeToCalendar(false)}
              title="Select View Range End"
              mode="date"
              minDate={viewRangeFrom || new Date()}
            />
          </>
        )}
      </View>

      <View style={styles.slotsSection}>
      <Text style={styles.slotsTitle}>
        {selectedViewDay
          ? `Slots for ${moment(selectedViewDay).format('DD MMM YYYY')}`
          : 'Generated Time Slots'}
      </Text>

      <View style={styles.slotsGrid}>
        {displayAvailableSlots.length === 0 ? (
          <Text style={styles.noSlotsText}>
            {selectedViewDay
              ? `No available slots for ${moment(selectedViewDay).format('DD MMM YYYY')}`
              : 'No available slots for this date'}
          </Text>
        ) : (
          displayAvailableSlots.map((slot: Slot, index: number) => (
            <TouchableOpacity
              key={index}
              disabled={isPastSlot(slot.time, selectedViewDay ? new Date(selectedViewDay) : fromDate)}
              style={[
                styles.slotButton,
                selectedSlots.includes(slot.time) && styles.slotButtonSelected,
                isPastSlot(slot.time, selectedViewDay ? new Date(selectedViewDay) : fromDate) && styles.slotButtonDisabled,
              ]}
              onPress={() => {
                if (isPastSlot(slot.time, selectedViewDay ? new Date(selectedViewDay) : fromDate)) return;
                toggleSlotSelection(slot.time);
              }}
              onLongPress={() => {
                if (isPastSlot(slot.time, selectedViewDay ? new Date(selectedViewDay) : fromDate)) return;
                setSelectedSlots([slot.time]);
                setShowDeleteConfirm(true);
              }}
            >
              <Text
                style={[
                  styles.slotText,
                  isPastSlot(slot.time, selectedViewDay ? new Date(selectedViewDay) : fromDate) && styles.slotTextDisabled,
                ]}>
                {slot.time}
              </Text>
            </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={isClinicModalVisible}
        onRequestClose={() => setIsClinicModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Clinic</Text>
            <ScrollView style={styles.modalScroll}>
              {clinics.length > 0 ? (
                clinics.map((clinic) => (
                  <TouchableOpacity
                    key={clinic.value}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedClinic(clinic.value);
                      setIsClinicModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{clinic.label}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.modalEmptyText}>No clinics available</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsClinicModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={isDurationModalVisible}
        onRequestClose={() => setIsDurationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Duration</Text>
            <ScrollView style={styles.modalScroll}>
              {durations.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.modalItem}
                  onPress={() => {
                    setDuration(d);
                    setIsDurationModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsDurationModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal 
        transparent 
        animationType="fade" 
        visible={showDeleteConfirm} 
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmModal}>
              <Text style={styles.confirmText}>Are you sure you want to delete the selected slots?</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonPrimary]}
                  onPress={() => {
                    handleDeleteSlots();
                    setShowDeleteConfirm(false);
                  }}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.confirmButtonSecondary]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={[styles.confirmButtonText, styles.confirmButtonTextSecondary]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      {/* ── NEW: Delete sub-menu modal ──────────────────────────────────────────── */}
      <Modal
        transparent
        animationType="fade"
        visible={showDeleteMenu}
        onRequestClose={() => setShowDeleteMenu(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Slots</Text>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setShowDeleteMenu(false);
                setSingleDateDeleteModal(true);
              }}
            >
              <Text style={styles.modalItemText}>Delete Selected Slots</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setShowDeleteMenu(false);
                setDeleteRangeModal(true);
              }}
            >
              <Text style={styles.modalItemText}>Delete by Date Range</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDeleteMenu(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── NEW: Single Date Delete Modal ──────────────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={singleDateDeleteModal}
        onRequestClose={() => setSingleDateDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <Text style={styles.modalTitle}>Delete Slots for Selected Date</Text>

            <Text style={styles.fieldLabel}>Select Date:</Text>
            <TouchableOpacity style={styles.dateButton} onPress={openSingleDateCalendar}>
              <Text style={styles.dateButtonText}>
                {singleDateDeleteDate ? dayjs(singleDateDeleteDate).format('DD/MM/YYYY') : 'Tap to select date'}
              </Text>
              <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
            </TouchableOpacity>

            {showSingleDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={singleDateDeleteDate || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleSingleDatePickerChangeAndroid}
              />
            )}
            {Platform.OS === 'ios' && (
              <IOSCalendarPicker
                visible={showSingleDateCalendar}
                currentDate={singleDateCalendarDate}
                onConfirm={handleSingleDatePickerChangeIOS}
                onCancel={() => setShowSingleDateCalendar(false)}
                title="Select Date"
                mode="date"
                minDate={new Date()}
              />
            )}

            {singleDateAvailableSlots.length > 0 ? (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.selectAllRow}>
                  <Text style={styles.fieldLabel}>Select Slots to Delete:</Text>
                  <TouchableOpacity
                    style={[styles.selectAllButton, selectAllSlots && styles.selectAllButtonActive]}
                    onPress={() => {
                      const next = !selectAllSlots;
                      setSelectAllSlots(next);
                      setSingleDateDeleteSlots(next ? singleDateAvailableSlots.map(s => s.originalTime) : []);
                    }}
                  >
                    <Text style={[styles.selectAllButtonText, selectAllSlots && styles.selectAllButtonTextActive]}>
                      {selectAllSlots ? 'Deselect All' : `Select All (${singleDateAvailableSlots.length})`}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.slotsGrid}>
                  {singleDateAvailableSlots.map((slot, index) => {
                    const isSelected = singleDateDeleteSlots.includes(slot.originalTime);
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[styles.slotButton, isSelected && styles.slotButtonDeleteSelected]}
                        onPress={() => {
                          if (isSelected) {
                            setSingleDateDeleteSlots(prev => prev.filter(s => s !== slot.originalTime));
                            setSelectAllSlots(false);
                          } else {
                            const next = [...singleDateDeleteSlots, slot.originalTime];
                            setSingleDateDeleteSlots(next);
                            if (next.length === singleDateAvailableSlots.length) setSelectAllSlots(true);
                          }
                        }}
                      >
                        <Text style={[styles.slotText, isSelected && styles.slotTextDeleteSelected]}>{slot.time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>Selection Summary:</Text>
                  <Text style={styles.summaryText}>Date: {singleDateDeleteDate ? dayjs(singleDateDeleteDate).format('DD MMM YYYY') : '-'}</Text>
                  <Text style={styles.summaryText}>Slots to Delete: <Text style={styles.summaryHighlight}>{singleDateDeleteSlots.length}</Text> out of {singleDateAvailableSlots.length}</Text>
                  {singleDateDeleteSlots.length === singleDateAvailableSlots.length && singleDateAvailableSlots.length > 0 && (
                    <Text style={styles.summaryWarning}>⚠️ All slots for this date will be deleted</Text>
                  )}
                </View>
              </ScrollView>
            ) : singleDateDeleteDate ? (
              <View style={styles.emptyStateBox}>
                <Text style={styles.noSlotsText}>No available slots found for {dayjs(singleDateDeleteDate).format('DD MMM YYYY')}</Text>
              </View>
            ) : null}

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary, (isDeletingSlots || singleDateDeleteSlots.length === 0) && styles.buttonDisabled]}
                onPress={handleSingleDateDelete}
                disabled={isDeletingSlots || singleDateDeleteSlots.length === 0}
              >
                {isDeletingSlots ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Delete Selected</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonSecondary]}
                onPress={() => {
                  setSingleDateDeleteModal(false);
                  setSingleDateDeleteDate(null);
                  setSingleDateDeleteSlots([]);
                  setSingleDateAvailableSlots([]);
                  setSelectAllSlots(false);
                }}
              >
                <Text style={[styles.confirmButtonText, styles.confirmButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── NEW: Delete by Date Range Modal ──────────────────────────────────────── */}
      <Modal
        transparent
        animationType="slide"
        visible={deleteRangeModal}
        onRequestClose={() => setDeleteRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModalContent]}>
            <Text style={styles.modalTitle}>Delete Slots by Date Range</Text>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>From</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => openDeleteRangeCalendar('from')}>
                  <Text style={styles.dateButtonText}>{deleteRangeFrom ? dayjs(deleteRangeFrom).format('DD/MM/YYYY') : 'Select'}</Text>
                  <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
                </TouchableOpacity>
              </View>
              <View style={styles.dateColumn}>
                <Text style={styles.dateLabel}>To</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => openDeleteRangeCalendar('to')}>
                  <Text style={styles.dateButtonText}>{deleteRangeTo ? dayjs(deleteRangeTo).format('DD/MM/YYYY') : 'Select'}</Text>
                  <CalendarIcon size={moderateScale(18)} color="#000" style={styles.calendarIcon}/>
                </TouchableOpacity>
              </View>
            </View>

            {showDeleteRangeFromPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={deleteRangeFrom || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(e, d) => handleDeleteRangeDateChangeAndroid(e, d, 'from')}
              />
            )}
            {showDeleteRangeToPicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={deleteRangeTo || new Date()}
                mode="date"
                display="default"
                minimumDate={deleteRangeFrom || new Date()}
                onChange={(e, d) => handleDeleteRangeDateChangeAndroid(e, d, 'to')}
              />
            )}
            {Platform.OS === 'ios' && (
              <>
                <IOSCalendarPicker
                  visible={showDeleteRangeFromCalendar}
                  currentDate={deleteRangeCalendarDate}
                  onConfirm={handleDeleteRangeDateChangeIOS}
                  onCancel={() => setShowDeleteRangeFromCalendar(false)}
                  title="Select Start Date"
                  mode="date"
                  minDate={new Date()}
                />
                <IOSCalendarPicker
                  visible={showDeleteRangeToCalendar}
                  currentDate={deleteRangeCalendarDate}
                  onConfirm={handleDeleteRangeDateChangeIOS}
                  onCancel={() => setShowDeleteRangeToCalendar(false)}
                  title="Select End Date"
                  mode="date"
                  minDate={deleteRangeFrom || new Date()}
                />
              </>
            )}

            <ScrollView style={styles.modalScroll}>
              {deleteWeeksInRange.length > 0 && (
                <>
                  <View style={styles.selectAllRow}>
                    <Text style={styles.fieldLabel}>Select Dates:</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => setDeleteSelectedDates(deleteWeeksInRange.map(d => d.date))}
                        disabled={deleteSelectedDates.length === deleteWeeksInRange.length}
                      >
                        <Text style={styles.smallButtonText}>All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => setDeleteSelectedDates([])}
                        disabled={deleteSelectedDates.length === 0}
                      >
                        <Text style={styles.smallButtonText}>None</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekdayScrollContent}>
                    {deleteWeeksInRange.map((day) => {
                      const isSelected = deleteSelectedDates.includes(day.date);
                      const hasSlots = (deleteRangeSlotsData[day.date]?.length || 0) > 0;
                      return (
                        <TouchableOpacity
                          key={day.date}
                          style={[styles.viewRangeDayButton, isSelected && styles.viewRangeDayButtonSelected]}
                          onPress={() => {
                            if (isSelected) setDeleteSelectedDates(prev => prev.filter(d => d !== day.date));
                            else setDeleteSelectedDates(prev => [...prev, day.date]);
                          }}
                        >
                          {hasSlots && <View style={styles.hasSlotsDot} />}
                          <Text style={[styles.viewRangeDayText, isSelected && styles.viewRangeDayTextSelected]}>{day.dayName.substring(0, 3)}</Text>
                          <Text style={[styles.viewRangeDaySubText, isSelected && styles.viewRangeDayTextSelected]}>{day.displayDate}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.legendText}>● Green dot = date has existing slots</Text>
                </>
              )}

              {deleteSelectedDates.length > 0 && getAllUniqueSlotTimes().length > 0 && (
                <>
                  <View style={styles.selectAllRow}>
                    <Text style={styles.fieldLabel}>Select Specific Slots (Optional):</Text>
                    <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => setDeleteSelectedSlots(getAllUniqueSlotTimes().map(s => s.originalTime))}
                        disabled={deleteSelectedSlots.length === getAllUniqueSlotTimes().length}
                      >
                        <Text style={styles.smallButtonText}>All</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.smallButton}
                        onPress={() => setDeleteSelectedSlots([])}
                        disabled={deleteSelectedSlots.length === 0}
                      >
                        <Text style={styles.smallButtonText}>Clear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={styles.hintText}>Leave empty to delete ALL slots for selected dates, or choose specific times.</Text>
                  <View style={styles.slotsGrid}>
                    {getAllUniqueSlotTimes().map((slot, index) => {
                      const isSelected = deleteSelectedSlots.includes(slot.originalTime);
                      const datesWithSlot = deleteSelectedDates.filter(date =>
                        deleteRangeSlotsData[date]?.some(s => s.originalTime === slot.originalTime)
                      ).length;
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.slotButton, isSelected && styles.slotButtonDeleteSelected]}
                          onPress={() => {
                            if (isSelected) setDeleteSelectedSlots(prev => prev.filter(s => s !== slot.originalTime));
                            else setDeleteSelectedSlots(prev => [...prev, slot.originalTime]);
                          }}
                        >
                          <Text style={[styles.slotText, isSelected && styles.slotTextDeleteSelected]}>{slot.time}</Text>
                          <Text style={styles.slotSubText}>{datesWithSlot}d</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {deleteSelectedDates.length > 0 && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryTitle}>⚠️ Deletion Summary:</Text>
                  <Text style={styles.summaryText}>Dates Selected: {deleteSelectedDates.length} of {deleteWeeksInRange.length}</Text>
                  <Text style={styles.summaryText}>
                    Action: {deleteSelectedSlots.length > 0
                      ? `Delete ${deleteSelectedSlots.length} specific slot(s)`
                      : 'Delete ALL slots for each selected date'}
                  </Text>
                  <Text style={styles.summaryWarning}>⚠️ This action cannot be undone.</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonPrimary, (isDeletingRange || deleteSelectedDates.length === 0) && styles.buttonDisabled]}
                onPress={handleDeleteDateRange}
                disabled={isDeletingRange || deleteSelectedDates.length === 0}
              >
                {isDeletingRange ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Delete Slots</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmButtonSecondary]}
                onPress={() => {
                  setDeleteRangeModal(false);
                  setDeleteRangeFrom(null);
                  setDeleteRangeTo(null);
                  setDeleteSelectedDates([]);
                  setDeleteSelectedSlots([]);
                  setDeleteWeeksInRange([]);
                }}
              >
                <Text style={[styles.confirmButtonText, styles.confirmButtonTextSecondary]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFFFFA',
  },
  scrollContent: {
    // padding: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: '#333',
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    height: moderateScale(44),
  },
  selectionButtonText: {
    color: '#333',
    fontSize: responsiveText(FONT_SIZE.sm),
    flex: 1,
    marginRight: SPACING.sm,
  },
  dateSection: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  dateColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#fff',
    height: moderateScale(44),
  },
  dateButtonText: {
    color: '#333',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  calendarIcon: {
    marginLeft: SPACING.xs,
  },
  weekdaySection: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  weekdayScrollContent: {
    paddingVertical: SPACING.xs,
  },
  weekdayButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: isTablet ? SPACING.md : SPACING.sm,
    borderRadius: LAYOUT.borderRadius.pill,
    marginRight: SPACING.sm,
    minWidth: moderateScale(60),
    alignItems: 'center',
  },
  weekdayButtonDefault: {
    backgroundColor: '#E2E8F0',
  },
  weekdayButtonSelected: {
    backgroundColor: '#3B82F6',
  },
  weekdayText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#000',
  },
  weekdayTextSelected: {
    color: '#fff',
  },
  timeSection: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...LAYOUT.shadow.sm,
    marginHorizontal: SPACING.md,
  },
  daySelectionNote: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: SPACING.sm,
  },
  daySelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.pill,
    backgroundColor: '#F3F4F6',
    minWidth: moderateScale(38),
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: '#3B82F6',
  },
  dayChipText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#6B7280',
  },
  dayChipTextSelected: {
    color: '#fff',
  },
  dayChipDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.4,
  },
  dayChipTextDisabled: {
    color: '#9CA3AF',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: '#333',
  },
  timeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: 'bold',
    minWidth: moderateScale(40),
    textAlign: 'center',
    color: '#333',
  },
  timeValueInvalid: {
    color: '#EF4444',
  },
  timeArrows: {
    marginLeft: SPACING.sm,
  },
  arrowButton: {
    width: moderateScale(28),
    height: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.xxs,
  },
  arrowText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#333',
  },
  arrowDisabled: {
    color: '#ccc',
    opacity: 0.5,
  },
  periodButton: {
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.sm,
    minWidth: moderateScale(40),
    height: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  periodTextDisabled: {
    color: '#000000',
  },
  errorText: {
    color: '#EF4444',
    fontSize: responsiveText(FONT_SIZE.xs),
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  durationSection: {
    marginBottom: SPACING.lg,
  },
  durationLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    marginBottom: SPACING.xs,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
  },
  // ── NEW styles ────────────────────────────────────────────────────────────────
  deleteMenuButton: {
    marginTop: SPACING.sm,
    backgroundColor: '#EF4444',
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
  },
  deleteMenuButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: 'bold',
  },
  viewRangeSection: {
    marginTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: SPACING.md,
  },
  viewRangeSectionTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: SPACING.sm,
  },
  clearRangeButton: {
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#E5E7EB',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  clearRangeButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#374151',
    fontWeight: '600',
  },
  viewRangeDaysContainer: {
    marginTop: SPACING.md,
  },
  viewRangeDaysTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.xs,
  },
  viewRangeDayButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    marginRight: SPACING.sm,
    minWidth: moderateScale(70),
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewRangeDayButtonSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  viewRangeDayText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#374151',
  },
  viewRangeDaySubText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginTop: 2,
  },
  viewRangeDayTextSelected: {
    color: '#1D4ED8',
  },
  largeModalContent: {
    maxHeight: '85%',
    width: '95%',
    maxWidth: moderateScale(500),
  },
  fieldLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  selectAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  selectAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  selectAllButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  selectAllButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#374151',
  },
  selectAllButtonTextActive: {
    color: '#1D4ED8',
  },
  slotButtonDeleteSelected: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  slotTextDeleteSelected: {
    color: '#DC2626',
    fontWeight: 'bold',
  },
  summaryBox: {
    backgroundColor: '#FFF7ED',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: SPACING.md,
  },
  summaryTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '700',
    color: '#92400E',
    marginBottom: SPACING.xs,
  },
  summaryText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#78350F',
    marginBottom: 2,
  },
  summaryHighlight: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  summaryWarning: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#B45309',
    marginTop: SPACING.xs,
  },
  emptyStateBox: {
    padding: SPACING.xl,
    backgroundColor: '#F9FAFB',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  hasSlotsDot: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  legendText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  hintText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  smallButton: {
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#E5E7EB',
    borderRadius: LAYOUT.borderRadius.sm,
  },
  smallButtonText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#374151',
    fontWeight: '600',
  },
  slotSubText: {
    fontSize: responsiveText(8),
    color: '#6B7280',
    marginTop: 1,
  },
  // ── end NEW styles ─────────────────────────────────────────────────────────────
  slotsSection: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  slotsTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    marginBottom: SPACING.md,
    color: '#333',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  slotButton: {
    backgroundColor: '#D1FAE5',
    borderRadius: LAYOUT.borderRadius.pill,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(90),
  },
  slotButtonSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
    borderWidth: 1,
  },
  slotButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.45,
  },
  slotText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  slotTextDisabled: {
    color: '#6B7280',
  },
  noSlotsText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#EF4444',
    textAlign: 'center',
    width: '100%',
    padding: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: moderateScale(400),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: '600',
    marginBottom: SPACING.md,
    color: '#333',
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: moderateScale(350),
  },
  modalItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalItemText: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#333',
  },
  modalEmptyText: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#6B7280',
    textAlign: 'center',
    padding: SPACING.lg,
  },
  modalCloseButton: {
    marginTop: SPACING.md,
    backgroundColor: '#E5E7EB',
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#333',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
  },
  confirmModal: {
    width: '100%',
    maxWidth: moderateScale(350),
    backgroundColor: 'white',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.lg,
  },
  confirmText: {
    fontSize: responsiveText(FONT_SIZE.md),
    marginBottom: SPACING.lg,
    textAlign: 'center',
    color: '#1F2937',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  confirmButtonSecondary: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  confirmButtonTextSecondary: {
    color: '#374151',
  },
});

export default AvailabilityScreen;