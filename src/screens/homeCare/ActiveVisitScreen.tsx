import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  ShieldCheck,
  FileText,
  CheckCircle,
  KeyRound,
  Check,
  Activity,
} from 'lucide-react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {ProviderStackParamList} from '../../navigation/types';
import {
  stepFromExecution,
  VISIT_STEPS,
  VisitStep,
} from '../../utils/visitSteps';
import {useProviderDuty} from '../../context/ProviderDutyContext';
import {useProviderModal} from '../../context/ProviderModalContext';
import {Job} from '../../services/api';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';
import ProviderCard from '../../components/provider/ProviderCard';
import Toast from 'react-native-toast-message';
import {
  sendOtpToPatient,
  verifyPatientOtp,
  completeProviderAppointment,
} from '../../services/apiHelpers';

type RouteProps = RouteProp<ProviderStackParamList, 'ActiveVisit'>;
type Nav = NativeStackNavigationProp<ProviderStackParamList, 'ActiveVisit'>;

const STEPS = VISIT_STEPS;

function roleFromServiceType(serviceType: string): string {
  const type = serviceType.toLowerCase();
  if (type.includes('physio')) {
    return 'physio';
  }
  if (type.includes('nurse')) {
    return 'nurse';
  }
  if (type.includes('elderly') || type.includes('caregiver')) {
    return 'caregiver';
  }
  if (type.includes('sample')) {
    return 'sample';
  }
  if (type.includes('doctor')) {
    return 'doctor';
  }
  if (type.includes('cleaner') || type.includes('sanitizer')) {
    return 'cleaner';
  }
  return 'nurse';
}

export default function ActiveVisitScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const {refreshJobs, openPatientDetail} = useProviderDuty();
  const {
    showInvalidOtp,
    showCompleteVisit,
    showConfirm,
    showMarkArrived,
    showCancelActiveVisit,
    showSupportHotline,
  } = useProviderModal();
  const [job, setJob] = useState<Job | null>(null);
  const [step, setStep] = useState<VisitStep>('travel');
  const [otpInput, setOtpInput] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [careNotes, setCareNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic clinical role configurations & checklist state
  const [roleConfig, setRoleConfig] = useState<any>(null);
  const [checklistState, setChecklistState] = useState<Record<string, any>>({});

  const saveTempState = async (
    nextStep: VisitStep,
    notesCare: string,
    notesRx: string,
    chList: Record<string, any>,
  ) => {
    if (!route.params.jobId || !job) {
      return;
    }
    try {
      // Store temp state locally on the job object
      const updated = {
        ...job,
        visitDetails: {
          ...(job.visitDetails || {}),
          tempState: {
            currentStep: nextStep,
            careNotes: notesCare,
            rxNotes: notesRx,
            checklistResults: chList,
          },
        },
      };
      setJob(updated as any);
    } catch (e) {
      console.warn('Failed to save temp state', e);
    }
  };

  const loadJob = useCallback(async () => {
    setLoading(true);
    // Use jobs from context via refreshJobs
    await refreshJobs();
    setLoading(false);
  }, [refreshJobs]);

  // Find job from context
  const {jobs: contextJobs} = useProviderDuty();
  useEffect(() => {
    const found = contextJobs.find(j => j.id === route.params.jobId);
    if (found && !job) {
      setJob(found);
      const temp = found.visitDetails?.tempState;
      if (temp && temp.currentStep) {
        setStep(temp.currentStep);
        setCareNotes(temp.careNotes || '');
        setRxNotes(temp.rxNotes || '');
        setChecklistState(temp.checklistResults || {});
      } else {
        setStep(stepFromExecution(found.executionStatus));
        setCareNotes(found.visitDetails?.careNotes || '');
        setRxNotes(found.visitDetails?.prescription || '');
        setChecklistState(found.visitDetails?.checklistResults || {});
      }
    }
  }, [contextJobs, route.params.jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Initialize checklist structure dynamically based on provider service role type
  useEffect(() => {
    if (job) {
      const roleId = roleFromServiceType(job.serviceType);
      // Setup checklist fields based on parsed role
      if (roleId === 'nurse') {
        setRoleConfig({
          id: 'nurse',
          name: 'Home Care Nurse',
          specialActionDesc: 'Log patient vitals & confirm clinical checklist',
          checklistItems: [
            { id: 'reviewChronicIllnessHistory', type: 'checkbox', label: 'Review Chronic Illness History & past vitals' },
            { id: 'attendance', type: 'checkbox', label: 'Completed Wound Dressing / Bed Sore Care if needed' },
            { id: 'vitals', type: 'vitals', label: 'Log Patient Vitals' },
          ],
        });
      } else if (roleId === 'physio') {
        setRoleConfig({
          id: 'physio',
          name: 'Physiotherapist',
          specialActionDesc: 'Assess mobility & complete session items',
          checklistItems: [
            { id: 'painLevel', type: 'slider', label: 'Pre-session Pain Level' },
            { id: 'rangeOfMotion', type: 'checkbox', label: 'Assessed Range of Joint Motion' },
            { id: 'exerciseRoutine', type: 'checkbox', label: 'Completed Guided Exercise Routine' },
            { id: 'postPainLevel', type: 'slider', label: 'Post-session Pain Level' },
          ],
        });
      } else {
        // Default caregiver/other checklist
        setRoleConfig({
          id: 'caregiver',
          name: 'General Assistant',
          specialActionDesc: 'Record attendance & general assistance checkmarks',
          checklistItems: [
            { id: 'attendance', type: 'checkbox', label: 'Patient companionship & care log' },
            { id: 'hydration', type: 'checkbox', label: 'Assisted with hydration & nutritional intake' },
            { id: 'pills', type: 'checkbox', label: 'Verified oral medicine schedule adherence' },
          ],
        });
      }
    }
  }, [job]);

  const stepIndex = STEPS.indexOf(step);

  const openMaps = () => {
    if (!job?.location) {
      return;
    }
    const q = encodeURIComponent(job.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
  };

  const advanceExecution = async (
    jobId: string,
    next: Job['executionStatus'],
  ) => {
    if (!job) {
      return;
    }
    
    const updated = {
      ...job,
      executionStatus: next,
      status: next === 'in_progress' ? ('ongoing' as const) : job.status,
    };
    setJob(updated as any);
    const nextStep = stepFromExecution(updated.executionStatus);
    setStep(nextStep);
    await refreshJobs();
  };

  const handleStartNavigation = async () => {
    if (!job) {
      return;
    }
    openMaps();
    await advanceExecution(job.id, 'traveling');
  };

  const handleArrived = () => {
    if (!job) {
      return;
    }
    const jobId = job.id;
    showMarkArrived(job, async () => {
      try {
        await sendOtpToPatient({appointmentId: jobId}, job.patientId);
      } catch (e) {
        console.warn('Error sending OTP:', e);
      }
      await advanceExecution(jobId, 'arrived');
    });
  };

  const handleVerifyOtp = async () => {
    if (!job) {
      return;
    }
    try {
      await verifyPatientOtp({appointmentId: job.id, otp: otpInput.trim()});
      const updated = {
        ...job,
        executionStatus: 'in_progress' as const,
        status: 'ongoing' as const,
      };
      setJob(updated as any);
      const nextStep = stepFromExecution(updated.executionStatus);
      setStep(nextStep);
    } catch (e) {
      showInvalidOtp();
    }
  };

  const handleCompleteVisit = () => {
    if (!job) {
      return;
    }
    showCompleteVisit(job, async () => {
      setSubmitting(true);
      try {
        await completeProviderAppointment({
          appointmentId: job.id,
          clinicalChecklist: {
            reviewChronicIllnessHistory:
              checklistState.reviewChronicIllnessHistory ?? true,
            clinicalDiagnosisImpressions:
              checklistState.clinicalDiagnosisImpressions ?? careNotes,
            digitalRxNotes: rxNotes,
            generalClinicalNotes: careNotes,
            ...checklistState,
          },
          prescriptionHandoff: rxNotes,
        });

        await refreshJobs();
        const completed = {
          ...job,
          status: 'completed' as const,
          executionStatus: 'completed' as const,
          visitDetails: {
            careNotes,
            prescription: rxNotes,
            completedAt: new Date().toISOString(),
            checklistResults: checklistState,
          },
        };
        setJob(completed as any);
        navigation.navigate('ProviderTabs', {screen: 'Home'});
        setSubmitting(false);
      } catch (error) {
        console.error('Error completing visit:', error);
        showConfirm({
          title: 'Could not complete visit',
          message: 'Check your connection and try again.',
          confirmLabel: 'OK',
          icon: 'warning',
          onConfirm: () => {},
        });
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (loading || !job) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={PROVIDER_THEME.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={PROVIDER_THEME.bg} />
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <ArrowLeft color={PROVIDER_THEME.navy} size={moderateScale(22)} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Active visit</Text>
          <Text style={styles.topSub}>{job.patientName}</Text>
        </View>
        <TouchableOpacity onPress={showSupportHotline} style={styles.helpBtn}>
          <Text style={styles.helpBtnText}>Help</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stepRow}>
        <Text style={styles.stepBadge}>
          Step {stepIndex + 1} of {STEPS.length}
        </Text>
        {job.status !== 'completed' && job.status !== 'cancelled' ? (
          <TouchableOpacity
            onPress={() =>
              showCancelActiveVisit(job, () => navigation.goBack())
            }>
            <Text style={styles.cancelLink}>Cancel visit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.progressRow}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.progressDot,
              i <= stepIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProviderCard>
          <TouchableOpacity
            onPress={() => openPatientDetail(job.patientId)}
            style={styles.chartLink}>
            <Text style={styles.chartLinkText}>Open patient chart →</Text>
          </TouchableOpacity>
          <Text style={styles.service}>{job.serviceType}</Text>
          <View style={styles.locRow}>
            <MapPin color={PROVIDER_THEME.primary} size={moderateScale(16)} />
            <Text style={styles.locText}>{job.location}</Text>
          </View>
          <Text style={styles.payout}>Earning ₹{job.payout}</Text>
        </ProviderCard>

        {step === 'travel' && (
          <ProviderCard accent>
            <Navigation
              color={PROVIDER_THEME.primary}
              size={moderateScale(28)}
            />
            <Text style={styles.stepTitle}>Navigate to patient</Text>
            <Text style={styles.stepDesc}>
              Start navigation when you leave for the visit. Patient sees your
              ETA live.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartNavigation}>
              <Text style={styles.primaryBtnText}>Start navigation</Text>
            </TouchableOpacity>
          </ProviderCard>
        )}

        {step === 'arrived' && (
          <ProviderCard accent>
            <MapPin color={PROVIDER_THEME.primary} size={moderateScale(28)} />
            <Text style={styles.stepTitle}>Confirm arrival</Text>
            <Text style={styles.stepDesc}>
              Confirm you are at the patient address before starting care.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleArrived}>
              <Text style={styles.primaryBtnText}>I have arrived</Text>
            </TouchableOpacity>
          </ProviderCard>
        )}

        {step === 'otp' && (
          <ProviderCard accent>
            <KeyRound color={PROVIDER_THEME.primary} size={moderateScale(28)} />
            <Text style={styles.stepTitle}>Verify with patient OTP</Text>
            <Text style={styles.stepDesc}>
              Ask the patient for the 4-digit verification code.
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter OTP"
              placeholderTextColor={PROVIDER_THEME.textSoft}
            />
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleVerifyOtp}>
              <Text style={styles.primaryBtnText}>Verify & start visit</Text>
            </TouchableOpacity>
          </ProviderCard>
        )}

        {step === 'care' && (
          <ProviderCard accent>
            <ShieldCheck
              color={PROVIDER_THEME.primary}
              size={moderateScale(28)}
            />
            <Text style={styles.stepTitle}>
              {roleConfig?.name || 'Clinical'} Checklist
            </Text>
            <Text style={styles.stepDesc}>
              {roleConfig?.specialActionDesc ||
                'Complete care items and record notes.'}
            </Text>

            {/* Dynamic Checklist Widgets */}
            {roleConfig?.checklistItems &&
            roleConfig.checklistItems.length > 0 ? (
              <View style={styles.checklistWrapper}>
                {roleConfig.checklistItems.map((item: any) => {
                  if (item.type === 'checkbox') {
                    const isChecked = !!checklistState[item.id];
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.checkRow,
                          isChecked && styles.checkRowActive,
                        ]}
                        onPress={() => {
                          const nextState = {
                            ...checklistState,
                            [item.id]: !isChecked,
                          };
                          setChecklistState(nextState);
                          saveTempState(step, careNotes, rxNotes, nextState);
                        }}>
                        <View
                          style={[
                            styles.checkboxBox,
                            isChecked && styles.checkboxBoxActive,
                          ]}>
                          {isChecked && (
                            <Check color="#FFF" size={10} strokeWidth={3} />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.checkLabel,
                            isChecked && styles.checkLabelActive,
                          ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  if (item.type === 'slider') {
                    const val = checklistState[item.id] ?? 5;
                    return (
                      <View key={item.id} style={styles.widgetCard}>
                        <Text style={styles.widgetLabel}>
                          {item.label}:{' '}
                          <Text style={styles.widgetBoldText}>{val}/10</Text>
                        </Text>
                        <View style={styles.sliderNumbersRow}>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                            const isSelected = val === num;
                            return (
                              <TouchableOpacity
                                key={num}
                                style={[
                                  styles.sliderNumberBtn,
                                  isSelected && styles.sliderNumberBtnActive,
                                ]}
                                onPress={() => {
                                  const nextState = {
                                    ...checklistState,
                                    [item.id]: num,
                                  };
                                  setChecklistState(nextState);
                                  saveTempState(
                                    step,
                                    careNotes,
                                    rxNotes,
                                    nextState,
                                  );
                                }}>
                                <Text
                                  style={[
                                    styles.sliderNumberText,
                                    isSelected && styles.sliderNumberTextActive,
                                  ]}>
                                  {num}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  }

                  if (item.type === 'vitals') {
                    const bpSys = checklistState.vital_bp_sys ?? '';
                    const bpDia = checklistState.vital_bp_dia ?? '';
                    const hr = checklistState.vital_hr ?? '';
                    const spo2 = checklistState.vital_spo2 ?? '';
                    const temp = checklistState.vital_temp ?? '';
                    const glucose = checklistState.vital_glucose ?? '';

                    return (
                      <View key={item.id} style={styles.widgetCard}>
                        <View style={styles.widgetHeader}>
                          <Activity color={PROVIDER_THEME.teal} size={18} />
                          <Text style={styles.widgetTitle}>{item.label}</Text>
                        </View>
                        <View style={styles.vitalsGrid}>
                          <View style={styles.vitalInputGroup}>
                            <Text style={styles.vitalFieldLabel}>
                              Blood Pressure (mmHg)
                            </Text>
                            <View style={styles.bpRow}>
                              <TextInput
                                style={[styles.vitalInput, {flex: 1}]}
                                placeholder="Sys"
                                placeholderTextColor={PROVIDER_THEME.textSoft}
                                keyboardType="number-pad"
                                value={bpSys}
                                onChangeText={txt => {
                                  const nextState = {
                                    ...checklistState,
                                    vital_bp_sys: txt,
                                  };
                                  setChecklistState(nextState);
                                  saveTempState(
                                    step,
                                    careNotes,
                                    rxNotes,
                                    nextState,
                                  );
                                }}
                              />
                              <Text style={styles.slash}>/</Text>
                              <TextInput
                                style={[styles.vitalInput, {flex: 1}]}
                                placeholder="Dia"
                                placeholderTextColor={PROVIDER_THEME.textSoft}
                                keyboardType="number-pad"
                                value={bpDia}
                                onChangeText={txt => {
                                  const nextState = {
                                    ...checklistState,
                                    vital_bp_dia: txt,
                                  };
                                  setChecklistState(nextState);
                                  saveTempState(
                                    step,
                                    careNotes,
                                    rxNotes,
                                    nextState,
                                  );
                                }}
                              />
                            </View>
                          </View>

                          <View style={styles.vitalInputGroup}>
                            <Text style={styles.vitalFieldLabel}>
                              Pulse Rate (bpm)
                            </Text>
                            <TextInput
                              style={styles.vitalInput}
                              placeholder="e.g. 72"
                              placeholderTextColor={PROVIDER_THEME.textSoft}
                              keyboardType="number-pad"
                              value={hr}
                              onChangeText={txt => {
                                const nextState = {
                                  ...checklistState,
                                  vital_hr: txt,
                                };
                                setChecklistState(nextState);
                                saveTempState(
                                  step,
                                  careNotes,
                                  rxNotes,
                                  nextState,
                                );
                              }}
                            />
                          </View>

                          <View style={styles.vitalInputGroup}>
                            <Text style={styles.vitalFieldLabel}>SpO2 (%)</Text>
                            <TextInput
                              style={styles.vitalInput}
                              placeholder="e.g. 98"
                              placeholderTextColor={PROVIDER_THEME.textSoft}
                              keyboardType="number-pad"
                              value={spo2}
                              onChangeText={txt => {
                                const nextState = {
                                  ...checklistState,
                                  vital_spo2: txt,
                                };
                                setChecklistState(nextState);
                                saveTempState(
                                  step,
                                  careNotes,
                                  rxNotes,
                                  nextState,
                                );
                              }}
                            />
                          </View>

                          <View style={styles.vitalInputGroup}>
                            <Text style={styles.vitalFieldLabel}>
                              Temp (°F)
                            </Text>
                            <TextInput
                              style={styles.vitalInput}
                              placeholder="e.g. 98.6"
                              placeholderTextColor={PROVIDER_THEME.textSoft}
                              keyboardType="numeric"
                              value={temp}
                              onChangeText={txt => {
                                const nextState = {
                                  ...checklistState,
                                  vital_temp: txt,
                                };
                                setChecklistState(nextState);
                                saveTempState(
                                  step,
                                  careNotes,
                                  rxNotes,
                                  nextState,
                                );
                              }}
                            />
                          </View>

                          <View style={styles.vitalInputGroup}>
                            <Text style={styles.vitalFieldLabel}>
                              Blood Glucose (mg/dL)
                            </Text>
                            <TextInput
                              style={styles.vitalInput}
                              placeholder="e.g. 110"
                              placeholderTextColor={PROVIDER_THEME.textSoft}
                              keyboardType="number-pad"
                              value={glucose}
                              onChangeText={txt => {
                                const nextState = {
                                  ...checklistState,
                                  vital_glucose: txt,
                                };
                                setChecklistState(nextState);
                                saveTempState(
                                  step,
                                  careNotes,
                                  rxNotes,
                                  nextState,
                                );
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  }

                  if (item.type === 'input') {
                    const val = checklistState[item.id] ?? '';
                    return (
                      <View key={item.id} style={styles.widgetCard}>
                        <Text style={styles.widgetLabel}>{item.label}</Text>
                        <TextInput
                           style={styles.widgetTextInput}
                          placeholder={item.placeholder || 'Enter details...'}
                          placeholderTextColor={PROVIDER_THEME.textSoft}
                          multiline
                          value={val}
                          onChangeText={txt => {
                            const nextState = {
                              ...checklistState,
                              [item.id]: txt,
                            };
                            setChecklistState(nextState);
                            saveTempState(step, careNotes, rxNotes, nextState);
                          }}
                        />
                      </View>
                    );
                  }

                  return null;
                })}
              </View>
            ) : null}

            {/* General notes input */}
            <Text style={[styles.widgetLabel, {marginTop: moderateScale(12)}]}>
              General Clinical Notes
            </Text>
            <TextInput
              style={styles.notesInput}
              value={careNotes}
              onChangeText={txt => {
                setCareNotes(txt);
                saveTempState(step, txt, rxNotes, checklistState);
              }}
              multiline
              placeholder="Record visit notes, clinical summary, and general observations..."
              placeholderTextColor={PROVIDER_THEME.textSoft}
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={async () => {
                // Checklist validation warnings
                if (
                  roleConfig?.id === 'nurse' &&
                  (!checklistState.vital_bp_sys ||
                    !checklistState.vital_bp_dia ||
                    !checklistState.vital_hr ||
                    !checklistState.vital_spo2)
                ) {
                  Toast.show({
                    type: 'info',
                    text1: 'Log patient vitals',
                    text2: 'Please log BP, Pulse and SpO2 before proceeding.',
                  });
                  return;
                }
                if (
                  roleConfig?.id === 'caregiver' &&
                  (!checklistState.attendance ||
                    !checklistState.hydration ||
                    !checklistState.pills)
                ) {
                  Toast.show({
                    type: 'info',
                    text1: 'Checklist incomplete',
                    text2:
                      'Please verify attendance, hydration, and pills before continuing.',
                  });
                  return;
                }

                await saveTempState('rx', careNotes, rxNotes, checklistState);
                setStep('rx');
              }}>
              <Text style={styles.primaryBtnText}>
                Continue to prescription
              </Text>
            </TouchableOpacity>
          </ProviderCard>
        )}

        {step === 'rx' && (
          <ProviderCard accent>
            <FileText color={PROVIDER_THEME.primary} size={moderateScale(28)} />
            <Text style={styles.stepTitle}>Prescription & handoff</Text>
            <Text style={styles.stepDesc}>
              Send medicines or care plan instructions to the patient app.
            </Text>
            <TextInput
              style={styles.notesInput}
              value={rxNotes}
              onChangeText={txt => {
                setRxNotes(txt);
                saveTempState(step, careNotes, txt, checklistState);
              }}
              multiline
              placeholder="e.g. Tab Paracetamol 500mg BD x 5 days"
              placeholderTextColor={PROVIDER_THEME.textSoft}
            />
            <View style={styles.actionRowContainer}>
              <TouchableOpacity
                style={styles.stepBackBtn}
                onPress={async () => {
                  await saveTempState(
                    'care',
                    careNotes,
                    rxNotes,
                    checklistState,
                  );
                  setStep('care');
                }}>
                <Text style={styles.stepBackBtnText}>← Back to checklist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  {flex: 1.2},
                  submitting && styles.disabled,
                ]}
                onPress={handleCompleteVisit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <View style={styles.progressRowInline}>
                    <CheckCircle color="#FFF" size={moderateScale(18)} />
                    <Text style={styles.primaryBtnText}>Complete visit</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ProviderCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: PROVIDER_THEME.bg},
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PROVIDER_THEME.bg,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(12),
  },
  backBtn: {padding: moderateScale(8)},
  topCenter: {flex: 1, alignItems: 'center'},
  topTitle: {
    color: PROVIDER_THEME.navy,
    fontWeight: '800',
    fontSize: moderateScale(16),
  },
  topSub: {color: PROVIDER_THEME.textMuted, fontSize: moderateScale(12)},
  helpBtn: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
  },
  helpBtnText: {
    color: PROVIDER_THEME.navy,
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
    paddingBottom: moderateScale(8),
    backgroundColor: PROVIDER_THEME.bg,
  },
  stepBadge: {
    color: PROVIDER_THEME.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  cancelLink: {
    color: PROVIDER_THEME.coral,
    fontWeight: '700',
    fontSize: moderateScale(12),
  },
  progressRow: {
    flexDirection: 'row',
    gap: moderateScale(6),
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    backgroundColor: PROVIDER_THEME.bg,
  },
  progressDot: {
    flex: 1,
    height: moderateScale(4),
    borderRadius: 2,
    backgroundColor: PROVIDER_THEME.mintDeep,
  },
  progressDotActive: {backgroundColor: PROVIDER_THEME.navy},
  scroll: {padding: moderateScale(16), paddingBottom: moderateScale(40)},
  chartLink: {marginBottom: moderateScale(8)},
  chartLinkText: {
    fontSize: moderateScale(12),
    fontWeight: '800',
    color: PROVIDER_THEME.teal,
  },
  service: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.primary,
  },
  locRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginTop: moderateScale(8),
  },
  locText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    lineHeight: moderateScale(20),
  },
  payout: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  stepTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    marginTop: moderateScale(12),
  },
  stepDesc: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(8),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(16),
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.primary,
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(14),
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: moderateScale(15),
  },
  disabled: {opacity: 0.7},
  otpInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: moderateScale(22),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(14),
    backgroundColor: '#F8FAFC',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    minHeight: moderateScale(100),
    textAlignVertical: 'top',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(14),
    backgroundColor: '#F8FAFC',
  },
  checklistWrapper: {
    marginTop: moderateScale(10),
    marginBottom: moderateScale(6),
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: PROVIDER_THEME.pearl,
    marginBottom: moderateScale(8),
    gap: moderateScale(10),
  },
  checkRowActive: {
    borderColor: 'rgba(13, 148, 136, 0.3)',
    backgroundColor: 'rgba(13, 148, 136, 0.04)',
  },
  checkboxBox: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(4),
    borderWidth: 1.5,
    borderColor: PROVIDER_THEME.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  checkboxBoxActive: {
    borderColor: PROVIDER_THEME.teal,
    backgroundColor: PROVIDER_THEME.teal,
  },
  checkLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: PROVIDER_THEME.navy,
    flex: 1,
  },
  checkLabelActive: {
    // color: PROVIDER_THEME.tealDeep,
  },
  widgetCard: {
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: PROVIDER_THEME.pearl,
    marginBottom: moderateScale(10),
  },
  widgetLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
    marginBottom: moderateScale(8),
  },
  widgetBoldText: {
    fontWeight: '800',
    color: PROVIDER_THEME.teal,
  },
  sliderNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(6),
    gap: moderateScale(4),
  },
  sliderNumberBtn: {
    flex: 1,
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderNumberBtnActive: {
    borderColor: PROVIDER_THEME.primary,
    backgroundColor: PROVIDER_THEME.primary,
  },
  sliderNumberText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  sliderNumberTextActive: {
    color: '#FFF',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginBottom: moderateScale(12),
  },
  widgetTitle: {
    fontSize: moderateScale(13),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  vitalsGrid: {
    gap: moderateScale(10),
  },
  vitalInputGroup: {
    gap: moderateScale(4),
  },
  vitalFieldLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
  },
  vitalInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: PROVIDER_THEME.navy,
    backgroundColor: '#FFF',
  },
  slash: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: PROVIDER_THEME.textSoft,
  },
  widgetTextInput: {
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    minHeight: moderateScale(70),
    textAlignVertical: 'top',
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    backgroundColor: '#FFF',
  },
  progressRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
  },
  actionRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(10),
    marginTop: moderateScale(8),
  },
  stepBackBtn: {
    flex: 1,
    height: moderateScale(48),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    backgroundColor: PROVIDER_THEME.pearl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBackBtnText: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
  },
});
