import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
  LayoutChangeEvent,
  SafeAreaView,
  Modal,
  Pressable,
  ActionSheetIOS,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import ProgressBar from '../progressBar/progressBar';
import { getCurrentStepIndex, TOTAL_STEPS } from '../../utility/registrationSteps';
import { AuthFetch, AuthPost } from '../../auth/auth';

// Import responsive utilities
import {
  isTablet,
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveHeight,
  responsiveText,
  scale,
  verticalScale,
  HIT_SLOP,
} from '../../utility/responsive';
import {  BankIcon, DownArrowIcon, LeftIndicatorIcon } from '../../utility/SvgIcons';

  // Popular Indian banks with account number length requirements
  const banks = [
    { name: 'State Bank of India (SBI)', accountLength: 7 },
    { name: 'HDFC Bank', accountLength: [13, 14] },
    { name: 'ICICI Bank', accountLength: 12 },
    { name: 'Axis Bank', accountLength: 15 },
    { name: 'Punjab National Bank (PNB)', accountLength: 16 },
    { name: 'Bank of Baroda (BoB)', accountLength: 14 },
    { name: 'Canara Bank', accountLength: 13 },
    { name: 'Union Bank of India', accountLength: 15 },
    { name: 'Kotak Mahindra Bank', accountLength: 14 },
    { name: 'Indian Bank', accountLength: 7 },
    { name: 'Yes Bank', accountLength: 15 },
    { name: 'IDFC First Bank', accountLength: 11 },
    { name: 'Federal Bank', accountLength: 14 },
    { name: 'IndusInd Bank', accountLength: 13 },
    { name: 'Bank of India (BOI)', accountLength: 15 },
  ];

const FinancialSetupScreen = () => {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [reenterAccountNumber, setReenterAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [prefill, setPrefill] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);

  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView | null>(null);
  const positionsRef = useRef<{ [key: string]: number }>({});

  // (Optional) simple iOS keyboard animation smoothing (no height tracking)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', () => {});
      const hideSub = Keyboard.addListener('keyboardWillHide', () => {});
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  const validateForm = () => {
    let tempErrors: { [key: string]: string } = {};

    if (!bank) {
      tempErrors.bank = 'Please select a bank';
    }

    if (!accountNumber) {
      tempErrors.accountNumber = 'Account number is required';
    } else {
      if (!/^\d+$/.test(accountNumber)) {
        tempErrors.accountNumber = 'Account number must contain only digits';
      } else if (accountNumber.length < 7 || accountNumber.length > 18) {
        tempErrors.accountNumber = 'Account number must be between 7 to 18 digits';
      }
    }

    if (accountNumber !== reenterAccountNumber) {
      tempErrors.reenterAccountNumber = 'Account numbers do not match';
    }

    if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      tempErrors.ifscCode = 'Invalid IFSC code';
    }

    if (!accountHolderName.trim()) {
      tempErrors.accountHolderName = 'Account holder name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(accountHolderName)) {
      tempErrors.accountHolderName = 'Account holder name must contain only letters and spaces';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const fetchUserData = async () => {
    setLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch('users/getUser', token);
      if (response?.data?.status === 'success') {
        const userData = response.data.data;
        if (userData?.bankDetails) {
          setPrefill(true);
          setBank(userData?.bankDetails?.bankName);
          setAccountNumber(userData?.bankDetails?.accountNumber || '');
          setReenterAccountNumber(userData?.bankDetails?.accountNumber || '');
          setIfscCode(userData?.bankDetails?.ifscCode || '');
          setAccountHolderName(userData?.bankDetails?.accountHolderName || '');
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch user data.',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Authentication token not found',
            position: 'top',
            visibilityTime: 3000,
          });
          return;
        }

        const body = {
          bankDetails: {
            accountNumber,
            ifscCode,
            bankName: bank,
            accountHolderName,
          },
        };

        const response = await AuthPost('users/updateBankDetails', body, token);
        const status = (response as any).data?.status ?? response.status;
        const message =
          (response as any).data?.message ?? (response as any).message ?? 'Failed to update bank details';

        if (status === 'success') {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Bank details updated successfully',
            position: 'top',
            visibilityTime: 3000,
          });
          await AsyncStorage.setItem('currentStep', 'KYCDetailsScreen');
          navigation.navigate('KYCDetailsScreen');
        } else {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: message,
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
    }
  };

  const handleBack = () => {
    navigation.navigate('ConsultationPreferences');
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      await AsyncStorage.setItem('currentStep', 'KYCDetailsScreen');
      Toast.show({
        type: 'info',
        text1: 'Skipped',
        text2: 'Financial setup skipped',
        position: 'top',
        visibilityTime: 3000,
      });
      navigation.navigate('KYCDetailsScreen');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to skip. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const onInputLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { y } = e.nativeEvent.layout;
    positionsRef.current[key] = y;
  };

const scrollToInput = (inputKey: string) => {
  const y = positionsRef.current[inputKey];
  if (typeof y === 'number' && scrollViewRef.current) {
      const BUFFER = responsiveHeight(33); // similar to before, keeps field nicely high
    const target = Math.max(0, y - Math.round(BUFFER));
    scrollViewRef.current.scrollTo({ y: target, animated: true });
  } else {
    scrollViewRef.current?.scrollTo({ y: 50, animated: true });
  }
  };

  // iOS Bank Picker Action Sheet
  const openBankPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...banks.map(b => b.name), 'Cancel'],
          cancelButtonIndex: banks.length,
        },
        (buttonIndex) => {
          if (buttonIndex < banks.length) {
            setBank(banks[buttonIndex].name);
            setErrors((prev) => ({ ...prev, bank: '' }));
          }
        }
      );
    } else {
      setShowBankPicker(true);
  }
};

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {(loading || loadingUser) && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#00203F" />
            <Text style={styles.loaderText}>{loadingUser ? 'Loading user data...' : 'Processing...'}</Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
                onPress={handleBack}
                hitSlop={HIT_SLOP.md}
              >
                <LeftIndicatorIcon size={ICON_SIZE.md} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Financial Setup</Text>
        </View>

        <ProgressBar currentStep={getCurrentStepIndex('FinancialSetupScreen')} totalSteps={TOTAL_STEPS} />

<ScrollView
  ref={scrollViewRef}
  style={styles.formContainer}
  contentContainerStyle={[
styles.scrollContent,
                {
                  paddingBottom: SAFE_AREA.safeBottom + verticalScale(160),
                },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <BankIcon size={ICON_SIZE.xxxl} color="#00203F" style={styles.icon} />
                <Text style={styles.title}>Add Bank Details</Text>
                <Text style={styles.subtitle}>
                  Please enter your bank account details to proceed.
                </Text>

                <Text style={styles.label}>Select Bank</Text>
                {Platform.OS === 'android' ? (
                  <View
                    style={[styles.input, errors.bank && styles.errorInput]}
                    onLayout={onInputLayout('bank')}
                  >
                    <Picker
                      selectedValue={bank}
                      onValueChange={(itemValue) => {
                        setBank(itemValue);
                        setErrors((prev) => ({ ...prev, bank: '' }));
                      }}
                      style={styles.picker}
                      mode="dropdown"
                      dropdownIconColor="#333"
                    >
                      <Picker.Item label="Select your bank" value="" />
                      {banks.map((b) => (
                        <Picker.Item key={b.name} label={b.name} value={b.name} />
                      ))}
                    </Picker>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.input, errors.bank && styles.errorInput, styles.iosPickerTouchable]}
                    onPress={openBankPicker}
                    onLayout={onInputLayout('bank')}
                    activeOpacity={0.7}
                  >
                    <Text style={bank ? styles.pickerText : styles.pickerPlaceholder}>
                      {bank || 'Select your bank'}
                    </Text>
                    <DownArrowIcon size={ICON_SIZE.xs} color="#666" />
                  </TouchableOpacity>
                )}
                {errors.bank && <Text style={styles.errorText}>{errors.bank}</Text>}

                <Text style={styles.label}>Account Number</Text>
                <View style={{ width: '100%' }} onLayout={onInputLayout('accountNumber')}>
                  <TextInput
                    style={[styles.input, errors.accountNumber && styles.errorInput]}
                    value={accountNumber}
                    onChangeText={(text) => {
                      const onlyDigits = text.replace(/[^\d]/g, '');
                      setAccountNumber(onlyDigits);
                      setErrors((prev) => ({ ...prev, accountNumber: '' }));
                    }}
                    placeholder="Enter account number"
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                    maxLength={18}
                    onFocus={() => scrollToInput('accountNumber')}
                  />
                </View>
                {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}

                <Text style={styles.label}>Re-enter Account Number</Text>
                <View style={{ width: '100%' }} onLayout={onInputLayout('reenterAccountNumber')}>
                  <TextInput
                    style={[styles.input, errors.reenterAccountNumber && styles.errorInput]}
                    value={reenterAccountNumber}
                    onChangeText={(text) => {
                      const onlyDigits = text.replace(/[^\d]/g, '');
                      setReenterAccountNumber(onlyDigits);
                      setErrors((prev) => ({ ...prev, reenterAccountNumber: '' }));
                    }}
                    placeholder="Re-enter account number"
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                    maxLength={18}
                    onFocus={() => scrollToInput('reenterAccountNumber')}
                  />
                </View>
                {errors.reenterAccountNumber && (
                  <Text style={styles.errorText}>{errors.reenterAccountNumber}</Text>
                )}

                <Text style={styles.label}>IFSC Code</Text>
                <View style={{ width: '100%' }} onLayout={onInputLayout('ifscCode')}>
                  <TextInput
                    style={[styles.input, errors.ifscCode && styles.errorInput]}
                    value={ifscCode}
                    onChangeText={(text) => {
                      setIfscCode(text.toUpperCase());
                      setErrors((prev) => ({ ...prev, ifscCode: '' }));
                    }}
                    placeholder="Enter IFSC code"
                    placeholderTextColor="#999"
                    autoCapitalize="characters"
                    maxLength={11}
                    onFocus={() => scrollToInput('ifscCode')}
                  />
                </View>
                {errors.ifscCode && <Text style={styles.errorText}>{errors.ifscCode}</Text>}

                <Text style={styles.label}>Account Holder Name</Text>
                <View style={{ width: '100%' }} onLayout={onInputLayout('accountHolderName')}>
                  <TextInput
                    style={[styles.input, errors.accountHolderName && styles.errorInput]}
                    value={accountHolderName}
                    onChangeText={(text) => {
                      setAccountHolderName(text);
                      setErrors((prev) => ({ ...prev, accountHolderName: '' }));
                    }}
                    placeholder="Enter account holder name"
                    placeholderTextColor="#999"
                    onFocus={() => scrollToInput('accountHolderName')}
                  />
                </View>
                {errors.accountHolderName && (
                  <Text style={styles.errorText}>{errors.accountHolderName}</Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.buttonsWrapper}>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.skipButton]} 
                  onPress={handleSkip}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.buttonText, styles.skipButtonText]}>Skip</Text>
                </TouchableOpacity>
                {prefill && (
                  <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buttonText}>Next</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {Platform.OS === 'android' && showBankPicker && (
              <Modal
                visible={showBankPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBankPicker(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Pressable onPress={() => setShowBankPicker(false)}>
                        <Text style={styles.modalCancel}>Cancel</Text>
                      </Pressable>
                    </View>
                    <View style={styles.modalPickerWrap}>
                      <Picker
                        selectedValue={bank}
                        onValueChange={(itemValue) => {
                          setBank(itemValue);
                          setErrors((prev) => ({ ...prev, bank: '' }));
                          setShowBankPicker(false);
                        }}
                      >
                        <Picker.Item label="Select your bank" value="" />
                        {banks.map((b) => (
                          <Picker.Item key={b.name} label={b.name} value={b.name} />
                        ))}
                      </Picker>
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
  formContainer: {
    flex: 1,
    paddingHorizontal: SAFE_AREA.safeHorizontal,
  },
  scrollContent: {
    paddingVertical: verticalScale(SPACING.lg),
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.xl : SPACING.lg,
    ...LAYOUT.shadow.md,
    alignItems: 'center',
  },
  icon: {
    marginBottom: verticalScale(SPACING.lg),
  },
  title: {
    fontSize: responsiveText(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(SPACING.xs),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveText(14),
    color: '#666',
    textAlign: 'center',
    marginBottom: verticalScale(SPACING.lg),
    fontWeight: '500',
    lineHeight: verticalScale(20),
  },
  label: {
    fontSize: responsiveText(14),
    fontWeight: '500',
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: verticalScale(SPACING.xs),
    marginTop: verticalScale(SPACING.md),
  },
  input: {
    width: '100%',
    height: LAYOUT.inputHeight,
    borderColor: '#E0E0E0',
    borderWidth: scale(1),
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    marginBottom: verticalScale(SPACING.xs),
    backgroundColor: '#fff',
    color: '#333',
    fontSize: FONT_SIZE.input,
    ...LAYOUT.shadow.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: '100%',
    color: '#333',
  },
  errorInput: {
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: responsiveText(12),
    alignSelf: 'flex-start',
    marginBottom: verticalScale(SPACING.xs),
  },
  // Bottom buttons wrapper (same pattern as PersonalInfo / ConsultationPreferences)
  buttonsWrapper: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: '#DCFCE7',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#00203F',
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
    ...LAYOUT.shadow.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  skipButton: {
    backgroundColor: '#fff',
    borderWidth: scale(1),
    borderColor: '#00203F',
  },
  buttonText: {
    color: '#fff',
    fontSize: responsiveText(16),
    fontWeight: '600',
  },
  skipButtonText: {
    color: '#00203F',
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
  modalHeader: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  modalCancel: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  modalPickerWrap: {
    paddingHorizontal: 0,
  },
});

export default FinancialSetupScreen;
