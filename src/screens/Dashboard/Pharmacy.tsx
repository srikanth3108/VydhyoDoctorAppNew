import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSelector } from 'react-redux';
import {  Divider } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { AuthFetch, AuthPost } from '../../auth/auth';
import PatientsTab from './PharmacyPatientsTab';
import MedicinesTab from './PharmacyMedicinesTab';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';

export default function Pharmacy() {
  const navigation = useNavigation<any>();

  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;
  const userId = currentuserDetails?.userId;
  const token = currentuserDetails?.token;

  const [activeTab, setActiveTab] = useState<
    'pending' | 'completed' | 'medicines'
  >('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [cardsData, setCardsData] = useState({
    today: { revenue: 0, patients: 0 },
    month: { revenue: 0, patients: 0 },
  });
  const [form, setForm] = useState({
    medName: '',
    dosage: '',
    price: '',
    cgst: '',
    gst: '',
  });
  const [errors, setErrors] = useState({});
  const [bulkData, setBulkData] = useState([]);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkResults, setBulkResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasFetchedRevenue = useRef(false);

  const handleInputChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: '' });
  };

const validateForm = () => {
    const newErrors: any = {};

    // Mandatory
    if (!form.medName.trim()) {
      newErrors.medName = 'Medicine name is required';
    }
    if (!form.price || parseFloat(form.price) < 0) {
      newErrors.price = 'Price must be non-negative';
    }

    // Optional but validate if filled
    if (form.dosage && !form.dosage.trim()) {
      newErrors.dosage = 'Dosage cannot be empty spaces';
    }
    if (form.cgst && parseFloat(form.cgst) < 0) {
      newErrors.cgst = 'CGST must be non-negative';
    }
    if (form.gst && parseFloat(form.gst) < 0) {
      newErrors.gst = 'GST must be non-negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddMedicine = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        //show alert after 3 seconds navigate to login screen
        Alert.alert('Error', 'Authentication token missing. Please login ');
        setIsModalVisible(false);
        setTimeout(() => {
          navigation.navigate('Authloader');
        }, 3000);
        return;
      }

const body: any = {
        medName: form.medName,
        price: parseFloat(form.price) || 0,
        quantity: 100,
        doctorId,
      };
      if (form.dosage && form.dosage.trim())   body.dosage = form.dosage.trim();
      if (form.cgst && form.cgst.trim())       body.cgst   = parseFloat(form.cgst);
      if (form.gst  && form.gst.trim())        body.gst    = parseFloat(form.gst);
      const response = await AuthPost('pharmacy/addMedInventory', body, token, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (
        response.status === 'success' ||
        response.data?.status === 'success'
      ) {
        setForm({
          medName: '',
          dosage: '',
          price: '',
          cgst: '',
          gst: '',
        });
        setErrors({});
        setIsModalVisible(false);
        Toast.show({ type: 'success', text1: 'Medicine added successfully' });
        fetchRevenueCount();
        setRefreshTrigger(prev => prev + 1);
        setActiveTab('medicines');
      } else {
        Alert.alert(
          'Alert',
          response?.message?.message ||
            response?.data?.message ||
            'Failed to add medicine',
        );
        // throw new Error(response.message || response.data?.message || "Failed to add medicine");
      }
    } catch (error: any) {
      if (
        error.response?.status === 409 &&
        error.response?.data?.message?.message === 'Medicine already exists'
      ) {
        // Alert.alert("Error", "Medicine already exists")
        Toast.show({ type: 'error', text1: 'Medicine already exists' });
      } else {
        // Alert.alert("Error",  error.message || "Failed to add medicine")
        Toast.show({
          type: 'error',
          text1: error.message || 'Failed to add medicine',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      medName: '',
      dosage: '',
      quantity: '',
      price: '',
      cgst: '',
      gst: '',
    });
    setErrors({});
    setIsModalVisible(false);
  };

  const handleBulkCancel = () => {
    setBulkData([]);
    setBulkErrors([]);
    setBulkResults(null);
    setIsBulkModalVisible(false);
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      Toast.show({ type: 'error', text1: 'No data to upload' });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await AuthPost(
        'pharmacy/addMedInventory/bulk',
        { medicines: bulkData, doctorId },
        token,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (response.data?.data?.insertedCount > 0) {
        setBulkResults(response.data.data);
        Toast.show({
          type: 'success',
          text1: `${response.data.data.insertedCount} medicines added successfully`,
        });
        fetchRevenueCount();
        setRefreshTrigger(prev => prev + 1);
        if (
          !response.data.data.errors ||
          response.data.data.errors.length === 0
        ) {
          setTimeout(() => setIsBulkModalVisible(false), 2000);
        }
      } else if (response.data?.data?.errors?.length > 0) {
        setBulkResults(response.data.data);
        Toast.show({
          type: 'error',
          text1: 'Some medicines already exist in inventory',
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to upload medicines',
      });
      if (error.response?.data?.errors) {
        setBulkResults({
          errors: error.response.data.errors.map(err => ({
            row: err.row,
            message: err.message,
          })),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = () => {
    Alert.alert(
      'File Upload',
      'File upload is not fully supported in this React Native version. Please use a server-side endpoint to upload Excel files.',
      [{ text: 'OK' }],
    );
  };

  const downloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'Template download is not supported in this React Native version. Please provide a server-side endpoint to download the template.',
      [{ text: 'OK' }],
    );
  };

  async function fetchRevenueCount() {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        `finance/getDoctorTodayAndThisMonthRevenue/pharmacy?doctorId=${doctorId}`,
        token,
      );

      let revenueData = null;
      if (response.status === 'success' && response.data) {
        revenueData = response.data.data;
      } else if (response.data?.status === 'success' && response.data.data) {
        revenueData = response.data.data;
      } else if (response.data) {
        revenueData = response.data;
      } else {
        revenueData = response;
      }

      setCardsData({
        today: revenueData.today || { revenue: 0, patients: 0 },
        month: revenueData.month || { revenue: 0, patients: 0 },
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.message || 'Failed to fetch revenue',
      });
      setCardsData({
        today: { revenue: 0, patients: 0 },
        month: { revenue: 0, patients: 0 },
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (doctorId && !hasFetchedRevenue.current) {
      hasFetchedRevenue.current = true;
      fetchRevenueCount();
    }
  }, [doctorId]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <CommonHeader title="Pharmacy" />
      <View style={styles.container}>

        <View style={styles.headerRow}>
         
          <TextInput
            placeholder="Search by Patient Id"
            value={searchQuery}
            onChangeText={t => setSearchQuery(t.trim())}
            style={styles.search}
            placeholderTextColor="#9aa0a6"
          />
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#1890ff"
            style={styles.loader}
          />
        )}

        <View style={styles.cardsRow}>
          <View style={[styles.card, { backgroundColor: '#DBEAFE' }]}>
            <Text style={[styles.cardLabel, { color: '#2563EB' }]}>
              Today Revenue
            </Text>
            <Text style={[styles.cardValue, { color: '#2563EB' }]}>
              ₹ {cardsData?.today?.revenue || 0}
            </Text>
            <Text style={[styles.cardPatients, { color: '#2563EB' }]}>
              Patients: {cardsData?.today?.patients || 0}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.cardLabel, { color: '#16A34A' }]}>
              This Month Revenue
            </Text>
            <Text style={[styles.cardValue, { color: '#16A34A' }]}>
              ₹ {cardsData?.month?.revenue || 0}
            </Text>
            <Text style={[styles.cardPatients, { color: '#16A34A' }]}>
              Patients: {cardsData?.month?.patients || 0}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('pending')}
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'pending' && styles.tabTextActive,
              ]}
            >
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('completed')}
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.tabTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('medicines')}
            style={[styles.tab, activeTab === 'medicines' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'medicines' && styles.tabTextActive,
              ]}
            >
              Medicines
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'pending' && (
            <PatientsTab
              status="pending"
              searchQuery={searchQuery}
              updateCount={fetchRevenueCount}
            />
          )}
          {activeTab === 'completed' && (
            <PatientsTab
              status="completed"
              searchQuery={searchQuery}
              updateCount={fetchRevenueCount}
            />
          )}
          {activeTab === 'medicines' && (
            <MedicinesTab
              showModal={() => setIsModalVisible(true)}
              showBulkModal={() => setIsBulkModalVisible(true)}
              refreshTrigger={refreshTrigger}
            />
          )}
        </View>

        <Modal visible={isModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Medicine to Inventory</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Medicine Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter medicine name"
                  placeholderTextColor={'#bfbfbf'}
                  value={form.medName}
                  onChangeText={val => handleInputChange('medName', val)}
                />
                {errors.medName && (
                  <Text style={styles.error}>{errors.medName}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Dosage</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter dosage (e.g., 100mg)"
                  placeholderTextColor={'#bfbfbf'}
                  value={form.dosage}
                  onChangeText={val => handleInputChange('dosage', val)}
                />
                {errors.dosage && (
                  <Text style={styles.error}>{errors.dosage}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Price (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Price/Unit"
                  placeholderTextColor={'#bfbfbf'}
                  value={form.price}
                  keyboardType="numeric"
                  onChangeText={val => handleInputChange('price', val)}
                />
                {errors.price && (
                  <Text style={styles.error}>{errors.price}</Text>
                )}
              </View>

              {/* <View style={styles.inputContainer}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter quantity"
                  placeholderTextColor={'#bfbfbf'}
                  value={form.quantity}
                  keyboardType="numeric"
                  onChangeText={val => handleInputChange('quantity', val)}
                />
                {errors.quantity && (
                  <Text style={styles.error}>{errors.quantity}</Text>
                )}
              </View> */}

              <View style={styles.row}>
                <View
                  style={[styles.inputContainer, { flex: 1, marginRight: SPACING.sm }]}
                >
                  <Text style={styles.label}>CGST (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter CGST"
                    placeholderTextColor={'#bfbfbf'}
                    value={form.cgst}
                    keyboardType="numeric"
                    onChangeText={val => handleInputChange('cgst', val)}
                  />
                  {errors.cgst && (
                    <Text style={styles.error}>{errors.cgst}</Text>
                  )}
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.label}>GST (%)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter GST"
                    placeholderTextColor={'#bfbfbf'}
                    value={form.gst}
                    keyboardType="numeric"
                    onChangeText={val => handleInputChange('gst', val)}
                  />
                  {errors.gst && <Text style={styles.error}>{errors.gst}</Text>}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleCancel}
                  disabled={loading}
                  style={[styles.cancelButton, loading && styles.buttonDisabled]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddMedicine}
                  disabled={loading}
                  style={[styles.addButton, loading && styles.buttonDisabled]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal visible={isBulkModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <View style={[styles.modalContent, { width: responsiveWidth(90) }]}>
              <Text style={styles.modalTitle}>Bulk Import Medicines</Text>
              <Text style={styles.instructions}>
                Upload an Excel file (.xlsx) with columns: medName, dosage,
                price, quantity, cgst, gst.
              </Text>
              
              <TouchableOpacity
                onPress={downloadTemplate}
                style={styles.templateButton}
              >
                <Text style={styles.templateButtonText}>Download Template</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleFileUpload}
                style={styles.uploadButton}
              >
                <Text style={styles.uploadButtonText}>Upload File</Text>
              </TouchableOpacity>
              
              {bulkData.length > 0 && (
                <View>
                  <Divider style={styles.divider}>
                    Preview ({bulkData.length} medicines)
                  </Divider>
                  <Text style={styles.previewText}>
                    Preview not fully supported in React Native.
                  </Text>
                </View>
              )}
              {bulkResults && (
                <View style={styles.resultsContainer}>
                  {bulkResults.insertedCount > 0 && (
                    <Text style={styles.successText}>
                      Successfully added {bulkResults.insertedCount} medicines
                    </Text>
                  )}
                  {bulkResults.errors && bulkResults.errors.length > 0 && (
                    <View>
                      <Text style={styles.warningText}>
                        {bulkResults.errors.length} warnings encountered
                      </Text>
                      {bulkResults.errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>
                          Row {error.row}: {error.message}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={handleBulkCancel}
                  disabled={isProcessing}
                  style={[styles.cancelButton, isProcessing && styles.buttonDisabled]}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleBulkUpload}
                  disabled={isProcessing || bulkData.length === 0}
                  style={[styles.addButton, (isProcessing || bulkData.length === 0) && styles.buttonDisabled]}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addButtonText}>Upload Medicines</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        <Toast />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  loader: {
    marginVertical: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconBox: {
    width: moderateScale(isTablet ? 40 : 32),
    height: moderateScale(isTablet ? 40 : 32),
    backgroundColor: '#1890ff',
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: '700',
    color: '#262626',
  },
  search: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: isTablet ? 0 : SPACING.xs,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  card: {
    flex: 1,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  cardLabel: {
    fontWeight: '600',
    marginBottom: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  cardValue: {
    fontWeight: '800',
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxl : FONT_SIZE.xl),
    marginBottom: SPACING.xs,
  },
  cardPatients: {
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    padding: moderateScale(4),
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(8),
    borderRadius: LAYOUT.borderRadius.md,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  tabTextActive: {
    color: '#111827',
  },
  tabContent: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.xl : SPACING.lg,
    width: responsiveWidth(85),
    maxWidth: moderateScale(600),
    maxHeight: responsiveHeight(85),
  },
  modalTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    color: '#262626',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#595959',
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: moderateScale(10),
    fontSize: responsiveText(FONT_SIZE.sm),
    backgroundColor: '#fff',
    color: '#000000',
  },
  error: {
    color: '#ff4d4f',
    fontSize: responsiveText(FONT_SIZE.xs),
    marginTop: SPACING.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    borderColor: '#d9d9d9',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  cancelButtonText: {
    color: '#595959',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  addButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: moderateScale(12),
    backgroundColor: '#1890ff',
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    minWidth: moderateScale(80),
  },
  addButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  instructions: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#595959',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  templateButton: {
    marginVertical: SPACING.xs,
    borderColor: '#d9d9d9',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: moderateScale(10),
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  templateButtonText: {
    color: '#595959',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  uploadButton: {
    marginVertical: SPACING.xs,
    borderColor: '#d9d9d9',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: moderateScale(10),
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#595959',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  divider: {
    marginVertical: SPACING.lg,
    backgroundColor: '#f0f0f0',
  },
  previewText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#595959',
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: SPACING.lg,
  },
  successText: {
    color: '#52c41a',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  warningText: {
    color: '#fa8c16',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: responsiveText(FONT_SIZE.xs),
    marginBottom: SPACING.xs,
  },
});