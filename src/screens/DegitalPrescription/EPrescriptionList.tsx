import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthFetch } from '../../auth/auth';

// Import responsive utilities
import {
  responsiveHeight,
  moderateScale,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utility/responsive';

// Import iOS Calendar Picker
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import CommonHeader from '../../utility/CommonHeader';
import {
  CalendarIcon,
  CloseXIcon,
  DropdownIcon,
  MoreVertIcon,
  SearchIcon,
} from '../../utility/SvgIcons';

const { width } = Dimensions.get('window');

const EPrescriptionList = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  // Use 'any' for the selector state to silence the TS error; replace 'any' with your RootState type if available.
  const user = useSelector((state: any) => state?.currentUser);
  const hasGetAppointments = useRef(false);

  const doctorId = user?.role === 'doctor' ? user?.userId : user?.createdBy;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    clinic: 'all',
    type: 'all',
    status: 'scheduled',
    selectedFilterDate: moment(), // Today's date by default
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [hasPreviousPrescriptions, setHasPreviousPrescriptions] =
    useState(false);

  // iOS Calendar State
  const [showFilterCalendar, setShowFilterCalendar] = useState(false);
  const [filterCalendarDate, setFilterCalendarDate] = useState<Date>(
    new Date(),
  );

  // iOS Type Dropdown State
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [typeDropdownPosition, setTypeDropdownPosition] = useState({
    x: 0,
    y: 0,
  });

  const convertTo12HourFormat = (time24: string) => {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':');
    const hourInt = parseInt(hours, 10);

    const period = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12; // Convert 0 to 12 for 12 AM

    return `${hour12}:${minutes} ${period}`;
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      scheduled: {
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        text: 'Scheduled',
      },
      completed: {
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        text: 'Completed',
      },
      rescheduled: {
        color: '#8B5CF6',
        backgroundColor: '#EDE9FE',
        text: 'Rescheduled',
      },
      canceled: {
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        text: 'Canceled',
      },
    };
    return (
      statusConfig[status] || {
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        text: status,
      }
    );
  };

  const handleEPrescription = (appointment: any) => {
    const patientDetails = {
      doctorId: appointment.doctorId,
      patientId: appointment?.userId || appointment?.appointmentId,
      patientName: appointment.patientName,
      appointmentDate: appointment.appointmentDate,
      appointmentType: appointment.appointmentType,
      appointmentId: appointment?.appointmentId,
      phone: appointment.patientDetails?.mobile || 'N/A',
      clinic: appointment.clinicName || 'Unknown Clinic',
      type: appointment.appointmentType,
      date: appointment.appointmentDate
        ? appointment.appointmentDate.slice(0, 10)
        : 'Unknown Date',
      status: appointment.appointmentStatus,
      statusColor:
        appointment.appointmentStatus === 'Completed' ? '#E0E7FF' : '#D1FAE5',
      typeIcon: 'General',
      avatar: 'https://i.pravatar.cc/150?img=12',
      appointmentTime: appointment.appointmentTime
        ? convertTo12HourFormat(appointment.appointmentTime)
        : '',
      addressId: appointment.addressId,
    };

    navigation.navigate('PatientDetails', { patientDetails });
    setMenuVisible(false);
  };

  const checkPreviousPrescriptions = async (patientId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return false;

      const response = await AuthFetch(
        `pharmacy/getEPrescriptionByPatientId/${patientId}`,
        token,
      );

      return (
        response.status === 'success' &&
        response?.data.success &&
        response?.data.data &&
        response.data.data.length > 0
      );
    } catch (error) {
      return false;
    }
  };

  const handleViewPreviousPrescriptions = async appointment => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication token not found. Please log in again.',
          position: 'top',
          visibilityTime: 3000,
        });
        dispatch({ type: 'currentUser', payload: null });
        dispatch({ type: 'currentUserID', payload: null });
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        navigation.navigate('Login');
        return;
      }

      const patientId = appointment.userId;
      if (!patientId) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Patient ID not found',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      const response = await AuthFetch(
        `pharmacy/getEPrescriptionByPatientId/${patientId}`,
        token,
      );

      if (response.status === 'success' && response.data.success) {
        navigation.navigate('PreviousPrescription', {
          prescriptions: response.data.data,
          patientName: appointment.patientName,
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            response.data?.message || 'Failed to fetch previous prescriptions',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error fetching previous prescriptions',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
      setMenuVisible(false);
    }
  };

  const openMenu = async (appointment, event) => {
    const { pageX, pageY } = event.nativeEvent;
    setSelectedAppointment(appointment);
    const hasPrescriptions = await checkPreviousPrescriptions(
      appointment.userId,
    );
    setHasPreviousPrescriptions(hasPrescriptions);

    const modalWidth = 200;
    const xPos = pageX + modalWidth > width ? pageX - modalWidth : pageX - 50;

    setMenuPosition({
      x: Math.max(0, Math.min(xPos, width - modalWidth)),
      y: pageY + 10,
    });

    setMenuVisible(true);
  };

  const getAppointments = async (page = 1, limit = 5) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        dispatch({ type: 'currentUser', payload: null });
        dispatch({ type: 'currentUserID', payload: null });
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        return;
      }

      const queryParams = new URLSearchParams({
        doctorId,
        status: 'scheduled',
        ...(searchText && { searchText: searchText.trim() }),
        ...(filters.clinic !== 'all' && { clinic: filters.clinic }),
        ...(filters.type !== 'all' && { appointmentType: filters.type }),
        ...(filters.selectedFilterDate && {
          date: filters.selectedFilterDate.format('YYYY-MM-DD'),
        }),
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await AuthFetch(
        `appointment/getAppointmentsByDoctorID/appointment?${queryParams.toString()}`,
        token,
      );

      if (response.status === 'success') {
        const { appointments, pagination } = response.data.data;
        setAppointments(appointments);
        setPagination({
          current: pagination.currentPage,
          pageSize: pagination.pageSize,
          total: pagination.totalItems,
        });
      } else if (
        response.status === 'error' &&
        response.message.includes('Unauthorized')
      ) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Session expired. Please log in again.',
          position: 'top',
          visibilityTime: 3000,
        });
        dispatch({ type: 'currentUser', payload: null });
        dispatch({ type: 'currentUserID', payload: null });
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to fetch appointments',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error fetching appointments',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsCount = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication token not found. Please log in again.',
          position: 'top',
          visibilityTime: 3000,
        });
        dispatch({ type: 'currentUser', payload: null });
        dispatch({ type: 'currentUserID', payload: null });
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        navigation.navigate('Login');
        return;
      }

      const queryParams = new URLSearchParams({
        doctorId,
        status: 'scheduled',
      });

      const response = await AuthFetch(
        `appointment/getAppointmentsCountByDoctorID?${queryParams.toString()}`,
        token,
      );

      if (response.status === 'success') {
        const count = response?.data?.data;
      } else if (
        response.status === 'error' &&
        response.message.includes('Unauthorized')
      ) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Session expired. Please log in again.',
          position: 'top',
          visibilityTime: 3000,
        });
        dispatch({ type: 'currentUser', payload: null });
        dispatch({ type: 'currentUserID', payload: null });
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('userId');
        navigation.navigate('Login');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.message || 'Failed to fetch appointments count',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error fetching appointments count',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && doctorId && !hasGetAppointments.current) {
      getAppointments();
      getAppointmentsCount();
      hasGetAppointments.current = true;
    }
  }, [user, doctorId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      getAppointments();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      setFilterCalendarDate(new Date());
      setShowFilterCalendar(true);
    }
  };

  const handleDateChangeAndroid = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFilters(prev => ({
        ...prev,
        selectedFilterDate: moment(selectedDate),
      }));
    }
  };

  const handleFilterDateChangeIOS = (date: Date) => {
    setFilters(prev => ({
      ...prev,
      selectedFilterDate: moment(date),
    }));
    setShowFilterCalendar(false);
  };

  const cancelFilterCalendarIOS = () => {
    setShowFilterCalendar(false);
  };

  const openTypePicker = event => {
    if (Platform.OS === 'android') {
      return;
    } else {
      const { pageX, pageY } = event.nativeEvent;
      const modalWidth = moderateScale(200);
      const xPos = pageX + modalWidth > width ? pageX - modalWidth : pageX - 50;

      setTypeDropdownPosition({
        x: Math.max(0, Math.min(xPos, width - modalWidth)),
        y: pageY + 40,
      });
      setShowTypeDropdown(true);
    }
  };

  const typeOptions = [
    { label: 'All Types', value: 'all' },
    { label: 'New Walk-in', value: 'new-walkin' },
    { label: 'New Home Care', value: 'new-homecare' },
    { label: 'Follow-up Walk-in', value: 'followup-walkin' },
    { label: 'Follow-up Video', value: 'followup-video' },
    { label: 'Follow-up Home Care', value: 'followup-homecare' },
  ];

  const renderActionMenu = () => (
    <Modal
      transparent={true}
      visible={menuVisible}
      onRequestClose={() => setMenuVisible(false)}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
        <View style={styles.modalOverlay} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.menuContainer,
          { left: menuPosition.x, top: menuPosition.y },
        ]}
      >
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleEPrescription(selectedAppointment)}
        >
          <Text style={styles.menuItemText}>Create Prescription</Text>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity
          style={[
            styles.menuItem,
            !hasPreviousPrescriptions && styles.disabledMenuItem,
          ]}
          onPress={() =>
            hasPreviousPrescriptions &&
            handleViewPreviousPrescriptions(selectedAppointment)
          }
          disabled={!hasPreviousPrescriptions}
        >
          <Text
            style={[
              styles.menuItemText,
              !hasPreviousPrescriptions && styles.disabledText,
            ]}
          >
            Previous Prescriptions
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );

  const renderItem = ({ item }) => {
    const status = getStatusTag(item.appointmentStatus);
    try {
      return (
        <View style={styles.appointmentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>
                {item.patientName || 'N/A'}
              </Text>
              <Text style={styles.department}>
                {item.appointmentDepartment || 'N/A'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={event => openMenu(item, event)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertIcon size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {item.appointmentType || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: status.backgroundColor },
                  ]}
                >
                  <Text style={[styles.statusText, { color: status.color }]}>
                    {status.text || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>
                  {item.appointmentDate &&
                  moment(item.appointmentDate).isValid()
                    ? moment(item.appointmentDate).format('DD-MMM-YYYY')
                    : 'N/A'}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {item.appointmentTime &&
                  moment(item.appointmentTime, 'HH:mm').isValid()
                    ? moment(item.appointmentTime, 'HH:mm').format('hh:mm A')
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    } catch (err) {
      console.error('EPrescriptionList renderItem error:', err, 'item:', item);
      return (
        <View
          style={[
            styles.appointmentCard,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={styles.patientName}>Unable to render appointment</Text>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >

      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Patient Name or Appointment ID"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <CloseXIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Type</Text>
            {Platform.OS === 'android' ? (
              <View style={styles.pickerButton}>
                <Picker
                  selectedValue={filters.type}
                  style={styles.picker}
                  onValueChange={value => handleFilterChange('type', value)}
                  itemStyle={styles.pickerItem}
                >
                  <Picker.Item label="All Types" value="all" />
                  <Picker.Item label="New Walk-in" value="new-walkin" />
                  <Picker.Item label="New Home Care" value="new-homecare" />
                  <Picker.Item
                    label="Follow-up Walk-in"
                    value="followup-walkin"
                  />
                  <Picker.Item label="Follow-up Video" value="followup-video" />
                  <Picker.Item
                    label="Follow-up Home Care"
                    value="followup-homecare"
                  />
                </Picker>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={event => openTypePicker(event)}
              >
                <Text style={styles.pickerText}>
                  {typeOptions.find(opt => opt.value === filters.type)?.label ||
                    'All Types'}
                </Text>
                <DropdownIcon
                  size={22}
                  color="#6B7280"
                  style={styles.pickerIcon}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Date</Text>

            <TouchableOpacity
              style={styles.pickerButton}
              onPress={openDatePicker}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <CalendarIcon size={16} color="#6B7280" />
                <Text style={styles.pickerText}>
                  {filters.selectedFilterDate &&
                  filters.selectedFilterDate.isValid()
                    ? filters.selectedFilterDate.format('DD-MMM-YYYY')
                    : 'Select Date'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={handleDateChangeAndroid}
          />
        )}
      </View>

      <FlatList
        data={appointments}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.appointmentId
            ? String(item.appointmentId)
            : `appointment-${index}`
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => {
          if (pagination.current * pagination.pageSize < pagination.total) {
            getAppointments(pagination.current + 1, pagination.pageSize);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No appointments found</Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? 'Try adjusting your search or filters'
                  : 'Schedule appointments will appear here'}
              </Text>
            </View>
          ) : null
        }
      />

      {renderActionMenu()}

      {Platform.OS === 'ios' && showTypeDropdown && (
        <Modal
          visible={showTypeDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTypeDropdown(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowTypeDropdown(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.typeDropdown,
              { left: typeDropdownPosition.x, top: typeDropdownPosition.y },
            ]}
          >
            {typeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.typeOption}
                onPress={() => {
                  handleFilterChange('type', option.value);
                  setShowTypeDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    filters.type === option.value && styles.selectedTypeOption,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Modal>
      )}

      {Platform.OS === 'ios' && (
        <IOSCalendarPicker
          visible={showFilterCalendar}
          currentDate={filterCalendarDate}
          onConfirm={handleFilterDateChangeIOS}
          onCancel={cancelFilterCalendarIOS}
          title="Select Appointment Date"
          mode="date"
          maxDate={new Date()}
        />
      )}

      <Toast position="top" visibilityTime={3000} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  filterContainer: {
    width: '48%', // Equal width for both Type and Date pickers
  },
  filterLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: '#374151',
    marginBottom: SPACING.xxs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.sm,
    height: moderateScale(44), // Fixed height for consistency
    justifyContent: 'space-between',
  },
  picker: {
    flex: 1,
    color: '#374151',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  pickerItem: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: '#374151',
  },
  pickerIcon: {
    marginLeft: SPACING.xs,
  },
  pickerText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: '#374151',
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  listContainer: {
    padding: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.xl,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#111827',
    marginBottom: SPACING.xxs,
  },
  department: {
    fontSize: FONT_SIZE.sm,
    color: '#6B7280',
  },
  menuButton: {
    padding: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
  },
  cardBody: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: SPACING.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: '#374151',
  },
  statusTag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.xs,
    ...LAYOUT.shadow.md,
    minWidth: moderateScale(200),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  menuItemText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.md,
    color: '#374151',
    fontWeight: '500',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: SPACING.xxs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(10),
  },
  emptyTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: '#374151',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.sm,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  /* iOS Type Dropdown Styles */
  typeDropdown: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.xs,
    ...LAYOUT.shadow.md,
    minWidth: moderateScale(200),
    maxHeight: moderateScale(300),
  },
  typeOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  typeOptionText: {
    fontSize: FONT_SIZE.md,
    color: '#374151',
  },
  selectedTypeOption: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default EPrescriptionList;
