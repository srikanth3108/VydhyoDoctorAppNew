import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { AuthFetch } from '../../auth/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import responsive utilities
import {
  responsiveText,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
} from '../../utility/responsive';

const PatientDetails = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const route = useRoute<any>();
  const { patientDetails } = route.params;
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;

  console.log('Patient Details:lol', patientDetails);
  const [prescriptionsCount, setPrescriptionsCount] = useState(0);

  const fetchPastPrescriptionsCount = async () => {
    if (!patientDetails?.patientId) return;

    try {
      const storedToken = await AsyncStorage.getItem('authToken');

      const res = await AuthFetch(
        `pharmacy/getEPrescriptionByPatientId/${patientDetails.patientId}`,
        storedToken,
      );
      console.log('API response for past prescriptions:', res);
      if (res.status === 'success' || res.data.success) {
        console.log('API response for past prescriptions:', res);
        const list = res.data.data || [];
        console.log('Fetched past prescriptions:', list);
        if (list?.length > 0) {
          setPrescriptionsCount(list.length);
        }
      }
    } catch (error) {
      console.error('Error fetching past prescriptions:', error);
    }
  };

  useEffect(() => {
    fetchPastPrescriptionsCount();
  }, [patientDetails?.patientId]);

  // --- Initialize chief complaint ONCE from appointmentReason (ignoring "Not specified")
  const initialChiefComplaint =
    patientDetails?.appointmentReason &&
    patientDetails.appointmentReason.toLowerCase() !== 'not specified'
      ? patientDetails.appointmentReason
      : '';

  // Chief Complaint Tag System
  const [chiefComplaintInput, setChiefComplaintInput] = useState('');
  const [chiefComplaintSuggestions, setChiefComplaintSuggestions] = useState<
    string[]
  >([]);
  const [showChiefSuggestions, setShowChiefSuggestions] = useState(false);
  const [chiefComplaintTags, setChiefComplaintTags] = useState<string[]>([]);
  const autoSelectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const chiefInputRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState<any>({
    doctorInfo: {
      doctorId: doctorId || '',
      doctorName: '',
      qualifications: '',
      specialization: '',
      medicalRegistrationNumber: '',
      selectedClinicId: patientDetails.addressId || '',
      clinicAddress: '',
      contactNumber: '',
      appointmentDate: patientDetails.date || '',
      appointmentStartTime: patientDetails.appointmentTime || '',
      appointmentEndTime: '',
    },
    patientInfo: {
      patientId: patientDetails.patientId || '',
      patientName: '',
      age: '',
      gender: '',
      mobileNumber: '',
      chiefComplaint: initialChiefComplaint, // seeded once
      walkinDoctorRegistrationNumber:
        patientDetails.walkinDoctorRegistrationNumber || '',
      walkinReferredBy: patientDetails.walkinReferredBy || '',
      pastMedicalHistory: '',
      familyMedicalHistory: '',
      physicalExamination: '',
      appointmentId: patientDetails.id || '',
    },
    vitals: {},
    diagnosis: {},
    advice: {},
  });

  // Track if user started editing to avoid overwriting from network responses
  const [userEdited, setUserEdited] = useState<{ chiefComplaint: boolean }>({
    chiefComplaint: false,
  });

  const [doctorData, setDoctorData] = useState<any>({});
  const [allClinics, setAllClinics] = useState<any>({});

  const fetchPrescription = async () => {
    const appointmentId = patientDetails?.appointmentId || patientDetails?.id;
    if (!appointmentId) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        `pharmacy/getEPrescriptionByAppointmentId/${appointmentId}`,
        token,
      );
      console.log('Prescription response:', response);
      if (response?.data?.success && response.data.data) {
        const prescription = response.data.data[0];
        const bpParts = prescription.vitals?.bp?.split('/') || [];
        const bpSystolic = bpParts[0] || '';
        const bpDiastolic = bpParts[1] || '';

        const chiefComplaintValue =
          prescription.patientInfo?.chiefComplaint ||
          patientDetails.appointmentReason ||
          '';
        const processedChiefComplaint =
          chiefComplaintValue?.toLowerCase() === 'not specified'
            ? ''
            : chiefComplaintValue;

        setFormData((prev: any) => ({
          ...prev,
          doctorInfo: {
            ...prev.doctorInfo,
            doctorId: prescription.doctorId || doctorId,
            selectedClinicId:
              prescription.addressId || prev.doctorInfo.selectedClinicId || '',
            appointmentDate:
              patientDetails.date || prev.doctorInfo.appointmentDate || '',
            appointmentStartTime:
              patientDetails.appointmentTime ||
              prev.doctorInfo.appointmentStartTime ||
              '',
          },
          patientInfo: {
            ...prev.patientInfo,
            patientId:
              prescription.userId ||
              patientDetails.patientId ||
              prev.patientInfo.patientId ||
              '',
            patientName:
              prescription.patientInfo?.patientName ||
              patientDetails.patientName ||
              prev.patientInfo.patientName ||
              '',
            age:
              prescription.patientInfo?.age ||
              patientDetails.age ||
              prev.patientInfo.age ||
              '',
            gender:
              prescription.patientInfo?.gender ||
              patientDetails.gender ||
              prev.patientInfo.gender ||
              '',
            mobileNumber:
              prescription.patientInfo?.mobileNumber ||
              patientDetails.mobileNumber ||
              prev.patientInfo.mobileNumber ||
              '',
            // Only set chiefComplaint from API if the user hasn't started typing AND current value is empty
            chiefComplaint: processedChiefComplaint,
            chiefComplaintTags: processedChiefComplaint
              ? processedChiefComplaint
                  .split('|')
                  .map(item => item.trim().toUpperCase())
                  .filter(item => item && item !== 'NOT SPECIFIED')
              : [],
            pastMedicalHistory:
              prescription.patientInfo?.pastMedicalHistory ||
              prev.patientInfo.pastMedicalHistory ||
              '',
            familyMedicalHistory:
              prescription.patientInfo?.familyMedicalHistory ||
              prev.patientInfo.familyMedicalHistory ||
              '',
            physicalExamination:
              prescription.patientInfo?.physicalExamination ||
              prev.patientInfo.physicalExamination ||
              '',
            appointmentId:
              prescription.appointmentId ||
              prev.patientInfo.appointmentId ||
              '',
          },
          vitals: {
            bpSystolic,
            bpDiastolic,
            pulseRate: prescription.vitals?.pulseRate || '',
            respiratoryRate: prescription.vitals?.respiratoryRate || '',
            temperature: prescription.vitals?.temperature || '',
            spo2: prescription.vitals?.spo2 || '',
            height: prescription.vitals?.height || '',
            weight: prescription.vitals?.weight || '',
            bmi: prescription.vitals?.bmi || '',
            investigationFindings:
              prescription.vitals?.investigationFindings || '',
            other: prescription.vitals?.other || {},
          },
          diagnosis: {
            diagnosisList: prescription.diagnosis?.diagnosisNote || '',
            selectedTests: prescription.diagnosis?.selectedTests || [],
            medications:
              prescription.diagnosis?.medications?.map((med: any) => ({
                ...med,
                id: Date.now() + Math.random(),
                timings:
                  typeof med.timings === 'string'
                    ? med.timings.split(', ')
                    : med.timings,
              })) || [],
            testNotes: prescription.diagnosis?.testsNote || '',
          },
          advice: {
            medicationNotes: prescription.advice?.PrescribeMedNotes || '',
            advice: prescription.advice?.advice || '',
            followUpDate: prescription.advice?.followUpDate || '',
          },
        }));
        // Auto populate tags from existing chief complaint
        if (processedChiefComplaint) {
          const tagsFromAPI = processedChiefComplaint
            .split('|')
            .map(item => item.trim().toUpperCase())
            .filter(item => item && item !== 'NOT SPECIFIED');

          setChiefComplaintTags(tagsFromAPI);
        }
      }
    } catch (error) {
      console.error('Error fetching prescription:', error);
    }
  };

  const fetchDoctorData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        `users/getUser?userId=${doctorId}`,
        token,
      );
      const userData = response.data?.data;
      if (response.data.status === 'success') {
        setDoctorData(userData);
        const clinic =
          (userData?.addresses?.filter(
            (address: any) =>
              address.type === 'Clinic' &&
              address.status === 'Active' &&
              address.addressId === patientDetails.addressId,
          ) || [])[0] || {};
        setFormData((prevFormData: any) => ({
          ...prevFormData,
          doctorInfo: {
            ...prevFormData.doctorInfo,
            appointmentDate: patientDetails?.date,
            appointmentStartTime: patientDetails?.appointmentTime,
            appointmentEndTime: '',
            clinicAddress: clinic?.address || '',
            contactNumber: clinic?.mobile || '',
            doctorId:
              patientDetails?.doctorId ||
              prevFormData.doctorInfo.doctorId ||
              '',
            doctorName: `${userData?.firstname ?? ''} ${
              userData?.lastname ?? ''
            }`.trim(),
            medicalRegistrationNumber:
              userData?.medicalRegistrationNumber || '',
            qualifications: userData?.specialization?.degree || '',
            selectedClinicId:
              clinic?.addressId ||
              prevFormData.doctorInfo.selectedClinicId ||
              '',
            specialization: userData?.specialization?.name || '',
          },
        }));
        setAllClinics(clinic);
      }
    } catch (error) {
      // handle silently
    }
  };

  const fetchUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        const profileResponse = await AuthFetch(
          `users/getUser?userId=${patientDetails.patientId}`,
          storedToken,
        );
        if (profileResponse.data.status === 'success') {
          const patientFormDetails = profileResponse.data.data;
          setFormData((prev: any) => ({
            ...prev,
            patientInfo: {
              ...prev.patientInfo,
              appointmentId:
                patientDetails?.appointmentId || patientDetails?.id,
              patientName:
                patientFormDetails?.firstname ?? prev.patientInfo.patientName,
              patientId:
                patientDetails?.patientId ?? prev.patientInfo.patientId,
              age: patientFormDetails?.age ?? prev.patientInfo.age,
              gender: patientFormDetails?.gender ?? prev.patientInfo.gender,
              mobileNumber:
                patientFormDetails?.mobile ?? prev.patientInfo.mobileNumber,
              // do NOT touch chiefComplaint here
            },
          }));
        }
      }
    } catch (e) {
      // handle silently
    }
  };

  // Fetch suggestions for Chief Complaint
  const fetchChiefComplaintSuggestions = async (searchTerm: string) => {
    console.log('searchTerm', searchTerm);
    const isSpaceTrigger = searchTerm === ' ';
    if (!isSpaceTrigger && (!searchTerm || searchTerm.trim().length < 2)) {
      setChiefComplaintSuggestions([]);
      setShowChiefSuggestions(false);
      return;
    }
    console.log('before===================');
    try {
      const storedToken = await AsyncStorage.getItem('authToken');

      const res = await AuthFetch(
        `pharmacy/searchChiefComplaints?doctorId=${doctorId}&searchTerm=${encodeURIComponent(
          isSpaceTrigger ? '' : searchTerm,
        )}&limit=10`,
        storedToken,
      );
      console.log('chief complaint suggestions response:', res);
      const data = res?.data;
      if (data?.success && Array.isArray(data.data)) {
        setChiefComplaintSuggestions(data.data);
        setShowChiefSuggestions(data.data.length > 0);
      } else {
        setChiefComplaintSuggestions([]);
        setShowChiefSuggestions(false);
      }
    } catch (error) {
      setChiefComplaintSuggestions([]);
      setShowChiefSuggestions(false);
    }
  };

  const addChiefComplaintTag = (tag: string) => {
    const trimmed = tag.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) return;

    if (chiefComplaintTags.includes(trimmed)) {
      setChiefComplaintInput('');
      setShowChiefSuggestions(false);
      return;
    }

    const newTags = [...chiefComplaintTags, trimmed];
    setChiefComplaintTags(newTags);
    setChiefComplaintInput('');
    setShowChiefSuggestions(false);

    // Clear timer
    if (autoSelectTimerRef.current) {
      clearTimeout(autoSelectTimerRef.current);
    }

    // Update main formData
    setFormData((prev: any) => ({
      ...prev,
      patientInfo: {
        ...prev.patientInfo,
        chiefComplaint: newTags.join(' | '),
        chiefComplaintTags: newTags,
      },
    }));
  };

  const removeChiefComplaintTag = (tagToRemove: string) => {
    const newTags = chiefComplaintTags.filter(tag => tag !== tagToRemove);
    setChiefComplaintTags(newTags);

    setFormData((prev: any) => ({
      ...prev,
      patientInfo: {
        ...prev.patientInfo,
        chiefComplaint: newTags.join(' | '),
      },
    }));
  };

  const handleNextPress = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      navigation.navigate('Vitals', { patientDetails, formData });
    }, 100);
  };

  const handleCancelPress = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (currentuserDetails) {
      fetchDoctorData();
      fetchPrescription();
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentuserDetails]);

  const keyboardVerticalOffset = Platform.select({
    ios: moderateScale(80),
    android: moderateScale(80),
  }) as number;

  useEffect(() => {
    return () => {
      if (autoSelectTimerRef.current) {
        clearTimeout(autoSelectTimerRef.current);
      }
    };
  }, []);

  const getVisitText = (count: number) => {
    const suffix =
      count % 10 === 1 && count % 100 !== 11
        ? 'st'
        : count % 10 === 2 && count % 100 !== 12
        ? 'nd'
        : count % 10 === 3 && count % 100 !== 13
        ? 'rd'
        : 'th';

    return `${count}${suffix} Visit`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.container}>
        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {/* Patient Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👤 Patient Details</Text>
              {prescriptionsCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>
                    {getVisitText(prescriptionsCount)}
                  </Text>
                </View>
              )}

            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Patient Name</Text>
              <Text style={styles.detailValue}>
                {formData.patientInfo.patientName || 'Not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <View style={styles.radioGroup}>
                {['Male', 'Female', 'Other'].map(g => {
                  const isSelected = formData.patientInfo.gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.radioOption,
                        !isSelected && styles.disabledOption,
                      ]}
                      disabled
                    >
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={styles.selectedCircle} />}
                      </View>
                      <Text style={styles.radioText}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>
                {formData.patientInfo.age || 'Not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mobile Number</Text>
              <Text style={styles.detailValue}>
                {formData.patientInfo.mobileNumber || 'Not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Walk-in Doctor Registration Number
              </Text>
              <Text style={styles.detailValue}>
                {formData.patientInfo.walkinDoctorRegistrationNumber ||
                  'Not provided'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Walk-in Referred By</Text>
              <Text style={styles.detailValue}>
                {formData.patientInfo.walkinReferredBy || 'Not provided'}
              </Text>
            </View>
          </View>

          {/* Patient History Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📘 Patient History</Text>
            <Text style={styles.subtitle}>
              Complete medical history documentation
            </Text>

            {/* Chief Complaint with Tags & Suggestions */}
            <View>
              <Text style={styles.label}>Chief Complaint</Text>

              <TouchableOpacity
                style={styles.tagInputContainer}
                onPress={() => chiefInputRef.current?.focus()}
                activeOpacity={1}
              >
                <View style={styles.tagsWrapper}>
                  {chiefComplaintTags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                      <TouchableOpacity
                        onPress={() => removeChiefComplaintTag(tag)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.tagClose}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TextInput
                    ref={chiefInputRef}
                    value={chiefComplaintInput}
                    onChangeText={text => {
                      setChiefComplaintInput(text);
                      fetchChiefComplaintSuggestions(text);

                      // Clear previous timer
                      if (autoSelectTimerRef.current) {
                        clearTimeout(autoSelectTimerRef.current);
                      }

                      // Auto-select after 5 seconds if user is still typing
                      if (text.trim().length >= 2) {
                        autoSelectTimerRef.current = setTimeout(() => {
                          addChiefComplaintTag(text);
                        }, 5000); // 5 seconds
                      }
                    }}
                    onKeyPress={e => {
                      if (
                        e.nativeEvent.key === 'Enter' &&
                        chiefComplaintInput.trim()
                      ) {
                        if (autoSelectTimerRef.current) {
                          clearTimeout(autoSelectTimerRef.current);
                        }
                        addChiefComplaintTag(chiefComplaintInput);
                      }
                    }}
                    placeholder={
                      chiefComplaintTags.length === 0
                        ? 'Type complaints... (e.g. fever, cough)'
                        : ''
                    }
                    style={styles.tagTextInput}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>

              {showChiefSuggestions && chiefComplaintSuggestions.length > 0 && (
                <View style={styles.suggestionsDropdown}>
                  {chiefComplaintSuggestions.map((suggestion, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionItem}
                      onPress={() => addChiefComplaintTag(suggestion)}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Other History Fields */}
              <Text style={styles.label}>Past Medical History</Text>
            <TextInput
              placeholder="Past Medical History"
              placeholderTextColor="#9CA3AF"
              style={styles.textArea}
              multiline
              value={formData.patientInfo.pastMedicalHistory || ''}
              onChangeText={text =>
                setFormData((prev: any) => ({
                  ...prev,
                  patientInfo: {
                    ...prev.patientInfo,
                    pastMedicalHistory: text,
                  },
                }))
              }
            />

              <Text style={styles.label}>Other Notes</Text>
            <TextInput
              placeholder="Other Notes"
              placeholderTextColor="#9CA3AF"
              style={styles.textArea}
              multiline
              value={formData.patientInfo.familyMedicalHistory || ''}
              onChangeText={text =>
                setFormData((prev: any) => ({
                  ...prev,
                  patientInfo: {
                    ...prev.patientInfo,
                    familyMedicalHistory: text,
                  },
                }))
              }
            />

              <Text style={styles.label}>Physical Examination</Text>

            <TextInput
              placeholder="Physical Examination"
              placeholderTextColor="#9CA3AF"
              style={styles.textArea}
              multiline
              value={formData.patientInfo.physicalExamination || ''}
              onChangeText={text =>
                setFormData((prev: any) => ({
                  ...prev,
                  patientInfo: {
                    ...prev.patientInfo,
                    physicalExamination: text,
                  },
                }))
              }
            />
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNextPress}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PatientDetails;

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scrollContent: {
    padding: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: moderateScale(30), // ← Increased significantly
  },
  section: {
    backgroundColor: '#fff',
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.sm,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    marginBottom: SPACING.sm,
    color: '#0A2342',
  },
  subtitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#555',
    marginBottom: SPACING.sm,
  },
  label: {
    fontWeight: '500',
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
    color: '#333',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    // marginTop: SPACING.md,
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
    backgroundColor: '#fff',
  },

  countBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 10,
  },

  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: '#F0FDF4',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },

  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48),
  },
  nextButton: {
    backgroundColor: '#007bff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48),
    maxWidth: moderateScale(130),

  },
  cancelText: {
    color: '#000',
    fontWeight: '500',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.md),
  },

  // section: {
  //   backgroundColor: '#fff',
  //   borderRadius: moderateScale(12),
  //   padding: SPACING.lg,
  //   marginBottom: SPACING.lg,
  //   borderWidth: 1,
  //   borderColor: '#E5E7EB',
  // },

  // sectionTitle: {
  //   fontSize: responsiveText(FONT_SIZE.lg),
  //   fontWeight: '600',
  //   color: '#1F2937',
  //   marginBottom: SPACING.md,
  // },

  detailRow: {
    marginBottom: SPACING.md,
  },

  detailLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },

  detailValue: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#111827',
    fontWeight: '500',
    backgroundColor: '#F9FAFB',
    padding: SPACING.sm,
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },

  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  disabledOption: {
    opacity: 0.8,
  },

  radioCircle: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },

  selectedCircle: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#3B82F6',
  },

  radioText: {
    color: '#1F2937',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
  },

  tagInputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(100),
    padding: SPACING.sm,
    backgroundColor: '#fff',
  },

  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.xs,
  },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: moderateScale(16),
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },

  tagText: {
    color: '#78350f',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },

  tagClose: {
    marginLeft: SPACING.xs,
    color: '#92400e',
    fontSize: responsiveText(14),
    fontWeight: 'bold',
  },

  tagTextInput: {
    flex: 1,
    minWidth: moderateScale(120),
    fontSize: responsiveText(FONT_SIZE.sm),
    padding: 0,
    color: '#111827',
  },

  suggestionsDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: moderateScale(8),
    marginTop: SPACING.xs,
    maxHeight: moderateScale(200),
    overflow: 'hidden',
    zIndex: 10,
    ...LAYOUT.shadow.sm,
  },

  suggestionItem: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  suggestionText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#374151',
  },
});
