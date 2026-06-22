import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Animated,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent as RNNativeSyntheticEvent,
} from 'react-native';
import { EyeOpenIcon, EyeClosedIcon } from '../utility/SvgIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import {  UsePost } from '../auth/auth';
import {
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
  isTablet,
  responsiveWidth,
} from '../utility/responsive';
import { PhoneIcon, LockIcon } from '../utility/SvgIcons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const usePressScale = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return { scale, onPressIn, onPressOut };
};

const BUTTON_HEIGHT = LAYOUT.buttonHeight;
const BUTTON_MARGIN = SPACING.lg;

const DoctorLoginScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [userId, setUserId] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>(Array(6).fill(null));

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffsetRef = useRef(0);
  const [bodyHeight, setBodyHeight] = useState(0);

  const otpContainerYRef = useRef(0);
  const pinContainerYRef = useRef(0);
  const mobileContainerYRef = useRef(0);

  // PIN login state
  const [loginMethod, setLoginMethod] = useState<'otp' | 'pin'>('otp');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const pinInputRef = useRef<TextInput>(null);
  const { scale, onPressIn, onPressOut } = usePressScale();

  const validateMobile = (number: string) => /^[6-9]\d{9}$/.test(number);
  const validatePin = (pin: string) => /^\d{4}$/.test(pin);

  /**
   * Scroll the field so:
   *  - It appears near the top (logo goes off-screen)
   *  - Its bottom stays ABOVE the fixed button
   */
  const scrollToField = (fieldY: number, fieldHeight: number = LAYOUT.inputHeight) => {
    if (!bodyHeight) return;

    requestAnimationFrame(() => {
      const visibleHeight =
        bodyHeight - BUTTON_HEIGHT - BUTTON_MARGIN - SAFE_AREA.safeBottom;

      if (visibleHeight <= 0) return;

      const desiredTop = SPACING.lg; // keep some top margin
      let targetOffset = fieldY - desiredTop;

      if (targetOffset < 0) targetOffset = 0;

      const fieldBottom = fieldY + fieldHeight;
      const maxAllowedOffset = fieldBottom - (visibleHeight - SPACING.sm);

      if (maxAllowedOffset > targetOffset) {
        targetOffset = maxAllowedOffset;
        if (targetOffset < 0) targetOffset = 0;
      }

      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: targetOffset, animated: true });
      }
    });
  };

  const handleOtpChange = (text: string, index: number) => {
  const cleaned = text.replace(/\D/g, '');
    const newOtp = [...otp];
  if (cleaned.length > 1) {
    const digits = cleaned.slice(0, 6).split('');

    digits.forEach((digit, i) => {
      if (index + i < 6) {
        newOtp[index + i] = digit;
      }
    });

    setOtp(newOtp);

    const nextIndex = Math.min(index + digits.length, 5);
    otpRefs.current[nextIndex]?.focus();
    return;
  }

  // Normal typing
  newOtp[index] = cleaned;
  setOtp(newOtp);

if (cleaned && index < 5) {otpRefs.current[index + 1]?.focus();
  }
};

  const handleOtpKey = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpFocus = (_e?: NativeSyntheticEvent<TextInputFocusEventData>) => {
    scrollToField(otpContainerYRef.current, LAYOUT.inputHeight);
  };

  const handlePinFocus = () => {
    scrollToField(pinContainerYRef.current, LAYOUT.inputHeight);
  };

  const handleMobileFocus = () => {
    scrollToField(mobileContainerYRef.current, LAYOUT.inputHeight);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOtpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }

    return () => interval && clearInterval(interval);
  }, [isOtpSent, resendTimer]);

  const toggleLoginMethod = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLoginMethod((prev) => (prev === 'otp' ? 'pin' : 'otp'));
    setOtp(['', '', '', '', '', '']);
    setPin('');
    setShowOtp(false);
    setIsOtpSent(false);
    setOtpError('');
    setPinError('');
  };

  const handleSendOtp = async () => {
    if (!mobile) return setMobileError('Mobile number is required');
    if (!validateMobile(mobile)) return setMobileError('Enter a valid 10-digit mobile number');

    setMobileError('');
    setSendingOtp(true);
    setIsOtpSent(true);
    setResendTimer(60);
    setCanResend(false);

    try {
      const specialMobileNumbers = ['9052519059', '9701646859'];
      const endpoint = specialMobileNumbers.includes(mobile) ? 'auth/doctorLogin' : 'auth/login';
      const response = await UsePost(endpoint, {
        mobile,
        userType: 'doctor',
        language: 'tel',
      });
      if (response?.status === 'success' && response?.data) {
        setUserId(response?.data?.userId);
        setShowOtp(true);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response?.data?.message || 'OTP sent successfully',
          position: 'top',
        });
      } else {
        setMobileError(response?.message || 'Failed to send OTP');
        setIsOtpSent(false);
      }
    } catch (err) {
      setMobileError('Network error. Please try again.');
      setIsOtpSent(false);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');

    try {
      const specialMobileNumbers = ['9052519059', '9701646859'];
      const endpoint = specialMobileNumbers.includes(mobile) ? 'auth/doctorLogin' : 'auth/login';

      const response = await UsePost(endpoint, {
        mobile,
        userType: 'doctor',
        language: 'tel',
      });

      if (response?.status === 'success' && response?.data) {
        setUserId(response?.data?.userId);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response?.data?.message || 'OTP resent successfully',
          position: 'top',
        });
      } else {
        setMobileError(response?.message || 'Failed to resend OTP');
        setCanResend(true);
      }
    } catch {
      setMobileError('Network error. Please try again.');
      setCanResend(true);
    }
  };

  const handleLoginWithOtp = async () => {
    await AsyncStorage.removeItem('currentStep');
    const otpString = otp.join('');
    if (otpString.length !== 6) return setOtpError('Enter a valid 6-digit OTP');

    setOtpError('');
    setVerifyingOtp(true);

    try {
      const response = await UsePost('auth/validateOtp', {
        userId,
        OTP: otpString,
        mobile,
      });

      if (response.status === 'success' && response.data) {
        const { accessToken, userData } = response.data;
        const id = userData?.userId;

        await AsyncStorage.setItem('authToken', accessToken);
        await AsyncStorage.setItem('userId', id);

        dispatch({ type: 'currentUser', payload: userData });
        dispatch({ type: 'currentUserID', payload: id });

        Toast.show({ type: 'success', text1: 'Login successful' });
        navigation.replace('Authloader');
      } else {
        setOtpError(response?.message || 'Invalid OTP');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLoginWithPin = async () => {
    if (!mobile) return setMobileError('Mobile number is required');
    if (!validateMobile(mobile)) return setMobileError('Enter a valid 10-digit mobile number');
    if (!validatePin(pin)) return setPinError('Enter a valid 4-digit PIN');

    setMobileError('');
    setPinError('');
    setVerifyingPin(true);

    try {
      const response = await UsePost('auth/loginWithPin', {
        mobile,
        pin,
        role: 'doctor',
      });

      if (response?.status === 'success') {
        const { accessToken, userData } = response.data;
        const id = userData?.userId;

        await AsyncStorage.setItem('authToken', accessToken);
        await AsyncStorage.setItem('userId', id);

        dispatch({ type: 'currentUser', payload: userData });
        dispatch({ type: 'currentUserID', payload: id });

        Toast.show({ type: 'success', text1: 'Login successful' });
        navigation.replace('Authloader');
      } else {
        setPinError(response?.message || 'Invalid PIN');
        if (
          response?.message?.includes('not created') ||
          response?.message?.includes('not found')
        ) {
          Toast.show({
            type: 'error',
            text1: 'PIN Not Created',
            text2: 'Please use OTP login to set up your PIN first',
            position: 'top',
          });
        }
      }
    } catch (err: any) {
      console.warn(err);
      if (err?.response?.status === 500) {
        setPinError('Server error. Please try OTP login instead.');
      } else {
        setPinError('Network error. Please try again.');
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleForgotPin = () => {
    navigation.navigate('PinManagement', {
      action: 'forgot',
      phoneNumber: mobile,
    });
  };

  const handlePinChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= 4) {
      setPin(numericText);
    }
  };

  const handleSubmit = () => {
    if (loginMethod === 'pin') {
      handleLoginWithPin();
    } else {
      if (showOtp) {
        handleLoginWithOtp();
      } else {
        handleSendOtp();
      }
    }
  };

  const getButtonText = () => {
    if (loginMethod === 'pin') {
      return 'Continue with PIN';
    } else {
      return showOtp ? 'Verify OTP' : 'Send OTP';
    }
  };

  const isButtonDisabled = () => {
    if (loginMethod === 'pin') {
      return verifyingPin;
    } else {
      return sendingOtp || verifyingOtp || (!showOtp && isOtpSent);
    }
  };

  const isButtonLoading = () => {
    if (loginMethod === 'pin') {
      return verifyingPin;
    } else {
      return sendingOtp || verifyingOtp;
    }
  };

  // Padding at bottom so content never hides behind the fixed button
  const contentBottomPad =
    BUTTON_HEIGHT + BUTTON_MARGIN + SAFE_AREA.safeBottom + SPACING.sm;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Partner Login</Text>
      </View>

      <View
        style={styles.body}
        onLayout={(e) => {
          setBodyHeight(e.nativeEvent.layout.height);
        }}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.formContainer}
        contentContainerStyle={[styles.formContent, { paddingBottom: contentBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={(e: RNNativeSyntheticEvent<NativeScrollEvent>) => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
      >
        <View style={styles.logoContainer1}>
          <Image source={require('../assets/doclogo.png')} style={styles.doclogo} />
        </View>

        <Text style={styles.label}>Mobile Number*</Text>
        <View
            style={[styles.inputContainer, mobileError ? styles.inputError : null]}
            onLayout={(e) => {
              mobileContainerYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <PhoneIcon size={FONT_SIZE.lg} color="#00203F" style={styles.icon}/>
          <TextInput
            style={styles.input}
            placeholder="9876543210"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            editable={!isOtpSent}
            value={mobile}
            onChangeText={(text) => {
              const digitsOnly = text.replace(/\D/g, '');
              if (digitsOnly.length === 1 && !/[6-9]/.test(digitsOnly[0])) {
                setMobileError('Enter a valid mobile number.');
                setIsOtpSent(false);
                return;
              }
              setMobile(digitsOnly);
              setMobileError('');
              setIsOtpSent(false);
            }}
            maxLength={10}
            returnKeyType="done"
              onFocus={handleMobileFocus}
          />
        </View>
        {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

        <View style={styles.methodToggleContainer}>
          <TouchableOpacity onPress={toggleLoginMethod}>
            <Text style={styles.methodToggleText}>
              {loginMethod === 'otp' ? 'Prefer PIN login?' : 'Prefer OTP?'}
            </Text>
          </TouchableOpacity>
        </View>

        {loginMethod === 'pin' ? (
          <>
            <Text style={styles.label}>PIN</Text>
            <View
              style={[styles.inputContainer, pinError ? styles.inputError : null]}
              onLayout={(e) => {
                pinContainerYRef.current = e.nativeEvent.layout.y;
              }}
            >
              <LockIcon size={FONT_SIZE.lg} color="#00203F" style={styles.icon} />
              <TextInput
                ref={pinInputRef}
                style={styles.input}
                placeholder="Enter 4-digit PIN"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={pin}
                onChangeText={handlePinChange}
                maxLength={4}
                secureTextEntry={!showPin}
                editable={!verifyingPin}
                onFocus={handlePinFocus}
                blurOnSubmit={false}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeClosedIcon size={FONT_SIZE.md} color="#00203F" />
                ) : (
                  <EyeOpenIcon size={FONT_SIZE.md} color="#00203F" />
                )}
              </TouchableOpacity>
            </View>

            {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

            {pinError &&
            !pinError.includes('PIN not set') &&
            !pinError.includes('No user found') && (
              <TouchableOpacity style={styles.forgotPinButton} onPress={handleForgotPin}>
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          /* OTP Login Section */
        showOtp && (
          <>
            <Text style={styles.label}>OTP</Text>
            <View
              style={styles.otpContainer}
              onLayout={(e) => {
                otpContainerYRef.current = e.nativeEvent.layout.y;
              }}
            >
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (otpRefs.current[index] = ref)}
                  style={styles.otpBox}
                  keyboardType="numeric"
                  maxLength={index === 0 ? 6 : 1}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleOtpKey(e, index)}
                  onFocus={handleOtpFocus}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  returnKeyType={index === 5 ? 'done' : 'next'}
                />
              ))}
            </View>
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimerText}>
                      Resend OTP in {resendTimer} seconds
                    </Text>
              )}
            </View>
          </>
        )
        )}

        <View>
          <Text style={styles.tipTitle}>Tip</Text>
          <Text style={styles.tipText}>
              Create a PIN after logging in with OTP for faster future access.
            </Text>
        </View>
      </ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.floatingButtonContainer,
          {
          transform: [{ scale }],
          },
        ]}
      >
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handleSubmit}
          disabled={isButtonDisabled()}
          android_ripple={{ color: '#00000020' }}
        >
          <View style={[styles.button, isButtonDisabled() && { opacity: 0.6 }]}>
            {isButtonLoading() ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{getButtonText()}</Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00203F',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  body: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  formContent: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingTop: SPACING.lg,
  },
  logoContainer1: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.xl,
  },
  doclogo: {
    width: responsiveWidth(isTablet ? 35 : 50),
    height: responsiveWidth(isTablet ? 35 : 50),
    resizeMode: 'contain',
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: '#333',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  inputContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: LAYOUT.borderRadius.md,
    height: LAYOUT.inputHeight,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputError: {
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  icon: {
    marginHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.input,
    color: '#333',
  },
  eyeIcon: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  methodToggleContainer: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  methodToggleText: {
    color: '#007bff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  forgotPinButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  forgotPinText: {
    color: '#007bff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resendText: {
    color: '#00203F',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendTimerText: {
    color: '#666',
    fontSize: FONT_SIZE.xs,
  },
  otpBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    width: responsiveWidth(isTablet ? 7 : 12),
    height: LAYOUT.inputHeight,
    textAlign: 'center',
    fontSize: FONT_SIZE.input,
    backgroundColor: '#fff',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: '#00203F',
    height: BUTTON_HEIGHT,
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: FONT_SIZE.button,
    fontWeight: '600',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: FONT_SIZE.xs,
    marginTop: SPACING.xxs,
    marginBottom: SPACING.xs,
  },
  floatingButtonContainer: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.sm,
    paddingTop: SPACING.sm,
    backgroundColor: 'transparent',
  },
  tipTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#565a5cff',
    marginBottom: SPACING.xs,
    marginTop: SPACING.lg,
  },
  tipText: {
    fontSize: FONT_SIZE.sm,
    color: '#37474F',
    lineHeight: FONT_SIZE.sm * 1.4,
  },
});

export default DoctorLoginScreen;
