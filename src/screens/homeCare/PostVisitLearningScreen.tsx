import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {BookOpen, CheckCircle, ArrowRight} from 'lucide-react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProviderStackParamList} from '../../navigation/types';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import ProviderCard from '../../components/provider/ProviderCard';
import {moderateScale} from '../../utils/responsive';

type RouteProps = RouteProp<ProviderStackParamList, 'PostVisitLearning'>;
type Nav = NativeStackNavigationProp<ProviderStackParamList, 'PostVisitLearning'>;

export default function PostVisitLearningScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const [done, setDone] = useState(false);

  const finish = () => {
    navigation.reset({
      index: 0,
      routes: [{name: 'ProviderTabs'}],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PROVIDER_THEME.navy} />
      <View style={styles.header}>
        <BookOpen color="#FFFFFF" size={moderateScale(40)} />
        <Text style={styles.title}>Post-visit learning</Text>
        <Text style={styles.sub}>
          Complete this module before your next booking. Video follow-up with this patient unlocks after this home visit.
        </Text>
      </View>
      <View style={styles.body}>
        <ProviderCard accent>
          <Text style={styles.moduleTitle}>Infection control at home</Text>
          <Text style={styles.moduleDesc}>
            90-second guide: hand hygiene, PPE, and safe waste disposal after clinical visits.
          </Text>
          <View style={styles.fakeVideo}>
            <Text style={styles.fakeVideoText}>▶ Training video</Text>
          </View>
          {!done ? (
            <TouchableOpacity style={styles.btn} onPress={() => setDone(true)}>
              <Text style={styles.btnText}>Mark as watched</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.doneRow}>
              <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(22)} />
              <Text style={styles.doneText}>Module completed</Text>
            </View>
          )}
        </ProviderCard>
        <TouchableOpacity
          style={[styles.finishBtn, !done && styles.finishDisabled]}
          onPress={finish}
          disabled={!done}>
          <Text style={styles.finishText}>Return to dashboard</Text>
          <ArrowRight color="#FFF" size={moderateScale(18)} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: PROVIDER_THEME.bg},
  header: {
    backgroundColor: PROVIDER_THEME.navy,
    padding: moderateScale(24),
    alignItems: 'center',
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: '#FFF',
    marginTop: moderateScale(12),
  },
  sub: {
    fontSize: moderateScale(14),
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: moderateScale(8),
    lineHeight: moderateScale(22),
  },
  body: {flex: 1, padding: moderateScale(16)},
  moduleTitle: {
    fontSize: moderateScale(17),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  moduleDesc: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(8),
    lineHeight: moderateScale(20),
  },
  fakeVideo: {
    height: moderateScale(140),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(14),
    marginTop: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  fakeVideoText: {
    fontWeight: '700',
    color: PROVIDER_THEME.primary,
  },
  btn: {
    marginTop: moderateScale(16),
    backgroundColor: PROVIDER_THEME.primary,
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  btnText: {color: '#FFF', fontWeight: '800'},
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginTop: moderateScale(16),
  },
  doneText: {fontWeight: '700', color: PROVIDER_THEME.success},
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.navy,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
    marginTop: moderateScale(8),
  },
  finishDisabled: {opacity: 0.45},
  finishText: {color: '#FFF', fontWeight: '800', fontSize: moderateScale(16)},
});
