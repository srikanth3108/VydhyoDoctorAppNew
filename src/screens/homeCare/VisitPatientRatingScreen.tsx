import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {Star, Heart, ArrowRight} from 'lucide-react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {ProviderStackParamList} from '../../navigation/types';
import {Job} from '../../services/api';
import {submitPatientRating} from '../../services/apiHelpers';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import ProviderCard from '../../components/provider/ProviderCard';
import {moderateScale} from '../../utils/responsive';
import Toast from 'react-native-toast-message';

type RouteProps = RouteProp<ProviderStackParamList, 'VisitPatientRating'>;
type Nav = NativeStackNavigationProp<
  ProviderStackParamList,
  'VisitPatientRating'
>;

const TAGS = [
  'Professional',
  'On time',
  'Caring',
  'Clear communication',
  'Would recommend',
];

export default function VisitPatientRatingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Use job data passed through navigation params
    if (route.params?.job) {
      setJob(route.params.job as any);
      setLoading(false);
    } else {
      // Fallback: if no job data passed, display empty state
      setLoading(false);
    }
  }, [route.params?.job]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const submit = async () => {
    if (!job || rating < 1) {
      Toast.show({
        type: 'info',
        text1: 'Select a rating',
        text2: 'Ask the patient to tap 1–5 stars for your visit.',
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitPatientRating({
        appointmentId: job.id,
        stars: rating,
        comment: comment.trim(),
        tags: selectedTags,
      });
      Toast.show({
        type: 'success',
        text1: 'Thank you!',
        text2: 'Patient rating saved to your care profile.',
      });
      navigation.navigate('ProviderTabs', {screen: 'Home'});
    } catch (error) {
      console.error('Error submitting rating:', error);
      Toast.show({
        type: 'error',
        text1: 'Could not save rating',
        text2: 'Check your connection and try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PROVIDER_THEME.jade} />
      </View>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Heart color={PROVIDER_THEME.jadeGlow} size={moderateScale(36)} />
          <Text style={styles.headerTitle}>No job data available</Text>
          <Text style={styles.headerSub}>
            Please complete a visit to rate the patient experience.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.submitBtn, {marginTop: moderateScale(20), marginHorizontal: moderateScale(20)}]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.submitText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={PROVIDER_THEME.navy}
      />
      <View style={styles.header}>
        <Heart color={PROVIDER_THEME.jadeGlow} size={moderateScale(36)} />
        <Text style={styles.headerTitle}>Patient rates your visit</Text>
        <Text style={styles.headerSub}>
          Hand the phone to {job.patientName} to rate care before you leave.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProviderCard>
          <Text style={styles.patient}>{job.patientName}</Text>
          <Text style={styles.service}>{job.serviceType}</Text>
          <Text style={styles.meta}>{job.dateTime}</Text>
        </ProviderCard>

        <Text style={styles.sectionLabel}>How was your care today?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity
              key={n}
              onPress={() => setRating(n)}
              style={styles.starBtn}
              activeOpacity={0.8}>
              <Star
                size={moderateScale(40)}
                color={
                  n <= rating ? PROVIDER_THEME.amber : PROVIDER_THEME.sandDeep
                }
                fill={n <= rating ? PROVIDER_THEME.amber : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingHint}>
          {rating === 0
            ? 'Tap a star'
            : rating >= 4
            ? 'Excellent — thank you!'
            : rating >= 3
            ? 'Good visit'
            : 'We will follow up with operations'}
        </Text>

        <Text style={styles.sectionLabel}>Quick tags (optional)</Text>
        <View style={styles.tagsWrap}>
          {TAGS.map(tag => {
            const on = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, on && styles.tagOn]}
                onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, on && styles.tagTextOn]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Comments (optional)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Share feedback about the visit..."
          placeholderTextColor={PROVIDER_THEME.textSoft}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={300}
        />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (submitting || rating < 1) && styles.submitDisabled,
          ]}
          onPress={submit}
          disabled={submitting || rating < 1}>
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit patient rating</Text>
              <ArrowRight color="#FFF" size={moderateScale(18)} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => navigation.navigate('ProviderTabs', {screen: 'Home'})}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: PROVIDER_THEME.bg},
  loader: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    backgroundColor: PROVIDER_THEME.navy,
    padding: moderateScale(24),
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: moderateScale(22),
    fontWeight: '800',
    marginTop: moderateScale(12),
    textAlign: 'center',
  },
  headerSub: {
    color: PROVIDER_THEME.textOnInkMuted,
    fontSize: moderateScale(14),
    marginTop: moderateScale(8),
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  scroll: {padding: moderateScale(16), paddingBottom: moderateScale(40)},
  patient: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
  },
  service: {
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.jade,
    fontWeight: '600',
    marginTop: moderateScale(4),
  },
  meta: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
  },
  sectionLabel: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: PROVIDER_THEME.textSoft,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  starBtn: {padding: moderateScale(4)},
  ratingHint: {
    textAlign: 'center',
    marginTop: moderateScale(10),
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: PROVIDER_THEME.jade,
  },
  tagsWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: moderateScale(8)},
  tag: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(999),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: PROVIDER_THEME.pearl,
  },
  tagOn: {
    backgroundColor: PROVIDER_THEME.jadeMuted,
    borderColor: PROVIDER_THEME.jade,
  },
  tagText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: PROVIDER_THEME.textMuted,
  },
  tagTextOn: {color: PROVIDER_THEME.jadeDeep},
  commentInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    minHeight: moderateScale(96),
    textAlignVertical: 'top',
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.ink,
    backgroundColor: PROVIDER_THEME.pearl,
  },
  submitBtn: {
    flexDirection: 'row',
    gap: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.jade,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(16),
    marginTop: moderateScale(24),
  },
  submitDisabled: {opacity: 0.55},
  submitText: {color: '#FFF', fontWeight: '800', fontSize: moderateScale(16)},
  skipBtn: {alignItems: 'center', marginTop: moderateScale(16)},
  skipText: {color: PROVIDER_THEME.textMuted, fontWeight: '600'},
});
