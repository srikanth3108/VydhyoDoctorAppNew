import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {ProviderTabParamList} from '../../navigation/types';
import ProviderTabBar from '../../components/provider/ProviderTabBar';
import ProviderHomeTab from './tabs/ProviderHomeTab';
import ProviderJobsTab from './tabs/ProviderJobsTab';
import ProviderEarningsTab from './tabs/ProviderEarningsTab';
import ProviderProfileTab from './tabs/ProviderProfileTab';

const Tab = createBottomTabNavigator<ProviderTabParamList>();

export default function ProviderTabDashboard() {
  return (
    <Tab.Navigator
      tabBar={props => <ProviderTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home" component={ProviderHomeTab} />
      <Tab.Screen name="Jobs" component={ProviderJobsTab} />
      <Tab.Screen name="Earnings" component={ProviderEarningsTab} />
      <Tab.Screen name="Profile" component={ProviderProfileTab} />
    </Tab.Navigator>
  );
}
