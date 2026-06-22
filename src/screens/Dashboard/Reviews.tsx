import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { AccountIcon, CommentTextOutlineIcon, DoctorIcon, UpArrowIcon, DownArrowIcon, SendIcon, PersonIcon } from '../../utility/SvgIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { AuthFetch, AuthPost } from '../../auth/auth';

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
  SAFE_AREA,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';
import { FullStarIcon } from '../../utility/SvgIcons';

const ReviewsScreen = () => {
  const navigation = useNavigation();
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId = currentuserDetails?.role === 'doctor' ? currentuserDetails?.userId : currentuserDetails?.createdBy;
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const window = useWindowDimensions();
  const availableWidth = window.width;
  const [parentWidth, setParentWidth] = useState<number | null>(null);
  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setParentWidth(w);
  };
  const effectiveWidth = Math.min(parentWidth || availableWidth, availableWidth);
  const isTabletLayout = effectiveWidth >= 768;
  const contentWidth = isTabletLayout
    ? Math.min(900, Math.max(700, Math.round(effectiveWidth * 0.85)))
    : Math.round(effectiveWidth * 0.95);

  // fetch token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        setToken(storedToken);
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to retrieve authentication token');
      }
    };
    fetchToken();
  }, []);

  // Fetch reviews and conversations from the API
  useEffect(() => {
    const fetchReviews = async () => {
      if (!token || !doctorId) return;

      setLoading(true);
      try {
        const response = await AuthFetch(`users/getFeedbackByDoctorId/${doctorId}`, token);

        if (response.status === 'success' && response.data && response.data.doctor) {
          const doctorData = response.data.doctor;
          setOverallRating(doctorData.overallRating || 0);

          // Map the feedback array to reviews and fetch conversations for each
          const feedbackArray = doctorData.feedback || [];
          const formatted = await Promise.all(
            feedbackArray.map(async (feedback: any) => {
              // Fetch conversation for this feedback
              let conversation: any[] = [];
              try {
                const conv = await AuthFetch(`users/getFeedbackById/${feedback.feedbackId || feedback.id}`, token);
                if (conv.status === 'success' && conv.feedback) conversation = conv.feedback.conversation || [];
                else if (conv.status === 'success' && conv.data?.feedback) conversation = conv.data.feedback.conversation || [];
              } catch (err) {
                console.warn('conv fetch err', err);
              }
              return {
                id: feedback.feedbackId || feedback.id,
                user: feedback.patientName || 'Anonymous Patient',
                date: feedback.createdAt || 'N/A',
                rating: feedback.rating || 0,
                review: feedback.comment || 'No review provided',
                conversation,
              };
            })
          );

          setReviews(formatted);
        } else {
          Alert.alert('Error', JSON.stringify(response.message) || 'Failed to fetch reviews or invalid response');
        }
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to fetch reviews');
      }
      setLoading(false);
    };

    if (token && doctorId) fetchReviews();
  }, [token, doctorId]);

  // submit reply
  const handleSubmitReply = async (feedbackId: string) => {
    if (!replyText[feedbackId] || replyText[feedbackId].trim() === '') {
      Alert.alert('Error', 'Please enter a reply before submitting');
      return;
    }

    const payload = { feedbackId, message: replyText[feedbackId] };
    setSubmitting(prev => ({ ...prev, [feedbackId]: true }));

    try {
      const response = await AuthPost('users/submitDoctorReply', payload, token, { headers: { 'Content-Type': 'application/json' } });
      if (response.status === 'success') {
        // refresh specific conversation
        try {
          const convRes = await AuthFetch(`users/getFeedbackById/${feedbackId}`, token);
          const convData = convRes.feedback || convRes.data?.feedback || null;
          if (convData) {
            setReviews(prev => prev.map(r => r.id === feedbackId ? { ...r, conversation: convData.conversation || [] } : r));
          }
        } catch (err) {
          console.warn('Failed to refresh conversation', err);
        }
        setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
        Alert.alert('Success', 'Reply submitted successfully');
      } else {
        Alert.alert('Error', response?.message?.message || 'Failed to submit reply');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit reply');
    } finally {
      setSubmitting(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { 
      year:'numeric', 
      month:'short', 
      day:'numeric', 
      hour:'2-digit', 
      minute:'2-digit' 
    }).replace(',', ' •');
  };

  const toggleExpandedReview = (id: string) => {
    setExpandedReview(prev => prev === id ? null : id);
  };

  const getSortedConversation = (conversation: any[]) => {
    return [...conversation].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  return (

      <KeyboardAvoidingView 
        style={styles.scrollViewContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >

        <CommonHeader title="Reviews" />
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollViewContent, { alignItems: 'center' }]} 
          showsVerticalScrollIndicator={false}
        >

          <View style={{ width: contentWidth, alignSelf: 'center' }}>

            <View style={styles.overallRatingCard}>
              <View style={styles.ratingHeader}>
                <View>
                  <Text style={styles.overallRatingTitle}>Overall Rating</Text>
                  <Text style={styles.totalReviews}>{reviews.length} reviews</Text>
                </View>
                <View style={styles.ratingDisplay}>
                  <Text style={styles.ratingNumber}>{loading ? '0.0' : overallRating.toFixed(1)}</Text>
                  <View style={styles.starsContainer}>
                    {[1,2,3,4,5].map(s => (
                      <FullStarIcon 
                        key={s} 
                        size={moderateScale(14)} 
                      color="#FBBF24" 
                        style={styles.starIcon} 
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CommentTextOutlineIcon size={moderateScale(40)} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Reviews Yet</Text>
                <Text style={styles.emptyText}>Patient reviews will appear here once they start leaving feedback.</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map(review => {
                  const sortedConversation = getSortedConversation(review.conversation || []);
                  const isExpanded = expandedReview === review.id;
                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.patientInfo}>
                          <View style={styles.avatarContainer}>
                            <AccountIcon size={moderateScale(32)} color="#6B7280"/>
                          </View>
                          <View style={styles.patientDetails}>
                            <Text style={styles.patientName}>{review.user}</Text>
                            <Text style={styles.reviewDate}>{formatDate(review.date)}</Text>
                          </View>
                        </View>
                        <View style={styles.ratingContainer}>
                          <View style={styles.reviewStars}>
                            {[1,2,3,4,5].map(s => (
                              <FullStarIcon 
                        key={s} 
                        size={moderateScale(14)} 
                      color="#FBBF24" 
                        style={styles.starIcon} 
                      />
                            ))}
                          </View>
                          <Text style={styles.ratingText}>{review.rating}.0</Text>
                        </View>
                      </View>

                      <View style={styles.initialReviewContainer}>
                        <View style={styles.messageHeader}>
                          <CommentTextOutlineIcon size={moderateScale(14)} color="#6B7280"/>
                          <Text style={styles.messageLabel}>Patient Review</Text>
                        </View>
                        <Text style={styles.reviewText} numberOfLines={isExpanded ? undefined : 3}>
                          {review.review}
                        </Text>
                        {review.review.length > 150 && (
                          <TouchableOpacity onPress={() => toggleExpandedReview(review.id)}>
                            <Text style={styles.readMoreText}>
                              {isExpanded ? 'Read less' : 'Read more'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {sortedConversation.length > 0 && (
                        <View style={styles.conversationContainer}>
                          <View style={styles.conversationHeader}>
                            <View style={styles.timelineIndicator}/>
                            <Text style={styles.conversationTitle}>Conversation</Text>
                          </View>
                          {sortedConversation.map((msg: any, idx: number) => (
                            <View key={msg._id || idx} style={styles.messageContainer}>
                              <View style={styles.messageHeader}>
                                {msg.sender === 'doctor' ? (
                                  <DoctorIcon size={moderateScale(14)} color="#3B82F6" />
                                ) : (
                                  <PersonIcon size={moderateScale(14)} color="#10B981" />
                                )}
                                <Text style={[styles.messageLabel, { color: msg.sender === 'doctor' ? '#3B82F6' : '#10B981' }]}> 
                                  {msg.sender === 'doctor' ? 'Dr. Response' : 'Patient'}
                                </Text>
                                <Text style={styles.messageTime}>{formatDate(msg.createdAt)}</Text>
                              </View>
                              <Text style={styles.messageText}>{msg.message}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.replySection}>
                        <TouchableOpacity 
                          style={styles.replyToggle} 
                          onPress={() => toggleExpandedReview(review.id)}
                        >
                          <CommentTextOutlineIcon size={moderateScale(14)} color="#3B82F6" style={styles.replyIcon}/>
                          <Text style={styles.replyToggleText}>
                            {isExpanded ? 'Cancel Reply' : 'Add Reply'}
                          </Text>
                          {isExpanded ? (
                            <UpArrowIcon size={moderateScale(14)} color="#3B82F6" />
                          ) : (
                            <DownArrowIcon size={moderateScale(14)} color="#3B82F6" />
                          )}
                        </TouchableOpacity>

                        {isExpanded && (
                          <View style={styles.replyForm}>
                            <TextInput
                              style={styles.replyInput}
                              placeholder="Write your professional response..."
                              placeholderTextColor="#9CA3AF"
                              value={replyText[review.id] || ''}
                              onChangeText={t => setReplyText(prev => ({ ...prev, [review.id]: t }))}
                              multiline
                              numberOfLines={3}
                            />
                            <TouchableOpacity 
                              style={[styles.submitReplyButton, submitting[review.id] && styles.submitReplyButtonDisabled]} 
                              onPress={() => handleSubmitReply(review.id)} 
                              disabled={submitting[review.id]}
                            >
                              {submitting[review.id] ? (
                                <ActivityIndicator size="small" color="#fff"/>
                              ) : (
                                <>
                                  <SendIcon size={moderateScale(14)} color="#fff" />
                                  <Text style={styles.submitReplyText}>Send Reply</Text>
                                </>
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
  );
};

export default ReviewsScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.md, 
    paddingTop: Platform.OS === 'ios' ? SAFE_AREA.safeTop : SPACING.md,
    paddingBottom: SPACING.sm, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB',
    height: LAYOUT.headerHeight,
  },
  backButton: { 
    padding: SPACING.xs 
  },
  headerTitle: { 
    fontSize: responsiveText(FONT_SIZE.lg), 
    fontWeight: '600', 
    color: '#1F2937', 
    flex: 1, 
    textAlign: 'center' 
  },
  headerRightPlaceholder: { 
    width: moderateScale(32), 
    height: moderateScale(32) 
  },
  scrollView: { 
    flex: 1 
  },
  scrollViewContainer: { 
    flex: 1 
  },
  scrollViewContent: { 
    flexGrow: 1, 
    paddingVertical: SPACING.md, 
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg 
  },
  overallRatingCard: { 
    backgroundColor: '#FFF', 
    marginTop: SPACING.xs, 
    marginBottom: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    padding: SPACING.md, 
    ...LAYOUT.shadow.md 
  },
  ratingHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  overallRatingTitle: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '700', 
    color: '#111', 
    marginBottom: SPACING.xxs 
  },
  totalReviews: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  ratingDisplay: { 
    alignItems: 'center' 
  },
  ratingNumber: { 
    fontSize: responsiveText(FONT_SIZE.xxl), 
    fontWeight: '800', 
    color: '#111', 
    marginBottom: SPACING.xxs 
  },
  starsContainer: { 
    flexDirection: 'row' 
  },
  starIcon: { 
    marginHorizontal: 1 
  },
  loadingContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: responsiveHeight(10) 
  },
  loadingText: { 
    marginTop: SPACING.md, 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#000' 
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: responsiveHeight(15), 
    paddingHorizontal: SPACING.lg 
  },
  emptyTitle: { 
    fontSize: responsiveText(FONT_SIZE.md), 
    fontWeight: '600', 
    color: '#4B5563', 
    marginTop: SPACING.md, 
    marginBottom: SPACING.xs 
  },
  emptyText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280', 
    textAlign: 'center', 
    lineHeight: moderateScale(18) 
  },
  reviewsList: { 
    paddingBottom: SPACING.md, 
    marginTop: SPACING.xs 
  },
  reviewCard: { 
    backgroundColor: '#FFF', 
    borderRadius: LAYOUT.borderRadius.md, 
    marginBottom: SPACING.sm, 
    ...LAYOUT.shadow.sm, 
    overflow: 'hidden' 
  },
  reviewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    padding: SPACING.md, 
    paddingBottom: SPACING.sm 
  },
  patientInfo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  avatarContainer: { 
    marginRight: SPACING.sm 
  },
  patientDetails: { 
    flex: 1 
  },
  patientName: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '700', 
    color: '#111', 
    marginBottom: SPACING.xxs 
  },
  reviewDate: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    color: '#6B7280' 
  },
  ratingContainer: { 
    alignItems: 'flex-end' 
  },
  reviewStars: { 
    flexDirection: 'row', 
    marginBottom: SPACING.xxs 
  },
  ratingText: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '500', 
    color: '#4B5563' 
  },
  initialReviewContainer: { 
    paddingHorizontal: SPACING.md, 
    paddingBottom: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  messageHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.xs 
  },
  messageLabel: { 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '600', 
    color: '#6B7280', 
    marginLeft: SPACING.xs, 
    flex: 1 
  },
  messageTime: { 
    fontSize: responsiveText(FONT_SIZE.xxs), 
    color: '#9CA3AF' 
  },
  reviewText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    lineHeight: moderateScale(20), 
    color: '#374151' 
  },
  readMoreText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#3B82F6',
    fontWeight: '500',
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  conversationContainer: { 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.md, 
    backgroundColor: '#FAFBFC', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  conversationHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: SPACING.md 
  },
  timelineIndicator: { 
    width: moderateScale(3), 
    height: moderateScale(14), 
    backgroundColor: '#3B82F6', 
    borderRadius: 2, 
    marginRight: SPACING.xs 
  },
  conversationTitle: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    color: '#1F2937' 
  },
  messageContainer: { 
    marginBottom: SPACING.md, 
    paddingLeft: SPACING.md, 
    borderLeftWidth: 2, 
    borderLeftColor: '#E5E7EB', 
    paddingBottom: SPACING.md 
  },
  messageText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    lineHeight: moderateScale(18), 
    color: '#374151' 
  },
  replySection: { 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6' 
  },
  replyToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.md 
  },
  replyIcon: { 
    marginRight: SPACING.xs 
  },
  replyToggleText: { 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500', 
    color: '#3B82F6', 
    flex: 1 
  },
  replyForm: { 
    paddingHorizontal: SPACING.md, 
    paddingBottom: SPACING.md 
  },
  replyInput: { 
    borderWidth: 1, 
    borderColor: '#D1D5DB', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.sm, 
    fontSize: responsiveText(FONT_SIZE.sm), 
    color: '#1F2937', 
    textAlignVertical: 'top', 
    minHeight: moderateScale(80), 
    marginBottom: SPACING.sm, 
    backgroundColor: '#FFF' 
  },
  submitReplyButton: { 
    backgroundColor: '#3B82F6', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: moderateScale(10), 
    paddingHorizontal: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.md 
  },
  submitReplyButtonDisabled: { 
    backgroundColor: '#9CA3AF' 
  },
  submitReplyText: { 
    color: '#FFF', 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '600', 
    marginLeft: SPACING.xs 
  },
});