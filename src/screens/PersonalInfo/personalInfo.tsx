
import React, { useEffect, useState, useRef } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  FlatList,

  LayoutAnimation,
  SafeAreaView,
  ActionSheetIOS,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import { launchImageLibrary } from 'react-native-image-picker';
import { PersonalInfo } from '../../utility/formTypes';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { AuthFetch, UpdateFiles } from '../../auth/auth';
import ProgressBar from '../progressBar/progressBar';
import { getCurrentStepIndex, TOTAL_STEPS } from '../../utility/registrationSteps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import responsive utilities
import {
  isAndroid,
  isTablet,
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveSafeHeight,
  responsiveText,
  scale,
  verticalScale,
  HIT_SLOP,
} from '../../utility/responsive';
import { AccountIcon, CameraIcon, CheckMarkIcon, DownArrowIcon, LeftIndicatorIcon } from '../../utility/SvgIcons';

const languageOptions = [
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'English', value: 'English' },
  { label: 'Urdu', value: 'Urdu' },
];

const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
];

const PersonalInfoScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    medicalRegNumber: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    spokenLanguages: [] as string[],
    profilePhoto: null as any,
    appLanguage: 'en',
    relationship: 'self',
    bloodGroup: '',
    maritalStatus: 'single',
    yearsExperience: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const [profileImage, setProfileImage] = useState<any>(null);

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [tempSelectedLangs, setTempSelectedLangs] = useState<string[]>([]);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    medicalRegNumber: '',
    email: '',
    gender: '',
    spokenLanguages: '',
    appLanguage: '',
    relationship: '',
    maritalStatus: '',
    yearsExperience: '',
  });

  // For optionally scrolling to focused input
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRefs = {
    firstName: useRef<TextInput | null>(null),
    lastName: useRef<TextInput | null>(null),
    medicalRegNumber: useRef<TextInput | null>(null),
    email: useRef<TextInput | null>(null),
  };

  useEffect(() => {
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
      const hideSub = Keyboard.addListener('keyboardWillHide', () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
}
  }, []);

  const getMinDate = () => {
    const today = new Date();
    const minDate = new Date(today.setFullYear(today.getFullYear() - 20));
    return minDate;
  };

  const confirmDateSelection = () => {
    setFormData(prev => ({ ...prev, dateOfBirth: tempDate as any }));
    setErrors(prev => ({ ...prev, dateOfBirth: '' as any }));
    setShowDateModal(false);
  };

  const cancelDateSelection = () => {
    setShowDateModal(false);
  };

  const handleImagePick = () => {
    launchImageLibrary(
      { mediaType: 'photo' },
      (response: import('react-native-image-picker').ImagePickerResponse) => {
        if (response.didCancel) {
          // user cancelled
        } else if (response.errorCode) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: response.errorMessage || 'Failed to pick image',
            position: 'top',
            visibilityTime: 3000,
          });
        } else if (
          response.assets &&
          response.assets[0] &&
          typeof response.assets[0].uri === 'string'
        ) {
          const selectedImage = response.assets[0];
          setProfileImage({
            uri: selectedImage.uri,
            type: selectedImage.type || 'image/jpeg',
            name: selectedImage.fileName || `profile_${Date.now()}.jpg`,
          });

          setFormData(prev => ({
            ...prev,
            profilePhoto: selectedImage.uri,
          }));

          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Photo uploaded successfully',
            position: 'top',
            visibilityTime: 3000,
          });
        }
      },
    );
  };

  // --- Validation ---
  const validateForm = () => {
    const newErrors = {
      firstName: '',
      lastName: '',
      medicalRegNumber: '',
      email: '',
      gender: '',
      spokenLanguages: '',
      appLanguage: '',
      relationship: '',
      maritalStatus: '',
      yearsExperience: '',
    };

    if (formData.yearsExperience && isNaN(Number(formData.yearsExperience))) {
      newErrors.yearsExperience =
        'Please enter a valid number for years of experience.';
    }

    const fn = formData.firstName.trim();
    if (!fn) newErrors.firstName = 'First Name is required';
    else if (!/^[A-Za-z\s]{3,}$/.test(fn))
      newErrors.firstName = 'First Name must be letters only (min 3)';

    const ln = formData.lastName.trim();
    if (!ln) newErrors.lastName = 'Last Name is required';
    else if (!/^[A-Za-z\s]{1,}$/.test(ln))
      newErrors.lastName = 'Last Name must be letters only (min 1)';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address';

    if (!formData.gender) newErrors.gender = 'Gender is required';

    if (formData.spokenLanguages.length === 0)
      newErrors.spokenLanguages = 'At least one language is required';

    if (!formData.appLanguage) newErrors.appLanguage = 'App Language is required';
    if (!formData.relationship) newErrors.relationship = 'Relationship is required';
    if (!formData.maritalStatus) newErrors.maritalStatus = 'Marital Status is required';
    // const med = formData.medicalRegNumber.trim();
    // if (!med) {
    //   newErrors.medicalRegNumber = 'Medical Registration Number is required';
    // } else if (!isValidMedicalRegNumber(med)) {
    //   newErrors.medicalRegNumber =
    //     'Invalid registration number. e.g. APMC/12345, TSMC/FMR/678901, MMC/2014/123456';
    // }
     const alphaNumSpecialRegex = /^[A-Za-z0-9!@#$%^&()_*+\-=[\]{};':"\\|,.<>/?`~]{5,15}$/;

if (!formData.medicalRegNumber.trim()) {
  newErrors.medicalRegNumber = 'Medical Registration Number is required';
} else if (!alphaNumSpecialRegex.test(formData.medicalRegNumber)) {
  newErrors.medicalRegNumber = 'Must be 5 to 15 characters (letters, numbers, special symbols allowed, no emojis)';
}

setErrors(newErrors);
return Object.values(newErrors).every(err => !err);
  };

  const handleNext = async () => {
    const isValid = validateForm();
    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Please fix the highlighted fields',
        position: 'top',
        visibilityTime: 2500,
      });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Authentication token not found',
          position: 'top',
          visibilityTime: 3000,
        });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('firstname', formData.firstName);
      formDataToSend.append('lastname', formData.lastName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('appLanguage', formData.appLanguage);
      formDataToSend.append('relationship', formData.relationship);
      formDataToSend.append('medicalRegistrationNumber', formData.medicalRegNumber);
      formDataToSend.append('gender', formData.gender);
      formDataToSend.append('bloodgroup', formData.bloodGroup);
      formDataToSend.append('maritalStatus', formData.maritalStatus);
      formDataToSend.append('spokenLanguage', JSON.stringify(formData.spokenLanguages));
      if (profileImage) {
        formDataToSend.append('profilePic', profileImage);
      }
      const response = await UpdateFiles('users/updateUser', formDataToSend, token);

      if ((response as any)?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        await AsyncStorage.setItem('currentStep', 'Specialization');
        navigation.navigate('Specialization');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2:
            'message' in (response as any) &&
              (response as any).message &&
              typeof (response as any).message === 'object' &&
              'message' in (response as any).message
              ? (response as any).message.message
              : 'Failed to update profile',
          position: 'top',
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Network error. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const fetchUserData = async () => {
    setLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      AsyncStorage.setItem('stepNo', '7');
      const response = await AuthFetch('users/getUser', token);
      if (response?.data?.status !== 'success') {
        throw new Error(response?.data?.message || 'Failed to fetch user data');
      }
      const userData = response?.data?.data;

      setFormData({
        firstName: userData?.firstname || '',
        lastName: userData?.lastname || '',
        medicalRegNumber: userData?.medicalRegistrationNumber || '',
        email: userData?.email || '',
        gender: userData?.gender || '',
        dateOfBirth: userData?.dateOfBirth || '',
        spokenLanguages: userData?.spokenLanguage || [],
        profilePhoto: userData?.profilepic || null,
        appLanguage: userData?.appLanguage || 'en',
        relationship: userData?.relationship || 'self',
        bloodGroup: userData?.bloodGroup || '',
        maritalStatus: userData?.maritalStatus || 'single',
        yearsExperience: userData?.yearsExperience || '',
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'An error occurred while fetching user data');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // ===== Language Modal Logic =====
  const openLanguageModal = () => {

    setTempSelectedLangs(formData.spokenLanguages);

    setShowLanguageModal(true);
  };

  const toggleTempLang = (value: string) => {
    setTempSelectedLangs(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value],
    );
  };

  const applyLanguages = () => {
    setFormData(prev => ({ ...prev, spokenLanguages: tempSelectedLangs }));
    setErrors(prev => ({
      ...prev,
      spokenLanguages:
        tempSelectedLangs.length === 0 ? 'At least one language is required' : '',
    }));
    setShowLanguageModal(false);
  };

  const renderLanguageItem = ({ item }: { item: { label: string; value: string } }) => {
    const selected = tempSelectedLangs.includes(item.value);
    return (
      <TouchableOpacity
        style={styles.langRow}
        onPress={() => toggleTempLang(item.value)}
        accessibilityLabel={`Select ${item.label}`}
      >
        <Text style={styles.langRowText}>{item.label}</Text>
        {selected ? <CheckMarkIcon size={ICON_SIZE.sm} color="#00796B" /> : null}
      </TouchableOpacity>
    );
  };

  const selectedLangSummary =
    formData.spokenLanguages.length > 0
      ? formData.spokenLanguages.join(', ')
      : 'Select languages';

  // ===== iOS-style Gender Picker =====
  const openGenderPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Male', 'Female', 'Other', 'Cancel'],
          cancelButtonIndex: 3,
        },
        (buttonIndex) => {
          if (buttonIndex < 3) {
            const gender = ['male', 'female', 'other'][buttonIndex];
            setFormData(prev => ({ ...prev, gender }));
            setErrors(prev => ({ ...prev, gender: '' }));
          }
        }
      );
    } else {
      setShowGenderPicker(true);
    }
  };

  const getGenderLabel = (value: string) => {
    const gender = genderOptions.find(g => g.value === value);
    return gender ? gender.label : 'Select gender';
  };

const onInputFocus = (refName: keyof typeof inputRefs) => {
  setTimeout(() => {
    const inputRef = inputRefs[refName].current;
    if (!inputRef || !scrollRef.current) return;
    inputRef.measure((x, y, width, height, pageX, pageY) => {
      const BUFFER = verticalScale(80); // small offset so field stays comfortably above keyboard

      scrollRef.current?.scrollTo({
        x: 0,
        y: Math.max(pageY - BUFFER, 0),
        animated: true,
      });
    });
  }, 150); // allows keyboard animation to start
};

  const normalizeMedReg = (s = "") =>
    s.trim().toUpperCase().replace(/\s+/g, "").replace(/-/g, "/");

  const MED_REG_PATTERNS = [
    /^[A-Z]{2,6}\/\d{3,7}$/,                    // APMC/12345, TNMC/876543
    /^[A-Z]{2,6}\/[A-Z]{1,4}\/\d{3,7}$/,        // TSMC/FMR/678901, DMC/R/34567
    /^[A-Z]{2,6}\/\d{2,4}\/\d{3,7}$/,           // MMC/2014/123456, MCI/12/34567
    /^[A-Z]{2,6}\/\d{4}\/[A-Z]{2}\/\d{3,7}$/,   // NMC/2020/MP/123456
  ];

  const isValidMedicalRegNumber = (input: string) => {
    const val = normalizeMedReg(input);
    return MED_REG_PATTERNS.some((re) => re.test(val));
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {(loading || loadingUser) && (
              <View style={styles.loaderOverlay}>
                <ActivityIndicator size="large" color="#00203F" />
                <Text style={styles.loaderText}>
                  {loadingUser ? 'Loading practice details...' : 'Processing...'}
                </Text>
              </View>
            )}

            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                hitSlop={HIT_SLOP.md}
              >
                <LeftIndicatorIcon size={ICON_SIZE.xl} color="#fff"/>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Personal Info</Text>
            </View>

            <ProgressBar
              currentStep={getCurrentStepIndex('PersonalInfo')}
              totalSteps={TOTAL_STEPS}
            />

            <View style={styles.contentArea}>
            <ScrollView
              ref={c => (scrollRef.current = c)}
              style={styles.formContainer}
              contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              <View style={styles.profilePhotoContainer}>
                <View style={styles.profileWrapper}>
                  {formData.profilePhoto ? (
                    <Image
                      source={{ uri: formData.profilePhoto }}
                      style={styles.profilePhoto}
                      resizeMode="cover"
                      accessibilityLabel="Profile photo"
                    />
                  ) : (
                    <View style={[styles.profilePhoto, styles.placeholderAvatar]}>
                      <AccountIcon size={ICON_SIZE.xxl} color="#9E9E9E" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.fabCamera}
                    onPress={handleImagePick}
                    accessibilityLabel="Edit profile photo"
                    accessibilityHint="Opens image library to choose a profile photo"
                    activeOpacity={0.8}
                      hitSlop={HIT_SLOP.sm}
                  >
                    <CameraIcon size={ICON_SIZE.md} color="#fff"/>
                  </TouchableOpacity>
                </View>

                <Text style={styles.photoHintText}>
                  Tap the camera to change profile photo
                </Text>
              </View>

              <Text style={styles.label}>First Name*</Text>
              <TextInput
                ref={r => (inputRefs.firstName.current = r)}
                style={styles.input}
                value={formData.firstName}
                onFocus={() => onInputFocus('firstName')}
                onChangeText={text => {
                  const lettersAndSpaces = text.replace(/[^A-Za-z\s]/g, '');
                  setFormData(prev => ({ ...prev, firstName: lettersAndSpaces }));
                  setErrors(prev => ({ ...prev, firstName: '' }));
                }}
                placeholder="Enter first name"
                placeholderTextColor="#999"
              />
              {errors.firstName ? (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              ) : null}

              <Text style={styles.label}>Last Name*</Text>
              <TextInput
                ref={r => (inputRefs.lastName.current = r)}
                style={styles.input}
                value={formData.lastName}
                onFocus={() => onInputFocus('lastName')}
                onChangeText={text => {
                  const lettersAndSpaces = text.replace(/[^A-Za-z\s]/g, '');
                  setFormData(prev => ({ ...prev, lastName: lettersAndSpaces }));
                  setErrors(prev => ({ ...prev, lastName: '' }));
                }}
                placeholder="Enter last name"
                placeholderTextColor="#999"
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              ) : null}

              <Text style={styles.label}>Medical Registration Number*</Text>
              <TextInput
                ref={r => (inputRefs.medicalRegNumber.current = r)}
                style={styles.input}
                value={formData.medicalRegNumber}
                onFocus={() => onInputFocus('medicalRegNumber')}
                onChangeText={text => {
                  setFormData(prev => ({ ...prev, medicalRegNumber: text }));
                  setErrors(prev => ({ ...prev, medicalRegNumber: '' }));
                }}
                placeholder="Enter registration number"
                placeholderTextColor="#999"
                maxLength={15}
              />
              {errors.medicalRegNumber ? (
                <Text style={styles.errorText}>{errors.medicalRegNumber}</Text>
              ) : null}

              <Text style={styles.label}>Email*</Text>
              <TextInput
                ref={r => (inputRefs.email.current = r)}
                style={styles.input}
                value={formData.email}
                onFocus={() => onInputFocus('email')}
                onChangeText={text => {
                  setFormData(prev => ({ ...prev, email: text }));
                  setErrors(prev => ({ ...prev, email: '' }));
                }}
                placeholder="Enter email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}

              <Text style={styles.label}>Gender*</Text>
                {Platform.OS === 'android' ? (
              <View style={[styles.input, errors.gender ? styles.inputError : null]}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={itemValue => {
                    setFormData(prev => ({ ...prev, gender: itemValue as string }));
                    setErrors(prev => ({ ...prev, gender: '' }));
                  }}
                  style={styles.picker}
                  dropdownIconColor="#333"
                >
                  <Picker.Item label="Select gender" value="" />
                  <Picker.Item label="Male" value="male" />
                  <Picker.Item label="Female" value="female" />
                  <Picker.Item label="Other" value="other" />
                </Picker>
              </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.input, errors.gender ? styles.inputError : null, styles.iosPickerTouchable]}
                    onPress={openGenderPicker}
                    activeOpacity={0.7}
                  >
                    <Text style={formData.gender ? styles.pickerText : styles.pickerPlaceholder}>
                      {getGenderLabel(formData.gender)}
                    </Text>
                    <DownArrowIcon size={ICON_SIZE.xs} color="#666" />
                  </TouchableOpacity>
                )}
              {errors.gender ? (
                <Text style={styles.errorText}>{errors.gender}</Text>
              ) : null}

              <Text style={styles.label}>Languages Spoken*</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={openLanguageModal}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.selectedTextStyle,
                    formData.spokenLanguages.length === 0 && styles.placeholderStyle,
                  ]}
                  numberOfLines={1}
                >
                  {selectedLangSummary}
                </Text>
                <DownArrowIcon size={ICON_SIZE.xs} color="#666" />

              </TouchableOpacity>
            {errors.spokenLanguages ? (
                <Text style={styles.errorText}>{errors.spokenLanguages}</Text>
              ) : null}

              <View style={styles.spacer} />
            </ScrollView>
          </View>

            <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
            </View>

            <Modal
              visible={showLanguageModal}
              animationType="fade"
              transparent
              onRequestClose={() => setShowLanguageModal(false)}
            >
              <View style={styles.modalOverlayCentered}>
                <View style={styles.modalCardCentered}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Languages</Text>
                    <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                      
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={languageOptions}
                    keyExtractor={(item) => item.value}
                    renderItem={renderLanguageItem}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    style={{ 
                      flexGrow: 0, 
                      maxHeight: responsiveSafeHeight(45), 
                      marginTop: SPACING.md 
                    }}
                    keyboardShouldPersistTaps="handled"
                  />

                  <View style={styles.selectedChipsWrap}>
                    {tempSelectedLangs.map(v => (
                      <View key={v} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText}>{v}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.cancelBtn]}
                      onPress={() => setShowLanguageModal(false)}
                    >
                      <Text style={styles.modalBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtn, styles.applyBtn]}
                      onPress={applyLanguages}
                    >
                      <Text style={[styles.modalBtnText, { color: '#fff' }]}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            {Platform.OS === 'android' && showGenderPicker && (
              <Modal
                visible={showGenderPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowGenderPicker(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Pressable onPress={() => setShowGenderPicker(false)}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                      </Pressable>
                    </View>
                    <View style={styles.modalPickerWrap}>
                      <Picker
                        selectedValue={formData.gender}
                        onValueChange={itemValue => {
                          setFormData(prev => ({ ...prev, gender: itemValue as string }));
                          setErrors(prev => ({ ...prev, gender: '' }));
                          setShowGenderPicker(false);
                        }}
                      >
                        <Picker.Item label="Select gender" value="" />
                        <Picker.Item label="Male" value="male" />
                        <Picker.Item label="Female" value="female" />
                        <Picker.Item label="Other" value="other" />
                      </Picker>
                    </View>
                  </View>
                </View>
              </Modal>
            )}

            {Platform.OS === 'ios' && showDateModal && (
              <Modal
                visible={showDateModal}
                animationType="slide"
                transparent
                onRequestClose={cancelDateSelection}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.dateModalContent}>
                    <View style={styles.dateModalHeader}>
                      <Pressable onPress={cancelDateSelection}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                      </Pressable>
                      <Pressable onPress={confirmDateSelection}>
                        <Text style={styles.modalDone}>Done</Text>
                      </Pressable>
                    </View>
                    <View style={styles.datePickerWrap}>
                      <DateTimePicker
                        value={tempDate}
                        mode="date"
                        display="spinner"
                        onChange={(_, d) => {
                          if (d) setTempDate(d);
                        }}
                        maximumDate={new Date()}
                        minimumDate={getMinDate()}
                      />
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>

  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00203F',
    paddingVertical: verticalScale(16),
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: responsiveText(18),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginRight: isTablet ? scale(40) : scale(24),
  },
  contentArea: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingVertical: verticalScale(SPACING.md),
  },
  scrollContent: {
    paddingBottom: verticalScale(40),
    flexGrow: 1,
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.lg),
    marginTop: verticalScale(SPACING.sm),
  },
  profileWrapper: {
    width: responsiveWidth(isTablet ? 25 : 28),
    height: responsiveWidth(isTablet ? 25 : 28),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhoto: {
    width: responsiveWidth(isTablet ? 23 : 26),
    height: responsiveWidth(isTablet ? 23 : 26),
    borderRadius: responsiveWidth(isTablet ? 11.5 : 13),
    borderWidth: scale(2),
    borderColor: '#00203F',
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatar: {
    backgroundColor: '#F5F5F5',
    borderWidth: scale(1),
    borderColor: '#E0E0E0',
  },
  fabCamera: {
    position: 'absolute',
    right: -scale(2),
    bottom: -scale(2),
    width: responsiveWidth(isTablet ? 8 : 9),
    height: responsiveWidth(isTablet ? 8 : 9),
    borderRadius: responsiveWidth(isTablet ? 8 : 9) / 2,
    backgroundColor: '#00796B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: scale(1.5),
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  photoHintText: {
    marginTop: SPACING.xs,
    fontSize: responsiveText(11),
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  label: {
    fontSize: responsiveText(14),
    fontWeight: '500',
    color: '#333',
    marginBottom: verticalScale(SPACING.xs),
    marginTop: verticalScale(SPACING.md),
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    height: LAYOUT.inputHeight,
    fontSize: FONT_SIZE.input,
    color: '#333',
    borderWidth: scale(1),
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iosPickerTouchable: {
    justifyContent: 'space-between',
  },
  pickerText: {
    color: '#00203F',
    fontSize: FONT_SIZE.input,
    fontWeight: '500',
  },
  pickerPlaceholder: {
    color: '#999',
    fontSize: FONT_SIZE.input,
  },
  picker: {
    height: '100%',
    color: '#333',
    flex: 1,
  },
  nextButtonContainer: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#00203F',
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    ...(isAndroid && {
      elevation: 6,
    }),
  },
  nextText: {
    color: '#fff',
    fontSize: responsiveText(16),
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: responsiveText(12),
    marginTop: verticalScale(SPACING.xs),
    marginBottom: verticalScale(SPACING.xs),
  },
  inputError: {
    borderColor: '#D32F2F',
  },
  spacer: {
    height: verticalScale(40),
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderText: {
    color: '#fff',
    fontSize: responsiveText(14),
    marginTop: verticalScale(SPACING.md),
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalCardCentered: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.xl,
    width: isTablet ? responsiveWidth(80) : responsiveWidth(92),
    maxHeight: responsiveSafeHeight(75),
    paddingHorizontal: SPACING.lg,
    paddingTop: verticalScale(SPACING.lg),
    paddingBottom: verticalScale(SPACING.xl),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(SPACING.md),
  },
  modalTitle: {
    fontSize: responsiveText(16),
    fontWeight: '600',
    color: '#222',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(SPACING.sm),
  },
  langRowText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: '#333',
  },
  separator: {
    height: scale(1),
    backgroundColor: '#EEE',
  },
  selectedChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: LAYOUT.borderRadius.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  selectedChipText: {
    color: '#00203F',
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
  },
  modalBtn: {
    paddingVertical: verticalScale(SPACING.sm),
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: scale(1),
    borderColor: '#DDD',
    marginLeft: SPACING.sm,
  },
  cancelBtn: {
    backgroundColor: '#fff',
  },
  applyBtn: {
    backgroundColor: '#00796B',
    borderColor: '#00796B',
  },
  modalBtnText: {
    color: '#333',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  placeholderStyle: {
    color: '#999',
  },
  selectedTextStyle: {
    color: '#00203F',
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    flex: 1,
    marginRight: SPACING.xs,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingBottom: SAFE_AREA.safeBottom + SPACING.base,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
    maxHeight: responsiveHeight(40),
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
  modalPickerWrap: {
    paddingHorizontal: 0,
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PersonalInfoScreen;
