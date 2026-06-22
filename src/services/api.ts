/**
 * Vydhyo Homecare - Mock API Integration Service
 * Simulates asynchronous network requests with realistic delay and robust dummy data fallbacks.
 * Includes data-driven role configuration registry for fully dynamic dashboards and checklists.
 */

export interface PatientReport {
  name: string;
  url: string;
}

export interface PatientVitals {
  bp?: string;
  heartRate?: string;
  spo2?: string;
  glucose?: string;
  temperature?: string;
  recordedAt?: string;
}

export interface PatientVisitRecord {
  jobId: string;
  date: string;
  serviceType: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  summary?: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup?: string;
  conditions: string[];
  allergies: string[];
  emergencyContact: string;
  address: string;
  vitals: PatientVitals;
  visitHistory: PatientVisitRecord[];
  /** Unlocked after provider completes first in-home visit for this patient */
  firstHomeVisitCompleted: boolean;
  liveStatus?: 'stable' | 'monitoring' | 'critical';
}

export interface Job {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  serviceType: string;
  description: string;
  location: string;
  dateTime: string;
  duration: string;
  payout: number;
  reports: PatientReport[];
  status: 'new' | 'accepted' | 'ongoing' | 'completed' | 'rejected' | 'cancelled';
  cancellationReason?: string;
  rejectionReason?: string;
  otpCode: string;
  executionStatus?: 'not_started' | 'traveling' | 'arrived' | 'otp_verified' | 'in_progress' | 'completed';
  visitDetails?: any;
  /** Follow-up bookings may allow telehealth after first home visit */
  visitNumber?: number;
}

export function patientIdFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export interface EarningsData {
  totalEarnings: number;
  settled: number;
  deductions: number;
  unsettled: number;
  weeklyHistory: { day: string; amount: number }[];
  settlementHistory: {
    id: string;
    date: string;
    /** Epoch ms for date filtering; omit for non-dated pending rows */
    dateMs?: number;
    amount: number;
    status: 'Settled' | 'Pending';
  }[];
}

export interface RoleMetric {
  label: string;
  value: string;
  iconName: 'trending' | 'briefcase' | 'activity' | 'shield' | 'dollar';
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'checkbox' | 'slider' | 'vitals' | 'input' | 'barcode' | 'upload' | 'panic';
  placeholder?: string;
  options?: string[];
  defaultValue?: any;
}

export interface RoleDashboardConfig {
  id: string;
  name: string;
  specialtyTitle: string;
  licenseTitle: string;
  metrics: RoleMetric[];
  alert: string;
  alertType: 'warning' | 'critical' | 'info';
  specialActionTitle: string;
  specialActionDesc: string;
  checklistItems: ChecklistItem[];
}

// Data-driven centralized Role Configuration Registry
// const ROLE_CONFIGS: Record<string, RoleDashboardConfig> = {
//   doctor: {
//     id: 'doctor',
//     name: 'Doctor Consultant',
//     specialtyTitle: 'MD / Cardiology General Consultant',
//     licenseTitle: 'Medical Board Practice License: Active',
//     metrics: [
//       { label: 'Consultations Done', value: '14 Sessions', iconName: 'trending' },
//       { label: 'Clinical OPD Hours', value: '48 Hours', iconName: 'briefcase' },
//       { label: 'Diagnosis Rating', value: '99.4%', iconName: 'activity' }
//     ],
//     alert: 'CRITICAL ALERT: Patient Savitri Devi uploaded an ECG file indicating minor tachycardic spikes. Review before visit.',
//     alertType: 'critical',
//     specialActionTitle: 'Launch E-Prescription Desk',
//     specialActionDesc: 'Authorize digital prescriptions directly matching national health framework policies.',
//     checklistItems: [
//       { id: 'history', label: 'Review Chronic Illness History', type: 'checkbox' },
//       { id: 'diagnosis', label: 'Enter Clinical Diagnosis Impressions', type: 'input', placeholder: 'e.g. Chronic mild fatigue, lung fields clear. Metformin dosage adjusted.' },
//       { id: 'prescription', label: 'Digital Rx / Prescription Notes', type: 'input', placeholder: 'e.g. Rx: Tab Metformin 500mg BD x 30 days.' }
//     ]
//   },
//   nurse: {
//     id: 'nurse',
//     name: 'Registered Nurse',
//     specialtyTitle: 'GNM / Intensive Care Nursing Officer',
//     licenseTitle: 'Nursing Council Registration License: Active',
//     metrics: [
//       { label: 'Visits Conducted', value: '28 Dressings', iconName: 'trending' },
//       { label: 'Bedside Care Hours', value: '72 Hours', iconName: 'briefcase' },
//       { label: 'Vital Logs Filed', value: '112 Forms', iconName: 'activity' }
//     ],
//     alert: 'Notice: High daily blood glucose spike (220 mg/dL) reported for Savitri Devi. Dressing change scheduled at 02:00 PM.',
//     alertType: 'warning',
//     specialActionTitle: 'Vitals Compliance Board',
//     specialActionDesc: 'Verify BP, Heart Rate, and Sterile Wound Dressings coordinates for recovery.',
//     checklistItems: [
//       { id: 'vitals', label: 'Log Patient Vital Signs', type: 'vitals' },
//       { id: 'dressing', label: 'Renew Sterile Wound Dressing Site', type: 'checkbox' },
//       { id: 'infusion', label: 'Verify IV Infusion / Med Line Status', type: 'checkbox' },
//       { id: 'wound_photo', label: 'Upload Wound Dressing Site Photo', type: 'upload' },
//       { id: 'notes', label: 'Medication Logs / Notes', type: 'input', placeholder: 'e.g. Wound margins clean, no erythema or active drainage noted.' }
//     ]
//   },
//   physio: {
//     id: 'physio',
//     name: 'Physiotherapist',
//     specialtyTitle: 'BPT / Orthopedic Rehabilitation Expert',
//     licenseTitle: 'Physiotherapy Board Accreditation: Certified',
//     metrics: [
//       { label: 'Rehabs Completed', value: '19 Visits', iconName: 'trending' },
//       { label: 'Therapy Sessions', value: '38 Hours', iconName: 'briefcase' },
//       { label: 'Mobility Recovery Score', value: '92%', iconName: 'activity' }
//     ],
//     alert: 'Notification: Arjun Mehta reported joint soreness level 8/10 post active gait routines. Adjust stretching reps.',
//     alertType: 'warning',
//     specialActionTitle: 'Active ROM Progress Tracker',
//     specialActionDesc: 'Log joint degrees extension and resistance training thresholds.',
//     checklistItems: [
//       { id: 'pain', label: 'Patient Reported Pain Index', type: 'slider', defaultValue: 5 },
//       { id: 'active_rom', label: 'Perform Joint Extension Rotations', type: 'checkbox' },
//       { id: 'gait', label: 'Conduct Guided Balance Walks', type: 'checkbox' },
//       { id: 'physio_photo', label: 'Attach Exercise Progress Photo', type: 'upload' },
//       { id: 'physio_notes', label: 'Physiotherapy Session Logs', type: 'input', placeholder: 'e.g. Patient showed 15% range extension, minor fatigue in shoulder.' }
//     ]
//   },
//   elderly: {
//     id: 'elderly',
//     name: 'Elderly Caregiver',
//     specialtyTitle: 'Senior Care Professional Companion',
//     licenseTitle: 'Geriatric Care Association Membership: Verified',
//     metrics: [
//       { label: 'Shifts Conducted', value: '42 Shifts', iconName: 'trending' },
//       { label: 'Geriatric Assist Hours', value: '168 Hours', iconName: 'briefcase' },
//       { label: 'Incident-Free Score', value: '100%', iconName: 'activity' }
//     ],
//     alert: 'Reminder: Ensure Ramesh Rao complies with cardiovascular pills before lunch at 01:00 PM.',
//     alertType: 'info',
//     specialActionTitle: 'Emergency Quick Panic Panel',
//     specialActionDesc: 'Instant panic triggers with automated ambulance dispatcher GPS sharing.',
//     checklistItems: [
//       { id: 'attendance', label: 'Verify Shift Attendance Log', type: 'checkbox' },
//       { id: 'hydration', label: 'Water Intake & hydration checklist', type: 'checkbox' },
//       { id: 'pills', label: 'Pill Reminders & Compliance Checks', type: 'checkbox' },
//       { id: 'panic_escalation', label: 'Escalate Emergency Assistance', type: 'panic' },
//       { id: 'daily_notes', label: 'Daily Companion Log Summary', type: 'input', placeholder: 'e.g. Patient walked in the park, had lunch with compliance to medications.' }
//     ]
//   },
//   caregiver: {
//     id: 'caregiver',
//     name: 'Elderly Caregiver',
//     specialtyTitle: 'Senior Care Professional Companion',
//     licenseTitle: 'Geriatric Care Association Membership: Verified',
//     metrics: [
//       { label: 'Shifts Conducted', value: '42 Shifts', iconName: 'trending' },
//       { label: 'Geriatric Assist Hours', value: '168 Hours', iconName: 'briefcase' },
//       { label: 'Incident-Free Score', value: '100%', iconName: 'activity' }
//     ],
//     alert: 'Reminder: Ensure Ramesh Rao complies with cardiovascular pills before lunch at 01:00 PM.',
//     alertType: 'info',
//     specialActionTitle: 'Emergency Quick Panic Panel',
//     specialActionDesc: 'Instant panic triggers with automated ambulance dispatcher GPS sharing.',
//     checklistItems: [
//       { id: 'attendance', label: 'Verify Shift Attendance Log', type: 'checkbox' },
//       { id: 'hydration', label: 'Water Intake & hydration checklist', type: 'checkbox' },
//       { id: 'pills', label: 'Pill Reminders & Compliance Checks', type: 'checkbox' },
//       { id: 'panic_escalation', label: 'Escalate Emergency Assistance', type: 'panic' },
//       { id: 'daily_notes', label: 'Daily Companion Log Summary', type: 'input', placeholder: 'e.g. Patient walked in the park, had lunch with compliance to medications.' }
//     ]
//   },
//   sample: {
//     id: 'sample',
//     name: 'Sample Collector',
//     specialtyTitle: 'DMLT / Certified Phlebotomy Officer',
//     licenseTitle: 'National Phlebotomy License: Active',
//     metrics: [
//       { label: 'Blood Vials Drawn', value: '180 Samples', iconName: 'trending' },
//       { label: 'Logistics Transit Hours', value: '54 Hours', iconName: 'briefcase' },
//       { label: 'Lab Handover Success', value: '100%', iconName: 'activity' }
//     ],
//     alert: 'Warning: Blood sample cooler temperature must remain below 4°C. Secure HSR lab delivery by 09:30 AM.',
//     alertType: 'critical',
//     specialActionTitle: 'Calibrate Scan Systems',
//     specialActionDesc: 'Verify laser tube scanners and barcode compliance protocols.',
//     checklistItems: [
//       { id: 'barcode_scan', label: 'Scan Patient Sample Tube Barcode', type: 'barcode' },
//       { id: 'collection', label: 'Mark Samples Successfully Drawn', type: 'checkbox' },
//       { id: 'lab_notes', label: 'Lab Logistics Handover Logs', type: 'input', placeholder: 'e.g. Samples secured in icebox. Transporting to Fortis Lab.' }
//     ]
//   },
//   cleaner: {
//     id: 'cleaner',
//     name: 'Home Sanitizer & Cleaner',
//     specialtyTitle: 'Certified Sanitization and Hygiene Officer',
//     licenseTitle: 'Environmental Safety and Sterility License: Active',
//     metrics: [
//       { label: 'Home Deep Cleans', value: '24 Cleans', iconName: 'trending' },
//       { label: 'Sterilization Hours', value: '88 Hours', iconName: 'briefcase' },
//       { label: 'Chemical Safety Index', value: '99.8%', iconName: 'activity' }
//     ],
//     alert: 'Notice: Patient Savitri Devi is allergic to standard cleaning aerosols. Use non-allergenic chemical solutions.',
//     alertType: 'warning',
//     specialActionTitle: 'Sanitization Safety Log',
//     specialActionDesc: 'Review non-pathogenic sterilizers and chemical dosage controls.',
//     checklistItems: [
//       { id: 'bedroom', label: 'Bedroom Deep Clean & Linen Disinfection', type: 'checkbox' },
//       { id: 'living', label: 'Dust, Vacuum, and Surface Sanitization', type: 'checkbox' },
//       { id: 'bathroom', label: 'Bathroom Deep Wash & Germicidal Sterility', type: 'checkbox' },
//       { id: 'clean_photo', label: 'Upload Post-Cleaning Compliance Photos', type: 'upload' },
//       { id: 'cleaner_notes', label: 'Sterility Log & Chemical Compliance Notes', type: 'input', placeholder: 'e.g. Sanitized bedroom and washroom. Allergy-compliant formulas used.' }
//     ]
//   }
// };

// const PATIENT_REGISTRY: Record<string, Patient> = {
//   'arjun-mehta': {
//     id: 'arjun-mehta',
//     name: 'Arjun Mehta',
//     age: 68,
//     gender: 'Male',
//     bloodGroup: 'B+',
//     conditions: ['Post-stroke rehab', 'Hypertension'],
//     allergies: ['Penicillin'],
//     emergencyContact: 'Ravi Mehta · +91 98450 11223',
//     address: '12, Outer Ring Rd, Sector 4, HSR Layout, Bangalore',
//     vitals: {bp: '132/84', heartRate: '78 bpm', spo2: '97%', glucose: '118 mg/dL', recordedAt: 'Today, 09:15 AM'},
//     visitHistory: [
//       {jobId: 'VHD-088', date: '12 May 2026', serviceType: 'Physiotherapy', status: 'completed', summary: 'ROM improved 12%'},
//     ],
//     firstHomeVisitCompleted: false,
//     liveStatus: 'monitoring',
//   },
//   'savitri-devi': {
//     id: 'savitri-devi',
//     name: 'Savitri Devi',
//     age: 74,
//     gender: 'Female',
//     bloodGroup: 'O+',
//     conditions: ['Type 2 Diabetes', 'Post-operative wound care'],
//     allergies: ['Aerosol cleaners', 'Sulfa drugs'],
//     emergencyContact: 'Priya Devi · +91 99887 55432',
//     address: 'Flat 405, Block B, Koramangala 3rd Block, Bangalore',
//     vitals: {bp: '148/92', heartRate: '88 bpm', spo2: '95%', glucose: '220 mg/dL', temperature: '98.4°F', recordedAt: 'Today, 08:40 AM'},
//     visitHistory: [],
//     firstHomeVisitCompleted: false,
//     liveStatus: 'critical',
//   },
//   'ramesh-rao': {
//     id: 'ramesh-rao',
//     name: 'Ramesh Rao',
//     age: 82,
//     gender: 'Male',
//     bloodGroup: 'A+',
//     conditions: ['Cardiovascular disease', 'Mild dementia'],
//     allergies: ['None reported'],
//     emergencyContact: 'Anita Rao · +91 98765 44321',
//     address: 'Villa 9, Indiranagar Double Road, Bangalore',
//     vitals: {bp: '128/80', heartRate: '72 bpm', spo2: '98%', recordedAt: 'Yesterday, 06:00 PM'},
//     visitHistory: [
//       {jobId: 'VHD-091', date: '20 May 2026', serviceType: 'Elderly Care', status: 'completed', summary: 'Medication compliance verified'},
//       {jobId: 'VHD-103', date: 'Today, 09:00 AM', serviceType: 'Elderly Care', status: 'scheduled'},
//     ],
//     firstHomeVisitCompleted: true,
//     liveStatus: 'stable',
//   },
//   'priya-sharma': {
//     id: 'priya-sharma',
//     name: 'Priya Sharma',
//     age: 29,
//     gender: 'Female',
//     bloodGroup: 'AB+',
//     conditions: ['Routine lab monitoring'],
//     allergies: ['Latex'],
//     emergencyContact: 'Amit Sharma · +91 91234 56789',
//     address: 'Apt 201, Green Glen Layout, Bellandur, Bangalore',
//     vitals: {glucose: 'Fasting required', recordedAt: 'Scheduled draw'},
//     visitHistory: [],
//     firstHomeVisitCompleted: false,
//     liveStatus: 'stable',
//   },
//   'k-r-murthy': {
//     id: 'k-r-murthy',
//     name: 'K. R. Murthy',
//     age: 71,
//     gender: 'Male',
//     bloodGroup: 'B-',
//     conditions: ['Post-cardiac discharge', 'Atrial fibrillation'],
//     allergies: ['Ibuprofen'],
//     emergencyContact: 'Lakshmi Murthy · +91 90123 45678',
//     address: 'Villa 21, Sobha Prestige Palms, Whitefield, Bangalore',
//     vitals: {bp: '138/86', heartRate: '82 bpm', spo2: '96%', recordedAt: 'Today, 11:00 AM'},
//     visitHistory: [],
//     firstHomeVisitCompleted: false,
//     liveStatus: 'monitoring',
//   },
// };

// // Initial state mock jobs in memory
// let mockJobs: Job[] = [
//   {
//     id: 'VHD-101',
//     patientId: 'arjun-mehta',
//     patientName: 'Arjun Mehta',
//     patientAge: 68,
//     patientGender: 'Male',
//     serviceType: 'Physiotherapy',
//     description: 'Post-stroke shoulder mobility session & gait training.',
//     location: '12, Outer Ring Rd, Sector 4, HSR Layout, Bangalore',
//     dateTime: 'Today, 10:30 AM',
//     duration: '60 mins',
//     payout: 1200,
//     reports: [
//       { name: 'MRI_Shoulder_Joint.pdf', url: '#' },
//       { name: 'Physiotherapy_Referral.pdf', url: '#' }
//     ],
//     status: 'new',
//     otpCode: '4892',
//     executionStatus: 'not_started',
//     visitNumber: 1,
//   },
//   {
//     id: 'VHD-102',
//     patientId: 'savitri-devi',
//     patientName: 'Savitri Devi',
//     patientAge: 74,
//     patientGender: 'Female',
//     serviceType: 'Nursing',
//     description: 'Post-operative wound dressing, vital signs monitoring & IV infusion.',
//     location: 'Flat 405, Block B, Koramangala 3rd Block, Bangalore',
//     dateTime: 'Today, 02:00 PM',
//     duration: '45 mins',
//     payout: 950,
//     reports: [
//       { name: 'Discharge_Summary_Fortis.pdf', url: '#' }
//     ],
//     status: 'new',
//     otpCode: '8520',
//     executionStatus: 'not_started',
//     visitNumber: 1,
//   },
//   {
//     id: 'VHD-103',
//     patientId: 'ramesh-rao',
//     patientName: 'Ramesh Rao',
//     patientAge: 82,
//     patientGender: 'Male',
//     serviceType: 'Elderly Care',
//     description: 'Daily support, medication compliance helper, and light physical assist.',
//     location: 'Villa 9, Indiranagar Double Road, Bangalore',
//     dateTime: 'Today, 09:00 AM',
//     duration: '4 hours',
//     payout: 1800,
//     reports: [
//       { name: 'Geriatric_Assessment.pdf', url: '#' }
//     ],
//     status: 'accepted',
//     otpCode: '1379',
//     executionStatus: 'not_started',
//     visitNumber: 2,
//   },
//   {
//     id: 'VHD-104',
//     patientId: 'priya-sharma',
//     patientName: 'Priya Sharma',
//     patientAge: 29,
//     patientGender: 'Female',
//     serviceType: 'Sample Collection',
//     description: 'Fasting blood sugar draw, HbA1c & complete lipid panel blood collection.',
//     location: 'Apt 201, Green Glen Layout, Bellandur, Bangalore',
//     dateTime: 'Tomorrow, 07:30 AM',
//     duration: '20 mins',
//     payout: 500,
//     reports: [
//       { name: 'Lab_Requisition_Thyrocare.pdf', url: '#' }
//     ],
//     status: 'new',
//     otpCode: '6409',
//     executionStatus: 'not_started',
//     visitNumber: 1,
//   },
//   {
//     id: 'VHD-105',
//     patientId: 'k-r-murthy',
//     patientName: 'K. R. Murthy',
//     patientAge: 71,
//     patientGender: 'Male',
//     serviceType: 'Doctor Visit',
//     description: 'Cardiology post-discharge monitoring and medication titration review.',
//     location: 'Villa 21, Sobha Prestige Palms, Whitefield, Bangalore',
//     dateTime: 'Today, 05:30 PM',
//     duration: '40 mins',
//     payout: 2500,
//     reports: [
//       { name: 'ECG_Report_Manipal.pdf', url: '#' },
//       { name: 'Cardiology_Prescription.pdf', url: '#' }
//     ],
//     status: 'new',
//     otpCode: '3142',
//     executionStatus: 'not_started',
//     visitNumber: 1,
//   },
//   {
//     id: 'VHD-106',
//     patientId: 'savitri-devi',
//     patientName: 'Savitri Devi',
//     patientAge: 74,
//     patientGender: 'Female',
//     serviceType: 'Home Sanitizer & Cleaner',
//     description: 'Deep sanitization of patient bedroom, bathroom, and living areas with hypoallergenic solutions.',
//     location: 'Flat 405, Block B, Koramangala 3rd Block, Bangalore',
//     dateTime: 'Today, 11:30 AM',
//     duration: '90 mins',
//     payout: 750,
//     reports: [
//       { name: 'Allergy_Profile_Report.pdf', url: '#' }
//     ],
//     status: 'new',
//     otpCode: '5921',
//     executionStatus: 'not_started',
//     visitNumber: 1,
//   },
// ];

// export interface ProviderNotification {
//   id: string;
//   title: string;
//   body: string;
//   time: string;
//   read: boolean;
//   type: 'offer' | 'visit' | 'payout' | 'system';
// }

// const mockProviderNotifications: ProviderNotification[] = [
//   {
//     id: 'n1',
//     title: 'Live booking near you',
//     body: 'Savitri Devi requested home sanitization · ₹750 · 2.4 km',
//     time: 'Just now',
//     read: false,
//     type: 'offer',
//   },
//   {
//     id: 'n2',
//     title: 'OTP verified',
//     body: 'Ramesh Rao visit started. Clinical notes unlock after checkout.',
//     time: '12 min ago',
//     read: false,
//     type: 'visit',
//   },
//   {
//     id: 'n3',
//     title: 'Settlement queued',
//     body: '₹2,800 pending transfer to your bank account.',
//     time: '1 hr ago',
//     read: true,
//     type: 'payout',
//   },
//   {
//     id: 'n4',
//     title: 'Dispatch score stable',
//     body: 'Your acceptance rate is 94% this week. Keep response time under 45s.',
//     time: 'Yesterday',
//     read: true,
//     type: 'system',
//   },
// ];

// let mockEarnings: EarningsData = {
//   totalEarnings: 8450,
//   settled: 5200,
//   deductions: 450,
//   unsettled: 2800,
//   weeklyHistory: [
//     { day: 'Mon', amount: 1200 },
//     { day: 'Tue', amount: 1800 },
//     { day: 'Wed', amount: 950 },
//     { day: 'Thu', amount: 1500 },
//     { day: 'Fri', amount: 2000 },
//     { day: 'Sat', amount: 1000 },
//     { day: 'Sun', amount: 0 }
//   ],
//   settlementHistory: [
//     {
//       id: 'SET-901',
//       date: '18 May 2026',
//       dateMs: new Date('2026-05-18').getTime(),
//       amount: 3200,
//       status: 'Settled',
//     },
//     {
//       id: 'SET-902',
//       date: '11 May 2026',
//       dateMs: new Date('2026-05-11').getTime(),
//       amount: 2000,
//       status: 'Settled',
//     },
//     {
//       id: 'SET-904',
//       date: '24 May 2026',
//       dateMs: new Date('2026-05-24').getTime(),
//       amount: 1450,
//       status: 'Settled',
//     },
//     {
//       id: 'SET-903',
//       date: 'Ongoing',
//       amount: 2800,
//       status: 'Pending',
//     },
//   ],
// };

// const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// export const mockApi = {
//   /**
//    * Mock login API check
//    * If phone is a pre-registered number, it succeeds.
//    * Otherwise, it throws an error to trigger onboarding registration flow.
//    */
//   async login(phone: string, pin?: string): Promise<{ success: boolean; role: string; token: string }> {
//     await delay(600);
//     const normalizedPhone = phone.trim();
    
//     // Hardcoded demo numbers for existing verified role dashboards:
//     // Doctor: 9876543210
//     // Nurse: 8765432109
//     // Physio: 7654321098
//     // Elderly Care: 6543210987
//     // Sample Collector: 5432109876
//     // Cleaner: 4321098765
//     if (normalizedPhone === '9876543210') {
//       return { success: true, role: 'doctor', token: 'mock-doctor-jwt-token' };
//     } else if (normalizedPhone === '8765432109') {
//       return { success: true, role: 'nurse', token: 'mock-nurse-jwt-token' };
//     } else if (normalizedPhone === '7654321098') {
//       return { success: true, role: 'physio', token: 'mock-physio-jwt-token' };
//     } else if (normalizedPhone === '6543210987') {
//       return { success: true, role: 'elderly', token: 'mock-elderly-jwt-token' };
//     } else if (normalizedPhone === '5432109876') {
//       return { success: true, role: 'sample', token: 'mock-sample-jwt-token' };
//     } else if (normalizedPhone === '4321098765') {
//       return { success: true, role: 'cleaner', token: 'mock-cleaner-jwt-token' };
//     }

//     // Default registered phone for demo fallback
//     if (normalizedPhone === '9999999999') {
//       return { success: true, role: 'physio', token: 'mock-fallback-jwt-token' };
//     }
    
//     // Simulate user not registered in system
//     throw new Error('User not registered. Please complete onboarding registration.');
//   },

//   /**
//    * Mock onboarding registration API check
//    * Simulates submitting all onboarding credentials and returning approval status.
//    */
//   async registerProvider(providerData: any): Promise<{ success: boolean; message: string }> {
//     await delay(1000);
//     return { success: true, message: 'Provider registered successfully' };
//   },

//   /**
//    * Fetch dynamic role configuration matching active caregiver designation
//    */
//   async fetchRoleConfig(roleId: string): Promise<RoleDashboardConfig> {
//     await delay(300);
//     const config = ROLE_CONFIGS[roleId];
//     if (!config) {
//       // Default to physio if not matched (safety fallback)
//       return ROLE_CONFIGS.physio;
//     }
//     return { ...config };
//   },

//   /**
//    * Fetch all jobs mapped to this provider session
//    */
//   async fetchJobs(): Promise<Job[]> {
//     await delay(400);
//     return [...mockJobs];
//   },

//   /**
//    * Accepts a job request
//    */
//   async acceptJob(jobId: string): Promise<Job> {
//     await delay(300);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
//     job.status = 'accepted';
//     job.executionStatus = 'not_started';
//     return { ...job };
//   },

//   /**
//    * Rejects a job request
//    */
//   async rejectJob(jobId: string, reason: string): Promise<Job> {
//     await delay(300);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
//     job.status = 'rejected';
//     job.rejectionReason = reason;
//     return { ...job };
//   },

//   /**
//    * Provider cancels an accepted / in-progress visit (patient notified in real time)
//    */
//   async cancelActiveVisit(jobId: string, reason: string): Promise<Job> {
//     await delay(400);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
//     job.status = 'cancelled';
//     job.cancellationReason = reason;
//     job.executionStatus = 'completed';
//     return {...job};
//   },

//   async fetchProviderNotifications(): Promise<ProviderNotification[]> {
//     await delay(250);
//     return mockProviderNotifications.map(n => ({...n}));
//   },

//   async markNotificationRead(notificationId: string): Promise<void> {
//     await delay(120);
//     const n = mockProviderNotifications.find(x => x.id === notificationId);
//     if (n) n.read = true;
//   },

//   /**
//    * Updates coordinates / step-wise progress of visit execution
//    */
//   async updateVisitStatus(jobId: string, stepStatus: Job['executionStatus']): Promise<Job> {
//     await delay(300);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
//     job.executionStatus = stepStatus;
//     if (stepStatus === 'in_progress') {
//       job.status = 'ongoing';
//     }
//     return { ...job };
//   },

//   /**
//    * Submit dynamic checklist results and signature to complete visit
//    */
//   async submitVisitDetails(jobId: string, visitDetails: any): Promise<Job> {
//     await delay(500);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
    
//     job.status = 'completed';
//     job.executionStatus = 'completed';
//     job.visitDetails = visitDetails;

//     const patientId = job.patientId ?? patientIdFromName(job.patientName);
//     const patient = PATIENT_REGISTRY[patientId];
//     if (patient) {
//       patient.firstHomeVisitCompleted = true;
//       patient.visitHistory = [
//         {
//           jobId: job.id,
//           date: job.dateTime,
//           serviceType: job.serviceType,
//           status: 'completed',
//           summary:
//             typeof visitDetails?.careNotes === 'string'
//               ? visitDetails.careNotes.slice(0, 80)
//               : 'Home visit completed',
//         },
//         ...patient.visitHistory.filter(v => v.jobId !== job.id),
//       ];
//     }

//     // Credit earnings instantly
//     mockEarnings.unsettled += job.payout;
//     mockEarnings.totalEarnings += job.payout;
    
//     // Add to weekly chart
//     const todayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
//     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//     const currentDayStr = days[todayIndex];
//     const dayData = mockEarnings.weeklyHistory.find(d => d.day === currentDayStr);
//     if (dayData) {
//       dayData.amount += job.payout;
//     }

//     return { ...job };
//   },

//   /**
//    * Patient rates provider after visit (collected on provider device at doorstep)
//    */
//   async submitPatientRating(
//     jobId: string,
//     payload: {stars: number; comment?: string; tags?: string[]},
//   ): Promise<{success: boolean}> {
//     await delay(400);
//     const job = mockJobs.find(j => j.id === jobId);
//     if (!job) throw new Error('Job not found');
//     job.visitDetails = {
//       ...(typeof job.visitDetails === 'object' ? job.visitDetails : {}),
//       patientRating: payload,
//       ratedAt: new Date().toISOString(),
//     };
//     return {success: true};
//   },

//   /**
//    * Retrieve total payouts and settlement grids
//    */
//   async fetchEarnings(): Promise<EarningsData> {
//     await delay(300);
//     return { ...mockEarnings };
//   },

//   async fetchPatients(): Promise<Patient[]> {
//     await delay(280);
//     const ids = new Set(
//       mockJobs.map(j => j.patientId ?? patientIdFromName(j.patientName)),
//     );
//     return [...ids]
//       .map(id => PATIENT_REGISTRY[id])
//       .filter((p): p is Patient => Boolean(p));
//   },

//   async fetchPatient(patientId: string): Promise<Patient | null> {
//     await delay(220);
//     const patient = PATIENT_REGISTRY[patientId];
//     return patient ? {...patient, visitHistory: [...patient.visitHistory]} : null;
//   },

//   canVideoCall(patientId: string): boolean {
//     const patient = PATIENT_REGISTRY[patientId];
//     return Boolean(patient?.firstHomeVisitCompleted);
//   },

//   canVideoCallForJob(job: Job): boolean {
//     const patientId = job.patientId ?? patientIdFromName(job.patientName);
//     return this.canVideoCall(patientId);
//   },

//   /**
//    * Reset database back to default initial values
//    */
//   async resetMockDatabase(): Promise<void> {
//     mockJobs = mockJobs.map(j => ({
//       ...j,
//       status: j.id === 'VHD-103' ? 'accepted' : 'new',
//       executionStatus: 'not_started',
//       rejectionReason: undefined,
//       visitDetails: undefined
//     }));
//     mockEarnings = {
//       totalEarnings: 8450,
//       settled: 5200,
//       deductions: 450,
//       unsettled: 2800,
//       weeklyHistory: [
//         { day: 'Mon', amount: 1200 },
//         { day: 'Tue', amount: 1800 },
//         { day: 'Wed', amount: 950 },
//         { day: 'Thu', amount: 1500 },
//         { day: 'Fri', amount: 2000 },
//         { day: 'Sat', amount: 1000 },
//         { day: 'Sun', amount: 0 }
//       ],
//       settlementHistory: [
//         {
//           id: 'SET-901',
//           date: '18 May 2026',
//           dateMs: new Date('2026-05-18').getTime(),
//           amount: 3200,
//           status: 'Settled',
//         },
//         {
//           id: 'SET-902',
//           date: '11 May 2026',
//           dateMs: new Date('2026-05-11').getTime(),
//           amount: 2000,
//           status: 'Settled',
//         },
//         {
//           id: 'SET-904',
//           date: '24 May 2026',
//           dateMs: new Date('2026-05-24').getTime(),
//           amount: 1450,
//           status: 'Settled',
//         },
//         {
//           id: 'SET-903',
//           date: 'Ongoing',
//           amount: 2800,
//           status: 'Pending',
//         },
//       ],
//     };
//   }
// };
