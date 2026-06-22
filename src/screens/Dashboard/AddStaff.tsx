import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Pressable,
} from 'react-native';
import { ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { AuthPost, AuthFetch } from '../../auth/auth';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckMarkIcon } from '../../utility/SvgIcons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

// Import responsive utilities
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  moderateScale,
  responsiveWidth,
  isTablet,
  PLATFORM,
  ICON_SIZE,
} from '../../utility/responsive';

// Import iOS Calendar Picker
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import CommonHeader from '../../utility/CommonHeader';

const AddStaffScreen = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId = currentuserDetails.role === "doctor" ? currentuserDetails.userId : currentuserDetails.createdBy;
  const userId = currentuserDetails.userId;
  const navigation = useNavigation<any>();

  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);
  const [roleItems, setRoleItems] = useState([
    { label: "Select Role", value: "" },
    { label: "Lab Assistant", value: "lab_assistant" },
    { label: "Pharmacy Assistant", value: "pharmacy_assistant" },
    { label: "Assistant", value: "assistant" },
    { label: "Receptionist", value: "receptionist" }
  ]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    DOB: '',
    gender: 'Male',
    mobile: '',
    email: '',
    role: '',
    access: [] as string[],
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    DOB: '',
    mobile: '',
    email: '',
    role: '',
    access: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // iOS Calendar State
  const [showDOBCalendar, setShowDOBCalendar] = useState(false);
  const [DOBCalendarDate, setDOBCalendarDate] = useState<Date>(new Date());

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      firstName: '',
      lastName: '',
      DOB: '',
      mobile: '',
      email: '',
      role: '',
      access: '',
    };

    if (!form.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }
    if (!form.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }
    if (!form.DOB) {
      newErrors.DOB = 'Date of birth is required';
      isValid = false;
    }
    if (!form.mobile) {
      newErrors.mobile = 'Mobile number is required';
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
      isValid = false;
    }
    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }
    if (!form.role) {
      newErrors.role = 'Role is required';
      isValid = false;
    }
    if (!form.access || form.access.length === 0) {
      newErrors.access = 'At least one access permission is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleDateSelection(selectedDate);
    }
  };

  // Calendar Handlers
  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      const defaultDate = new Date();
      defaultDate.setFullYear(defaultDate.getFullYear());
      setDOBCalendarDate(defaultDate);
      setShowDOBCalendar(true);
    }
  };

  const handleDateSelection = (selectedDate: Date) => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate > today) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Date',
          text2: 'Date of birth cannot be in the future',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }

      const formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}-${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${selectedDate.getFullYear()}`;
      setForm({ ...form, DOB: formattedDate });
      setErrors({ ...errors, DOB: '' });
    }

  const handleDOBDateChangeIOS = (date: Date) => {
    handleDateSelection(date);
    setShowDOBCalendar(false);
  };

  const cancelDOBCalendarIOS = () => {
    setShowDOBCalendar(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const staffData = {
      firstname: form.firstName,
      lastname: form.lastName,
      DOB: form.DOB,
      gender: form.gender,
      mobile: form.mobile,
      email: form.email,
      role: form.role,
      access: form.access,
    };

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!userId) {
        Alert.alert('Error', 'User ID not found');
        return;
      }

      const response = await AuthPost(`doctor/createReceptionist/${userId}`, staffData, token);
      if (response.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Staff Added Successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        setForm({
          firstName: '',
          lastName: '',
          DOB: '',
          gender: 'Male',
          mobile: '',
          email: '',
          role: '',
          access: [] as string[],
        });
        setErrors({
          firstName: '',
          lastName: '',
          DOB: '',
          mobile: '',
          email: '',
          role: '',
          access: '',
        });
        navigation.navigate('StaffManagement' as never);
      } else if (response.status === 'error') {
        const message =
          (response && 'message' in response && response.message?.message) ||
          (response && 'message' in response && typeof response.message === 'string' && response.message) ||
          'Failed to create staff';
        Alert.alert('Error', message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  const keyboardVerticalOffset = Platform.select({ ios: moderateScale(100), android: moderateScale(80) }) as number;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <CommonHeader title="Add Staff" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: SPACING.xxl + PLATFORM.BOTTOM_SAFE_AREA }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formWrapper}>
            <Text style={styles.title}>Add New Staff Member</Text>
            <Text style={styles.subtitle}>Fill in the details below to add a new staff member</Text>

            <Text style={styles.label}>First Name*</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="Enter first name"
              value={form.firstName}
              onChangeText={(text) => {
                const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
                setForm({ ...form, firstName: filteredText });
                setErrors({ ...errors, firstName: '' });
              }}
              placeholderTextColor={'gray'}
            />
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Enter last name"
              value={form.lastName}
              placeholderTextColor={'gray'}
              onChangeText={(text) => {
                const filteredText = text.replace(/[^a-zA-Z\s]/g, '');
                setForm({ ...form, lastName: filteredText });
                setErrors({ ...errors, lastName: '' });
              }}
            />
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

            <Text style={styles.label}>Date of Birth*</Text>
            <TouchableOpacity
              style={[styles.input, styles.dateInput, errors.DOB && styles.inputError]}
              onPress={openDatePicker}
            >
              <Text style={{ color: form.DOB ? '#000' : '#9CA3AF', fontSize: FONT_SIZE.md }}>
                {form.DOB || 'DD-MM-YYYY'}
              </Text>
            </TouchableOpacity>
            {errors.DOB ? <Text style={styles.errorText}>{errors.DOB}</Text> : null}

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={new Date()} // Always show today's date by default
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

            {Platform.OS === 'ios' && (
              <IOSCalendarPicker
                visible={showDOBCalendar}
                currentDate={DOBCalendarDate}
                onConfirm={handleDOBDateChangeIOS}
                onCancel={cancelDOBCalendarIOS}
                title="Select Date of Birth"
                mode="date"
                minDate={new Date(1900, 0, 1)}
                maxDate={new Date()}
              />
            )}

            <Text style={styles.label}>Gender*</Text>
            <View style={styles.genderGroup}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.radioButton}
                  onPress={() => setForm({ ...form, gender: g })}
                >
                  <View style={[styles.radioCircle, form.gender === g && styles.selectedRadio]} />
                  <Text style={styles.radioText}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Mobile Number*</Text>
            <TextInput
              style={[styles.input, errors.mobile && styles.inputError]}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={form.mobile}
              maxLength={10}
              onChangeText={(text) => {
                const digitsOnly = text.replace(/\D/g, '');
                setForm({ ...form, mobile: digitsOnly });
                setErrors({ ...errors, mobile: '' });
              }}
              placeholderTextColor={'gray'}
            />
            {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

            <Text style={styles.label}>Email*</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter email address"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => {
                setForm({ ...form, email: text });
                setErrors({ ...errors, email: '' });
              }}
              placeholderTextColor={'gray'}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <Text style={styles.label}>Role*</Text>

            <View style={{ zIndex: 3000 }}>
              <DropDownPicker
                open={openRoleDropdown}
                value={form.role}
                items={roleItems}
                setOpen={setOpenRoleDropdown}
                setValue={(callback) => {
                  setForm((prev) => ({ ...prev, role: callback(prev.role) }));
                  setErrors({ ...errors, role: '' });
                }}
                setItems={setRoleItems}
                placeholder="Select Role"
                style={[styles.dropdown, errors.role && styles.inputError]}
                dropDownContainerStyle={styles.dropdownList}
                textStyle={{ color: '#000', fontSize: FONT_SIZE.md }}
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>
            {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

            <Text style={styles.label}>Access*</Text>
              {[
              { value: "my-patients", label: "My Patients" },
              { value: "appointments", label: "Appointments" },
              { value: "labs", label: "Labs" },
              { value: "dashboard", label: "Dashboard" },
              { value: "pharmacy", label: "Pharmacy" },
              { value: "availability", label: "Availability" },
              { value: "staff-management", label: "Staff Management" },
              { value: "clinic-management", label: "Clinic Management" },
              { value: "pin-management", label: "PIN Management" },
              { value: "billing", label: "Billing" },
              { value: "reviews", label: "Reviews" },
              ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.checkboxRow}
                onPress={() => {
                  setForm((prev) => {
                    const exists = prev.access.includes(item.value);
                    return {
                      ...prev,
                      access: exists
                        ? prev.access.filter((val) => val !== item.value)
                        : [...prev.access, item.value],
                    };
                  });
                  setErrors({ ...errors, access: '' });
                }}
              >
                <View style={[styles.checkboxSquare, form.access.includes(item.value) && styles.checkboxSquareChecked]}>
                  {form.access.includes(item.value) && (
                    <CheckMarkIcon size={ICON_SIZE.xs} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            {errors.access ? <Text style={styles.errorText}>{errors.access}</Text> : null}
          <View style={{ height: SPACING.xxl }} />

          <TouchableOpacity
            style={[styles.addButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Staff</Text>
            )}
          </TouchableOpacity>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default AddStaffScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: isTablet ? SPACING.xl : SPACING.md,
  },
  formWrapper: {
    paddingTop: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
    color: 'black',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: '#6B7280',
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xs,
    fontWeight: '500',
    color: 'black',
  },
  input: {
    height: LAYOUT.inputHeight,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.sm,
    color: '#18191bff',
    fontSize: FONT_SIZE.input,
  },
  dateInput: {
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
  },
  genderGroup: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: SPACING.xs,
  },
  selectedRadio: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  radioText: {
    fontSize: FONT_SIZE.md,
    color: '#374151',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  addButton: {
    height: LAYOUT.buttonHeight,
    backgroundColor: '#10B981',
    borderRadius: LAYOUT.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: PLATFORM.BOTTOM_SAFE_AREA + SPACING.lg,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: FONT_SIZE.lg,
  },
  dropdown: {
    borderColor: '#D1D5DB',
    height: LAYOUT.inputHeight,
    marginBottom: SPACING.lg,
  },
  dropdownList: {
    borderColor: '#D1D5DB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  checkboxLabel: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZE.lg,
    color: '#374151',
  },
  checkboxSquare: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
});