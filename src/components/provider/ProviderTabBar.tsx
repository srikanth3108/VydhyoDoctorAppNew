import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Home, Briefcase, Wallet, User, Video} from 'lucide-react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';
import { useProviderDuty } from '../../context/ProviderDutyContext';

const ICONS = {
  Home,
  Jobs: Briefcase,
  Earnings: Wallet,
  Profile: User,
} as const;

export default function ProviderTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {activeJob, openVideoCall, canVideoCallForJob} = useProviderDuty();
  // const showVideoFab = activeJob && canVideoCallForJob(activeJob);

  return (
    <View style={styles.wrap}>
      {/* {showVideoFab && activeJob ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            openVideoCall(activeJob.patientName, activeJob.id, 'patient')
          }
          activeOpacity={0.92}>
          <Video color="#FFF" size={moderateScale(22)} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null} */}
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const {options} = descriptors[route.key];
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? Home;

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.85}>
              <View style={[styles.iconBox, focused && styles.iconBoxOn]}>
                <Icon
                  color={focused ? PROVIDER_THEME.navy : PROVIDER_THEME.textSoft}
                  size={moderateScale(21)}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelOn]}>
                {String(label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: moderateScale(18),
    right: moderateScale(18),
    bottom: Platform.OS === 'ios' ? moderateScale(26) : moderateScale(16),
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: PROVIDER_THEME.surface,
    borderRadius: moderateScale(26),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(6),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    ...PROVIDER_THEME.shadowStyles.float,
  },
  tab: {flex: 1, alignItems: 'center'},
  iconBox: {
    width: moderateScale(42),
    height: moderateScale(34),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxOn: {
    backgroundColor: PROVIDER_THEME.jadeMuted,
  },
  label: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: PROVIDER_THEME.textSoft,
    marginTop: 2,
  },
  labelOn: {
    color: PROVIDER_THEME.navy,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    top: moderateScale(-54),
    alignSelf: 'center',
    left: '50%',
    marginLeft: moderateScale(-27),
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    backgroundColor: PROVIDER_THEME.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: PROVIDER_THEME.bg,
    ...PROVIDER_THEME.shadowStyles.float,
  },
});
