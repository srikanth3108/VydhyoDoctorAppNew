import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Lock,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import {useNavigation} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setPin, forgotPin, getUserProfile} from '../../services/apiHelpers';
import {PROVIDER_THEME, PROVIDER_FONTS} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

interface SecurityLog {
  id: string;
  action: string;
  time: string;
  device: string;
}

const DUMMY_LOGS: SecurityLog[] = [
  {id: '1', action: 'PIN Changed', time: '12 May 2026, 02:40 PM', device: 'iPhone 17 Pro'},
  {id: '2', action: 'Biometrics Enabled', time: '10 May 2026, 11:15 AM', device: 'iPhone 17 Pro'},
  {id: '3', action: 'Login Approved', time: 'Today, 08:30 AM', device: 'iPhone 17 Pro'},
];

export default function ProviderPinManagementScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState('');

  const inputRef = useRef<TextInput>(null);

  const getPinValue = () => {
    if (step === 'current') return currentPin;
    if (step === 'new') return newPin;
    return confirmPin;
  };

  const handleTextChange = (text: string) => {
    if (isSuccess || isUpdating) return;

    const numericText = text.replace(/[^0-9]/g, '');
    setErrorText('');

    if (step === 'current') {
      setCurrentPin(numericText);
      if (numericText.length === 4) {
        if (numericText === '1234') {
          setTimeout(() => {
            setStep('new');
            setCurrentPin('');
          }, 300);
        } else {
          setErrorText('Incorrect current PIN. Please try again.');
          setCurrentPin('');
        }
      }
    } else if (step === 'new') {
      setNewPin(numericText);
      if (numericText.length === 4) {
        setTimeout(() => {
          setStep('confirm');
        }, 300);
      }
    } else {
      setConfirmPin(numericText);
      if (numericText.length === 4) {
        if (numericText === newPin) {
          handleSetPinApi(numericText);
        } else {
          setErrorText('PINs do not match. Please re-enter.');
          setConfirmPin('');
        }
      }
    }
  };

  const handleSetPinApi = async (confirmedPinCode: string) => {
    setIsUpdating(true);
    setErrorText('');
    try {
      const response: any = await setPin({
        pin: confirmedPinCode,
      });

      const resData = response?.data || {};
      const isOk = resData.success || resData.status === 'success' || response?.status === 200 || response?.status === 'success';

      if (isOk) {
        setIsSuccess(true);
        Toast.show({
          type: 'success',
          text1: 'PIN Code Updated',
          text2: 'Your account security PIN has been modified successfully.',
        });
        
        setTimeout(() => {
          navigation.goBack();
        }, 1200);
      } else {
        const errMsg = resData.message || response?.message || 'Failed to update PIN.';
        setErrorText(errMsg);
        setConfirmPin('');
      }
    } catch (err: any) {
      console.error('setPin API error:', err);
      const errMsg = err?.message || 'Network error occurred. Please try again.';
      setErrorText(errMsg);
      setConfirmPin('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForgotPin = async () => {
    setIsUpdating(true);
    setErrorText('');
    try {
      const id = await AsyncStorage.getItem('userId');
      if (!id) throw new Error('User ID not found');
      
      const profileRes: any = await getUserProfile(id);
      const profileData = profileRes?.data?.data?.profile || profileRes?.data?.data || profileRes?.data;
      const mobile = profileData?.mobile || profileData?.phone || profileData?.phoneNumber;
      
      if (!mobile) throw new Error('Could not find registered mobile number');

      const response: any = await forgotPin({ mobile });
      const resData = response?.data || {};
      const isOk = resData.success || resData.status === 'success' || response?.status === 200 || response?.status === 'success';

      if (isOk) {
        Toast.show({
          type: 'success',
          text1: 'PIN Reset Requested',
          text2: resData.message || 'A temporary PIN has been sent to your registered mobile number.',
        });
        setCurrentPin('');
      } else {
        const errMsg = resData.message || response?.message || 'Failed to initiate PIN reset.';
        setErrorText(errMsg);
      }
    } catch (err: any) {
      console.error('forgotPin API error:', err);
      setErrorText(err?.message || 'Failed to request PIN reset. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'current', label: 'Verify' },
      { id: 'new', label: 'Choose' },
      { id: 'confirm', label: 'Confirm' }
    ];

    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((s, idx) => {
          const isActive = step === s.id;
          const isCompleted = 
            (s.id === 'current' && (step === 'new' || step === 'confirm' || isSuccess)) ||
            (s.id === 'new' && (step === 'confirm' || isSuccess)) ||
            (s.id === 'confirm' && isSuccess);
          
          return (
            <React.Fragment key={s.id}>
              {idx > 0 && (
                <View style={[
                  styles.connectorLine,
                  (isCompleted || (s.id === 'new' && step === 'confirm') || (s.id === 'confirm' && isSuccess))
                    ? styles.connectorLineActive
                    : null
                ]} />
              )}
              
              <View style={styles.stepDotWrapper}>
                <View style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isCompleted && styles.stepDotCompleted
                ]}>
                  {isCompleted ? (
                    <Check color="#FFFFFF" size={moderateScale(12)} strokeWidth={3} />
                  ) : (
                    <Text style={[
                      styles.stepDotText,
                      isActive && styles.stepDotTextActive
                    ]}>
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isCompleted && styles.stepLabelCompleted
                ]}>
                  {s.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  const renderSecurityTimeline = () => {
    return (
      <View style={styles.timelineContainer}>
        {DUMMY_LOGS.map((log, index) => {
          const isFirst = index === 0;
          const isLast = index === DUMMY_LOGS.length - 1;
          
          return (
            <View key={log.id} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isFirst && styles.timelineDotFirst
                ]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              
              <View style={styles.timelineContent}>
                <View style={styles.logCardInner}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logAction}>{log.action}</Text>
                    <Text style={styles.logTime}>{log.time}</Text>
                  </View>
                  <Text style={styles.logDevice}>Device: {log.device}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderBoxes = () => {
    const pin = getPinValue();
    const boxes = [];
    for (let i = 0; i < 4; i++) {
      const char = pin[i];
      const isFocused = pin.length === i;
      boxes.push(
        <View
          key={i}
          style={[
            styles.pinBox,
            isFocused && styles.pinBoxFocused,
            char ? styles.pinBoxFilled : null,
            isSuccess && styles.pinBoxSuccess,
          ]}
        >
          {char ? (
            showPin ? (
              <Text style={styles.pinText}>{char}</Text>
            ) : (
              <View style={styles.dot} />
            )
          ) : null}
        </View>
      );
    }
    return boxes;
  };

  const getStepHeader = () => {
    if (step === 'current') return 'Enter Current PIN';
    if (step === 'new') return 'Choose New PIN';
    return 'Confirm New PIN';
  };

  const getStepDesc = () => {
    if (step === 'current') return 'Please enter your 4-digit security PIN to verify identity (default is 1234).';
    if (step === 'new') return 'Create a new secure 4-digit PIN code. Avoid repeating sequences.';
    return 'Re-type your new PIN to confirm accuracy.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.8}
            disabled={isUpdating || isSuccess}
          >
            <ArrowLeft color={PROVIDER_THEME.navy} size={moderateScale(20)} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pin Management</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.securityCard}>
            <View style={styles.shieldWrapper}>
              <Lock color="#E0F7E9" size={moderateScale(32)} strokeWidth={2} />
            </View>
            <View style={styles.securityInfo}>
              <Text style={styles.securityTitle}>PIN Security</Text>
              <Text style={styles.securitySubtitle}>Protect your clinical actions and payments drawer.</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            {renderStepIndicator()}
            <Text style={styles.formHeader}>{getStepHeader()}</Text>
            <Text style={styles.formDesc}>{getStepDesc()}</Text>

            <TouchableOpacity
              onPress={() => !isSuccess && !isUpdating && inputRef.current?.focus()}
              activeOpacity={1}
              style={styles.boxesContainer}
            >
              {renderBoxes()}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={getPinValue()}
              onChangeText={handleTextChange}
              keyboardType="numeric"
              maxLength={4}
              style={styles.hiddenInput}
              autoFocus
              caretHidden
              editable={!isUpdating && !isSuccess}
            />

            {errorText ? (
              <View style={styles.errorContainer}>
                <AlertTriangle color={PROVIDER_THEME.error} size={moderateScale(14)} />
                <Text style={styles.errorText}>{errorText}</Text>
              </View>
            ) : null}

            {isUpdating ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator color={PROVIDER_THEME.navy} size="small" />
                <Text style={styles.loaderText}>Updating PIN securely...</Text>
              </View>
            ) : null}

            {step !== 'current' && !isSuccess && !isUpdating && (
              <TouchableOpacity
                onPress={() => {
                  setStep('current');
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                  setErrorText('');
                }}
                style={{ marginBottom: 12 }}
              >
                <Text style={{ color: PROVIDER_THEME.navy, fontSize: moderateScale(12), fontWeight: '700' }}>
                  Start Over
                </Text>
              </TouchableOpacity>
            )}

            {step === 'current' && !isSuccess && !isUpdating && (
              <TouchableOpacity
                onPress={handleForgotPin}
                style={{ marginBottom: 12 }}
              >
                <Text style={{ color: PROVIDER_THEME.navy, fontSize: moderateScale(12), fontWeight: '700', textDecorationLine: 'underline' }}>
                  Forgot PIN?
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.visibilityBtn}
              onPress={() => setShowPin(!showPin)}
              activeOpacity={0.7}
              disabled={isSuccess}
            >
              {showPin ? (
                <>
                  <EyeOff color={PROVIDER_THEME.textMuted} size={moderateScale(16)} />
                  <Text style={styles.visibilityText}>Hide numbers</Text>
                </>
              ) : (
                <>
                  <Eye color={PROVIDER_THEME.textMuted} size={moderateScale(16)} />
                  <Text style={styles.visibilityText}>Show numbers</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.logSectionTitle}>Security Log Ledger</Text>
          <View style={styles.logsCard}>
            {renderSecurityTimeline()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D3557',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
    ...PROVIDER_THEME.shadowStyles.card,
  },
  shieldWrapper: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(14),
    backgroundColor: '#3D6A9B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C5EBD8',
  },
  securityInfo: {
    flex: 1,
  },
  securityTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#E0F7E9',
  },
  securitySubtitle: {
    fontSize: moderateScale(11),
    color: 'rgba(224, 247, 233, 0.7)',
    marginTop: 2,
    lineHeight: moderateScale(15),
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(20),
    alignItems: 'center',
    marginBottom: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  formHeader: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  formDesc: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    textAlign: 'center',
    marginTop: moderateScale(6),
    lineHeight: moderateScale(16),
    paddingHorizontal: moderateScale(12),
  },
  boxesContainer: {
    flexDirection: 'row',
    gap: moderateScale(14),
    marginVertical: moderateScale(20),
  },
  pinBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: 'rgba(29, 53, 87, 0.1)',
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBoxFocused: {
    borderColor: '#1D3557',
    backgroundColor: '#FFFFFF',
    ...PROVIDER_THEME.shadowStyles.header,
  },
  pinBoxFilled: {
    borderColor: '#3D6A9B',
    backgroundColor: '#FFFFFF',
  },
  pinBoxSuccess: {
    borderColor: '#10B981',
    backgroundColor: '#EBF7F2',
  },
  pinText: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  dot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: PROVIDER_THEME.navy,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(12),
    backgroundColor: 'rgba(220, 74, 104, 0.06)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(220, 74, 104, 0.12)',
  },
  errorText: {
    color: PROVIDER_THEME.error,
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginBottom: moderateScale(12),
  },
  loaderText: {
    color: PROVIDER_THEME.textMuted,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    paddingVertical: moderateScale(4),
  },
  visibilityText: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    fontWeight: '600',
  },
  logSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(10),
  },
  logsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    ...PROVIDER_THEME.shadowStyles.card,
  },
  logAction: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  logDevice: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: 2,
  },
  logTime: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    fontWeight: '500',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: moderateScale(24),
    paddingHorizontal: moderateScale(16),
  },
  stepDotWrapper: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepDot: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#1D3557',
    borderColor: '#1D3557',
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: moderateScale(10),
    color: '#64748B',
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  stepLabelActive: {
    color: '#1D3557',
    fontWeight: '800',
  },
  stepLabelCompleted: {
    color: '#10B981',
  },
  connectorLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: -moderateScale(10),
    marginTop: -moderateScale(14),
    zIndex: 1,
  },
  connectorLineActive: {
    backgroundColor: '#10B981',
  },
  timelineContainer: {
    paddingLeft: moderateScale(4),
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: moderateScale(60),
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  timelineDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#94A3B8',
    zIndex: 2,
    marginTop: moderateScale(4),
  },
  timelineDotFirst: {
    backgroundColor: '#10B981',
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: '#EBF7F2',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: moderateScale(2),
  },
  timelineContent: {
    flex: 1,
    paddingBottom: moderateScale(16),
  },
  logCardInner: {
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(10),
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
