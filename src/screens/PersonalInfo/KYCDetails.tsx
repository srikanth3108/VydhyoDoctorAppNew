import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import { CheckMarkIcon, CloseXIcon, DeleteAccountIcon, EyeOpenIcon, ImageOutlineIcon, LeftIndicatorIcon, PersonInCardIcon, PhoneIcon } from '../../utility/SvgIcons';
import { useNavigation } from '@react-navigation/native';
import { pick, types } from '@react-native-documents/picker';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import ProgressBar from '../progressBar/progressBar';
import { getCurrentStepIndex, TOTAL_STEPS } from '../../utility/registrationSteps';
import { UploadFiles, AuthFetch } from '../../auth/auth';
import WebView from 'react-native-webview';

// Import responsive utilities
import {
  isAndroid,
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

const TERMS_URL = 'https://vydhyo.com/terms-and-conditions';

// JS to hide site header/footer and keep only middle terms content.
const hideHeaderFooterJS = `
(function() {
  function applyHiding() {
    try {
      var selectors = [
        'header',
        'footer',
        '.site-header',
        '.site-footer',
        '.elementor-location-header',
        '.elementor-location-footer',
        '[data-elementor-type="header"]',
        '[data-elementor-type="footer"]',
        '.ast-desktop-header',
        '.ast-mobile-header-wrap',
        '#masthead',
        '#colophon'
      ];
      selectors.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
          el.style.setProperty('display','none','important');
          el.style.setProperty('visibility','hidden','important');
          el.style.setProperty('height','0px','important');
          el.style.setProperty('margin','0','important');
          el.style.setProperty('padding','0','important');
        });
      });

      document.documentElement.style.setProperty('scroll-behavior','smooth','important');
      document.body.style.setProperty('padding-top','0px','important');
      document.body.style.setProperty('margin-top','0px','important');

      var wrappers = ['main', '#content', '.site-content', '.elementor', '.elementor-section-wrap'];
      wrappers.forEach(function(sel){
        document.querySelectorAll(sel).forEach(function(el){
          el.style.setProperty('max-width','100%','important');
          el.style.setProperty('margin','0 auto','important');
        });
      });
    } catch(e) {}
  }

  applyHiding();

  var obs = new MutationObserver(function(){ applyHiding(); });
  if (document.body) {
    obs.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      applyHiding();
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  true;
})();
`;

const KYCDetailsScreen = () => {
  const navigation = useNavigation<any>();

  const [panImage, setPanImage] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [pancardUploaded, setPancardUploaded] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [panNumber, setPanNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [fileViewModalVisible, setFileViewModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; type?: string } | null>(null);
  const [prefill, setPrefill] = useState(false);

  const scrollRef = useRef<ScrollView | null>(null);

  // ---------- Pickers / image handlers ----------
  const handlePancardUpload = async () => {
    Alert.alert(
      'Upload PAN Card',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            try {
              const result = await launchCamera({ mediaType: 'photo', includeBase64: false });
              if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setPanImage({
                  uri: asset.uri!,
                  name: asset.fileName || 'pan_camera.jpg',
                  type: asset.type || 'image/jpeg',
                });
                setPancardUploaded(true);
              } else {
                Alert.alert('No image selected from camera');
              }
            } catch (err) {
              Alert.alert('Error', 'Camera access failed.');
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: false });
              if (result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setPanImage({
                  uri: asset.uri!,
                  name: asset.fileName || 'pan_gallery.jpg',
                  type: asset.type || 'image/jpeg',
                });
                setPancardUploaded(true);
              } else {
                Alert.alert('No image selected from gallery');
              }
            } catch (err) {
              Alert.alert('Error', 'Gallery access failed.');
            }
          },
        },
        {
          text: 'Upload File',
          onPress: async () => {
            try {
              const [res] = await pick({ type: [types.images] });
              if (res && res.uri && res.name) {
                setPanImage({ uri: res.uri, name: res.name, type: res.type || 'image/jpeg' });
                setPancardUploaded(true);
              } else {
                Alert.alert('Error', 'Invalid image selected. Please try again.');
              }
            } catch (err) {
              Alert.alert('Error', 'Image selection failed.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true },
    );
  };

  const removePanFile = () => {
    setPanImage(null);
    setPancardUploaded(false);
    if (prefill) setPrefill(false);
  };

  const viewFile = (file: { uri: string; type?: string }) => {
    if (file.type?.includes('image') || /\.jpe?g$|\.png$/i.test(file.uri)) {
      setSelectedFile(file);
      setFileViewModalVisible(true);
    } else {
      Alert.alert('Error', 'Unsupported file type.');
    }
  };

  // ---------- Validation helpers ----------
  const validatePanNumber = (number: string) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(number);
  };

  // ---------- Fetch user KYC if present ----------
  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.navigate('Login' as any);
        return;
      }
      const response = await AuthFetch('users/getKycByUserId', token);
      if (response?.data?.status === 'success') {
        const userData = response?.data?.data;
        if (userData?.pan?.number) {
          setPanNumber(userData.pan.number);
        }
        if (userData?.pan?.attachmentUrl) {
          setPanImage({
            uri: userData.pan.attachmentUrl,
            name: userData.pan.attachmentFileName || 'pan_certificate.jpg',
            type: 'image/jpeg',
          });
          setPancardUploaded(true);
          setPrefill(true);
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
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // ---------- Submit / Next ----------
  const handleNext = async () => {
    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms & Conditions to proceed.');
      return;
    }
    if (!panNumber && !pancardUploaded) {
      try {
        setLoading(true);
        await AsyncStorage.setItem('currentStep', 'ConfirmationScreen');
        Toast.show({
          type: 'info',
          text1: 'Skipped',
          text2: 'KYC details skipped',
          position: 'top',
          visibilityTime: 3000,
        });
        navigation.navigate('ConfirmationScreen');
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to skip. Please try again.',
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!panNumber || !validatePanNumber(panNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-character PAN number (e.g., ABCDE1234F).');
      return;
    }

    if (!pancardUploaded || !panImage?.uri) {
      Alert.alert('Error', 'Please upload a PAN Card image.');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');

      if (!token) {
        Alert.alert('Error', 'Authentication token is missing. Please log in again.');
        setLoading(false);
        return;
      }
      if (!userId) {
        Alert.alert('Error', 'User ID is missing. Please log in again.');
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append('userId', userId);
      fd.append('panNumber', panNumber);

      fd.append('panFile', {
        uri: panImage.uri,
        name: panImage.name || 'pan.jpg',
        type: panImage.type || 'image/jpeg',
      } as any);

      const response = await UploadFiles('users/addKYCDetails', fd, token);

      if (response?.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'KYC details saved successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        await AsyncStorage.setItem('currentStep', 'ConfirmationScreen');
        navigation.navigate('ConfirmationScreen');
      } else {
        Alert.alert('Error', response?.message || 'Failed to submit KYC details. Please try again.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to submit KYC details. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.navigate('FinancialSetupScreen');
  };

  const renderWebviewLoader = () => (
    <View style={styles.webviewLoader}>
      <ActivityIndicator size="large" color="#00203F" />
      <Text style={styles.webviewLoaderText}>Loading Terms & Conditions…</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
      {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color="#00203F" />
              <Text style={styles.loaderText}>Processing...</Text>
            </View>
          )}

          <Modal
            animationType="slide"
            transparent
            visible={termsModalVisible}
            onRequestClose={() => setTermsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Terms and Conditions</Text>
                  <TouchableOpacity 
                    onPress={() => setTermsModalVisible(false)}
                    hitSlop={HIT_SLOP.sm}
                  >
                    <CloseXIcon size={ICON_SIZE.md} color="#00203F" />
                  </TouchableOpacity>
                </View>

                <WebView
                  originWhitelist={['*']}
                  source={{ uri: TERMS_URL }}
                  style={styles.webview}
                  javaScriptEnabled
                  domStorageEnabled
                  allowsInlineMediaPlayback
                  setSupportMultipleWindows={false}
                  startInLoadingState
                  renderLoading={renderWebviewLoader}
                  injectedJavaScriptBeforeContentLoaded={hideHeaderFooterJS}
                  injectedJavaScript={hideHeaderFooterJS}
                  mixedContentMode="always"
                  allowFileAccess
                  allowUniversalAccessFromFileURLs
                />
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent
            visible={fileViewModalVisible}
            onRequestClose={() => setFileViewModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.fileModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>View File</Text>
                  <TouchableOpacity 
                    onPress={() => setFileViewModalVisible(false)}
                    hitSlop={HIT_SLOP.sm}
                  >
                    <CloseXIcon size={ICON_SIZE.md} color="#00203F" />
                  </TouchableOpacity>
                </View>
                {selectedFile && selectedFile.uri ? (
                  <Image source={{ uri: selectedFile.uri }} style={styles.fileImage} resizeMode="contain" />
                ) : null}
              </View>
            </View>
          </Modal>

          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              hitSlop={HIT_SLOP.md}
            >
              <LeftIndicatorIcon size={ICON_SIZE.md} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>KYC Details</Text>
          </View>

          <ProgressBar
            currentStep={getCurrentStepIndex('KYCDetailsScreen')}
            totalSteps={TOTAL_STEPS}
          />

          <ScrollView
            ref={scrollRef}
            style={styles.formContainer}
            contentContainerStyle={[
              styles.scrollContent,
              {
                // give space so content can scroll above the bottom Next button
                paddingBottom: SAFE_AREA.safeBottom + verticalScale(120),
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Text style={styles.label}>Upload PAN card Proof</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={handlePancardUpload}>
                <PersonInCardIcon size={ICON_SIZE.xxl} color="#00203F" style={styles.icon} />
                <Text style={styles.acceptedText}>Accepted: JPG, PNG</Text>
              </TouchableOpacity>

              {pancardUploaded && panImage && (
                <View style={styles.uploadedFileContainer}>
                  <View style={styles.fileInfo}>
                    <ImageOutlineIcon size={ICON_SIZE.sm} color="#00203F" />
                    {prefill && <Text style={styles.prefillText}>Uploaded</Text>}
                    <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                      {panImage.name}
                    </Text>
                  </View>

                  <View style={styles.fileActions}>
                    <TouchableOpacity onPress={() => viewFile(panImage)} style={styles.actionButton}>
                      <EyeOpenIcon size={ICON_SIZE.sm} color="#007AFF" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={removePanFile} style={styles.actionButton}>
                     
                      <DeleteAccountIcon size={ICON_SIZE.sm} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={styles.label}>Enter PAN Number</Text>
              <TextInput
                style={styles.input}
                value={panNumber}
                onChangeText={text => setPanNumber(text.toUpperCase())}
                placeholder="Enter 10-character PAN Number"
                placeholderTextColor="#9aa0a6"
                keyboardType="default"
                maxLength={10}
                autoCapitalize="characters"
              />

              <View style={styles.termsContainer}>
                <TouchableOpacity onPress={() => setTermsAccepted(!termsAccepted)}>
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted && <CheckMarkIcon size={ICON_SIZE.xs} color="#fff" />}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setTermsModalVisible(true)}>
                  <Text style={styles.linkText}>Terms & Conditions</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          <View style={styles.nextButtonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, loading && styles.disabledButton]}
              onPress={handleNext}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { 
    flex: 1, 
    backgroundColor: '#DCFCE7' 
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
    paddingVertical: verticalScale(12),
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  backButton: { 
    padding: SPACING.xs 
  },
  headerTitle: {
    flex: 1,
    fontSize: responsiveText(16),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginRight: scale(20),
  },
  formContainer: { 
    flex: 1, 
    paddingHorizontal: SAFE_AREA.safeHorizontal, 
    paddingVertical: verticalScale(SPACING.md) 
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    ...LAYOUT.shadow.sm,
  },
  label: { 
    fontSize: responsiveText(13),
    fontWeight: '500',
    color: '#333',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    height: scale(44),
    fontSize: FONT_SIZE.md,
    color: '#333',
    marginBottom: SPACING.lg,
    backgroundColor: '#fff',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.lg,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: SPACING.md,
  },
  icon: { 
    marginBottom: SPACING.sm 
  },
  acceptedText: { 
    fontSize: responsiveText(11), 
    color: '#666', 
    textAlign: 'center' 
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: LAYOUT.borderRadius.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fileInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  prefillText: { 
    color: '#10B981', 
    marginLeft: SPACING.xs, 
    fontWeight: 'bold',
    fontSize: responsiveText(11),
  },
  fileName: { 
    marginLeft: SPACING.sm, 
    color: '#495057', 
    flexShrink: 1,
    fontSize: responsiveText(11),
  },
  fileActions: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  actionButton: { 
    padding: SPACING.xs, 
    marginLeft: SPACING.sm 
  },
  termsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: { 
    backgroundColor: '#00203F', 
    borderColor: '#00203F' 
  },
  linkText: { 
    color: '#007BFF', 
    fontSize: responsiveText(13),
    textDecorationLine: 'underline',
  },
  nextButtonContainer: {
    paddingHorizontal: SAFE_AREA.safeHorizontal,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
    paddingTop: SPACING.sm,
    backgroundColor: '#DCFCE7',
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
    ...(isAndroid && { elevation: 6 }),
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  nextText: { 
    color: '#fff', 
    fontSize: responsiveText(14), 
    fontWeight: '600' 
  },
  spacer: { 
    height: verticalScale(40) 
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderText: { 
    color: '#fff', 
    fontSize: responsiveText(13), 
    marginTop: SPACING.md 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContent: { 
    width: '90%', 
    height: '80%', 
    backgroundColor: '#fff', 
    borderRadius: LAYOUT.borderRadius.lg, 
    overflow: 'hidden' 
  },
  fileModalContent: { 
    width: '90%', 
    height: '60%', 
    backgroundColor: '#fff', 
    borderRadius: LAYOUT.borderRadius.lg, 
    overflow: 'hidden' 
  },
  modalHeader: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: SPACING.md, 
    backgroundColor: '#f5f5f5', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: { 
    fontSize: responsiveText(15), 
    fontWeight: '600', 
    color: '#00203F' 
  },
  webview: { 
    flex: 1, 
    backgroundColor: '#fff'
  },
  fileImage: { 
    width: '100%', 
    height: '100%' 
  },
  webviewLoader: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  webviewLoaderText: { 
    marginTop: SPACING.sm, 
    color: '#00203F',
    fontSize: responsiveText(13),
  },
});

export default KYCDetailsScreen;
