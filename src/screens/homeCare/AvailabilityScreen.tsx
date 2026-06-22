import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import SettlementCalendarModal from '../../components/provider/modals/SettlementCalendarModal';
import { PROVIDER_THEME, PROVIDER_FONTS } from '../../theme/providerTheme';
import { moderateScale } from '../../utils/responsive';
import {
  createProviderSlots,
  getProviderAvailability,
  IProviderSlotsBody,
  deleteProviderSlotsByDay,
  deleteSelectedProviderSlots,
  IProviderDateAvailability,
  IProviderAvailabilityResponse,
  IProviderSlot
} from '../../services/apiHelpers';
// import type { RootState } from '../../store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimeSlot {
  id: string;
  day: string;
  date: string;
  label: string;
  timeRange: string;
}

const DEFAULT_SLOTS: TimeSlot[] = [];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Generate time slots (30-minute intervals from 6 AM to 11 PM)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 6; hour < 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
      slots.push({
        time: timeStr,
        display: `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`,
      });
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function AvailabilityScreen() {
  const navigation = useNavigation();
  // const { user, userId } = useSelector((state: RootState) => state.auth);
  const [slots, setSlots] = useState<TimeSlot[]>(DEFAULT_SLOTS);
  const [isSaving, setIsSaving] = useState(false);
  const [localUserId, setLocalUserId] = useState<string | null>(null);

  // Form state
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [duration, setDuration] = useState(30);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Tuesday']);
  const [selectedDayForSlots, setSelectedDayForSlots] = useState('Monday');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayDate = new Date();
  const [calendarRangeStartMs, setCalendarRangeStartMs] = useState<number | null>(
    todayDate.getTime(),
  );
  const [calendarRangeEndMs, setCalendarRangeEndMs] = useState<number | null>(
    todayDate.getTime() + 7 * 24 * 60 * 60 * 1000,
  );
  const [selectionMode, setSelectionMode] = useState<'single' | 'range'>('range');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('Start Date');
  const [dateTo, setDateTo] = useState('End Date');

  // View slots state
  const [viewRangeFrom, setViewRangeFrom] = useState<string>('Start Date');
  const [viewRangeTo, setViewRangeTo] = useState<string>('End Date');
  const [viewCalendarOpen, setViewCalendarOpen] = useState(false);
  const [viewRangeStartMs, setViewRangeStartMs] = useState<number | null>(null);
  const [viewRangeEndMs, setViewRangeEndMs] = useState<number | null>(null);

  // API Availability state
  const [apiAvailability, setApiAvailability] = useState<IProviderDateAvailability[] | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  useEffect(() => {
    handleClearViewRange();
  }, []);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setLocalUserId(id);
          if (viewRangeFrom === 'Start Date' || viewRangeTo === 'End Date') {
            const { start, end } = getThisWeekRange();
            handleFetchAvailability(start, end, id);
          } else {
            handleFetchAvailability(viewRangeFrom, viewRangeTo, id);
          }
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };

    fetchUserId();
  }, []);






  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDayName = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return DAYS[date.getDay()];
  };

  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDatesBetween = (from: string, to: string): string[] => {
    const dates: string[] = [];
    const current = new Date(from + 'T00:00:00');
    const end = new Date(to + 'T00:00:00');

    while (current <= end) {
      dates.push(formatDateString(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const getThisWeekRange = () => {
    // Now acts as a 7-day rolling window starting from Today
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return {
      start: formatDateString(start),
      end: formatDateString(end),
    };
  };

  const handleClearViewRange = (overrideId?: string) => {
    setViewRangeFrom('Start Date');
    setViewRangeTo('End Date');
    setViewRangeStartMs(null);
    setViewRangeEndMs(null);

    // Auto-select today to show this week's slots
    const today = formatDateString(new Date());
    setSelectedDate(today);
    setSelectedDayForSlots(getDayName(today));

    const providerIdToUse = overrideId || localUserId;
    if (providerIdToUse) {
      const { start, end } = getThisWeekRange();
      handleFetchAvailability(start, end, providerIdToUse);
    } else {
      setApiAvailability(null);
    }
  };

  const handleCalendarRangeSelect = (startMs: number, endMs: number) => {
    setCalendarRangeStartMs(startMs);
    setCalendarRangeEndMs(endMs);
    setDateFrom(formatDateString(new Date(startMs)));
    setDateTo(formatDateString(new Date(endMs)));
  };

  const handleViewCalendarRangeSelect = (startMs: number, endMs: number) => {
    const startStr = formatDateString(new Date(startMs));
    const endStr = formatDateString(new Date(endMs));
    setViewRangeStartMs(startMs);
    setViewRangeEndMs(endMs);
    setViewRangeFrom(startStr);
    setViewRangeTo(endStr);

    // Auto-select the first day in the selected range for immediate preview
    setSelectedDate(startStr);
    setSelectedDayForSlots(getDayName(startStr));

    // Fetch availability from API
    handleFetchAvailability(startStr, endStr);
  };

  const getSlotsInDateRange = (fromDate: string, toDate: string) => {
    // Don't process if placeholder strings
    if (fromDate === 'Start Date' || toDate === 'End Date') {
      return [];
    }
    const startDate = new Date(fromDate + 'T00:00:00');
    const endDate = new Date(toDate + 'T00:00:00');
    return slots.filter(slot => {
      const slotDate = new Date(slot.date + 'T00:00:00');
      return slotDate >= startDate && slotDate <= endDate;
    });
  };

  const getUniqueTimeSlots = (slotsArray: TimeSlot[]) => {
    const uniqueRanges = new Map<string, TimeSlot>();
    slotsArray.forEach(slot => {
      uniqueRanges.set(slot.timeRange, slot);
    });
    return Array.from(uniqueRanges.values());
  };

  const convertTo12Hour = (time24: string): string => {
    const [hour, minute] = time24.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    return `${displayHour}:${minute} ${period}`;
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleAddSlots = (showToast = true) => {
    if (selectedDays.length === 0) {
      if (showToast) {
        Toast.show({
          type: 'error',
          text1: 'Select Days',
          text2: 'Please select at least one day of the week.',
        });
      }
      return false;
    }

    const allDates = getDatesBetween(dateFrom, dateTo);
    const newSlots: TimeSlot[] = [];

    const startDisplay = convertTo12Hour(startTime);
    const endDisplay = convertTo12Hour(endTime);
    const timeRangeDisplay = `${startDisplay} - ${endDisplay}`;

    allDates.forEach(dateStr => {
      const dayName = getDayName(dateStr);
      if (selectedDays.includes(dayName)) {
        const duplicate = slots.find(
          s => s.date === dateStr && s.timeRange === timeRangeDisplay
        );
        if (!duplicate) {
          newSlots.push({
            id: Math.random().toString(),
            day: dayName,
            date: dateStr,
            label: timeRangeDisplay,
            timeRange: timeRangeDisplay,
          });
        }
      }
    });

    if (newSlots.length === 0) {
      if (showToast) {
        Toast.show({
          type: 'error',
          text1: 'No New Slots',
          text2: 'All slots already exist for the selected days.',
        });
      }
      return false;
    }

    setSlots([...slots, ...newSlots]);

    if (showToast) {
      Toast.show({
        type: 'success',
        text1: 'Availability Added',
        text2: `Added ${newSlots.length} availability slot(s).`,
      });
    }
    return true;
  };

  const handleDeleteSlot = (id: string) => {
    const deletedSlot = slots.find(s => s.id === id);
    setSlots(slots.filter(s => s.id !== id));
    Toast.show({
      type: 'success',
      text1: 'Slot Removed',
      text2: `Removed availability.`,
    });
  };

  const handleDeleteDateRange = () => {
    const providerId = localUserId;
    if (!providerId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing Provider ID' });
      return;
    }

    if (selectedDays.length === 0) {
      Toast.show({ type: 'error', text1: 'Select Days', text2: 'Please select at least one day.' });
      return;
    }

    Alert.alert(
      'Delete Weekly Pattern',
      `Delete all slots for the selected days (${selectedDays.join(', ')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              for (const day of selectedDays) {
                await deleteProviderSlotsByDay(providerId, day.toLowerCase());
              }
              Toast.show({
                type: 'success',
                text1: 'Slots Deleted',
                text2: `Removed slots for ${selectedDays.length} day(s).`,
              });
              const fromStr = viewRangeFrom === 'Start Date' ? getThisWeekRange().start : viewRangeFrom;
              const toStr = viewRangeTo === 'End Date' ? getThisWeekRange().end : viewRangeTo;
              handleFetchAvailability(fromStr, toStr);
            } catch (error) {
              console.error('Delete slots error:', error);
              Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to delete slots.' });
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const validateAvailabilityForm = () => {
    const providerId = localUserId;
    if (!providerId) {
      Toast.show({
        type: 'error',
        text1: 'Missing Data',
        text2: 'Unable to get provider information. Please try again.',
      });
      return false;
    }

    if (selectedDays.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Select Days',
        text2: 'Please select at least one day of the week.',
      });
      return false;
    }

    if (dateFrom === 'Start Date' || dateTo === 'End Date') {
      Toast.show({
        type: 'error',
        text1: 'Select Date Range',
        text2: 'Please select both start and end dates.',
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateAvailabilityForm()) {
      return;
    }

    handleAddSlots(false);
    setIsSaving(true);

    try {
      const providerId = localUserId;
      const slotData: IProviderSlotsBody = {
        providerId: providerId,
        startDate: dateFrom,
        endDate: dateTo,
        days: selectedDays,
        startTime,
        endTime,
        interval: duration,
      };

      const response: any = await createProviderSlots(slotData);

      if (response?.status === 'success' || response?.data?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Availability Saved',
          text2: 'Your updated hours have been published.',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error Saving',
          text2: response?.message || 'Failed to save availability.',
        });
      }
    } catch (error: any) {
      console.log('Error saving availability:', error);
      Toast.show({
        type: 'error',
        text1: 'Error Saving',
        text2: error?.message || 'Something went wrong.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchAvailability = async (fromDate: string, toDate: string, overrideId?: string) => {
    if (fromDate === 'Start Date' || toDate === 'End Date') {
      setApiAvailability(null);
      return;
    }

    const providerId = overrideId || localUserId;
    if (!providerId) {
      Toast.show({
        type: 'error',
        text1: 'Missing Provider ID',
        text2: 'Unable to fetch availability.',
      });
      return;
    }

    setIsLoadingAvailability(true);
    try {
      const response: any = await getProviderAvailability(providerId, fromDate, toDate);

      if (response?.status === 'success' || response?.data?.status === 'success') {
        const availabilityData = response?.data || response;
        setApiAvailability(availabilityData.dates || []);

        // Auto-select first date if available
        if (availabilityData.dates && availabilityData.dates.length > 0) {
          const firstDate = availabilityData.dates[0].date;
          setSelectedDate(firstDate);
          setSelectedDayForSlots(availabilityData.dates[0].day);
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error Fetching',
          text2: 'Failed to fetch availability.',
        });
        setApiAvailability(null);
      }
    } catch (error: any) {
      console.error('Error fetching availability:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to fetch availability.',
      });
      setApiAvailability(null);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  const handleDeleteApiSlot = (date: string, time: string, status: string) => {
    if (status === 'booked') {
      Toast.show({
        type: 'error',
        text1: 'Cannot Delete',
        text2: 'This slot is already booked by a patient.',
      });
      return;
    }

    Alert.alert(
      'Delete Slot',
      `Are you sure you want to remove the ${convertTo12Hour(time)} slot on ${formatDateDisplay(date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (localUserId) {
                await deleteSelectedProviderSlots(localUserId, date, time);
                Toast.show({
                  type: 'success',
                  text1: 'Slot Removed',
                  text2: 'The availability slot has been deleted.',
                });
                const fromStr = viewRangeFrom === 'Start Date' ? getThisWeekRange().start : viewRangeFrom;
                const toStr = viewRangeTo === 'End Date' ? getThisWeekRange().end : viewRangeTo;
                handleFetchAvailability(fromStr, toStr);
              }
            } catch (error) {
              console.error('Delete slot error:', error);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <StatusBar barStyle="dark-content" backgroundColor="#E0F7E9" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}>
          <ArrowLeft color={PROVIDER_THEME.navy} size={moderateScale(20)} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Availability</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Range Summary Card */}
        <View style={styles.rangeSummaryCard}>
          <View style={styles.rangeTop}>
            <View>
              <Text style={styles.rangeHeader}>DATE RANGE</Text>
              <Text style={styles.rangeText}>
                {dateFrom === 'Start Date' || dateTo === 'End Date'
                  ? 'Start Date - End Date'
                  : `${formatDateDisplay(dateFrom)} - ${formatDateDisplay(dateTo)}`}
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <CalendarIcon color="#E0F7E9" size={moderateScale(24)} />
            </View>
          </View>
          <TouchableOpacity
            style={styles.changeBtn}
            onPress={() => setCalendarOpen(true)}
            activeOpacity={0.8}>
            <Text style={styles.changeBtnText}>Adjust Range</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Card */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle}>Set Weekly Pattern</Text>

          <Text style={styles.fieldLabel}>Active Days</Text>
          <View style={styles.daysRow}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day}
                style={[styles.dayPill, selectedDays.includes(day) && styles.dayPillSelected]}
                onPress={() => toggleDay(day)}
                activeOpacity={0.7}>
                <Text style={[styles.dayPillText, selectedDays.includes(day) && styles.dayPillTextSelected]}>
                  {DAYS_SHORT[DAYS.indexOf(day)]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timeGrid}>
            <View style={styles.timeCell}>
              <Text style={styles.fieldLabel}>Start (24h)</Text>
              <TextInput
                style={styles.styledInput}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
              />
            </View>
            <View style={styles.timeCell}>
              <Text style={styles.fieldLabel}>End (24h)</Text>
              <TextInput
                style={styles.styledInput}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="17:00"
              />
            </View>
            <View style={[styles.timeCell, { flex: 0.6 }]}>
              <Text style={styles.fieldLabel}>Duration</Text>
              <TextInput
                style={styles.styledInput}
                value={duration.toString()}
                onChangeText={v => setDuration(parseInt(v) || 0)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.saveBtn, isSaving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}>
              {isSaving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Check color="#FFF" size={moderateScale(18)} />
                  <Text style={styles.saveBtnText}>Apply & Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteDateRange}
              activeOpacity={0.8}>
              <Trash2 color="#FFF" size={moderateScale(18)} />
              <Text style={styles.deleteBtnText}>Delete Range</Text>
            </TouchableOpacity>

          </View>

        </View>

        {/* Slots Preview - View by Date Range */}
        <View style={styles.previewHeader}>
          <Text style={styles.cardTitle}>View Slots by Date Range:</Text>
          <View style={styles.dateRangeRow}>
            <TouchableOpacity
              style={styles.dateRangeInputSmall}
              onPress={() => setViewCalendarOpen(true)}>
              <Text style={styles.dateRangeInputText} numberOfLines={1}>
                {viewRangeFrom !== 'Start Date' && viewRangeTo !== 'End Date'
                  ? `${formatDateDisplay(viewRangeFrom)} → ${formatDateDisplay(viewRangeTo)}`
                  : 'Start Date → End Date'}
              </Text>
              <CalendarIcon color={PROVIDER_THEME.navy} size={moderateScale(16)} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => handleClearViewRange()}
              activeOpacity={0.7}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayFilterScroll}>
          {(() => {
            const range = (viewRangeFrom === 'Start Date' || viewRangeTo === 'End Date')
              ? getThisWeekRange()
              : { start: viewRangeFrom, end: viewRangeTo };

            return getDatesBetween(range.start, range.end).map(dateStr => {
              const dayName = getDayName(dateStr);
              const dayDate = new Date(dateStr + 'T00:00:00');
              const dayOfMonth = dayDate.getDate();
              const dayOfWeek = DAYS[dayDate.getDay()];

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[styles.filterPill, selectedDate === dateStr && styles.filterPillActive]}
                  onPress={() => {
                    setSelectedDayForSlots(dayName);
                    setSelectedDate(dateStr);
                  }}
                  activeOpacity={0.7}>
                  <Text style={[styles.filterPillText, selectedDate === dateStr && styles.filterPillTextActive]}>
                    {dayOfWeek}
                  </Text>
                  <Text style={[styles.filterPillDate, selectedDate === dateStr && styles.filterPillDateActive]}>
                    {dayOfMonth}
                  </Text>
                </TouchableOpacity>
              );
            });
          })()}
        </ScrollView>

        <View style={styles.slotsPreviewCard}>
          <View style={styles.slotsHeaderRow}>
            <Text style={styles.cardTitle}>Available Slots:</Text>
            {isLoadingAvailability && <ActivityIndicator color={PROVIDER_THEME.navy} size="small" />}
          </View>
          <View style={styles.slotsWrap}>
            {selectedDate && apiAvailability ? (
              (() => {
                const selectedDateData = apiAvailability.find(d => d.date === selectedDate);
                if (!selectedDateData || !selectedDateData.slots) {
                  return <Text style={styles.emptyText}>No slots available for {formatDateDisplay(selectedDate)}</Text>;
                }
                return (
                  <>
                    {selectedDateData.slots.map((slot: IProviderSlot, index: number) => {
                      const [hour, minute] = slot.time.split(':');
                      const h = parseInt(hour);
                      const period = h >= 12 ? 'PM' : 'AM';
                      const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                      const displayTime = `${displayHour}:${minute} ${period}`;

                      const isAvailable = slot.status === 'available';

                      const SlotContainer: any = isAvailable ? TouchableOpacity : View;

                      return (
                        <SlotContainer
                          key={index}
                          activeOpacity={0.7}
                          onPress={isAvailable ? () => handleDeleteApiSlot(selectedDate, slot.time, slot.status) : undefined}
                          style={[
                            styles.apiSlotPill,
                            isAvailable ? styles.apiSlotPillAvailable : styles.apiSlotPillBooked,
                          ]}
                        >
                          <View style={styles.apiSlotMain}>
                            <Clock size={moderateScale(14)} color={isAvailable ? PROVIDER_THEME.navy : '#166534'} />
                            <Text style={[styles.apiSlotTime, isAvailable ? styles.apiSlotTimeAvailable : styles.apiSlotTimeBooked]}>
                              {displayTime}
                            </Text>
                          </View>

                          {isAvailable ? (
                            <View style={styles.apiSlotBadgeAvailable}>
                              <Trash2 size={moderateScale(12)} color="#FFF" />
                            </View>
                          ) : (
                            <View style={styles.apiSlotBadgeBooked}>
                              <Check size={moderateScale(14)} color="#166534" />
                            </View>
                          )}
                        </SlotContainer>
                      );
                    })}
                  </>
                );
              })()
            ) : selectedDate && !apiAvailability ? (
              <Text style={styles.emptyText}>Loading slots for {formatDateDisplay(selectedDate)}...</Text>
            ) : (
              <Text style={styles.emptyText}>Select a date to view slots</Text>
            )}
          </View>
        </View>


        <SettlementCalendarModal
          visible={calendarOpen}
          selectedMs={selectionMode === 'single' ? calendarRangeStartMs : null}
          rangeStartMs={calendarRangeStartMs}
          rangeEndMs={calendarRangeEndMs}
          onClose={() => setCalendarOpen(false)}
          onSelectSingle={(ms: number) => {
            setSelectionMode('single');
            setCalendarRangeStartMs(ms);
            setCalendarRangeEndMs(ms);
            const ds = formatDateString(new Date(ms));
            setDateFrom(ds);
            setDateTo(ds);
            setSelectedDate(ds);
            setCalendarOpen(false);
          }}
          onSelectRange={(startMs: number, endMs: number) => {
            setSelectionMode('range');
            handleCalendarRangeSelect(startMs, endMs);
            setCalendarOpen(false);
          }}
        />

        <SettlementCalendarModal
          visible={viewCalendarOpen}
          rangeStartMs={viewRangeStartMs}
          rangeEndMs={viewRangeEndMs}
          selectedMs={null}
          onClose={() => setViewCalendarOpen(false)}
          onSelectSingle={() => { }}
          onSelectRange={(startMs: number, endMs: number) => {
            handleViewCalendarRangeSelect(startMs, endMs);
            setViewCalendarOpen(false);
          }}
        />
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
  rangeSummaryCard: {
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(20),
    padding: moderateScale(18),
    marginBottom: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  rangeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  rangeHeader: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: 'rgba(224, 247, 233, 0.6)',
    letterSpacing: 0.8,
  },
  rangeText: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#E0F7E9',
    marginTop: 2,
  },
  iconCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(12),
    backgroundColor: '#3D6A9B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C5EBD8',
  },
  changeBtn: {
    backgroundColor: '#E0F7E9',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  changeBtnText: {
    color: '#1D3557',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  whiteCard: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    marginBottom: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  cardTitle: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(14),
  },
  fieldLabel: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.textSoft,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: moderateScale(16),
  },
  dayPill: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    minWidth: moderateScale(40),
    alignItems: 'center',
  },
  dayPillSelected: {
    backgroundColor: PROVIDER_THEME.navy,
  },
  dayPillText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  dayPillTextSelected: {
    color: '#FFF',
  },
  timeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: moderateScale(16),
  },
  timeCell: {
    flex: 1,
  },
  styledInput: {
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    fontWeight: '700',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PROVIDER_THEME.teal,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    flex: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PROVIDER_THEME.error,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 10,
  },
  applyBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  deleteBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(14),
  },
  previewHeader: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginTop: moderateScale(12),
  },
  dayFilterScroll: {
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    borderRadius: moderateScale(10),
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: PROVIDER_THEME.navy,
  },
  filterPillText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  filterPillTextActive: {
    color: '#E0F7E9',
  },
  slotsPreviewCard: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: 16,
    ...PROVIDER_THEME.shadowStyles.card,
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 53, 87, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  slotText: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: PROVIDER_THEME.navy,
  },
  emptyText: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textSoft,
    textAlign: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(16),
    gap: 8,
    ...PROVIDER_THEME.shadowStyles.float,
  },
  btnDisabled: {
    backgroundColor: '#94A3B8', // Use a solid muted color instead of opacity
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(15),
  },
  modeBtn: {
    flex: 1,
    paddingVertical: moderateScale(10),
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modeBtnActive: {
    backgroundColor: PROVIDER_THEME.navy,
  },
  dateInput: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    marginBottom: moderateScale(16),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  dateInputText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  previewContent: {
    marginTop: moderateScale(12),
  },
  previewStats: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.04)',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
  },
  statLabel: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: PROVIDER_THEME.textSoft,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  statSmall: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: PROVIDER_THEME.textSoft,
    marginTop: 2,
  },
  previewNote: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textSoft,
    textAlign: 'center',
    paddingVertical: moderateScale(10),
    fontStyle: 'italic',
  },
  previewLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
    marginBottom: 8,
  },
  selectedDaysPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPreviewPill: {
    backgroundColor: PROVIDER_THEME.teal,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
  },
  dayPreviewText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#FFF',
  },
  viewSection: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  viewHeaderRow: {
    marginBottom: moderateScale(12),
  },
  dateRangeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(14),
  },
  clearBtn: {
    backgroundColor: PROVIDER_THEME.navy,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  dateRangeInputSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  dateRangeInputText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: PROVIDER_THEME.navy,
  },
  filterPillDate: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: PROVIDER_THEME.textSoft,
    marginTop: 2,
  },
  filterPillDateActive: {
    color: '#FFF',
  },
  rangeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  daySelectScroll: {
    marginBottom: moderateScale(12),
  },
  daySelectPill: {
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    borderRadius: moderateScale(12),
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  daySelectPillActive: {
    backgroundColor: '#1D3557',
    borderColor: '#1D3557',
  },
  daySelectText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  daySelectTextActive: {
    color: '#FFF',
  },
  daySlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(61, 188, 138, 0.1)',
    borderWidth: 1.5,
    borderColor: PROVIDER_THEME.teal,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
  },
  timeSlotText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: PROVIDER_THEME.teal,
  },
  noSlotsText: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textSoft,
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
    paddingVertical: moderateScale(12),
  },
  noDateSelectedText: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textSoft,
    fontStyle: 'italic',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  // API Slot Styles
  slotsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  apiSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(10),
    width: '48%',
    borderWidth: 1.5,
  },
  apiSlotMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  apiSlotPillAvailable: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(29, 53, 87, 0.15)',
  },
  apiSlotPillBooked: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  apiSlotTime: {
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  apiSlotTimeAvailable: {
    color: PROVIDER_THEME.navy,
  },
  apiSlotTimeBooked: {
    color: '#166534',
  },
  apiSlotBadgeAvailable: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: PROVIDER_THEME.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiSlotBadgeBooked: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: 'rgba(22, 101, 52, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
