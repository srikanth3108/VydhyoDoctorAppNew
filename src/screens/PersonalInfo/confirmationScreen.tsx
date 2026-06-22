import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { AuthPost, AuthFetch } from '../../auth/auth';
import ProgressBar from '../progressBar/progressBar';
import { getCurrentStepIndex, TOTAL_STEPS } from '../../utility/registrationSteps';
import Toast from 'react-native-toast-message';

// Import responsive utilities
import {
  isTablet,
  isSmallDevice,
  isExtraSmallDevice,
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveText,
  scale,
  verticalScale,
  HIT_SLOP,
} from '../../utility/responsive';
import { BankIcon, BriefcaseIcon, CalendarIcon, ClinicManagementIcon, LeftIndicatorIcon, PersonIcon } from '../../utility/SvgIcons';

interface FormData {
  userId: string;
  addresses: any;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  practice: string;
  consultationPreferences: string;
  bank: string;
  accountNumber: string;
}

const ConfirmationScreen: React.FC = () => {
  const userId = useSelector((state: any) => state.currentUserID);
  const navigation = useNavigation<any>();
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    name: '',
    email: '',
    phone: '',
    specialization: '',
    practice: '',
    consultationPreferences: '',
    bank: '',
    accountNumber: '',
    addresses: [],
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [rawMobile, setRawMobile] = useState<string>('');

  // --- responsive tweaks ---
  const smallDevice = isExtraSmallDevice || isSmallDevice;
  const compactInputHeight = smallDevice ? verticalScale(42) : LAYOUT.inputHeight;
  const compactCardPadding = isTablet ? SPACING.xl : smallDevice ? SPACING.sm : SPACING.lg;
  const headerPaddingVertical = smallDevice ? verticalScale(10) : verticalScale(SPACING.lg);
  const compactSectionTitleSize = smallDevice ? responsiveText(16) : responsiveText(18);
  const compactIconSize = smallDevice ? ICON_SIZE.md - 2 : ICON_SIZE.md;
  const compactFontSizeInput = smallDevice ? FONT_SIZE.input - 1 : FONT_SIZE.input;
  const compactSpacerHeight = smallDevice ? verticalScale(60) : verticalScale(80);

  const validateForm = () => {
    let tempErrors: Partial<FormData> = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email))
      tempErrors.email = 'Valid email is required';
    if (
      !formData.phone.trim() ||
      !/^\+\d{2}\s\d{3}\s\d{3}\s\d{4}$/.test(formData.phone)
    )
      tempErrors.phone = 'Valid phone is required';
    if (!formData.specialization.trim())
      tempErrors.specialization = 'Specialization is required';
    if (!formData.consultationPreferences.trim())
      tempErrors.consultationPreferences = 'Preferences are required';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    // Because this screen is read-only, validation is still run to ensure server has required values
    if (!validateForm()) {
      setLoading(false);
      Alert.alert(
        'Error',
        'Please correct the errors in the form before submitting.',
      );
      return;
    }

    try {
      const userdata = {
        userId: userId,
      };

      const token = await AsyncStorage.getItem('authToken');
      await AsyncStorage.setItem('currentStep', 'ProfileReview');
      const response = await AuthPost('users/sendOnboardingEmail', userdata, token);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile submitted successfully',
        position: 'top',
        visibilityTime: 3000,
      });

      if (rawMobile === '9052519059' || rawMobile === '9701646859') {
        await AsyncStorage.setItem('currentStep', 'Dashboard');
        navigation.reset({
          index: 0,
          routes: [{ name: 'DoctorDashboard' }],
        });
      } else {
        navigation.navigate('ProfileReview');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Since fields are read-only here, handleChange only updates internal state if ever needed.
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleBack = () => {
    navigation.navigate('KYCDetailsScreen');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);

      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        await AsyncStorage.setItem('stepNo', '7');
        const response = await AuthFetch('users/getUser', token);

        if (response?.data?.status !== 'success') {
          throw new Error(response?.data?.message || 'Failed to fetch user data');
        }

        const userData = response?.data?.data || {};
        setRawMobile(userData.mobile || '');

        // Format phone number to match +XX XXX XXX XXXX
        const rm = userData.mobile || '';
        const formattedPhone =
          rm.length === 10
            ? `+91 ${rm.slice(0, 3)} ${rm.slice(3, 6)} ${rm.slice(6, 10)}`
            : userData.mobile || '';

        // Helper function to mask account number
        const maskAccountNumber = (accountNumber: string) => {
          if (!accountNumber) return '';
          const visible = accountNumber.slice(-4);
          const masked = '*'.repeat(Math.max(0, accountNumber.length - 4));
          return `${masked}${visible}`;
        };

        setFormData({
          userId: userData.userId || '',
          name: `${userData.firstname || ''} ${userData.lastname || ''}`.trim(),
          email: userData.email || '',
          phone: formattedPhone,
          specialization: (userData.specialization && userData.specialization.name) || '',
          practice: userData.addresses && userData.addresses.length > 0 ? userData.addresses[0] : '',
          consultationPreferences:
            userData.consultationModeFee && userData.consultationModeFee.length > 0
              ? userData.consultationModeFee
                .filter((mode: any) => mode.fee > 0)
                .map((mode: any) => mode.type)
                .join(', ')
              : '',
          bank: (userData.bankDetails && userData.bankDetails.bankName) || '',
          accountNumber: maskAccountNumber(userData.bankDetails?.accountNumber || ''),
          addresses: userData.addresses || [],
        });
      } catch (error: any) {
        console.warn('Failed to fetch user data in ConfirmationScreen:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safeContainer}>
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#00203F" />
          <Text style={styles.loaderText}>Processing...</Text>
        </View>
      )}

      <View style={[styles.header, { paddingVertical: headerPaddingVertical }]}>
        <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
            hitSlop={HIT_SLOP.md}
          >
          <LeftIndicatorIcon size={ICON_SIZE.lg} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmation</Text>
      </View>

      <ProgressBar currentStep={getCurrentStepIndex('ConfirmationScreen')} totalSteps={TOTAL_STEPS} />

      <ScrollView 
          style={styles.formContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <View style={[styles.card, { padding: compactCardPadding }]}>
          <Text style={[styles.sectionTitle, { fontSize: compactSectionTitleSize }]}>Review Your Details</Text>

          <View style={styles.row}>
            <PersonIcon size={compactIconSize} color="#00203F" />
            <Text style={styles.label}>Personal Info</Text>
          </View>
          <TextInput
            value={formData.name}
            onChangeText={text => handleChange('name', text)}
            style={[
                styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.name && styles.errorInput,
              ]}
            placeholder="Enter Name"
            placeholderTextColor="#999"
            autoCapitalize="words"
            editable={false}
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
          <TextInput
            value={formData.email}
            onChangeText={text => handleChange('email', text)}
            style={[
              styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.email && styles.errorInput,
              ]}
            placeholder="Enter Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
          <TextInput
            value={formData.phone}
            onChangeText={text => handleChange('phone', text)}
            style={[
                styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.phone && styles.errorInput,
              ]}
            placeholder="Enter Phone (e.g., +91 234 567 8901)"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            editable={false}
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

          <View style={styles.row}>
            <BriefcaseIcon size={compactIconSize} color="#00203F" />
            <Text style={styles.label}>Specialization</Text>
          </View>
          <TextInput
            value={formData.specialization}
            onChangeText={text => handleChange('specialization', text)}
            style={[
                styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.specialization && styles.errorInput,
              ]}
            placeholder="Enter Specialization"
            placeholderTextColor="#999"
            editable={false}
          />
          {errors.specialization && (
            <Text style={styles.error}>{errors.specialization}</Text>
          )}

          <View style={styles.row}>
            <ClinicManagementIcon size={compactIconSize} color="#00203F" />
            <Text style={styles.label}>Clinics ({formData.addresses?.length || 0})</Text>
          </View>

          {formData.addresses && formData.addresses.length > 0 ? (
            <View style={styles.clinicsContainer}>
              {formData.addresses.map((address: any, index: number) => (
                <View key={index} style={styles.clinicItem}>
                  <Text style={styles.clinicName}>
                    {index + 1}. {address.clinicName || 'Unnamed Clinic'}
                    </Text>
                    {address.address && (
                      <Text style={styles.clinicAddress}>{address.address}</Text>
                    )}
                    {address.city && address.state && (
                      <Text style={styles.clinicAddress}>
                        {address.city}, {address.state} {address.pincode || ''}
                      </Text>
                    )}
                    {address.mobile && (
                      <Text style={styles.clinicMobile}>📱 {address.mobile}</Text>
                    )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noClinicsText}>No clinics added</Text>
          )}

          <View style={styles.row}>
            <CalendarIcon size={compactIconSize} color="#00203F" />
            <Text style={styles.label}>Consultation Preferences</Text>
          </View>
          <TextInput
            value={formData.consultationPreferences}
            onChangeText={text => handleChange('consultationPreferences', text)}
            style={[
              styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
              errors.consultationPreferences && styles.errorInput,
            ]}
            placeholder="Enter Preferences"
            placeholderTextColor="#999"
            editable={false}
          />
          {errors.consultationPreferences && (
            <Text style={styles.error}>{errors.consultationPreferences}</Text>
          )}

          <View style={styles.row}>
            <BankIcon size={compactIconSize} color="#00203F" />
            <Text style={styles.label}>Financial Setup</Text>
          </View>
          <TextInput
            value={formData.bank}
            onChangeText={text => handleChange('bank', text)}
            style={[
                styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.bank && styles.errorInput,
              ]}
            placeholder="Bank Details"
            placeholderTextColor="#999"
            editable={false}
          />
          {errors.bank && <Text style={styles.error}>{errors.bank}</Text>}
          <TextInput
            value={formData.accountNumber}
            onChangeText={text => handleChange('accountNumber', text)}
            style={[
                styles.input,
                { height: compactInputHeight, fontSize: compactFontSizeInput },
                errors.accountNumber && styles.errorInput,
              ]}
            placeholder="Account Number"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            editable={false}
          />
          {errors.accountNumber && (
            <Text style={styles.error}>{errors.accountNumber}</Text>
          )}
        </View>

        <View style={{ height: compactSpacerHeight }} />
      </ScrollView>

      <TouchableOpacity
        style={[
            styles.submitButton, 
            loading && { opacity: 0.7 },
            {
              marginHorizontal: SAFE_AREA.safeHorizontal,
              marginBottom: SAFE_AREA.safeBottom + SPACING.md,
            }
          ]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? 'Processing...' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  container: {
    flex: 1,
    backgroundColor: '#DCFCE7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00203F',
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
    paddingBottom: verticalScale(120),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    // padding applied dynamically where the card is used
    ...LAYOUT.shadow.md,
  },
  sectionTitle: {
    fontSize: responsiveText(18),
    fontWeight: '600',
    color: '#333',
    marginBottom: verticalScale(SPACING.lg),
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(SPACING.md),
    marginTop: verticalScale(SPACING.md),
  },
  label: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: responsiveText(14),
    color: '#333',
    fontWeight: '500',
  },
  input: {
    height: LAYOUT.inputHeight,
    borderColor: '#E0E0E0',
    borderWidth: scale(1),
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    marginBottom: verticalScale(SPACING.xs),
    backgroundColor: '#F8F9FA',
    color: '#333',
    fontSize: FONT_SIZE.input,
    ...LAYOUT.shadow.sm,
  },
  errorInput: {
    borderColor: '#D32F2F',
  },
  error: {
    color: '#D32F2F',
    fontSize: responsiveText(12),
    marginBottom: verticalScale(SPACING.sm),
    marginTop: verticalScale(SPACING.xs),
  },
  submitButton: {
    backgroundColor: '#00203F',
    paddingVertical: verticalScale(SPACING.md),
    borderRadius: LAYOUT.borderRadius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  submitText: {
    color: '#fff',
    fontSize: responsiveText(16),
    fontWeight: '600',
  },
  spacer: {
    height: verticalScale(80),
  },
  clinicsContainer: {
    marginBottom: verticalScale(SPACING.md),
  },
  clinicItem: {
    backgroundColor: '#F8F9FA',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: verticalScale(SPACING.sm),
    borderLeftWidth: scale(3),
    borderLeftColor: '#00203F',
    ...LAYOUT.shadow.sm,
  },
  clinicName: {
    fontSize: responsiveText(14),
    fontWeight: '600',
    color: '#333',
    marginBottom: SPACING.xs,
  },
  clinicAddress: {
    fontSize: responsiveText(12),
    color: '#666',
    lineHeight: verticalScale(18),
    marginBottom: SPACING.xs,
  },
  clinicMobile: {
    fontSize: responsiveText(12),
    color: '#00203F',
    fontWeight: '500',
  },
  noClinicsText: {
    fontSize: responsiveText(14),
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: verticalScale(SPACING.lg),
    backgroundColor: '#F8F9FA',
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: verticalScale(SPACING.md),
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

export default ConfirmationScreen;
