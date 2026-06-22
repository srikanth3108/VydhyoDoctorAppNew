import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { MapPin, Navigation, Edit3, CheckCircle2, Search } from 'lucide-react-native';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';
import MapModal from './MapModal';

interface AddressSelectionProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  styles: any;
}

export default function AddressSelection({
  formData,
  setFormData,
  errors,
  setErrors,
  styles,
}: AddressSelectionProps) {
  const [mapVisible, setMapVisible] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }
  };

  const detectCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
      return;
    }

    setIsDetecting(true);
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await Geocoder.from(latitude, longitude);
          const addressComp = res.results[0];
          const comps = addressComp.address_components;
          
          let city = '';
          let state = '';
          let pincode = '';
          
          comps.forEach((c: any) => {
            if (c.types.includes('locality')) city = c.long_name;
            if (c.types.includes('administrative_area_level_1')) state = c.long_name;
            if (c.types.includes('postal_code')) pincode = c.long_name;
          });

          setFormData({
            ...formData,
            address: addressComp.formatted_address,
            city,
            state,
            pincode,
            latitude: String(latitude.toFixed(6)),
            longitude: String(longitude.toFixed(6)),
          });
          setErrors({});
        } catch (err) {
          Alert.alert('Error', 'Could not reverse geocode your location.');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        Alert.alert('Error', 'Could not detect your location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const geocodeAddress = async () => {
    if (!formData.address || !formData.city) {
      Alert.alert('Incomplete Address', 'Please enter at least the street address and city.');
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state}`;
      const res = await Geocoder.from(fullAddress);
      const location = res.results[0].geometry.location;
      
      setFormData({
        ...formData,
        latitude: String(location.lat.toFixed(6)),
        longitude: String(location.lng.toFixed(6)),
      });
      Alert.alert('Location Found', 'Latitude and Longitude have been updated based on your address.');
    } catch (err) {
      Alert.alert('Geocoding Error', 'Could not find coordinates for this address. Try using the map.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <View style={localStyles.container}>
      {/* Option 1: Quick Auto-Detect */}
      <TouchableOpacity 
        style={[localStyles.detectCard, isDetecting && localStyles.detectCardActive]}
        onPress={detectCurrentLocation}
        disabled={isDetecting}
      >
        <View style={localStyles.iconCircle}>
          {isDetecting ? (
            <ActivityIndicator color="#1D3557" size="small" />
          ) : (
            <Navigation color="#1D3557" size={20} />
          )}
        </View>
        <View style={localStyles.detectTextContent}>
          <Text style={localStyles.detectTitle}>Use My Current Location</Text>
          <Text style={localStyles.detectSub}>Auto-fills address & coordinates</Text>
        </View>
        {formData.latitude && <CheckCircle2 color="#10B981" size={20} />}
      </TouchableOpacity>

      <View style={localStyles.dividerRow}>
        <View style={localStyles.line} />
        <Text style={localStyles.dividerText}>OR ENTER MANUALLY</Text>
        <View style={localStyles.line} />
      </View>

      {/* Option 2: Manual Entry with Geocoding */}
      <View style={localStyles.manualContainer}>
        <Text style={styles.inputLabel}>Street Address</Text>
        <View style={[styles.inputWrapper, { height: 80, alignItems: 'flex-start' }, errors.address ? styles.inputError : null]}>
          <Edit3 color="#64748B" size={18} style={{ marginTop: 14, marginRight: 10 }} />
          <TextInput
            style={[styles.input, { textAlignVertical: 'top', paddingTop: 12 }]}
            placeholder="Building, Street, Landmark..."
            placeholderTextColor="#94A3B8"
            multiline
            value={formData.address}
            onChangeText={(t) => setFormData({ ...formData, address: t })}
          />
        </View>
        {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

        <View style={styles.formRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.inputLabel}>City</Text>
            <View style={[styles.inputWrapper, errors.city ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#94A3B8"
                value={formData.city}
                onChangeText={(t) => setFormData({ ...formData, city: t })}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Pin Code</Text>
            <View style={[styles.inputWrapper, errors.pincode ? styles.inputError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                maxLength={6}
                value={formData.pincode}
                onChangeText={(t) => setFormData({ ...formData, pincode: t })}
              />
            </View>
          </View>
        </View>

        <View style={localStyles.actionRow}>
          <TouchableOpacity 
            style={[localStyles.actionBtn, localStyles.verifyBtn]} 
            onPress={geocodeAddress}
            disabled={isGeocoding}
          >
            {isGeocoding ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <MapPin color="#FFF" size={16} style={{ marginRight: 6 }} />
                <Text style={localStyles.btnText}>Verify & Pin</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[localStyles.actionBtn, localStyles.mapBtn]} 
            onPress={() => setMapVisible(true)}
          >
            <Search color="#1D3557" size={16} style={{ marginRight: 6 }} />
            <Text style={[localStyles.btnText, { color: '#1D3557' }]}>Pick on Map</Text>
          </TouchableOpacity>
        </View>

        {formData.latitude ? (
          <View style={localStyles.coordBadge}>
            <Text style={localStyles.coordText}>📍 Lat: {formData.latitude} | Lng: {formData.longitude}</Text>
          </View>
        ) : null}
      </View>

      <MapModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onSelect={(selected: any) => {
          setFormData({
            ...formData,
            address: selected.address || formData.address,
            city: selected.city || formData.city,
            state: selected.state || formData.state,
            pincode: selected.pincode || formData.pincode,
            latitude: String(Number(selected.latitude || formData.latitude || 0).toFixed(6)),
            longitude: String(Number(selected.longitude || formData.longitude || 0).toFixed(6)),
          });
          setMapVisible(false);
        }}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  detectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1D3557',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  detectCardActive: {
    borderColor: '#1D3557',
    backgroundColor: '#F8FAFC',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(29, 53, 87, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detectTextContent: {
    flex: 1,
  },
  detectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  detectSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  manualContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtn: {
    backgroundColor: '#1D3557',
  },
  mapBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#1D3557',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  coordBadge: {
    marginTop: 16,
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  coordText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
