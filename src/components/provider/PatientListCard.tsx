import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {ChevronRight, Video, Lock} from 'lucide-react-native';
import {Patient} from '../../services/api';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type Props = {
  patient: Patient;
  onPress: () => void;
};

const STATUS = {
  stable: {color: PROVIDER_THEME.jade, label: 'Stable'},
  monitoring: {color: PROVIDER_THEME.amber, label: 'Watch'},
  critical: {color: PROVIDER_THEME.rose, label: 'Alert'},
} as const;

export default function PatientListCard({patient, onPress}: Props) {
  const st = STATUS[patient.liveStatus ?? 'stable'];

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={[styles.avatar, {borderColor: st.color + '55'}]}>
        <Text style={[styles.initial, {color: st.color}]}>
          {patient.name.charAt(0)}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{patient.name}</Text>
          <View style={[styles.chip, {backgroundColor: st.color + '18'}]}>
            <View style={[styles.chipDot, {backgroundColor: st.color}]} />
            <Text style={[styles.chipText, {color: st.color}]}>{st.label}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {patient.age} yrs · {patient.gender}
        </Text>
        <Text style={styles.condition} numberOfLines={1}>
          {patient.conditions[0]}
        </Text>
      </View>
      <View style={styles.right}>
        {patient.firstHomeVisitCompleted ? (
          <Video color={PROVIDER_THEME.violet} size={16} />
        ) : (
          <Lock color={PROVIDER_THEME.textSoft} size={14} />
        )}
        <ChevronRight color={PROVIDER_THEME.textSoft} size={18} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.pearl,
    borderRadius: moderateScale(PROVIDER_THEME.radius.lg),
    padding: moderateScale(14),
    marginBottom: moderateScale(10),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    ...PROVIDER_THEME.shadowStyles.card,
  },
  avatar: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(16),
    backgroundColor: PROVIDER_THEME.sand,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  initial: {fontSize: moderateScale(20), fontWeight: '800'},
  body: {flex: 1, minWidth: 0},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    flexWrap: 'wrap',
  },
  name: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(8),
  },
  chipDot: {width: 5, height: 5, borderRadius: 3},
  chipText: {fontSize: moderateScale(10), fontWeight: '800'},
  meta: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  condition: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textSoft,
    marginTop: moderateScale(4),
    fontWeight: '600',
  },
  right: {alignItems: 'center', gap: moderateScale(8), marginLeft: moderateScale(8)},
});
