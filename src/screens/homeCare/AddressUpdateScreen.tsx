import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import AddressSelection from '../../components/AddressSelection';

export default function AddressUpdateScreen() {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // In a real application, you would fetch the user's current address here
  useEffect(() => {
    // Mock fetching user address
    const fetchUserAddress = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setFormData({
        address: '123 Main Street',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        latitude: '12.9716',
        longitude: '77.5946',
      });
    };
    fetchUserAddress();
  }, []);

  const handleSaveAddress = async () => {
    setIsSaving(true);
    // In a real application, you would send formData to your backend API
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    Alert.alert('Success', 'Your address has been updated successfully!');
    setIsSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color="#64748B" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Address</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AddressSelection
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          setErrors={setErrors}
          styles={styles}
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveAddress}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  scrollContent: { padding: 20 },
  inputLabel: { fontSize: 14, color: '#64748B', fontWeight: '600', marginBottom: 8, marginTop: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, height: 56 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', height: '100%' },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 6, fontWeight: '500' },
  formRow: { flexDirection: 'row', width: '100%' },
  saveButton: { backgroundColor: '#1D3557', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
