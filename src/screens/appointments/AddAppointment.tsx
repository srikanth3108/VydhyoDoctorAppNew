import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Modal,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { WarningIcon } from '../../utility/SvgIcons';
import { RadioButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPost, AuthFetch, AuthPut } from '../../auth/auth';
import { Picker } from '@react-native-picker/picker';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  moderateScale,
  isTablet,
  ICON_SIZE,
} from '../../utility/responsive';
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import { CloseXIcon, SearchIcon } from '../../utility/SvgIcons';
import CommonHeader from '../../utility/CommonHeader';

const AddAppointment = () => {
  const userId = useSelector((state: any) => state.currentUserId);
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;
  const currentDoctor = useSelector((state: any) => state.currentDoctor);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [gender, setGender] = useState('Male');
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('cash');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const navigation = useNavigation<any>();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasPreviousAppointments, setHasPreviousAppointments] = useState(false);
  const [noSlotsModalVisible, setNoSlotsModalVisible] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [patientformData, setpatientFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    age: '',
    mobile: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    age: '',
    gender: '',
    appointmentType: '',
    department:
      currentuserDetails?.specialization?.name ||
      currentDoctor?.specialization?.name ||
      '',
    appointmentDate: `${new Date().getDate().toString().padStart(2, '0')}-${(
      new Date().getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${new Date().getFullYear()}`,
    selectedTime: '',
    paymentMethod: 'UPI Payment',
    visitReason: '',
    fee: currentuserDetails?.consultationModeFee?.[0]?.fee?.toString() || '',
    clinicName: '',
    clinicAddressId: '',
    discount: '0', // Added for discount
    discountType: 'percentage', // Added for discount type - can be 'percentage' or 'flat'
    walkinDoctorRegistrationNumber: '', // New Field
    walkinReferredBy: '',
  });
  const [patientId, setPatientId] = useState<string>('');
  const [userData, setUserDate] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showappointmentDatePicker, setShowappointmentDatePicker] =
    useState(false);
  const [activeclinicsData, setActiveclinicsData] = useState<any[]>([]);
  const [patientNames, setPatientNames] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [isPatientAdded, setIsPatientAdded] = useState(false);
  const [patientCreated, setPatientCreated] = useState(false);
  const [fieldsDisabled, setFieldsDisabled] = useState(false);
  const [patientSelectModalVisible, setPatientSelectModalVisible] =
    useState(false);
  const [existingPatientModalVisible, setExistingPatientModalVisible] =
    useState(false);
  const [existingPatientData, setExistingPatientData] = useState<any>(null);
  const [appointmentSectionEnabled, setAppointmentSectionEnabled] =
    useState(false);
  const [isExistingPatientSelected, setIsExistingPatientSelected] =
    useState(false);

  // Edit Patient States
  const [isEditPatientMode, setIsEditPatientMode] = useState(false);
  const [isEditingPatientLoading, setIsEditingPatientLoading] = useState(false);
  const [editPatientSnapshot, setEditPatientSnapshot] = useState<any>(null);
  const [selectedPatientIndex, setSelectedPatientIndex] = useState<
    number | null
  >(null);
  // iOS Date Picker States
  const [showPatientCalendar, setShowPatientCalendar] = useState(false);
  const [patientCalendarDate, setPatientCalendarDate] = useState<Date>(
    new Date(),
  );
  const [showAppointmentCalendar, setShowAppointmentCalendar] = useState(false);
  const [appointmentCalendarDate, setAppointmentCalendarDate] = useState<Date>(
    new Date(),
  );

  // iOS Dropdown States
  const [showAppointmentTypeModal, setShowAppointmentTypeModal] =
    useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showDiscountTypeModal, setShowDiscountTypeModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const validateAge = (age: string): boolean => {
    if (!age) return false;
    const trimmed = age.trim();
    return /^\d+$/.test(trimmed) || /^(\d+[myd])(\s?\d+[myd])*$/i.test(trimmed);
  };

  // Calculate age from DOB
  const calculateAgeFromDOB = (dob: string): string => {
    if (!dob) return '';
    try {
      const [day, month, year] = dob.split('-').map(Number);
      const dobDate = new Date(year, month - 1, day);
      const today = new Date();
      if (dobDate > today) return '0d';

      const diffMs = today.getTime() - dobDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365.25);
      const remainingDaysAfterYears = diffDays - years * 365.25;
      const months = Math.floor(remainingDaysAfterYears / 30.44);
      const days = Math.round(remainingDaysAfterYears - months * 30.44);

      let ageText = '';
      if (years > 0) ageText += `${years}y `;
      if (months > 0) ageText += `${months}m `;
      if (days > 0 || ageText === '') ageText += `${days}d`;
      return ageText.trim();
    } catch (error) {
      return '';
    }
  };

  const validateRequiredFields = () => {
    const requiredPatientFields = [
      patientformData.firstName,
      patientformData.gender,
      patientformData.mobile,
      patientformData.age,
    ];

    const requiredAppointmentFields = [
      formData.appointmentType,
      formData.appointmentDate,
      formData.clinicAddressId,
      // formData.selectedTime,
      formData.fee,
    ];

    return (
      !requiredPatientFields.some(field => !field) &&
      !requiredAppointmentFields.some(field => !field) &&
      patientId
    ); // Patient must be created or selected
  };

  const fetchQRCode = useCallback(
    async (clinicId: string) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;
        const response: any = await AuthFetch(
          `users/getClinicsQRCode/${clinicId}?userId=${doctorId}`,
          token,
        );
        if (response?.status === 'success') {
          const raw =
            response.data?.data?.clinicQrCode ??
            response.data?.data?.qrCodeUrl ??
            response.data?.clinicQrCode ??
            response.data?.qrCodeUrl ??
            response.data?.data ??
            null;

          const normalized =
            typeof raw === 'string'
              ? raw
              : raw?.Location || raw?.url || raw?.uri || '';

          setQrCodeUrl(normalized || '');
        } else {
          setQrCodeUrl('');
        }
      } catch (error) {
        setQrCodeUrl('');
      }
    },
    [doctorId],
  );

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    let validatedValue = value;

    if (field === 'firstName' || field === 'lastName') {
      validatedValue = value.replace(/[^A-Za-z ]/g, '');
    } else if (field === 'mobile' || field === 'phoneNumber') {
      let digitsOnly = value.replace(/\D/g, '');

      // Don't allow numbers starting with 0-5 for mobile numbers
      if (digitsOnly.length === 1 && !/^[6-9]/.test(digitsOnly)) {
        // Don't update state for invalid first digit
        return;
      }

      // Limit to 10 digits
      if (digitsOnly.length > 10) {
        digitsOnly = digitsOnly.slice(0, 10);
      }

      validatedValue = digitsOnly;
    } else if (field === 'age') {
      validatedValue = value
        .replace(/[^0-9myd\s]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (validatedValue.length > 20)
        validatedValue = validatedValue.slice(0, 20);
      if (validatedValue && !validateAge(validatedValue)) {
        setFieldErrors(prev => ({
          ...prev,
          age: 'Invalid format. Use e.g., 7, 1m, 2y, 15d, 1m 2d',
        }));
      }
    } else if (field === 'visitReason' && value.length > 500) {
      validatedValue = value.substring(0, 500);
    } else if (field === 'discount') {
      const numValue = value.replace(/\D/g, '');

      if (numValue === '') {
        validatedValue = '';
      } else {
        const discountValue = Number(numValue);
        const feeValue = Number(formData.fee || 0);

        if (formData.discountType === 'percentage') {
          // For percentage: allow 0-100%
          if (discountValue >= 0 && discountValue <= 100) {
            validatedValue = numValue;
          } else {
            validatedValue = formData.discount;
          }
        } else {
          // For flat amount: allow 0 to fee amount
          if (discountValue >= 0 && discountValue <= feeValue) {
            validatedValue = numValue;
          } else {
            validatedValue = formData.discount;
          }
        }
      }
    }
    setpatientFormData(prev => {
      const newData = { ...prev, [field]: validatedValue };

      if (field === 'dob') {
        if (value) {
          const calculatedAge = calculateAgeFromDOB(value);
          if (calculatedAge) newData.age = calculatedAge;
        } else {
          newData.age = '';
        }
      } else if (
        field === 'age' &&
        validatedValue &&
        validateAge(validatedValue)
      ) {
        const today = new Date();
        let calculatedDOB = new Date(today);

        if (/^\d+$/.test(validatedValue)) {
          // If plain number, assume years
          calculatedDOB.setFullYear(
            today.getFullYear() - parseInt(validatedValue),
          );
        } else {
          // Use regex to find all number-unit pairs (with or without spaces)
          const ageParts = validatedValue.match(/\d+[myd]/gi) || [];

          ageParts.forEach(part => {
            const match = part.match(/(\d+)([myd])/i);
            if (match) {
              const value = parseInt(match[1]);
              const unit = match[2].toLowerCase();
              if (unit === 'y')
                calculatedDOB.setFullYear(calculatedDOB.getFullYear() - value);
              else if (unit === 'm')
                calculatedDOB.setMonth(calculatedDOB.getMonth() - value);
              else if (unit === 'd')
                calculatedDOB.setDate(calculatedDOB.getDate() - value);
            }
          });
        }

        const day = String(calculatedDOB.getDate()).padStart(2, '0');
        const month = String(calculatedDOB.getMonth() + 1).padStart(2, '0');
        const year = calculatedDOB.getFullYear();
        newData.dob = `${day}-${month}-${year}`;
      }

      return newData;
    });

    if (field !== 'age' && field !== 'dob') {
      setFormData(prev => ({ ...prev, [field]: validatedValue }));
    }
  };

  // Validate mobile number
  const validateMobile = (value: string) => {
    if (!value) {
      setMobileError('Mobile number is required');
      return;
    }

    if (value.length !== 10) {
      setMobileError('Mobile number must be exactly 10 digits');
      return;
    }

    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(value)) {
      setMobileError(
        'Please enter a valid mobile number starting with 6, 7, 8, or 9',
      );
      return;
    }

    setMobileError(null);
  };

  // Add this function to check if patient has previous appointments
  const checkPreviousAppointments = useCallback(
    async (userId: string) => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return false;

        const response = await AuthFetch(
          `appointment/getAppointmentDataByUserIdAndDoctorId?doctorId=${doctorId}&userId=${userId}`,
          token,
        );

        // If we get a successful response (not 404), patient has previous appointments
        if (response?.status === 'success') {
          setHasPreviousAppointments(true);
          return true;
        }

        // If we get 404 or fail status, patient has no previous appointments
        setHasPreviousAppointments(false);
        return false;
      } catch (error: any) {
        // 404 error means no appointments found
        if (error?.response?.status === 404) {
          setHasPreviousAppointments(false);
          return false;
        }
        // For other errors, default to false
        setHasPreviousAppointments(false);
        return false;
      }
    },
    [doctorId],
  );

  // Edit Patient API call — same payload as createPatient
  const callEditPatientAPI = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      if (!patientformData.age) {
        return { success: false, message: 'Age is required' };
      }
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return { success: false, message: 'Not authenticated' };

      const payload = {
        firstname: patientformData.firstName,
        lastname: patientformData.lastName,
        gender: patientformData.gender,
        DOB: patientformData.dob || '',
        mobile: patientformData.mobile,
        age: patientformData.age,
      };

      const response: any = await AuthPut(
        `doctor/editPatient?userId=${patientId}`,
        payload,
        token,
      );

      if (response?.status === 'success') {
        return {
          success: true,
          message: response?.data?.message || 'Patient updated successfully',
        };
      }
      return {
        success: false,
        message:
          response?.message?.message ||
          response?.message ||
          'Failed to update patient',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message || 'Failed to update patient',
      };
    }
  }, [patientformData, patientId]);

  // Enter / Save edit mode handler
  const handleEditPatient = useCallback(async () => {
    if (isEditPatientMode) {
      // Validate before saving
      const errors: Record<string, string> = {};
      if (!patientformData.firstName.trim())
        errors.firstName = 'First name is required';
      if (!patientformData.mobile || patientformData.mobile.length !== 10)
        errors.mobile = 'Valid 10-digit mobile is required';
      if (!patientformData.gender) errors.gender = 'Gender is required';
      if (!patientformData.age) errors.age = 'Age is required';
      if (patientformData.age && !validateAge(patientformData.age.trim())) {
        errors.age = 'Invalid age format. Use e.g. 6m, 2y, 15d';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsEditingPatientLoading(true);
      const { success, message: msg } = await callEditPatientAPI();
      setIsEditingPatientLoading(false);

      if (success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: msg,
          position: 'top',
          visibilityTime: 3000,
        });
        setIsEditPatientMode(false);
        setFieldsDisabled(true);
        // Update patientNames list so the select modal reflects the edited name immediately
        setPatientNames(prev =>
          prev.map((item, idx) => {
            const isTarget =
              selectedPatientIndex !== null
                ? idx === selectedPatientIndex
                : item.userId === patientId;
            if (!isTarget) return item;
            return {
              ...item,
              firstname: patientformData.firstName,
              lastname: patientformData.lastName,
              mobile: patientformData.mobile,
              gender: patientformData.gender,
              DOB: patientformData.dob || item.DOB,
              age: patientformData.age,
            };
          }),
        );
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: msg,
          position: 'top',
          visibilityTime: 3000,
        });
        Alert.alert('Error', msg);
      }
    } else {
      // Enter edit mode — snapshot current data so we can restore on cancel
      setEditPatientSnapshot({ ...patientformData });
      setIsEditPatientMode(true);
      setFieldsDisabled(false);
    }
  }, [
    isEditPatientMode,
    patientformData,
    patientId,
    callEditPatientAPI,
    selectedPatientIndex,
  ]);

  const handleCancelEditPatient = useCallback(() => {
    if (editPatientSnapshot) {
      setpatientFormData(editPatientSnapshot);
    }
    setIsEditPatientMode(false);
    setFieldsDisabled(true);
    setFieldErrors({});
  }, [editPatientSnapshot]);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (!storedToken) return;

      if (storedToken) {
        const profileResponse: any = await AuthFetch(
          `users/getUser?userId=${doctorId}`,
          storedToken,
        );
        if (profileResponse?.data?.status === 'success') {
          const doctorDetails = profileResponse.data.data;
          setFormData(prev => ({
            ...prev,
            department: doctorDetails?.specialization?.name,
            fee: doctorDetails?.consultationModeFee[0]?.fee?.toString(),
          }));
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to fetch user profile');
    }
  };

  // Fetch clinic addresses
  useEffect(() => {
    const fetchClinicAddress = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        const response: any = await AuthFetch(
          `users/getClinicAddress?doctorId=${doctorId}`,
          token,
        );
        if (response?.status === 'success') {
          const clinics = response.data?.data || [];
          const activeClinics = clinics.filter(
            (clinic: { status: string }) => clinic.status === 'Active',
          );
          setActiveclinicsData(activeClinics);
          if (activeClinics.length === 1) {
            const singleClinic = activeClinics[0];
            setFormData(prev => ({
              ...prev,
              clinicName: singleClinic.clinicName,
              clinicAddressId: singleClinic.addressId || '',
            }));
            fetchQRCode(singleClinic.addressId);
          }

          if (activeClinics.length === 0) {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'No Clinics Found',
              position: 'top',
              visibilityTime: 3000,
            });
          }
        }
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            typeof error === 'object' && error !== null && 'message' in error
              ? error.message
              : 'Unknown error',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    };
    fetchClinicAddress();
    if (currentuserDetails?.role !== 'doctor') {
      fetchUserProfile();
    }
  }, [fetchQRCode]);

  // Fetch time slots
  const fetchTimeSlots = useCallback(
    async (selectedDate: string, clinicId: string) => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      if (!selectedDate || !clinicId || !doctorId) return;
      try {
        const [day, month, year] = selectedDate.split('-');
        const formattedDate = `${year}-${month}-${day}`;
        const response: any = await AuthFetch(
          `appointment/getSlotsByDoctorIdAndDate?doctorId=${doctorId}&date=${formattedDate}&addressId=${clinicId}`,
          token,
        );

        if (response?.status === 'success' && response?.data?.data?.slots) {
          const availableSlots = response.data.data.slots
            .filter((slot: { status: string }) => slot.status === 'available')
            .map((slot: { time: any }) => {
              const originalTime = slot.time;
              const [hours, minutes] = slot.time.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              const displayTime = `${hour12}:${minutes} ${ampm}`;
              return { display: displayTime, value: originalTime };
            })
            .filter((timeObj: any) => {
              const slotMoment = moment(
                `${formattedDate} ${timeObj.value}`,
                'YYYY-MM-DD HH:mm',
              );
              return slotMoment.isAfter(moment());
            });

          setTimeSlots(availableSlots);
          setNoSlotsModalVisible(availableSlots.length === 0);
          setMessage(
            availableSlots.length === 0
              ? response?.message?.message || '*No slots Found'
              : '',
          );
        } else {
          setTimeSlots([]);
          setNoSlotsModalVisible(true);
          setMessage(response?.message?.message || '*No slots Found');
        }
      } catch (error) {
        setTimeSlots([]);
        setNoSlotsModalVisible(true);
      }
    },
    [doctorId],
  );

  useEffect(() => {
    if (formData.appointmentDate && formData.clinicAddressId && doctorId) {
      fetchTimeSlots(formData.appointmentDate, formData.clinicAddressId);
    } else {
      setTimeSlots([]);
    }
  }, [
    formData.appointmentDate,
    formData.clinicAddressId,
    doctorId,
    fetchTimeSlots,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (formData.appointmentDate && formData.clinicAddressId && doctorId) {
        fetchTimeSlots(formData.appointmentDate, formData.clinicAddressId);
      }
    }, [
      formData.appointmentDate,
      formData.clinicAddressId,
      doctorId,
      fetchTimeSlots,
    ]),
  );

  // Handle date change
  const CustomRadioButton = ({
    selected,
    onPress,
    disabled,
    label,
  }: {
    selected: boolean;
    onPress: () => void;
    disabled: boolean;
    label: string;
  }) => {
    return (
      <TouchableOpacity
        style={styles.customRadioContainer}
        onPress={onPress}
        disabled={disabled}
      >
        <View
          style={[styles.customRadio, selected && styles.customRadioSelected]}
        >
          {selected && <View style={styles.customRadioInner} />}
        </View>
        <Text style={[styles.radioText, disabled && { color: '#ccc' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = `${selectedDate
        .getDate()
        .toString()
        .padStart(2, '0')}-${(selectedDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${selectedDate.getFullYear()}`;
      handleInputChange('dob', formattedDate);
    }
  };
  // Handle patient search
  const openIosDatePicker = (type: 'patient' | 'appointment') => {
    if (type === 'patient') {
      // Always use today's date when opening calendar
      setPatientCalendarDate(new Date());
      setShowPatientCalendar(true);
    } else {
      // Always use today's date when opening calendar
      setAppointmentCalendarDate(new Date());
      setShowAppointmentCalendar(true);
    }
  };

  const handlePatientDateChangeIOS = (date: Date) => {
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${date.getFullYear()}`;
    handleInputChange('dob', formattedDate);
    setShowPatientCalendar(false);
  };

  const handleAppointmentDateChangeIOS = (date: Date) => {
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${date.getFullYear()}`;
    setFormData({ ...formData, appointmentDate: formattedDate });
    setShowAppointmentCalendar(false);
  };

  const cancelPatientCalendarIOS = () => {
    setShowPatientCalendar(false);
  };

  const cancelAppointmentCalendarIOS = () => {
    setShowAppointmentCalendar(false);
  };

  const handleSearch = async () => {
    // Validate mobile number before search
    if (!searchMobile || searchMobile.length !== 10) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number',
      );
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(searchMobile)) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9',
      );
      return;
    }

    // Reset edit state on new search
    setIsEditPatientMode(false);
    setEditPatientSnapshot(null);
    setSelectedPatientIndex(null);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response: any = await AuthFetch(
        `doctor/searchUser?mobile=${searchMobile}`,
        token,
      );
      if (response?.status === 'success') {
        const patients = response?.data?.data || [];

        if (patients.length > 0) {
          if (patients.length === 1) {
            setExistingPatientData(patients[0]);
            setExistingPatientModalVisible(true);
            Alert.alert('Patient Found', 'Patient details have been filled.');
          } else {
            setPatientNames(patients);
            setPatientSelectModalVisible(true);
          }
        } else {
          setpatientFormData({
            firstName: '',
            lastName: '',
            dob: '',
            age: '',
            gender: '',
            mobile: searchMobile || '',
          });
          setFieldsDisabled(false);
          setPatientId('');
          setPatientCreated(false);
          setAppointmentSectionEnabled(false);
          setIsExistingPatientSelected(false);
          setIsEditPatientMode(false);
          Alert.alert('No User found', 'Please add patient.');
        }
      } else {
        Alert.alert(
          response?.message?.message || 'No User found. Please add patient.',
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to search patient. Please try again.',
      );
    }
  };

  const prefillPatientDetails = async (patient: any, index?: number) => {
    setpatientFormData({
      firstName: patient?.firstname,
      lastName: patient?.lastname,
      dob: patient?.DOB,
      age: patient?.age || calculateAgeFromDOB(patient?.DOB) || '',
      gender: patient?.gender,
      mobile: patient?.mobile,
    });
    setPatientCreated(true);
    const id = patient?.userId || patient?._id || '';
    setPatientId(id);
    setFieldsDisabled(true);
    setAppointmentSectionEnabled(true);
    setIsExistingPatientSelected(true);
    setIsEditPatientMode(false);
    if (index !== undefined) setSelectedPatientIndex(index);
    await checkPreviousAppointments(id);
  };

  // Handle adding a new patient
  const handleAddPatient = async () => {
    let ageToValidate = patientformData.age.trim();
    if (!ageToValidate) {
      setFieldErrors({
        age: 'Age is required. Use formats like 7, 6m, 2y, or 15d',
      });
      return;
    }
    // In the handleAddPatient function, change the error message:
    if (!validateAge(ageToValidate)) {
      setFieldErrors({
        age: 'Invalid age format. Use format like 7, 6m, 2y, 1y2m, 5y10d, or 1y 2m',
      });
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      //if there is no token then show alert like please complete onboarding
      if (!token) {
        Alert.alert('Please complete onboarding');
        setTimeout(() => {
          navigation.navigate('Authloader');
        }, 3000);
        return;
      }
      const payload = {
        firstname: patientformData.firstName,
        lastname: patientformData.lastName,
        gender: patientformData.gender,
        DOB: patientformData.dob || '',
        mobile: patientformData.mobile,
        age: ageToValidate || calculateAgeFromDOB(patientformData.dob) || '0',
      };

      const response: any = await AuthPost(
        'doctor/createPatient',
        payload,
        token,
      );
      console.log('response from create patient', response);
      if (response?.status === 'success') {
        const data = response?.data;
        setIsPatientAdded(true);
        const newId = data?.data?.userId || data?.data?._id || '';
        setPatientId(newId);
        setIsExistingPatientSelected(false);
        setIsEditPatientMode(false);
        setSelectedPatientIndex(null);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Patient Added Successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        setPatientCreated(true);
        setpatientFormData({
          firstName: data.data?.firstname || '',
          lastName: data.data?.lastname || '',
          gender: data.data?.gender,
          dob: data.data?.DOB || '',
          age: data.data?.age || '',
          mobile: data.data?.mobile || '',
        });
        setAppointmentSectionEnabled(true);
        await checkPreviousAppointments(newId);
      } else {
        if (
          response?.message?.message ===
          'Patient already exists with same details'
        ) {
          setExistingPatientData(response?.message?.data);
          setExistingPatientModalVisible(true);
          return;
        } else {
          setpatientFormData({
            firstName: '',
            lastName: '',
            dob: '',
            age: '',
            gender: '',
            mobile: '',
          });
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add patient');
    }
  };

  // ==============POS start ================

  // helper
  const encodeBase64 = (obj: any) => {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  };

  const openOtherApp = async (printRequest: any) => {
    console.log('1111');
    try {
      console.log('22222');
      // 1. Convert to JSON
      console.log('Print Request Object:', printRequest);
      console.log('Serial Number received:', printRequest.serialNumber);

      const encodedData = encodeBase64(printRequest);

      const deepLinkUrl = `vydhyo://wlprint?data=${encodedData}`;

      console.log('Deep Link URL:', deepLinkUrl);

      const supported = await Linking.canOpenURL(deepLinkUrl);

      if (!supported) {
        // Alert.alert(
        //   'App Not Installed',
        //   'Target app is not installed on this device'
        // );
        return;
      }

      // 5. Open target app
      await Linking.openURL(deepLinkUrl);
    } catch (error) {
      console.error('Deep link error:', error);
      // Alert.alert('Error', 'Failed to open app');
    }
  };

  // =================POS End=============

  // Handle creating an appointment
  const handleCreateAppointment = async () => {
    setIsProcessingPayment(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Please login again.');
        setIsProcessingPayment(false);
        return;
      }

      const patientData = { ...formData, ...patientformData };
      const [day, month, year] = patientData.appointmentDate.split('-');
      const formattedDate = `${year}-${month}-${day}`;

      // CHANGE HERE: Use empty string instead of 'Not specified'
      const appointmentReason =
        patientData.visitReason.trim() || 'Not specified';
      // console.log("currentuserDetails",currentuserDetails)\
      const appointmentRequest = {
        userId: patientId,
        doctorId: doctorId,
        doctorName: `${currentuserDetails.firstname} ${currentuserDetails.lastname}`,
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        addressId: patientData.clinicAddressId,
        appointmentType: patientData.appointmentType,
        appointmentDepartment: patientData.department,
        appointmentDate: formattedDate,
        // appointmentTime: patientData.selectedTime,
        appointmentStatus: 'scheduled',
        appointmentReason: appointmentReason,
        amount: patientData.fee,
        discount: Number(patientData.discount) || 0,
        discountType: patientData.discountType || 'percentage', // Default to percentage if not specified
        paymentStatus: 'paid',
        appSource: 'walkIn',
        paymentMethod: paymentMethod,

        walkinDoctorRegistrationNumber:
          patientData.walkinDoctorRegistrationNumber || '',
        walkinReferredBy: patientData.walkinReferredBy || '',
      };

      // console.log("currentuserDetails",appointmentRequest)

      // console.log("Appointment Request:", appointmentRequest);
      const response: any = await AuthPost(
        'appointment/createWalkinAppointment',
        appointmentRequest,
        token,
      );
      console.log(
        '666',
        response?.data?.data?.appointmentDetails?.serialNumber,
      );
      if (response?.status === 'success') {
        let printdata: any = {
          ...appointmentRequest,
        };
        console.log('printdata', printdata);
        printdata.clinicName = formData.clinicName;
        printdata.serialNumber =
          response?.data?.data?.appointmentDetails?.serialNumber ||
          console.log('222', printdata.serialNumber);
        await openOtherApp(printdata);
        Alert.alert('Success', 'Appointment created successfully!');
        navigation.navigate('DoctorDashboard');
      } else {
        Alert.alert(
          'Error',
          response?.message?.message || 'Please fill a`ll fields',
        );
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response?.message?.message || 'Please fill all fields',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Please fill all fields',
        position: 'top',
        visibilityTime: 3000,
      });
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create appointment',
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigation.goBack();
  };

  // Disable add patient button
  const isAddPatientDisabled =
    patientCreated ||
    !patientformData.age ||
    !patientformData.gender ||
    !validateAge(patientformData.age.trim());

  // Get appointment type options based on consultation fees
  const getAppointmentTypeOptions = () => {
    const consultationFees = currentuserDetails?.consultationModeFee || [];
    const options: Array<{ label: string; value: string }> = [];

    options.push({ label: 'New Walkin', value: 'new-walkin' });
    options.push({ label: 'Followup Walkin', value: 'followup-walkin' });

    // Check for video consultation availability
    const videoFee =
      consultationFees.find((fee: any) => fee.type === 'Video')?.fee || 0;
    if (videoFee > 0) {
      options.push({ label: 'New Video', value: 'new-video' });
      options.push({ label: 'Followup Video', value: 'followup-video' });
    }

    // Check for home visit availability
    const homeVisitFee =
      consultationFees.find((fee: any) => fee.type === 'Home Visit')?.fee || 0;
    if (homeVisitFee > 0) {
      options.push({ label: 'New HomeCare', value: 'new-homecare' });
      options.push({ label: 'Followup Homecare', value: 'followup-homecare' });
    }

    return options;
  };

  const appointmentTypeOptions = getAppointmentTypeOptions();
  const openGenderPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Male', 'Female', 'Other', 'Cancel'],
          cancelButtonIndex: 3,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            setpatientFormData({ ...patientformData, gender: 'Male' });
          } else if (buttonIndex === 1) {
            setpatientFormData({ ...patientformData, gender: 'Female' });
          } else if (buttonIndex === 2) {
            setpatientFormData({ ...patientformData, gender: 'Other' });
          }
        },
      );
    } else {
      setShowGenderModal(true);
    }
  };

  // iOS ActionSheet for Appointment Type
  const openAppointmentTypePicker = () => {
    if (Platform.OS === 'ios') {
      const options = [
        ...appointmentTypeOptions.map(opt => opt.label),
        'Cancel',
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        buttonIndex => {
          if (
            buttonIndex !== undefined &&
            buttonIndex < appointmentTypeOptions.length
          ) {
            setFormData({
              ...formData,
              appointmentType: appointmentTypeOptions[buttonIndex].value,
            });
          }
        },
      );
    } else {
      setShowAppointmentTypeModal(true);
    }
  };

  // iOS ActionSheet for Clinic Selection
  const openClinicPicker = () => {
    if (Platform.OS === 'ios') {
      const options = [
        'Select Clinic',
        ...activeclinicsData.map(clinic => clinic.clinicName),
        'Cancel',
      ];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        buttonIndex => {
          if (
            buttonIndex !== undefined &&
            buttonIndex > 0 &&
            buttonIndex <= activeclinicsData.length
          ) {
            const selectedClinic = activeclinicsData[buttonIndex - 1];
            setFormData(prev => ({
              ...prev,
              clinicName: selectedClinic.clinicName,
              clinicAddressId: selectedClinic.addressId || '',
            }));
          }
        },
      );
    } else {
      setShowClinicModal(true);
    }
  };

  // iOS ActionSheet for Discount Type
  const openDiscountTypePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Percentage', 'Flat', 'Cancel'],
          cancelButtonIndex: 2,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            setFormData({ ...formData, discountType: 'percentage' });
          } else if (buttonIndex === 1) {
            setFormData({ ...formData, discountType: 'flat' });
          }
        },
      );
    } else {
      setShowDiscountTypeModal(true);
    }
  };

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  const keyboardVerticalOffset = Platform.select({
    ios: moderateScale(100),
    android: moderateScale(80),
  }) as number;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <CommonHeader title="Walk-in Consultation" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: SPACING.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Search By Mobile Number</Text>
          <View style={styles.searchRow}>
            <View style={styles.inputContainer}>
              <SearchIcon
                size={ICON_SIZE.sm}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Enter mobile number"
                style={styles.input}
                keyboardType="number-pad"
                value={searchMobile}
                onChangeText={text => {
                  // Apply same mobile validation as in handleInputChange
                  let digitsOnly = text.replace(/\D/g, '');
                  if (digitsOnly.length === 1 && !/^[6-9]/.test(digitsOnly))
                    return;
                  if (digitsOnly.length > 10)
                    digitsOnly = digitsOnly.slice(0, 10);
                  setSearchMobile(digitsOnly);
                }}
                placeholderTextColor="#9CA3AF"
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <Modal
            visible={noSlotsModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setNoSlotsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setNoSlotsModalVisible(false)}
                >
                  <CloseXIcon size={ICON_SIZE.md} color="#6B7280" />
                </TouchableOpacity>
                <View style={styles.modalHeader}>
                  <WarningIcon
                    size={ICON_SIZE.md}
                    color="#f59e0b"
                    style={{ marginBottom: SPACING.sm }}
                  />
                  <Text style={styles.modalTitle}>No Slots Available</Text>
                </View>
                <Text style={styles.modalMessage}>
                  There are no available time slots for the selected clinic on
                  the selected date. Please choose a different date or clinic.
                </Text>
                <TouchableOpacity
                  style={styles.singleActionButton}
                  onPress={() => {
                    setNoSlotsModalVisible(false);
                    navigation.navigate('Availability');
                  }}
                >
                  <Text style={styles.singleActionButtonText}>
                    Go to Availability
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={patientSelectModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setPatientSelectModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Select Patient</Text>
                <ScrollView style={{ maxHeight: moderateScale(300) }}>
                  {patientNames?.map((patient: any, index: number) => (
                    <TouchableOpacity
                      key={patient._id || patient.userId}
                      style={styles.patientOption}
                      onPress={() => {
                        prefillPatientDetails(patient, index);
                        setFieldsDisabled(true);
                        setPatientSelectModalVisible(false);
                      }}
                    >
                      <Text style={styles.patientText}>
                        {patient.firstname} {patient.lastname}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPatientSelectModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={styles.patientsContainer}>
            {/* Patient Information header row with Edit Patient button */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              {patientCreated && patientId ? (
                <View style={styles.editButtonRow}>
                  {isEditPatientMode && (
                    <TouchableOpacity
                      style={styles.cancelEditButton}
                      onPress={handleCancelEditPatient}
                      disabled={isEditingPatientLoading}
                    >
                      <Text style={styles.cancelEditButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.editPatientButton,
                      isEditPatientMode && styles.savePatientButton,
                    ]}
                    onPress={handleEditPatient}
                    disabled={isEditingPatientLoading}
                  >
                    {isEditingPatientLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.editPatientButtonText}>
                        {isEditPatientMode ? 'Save Patient' : 'Edit Patient'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>First Name*</Text>
                <TextInput
                  placeholder="First Name"
                  style={[
                    styles.inputFlex,
                    fieldErrors.firstName ? styles.errorInput : null,
                  ]}
                  value={patientformData.firstName}
                  onChangeText={text => handleInputChange('firstName', text)}
                  editable={
                    isEditPatientMode
                      ? true
                      : !isPatientAdded && !fieldsDisabled
                  }
                  placeholderTextColor="#9CA3AF"
                />
                {fieldErrors.firstName ? (
                  <Text style={styles.errorText}>{fieldErrors.firstName}</Text>
                ) : null}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput
                  placeholder="Last Name"
                  style={styles.inputFlex}
                  value={patientformData.lastName}
                  onChangeText={text => handleInputChange('lastName', text)}
                  editable={
                    isEditPatientMode
                      ? true
                      : !isPatientAdded && !fieldsDisabled
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.inputFlex}
                  onPress={() => {
                    if (
                      isEditPatientMode ||
                      (!isPatientAdded && !fieldsDisabled)
                    ) {
                      Platform.OS === 'android'
                        ? setShowDatePicker(true)
                        : openIosDatePicker('patient');
                    }
                  }}
                >
                  <Text
                    style={{
                      color: patientformData.dob ? '#000' : '#9CA3AF',
                      fontSize: FONT_SIZE.input,
                    }}
                  >
                    {patientformData.dob || 'DD-MM-YYYY'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && Platform.OS === 'android' && (
                  <DateTimePicker
                    value={new Date()}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={onDateChange}
                  />
                )}
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Age*</Text>
                <TextInput
                  placeholder="e.g., 7, 6m, 2y, 15d, 5y10d, 1y 2m"
                  style={[
                    styles.inputFlex,
                    fieldErrors.age ? styles.errorInput : null,
                  ]}
                  placeholderTextColor="#9CA3AF"
                  value={patientformData.age}
                  onChangeText={text => handleInputChange('age', text)}
                  editable={true}
                  maxLength={20}
                />
                {fieldErrors.age && (
                  <Text style={styles.errorText}>{fieldErrors.age}</Text>
                )}
              </View>
            </View>
            <View style={styles.mobileContainer}>
              <Text style={styles.label}>Mobile Number*</Text>
              <View style={styles.row}>
                <TextInput
                  placeholder="Mobile Number"
                  style={[
                    styles.inputFlex,
                    mobileError ? styles.errorInput : null,
                  ]}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={patientformData.mobile}
                  onChangeText={text => {
                    handleInputChange('mobile', text);
                    // Clear mobile error when user starts typing
                    if (mobileError) {
                      setMobileError(null);
                    }
                  }}
                  editable={
                    isEditPatientMode
                      ? true
                      : !isPatientAdded && !fieldsDisabled
                  }
                  onBlur={() => {
                    // Use a small delay to ensure state is updated
                    setTimeout(() => {
                      validateMobile(patientformData.mobile);
                    }, 50);
                  }}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {mobileError && (
                <Text style={styles.errorText}>{mobileError}</Text>
              )}
            </View>

            <Text style={styles.label}>Gender*</Text>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.inputFlex}
                onPress={
                  isEditPatientMode
                    ? openGenderPicker
                    : fieldsDisabled || isPatientAdded
                    ? undefined
                    : openGenderPicker
                }
                disabled={
                  isEditPatientMode ? false : fieldsDisabled || isPatientAdded
                }
              >
                <Text
                  style={{
                    color: patientformData.gender ? '#000' : '#9CA3AF',
                    fontSize: FONT_SIZE.input,
                  }}
                >
                  {patientformData.gender || 'Select Gender'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.radioRow}>
                {['Male', 'Female', 'Other'].map(option => (
                  <View key={option} style={styles.radioItem}>
                    <RadioButton
                      value={option}
                      status={
                        patientformData?.gender === option
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() => {
                        const canEdit = isEditPatientMode
                          ? true
                          : !fieldsDisabled && !isPatientAdded;
                        if (canEdit) {
                          setpatientFormData({
                            ...patientformData,
                            gender: option,
                          });
                        }
                      }}
                      disabled={
                        isEditPatientMode
                          ? false
                          : fieldsDisabled || isPatientAdded
                      }
                    />
                    <Text style={styles.radioText}>{option}</Text>
                  </View>
                ))}
              </View>
            )}
            {fieldErrors.gender ? (
              <Text style={styles.errorText}>{fieldErrors.gender}</Text>
            ) : null}
            {!patientCreated && (
              <TouchableOpacity
                style={[
                  styles.addButton,
                  isAddPatientDisabled && styles.disabledButton,
                ]}
                onPress={handleAddPatient}
                disabled={isAddPatientDisabled}
              >
                <Text style={styles.addButtonText}>Create Patient</Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={[
              styles.patientsContainer,
              !appointmentSectionEnabled && styles.disabledSection,
            ]}
          >
            <Text style={styles.sectionTitle}>Appointment Information</Text>
            <Text style={styles.label}>Appointment Type *</Text>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={[
                  styles.inputFlex,
                  !appointmentSectionEnabled && styles.disabledInput,
                ]}
                onPress={openAppointmentTypePicker}
                disabled={!appointmentSectionEnabled}
              >
                <Text
                  style={{
                    color: formData.appointmentType ? '#000' : '#9CA3AF',
                    fontSize: FONT_SIZE.input,
                  }}
                >
                  {formData.appointmentType
                    ? appointmentTypeOptions.find(
                        opt => opt.value === formData.appointmentType,
                      )?.label
                    : 'Select Type'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.appointmentType}
                  onValueChange={itemValue =>
                    setFormData(prev => ({
                      ...prev,
                      appointmentType: itemValue,
                    }))
                  }
                  style={styles.picker}
                  enabled={appointmentSectionEnabled}
                >
                  <Picker.Item label="Select Type" value="" />
                  {appointmentTypeOptions.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            )}
            <Text style={styles.label}>Department *</Text>
            <View style={styles.pickerContainer}>
              <TextInput
                style={[
                  styles.input,
                  !appointmentSectionEnabled && styles.disabledInput,
                ]}
                value={
                  formData?.department ||
                  currentuserDetails?.specialization?.name ||
                  ''
                }
                editable={false}
              />
            </View>
            <Text style={styles.label}>Appointment Date *</Text>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[
                  styles.input,
                  !appointmentSectionEnabled && styles.disabledInput,
                ]}
                onPress={() =>
                  appointmentSectionEnabled &&
                  (Platform.OS === 'android'
                    ? setShowappointmentDatePicker(true)
                    : openIosDatePicker('appointment'))
                }
                disabled={!appointmentSectionEnabled}
              >
                <Text
                  style={{
                    color: formData.appointmentDate ? '#000' : '#9CA3AF',
                    fontSize: FONT_SIZE.input,
                    marginLeft: SPACING.xs,
                  }}
                >
                  {formData.appointmentDate || 'DD-MM-YYYY'}
                </Text>
              </TouchableOpacity>
              {showappointmentDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={
                    formData.appointmentDate
                      ? (() => {
                          const [day, month, year] =
                            formData.appointmentDate.split('-');
                          if (day && month && year) {
                            return new Date(
                              Number(year),
                              Number(month) - 1,
                              Number(day),
                            );
                          }
                          return new Date();
                        })()
                      : new Date()
                  }
                  mode="date"
                  minimumDate={new Date()}
                  maximumDate={maxDate}
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    setShowappointmentDatePicker(false);
                    if (selectedDate) {
                      const formattedDate = `${selectedDate
                        .getDate()
                        .toString()
                        .padStart(2, '0')}-${(selectedDate.getMonth() + 1)
                        .toString()
                        .padStart(2, '0')}-${selectedDate.getFullYear()}`;
                      setFormData({
                        ...formData,
                        appointmentDate: formattedDate,
                      });
                    }
                  }}
                />
              )}
            </View>
            <Text style={styles.label}>Clinic Name *</Text>
            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={[
                  styles.inputFlex,
                  !appointmentSectionEnabled && styles.disabledInput,
                ]}
                onPress={openClinicPicker}
                disabled={!appointmentSectionEnabled}
              >
                <Text
                  style={{
                    color: formData.clinicName ? '#000' : '#9CA3AF',
                    fontSize: FONT_SIZE.input,
                  }}
                >
                  {formData.clinicName || 'Select Clinic'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.clinicName}
                  onValueChange={itemValue => {
                    const selectedClinic = activeclinicsData.find(
                      (clinic: any) => clinic.clinicName === itemValue,
                    );
                    setFormData(prev => ({
                      ...prev,
                      clinicName: itemValue,
                      clinicAddressId: selectedClinic?.addressId || '',
                    }));
                  }}
                  style={styles.picker}
                  enabled={appointmentSectionEnabled}
                >
                  <Picker.Item label="Select Clinic" value="" />
                  {activeclinicsData?.map((clinic: any) => (
                    <Picker.Item
                      key={clinic._id || clinic.id}
                      label={clinic.clinicName}
                      value={clinic.clinicName}
                    />
                  ))}
                </Picker>
              </View>
            )}

            {/* ==================== NEW FIELDS (Individual Full Width) ==================== */}

            {/* Registration Number - Full Width */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Registration Number</Text>
              <TextInput
                placeholder="Enter Registration Number"
                style={[
                  styles.inputFlex,
                  fieldErrors.walkinDoctorRegistrationNumber
                    ? styles.errorInput
                    : null,
                ]}
                value={formData.walkinDoctorRegistrationNumber}
                onChangeText={text =>
                  handleInputChange('walkinDoctorRegistrationNumber', text)
                }
                placeholderTextColor="#9CA3AF"
              />
              {fieldErrors.walkinDoctorRegistrationNumber && (
                <Text style={styles.errorText}>
                  {fieldErrors.walkinDoctorRegistrationNumber}
                </Text>
              )}
            </View>

            {/* Referred By - Full Width */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Referred By (Optional)</Text>
              <TextInput
                placeholder="Enter Referred By"
                style={styles.inputFlex}
                value={formData.walkinReferredBy}
                onChangeText={text =>
                  handleInputChange('walkinReferredBy', text)
                }
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* ==================================================== */}

            <Text style={styles.label}>Visit Reason (Optional)</Text>
            <TextInput
              placeholder="Describe the reason for visit and symptoms (optional)"
              style={[
                styles.inputFlex,
                { height: moderateScale(80), textAlignVertical: 'top' },
                !appointmentSectionEnabled && styles.disabledInput,
              ]}
              multiline={true}
              numberOfLines={4}
              value={formData.visitReason}
              onChangeText={text => handleInputChange('visitReason', text)}
              placeholderTextColor="#9CA3AF"
              maxLength={500}
              editable={appointmentSectionEnabled}
            />
            <Text
              style={[
                styles.errorText,
                {
                  textAlign: 'right',
                  color: '#6B7280',
                  fontSize: FONT_SIZE.xs,
                },
              ]}
            >
              {formData.visitReason.length}/500 characters
            </Text>
          </View>

          <View
            style={[
              styles.patientsContainer,
              !appointmentSectionEnabled && styles.disabledSection,
            ]}
          >
            <Text style={styles.sectionTitle}>₹ Payment Summary</Text>
            <Text style={styles.label}>Consultation Fee (₹) *</Text>
            <TextInput
              placeholder="Enter consultation fee"
              placeholderTextColor="#9CA3AF"
              style={[
                styles.inputFlex,
                fieldErrors.fee ? styles.errorInput : null,
                !appointmentSectionEnabled && styles.disabledInput,
              ]}
              keyboardType="numeric"
              value={formData.fee}
              onChangeText={text => {
                const value = text.replace(/\D/g, '');
                if (
                  value === '' ||
                  (Number(value) >= 0 && Number(value) <= 9999)
                ) {
                  setFormData({ ...formData, fee: value });
                }
              }}
              editable={appointmentSectionEnabled}
            />
            {fieldErrors.fee && (
              <Text style={styles.errorText}>{fieldErrors.fee}</Text>
            )}

            <Text style={styles.label}>Discount Type</Text>
            <View style={styles.radioRow}>
              {Platform.OS === 'ios' ? (
                <>
                  <View style={styles.radioItem}>
                    <CustomRadioButton
                      selected={formData.discountType === 'percentage'}
                      onPress={() =>
                        appointmentSectionEnabled &&
                        setFormData({ ...formData, discountType: 'percentage' })
                      }
                      disabled={!appointmentSectionEnabled}
                      label="Percentage (%)"
                    />
                  </View>
                  <View style={styles.radioItem}>
                    <CustomRadioButton
                      selected={formData.discountType === 'flat'}
                      onPress={() =>
                        appointmentSectionEnabled &&
                        setFormData({ ...formData, discountType: 'flat' })
                      }
                      disabled={!appointmentSectionEnabled}
                      label="Flat Amount (₹)"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.radioItem}>
                    <RadioButton
                      value="percentage"
                      status={
                        formData.discountType === 'percentage'
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() =>
                        appointmentSectionEnabled &&
                        setFormData({ ...formData, discountType: 'percentage' })
                      }
                      disabled={!appointmentSectionEnabled}
                    />
                    <Text
                      style={[
                        styles.radioText,
                        !appointmentSectionEnabled && styles.disabledText,
                      ]}
                    >
                      Percentage (%)
                    </Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton
                      value="flat"
                      status={
                        formData.discountType === 'flat'
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() =>
                        appointmentSectionEnabled &&
                        setFormData({ ...formData, discountType: 'flat' })
                      }
                      disabled={!appointmentSectionEnabled}
                    />
                    <Text
                      style={[
                        styles.radioText,
                        !appointmentSectionEnabled && styles.disabledText,
                      ]}
                    >
                      Flat Amount (₹)
                    </Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.label}>
              {formData.discountType === 'percentage'
                ? 'Discount (%)'
                : 'Discount Amount (₹)'}
            </Text>
            <View style={styles.row}>
              <TextInput
                placeholder={
                  formData.discountType === 'percentage'
                    ? 'Enter discount percentage'
                    : 'Enter discount amount'
                }
                placeholderTextColor="#9CA3AF"
                style={[
                  styles.inputFlex,
                  fieldErrors.discount ? styles.errorInput : null,
                  !appointmentSectionEnabled && styles.disabledInput,
                ]}
                keyboardType="numeric"
                value={formData.discount === '0' ? '0' : formData.discount}
                onChangeText={text => handleInputChange('discount', text)}
                onFocus={() => {
                  // Clear the field when user focuses on it if it's "0"
                  if (formData.discount === '0') {
                    handleInputChange('discount', '');
                  }
                }}
                onBlur={() => {
                  // If field is empty after blur, set it back to "0"
                  if (formData.discount === '') {
                    setFormData(prev => ({ ...prev, discount: '0' }));
                  }
                }}
                editable={appointmentSectionEnabled}
              />
            </View>
            {fieldErrors.discount && (
              <Text style={styles.errorText}>{fieldErrors.discount}</Text>
            )}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: '#0d0d0dff' }]}>
                  ₹{formData.fee || '0.00'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#ff4d4f' }]}>
                  {formData.discountType === 'percentage'
                    ? `${formData.discount}%`
                    : `₹${formData.discount}`}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={[styles.summaryValue, { color: '#52c41a' }]}>
                  ₹
                  {(formData.fee && formData.discountType === 'percentage'
                    ? Number(formData.fee) -
                      (Number(formData.fee) * Number(formData.discount)) / 100
                    : Number(formData.fee) - Number(formData.discount)
                  ) // This handles 'flat' discount type
                    .toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
            <Text style={styles.label}>Payment Method *</Text>
            <View style={styles.radioRow}>
              {Platform.OS === 'ios' ? (
                <>
                  <View style={styles.radioItem}>
                    <CustomRadioButton
                      selected={paymentMethod === 'cash'}
                      onPress={() =>
                        appointmentSectionEnabled && setPaymentMethod('cash')
                      }
                      disabled={!appointmentSectionEnabled}
                      label="Cash"
                    />
                  </View>
                  <View style={styles.radioItem}>
                    <CustomRadioButton
                      selected={paymentMethod === 'upi'}
                      onPress={() => {
                        if (!appointmentSectionEnabled) return;
                        if (!formData?.clinicAddressId) {
                          Alert.alert(
                            'Error',
                            'Please select a clinic first to use UPI payment',
                          );
                          return;
                        }
                        setPaymentMethod('upi');
                        fetchQRCode(formData?.clinicAddressId);
                      }}
                      disabled={
                        !appointmentSectionEnabled || !formData?.clinicAddressId
                      }
                      label="UPI"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.radioItem}>
                    <RadioButton
                      value="cash"
                      status={
                        paymentMethod === 'cash' ? 'checked' : 'unchecked'
                      }
                      onPress={() =>
                        appointmentSectionEnabled && setPaymentMethod('cash')
                      }
                      disabled={!appointmentSectionEnabled}
                    />
                    <Text
                      style={[
                        styles.radioText,
                        !appointmentSectionEnabled && styles.disabledText,
                      ]}
                    >
                      Cash
                    </Text>
                  </View>
                  <View style={styles.radioItem}>
                    <RadioButton
                      value="upi"
                      status={paymentMethod === 'upi' ? 'checked' : 'unchecked'}
                      onPress={() => {
                        if (!appointmentSectionEnabled) return;
                        if (!formData?.clinicAddressId) {
                          Alert.alert(
                            'Error',
                            'Please select a clinic first to use UPI payment',
                          );
                          return;
                        }
                        setPaymentMethod('upi');
                        fetchQRCode(formData?.clinicAddressId);
                      }}
                      disabled={
                        !appointmentSectionEnabled || !formData?.clinicAddressId
                      }
                    />
                    <Text
                      style={[
                        styles.radioText,
                        (!appointmentSectionEnabled ||
                          !formData?.clinicAddressId) && { color: '#ccc' },
                      ]}
                    >
                      UPI
                    </Text>
                  </View>
                </>
              )}
            </View>

            {Platform.OS === 'ios' && (
              <>
                <IOSCalendarPicker
                  visible={showPatientCalendar}
                  currentDate={patientCalendarDate}
                  onConfirm={handlePatientDateChangeIOS}
                  onCancel={cancelPatientCalendarIOS}
                  title="Select Date of Birth"
                  mode="date"
                  maxDate={new Date()}
                  minDate={new Date(1900, 0, 1)}
                />

                <IOSCalendarPicker
                  visible={showAppointmentCalendar}
                  currentDate={appointmentCalendarDate}
                  onConfirm={handleAppointmentDateChangeIOS}
                  onCancel={cancelAppointmentCalendarIOS}
                  title="Select Appointment Date"
                  mode="date"
                  minDate={new Date()}
                  maxDate={maxDate}
                />
              </>
            )}

            {Platform.OS === 'android' && (
              <>
                <Modal
                  visible={showGenderModal}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowGenderModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>Select Gender</Text>
                      <ScrollView style={{ maxHeight: moderateScale(200) }}>
                        {['Male', 'Female', 'Other'].map(gender => (
                          <TouchableOpacity
                            key={gender}
                            style={styles.modalItem}
                            onPress={() => {
                              setpatientFormData({
                                ...patientformData,
                                gender,
                              });
                              setShowGenderModal(false);
                            }}
                          >
                            <Text style={styles.modalItemText}>{gender}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowGenderModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

                <Modal
                  visible={showAppointmentTypeModal}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowAppointmentTypeModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>
                        Select Appointment Type
                      </Text>
                      <ScrollView style={{ maxHeight: moderateScale(200) }}>
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => {
                            setFormData({ ...formData, appointmentType: '' });
                            setShowAppointmentTypeModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>Select Type</Text>
                        </TouchableOpacity>
                        {appointmentTypeOptions.map(option => (
                          <TouchableOpacity
                            key={option.value}
                            style={styles.modalItem}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                appointmentType: option.value,
                              });
                              setShowAppointmentTypeModal(false);
                            }}
                          >
                            <Text style={styles.modalItemText}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowAppointmentTypeModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

                <Modal
                  visible={showClinicModal}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowClinicModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>Select Clinic</Text>
                      <ScrollView style={{ maxHeight: moderateScale(200) }}>
                        <TouchableOpacity
                          style={styles.modalItem}
                          onPress={() => {
                            setFormData({
                              ...formData,
                              clinicName: '',
                              clinicAddressId: '',
                            });
                            setShowClinicModal(false);
                          }}
                        >
                          <Text style={styles.modalItemText}>
                            Select Clinic
                          </Text>
                        </TouchableOpacity>
                        {activeclinicsData?.map((clinic: any) => (
                          <TouchableOpacity
                            key={clinic._id || clinic.id}
                            style={styles.modalItem}
                            onPress={() => {
                              setFormData({
                                ...formData,
                                clinicName: clinic.clinicName,
                                clinicAddressId: clinic.addressId || '',
                              });
                              setShowClinicModal(false);
                            }}
                          >
                            <Text style={styles.modalItemText}>
                              {clinic.clinicName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowClinicModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

                <Modal
                  visible={showDiscountTypeModal}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDiscountTypeModal(false)}
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                      <Text style={styles.modalTitle}>
                        Select Discount Type
                      </Text>
                      <ScrollView style={{ maxHeight: moderateScale(200) }}>
                        {['percentage', 'flat'].map(type => (
                          <TouchableOpacity
                            key={type}
                            style={styles.modalItem}
                            onPress={() => {
                              setFormData({ ...formData, discountType: type });
                              setShowDiscountTypeModal(false);
                            }}
                          >
                            <Text style={styles.modalItemText}>
                              {type === 'percentage' ? 'Percentage' : 'Flat'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowDiscountTypeModal(false)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>
              </>
            )}

            <Modal
              visible={showUpiModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowUpiModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowUpiModal(false)}
                  >
                    <CloseXIcon size={ICON_SIZE.md} color="#6B7280" />
                  </TouchableOpacity>

                  <Text style={styles.modalTitle}>UPI Payment</Text>

                  <View style={styles.qrContainer}>
                    {qrCodeUrl ? (
                      <>
                        <Text style={styles.qrText}>Scan QR Code to Pay</Text>
                        <Image
                          source={{ uri: qrCodeUrl }}
                          style={styles.qrImage}
                          resizeMode="contain"
                          onError={() => {
                            setQrCodeUrl('');
                          }}
                        />
                      </>
                    ) : (
                      <View>
                        <Text style={styles.errorText}>
                          QR Code not available
                        </Text>
                        <Text
                          style={{
                            marginTop: SPACING.sm,
                            textAlign: 'center',
                            color: '#6B7280',
                          }}
                        >
                          Please use cash payment or contact clinic
                          administrator
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      (!qrCodeUrl || isProcessingPayment) &&
                        styles.disabledButton,
                    ]}
                    disabled={!qrCodeUrl || isProcessingPayment}
                    onPress={() => {
                      setShowUpiModal(false);
                      handleCreateAppointment();
                    }}
                  >
                    <Text style={styles.confirmButtonText}>
                      {isProcessingPayment
                        ? 'Processing...'
                        : 'Confirm Payment'}
                    </Text>
                  </TouchableOpacity>

                  {!qrCodeUrl && (
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        { backgroundColor: '#6c757d', marginTop: SPACING.sm },
                      ]}
                      onPress={() => setShowUpiModal(false)}
                    >
                      <Text style={styles.confirmButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Modal>

            <Modal
              visible={existingPatientModalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setExistingPatientModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>Patient Found</Text>
                  <Text style={styles.modalMessage}>
                    A patient with this mobile number already exists. Would you
                    like to use the existing record or create a new patient?
                  </Text>

                  {existingPatientData && (
                    <View style={{ width: '100%', marginBottom: SPACING.sm }}>
                      <Text style={{ color: '#374151' }}>
                        {existingPatientData.firstname}{' '}
                        {existingPatientData.lastname} •{' '}
                        {existingPatientData.mobile}
                      </Text>
                      {existingPatientData?.DOB && (
                        <Text style={{ color: '#374151' }}>
                          DOB: {existingPatientData.DOB}
                        </Text>
                      )}
                    </View>
                  )}

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: SPACING.sm,
                      width: '100%',
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.singleActionButton,
                        { backgroundColor: '#2563EB', flex: 1 },
                      ]}
                      onPress={() => {
                        const p = existingPatientData;
                        prefillPatientDetails({
                          firstname: p?.firstname,
                          lastname: p?.lastname,
                          DOB: p?.DOB,
                          age: p?.age,
                          gender: p?.gender,
                          mobile: p?.mobile,
                          userId: p?.userId || p?._id,
                        });
                        setFieldsDisabled(true);
                        setExistingPatientModalVisible(false);
                      }}
                    >
                      <Text style={styles.singleActionButtonText}>
                        Yes, use existing
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.singleActionButton,
                        {
                          backgroundColor: '#6B7280',
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'center',
                        },
                      ]}
                      onPress={() => {
                        setExistingPatientModalVisible(false);
                        setpatientFormData({
                          firstName: '',
                          lastName: '',
                          gender: '',
                          dob: '',
                          age: '',
                          mobile: searchMobile || '',
                        });
                        setPatientId('');
                        setPatientCreated(false);
                        setIsPatientAdded(false);
                        setFieldsDisabled(false);
                        setExistingPatientData(null);
                        setAppointmentSectionEnabled(false);
                        setIsExistingPatientSelected(false);
                        // Reset previous appointments state for new patient
                        setHasPreviousAppointments(false);
                        setIsEditPatientMode(false);
                        setEditPatientSnapshot(null);
                        setSelectedPatientIndex(null);
                      }}
                    >
                      <Text style={styles.singleActionButtonText}>
                        Create new patient
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={[
                styles.payNowButton,
                (isProcessingPayment ||
                  !validateRequiredFields() ||
                  !appointmentSectionEnabled ||
                  isEditPatientMode) &&
                  styles.disabledButton,
              ]}
              onPress={() => {
                if (paymentMethod === 'upi') {
                  if (!formData.clinicAddressId) {
                    Alert.alert('Error', 'Please select a clinic first');
                    return;
                  }
                  setShowUpiModal(true);
                } else {
                  handleCreateAppointment();
                }
              }}
              disabled={
                isProcessingPayment ||
                !validateRequiredFields() ||
                !appointmentSectionEnabled ||
                isEditPatientMode
              }
            >
              {isProcessingPayment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payNowText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default AddAppointment;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0FDF4',
    paddingTop: SPACING.sm,
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    height: '100%',
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  disabledSection: {
    opacity: 0.6,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  disabledText: {
    color: '#999',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: SPACING.lg,
    marginLeft: SPACING.lg,
    gap: SPACING.sm,
    rowGap: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isTablet ? SPACING.xl : SPACING.lg,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.xl : SPACING.lg,
    width: isTablet ? '85%' : '90%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: isTablet ? FONT_SIZE.xl : FONT_SIZE.lg,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
    color: '#1f2937',
  },
  modalMessage: {
    fontSize: FONT_SIZE.md,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    color: '#374151',
    lineHeight: moderateScale(22),
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 1,
  },
  singleActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    width: '100%',
  },
  singleActionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.sm,
  },
  errorMessage: {
    color: 'red',
  },
  mobileContainer: {
    marginBottom: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  patientOption: {
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  patientText: {
    color: 'black',
    fontSize: FONT_SIZE.md,
  },
  cancelButton: {
    marginTop: SPACING.md,
    backgroundColor: '#e74c3c',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: FONT_SIZE.md,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.xs,
    color: '#000',
    fontSize: FONT_SIZE.input,
  },
  patientsContainer: {
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginBottom: SPACING.lg,
  },
  inputFlex: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.md : SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
    color: 'black',
    fontSize: FONT_SIZE.input,
    minHeight: LAYOUT.inputHeight,
  },
  searchButton: {
    backgroundColor: '#2563EB',
    borderRadius: LAYOUT.borderRadius.md,
    padding: isTablet ? SPACING.md : SPACING.sm,
    minWidth: moderateScale(80),
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZE.button,
  },
  sectionTitle: {
    fontSize: isTablet ? FONT_SIZE.xl : FONT_SIZE.lg,
    fontWeight: '600',
    marginVertical: SPACING.sm,
    color: '#333',
  },
  // Edit patient header row styles
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  editButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  editPatientButton: {
    backgroundColor: '#6B7280',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  savePatientButton: {
    backgroundColor: '#00B5AD',
  },
  editPatientButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  cancelEditButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
  },
  cancelEditButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  qrContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  qrText: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.sm,
    color: '#334155',
    fontWeight: '600',
  },
  qrImage: {
    width: moderateScale(200),
    height: moderateScale(200),
    marginBottom: SPACING.sm,
  },
  upiId: {
    fontSize: FONT_SIZE.sm,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#1A3C6A',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    width: '100%',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: FONT_SIZE.button,
  },
  label: {
    marginBottom: SPACING.xs,
    color: 'black',
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.xs,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: isTablet ? SPACING.xl : SPACING.lg,
    marginBottom: SPACING.xs,
    flexShrink: 0,
  },
  radioText: {
    color: '#000',
    fontSize: FONT_SIZE.md,
    marginLeft: SPACING.xs,
  },
  timeSlot: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    minWidth: moderateScale(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  customRadioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: isTablet ? SPACING.xl : SPACING.lg,
    marginBottom: SPACING.xs,
  },
  customRadio: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  customRadioSelected: {
    backgroundColor: '#007AFF',
  },
  customRadioInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: 'white',
  },
  timeSlotSelected: {
    backgroundColor: '#0a84ff',
    borderColor: '#0bc148ff',
  },
  timeText: {
    color: '#333',
    fontSize: FONT_SIZE.sm,
  },
  timeSelectedText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZE.sm,
  },
  summaryCard: {
    backgroundColor: '#f1f5f9',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    marginVertical: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: '#374151',
  },
  summaryValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  payNowButton: {
    backgroundColor: '#28a745',
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.lg,
  },
  payNowText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZE.lg,
  },
  addButton: {
    backgroundColor: '#0a84ff',
    padding: SPACING.md,
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    marginTop: SPACING.sm,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FONT_SIZE.button,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xxs,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: LAYOUT.borderRadius.md,
    marginVertical: SPACING.xs,
    overflow: 'hidden',
  },
  picker: {
    height: LAYOUT.inputHeight,
    width: '100%',
    color: 'black',
  },
  modalItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    width: '100%',
  },
  modalItemText: {
    fontSize: FONT_SIZE.md,
    color: '#333',
  },

  // iOS Date Picker Styles
  iosModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  iosDateModalContent: {
    backgroundColor: '#fff',
    paddingBottom: SPACING.lg,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
  },
  iosDateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
  },
  iosModalCancel: {
    color: '#007aff',
    fontSize: FONT_SIZE.md,
  },
  iosModalDone: {
    color: '#007aff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  iosDatePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
});
