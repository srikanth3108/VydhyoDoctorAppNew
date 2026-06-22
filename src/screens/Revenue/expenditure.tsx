import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
  Alert,
  ActionSheetIOS,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { AuthPost, AuthFetch } from '../../auth/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Import responsive utilities
import {
  responsiveHeight,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utility/responsive';

// iOS calendar wrapper (used only for filter date)
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import CommonHeader from '../../utility/CommonHeader';
import { BillingIcon } from '../../utility/SvgIcons';

interface Expense {
  _id: string;
  description: string;
  date: string;
  amount: number;
  paymentMethod: string;
  notes: string;
}

interface UserState {
  currentUserData: { userId: string } | null;
}

const paymentOptions = [
  { label: 'Cash', value: 'cash' },
  { label: 'Card', value: 'card' },
  { label: 'UPI', value: 'upi' },
  { label: 'Bank Transfer', value: 'bank transfer' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TotalExpenditureScreen: React.FC = () => {
  const user = useSelector((state: any) => state.currentUser);
  const navigation = useNavigation<any>();
  const userId = user?.userId;
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Android date picker state: which picker is open
  const [activeDatePicker, setActiveDatePicker] = useState<
    'filter' | 'form' | null
  >(null);

  // iOS calendar visibility for FILTER date
  const [showFilterCalendar, setShowFilterCalendar] = useState(false);

  // iOS inline picker visibility for FORM date
  const [showFormIOSPicker, setShowFormIOSPicker] = useState(false);

  // Temporary date state for Form calendar
  const [tempFormDate, setTempFormDate] = useState(moment());

  const [formData, setFormData] = useState({
    date: moment(),
    description: '',
    amount: '',
    paymentMethod: 'cash',
    notes: '',
  });

  const [errors, setErrors] = useState({
    description: '',
    amount: '',
  });

  useEffect(() => {
    const today = moment();
    fetchExpenses(today);
    setSelectedDate(today);

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchExpenses = async (start: moment.Moment | null = null) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      setFetching(true);
      let startDate: string | undefined = undefined;
      let endDate: string | undefined = undefined;

      if (start) {
        startDate = start.format('YYYY-MM-DD');
        endDate = startDate;
      }

      const response = await AuthFetch(
        `finance/getExpense/${user.userId}?startDate=${
          startDate ?? ''
        }&endDate=${endDate ?? ''}`,
        token,
      );

      if (response.data.success) {
        setExpenses(response.data.data);
        setTotalExpenses(response.data.data.length);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch expenses. Please try again.',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value) {
      const filtered = expenses.filter(
        expense =>
          expense._id?.toLowerCase().includes(value.toLowerCase()) ||
          expense.description?.toLowerCase().includes(value.toLowerCase()) ||
          expense.notes?.toLowerCase().includes(value.toLowerCase()),
      );
      setExpenses(filtered);
    } else {
      fetchExpenses(selectedDate);
    }
  };

  // Calendar Handlers
  const openFilterCalendar = () => {
    if (Platform.OS === 'android') {
      setActiveDatePicker('filter');
    } else {
      setShowFilterCalendar(true);
    }
  };

  const openFormCalendar = () => {
    if (Platform.OS === 'android') {
      setActiveDatePicker('form');
      setTempFormDate(formData.date);
    } else {
      setTempFormDate(formData.date);
      setShowFormIOSPicker(true);
    }
  };

  // Android DateTimePicker change handler
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'dismissed') {
        setActiveDatePicker(null);
        return;
      }
    }

    if (date) {
      const m = moment(date);
      if (activeDatePicker === 'filter') {
        setSelectedDate(m);
        fetchExpenses(m);
      } else if (activeDatePicker === 'form') {
        setTempFormDate(m);
      }
    }

    if (Platform.OS === 'android') {
      setActiveDatePicker(null);
    }
  };

  // iOS Calendar handlers for FILTER (uses IOSCalendarPicker)
  const handleFilterDateChangeIOS = (date: Date) => {
    const m = moment(date);
    setSelectedDate(m);
    setShowFilterCalendar(false);
    fetchExpenses(m);
  };

  const cancelFilterCalendarIOS = () => {
    setShowFilterCalendar(false);
  };

  // iOS inline picker handler for FORM (Add Expense)
  const handleFormIOSDateChange = (event: any, date?: Date) => {
    if (date) {
      const m = moment(date);
      setTempFormDate(m);
    }
  };

  // Apply date selection for Form calendar
  const applyFormDateSelection = () => {
    setFormData(prev => ({ ...prev, date: tempFormDate }));
    setShowFormIOSPicker(false);
    setActiveDatePicker(null);
  };

  // Cancel date selection for Form calendar
  const cancelFormDateSelection = () => {
    setShowFormIOSPicker(false);
    setActiveDatePicker(null);
  };

  const showModal = () => {
    const now = moment();
    setFormData({
      date: now,
      description: '',
      amount: '',
      paymentMethod: 'cash',
      notes: '',
    });
    setTempFormDate(now);
    setErrors({ description: '', amount: '' });
    setShowFormIOSPicker(false);
    setActiveDatePicker(null);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setErrors({ description: '', amount: '' });
    setActiveDatePicker(null);
    setShowFilterCalendar(false);
    setShowFormIOSPicker(false);
    Keyboard.dismiss();
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { description: '', amount: '' };

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
      isValid = false;
    } else if (!/^[0-9]+(\.[0-9]+)?$/.test(formData.amount)) {
      newErrors.amount = 'Please enter a valid number';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('authToken');

    if (!token) {
      Alert.alert('Error', 'Authentication token missing. Please login ');
      setIsModalVisible(false);
      setTimeout(() => {
        navigation.navigate('Authloader');
      }, 3000);
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId,
        date: formData.date.format('YYYY-MM-DD'),
        description: formData.description,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const response = await AuthPost('finance/createExpense', payload, token);

      if (response?.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Expense created successfully!',
        });
        await fetchExpenses(selectedDate);
        setIsModalVisible(false);
        setErrors({ description: '', amount: '' });
        setActiveDatePicker(null);
        setShowFormIOSPicker(false);
        Keyboard.dismiss();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create expense. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>
        <Text style={styles.label}>Description:</Text>{' '}
        {item.description || 'N/A'}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.label}>Date:</Text>{' '}
        {moment(item.date).format('DD-MMM-YYYY') || 'N/A'}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.label}>Amount:</Text> ₹{item.amount || 'N/A'}
      </Text>
      <Text style={styles.cardText}>
        <Text style={styles.label}>Payment Method:</Text>{' '}
        {item.paymentMethod
          ? item.paymentMethod.charAt(0).toUpperCase() +
            item.paymentMethod.slice(1)
          : 'N/A'}
      </Text>
      {item.notes && (
        <Text style={styles.cardText}>
          <Text style={styles.label}>Notes: </Text>
          {item.notes || 'N/A'}
        </Text>
      )}
    </View>
  );

  const openPaymentMethodPickerIOS = () => {
    const labels = paymentOptions.map(opt => opt.label);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...labels, 'Cancel'],
        cancelButtonIndex: labels.length,
        title: 'Select Payment Method',
      },
      buttonIndex => {
        if (buttonIndex < labels.length) {
          const selected = paymentOptions[buttonIndex];
          setFormData(prev => ({ ...prev, paymentMethod: selected.value }));
        }
      },
    );
  };

  const selectedPaymentLabel =
    paymentOptions.find(opt => opt.value === formData.paymentMethod)?.label ||
    'Select Payment Method';

  const handleInputFocus = (inputName: string) => {
    // Scroll to input when focused (simplified version)
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="All Expenditures" />
      <View style={styles.header}>
        <Text style={styles.title}>All Expenditures</Text>
        <TouchableOpacity style={styles.addButton} onPress={showModal}>
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          placeholder="Search by ID, Description, or Notes"
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={openFilterCalendar}
        >
          <Text style={styles.datePickerText}>
            {selectedDate.format('DD-MM-YYYY')}
          </Text>
        </TouchableOpacity>

        {Platform.OS === 'android' && activeDatePicker === 'filter' && (
          <DateTimePicker
            value={selectedDate.toDate()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={handleDateChange}
          />
        )}
      </View>

      <Text style={styles.sectionTitle}>Transaction History</Text>

      {fetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      ) : expenses.length > 0 ? (
        <FlatList
          data={expenses.slice((currentPage - 1) * 10, currentPage * 10)}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.noDataContainer}>
          <BillingIcon
            size={moderateScale(32)}
            color="#9CA3AF"
          />
          <Text style={styles.noDataText}>No expenses found</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Showing {(currentPage - 1) * 10 + 1} to{' '}
          {Math.min(currentPage * 10, totalExpenses)} of {totalExpenses}
        </Text>
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => setCurrentPage(prev => prev - 1)}
            style={[
              styles.pageButton,
              currentPage === 1 && styles.disabledButton,
            ]}
          >
            <Text style={styles.pageButtonText}>Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>{currentPage}</Text>
          <TouchableOpacity
            disabled={currentPage * 10 >= totalExpenses}
            onPress={() => setCurrentPage(prev => prev + 1)}
            style={[
              styles.pageButton,
              currentPage * 10 >= totalExpenses && styles.disabledButton,
            ]}
          >
            <Text style={styles.pageButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  { maxHeight: SCREEN_HEIGHT * 0.85 - keyboardHeight },
                ]}
              >
                <ScrollView
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={styles.modalTitle}>Add New Expense</Text>

                  <Text style={styles.formLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={openFormCalendar}
                  >
                    <Text style={styles.datePickerText}>
                      {formData.date.format('DD-MM-YYYY')}
                    </Text>
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && showFormIOSPicker && (
                    <View style={styles.calendarWithButtonContainer}>
                      <View style={styles.whiteCalendarContainer}>
                        <DateTimePicker
                          value={tempFormDate.toDate()}
                          mode="date"
                          display="spinner"
                          maximumDate={new Date()}
                          onChange={handleFormIOSDateChange}
                          themeVariant="light"
                          textColor="#000000"
                          style={styles.whiteCalendar}
                        />
                      </View>
                      <View style={styles.calendarButtonRow}>
                        <TouchableOpacity
                          style={[
                            styles.calendarButton,
                            styles.cancelCalendarButton,
                          ]}
                          onPress={cancelFormDateSelection}
                        >
                          <Text style={styles.calendarButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.calendarButton,
                            styles.okCalendarButton,
                          ]}
                          onPress={applyFormDateSelection}
                        >
                          <Text style={styles.calendarButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {Platform.OS === 'android' && activeDatePicker === 'form' && (
                    <View style={styles.calendarWithButtonContainer}>
                      <View style={styles.whiteCalendarContainer}>
                        <DateTimePicker
                          value={tempFormDate.toDate()}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
                          onChange={handleDateChange}
                          theme="light"
                          style={styles.whiteCalendar}
                        />
                      </View>
                      <View style={styles.calendarButtonRow}>
                        <TouchableOpacity
                          style={[
                            styles.calendarButton,
                            styles.cancelCalendarButton,
                          ]}
                          onPress={cancelFormDateSelection}
                        >
                          <Text style={styles.calendarButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.calendarButton,
                            styles.okCalendarButton,
                          ]}
                          onPress={applyFormDateSelection}
                        >
                          <Text style={styles.calendarButtonText}>OK</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <Text style={styles.formLabel}>Description *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.description && styles.inputError,
                    ]}
                    placeholder="e.g., Rent, Salary, Supplies"
                    value={formData.description}
                    onChangeText={text => {
                      setFormData({ ...formData, description: text });
                      setErrors({ ...errors, description: '' });
                    }}
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => handleInputFocus('description')}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}

                  <Text style={styles.formLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={[styles.input, errors.amount && styles.inputError]}
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChangeText={text => {
                      setFormData({ ...formData, amount: text });
                      setErrors({ ...errors, amount: '' });
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => handleInputFocus('amount')}
                  />
                  {errors.amount && (
                    <Text style={styles.errorText}>{errors.amount}</Text>
                  )}

                  <Text style={styles.formLabel}>Payment Method</Text>
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={[styles.input, styles.paymentMethodIOS]}
                      onPress={openPaymentMethodPickerIOS}
                    >
                      <Text style={styles.paymentMethodText}>
                        {selectedPaymentLabel}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.paymentMethod}
                        onValueChange={value =>
                          setFormData({ ...formData, paymentMethod: value })
                        }
                        style={styles.picker}
                      >
                        <Picker.Item label="Cash" value="cash" />
                        <Picker.Item label="Card" value="card" />
                        <Picker.Item label="UPI" value="upi" />
                        <Picker.Item
                          label="Bank Transfer"
                          value="bank transfer"
                        />
                      </Picker>
                    </View>
                  )}

                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Additional notes (optional)"
                    placeholderTextColor="#9CA3AF"
                    value={formData.notes}
                    onChangeText={text =>
                      setFormData({ ...formData, notes: text })
                    }
                    multiline
                    numberOfLines={3}
                    onFocus={() => handleInputFocus('notes')}
                  />

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={handleCancel}
                    >
                      <Text style={styles.modalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.submitButton]}
                      onPress={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalButtonText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {Platform.OS === 'ios' && (
        <IOSCalendarPicker
          visible={showFilterCalendar}
          currentDate={selectedDate.toDate()}
          onConfirm={handleFilterDateChangeIOS}
          onCancel={cancelFilterCalendarIOS}
          title="Select Filter Date"
          mode="date"
          maxDate={new Date()}
        />
      )}

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: moderateScale(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563EB',
    paddingVertical: moderateScale(12),
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT_SIZE.sm),
    fontWeight: '600',
  },
  filters: {
    marginBottom: SPACING.md,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    marginBottom: SPACING.sm,
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#111827',
    marginHorizontal: SPACING.md,
  },
  datePickerButton: {
    backgroundColor: '#F6F6F6',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
  },
  datePickerText: {
    color: '#1977F3',
    fontSize: moderateScale(FONT_SIZE.sm),
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: responsiveHeight(15),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.md,
    borderColor: '#E5E7EB',
    ...LAYOUT.shadow.sm,
  },
  cardText: {
    fontSize: moderateScale(FONT_SIZE.sm),
    marginBottom: SPACING.xs,
    color: '#111827',
    lineHeight: moderateScale(20),
  },
  label: {
    fontWeight: '600',
    color: '#374151',
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: '#666666',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  noDataContainer: {
    padding: responsiveHeight(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: SPACING.md,
    color: '#9CA3AF',
    fontSize: moderateScale(FONT_SIZE.md),
  },
  footer: {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    flexWrap: 'wrap',
    width: '100%',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  footerText: {
    fontSize: moderateScale(FONT_SIZE.xs),
    color: '#666666',
    flex: 1,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    backgroundColor: '#2563EB',
    paddingVertical: moderateScale(8),
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.sm,
    marginHorizontal: SPACING.xs,
    minHeight: moderateScale(36),
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT_SIZE.xs),
    fontWeight: '600',
  },
  pageText: {
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#111827',
    marginHorizontal: SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    maxWidth: moderateScale(500),
    alignSelf: 'center',
    width: '90%',
    marginHorizontal: SPACING.md,
  },
  modalScrollContent: {
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: moderateScale(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  formLabel: {
    fontSize: moderateScale(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#111827',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    marginBottom: SPACING.sm,
    color: 'black',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: moderateScale(FONT_SIZE.xs),
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
  },
  textArea: {
    height: moderateScale(80),
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  picker: {
    height: moderateScale(45),
    color: 'black',
    fontSize: moderateScale(FONT_SIZE.sm),
  },
  paymentMethodIOS: {
    justifyContent: 'center',
  },
  paymentMethodText: {
    fontSize: moderateScale(FONT_SIZE.sm),
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    padding: moderateScale(12),
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minHeight: moderateScale(44),
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  submitButton: {
    backgroundColor: '#2563EB',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT_SIZE.sm),
    fontWeight: '600',
  },
  // New styles for calendar with OK button
  calendarWithButtonContainer: {
    marginBottom: SPACING.sm,
  },
  whiteCalendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
  },
  whiteCalendar: {
    backgroundColor: '#FFFFFF',
  },
  calendarButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  calendarButton: {
    flex: 1,
    padding: moderateScale(10),
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelCalendarButton: {
    backgroundColor: '#EF4444',
  },
  okCalendarButton: {
    backgroundColor: '#2563EB',
  },
  calendarButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(FONT_SIZE.sm),
    fontWeight: '600',
  },
});

export default TotalExpenditureScreen;
