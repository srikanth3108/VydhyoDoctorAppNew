import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Region, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import Geocoder from 'react-native-geocoding';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCrmF3351j82RVuTZbVBJ-X3ufndylJsvo';
Geocoder.init(GOOGLE_MAPS_API_KEY);

interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (addressData: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function MapModal({ visible, onClose, onSelect }: MapModalProps) {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (e) {
        return false;
      }
    } else {
      try {
        const auth = await Geolocation.requestAuthorization('whenInUse');
        return auth === 'granted';
      } catch (e) {
        return false;
      }
    }
  };

  const initLocation = async () => {
    const ok = await requestLocationPermission();
    if (!ok) return;
    setIsFetchingLocation(true);
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const r = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 } as Region;
        setRegion(r);
        try { mapRef.current?.animateToRegion(r, 500); } catch (e) {}
        setIsFetchingLocation(false);
      },
      err => {
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  useEffect(() => {
    if (visible) initLocation();
  }, [visible]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          q,
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`,
      );
      const data = await res.json();
      if (data.status === 'OK') {
        setSearchResults(data.predictions);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      setSearchResults([]);
    }
  };

  const handleSelectResult = async (item: any) => {
    setSearchQuery(item.description);
    setShowSearchResults(false);
    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.place_id}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await resp.json();
      if (data.status === 'OK') {
        const loc = data.result.geometry.location;
        const r = { latitude: loc.lat, longitude: loc.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 } as Region;
        setRegion(r);
        try { mapRef.current?.animateToRegion(r, 400); } catch (e) {}

        // reverse geocode
        const geores = await Geocoder.from(loc.lat, loc.lng);
        const res0 = geores.results?.[0] || {};
        const comps = res0.address_components || [];
        let street = res0.formatted_address || '';
        let city = '';
        let state = '';
        let pincode = '';
        comps.forEach((c: any) => {
          if ((c.types || []).includes('locality') || (c.types || []).includes('sublocality') || (c.types || []).includes('administrative_area_level_2')) city = city || c.long_name;
          if ((c.types || []).includes('administrative_area_level_1')) state = c.long_name;
          if ((c.types || []).includes('postal_code')) pincode = c.long_name;
        });
        onSelect({ address: street, city, state, pincode, latitude: loc.lat, longitude: loc.lng });
        onClose();
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to fetch place details');
    }
  };

  const usePointer = async () => {
    try {
      const cam: any = await mapRef.current?.getCamera?.();
      const center = cam?.center || region;
      const lat = center.latitude;
      const lng = center.longitude;
      const geores = await Geocoder.from(lat, lng);
      const res0 = geores.results?.[0] || {};
      const comps = res0.address_components || [];
      let street = res0.formatted_address || '';
      let city = '';
      let state = '';
      let pincode = '';
      comps.forEach((c: any) => {
        if ((c.types || []).includes('locality') || (c.types || []).includes('sublocality') || (c.types || []).includes('administrative_area_level_2')) city = city || c.long_name;
        if ((c.types || []).includes('administrative_area_level_1')) state = c.long_name;
        if ((c.types || []).includes('postal_code')) pincode = c.long_name;
      });
      onSelect({ address: street, city, state, pincode, latitude: lat, longitude: lng });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Unable to read map center');
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, paddingHorizontal: 12 }}>
            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search for an address"
              style={{ flex: 1, height: 44 }}
            />
            <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); }}>
              <Text style={{ color: '#64748B', padding: 8 }}>Clear</Text>
            </TouchableOpacity>
          </View>
          {showSearchResults && searchResults.length > 0 && (
            <ScrollView style={{ maxHeight: 160, backgroundColor: '#fff' }}>
              {searchResults.map(r => (
                <TouchableOpacity key={r.place_id} onPress={() => handleSelectResult(r)} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                  <Text style={{ fontWeight: '600' }}>{r.structured_formatting?.main_text}</Text>
                  <Text style={{ color: '#64748B' }}>{r.structured_formatting?.secondary_text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          region={region}
          onRegionChangeComplete={r => setRegion(r)}
        />

        <View style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -18, marginTop: -36, zIndex: 10 }} pointerEvents="none">
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3182CE', borderWidth: 3, borderColor: '#fff' }} />
        </View>

        <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => { initLocation(); }} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
            <Text>My Location</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={usePointer} style={{ padding: 12, backgroundColor: '#1D3557', borderRadius: 8, marginRight: 8 }}>
              <Text style={{ color: '#fff' }}>Use This Location</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8 }}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
