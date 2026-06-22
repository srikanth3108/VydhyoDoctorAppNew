// PinManagement.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  LayoutAnimation,
  UIManager,
  StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { AuthPost, UsePost } from '../auth/auth';
import { EyeOpenIcon, EyeClosedIcon } from '../utility/SvgIcons';

// Import responsive utilities
import {
  responsiveText,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../utility/responsive';
import CommonHeader from '../utility/CommonHeader';

// enable LayoutAnimation on android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type RootStackParamList = {
  DoctorLogin: undefined;
  PinManagement: { action?: 'set' | 'change' | 'forgot'; phoneNumber?: string };
};

type PinInputWithEyeProps = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  showPin: boolean;
  setShowPin: (s: boolean) => void;
  editable?: boolean;
  onlyDigits4: (s?: string) => string;
};

const _PinInputWithEye: React.FC<PinInputWithEyeProps> = ({
  value,
  onChangeText,
  placeholder,
  showPin,
  setShowPin,
  editable = true,
  onlyDigits4,
}) => {
  return (
    <View style={styles.pinInputContainer}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={'#666'}
        value={value}
        onChangeText={(v) => onChangeText(onlyDigits4(v))}
        secureTextEntry={!showPin}
        keyboardType="number-pad"
        returnKeyType="done"
        blurOnSubmit={false}
        maxLength={4}
        style={styles.pinInput}
        editable={editable}
        importantForAutofill="no"
        autoCorrect={false}
        autoComplete="off"
        textContentType="none"
      />
      <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeIcon} activeOpacity={0.7}>
        {showPin ? (
          <EyeClosedIcon size={moderateScale(18)} color="#00203F" />
        ) : (
          <EyeOpenIcon size={moderateScale(18)} color="#00203F" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export const PinInputWithEye = React.memo(_PinInputWithEye);

/* ---------------------------
   Main component
   --------------------------- */

export const PinManagement: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'PinManagement'>>();
  const currentUser = useSelector((s: any) => s.currentUser);
  const storedUserId = currentUser?.userId;

  // Check if user already has a PIN set
  const hasExistingPin =
    currentUser?.loginPin && currentUser.loginPin !== null && currentUser.loginPin !== '' && currentUser.loginPin !== 'null';

  const initialAction = route.params?.action ?? (hasExistingPin ? 'change' : 'set');
  const initialPhone = route.params?.phoneNumber ?? '';

  const [action, setAction] = useState<'set' | 'change' | 'forgot'>(initialAction);
  const [phone, setPhone] = useState(initialPhone);

  // OTP / verify state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  // PIN form
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Eye icon states
  const [showCurrentPin, setShowCurrentPin] = useState(true);
  const [showNewPin, setShowNewPin] = useState(true);
  const [showConfirmPin, setShowConfirmPin] = useState(true);

  // Refs for OTP inputs
  const otpRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (route.params?.action === 'forgot') {
      setAction('forgot');
      if (route.params?.phoneNumber) setPhone(route.params.phoneNumber);
    } else {
      // Auto-select appropriate action based on PIN status
      setAction(hasExistingPin ? 'change' : 'set');
    }
  }, [route.params, hasExistingPin]);
  useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    if (!route.params?.action) {
      const correctAction = hasExistingPin ? 'change' : 'set';
      if (action !== correctAction) {
        setAction(correctAction);
      }
    }
  });

  return unsubscribe;
}, [navigation, hasExistingPin, route.params?.action, action]);

  const toast = (t: 'success' | 'error', title: string, msg?: string) => {
    Toast.show({ 
      type: t, 
      text1: title, 
      text2: msg, 
      position: 'top',
      visibilityTime: 3000,
      autoHide: true,
      topOffset: moderateScale(50)
    });
  };

  const onlyDigits4 = (s = '') => s.replace(/\D/g, '').slice(0, 4);
  const otpStr = otp.join('');

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);

    setOtp((prev) => {
      const newOtp = [...prev];
      newOtp[index] = digit;
      return newOtp;
    });

    // Auto-focus to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace when current is empty
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast('error', 'Invalid', 'Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const special = ['9052519059', '9701646859'];
      const endpoint = special.includes(phone) ? 'auth/doctorLogin' : 'auth/login';
      const resp = await UsePost(endpoint, { mobile: phone, userType: 'doctor', language: 'tel', status: 'active' });
      if (resp?.data?.userId) {
        setOtpUserId(resp?.data?.userId);
        setIsOtpSent(true);
        toast('success', 'OTP sent', resp?.data?.message);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        toast('error', 'Error', resp?.message || 'Failed to send OTP');
      }
    } catch (err) {
      toast('error', 'Error', 'Failed to send OTP. Please try again.'); // CHANGED
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpStr.length !== 6) {
      toast('error', 'Invalid', 'Enter the complete 6-digit code');
      return;
    }
    if (!otpUserId) {
      toast('error', 'Error', 'Send OTP first');
      return;
    }
    setLoading(true);
    try {
      const resp = await UsePost('auth/validateOtp', { userId: otpUserId, OTP: otpStr, mobile: phone });
      if (resp?.status === 'success') {
        const { accessToken, userData } = resp?.data || {};
        if (accessToken) {
          await AsyncStorage.setItem('authToken', accessToken);
          setVerifiedToken(accessToken);
        }
        if (userData?.userId) {
          await AsyncStorage.setItem('userId', userData.userId);
          dispatch({ type: 'currentUser', payload: userData });
          dispatch({ type: 'currentUserID', payload: userData.userId });
        } else if (otpUserId) {
          await AsyncStorage.setItem('userId', otpUserId);
          dispatch({ type: 'currentUserID', payload: otpUserId });
        }
        setIsOtpVerified(true);
        toast('success', 'Verified', 'You may set your new PIN now');
      } else {
        toast('error', 'Error', resp?.message || 'Verification failed');
      }
    } catch (err) {
      toast('error', 'Error', 'OTP verification failed. Please try again.'); 
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeSubmit = () => {
    setInlineError(null);
    if (action === 'forgot' && !isOtpVerified) {
      setInlineError('Please verify OTP first');
      return false;
    }
    if (action === 'change' && !/^\d{4}$/.test(currentPin)) {
      setInlineError('Enter your current 4-digit PIN');
      return false;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setInlineError('Enter a new 4-digit PIN');
      return false;
    }
    if (!/^\d{4}$/.test(confirmPin)) {
      setInlineError('Confirm the new PIN');
      return false;
    }
    if (newPin !== confirmPin) {
      setInlineError('PINs do not match');
      return false;
    }
    return true;
  };

  const handleSetPin = async () => {
    if (!validateBeforeSubmit()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const uid = storedUserId;
      const resp = await AuthPost('auth/setPin', { userId: uid, pin: newPin, role: 'doctor' }, token || undefined);
      if (resp?.status === 'success') {
        const updatedUser = {
          ...currentUser,
          loginPin: newPin
        };
        dispatch({ type: 'currentUser', payload: updatedUser });
        
        toast('success', 'Success', 'PIN set successfully');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        toast('error', 'Error', resp?.message?.message || 'Failed to set PIN');
      }
    } catch (err: any) {
      toast('error', 'Error', 'Failed to set PIN. Please try again.'); // CHANGED
    } finally {
      setLoading(false);
    }
  };
  const handleChangePin = async () => {
    if (!validateBeforeSubmit()) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const uid = storedUserId;
      const resp = await AuthPost('auth/changePin', { userId: uid, oldPin: currentPin, newPin }, token || undefined);
      if (resp?.status === 'success') {
        const updatedUser = {
          ...currentUser,
          loginPin: newPin
        };
        dispatch({ type: 'currentUser', payload: updatedUser });
        
        toast('success', 'Success', 'PIN changed successfully');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        toast('error', 'Error', resp?.message?.message || 'Failed to change PIN');
      }
    } catch (err: any) {
      toast('error', 'Error', 'Failed to change PIN. Please try again.'); 
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    if (!validateBeforeSubmit()) return;
    setLoading(true);
    try {
      const token = verifiedToken || (await AsyncStorage.getItem('authToken'));
      const uid = (await AsyncStorage.getItem('userId')) || storedUserId || otpUserId;
      if (!uid) {
        toast('error', 'Error', 'Missing user id. Re-run OTP flow.');
        setLoading(false);
        return;
      }
      const resp = await AuthPost(
        'auth/forgotPin',
        {
          userId: uid,
          newPin,
          role: 'doctor',
        },
        token || undefined
      );
      if (resp?.status === 'success') {
        toast('success', 'PIN Reset', resp?.data?.message || 'PIN reset successfully');
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        toast('error', 'Error', resp?.message || 'Failed to reset PIN');
      }
    } catch (err: any) {
      toast('error', 'Error', 'Failed to reset PIN. Please try again.'); // CHANGED
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    if (action === 'set') return handleSetPin();
    if (action === 'change') return handleChangePin();
    return handleForgotPin();
  };

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setInlineError(null);
    setOtp(['', '', '', '', '', '']);
    setIsOtpSent(false);
    setIsOtpVerified(false);
    setOtpUserId(null);
    setVerifiedToken(null);
    // Reset eye icon states
    setShowCurrentPin(false);
    setShowNewPin(false);
    setShowConfirmPin(false);
  };

  const setMode = (mode: 'set' | 'change' | 'forgot') => {
    // If coming from login with 'forgot' action, don't allow changing mode
    if (route.params?.action === 'forgot') {
      return;
    }

    // Don't allow setting PIN if one already exists
    if (mode === 'set' && hasExistingPin) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAction(mode);
    resetForm();
  };

  const canSubmit = () => {
    if (loading) return false;
    if (action === 'forgot' && !isOtpVerified) return false;
    if (action === 'set' && hasExistingPin) return false; // Disable set if PIN exists

    if (action === 'set') return /^\d{4}$/.test(newPin) && /^\d{4}$/.test(confirmPin);
    if (action === 'change') return /^\d{4}$/.test(currentPin) && /^\d{4}$/.test(newPin) && /^\d{4}$/.test(confirmPin);
    if (action === 'forgot') return /^\d{4}$/.test(newPin) && /^\d{4}$/.test(confirmPin);
    return false;
  };

const renderTabs = () => {
  if (route.params?.action === 'forgot') {
    // Only show Forgot PIN tab when coming from login
    return (
      <View style={styles.fullWidthTabContainer}>
        <TouchableOpacity style={styles.fullWidthActiveTab}>
          <Text style={styles.activeTabText}>Forgot PIN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show Set and Change PIN tabs when coming from sidebar
  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          action === 'set' ? styles.activeTab : (hasExistingPin ? styles.disabledTab : styles.inactiveTab)
        ]}
        onPress={() => setMode('set')}
        disabled={hasExistingPin}
      >
        <Text style={[
          styles.tabText,
          action === 'set' ? styles.activeTabText : (hasExistingPin ? styles.disabledTabText : styles.inactiveTabText)
        ]}>
          Set PIN
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, action === 'change' ? styles.activeTab : styles.inactiveTab]}
        onPress={() => setMode('change')}
      >
        <Text style={[styles.tabText, action === 'change' ? styles.activeTabText : styles.inactiveTabText]}>
          Change PIN
        </Text>
      </TouchableOpacity>
    </View>
  );
};
  const renderPinStatus = () => {
    if (action === 'set' && hasExistingPin) {
      return (
        <View style={styles.warningStatus}>
          <Text style={styles.warningStatusTitle}>PIN already set</Text>
          <Text style={styles.warningStatusText}>Try to change it instead</Text>
        </View>
      );
    } else if (action === 'set' && !hasExistingPin) {
      return (
        <View style={styles.infoStatus}>
          <Text style={styles.infoStatusTitle}>No PIN set</Text>
          <Text style={styles.infoStatusText}>Set your PIN now</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <>
        <CommonHeader title="PIN Management" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}keyboardVerticalOffset={Platform.OS === 'ios' ? SAFE_AREA.safeTop + SPACING.md : 0}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="none"
          >
            <View style={styles.formContainer}>

              {renderTabs()}

              {renderPinStatus()}

              {action === 'forgot' && !isOtpVerified ? (
                <>
                  <Text style={styles.sectionTitle}>Mobile Number</Text>
                  <Text style={styles.sectionSubtitle}>
                    First verify your identity to reset your PIN
                  </Text>
                  <TextInput
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor={'#666'}
                    keyboardType="numeric"
                    maxLength={10}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                    style={styles.phoneInput}
                    editable={!isOtpSent && !loading}
                  />

                  {!isOtpSent ? (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={loading}
                      style={styles.primaryButton}
                    >
                      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send Verification Code</Text>}
                    </TouchableOpacity>
                  ) : (
                    <>
                      <Text style={styles.otpSentText}>
                        We sent a 6-digit verification code to +91 {phone}
                      </Text>
                      <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                          <TextInput
                            key={index}
                            ref={(ref) => (otpRefs.current[index] = ref)}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleOtpKeyPress(e, index)}
                            maxLength={1}
                            keyboardType="numeric"
                            blurOnSubmit={false}
                            style={[
                              styles.otpInput,
                              digit ? styles.otpInputFilled : styles.otpInputEmpty
                            ]}
                            selectTextOnFocus
                          />
                        ))}
                      </View>

                      <TouchableOpacity
                        onPress={handleVerifyOtp}
                        disabled={loading || otpStr.length !== 6}
                        style={[
                          styles.primaryButton,
                          otpStr.length !== 6 && styles.disabledButton
                        ]}
                      >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Verify & Reset PIN</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>

                  {action === 'change' && (
                    <>
                      <Text style={styles.sectionTitle}>Current PIN</Text>
                      <PinInputWithEye
                        value={currentPin}
                        onChangeText={setCurrentPin}
                        placeholder="Enter your current 4-digit PIN"
                        showPin={showCurrentPin}
                        setShowPin={setShowCurrentPin}
                        onlyDigits4={onlyDigits4}
                      />
                    </>
                  )}

                  <Text style={styles.sectionTitle}>{action === 'forgot' ? 'New PIN' : 'PIN'}</Text>
                  <PinInputWithEye
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder={action === 'forgot' ? 'Enter new 4-digit PIN' : 'Enter 4-digit PIN'}
                    showPin={showNewPin}
                    setShowPin={setShowNewPin}
                    editable={!(action === 'set' && hasExistingPin)}
                    onlyDigits4={onlyDigits4}
                  />

                  <Text style={styles.sectionTitle}>{action === 'forgot' ? 'Confirm New PIN' : 'Confirm PIN'}</Text>
                  <PinInputWithEye
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder={action === 'forgot' ? 'Confirm new 4-digit PIN' : 'Confirm 4-digit PIN'}
                    showPin={showConfirmPin}
                    setShowPin={setShowConfirmPin}
                    editable={!(action === 'set' && hasExistingPin)}
                    onlyDigits4={onlyDigits4}
                  />

                  {inlineError ? (
                    <Text style={styles.inlineError}>{inlineError}</Text>
                  ) : null}

                  <TouchableOpacity
                    onPress={submit}
                    disabled={!canSubmit() || loading}
                    style={[
                      styles.primaryButton,
                      (!canSubmit() || loading) && styles.disabledButton,
                      styles.submitButton
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        {action === 'set' ? 'Set PIN' : action === 'change' ? 'Change PIN' : 'Reset PIN'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? SPACING.xl : SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(18),
    padding: isTablet ? SPACING.xl : SPACING.lg,
    ...LAYOUT.shadow.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00203F',
  },
  tab: {
    flex: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#00203F',
  },
  inactiveTab: {
    backgroundColor: '#FAFFFE',
  },
  disabledTab: {
    backgroundColor: '#F5F5F5',
  },
  tabText: {
    fontWeight: '700',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  activeTabText: {
    color: '#fff',
  },
  inactiveTabText: {
    color: '#00203F',
  },
  disabledTabText: {
    color: '#9E9E9E',
  },
  warningStatus: {
    backgroundColor: '#FFF3CD',
    padding: SPACING.md,
    borderRadius: moderateScale(8),
    marginBottom: SPACING.lg,
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#FFC107',
  },
  warningStatusTitle: {
    color: '#856404',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  warningStatusText: {
    color: '#856404',
    fontSize: responsiveText(FONT_SIZE.xs),
    marginTop: SPACING.xs,
  },
  infoStatus: {
    backgroundColor: '#D1ECF1',
    padding: SPACING.md,
    borderRadius: moderateScale(8),
    marginBottom: SPACING.lg,
    borderLeftWidth: moderateScale(4),
    borderLeftColor: '#0C5460',
  },
  infoStatusTitle: {
    color: '#0C5460',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  infoStatusText: {
    color: '#0C5460',
    fontSize: responsiveText(FONT_SIZE.xs),
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#00203F',
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  fullWidthTabContainer: { 
    marginBottom: SPACING.lg,
  },
  fullWidthActiveTab: { 
    backgroundColor: '#00203F',
    padding: SPACING.lg,
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  phoneInput: {
    backgroundColor: '#FAFFFE',
    borderRadius: moderateScale(10),
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    marginBottom: SPACING.md,
    color: '#666',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  primaryButton: {
    backgroundColor: '#00203F',
    padding: SPACING.md,
    borderRadius: moderateScale(10),
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  submitButton: {
    marginTop: SPACING.sm,
  },
  otpSentText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  otpInput: {
    flex: 1,
    height: moderateScale(48),
    marginHorizontal: SPACING.xs,
    textAlign: 'center',
    borderRadius: moderateScale(8),
    borderWidth: 1,
    backgroundColor: '#fff',
    fontSize: responsiveText(FONT_SIZE.lg),
    fontWeight: '600',
    color: '#666',
  },
  otpInputEmpty: {
    borderColor: '#E8F5E8',
  },
  otpInputFilled: {
    borderColor: '#00203F',
  },
  inlineError: {
    color: '#D04545',
    marginBottom: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
    textAlign: 'center',
  },
  pinInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFFFE',
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#E8F5E8',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  pinInput: {
    flex: 1,
    padding: SPACING.md,
    color: '#666',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  eyeIcon: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
    borderLeftWidth: 1,
    borderLeftColor: '#E8E8E8',
  },
});

export default PinManagement;