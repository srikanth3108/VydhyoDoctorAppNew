import React from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import moment from 'moment';

import {
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  responsiveText,
  verticalScale,
  scale,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';

// ─── helpers ────────────────────────────────────────────────────────────────

const normalizeValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    const joined = value.join(', ').trim();
    if (!joined || /^(n\/a|na)$/i.test(joined)) return '';
    return joined;
  }
  const str = String(value).trim();
  if (!str || /^(n\/a|na)$/i.test(str)) return '';
  if (!str.replace(/[\/\-]/g, '').trim()) return '';
  return str;
};

const displayWithUnit = (value: any, unit = '') => {
  const clean = normalizeValue(value);
  if (!clean) return '';
  return unit ? `${clean} ${unit}` : clean;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

// ─── sub-components ─────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: string }) => (
  <Text style={styles.sectionLabel}>{children}</Text>
);

const ProseBlock = ({ text }: { text: string }) => (
  <View style={styles.proseBlock}>
    <Text style={styles.proseText}>{text}</Text>
  </View>
);

const InfoGrid = ({
  items,
}: {
  items: { label: string; value: string }[];
}) => (
  <View style={styles.infoGrid}>
    {items.map(({ label, value }) =>
      value ? (
        <View key={label} style={styles.infoCell}>
          <Text style={styles.infoCellLabel}>{label}</Text>
          <Text style={styles.infoCellValue}>{value}</Text>
        </View>
      ) : null,
    )}
  </View>
);

interface VitalChipProps {
  label: string;
  value: string;
  accentBg: string;
  accentText: string;
  icon: string;
}
const VitalChip = ({ label, value, accentBg, accentText, icon }: VitalChipProps) => {
  if (!value) return null;
  return (
    <View style={styles.vitalChip}>
      <View style={[styles.vitalIconBox, { backgroundColor: accentBg }]}>
        <Text style={[styles.vitalIconText, { color: accentText }]}>{icon}</Text>
      </View>
      <View>
        <Text style={styles.vitalLabel}>{label}</Text>
        <Text style={styles.vitalValue}>{value}</Text>
      </View>
    </View>
  );
};

const CountBadge = ({ count }: { count: number }) => (
  <View style={styles.countBadge}>
    <Text style={styles.countBadgeText}>{count}</Text>
  </View>
);

// ─── main component ─────────────────────────────────────────────────────────

const PreviousPrescription = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { prescriptions, patientName } = route.params || {};

  const displayPatientName = normalizeValue(patientName);

  // ── medications ──────────────────────────────────────────────────────────

  const renderMedications = (medications: any[]) => {
    const cleaned = (medications || []).filter((m) => {
      return (
        normalizeValue(m.medName) ||
        normalizeValue(m.medicineType) ||
        normalizeValue(m.dosage) ||
        normalizeValue(m.duration) ||
        normalizeValue(m.frequency) ||
        normalizeValue(m.timings) ||
        normalizeValue(m.quantity)
      );
    });
    if (!cleaned.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <SectionLabel>Medications</SectionLabel>
          <CountBadge count={cleaned.length} />
        </View>
        {cleaned.map((med, i) => {
          const name     = normalizeValue(med.medName);
          const type     = normalizeValue(med.medicineType);
          const dosage   = normalizeValue(med.dosage);
          const duration = normalizeValue(med.duration);
          const freq     = normalizeValue(med.frequency);
          const timings  = normalizeValue(med.timings);
          const qty      = normalizeValue(med.quantity);

          return (
            <View key={i} style={styles.medCard}>
              {/* header */}
              <View style={styles.medCardHeader}>
                <Text style={styles.medName} numberOfLines={1}>
                  {name || 'Unknown'}
                </Text>
                {type ? (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{type}</Text>
                  </View>
                ) : null}
              </View>
              {/* details grid */}
              <View style={styles.medDetails}>
                {dosage   ? <View style={styles.medDetailItem}><Text style={styles.medDetailLabel}>Dosage</Text><Text style={styles.medDetailValue}>{dosage}</Text></View> : null}
                {duration ? <View style={styles.medDetailItem}><Text style={styles.medDetailLabel}>Duration</Text><Text style={styles.medDetailValue}>{duration} days</Text></View> : null}
                {freq     ? <View style={styles.medDetailItem}><Text style={styles.medDetailLabel}>Frequency</Text><Text style={styles.medDetailValue}>{freq}</Text></View> : null}
                {qty      ? <View style={styles.medDetailItem}><Text style={styles.medDetailLabel}>Quantity</Text><Text style={styles.medDetailValue}>{qty}</Text></View> : null}
                {timings  ? <View style={styles.medDetailItem2}><Text style={styles.medDetailLabel}>Timings</Text><Text style={styles.medDetailValue}>{timings}</Text></View> : null}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ── tests ────────────────────────────────────────────────────────────────

  const renderTests = (tests: any[]) => {
    const valid = (tests || []).filter((t) => normalizeValue(t?.testName));
    if (!valid.length) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <SectionLabel>Recommended Tests</SectionLabel>
          <CountBadge count={valid.length} />
        </View>
        {valid.map((t, i) => (
          <View key={i} style={styles.testItem}>
            <View style={styles.testDot} />
            <Text style={styles.testText}>{normalizeValue(t.testName)}</Text>
          </View>
        ))}
      </View>
    );
  };

  // ── prescription card ────────────────────────────────────────────────────

  const renderPrescription = ({ item: rx }: any) => {
    const pi  = rx.patientInfo || {};
    const v   = rx.vitals || {};
    const d   = rx.diagnosis || {};
    const a   = rx.advice || {};

    const name    = normalizeValue(pi.patientName);
    const age     = normalizeValue(pi.age);
    const gender  = normalizeValue(pi.gender);
    const mobile  = normalizeValue(pi.mobileNumber);

    const cc  = normalizeValue(pi.chiefComplaint);
    const pmh = normalizeValue(pi.pastMedicalHistory);
    const fmh = normalizeValue(pi.familyMedicalHistory);
    const pe  = normalizeValue(pi.physicalExamination);

    const diagNote = normalizeValue(d.diagnosisNote);
    const advNote  = normalizeValue(a.advice);
    const genNote  = normalizeValue(a.PrescribeMedNotes);

    const bp     = displayWithUnit(v.bp, 'mmHg');
    const pulse  = displayWithUnit(v.pulseRate, 'bpm');
    const temp   = displayWithUnit(v.temperature, '°F');
    const spo2   = displayWithUnit(v.spo2, '%');
    const resp   = displayWithUnit(v.respiratoryRate, 'br/min');
    const height = displayWithUnit(v.height, 'cm');
    const weight = displayWithUnit(v.weight, 'kg');
    const bmi    = displayWithUnit(v.bmi, 'kg/m²');

    const hasPatient  = name || age || gender || mobile;
    const hasClinical = cc || pmh || fmh || pe;
    const hasVitals   = bp || pulse || temp || spo2 || resp || height || weight || bmi;
    const apptId      = normalizeValue(rx.appointmentId);

    return (
      <View style={styles.card}>

        {/* ── card header ── */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rxId}>🗒 {rx.prescriptionId}</Text>
            <Text style={styles.rxDate}>
              {moment(rx.createdAt).format('Do MMMM YYYY, h:mm a')}
            </Text>
          </View>
          {apptId ? (
            <View style={styles.apptBadge}>
              <Text style={styles.apptBadgeText}>{apptId}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardBody}>

          {/* ── patient info ── */}
          {hasPatient ? (
            <View style={styles.section}>
              <SectionLabel>Patient Information</SectionLabel>
              <InfoGrid
                items={[
                  { label: 'Name',   value: name },
                  { label: 'Age',    value: age ? `${age} yrs` : '' },
                  { label: 'Gender', value: gender },
                  { label: 'Mobile', value: mobile },
                ]}
              />
            </View>
          ) : null}

          {/* ── clinical notes ── */}
          {hasClinical ? (
            <View style={styles.section}>
              <SectionLabel>Clinical Notes</SectionLabel>
              {cc  ? (<><Text style={styles.subLabel}>Chief Complaint</Text><ProseBlock text={cc} /></>) : null}
              {pmh ? (<><Text style={[styles.subLabel, { marginTop: 6 }]}>Past Medical History</Text><ProseBlock text={pmh} /></>) : null}
              {fmh ? (<><Text style={[styles.subLabel, { marginTop: 6 }]}>Family History</Text><ProseBlock text={fmh} /></>) : null}
              {pe  ? (<><Text style={[styles.subLabel, { marginTop: 6 }]}>Physical Examination</Text><ProseBlock text={pe} /></>) : null}
            </View>
          ) : null}

          {/* ── vitals ── */}
          {hasVitals ? (
            <View style={styles.section}>
              <SectionLabel>Vitals</SectionLabel>
              <View style={styles.vitalsGrid}>
                <VitalChip label="Blood Pressure" value={bp}     accentBg="#FCEBEB" accentText="#A32D2D" icon="❤️" />
                <VitalChip label="Pulse Rate"     value={pulse}  accentBg="#FBEAF0" accentText="#993556" icon="💗" />
                <VitalChip label="Temperature"    value={temp}   accentBg="#FAEEDA" accentText="#854F0B" icon="🌡" />
                <VitalChip label="SpO₂"           value={spo2}   accentBg="#EAF3DE" accentText="#3B6D11" icon="🫁" />
                <VitalChip label="Resp. Rate"     value={resp}   accentBg="#E6F1FB" accentText="#185FA5" icon="🌬" />
                <VitalChip label="Height"         value={height} accentBg="#EEEDFE" accentText="#534AB7" icon="📏" />
                <VitalChip label="Weight"         value={weight} accentBg="#E1F5EE" accentText="#0F6E56" icon="⚖️" />
                <VitalChip label="BMI"            value={bmi}    accentBg="#FAECE7" accentText="#993C1D" icon="📊" />
              </View>
            </View>
          ) : null}

          {/* ── diagnosis ── */}
          {diagNote ? (
            <View style={styles.section}>
              <SectionLabel>Diagnosis</SectionLabel>
              <ProseBlock text={diagNote} />
            </View>
          ) : null}

          {/* ── tests ── */}
          {d.selectedTests?.length > 0 && renderTests(d.selectedTests)}

          {/* ── medications ── */}
          {d.medications?.length > 0 && renderMedications(d.medications)}

          {/* ── advice ── */}
          {advNote ? (
            <View style={styles.section}>
              <SectionLabel>Advice</SectionLabel>
              <ProseBlock text={advNote} />
            </View>
          ) : null}

          {/* ── general note ── */}
          {genNote ? (
            <View style={styles.section}>
              <SectionLabel>General Note</SectionLabel>
              <ProseBlock text={genNote} />
            </View>
          ) : null}

          {/* ── follow-up ── */}
          {a.followUpDate ? (
            <View style={styles.section}>
              <SectionLabel>Follow-up Date</SectionLabel>
              <View style={styles.followUpChip}>
                <Text style={styles.followUpIcon}>📅</Text>
                <Text style={styles.followUpText}>
                  {moment(a.followUpDate).format('Do MMMM YYYY')}
                </Text>
              </View>
            </View>
          ) : null}

        </View>
      </View>
    );
  };

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <>
      <CommonHeader title="Previous Prescriptions" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* patient banner */}
          {displayPatientName ? (
            <View style={styles.patientBanner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(displayPatientName)}
                </Text>
              </View>
              <View>
                <Text style={styles.patientName}>{displayPatientName}</Text>
                <Text style={styles.patientSub}>
                  {prescriptions?.length ?? 0} prescription
                  {prescriptions?.length !== 1 ? 's' : ''} on record
                </Text>
              </View>
            </View>
          ) : null}

          {prescriptions?.length > 0 ? (
            <FlatList
              data={prescriptions}
              renderItem={renderPrescription}
              keyExtractor={(item: any) => item._id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.noDataCard}>
              <Text style={styles.noDataIcon}>📋</Text>
              <Text style={styles.noDataTitle}>No Prescriptions Found</Text>
              <Text style={styles.noDataText}>
                No previous prescriptions found for this patient.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // ── patient banner ──────────────────────────────────────────────────────
  patientBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    marginBottom: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  patientSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // ── prescription card ───────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  rxId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rxDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },
  apptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 0.5,
    borderColor: '#BFDBFE',
  },
  apptBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1D4ED8',
  },
  cardBody: {
    padding: 14,
    gap: 14,
  },

  // ── section ─────────────────────────────────────────────────────────────
  section: {
    gap: 8,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: 2,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  proseBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  proseText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },

  // ── info grid ────────────────────────────────────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCell: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  infoCellLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 3,
  },
  infoCellValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },

  // ── vitals ───────────────────────────────────────────────────────────────
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  vitalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalIconText: {
    fontSize: 15,
  },
  vitalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },

  // ── medications ──────────────────────────────────────────────────────────
  medCard: {
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  medCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  medName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  typeBadge: {
    backgroundColor: '#F0EDFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6D28D9',
  },
  medDetails: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  medDetailItem: {
    width: '47%',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'baseline',
  },
    medDetailItem2: {
    width: '75%',
    flexDirection: 'row',
    gap: 4,
    alignItems: 'baseline',
  },
  medDetailLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  medDetailValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },

  // ── tests ────────────────────────────────────────────────────────────────
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  testDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: '#2563EB',
  },
  testText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },

  // ── count badge ──────────────────────────────────────────────────────────
  countBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },

  // ── follow-up ────────────────────────────────────────────────────────────
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#BBF7D0',
    alignSelf: 'flex-start',
  },
  followUpIcon: {
    fontSize: 15,
  },
  followUpText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#15803D',
  },

  // ── no data ──────────────────────────────────────────────────────────────
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  noDataIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  noDataTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  noDataText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default PreviousPrescription;