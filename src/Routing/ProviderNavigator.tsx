import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProviderDutyProvider } from '../context/ProviderDutyContext';
import { ProviderModalProvider } from '../context/ProviderModalContext';
import { ProviderSideMenuProvider } from '../context/ProviderSideMenuContext';
import ProviderModalHost from '../components/provider/modals/ProviderModalHost';
import ProviderLiveOfferWatcher from '../components/provider/ProviderLiveOfferWatcher';
import SideMenuOverlay from '../components/provider/SideMenuOverlay';
import { ProviderRole, ProviderStackParamList } from '../navigation/types';
import { getProviderRole } from '../services/authSession';
import { PROVIDER_THEME } from '../theme/providerTheme';
import ProviderTabDashboard from '../screens/homeCare/ProviderTabDashboard';
import ActiveVisitScreen from '../screens/homeCare/ActiveVisitScreen';
import VisitPatientRatingScreen from '../screens/homeCare/VisitPatientRatingScreen';
import PostVisitLearningScreen from '../screens/homeCare/PostVisitLearningScreen';
import PatientDetailScreen from '../screens/homeCare/PatientDetailScreen';
import VideoCallScreen from '../screens/homeCare/VideoCallScreen';
import AvailabilityScreen from '../screens/homeCare/AvailabilityScreen';
import ProviderPinManagementScreen from '../screens/homeCare/ProviderPinManagementScreen';
import ReportsScreen from '../screens/homeCare/ReportsScreen';
import SettlementsScreen from '../screens/homeCare/SettlementsScreen';
import MyPatientsScreen from '../screens/homeCare/MyPatientsScreen';
import AddressUpdateScreen from '../screens/homeCare/AddressUpdateScreen';

const Stack = createNativeStackNavigator<ProviderStackParamList>();

export default function ProviderNavigator() {
  const [ready, setReady] = useState(false);
  const [providerRole, setProviderRole] = useState<ProviderRole | null>('merchant');

  useEffect(() => {
    let mounted = true;
    async function load() {
      const role = await getProviderRole();
      if (!mounted) return;
      setProviderRole(role);
      setReady(true);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: PROVIDER_THEME.bg,
        }}>
        <ActivityIndicator size="large" color={PROVIDER_THEME.primary} />
      </View>
    );
  }

  return (
    <ProviderDutyProvider>
      <ProviderModalProvider>
        <ProviderSideMenuProvider>
          <View style={{ flex: 1 }}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="ProviderTabs">
                {() => (providerRole === 'merchant' ? null : <ProviderTabDashboard />)}
              </Stack.Screen>
              <Stack.Screen
                name="ActiveVisit"
                component={ActiveVisitScreen}
                options={{ presentation: 'fullScreenModal' }}
              />
              <Stack.Screen
                name="VisitPatientRating"
                component={VisitPatientRatingScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="PostVisitLearning"
                component={PostVisitLearningScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="PatientDetail"
                component={PatientDetailScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="VideoCall"
                component={VideoCallScreen}
                options={{ presentation: 'fullScreenModal', animation: 'fade' }}
              />
              <Stack.Screen
                name="ProviderAvailability"
                component={AvailabilityScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="ProviderPinManagement"
                component={ProviderPinManagementScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="Reports"
                component={ReportsScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="Settlements"
                component={SettlementsScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="MyPatients"
                component={MyPatientsScreen}
                options={{ presentation: 'card' }}
              />
              <Stack.Screen
                name="AddressUpdate"
                component={AddressUpdateScreen}
                options={{ presentation: 'card' }}
              />
            </Stack.Navigator>
            <ProviderModalHost />
            <ProviderLiveOfferWatcher />
            <SideMenuOverlay />
          </View>
        </ProviderSideMenuProvider>
      </ProviderModalProvider>
    </ProviderDutyProvider>
  );
}
