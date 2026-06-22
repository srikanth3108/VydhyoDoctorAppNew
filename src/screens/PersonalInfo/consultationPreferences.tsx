import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import ProgressBar from '../progressBar/progressBar';
import { getCurrentStepIndex, TOTAL_STEPS } from '../../utility/registrationSteps';
import { AuthFetch, AuthPost } from '../../auth/auth';

// Import responsive utilities
import {
  SCREEN_HEIGHT,
  isAndroid,
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
import { CheckMarkIcon, HomeIcon, LeftIndicatorIcon, PersonIcon, VideoIcon } from '../../utility/SvgIcons';

const ConsultationPreferences = () => {
  const insets = useSafeAreaInsets();

  const [selectedModes, setSelectedModes] = useState({
    inPerson: false,
    video: false,
    homeVisit: false,
  });

  const [fees, setFees] = useState<{ inPerson: string; video: string; homeVisit: string }>({
    inPerson: '0',
    video: '0',
    homeVisit: '0',
  });

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);

  const navigation = useNavigation<any>();
  const scrollRef = useRef<ScrollView | null>(null);
  const inPersonRef = useRef<TextInput | null>(null);
  const videoRef = useRef<TextInput | null>(null);
  const homeVisitRef = useRef<TextInput | null>(null);

  useEffect(() => {
    // Smooth iOS layout changes on keyboard show/hide (like PersonalInfo)
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', () => {});
      const hideSub = Keyboard.addListener('keyboardWillHide', () => {});
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  const handleModeToggle = (mode: keyof typeof selectedModes) => {
    setSelectedModes(prev => {
      const next = !prev[mode];
      if (!next) {
        setFees(f => ({ ...f, [mode]: '0' }));
      }
      return { ...prev, [mode]: next };
    });
  };

  const handleFeeChange = (mode: keyof typeof selectedModes, value: string) => {
    if (!selectedModes[mode]) return;
    let v = value.replace(/\D/g, "");
    v = v.replace(/^0+(?=\d)/, "");
    if (v.length > 5) v = v.slice(0, 5);
    if (v === "") v = "0";
    setFees(prev => ({ ...prev, [mode]: v }));
  };

  const isFormValid = () => {
    const hasSelectedMode = selectedModes.inPerson || selectedModes.video || selectedModes.homeVisit;
    if (!hasSelectedMode) return false;
    return (
      (!selectedModes.inPerson || (parseInt(fees.inPerson || '0', 10) > 0)) &&
      (!selectedModes.video || (parseInt(fees.video || '0', 10) > 0)) &&
      (!selectedModes.homeVisit || (parseInt(fees.homeVisit || '0', 10) > 0))
    );
  };

  const handleBack = () => {
    navigation.navigate('Practice');
  };

  const handleNext = async () => {
    const hasSelectedMode = selectedModes.inPerson || selectedModes.video || selectedModes.homeVisit;
    if (!hasSelectedMode) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please select at least one consultation mode and set a valid fee.',
      });
      return;
    }

    const invalidModes = [];
    if (selectedModes.inPerson && parseInt(fees.inPerson || '0', 10) < 10) {
      invalidModes.push('In-Person');
    }
    if (selectedModes.video && parseInt(fees.video || '0', 10) < 10) {
      invalidModes.push('Video');
    }
    if (selectedModes.homeVisit && parseInt(fees.homeVisit || '0', 10) < 10) {
      invalidModes.push('Home Visit');
    }

    if (invalidModes.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Minimum Fee Required',
        text2: `Please set fee to at least ₹10 for: ${invalidModes.join(', ')}`,
      });
      return;
    }

    const payload = {
      consultationModeFee: [
        { type: 'In-Person', fee: parseInt(fees?.inPerson || '0', 10) },
        { type: 'Video', fee: parseInt(fees?.video || '0', 10) },
        { type: 'Home Visit', fee: parseInt(fees?.homeVisit || '0', 10) },
      ],
    };
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Authentication Error',
          text2: 'Token not found',
        });
        return;
      }
      const response = await AuthPost('users/updateConsultationModes', payload, token);

      if (response.status == 'success') {
        Toast.show({
          type: 'success',
          text1: 'Preferences saved successfully',
        });
        await AsyncStorage.setItem('currentStep', 'FinancialSetupScreen');
        navigation.navigate('FinancialSetupScreen');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: response?.message || 'Unable to update preferences.',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update preferences',
        text2: error?.response?.data?.message || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    setLoadingUser(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const response = await AuthFetch('users/getUser', token);
        if (response.data.status === 'success') {
          const userData = response.data.data;
          const consultationFee = userData.consultationModeFee || [];

          let updatedModes = { inPerson: false, video: false, homeVisit: false };
          let updatedFees = { inPerson: '0', video: '0', homeVisit: '0' };

          consultationFee.forEach((mode: any) => {
            const { type, fee } = mode;
            if (type === 'In-Person') {
              updatedFees.inPerson = String(fee ?? '0');
              if (fee > 0) updatedModes.inPerson = true;
            } else if (type === 'Video') {
              updatedFees.video = String(fee ?? '0');
              if (fee > 0) updatedModes.video = true;
            } else if (type === 'Home Visit') {
              updatedFees.homeVisit = String(fee ?? '0');
              if (fee > 0) updatedModes.homeVisit = true;
            }
          });

          setSelectedModes(updatedModes);
          setFees(updatedFees);
        }
      }
    } catch (error) {
      Alert.alert('Error', (error as any)?.message || 'Failed to load user data.');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // 🔥 Scroll input nicely above keyboard (same pattern as other screens)
  const scrollToInput = (ref: React.RefObject<TextInput>) => {
    setTimeout(() => {
      const input = ref.current;
      if (!input || !scrollRef.current) return;
      input.measure?.((fx, fy, w, h, px, py) => {
        const BUFFER = verticalScale(150); // keep field comfortably above keyboard + Next button
        const targetY = Math.max(py - BUFFER, 0);
        scrollRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
      });
    }, 150);
  };

  // Fixed positions for card
  const [cardTop, setCardTop] = useState(0);
  const [cardHeight, setCardHeight] = useState(0);
  const headerHeightRef = useRef(0);
  const progressHeightRef = useRef(0);

  const onHeaderLayout = (e: any) => {
    const h = e.nativeEvent.layout.height;
    headerHeightRef.current = h;
    setCardTop(headerHeightRef.current + progressHeightRef.current + SPACING.md);
  };

  const onProgressLayout = (e: any) => {
    const h = e.nativeEvent.layout.height;
    progressHeightRef.current = h;
    setCardTop(headerHeightRef.current + progressHeightRef.current + SPACING.md);
  };

  const onCardLayout = (e: any) => {
    const h = e.nativeEvent.layout.height;
    setCardHeight(h);
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
                <Text style={styles.loaderText}>
                  {loadingUser ? 'Loading user data...' : 'Processing...'}
                </Text>
              </View>
            )}

            <View style={styles.header} onLayout={onHeaderLayout}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                hitSlop={HIT_SLOP.md}
              >
                <LeftIndicatorIcon size={ICON_SIZE.lg} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Consultation Preferences</Text>
            </View>

            <View onLayout={onProgressLayout}>
              <ProgressBar
                currentStep={getCurrentStepIndex('ConsultationPreferences')}
                totalSteps={TOTAL_STEPS}
              />
            </View>

            <View
              style={[
                styles.card,
                {
                  position: 'absolute',
                  left: SAFE_AREA.safeHorizontal,
                  right: SAFE_AREA.safeHorizontal,
                  top: cardTop,
                  zIndex: 10,
                  elevation: 6,
                },
              ]}
              onLayout={onCardLayout}
            >
              <Text style={styles.label}>Set Consultation Fees (in ₹)</Text>
              <View style={styles.feeContainer}>
                <View style={styles.feeRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedModes.inPerson && styles.checkboxSelected,
                    ]}
                    onPress={() => handleModeToggle("inPerson")}
                  >
                    {selectedModes.inPerson && (
                      <CheckMarkIcon size={ICON_SIZE.xs} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <PersonIcon size={ICON_SIZE.md} color="#00203F" style={styles.feeIcon} />
                  <Text style={styles.feeLabel}>In-Person</Text>
                  <TextInput
                    ref={inPersonRef}
                    style={[styles.input, !selectedModes.inPerson && styles.inputDisabled]}
                    value={fees.inPerson}
                    onFocus={() => scrollToInput(inPersonRef)}
                    onChangeText={(value) => handleFeeChange("inPerson", value)}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="₹0"
                    placeholderTextColor="#999"
                    editable={selectedModes.inPerson}
                  />
                </View>

                <View style={styles.feeRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, selectedModes.video && styles.checkboxSelected]}
                    onPress={() => handleModeToggle("video")}
                  >
                    {selectedModes.video && (
                    <CheckMarkIcon size={ICON_SIZE.xs} color="#fff" />

                    )}
                  </TouchableOpacity>
                  <VideoIcon size={ICON_SIZE.md} color="#00203F" style={styles.feeIcon} />
                  <Text style={styles.feeLabel}>Video</Text>
                  <TextInput
                    ref={videoRef}
                    style={[styles.input, !selectedModes.video && styles.inputDisabled]}
                    value={fees.video}
                    onFocus={() => scrollToInput(videoRef)}
                    onChangeText={(value) => handleFeeChange("video", value)}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="₹0"
                    placeholderTextColor="#999"
                    editable={selectedModes.video}
                  />
                </View>

                <View style={styles.feeRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      selectedModes.homeVisit && styles.checkboxSelected,
                    ]}
                    onPress={() => handleModeToggle("homeVisit")}
                  >
                    {selectedModes.homeVisit && (
                    <CheckMarkIcon size={ICON_SIZE.xs} color="#fff" />

                    )}
                  </TouchableOpacity>
                  <HomeIcon size={ICON_SIZE.md} color="#00203F" style={styles.feeIcon} />
                  <Text style={styles.feeLabel}>Home Visit</Text>
                  <TextInput
                    ref={homeVisitRef}
                    style={[styles.input, !selectedModes.homeVisit && styles.inputDisabled]}
                    value={fees.homeVisit}
                    onFocus={() => scrollToInput(homeVisitRef)}
                    onChangeText={(value) => handleFeeChange("homeVisit", value)}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="₹0"
                    placeholderTextColor="#999"
                    editable={selectedModes.homeVisit}
                  />
                </View>
              </View>
            </View>

            <ScrollView
              ref={c => (scrollRef.current = c)}
              style={styles.formContainer}
              contentContainerStyle={{
                paddingTop: Math.max(cardTop + cardHeight + SPACING.md, responsiveHeight(35)),
                paddingBottom: verticalScale(140), // enough space so inputs can scroll above footer
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

              <View style={{ height: verticalScale(240) }} />
            </ScrollView>

            <View style={styles.nextButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  (!isFormValid() || loading) && styles.disabledButton,
                ]}
                disabled={!isFormValid() || loading}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#DCFCE7",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#DCFCE7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00203F",
    paddingVertical: verticalScale(SPACING.lg),
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    shadowColor: "#000",
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
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginRight: isTablet ? scale(40) : scale(24),
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: SAFE_AREA.safeHorizontal,
  },
  card: {
    backgroundColor: "#fff",
    padding: isTablet ? SPACING.lg : SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.md,
  },
  label: {
    fontSize: responsiveText(16),
    fontWeight: "500",
    color: "#333",
    marginBottom: verticalScale(SPACING.md),
    marginTop: 0,
  },
  feeContainer: {
    marginBottom: verticalScale(SPACING.lg),
  },
  feeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(SPACING.md),
  },
  checkbox: {
    width: scale(24),
    height: scale(24),
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: LAYOUT.borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  checkboxSelected: {
    backgroundColor: "#00203F",
    borderColor: "#00203F",
  },
  feeIcon: {
    marginRight: SPACING.sm,
  },
  feeLabel: {
    flex: 1,
    fontSize: responsiveText(14),
    color: "#333",
  },
  input: {
    flex: 1,
    borderWidth: scale(1),
    borderColor: "#E0E0E0",
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    textAlign: "center",
    color: "#333",
    fontSize: FONT_SIZE.input,
    backgroundColor: "#fff",
    ...LAYOUT.shadow.sm,
    height: LAYOUT.inputHeight,
  },
  inputDisabled: {
    backgroundColor: "#F5F5F5",
    color: "#999",
  },
  nextButtonContainer: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: "#DCFCE7",
  },
  nextButton: {
    backgroundColor: "#00203F",
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    ...(isAndroid && { elevation: 6 }),
  },
  disabledButton: {
    backgroundColor: "#B0BEC5",
  },
  nextText: {
    color: "#fff",
    fontSize: responsiveText(16),
    fontWeight: "600",
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
});

export default ConsultationPreferences;
