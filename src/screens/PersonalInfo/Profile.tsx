// profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  FlatList,
  ActionSheetIOS,
  PermissionsAndroid,
} from 'react-native';
import { AddIcon, AmountIcon, BankIcon, BookIcon, CameraIcon, CloseXIcon, DeleteAccountIcon, EditIcon, EyeOpenIcon, HomeIcon, MailIcon, MedicalSuitcaseIcon, PersonIcon, PersonInCardIcon, PhoneIcon, StaffManagementIcon, TrophyIcon, VideoIcon } from '../../utility/SvgIcons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';
import moment from 'moment';
import { Dispatch } from 'redux';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
// API functions (keep your implementations)
import { AuthFetch, AuthPut, UploadFiles, AuthPost, UpdateFiles, authDelete } from '../../auth/auth';
import { useDispatch, useSelector } from 'react-redux';

// Responsive utilities (from your provided file)
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SPACING,
  FONT_SIZE,
  ICON_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  responsiveText,
  moderateScale,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';
import IOSCalendarPicker from '../../utility/iosCalendarPicker';

type LangOption = { label: string; value: string };

const languageOptions: LangOption[] = [
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'English', value: 'English' },
  { label: 'Urdu', value: 'Urdu' },
];

type BankDetails = {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountProof?: any;
};

type Address = {
  _id: string;
  clinicName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string | number;
  startTime?: string;
  endTime?: string;
};

type Specialization = {
  name?: string;
  id?: string;
  experience?: number | string;
  degree?: string; // comma-separated degree names
  bio?: string;
  specializationCertificate?: any;
  drgreeCertificate?: any; // typo on backend, keep compatibility
  degreeCertificate?: any;
};

type ConsultationModeFee = {
  type: string;
  fee: number | string;
  currency?: string; // e.g., "₹" or "INR"
};

type KycDetails = {
  pan?: {
    number?: string;
    attachmentUrl?: any;
  };
};

type Certification = {
  _id: string;
  certificationName: string;
  issuingOrganization: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  s3Key?: string;
  status: string;
};

type DoctorData = {
  _id: string;
  key: string;
  firstname: string;
  lastname: string;
  whatsappDisplayName?: string;
  specialization: Specialization[];
  email: string;
  mobile: string;
  status: string;
  medicalRegistrationNumber: string;
  userId: string | number;
  createdAt?: string;
  consultationModeFee: ConsultationModeFee[];
  spokenLanguage: string[];
  gender: string;
  DOB?: string;
  bloodgroup?: string;
  maritalStatus?: string;
  addresses?: Address[];
  bankDetails: BankDetails;
  kycDetails: {
    panNumber?: string;
    panImage?: any;
  };
  certifications: {
    name: string;
    registrationNo: string;
    image?: any;
    degreeCertificate?: any;
  }[];
  profilepic?: any;
  doctorProfile?: {
    degrees?: {
      _id: string;
      degree: string;
      institute: string;
      yearOfPassing: number;
      status: string;
    }[];
    awardsAndRecognitions?: {
      _id: string;
      description: string;
      year: number;
      status: string;
    }[];
    professionalExperience?: {
      _id: string;
      institution: string;
      fromYear: string;
      toYear: string;
      status: string;
    }[];
    professionalMemberships?: {
      _id: string;
      organization: string;
      year: string;
      status: string;
    }[];
    treatmentsAndProceduresOffered?: {
      _id: string;
      description: string;
      status: string;
    }[];
  };
};

type EditModalType = 'personal' | 'professional' | 'kyc' | 'consultation' | 'bank' | null;

// Validators (client-side parity with web)
const isValidIFSC = (v: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
const sanitizeIFSC = (v: string) => (v || '').toUpperCase().slice(0, 11);
const isDigits = (v: string) => /^[0-9]+$/.test(v);

const DoctorProfileView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const role = currentuserDetails?.role || ""
  // Data
  const [token, setToken] = useState<string | null>(null);
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [degrees, setDegrees] = useState<string[]>([]);
  const [kycServer, setKycServer] = useState<KycDetails | null>(null);

  // Document preview modal
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ type: string; data: any; certDetails?: any } | null>(null);

  // Edit modal
  const [editModalType, setEditModalType] = useState<EditModalType>(null);

  // Forms state (per section)
  const [formPersonal, setFormPersonal] = useState({
    firstname: '',
    lastname: '',
    email: '',
    spokenLanguage: [] as string[],
    whatsappDisplayName: '',
  });
  const dispatch = useDispatch();
  const [formProfessional, setFormProfessional] = useState({
    selectedDegrees: [] as string[], // multi-select
    experience: '',
    about: '',
  });

  // NEW: degree selection modal state & search
  const [degreeModalVisible, setDegreeModalVisible] = useState(false);
  const [degreeSearchText, setDegreeSearchText] = useState('');
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);

  // Add degree creation modal state
  const [addDegreeModalVisible, setAddDegreeModalVisible] = useState(false);
  const [newDegreeForm, setNewDegreeForm] = useState({
    degree: '',
    institute: '',
    yearOfPassing: '',
  });

  // Add award creation modal state
  const [addAwardModalVisible, setAddAwardModalVisible] = useState(false);
  const [newAwardForm, setNewAwardForm] = useState({
    description: '',
    year: '',
  });

  // Add professional experience creation modal state
  const [addExperienceModalVisible, setAddExperienceModalVisible] = useState(false);
  const [newExperienceForm, setNewExperienceForm] = useState({
    institution: '',
    fromYear: '',
    toYear: '',
  });

  // Add professional memberships creation modal state
  const [addMembershipModalVisible, setAddMembershipModalVisible] = useState(false);
  const [newMembershipForm, setNewMembershipForm] = useState({
    organization: '',
    year: '',
  });

  // Add treatments and procedures creation modal state
  const [addTreatmentModalVisible, setAddTreatmentModalVisible] = useState(false);
  const [newTreatmentForm, setNewTreatmentForm] = useState({
    description: '',
  });

  // Add certification modal state
  const [addCertificationModalVisible, setAddCertificationModalVisible] = useState(false);
  const [newCertificationForm, setNewCertificationForm] = useState({
    certificationName: '',
    issuingOrganization: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    description: '',
  });
  const [certificationFile, setCertificationFile] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [editCertificationId, setEditCertificationId] = useState<string | null>(null);
  const [certificationErrors, setCertificationErrors] = useState({
    certificationName: '',
    issuingOrganization: '',
    issueDate: '',
    file: '',
  });

  // ── Certification date picker state ─────────────────────────────────────────
  // Android DateTimePicker
  const [showCertIssueDatePicker, setShowCertIssueDatePicker] = useState(false);
  const [showCertExpiryDatePicker, setShowCertExpiryDatePicker] = useState(false);
  // iOS IOSCalendarPicker
  const [showCertIssueCalendar, setShowCertIssueCalendar] = useState(false);
  const [showCertExpiryCalendar, setShowCertExpiryCalendar] = useState(false);
  const [certCalendarCurrentDate, setCertCalendarCurrentDate] = useState<Date>(new Date());

  // KYC form state
  const [panNumber, setPanNumber] = useState('');
  const [panImage, setPanImage] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [pancardUploaded, setPancardUploaded] = useState(false);

  // Consultation form (list)
  const [formConsultation, setFormConsultation] = useState<ConsultationModeFee[]>([]);
  let isFeeInvalid;
  // Bank form
  const [formBank, setFormBank] = useState<BankDetails>({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Profile image editing state (new)
  const [profileImage, setProfileImage] = useState<{ uri: string; name: string; type?: string } | null>(null);
  const [profileUploaded, setProfileUploaded] = useState(false);

  // Awards state
  const [awards, setAwards] = useState<any[]>([]);
  const [awardErrors, setAwardErrors] = useState({ description: '', year: '' });

  // Professional Experience state
  const [experiences, setExperiences] = useState<any[]>([]);
  const [experienceErrors, setExperienceErrors] = useState({ institution: '', fromYear: '', toYear: '' });

  // Professional Memberships state
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipErrors, setMembershipErrors] = useState({ organization: '', year: '' });

  // Treatments state
  const [treatments, setTreatments] = useState<any[]>([]);
  const [treatmentErrors, setTreatmentErrors] = useState({ description: '' });

  // Education state
  const [educations, setEducations] = useState<any[]>([]);
  const [educationErrors, setEducationErrors] = useState({ degree: '', institute: '', year: '' });

  // Certifications state
  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Utilities
  const getLocationColor = (name: string) => {
    const colors = ['#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1', '#955251', '#B565A7'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash % colors.length);
    return colors[index];
  };

  // Init token
  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem('authToken');
        if (!t) {
          return;
        }
        setToken(t);
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to retrieve auth token' });
      }
    })();
  }, []);

  // Fetch data
  const fetchDegrees = async () => {
    if (!token) return;
    try {
      const res: any = await AuthFetch('catalogue/degree/getAllDegrees', token);

      const data = res?.data?.data || [];
      const names = data?.map((d: any) => d?.name || d?.degreeName || d?.title).filter(Boolean);
      setDegrees(names);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch degrees' });
    }
  };

  const fetchDoctorData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res: any = await AuthFetch('users/getUser', token);
      if (res?.status === 'error') throw new Error(res?.message || 'Failed to fetch doctor data');

      const userData = res?.data?.data;
      dispatch({ type: 'currentUser', payload: userData });
      if (!userData) {
        setDoctorData(null);
        return;
      }

      const specializations: Specialization[] = userData?.specialization
        ? Array?.isArray(userData?.specialization)
          ? userData?.specialization
          : [userData?.specialization]
        : [];

      const certifications = specializations?.map((spec: Specialization) => ({
        name: spec?.name || 'Specialization',
        registrationNo: spec?.id || 'N/A',
        image: spec?.specializationCertificateUrl || null,
        degreeCertificate: spec?.degreeCertificateUrl || spec?.drgreeCertificateUrl || null,
      }));

      const bankDetails = userData.bankDetails || {};
      const resolvedProfilePic =
        userData.profilepic ||
        userData.profilePicture ||
        userData.profilepicture ||
        userData.profile_image ||
        userData.profile_image_url ||
        null;

      const doctorProfile = userData.doctorProfile || {};

      const dd: DoctorData = {
        _id: userData._id,
        key: userData._id,
        firstname: userData.firstname || 'N/A',
        lastname: userData.lastname || '',
        whatsappDisplayName: userData.whatsappDisplayName || '',
        specialization: specializations,
        email: userData.email || 'N/A',
        mobile: userData.mobile || 'N/A',
        status: userData.status || 'pending',
        medicalRegistrationNumber: userData.medicalRegistrationNumber || 'N/A',
        userId: userData.userId || 'N/A',
        createdAt: userData.createdAt,
        consultationModeFee: Array.isArray(userData.consultationModeFee) ? userData.consultationModeFee : [],
        spokenLanguage: Array.isArray(userData.spokenLanguage) ? userData.spokenLanguage : [],
        gender: userData.gender || 'N/A',
        DOB: userData.DOB || 'N/A',
        bloodgroup: userData.bloodgroup || 'N/A',
        maritalStatus: userData.maritalStatus || 'N/A',
        addresses: Array.isArray(userData.addresses) ? userData.addresses : [],
        bankDetails,
        kycDetails: {
          panNumber: userData.kycDetails?.pan?.number || 'N/A',
          panImage: userData.kycDetails?.pan?.attachmentUrl || null,
        },
        certifications,
        profilepic: resolvedProfilePic,
        doctorProfile,
      };

      setDoctorData(dd);

      // Seed forms
      setFormPersonal({
        firstname: dd.firstname || '',
        lastname: dd.lastname || '',
        email: dd.email || '',
        spokenLanguage: dd.spokenLanguage || [],
        whatsappDisplayName: (userData.whatsappDisplayName as string) || '',
      });

      const firstSpec = dd.specialization?.[0] || {};
      const selectedDegrees = (firstSpec?.degree ? String(firstSpec.degree).split(',') : []).map(s => s.trim()).filter(Boolean);

      setFormProfessional({
        selectedDegrees,
        experience: String(firstSpec?.experience ?? ''),
        about: String(firstSpec?.bio ?? ''),
      });

      setFormConsultation(
        (dd.consultationModeFee || []).map((m) => ({
          type: m.type,
          fee: String(m.fee ?? ''),
          currency: m.currency || '₹',
        }))
      );

      setFormBank({
        bankName: dd.bankDetails?.bankName || '',
        accountHolderName: dd.bankDetails?.accountHolderName || '',
        accountNumber: dd.bankDetails?.accountNumber || '',
        ifscCode: dd.bankDetails?.ifscCode || '',
        accountProof: dd.bankDetails?.accountProof,
      });

      setPanNumber(dd.kycDetails?.panNumber === 'N/A' ? '' : dd.kycDetails?.panNumber || '');

      // reset profile image local state from server pic
      setProfileImage(dd.profilepic ? { uri: dd.profilepic, name: 'profile.jpg', type: 'image/jpeg' } : null);
      setProfileUploaded(false);

      // Set education, awards, experiences, memberships, treatments from doctorProfile
      if (doctorProfile.degrees) {
        setEducations(doctorProfile.degrees.filter((d: any) => d.status === 'active'));
      }
      if (doctorProfile.awardsAndRecognitions) {
        setAwards(doctorProfile.awardsAndRecognitions.filter((a: any) => a.status === 'active'));
      }
      if (doctorProfile.professionalExperience) {
        setExperiences(doctorProfile.professionalExperience.filter((e: any) => e.status === 'active'));
      }
      if (doctorProfile.professionalMemberships) {
        setMemberships(doctorProfile.professionalMemberships.filter((m: any) => m.status === 'active'));
      }
      if (doctorProfile.treatmentsAndProceduresOffered) {
        setTreatments(doctorProfile.treatmentsAndProceduresOffered.filter((t: any) => t.status === 'active'));
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.message || 'Failed to load doctor data' });
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch certifications from dedicated API ──────────────────────────────────
  const fetchCertifications = async () => {
    if (!token) return;
    try {
      const resolvedUserId = doctorData?.userId;
      if (!resolvedUserId) return;
      const res: any = await AuthFetch(`doctor/${resolvedUserId}/certifications?status=active`, token);
      console.log("123432",res)
      const data: Certification[] = res?.data?.data || [];
      setCertifications(
        data.filter(c => c.status && c.status.toLowerCase() === 'active')
      );
    } catch (e) {
      // non-blocking
      console.error('Failed to fetch certifications:', e);
    }
  };

  const fetchKyc = async () => {
    if (!token) return;
    try {
      const res: any = await AuthFetch('users/getKycByUserId', token);
      setKycServer(res?.data?.data || null);
    } catch {
      // non-blocking
    }
  };

  useEffect(() => {
    if (token) {
      fetchDoctorData();
      fetchDegrees();
      fetchKyc();
    }
  }, [token]);

  // Fetch certifications once doctorData (and userId) is available
  useEffect(() => {
    if (token && doctorData?.userId) {
      fetchCertifications();
    }
  }, [token, doctorData?.userId]);

  // Document modal
  const showDocModal = (doc: { type: string; data: any; certDetails?: any }) => {
    setSelectedDocument(doc);
    setIsDocModalVisible(true);
  };

  const closeDocModal = () => {
    setIsDocModalVisible(false);
    setSelectedDocument(null);
  };

  // Reset form slices from the latest saved data before opening/closing modals
  const seedFormsFromSaved = (type: EditModalType) => {
    if (!doctorData) return;

    if (type === 'personal') {
      setFormPersonal({
        firstname: doctorData.firstname || '',
        lastname: doctorData.lastname || '',
        email: doctorData.email || '',
        spokenLanguage: doctorData.spokenLanguage || [],
         whatsappDisplayName: (doctorData as any).whatsappDisplayName || '', 
      });
      // reset profile image local state when opening personal modal
      setProfileImage(doctorData.profilepic ? { uri: doctorData.profilepic, name: 'profile.jpg', type: 'image/jpeg' } : null);
      setProfileUploaded(false);
      return;
    }

    if (type === 'professional') {
      const firstSpec = doctorData.specialization?.[0] || {};
      const selectedDegrees = (firstSpec?.degree ? String(firstSpec.degree).split(',') : [])
        .map(s => s.trim())
        .filter(Boolean);
      setFormProfessional({
        selectedDegrees,
        experience: String(firstSpec?.experience ?? ''),
        about: String(firstSpec?.bio ?? ''),
      });
      return;
    }

    if (type === 'consultation') {
      setFormConsultation(
        (doctorData.consultationModeFee || []).map(m => ({
          type: m.type,
          fee: String(m.fee ?? ''),
          currency: m.currency || '₹',
        }))
      );
      return;
    }

    if (type === 'bank') {
      setFormBank({
        bankName: doctorData.bankDetails?.bankName || '',
        accountHolderName: doctorData.bankDetails?.accountHolderName || '',
        accountNumber: doctorData.bankDetails?.accountNumber || '',
        ifscCode: doctorData.bankDetails?.ifscCode || '',
        accountProof: doctorData.bankDetails?.accountProof,
      });
      return;
    }

    if (type === 'kyc') {
      const currentPan =
        kycServer?.pan?.number ||
        (doctorData.kycDetails?.panNumber === 'N/A' ? '' : doctorData.kycDetails?.panNumber || '');
      setPanNumber(currentPan);
      setPanImage(null);
      setPancardUploaded(false);
      return;
    }
  };

  // Edit modal open/close
  const handleEditOpen = (type: EditModalType) => {
    seedFormsFromSaved(type); // <-- always seed from saved data on open
    setEditModalType(type);
  };

  const handleEditClose = () => {
    if (editModalType) seedFormsFromSaved(editModalType); // <-- revert unsaved edits on cancel/close
    setEditModalType(null);
  };

  // ---------- PROFILE IMAGE PICK (improved & reliable) ----------
  const openCamera = async () => {
    try {
    // For Android, we need to request camera permission
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera permission to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }
      }

      const options: CameraOptions = {
        mediaType: 'photo',
        saveToPhotos: true,
        quality: 0.8,
      };

      const result = await launchCamera(options);
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        Alert.alert('Camera Error', result.errorMessage || 'Unknown error while opening camera');
        return;
      }
      const asset = result?.assets?.[0];
      if (asset?.uri) {
        const img = {
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        };
        setProfileImage(img);
        setProfileUploaded(true);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Photo selected' });
      } else {
        Alert.alert('Error', 'No image was captured');
      }
    } catch (err: any) {
      console.error('openCamera error:', err);
      Alert.alert('Error', err?.message || 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      };

      const result = await launchImageLibrary(options);
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery Error', result.errorMessage || 'Unknown error while opening gallery');
        return;
      }
      const asset = result?.assets?.[0];
      if (asset?.uri) {
        const img = {
          uri: asset.uri,
          name: asset.fileName || `profile_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        };
        setProfileImage(img);
        setProfileUploaded(true);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Photo selected' });
      } else {
        Alert.alert('Error', 'No image was selected');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to open gallery');
    }
  };

  const handleProfileImagePick = () => {
      Alert.alert('Upload Profile Photo', 'Choose an option', [
        { text: 'Camera', onPress: () => void openCamera() },
        { text: 'Gallery', onPress: () => void openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]);
  };
  const savePersonal = async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;
    try {
      if (!formPersonal.firstname || !formPersonal.lastname) {
        Toast.show({ type: 'error', text1: 'Validation', text2: 'First & Last name are required' });
        return;
      }
      if (formPersonal.email && !/^\S+@\S+\.\S+$/.test(formPersonal.email)) {
        Toast.show({ type: 'error', text1: 'Validation', text2: 'Invalid email' });
        return;
      }

      // If profile image selected, use UpdateFiles (multipart)
      if (profileImage && profileUploaded) {
        const formData = new FormData();
        // include fields
        formData.append('firstname', formPersonal.firstname);
        formData.append('lastname', formPersonal.lastname);
        formData.append('email', formPersonal.email || '');
        formData.append('spokenLanguage', JSON.stringify(formPersonal.spokenLanguage || []));
        formData.append('whatsappDisplayName', formPersonal.whatsappDisplayName || '');
        // append profile pic
        formData.append('profilePic', {
          uri: profileImage.uri,
          name: profileImage.name,
          type: profileImage.type || 'image/jpeg',
        } as any);

        const response: any = await UpdateFiles('users/updateUser', formData, token);
        if (response?.status === 'success') {
          const userData = response?.data?.data;
          dispatch({ type: 'currentUser', payload: userData });
          Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
          handleEditClose();
          fetchDoctorData();
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response?.message?.message || 'Please try again.' });
        }
      } else {
        // No image change - use AuthPut (json)
        const response: any = await AuthPut(
          'users/updateUser',
          {
            firstname: formPersonal?.firstname,
            lastname: formPersonal?.lastname,
            email: formPersonal?.email,
            spokenLanguage: formPersonal?.spokenLanguage || [],
            whatsappDisplayName: formPersonal.whatsappDisplayName || '',  
          },
          token
        );
        if (response?.status === 'success') {
          const userData = response?.data?.data;

          dispatch({ type: 'currentUser', payload: userData });

          Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
          handleEditClose();
          fetchDoctorData();
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: response?.message?.message || 'An unexpected error occurred. Please try again.' });
        }
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message?.message || e?.message || 'Failed to update profile' });
    }
  };

  const saveProfessional = async () => {
    // retrieve token inside function (like handleNext)
    const token = await AsyncStorage.getItem('authToken');
    if (!token || !doctorData) return;

    // Validate at least one degree is selected
    if (!formProfessional.selectedDegrees || formProfessional.selectedDegrees.length === 0) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please select at least one degree' });
      return;
    }

    try {

      const firstSpec = doctorData?.specialization?.[0];
      const formData = new FormData();
      formData.append('id', String(doctorData?.userId || ''));
      formData.append('name', String(firstSpec?.name || ''));
      formData.append('experience', String(formProfessional?.experience || ''));
      formData.append('degree', formProfessional?.selectedDegrees?.join(','));
      formData.append('bio', String(formProfessional?.about || ''));

      const response: any = await UpdateFiles('users/updateSpecialization', formData, token);
      if (response?.status === 'success') {
        const userData = response?.data?.data;
        dispatch({ type: 'currentUser', payload: userData });

        Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully' });
        handleEditClose?.();
        await fetchDoctorData?.();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message?.message || 'Please try again.' });
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message?.message || e?.message || 'Failed to update profile' });
    } finally {
    }
  };

  const saveConsultation = async () => {
    if (!token) return;

    // Validate: every row must have both fields filled
    for (let idx = 0; idx < formConsultation.length; idx++) {
      const row = formConsultation[idx] as any;
      const active = row.active ?? Number(row.fee) > 0;

      // Type is always required
      if (!row.type || row.type.trim() === '') {
        Alert.alert('Missing value', `Row ${idx + 1}: Please fill the Type.`);
        return;
      }

      // If checkbox is selected (active), fee must be >= 10 (changed from > 0)
      const feeNum = Number(row.fee);
      if (active && (!row.fee || isNaN(feeNum) || feeNum < 10)) {
        Alert.alert('Invalid fee', `Row ${idx + 1}: Fee must be at least ₹10 when enabled.`);
        return;
      }

      // If inactive, normalize to 0 to send
      if (!active) {
        row.fee = '0';
      }
    }

    try {
      const cleaned = formConsultation.map((i) => ({
        type: i.type.trim(),
        fee: Number(i.fee),
        currency: i.currency || "₹",
      }));

      const response: any = await AuthPost(
        "users/updateConsultationModes",
        { consultationModeFee: cleaned },
        token
      );

      if (response?.status === 'success') {
        const userData = response?.data?.data;
        dispatch({ type: 'currentUser', payload: userData });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Consultation fees updated",
        });
        handleEditClose();
        fetchDoctorData();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message?.message || 'Please try again.' });
      }

    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          e?.response?.data?.message?.message ||
          e?.message ||
          "Failed to update fees",
      });
    }
  };

  const saveBank = async () => {
    if (!token) return;
    try {
      if (!formBank.bankName || !formBank.accountHolderName || !formBank.accountNumber || !formBank.ifscCode) {
        Alert.alert('Validation', 'All bank fields are required');
        return;
      }
      if (!isDigits(formBank.accountNumber!)) {
        Alert.alert('Validation', 'Account number must be digits');
        return;
      }
      const ifsc = sanitizeIFSC(formBank.ifscCode!);
      if (!isValidIFSC(ifsc)) {
        Alert.alert('Validation', 'Invalid IFSC (e.g., HDFC0ABCD12)');
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      const requestData = {
        bankDetails: {
          bankName: formBank.bankName,
          accountHolderName: formBank.accountHolderName,
          accountNumber: formBank.accountNumber,
          ifscCode: ifsc,
        }
    };
    if (userId) {
      requestData.bankDetails.userId = userId;
    }    
    const response: any = await AuthPost('users/updateBankDetails', requestData, token);

      if (response?.status === 'success') {
        const userData = response?.data?.data;
        dispatch({ type: 'currentUser', payload: userData });
        Toast.show({ type: 'success', text1: 'Success', text2: 'Bank details updated' });
        handleEditClose();
        fetchDoctorData();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message?.message || 'Please try again.' });
      }

    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message?.message || e?.message || 'Failed to update bank details' });
    }
  };

  // KYC file pick (camera/gallery/pdf)
  const handlePancardUpload = async () => {
    Alert.alert('Upload PAN Card', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const result = await launchCamera({ mediaType: 'photo', includeBase64: false });
            const asset = result?.assets?.[0];
            if (asset?.uri) {
              setPanImage({
                uri: asset.uri,
                name: asset.fileName || 'pan_camera.jpg',
                type: asset.type || 'image/jpeg',
              });
              setPancardUploaded(true);
            } else {
              Alert.alert('No image selected from camera');
            }
          } catch {
            Alert.alert('Error', 'Camera access failed.');
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: false });
            const asset = result?.assets?.[0];
            if (asset?.uri) {
              setPanImage({
                uri: asset.uri,
                name: asset.fileName || 'pan_gallery.jpg',
                type: asset.type || 'image/jpeg',
              });
              setPancardUploaded(true);
            } else {
              Alert.alert('No image selected from gallery');
            }
          } catch {
            Alert.alert('Error', 'Gallery access failed.');
          }
        },
      },
      {
        text: 'Upload PDF',
        onPress: async () => {
          try {
            const [res] = await pick({ type: [types.pdf, types.images] });
            if (res?.uri && res?.name) {
              setPanImage({ uri: res.uri, name: res.name, type: res.type || 'application/pdf' });
              setPancardUploaded(true);
            } else {
              Alert.alert('Error', 'Invalid file selected.');
            }
          } catch {
            Alert.alert('Error', 'File selection failed.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveKYC = async () => {
    if (!token) return;
    try {
      if (!panNumber || panNumber.length !== 10) {
        Toast.show({ type: 'error', text1: 'Validation', text2: 'Enter a valid 10-character PAN' });
        return;
      }
      if (!panImage?.uri) {
        Toast.show({ type: 'error', text1: 'Validation', text2: 'Please upload a PAN file' });
        return;
      }

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Missing userId' });
        return;
      }

      const formData = new FormData();
      formData.append('userId', String(userId));
      formData.append('panNumber', panNumber.toUpperCase());
      formData.append('panFile', {
        uri: panImage.uri,
        name: panImage.name,
        type: panImage.type || (panImage.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      } as any);

      const resp: any = await UploadFiles('users/addKYCDetails', formData, token);
      const ok = resp?.status === 'success' || resp?.data?.status === 'success';

      if (ok) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'KYC submitted' });
        handleEditClose();
        fetchDoctorData();
        fetchKyc();
      } else {
        Alert.alert('Error', resp?.message?.message || 'Failed to submit KYC');
      }
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.message?.message || e?.message || 'Failed to submit KYC' });
    }
  };

  // Create new degree via API
  const createDegree = async (degreeData: { degree: string; institute: string; yearOfPassing: string }) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await AuthPost(
        `doctor/${doctorData.userId}/degree`, 
        degreeData, 
        token,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Degree added successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to create degree' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create degree' });
      return false;
    }
  };

  // Delete degree via API
  const deleteDegree = async (degreeId: string) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await authDelete(
        `doctor/${doctorData.userId}/degree/${degreeId}`, 
        {status: 'inActive'},
        token
      );

      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Degree deleted successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete degree' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete degree' });
      return false;
    }
  };

  // Handle delete degree with confirmation
  const handleDeleteDegree = (degreeId: string, degreeName: string) => {
    Alert.alert(
      'Delete Degree',
      `Are you sure you want to delete "${degreeName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteDegree(degreeId);
            // Feedback is already handled in deleteDegree function
          }
        }
      ]
    );
  };

  // Create new award via API
  const createAward = async (awardData: { description: string; year: string }) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await AuthPost(
        `doctor/${doctorData.userId}/award`, 
        awardData, 
        token,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Award added successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to create award' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create award' });
      return false;
    }
  };

  // Delete award via API
  const deleteAward = async (awardId: string) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await authDelete(
        `doctor/${doctorData.userId}/award/${awardId}`, 
        {status: 'inActive'},
        token
      );

      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Award deleted successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete award' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete award' });
      return false;
    }
  };

  // Handle delete award with confirmation
  const handleDeleteAward = (awardId: string, awardDescription: string) => {
    Alert.alert(
      'Delete Award',
      `Are you sure you want to delete "${awardDescription}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAward(awardId);
            // Feedback is already handled in deleteAward function
          }
        }
      ]
    );
  };

  // Create new professional experience via API
  const createProfessionalExperience = async (experienceData: { institution: string; fromYear: string; toYear: string }) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await AuthPost(
        `doctor/${doctorData.userId}/experience`, 
        experienceData, 
        token,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Professional experience added successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to create professional experience' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create professional experience' });
      return false;
    }
  };

  // Delete professional experience via API
  const deleteProfessionalExperience = async (experienceId: string) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await authDelete(
        `doctor/${doctorData.userId}/experience/${experienceId}`, 
        {status: 'inactive'},
        token
      );

      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Professional experience deleted successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete professional experience' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete professional experience' });
      return false;
    }
  };

  // Handle delete professional experience with confirmation
  const handleDeleteProfessionalExperience = (experienceId: string, institution: string) => {
    Alert.alert(
      'Delete Professional Experience',
      `Are you sure you want to delete experience at "${institution}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProfessionalExperience(experienceId);
            // Feedback is already handled in deleteProfessionalExperience function
          }
        }
      ]
    );
  };

  // Create new professional membership via API
  const createProfessionalMembership = async (membershipData: { organization: string; year: string }) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await AuthPost(
        `doctor/${doctorData.userId}/membership`, 
        membershipData, 
        token,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Professional membership added successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to create professional membership' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create professional membership' });
      return false;
    }
  };

  // Delete professional membership via API
  const deleteProfessionalMembership = async (membershipId: string) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await authDelete(
        `doctor/${doctorData.userId}/membership/${membershipId}`, 
        {status: 'inactive'},
        token
      );

      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Professional membership deleted successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete professional membership' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete professional membership' });
      return false;
    }
  };

  // Handle delete professional membership with confirmation
  const handleDeleteProfessionalMembership = (membershipId: string, organization: string) => {
    Alert.alert(
      'Delete Professional Membership',
      `Are you sure you want to delete membership with "${organization}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProfessionalMembership(membershipId);
            // Feedback is already handled in deleteProfessionalMembership function
          }
        }
      ]
    );
  };

  // Handle adding new professional membership
  const handleAddProfessionalMembership = async () => {
    if (!newMembershipForm.organization || !newMembershipForm.year) {
      Toast.show({ 
        type: 'error', 
        text1: 'Validation Error', 
        text2: 'Please fill in all fields' 
      });
      return;
    }

    const currentYear = new Date().getFullYear();
    const yearNum = parseInt(newMembershipForm.year);
    
    if (yearNum < 1900 || yearNum > currentYear) {
      Toast.show({ 
        type: 'error', 
        text1: 'Validation Error', 
        text2: `Year must be between 1900 and ${currentYear}` 
      });
      return;
    }

    const success = await createProfessionalMembership({
      organization: newMembershipForm.organization,
      year: newMembershipForm.year,
    });

    if (success) {
      setNewMembershipForm({ organization: '', year: '' });
      setAddMembershipModalVisible(false);
    }
  };

  // Create new treatment/procedure via API
  const createTreatmentAndProcedure = async (treatmentData: { description: string }) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await AuthPost(
        `doctor/${doctorData.userId}/treatment`, 
        treatmentData, 
        token,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Treatment/Procedure added successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to create treatment/procedure' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to create treatment/procedure' });
      return false;
    }
  };

  // Delete treatment/procedure via API
  const deleteTreatmentAndProcedure = async (treatmentId: string) => {
    if (!token || !doctorData?.userId) return false;
    try {
      const response: any = await authDelete(
        `doctor/${doctorData.userId}/treatment/${treatmentId}`, 
        {status: 'inactive'},
        token
      );

      if (response?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Treatment/Procedure deleted successfully' });
        await fetchDoctorData(); // Refresh the data
        return true;
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete treatment/procedure' });
        return false;
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete treatment/procedure' });
      return false;
    }
  };

  // Handle delete treatment/procedure with confirmation
  const handleDeleteTreatmentAndProcedure = (treatmentId: string, description: string) => {
    Alert.alert(
      'Delete Treatment/Procedure',
      `Are you sure you want to delete "${description}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const success = await deleteTreatmentAndProcedure(treatmentId);
            // Feedback is already handled in deleteTreatmentAndProcedure function
          }
        }
      ]
    );
  };

  // Handle adding new treatment/procedure
  const handleAddTreatmentAndProcedure = async () => {
    if (!newTreatmentForm.description) {
      Toast.show({ 
        type: 'error', 
        text1: 'Validation Error', 
        text2: 'Please enter a treatment/procedure description' 
      });
      return;
    }

    const success = await createTreatmentAndProcedure({
      description: newTreatmentForm.description,
    });

    if (success) {
      setNewTreatmentForm({ description: '' });
      setAddTreatmentModalVisible(false);
    }
  };

  // Handle adding new degree
  const handleAddDegree = async () => {
    if (!newDegreeForm.degree || !newDegreeForm.institute || !newDegreeForm.yearOfPassing) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'All fields are required' });
      return;
    }

    const year = parseInt(newDegreeForm.yearOfPassing);
    if (isNaN(year) || year < 1950 || year > new Date().getFullYear()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter a valid year' });
      return;
    }

    const success = await createDegree({
      degree: newDegreeForm.degree.trim(),
      institute: newDegreeForm.institute.trim(),
      yearOfPassing: newDegreeForm.yearOfPassing,
    });

    if (success) {
      setNewDegreeForm({ degree: '', institute: '', yearOfPassing: '' });
      setAddDegreeModalVisible(false);
    }
  };

  // Handle adding new award
  const handleAddAward = async () => {
    if (!newAwardForm.description || !newAwardForm.year) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'All fields are required' });
      return;
    }

    const year = parseInt(newAwardForm.year);
    if (isNaN(year) || year < 1950 || year > new Date().getFullYear()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter a valid year' });
      return;
    }

    const success = await createAward({
      description: newAwardForm.description.trim(),
      year: newAwardForm.year,
    });

    if (success) {
      setNewAwardForm({ description: '', year: '' });
      setAddAwardModalVisible(false);
    }
  };

  // Handle adding new professional experience
  const handleAddProfessionalExperience = async () => {
    if (!newExperienceForm.institution || !newExperienceForm.fromYear || !newExperienceForm.toYear) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'All fields are required' });
      return;
    }

    const fromYear = parseInt(newExperienceForm.fromYear);
    const toYear = parseInt(newExperienceForm.toYear);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(fromYear) || fromYear < 1950 || fromYear > currentYear) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter a valid from year' });
      return;
    }
    
    if (isNaN(toYear) || toYear < 1950 || toYear > currentYear) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Please enter a valid to year' });
      return;
    }
    
    if (fromYear > toYear) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'From year cannot be greater than to year' });
      return;
    }

    const success = await createProfessionalExperience({
      institution: newExperienceForm.institution.trim(),
      fromYear: newExperienceForm.fromYear,
      toYear: newExperienceForm.toYear,
    });

    if (success) {
      setNewExperienceForm({ institution: '', fromYear: '', toYear: '' });
      setAddExperienceModalVisible(false);
    }
  };

  // Certification functions
  const handleCertificationFilePick = async () => {
    Alert.alert('Upload Certificate', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          try {
            const result = await launchCamera({ mediaType: 'photo', includeBase64: false });
            const asset = result?.assets?.[0];
            if (asset?.uri) {
              setCertificationFile({
                uri: asset.uri,
                name: asset.fileName || 'certificate.jpg',
                type: asset.type || 'image/jpeg',
              });
            }
          } catch {
            Alert.alert('Error', 'Camera access failed.');
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          try {
            const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: false });
            const asset = result?.assets?.[0];
            if (asset?.uri) {
              setCertificationFile({
                uri: asset.uri,
                name: asset.fileName || 'certificate.jpg',
                type: asset.type || 'image/jpeg',
              });
            }
          } catch {
            Alert.alert('Error', 'Gallery access failed.');
          }
        },
      },
      {
        text: 'Upload PDF',
        onPress: async () => {
          try {
            const [res] = await pick({ type: [types.pdf, types.images] });
            if (res?.uri && res?.name) {
              setCertificationFile({
                uri: res.uri,
                name: res.name,
                type: res.type || 'application/pdf',
              });
            }
          } catch {
            Alert.alert('Error', 'File selection failed.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validateCertificationForm = () => {
    const errors = {
      certificationName: '',
      issuingOrganization: '',
      issueDate: '',
      file: '',
    };
    let isValid = true;

    if (!newCertificationForm.certificationName.trim()) {
      errors.certificationName = 'Certification name is required';
      isValid = false;
    } else if (newCertificationForm.certificationName.trim().length < 2) {
      errors.certificationName = 'Certification name must be at least 2 characters';
      isValid = false;
    }

    if (!newCertificationForm.issuingOrganization.trim()) {
      errors.issuingOrganization = 'Issuing organization is required';
      isValid = false;
    } else if (newCertificationForm.issuingOrganization.trim().length < 2) {
      errors.issuingOrganization = 'Issuing organization must be at least 2 characters';
      isValid = false;
    }

    if (!newCertificationForm.issueDate) {
      errors.issueDate = 'Issue date is required';
      isValid = false;
    }

    if (!editCertificationId && !certificationFile) {
      errors.file = 'Certificate file is required';
      isValid = false;
    }

    setCertificationErrors(errors);
    return isValid;
  };

  const handleSaveCertification = async () => {
    if (!validateCertificationForm()) {
      return;
    }

    if (!token || !doctorData?.userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'User ID not found' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('certificationName', newCertificationForm.certificationName.trim());
      formData.append('issuingOrganization', newCertificationForm.issuingOrganization.trim());
      formData.append('issueDate', newCertificationForm.issueDate);
      
      if (newCertificationForm.expiryDate) {
        formData.append('expiryDate', newCertificationForm.expiryDate);
      }
      if (newCertificationForm.credentialId) {
        formData.append('credentialId', newCertificationForm.credentialId.trim());
      }
      if (newCertificationForm.description) {
        formData.append('description', newCertificationForm.description.trim());
      }
      
      if (certificationFile) {
        formData.append('certificationFile', {
          uri: certificationFile.uri,
          name: certificationFile.name,
          type: certificationFile.type || 'image/jpeg',
        } as any);
      }

      let response: any;
      if (editCertificationId) {
        // Update existing certification
        response = await UpdateFiles(
          `doctor/${doctorData.userId}/certification/${editCertificationId}`,
          formData,
          token
        );
      } else {
        // Create new certification
        response = await UploadFiles(
          `doctor/${doctorData.userId}/certification`,
          formData,
          token
        );
      }

      if (response?.status === 'success') {
        Toast.show({ 
          type: 'success', 
          text1: 'Success', 
          text2: editCertificationId ? 'Certification updated successfully' : 'Certification added successfully' 
        });
        setAddCertificationModalVisible(false);
        setNewCertificationForm({
          certificationName: '',
          issuingOrganization: '',
          issueDate: '',
          expiryDate: '',
          credentialId: '',
          description: '',
        });
        setCertificationFile(null);
        setEditCertificationId(null);
        setCertificationErrors({
          certificationName: '',
          issuingOrganization: '',
          issueDate: '',
          file: '',
        });
        await fetchCertifications();
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to save certification' });
      }
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: error?.response?.data?.message || error.message || 'Failed to save certification' 
      });
    }
  };

const handleEditCertification = (cert: Certification) => {
    setEditCertificationId(cert._id);
    setNewCertificationForm({
      certificationName: cert.certificationName,
      issuingOrganization: cert.issuingOrganization,
      issueDate: cert.issueDate ? moment(cert.issueDate).format('YYYY-MM-DD') : '',
      expiryDate: cert.expiryDate ? moment(cert.expiryDate).format('YYYY-MM-DD') : '',
      credentialId: cert.credentialId || '',
      description: cert.description || '',
    });
    setCertificationFile(null);
    setAddCertificationModalVisible(true);
  };

  const handleViewCertification = async (cert: Certification) => {
    try {
      // Fetch the certification details with signed URL if needed
      const response: any = await AuthFetch(
        `doctor/${doctorData?.userId}/certification/${cert._id}`,
        token
      );
      console.log("35645",response)
      
      const certData = response?.data?.data || cert;
      
      showDocModal({
        type: 'Certification',
        data: certData.fileUrl || cert.fileUrl,
        certDetails: {
          certificationName: certData.certificationName,
          issuingOrganization: certData.issuingOrganization,
          issueDate: certData.issueDate,
          expiryDate: certData.expiryDate,
          credentialId: certData.credentialId,
          description: certData.description,
          fileName: certData.fileName,
        },
      });
    } catch (error) {
      // Fallback to basic view
      showDocModal({
        type: 'Certification',
        data: cert.fileUrl,
        certDetails: {
          certificationName: cert.certificationName,
          issuingOrganization: cert.issuingOrganization,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          credentialId: cert.credentialId,
          description: cert.description,
        },
      });
    }
  };

  const handleDeleteCertification = async (certId: string, certName: string) => {
    Alert.alert(
      'Delete Certification',
      `Are you sure you want to delete "${certName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token || !doctorData?.userId) return;
            try {
              const response: any = await authDelete(
                `doctor/${doctorData.userId}/certification/${certId}`,
                { status: 'inactive' },
                token
              );

              if (response?.status === 'success') {
                Toast.show({ type: 'success', text1: 'Success', text2: 'Certification deleted successfully' });
                await fetchCertifications();
              } else {
                Toast.show({ type: 'error', text1: 'Error', text2: response?.message || 'Failed to delete certification' });
              }
            } catch (error: any) {
              Toast.show({ type: 'error', text1: 'Error', text2: error.message || 'Failed to delete certification' });
            }
          },
        },
      ]
    );
  };

  // ── Certification date picker handlers ───────────────────────────────────────
  const openCertIssueDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowCertIssueDatePicker(true);
    } else {
      setCertCalendarCurrentDate(
        newCertificationForm.issueDate
          ? moment(newCertificationForm.issueDate, 'YYYY-MM-DD').toDate()
          : new Date()
      );
      setShowCertIssueCalendar(true);
    }
  };

  const openCertExpiryDatePicker = () => {
    if (Platform.OS === 'android') {
      setShowCertExpiryDatePicker(true);
    } else {
      setCertCalendarCurrentDate(
        newCertificationForm.expiryDate
          ? moment(newCertificationForm.expiryDate, 'YYYY-MM-DD').toDate()
          : new Date()
      );
      setShowCertExpiryCalendar(true);
    }
  };

  const handleCertIssueDateAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowCertIssueDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    const iso = moment(selectedDate).format('YYYY-MM-DD');
    setNewCertificationForm(s => ({ ...s, issueDate: iso }));
    setCertificationErrors(e => ({ ...e, issueDate: '' }));
  };

  const handleCertExpiryDateAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowCertExpiryDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;
    const iso = moment(selectedDate).format('YYYY-MM-DD');
    setNewCertificationForm(s => ({ ...s, expiryDate: iso }));
  };

  const handleCertIssueDateIOS = (selectedDate: Date) => {
    const iso = moment(selectedDate).format('YYYY-MM-DD');
    setNewCertificationForm(s => ({ ...s, issueDate: iso }));
    setCertificationErrors(e => ({ ...e, issueDate: '' }));
    setShowCertIssueCalendar(false);
  };

  const handleCertExpiryDateIOS = (selectedDate: Date) => {
    const iso = moment(selectedDate).format('YYYY-MM-DD');
    setNewCertificationForm(s => ({ ...s, expiryDate: iso }));
    setShowCertExpiryCalendar(false);
  };

  // ---------- Render helpers ----------
  const degreesDisplay = useMemo(() => {
    // First check if doctorProfile has degrees array
    if (doctorData?.doctorProfile?.degrees && Array.isArray(doctorData.doctorProfile.degrees)) {
      // Filter for active degrees only
      return doctorData.doctorProfile.degrees
        .filter(degree => degree.status === 'active')
        .map(degree => degree.degree);
    }
    
    // Fallback to specialization degree (existing logic)
    const d = doctorData?.specialization?.[0]?.degree || '';
    const list = String(d).split(',').map((s) => s.trim()).filter(Boolean);
    return list;
  }, [doctorData]);

  const awardsDisplay = useMemo(() => {
    // Check if doctorProfile has awardsAndRecognitions array
    if (doctorData?.doctorProfile?.awardsAndRecognitions && Array.isArray(doctorData.doctorProfile.awardsAndRecognitions)) {
      // Filter for active awards only
      return doctorData.doctorProfile.awardsAndRecognitions
        .filter(award => award.status === 'active')
        .sort((a, b) => b.year - a.year); // Sort by year descending
    }
    
    return [];
  }, [doctorData]);

  const professionalExperienceDisplay = useMemo(() => {
    // Check if doctorProfile has professionalExperience array
    if (doctorData?.doctorProfile?.professionalExperience && Array.isArray(doctorData.doctorProfile.professionalExperience)) {
      // Filter for active experience only
      return doctorData.doctorProfile.professionalExperience
        .filter(exp => exp.status === 'active')
        .sort((a, b) => parseInt(b.toYear) - parseInt(a.toYear)); // Sort by toYear descending
    }
    
    return [];
  }, [doctorData]);

  const professionalMembershipsDisplay = useMemo(() => {
    // Check if doctorProfile has professionalMemberships array
    if (doctorData?.doctorProfile?.professionalMemberships && Array.isArray(doctorData.doctorProfile.professionalMemberships)) {
      // Filter for active memberships only
      return doctorData.doctorProfile.professionalMemberships
        .filter(membership => membership.status === 'active')
        .sort((a, b) => parseInt(b.year) - parseInt(a.year)); // Sort by year descending
    }
    
    return [];
  }, [doctorData]);

  const treatmentsAndProceduresDisplay = useMemo(() => {
    // Check if doctorProfile has treatmentsAndProceduresOffered array
    if (doctorData?.doctorProfile?.treatmentsAndProceduresOffered && Array.isArray(doctorData.doctorProfile.treatmentsAndProceduresOffered)) {
      // Filter for active treatments only
      return doctorData.doctorProfile.treatmentsAndProceduresOffered
        .filter(treatment => treatment.status === 'active')
        .sort((a, b) => a.description.localeCompare(b.description)); // Sort alphabetically
    }
    
    return [];
  }, [doctorData]);

  // Certifications display comes directly from the certifications state (fetched from dedicated API)
  const certificationsDisplay = useMemo(() => {
    return certifications
      .filter(cert => cert.status && cert.status.toLowerCase() === 'active')
      .sort((a, b) => a.certificationName.localeCompare(b.certificationName));
  }, [certifications]);

  const specializationsDisplay = useMemo(() => {
    const n = doctorData?.specialization?.[0]?.name || '';
    return String(n).split(',').map((s) => s.trim()).filter(Boolean);
  }, [doctorData]);

  const filteredDegrees = useMemo(() => {
    const q = degreeSearchText.trim().toLowerCase();
    if (!q) return degrees;
    return degrees.filter(d => d.toLowerCase().includes(q));
  }, [degreeSearchText, degrees]);

  // ---------- Language selection helpers ----------
  const openLanguageSelector = () => {
    // iOS: native ActionSheet
    if (Platform.OS === 'ios') {
      const options = languageOptions.map(o => o.label).concat('Cancel');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex === options.length - 1) return;
          const selected = languageOptions[buttonIndex].value;
          if (selected && !formPersonal.spokenLanguage.includes(selected)) {
            setFormPersonal(s => ({ ...s, spokenLanguage: [...s.spokenLanguage, selected] }));
          }
        }
      );
      return;
    }
    // Android: show inline modal with Picker
    setLanguagePickerVisible(true);
  };

  const onAndroidLanguagePick = (value: string) => {
    if (value && !formPersonal.spokenLanguage.includes(value)) {
      setFormPersonal(s => ({ ...s, spokenLanguage: [...s.spokenLanguage, value] }));
    }
    setLanguagePickerVisible(false);
  };

  // Update the openDegreeModal function
  const openDegreeModal = () => {
    if (Platform.OS === 'ios') {
      // iOS: Use native ActionSheet
      const degreeOptions = degrees.map(d => d);
      const options = [...degreeOptions, 'Cancel'];

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Select Degree',
          message: 'Choose one or more degrees',
        },
        (buttonIndex) => {
          if (buttonIndex < degreeOptions.length) {
            const selectedDegree = degreeOptions[buttonIndex];
            if (selectedDegree && !formProfessional.selectedDegrees.includes(selectedDegree)) {
              setFormProfessional(s => ({
                ...s,
                selectedDegrees: Array.from(new Set([...(s.selectedDegrees || []), selectedDegree])),
              }));
            }
          }
        }
      );
    } else {
      // Android: Use the custom modal
      setDegreeModalVisible(true);
      setDegreeSearchText('');
    }
  };

  const onSelectDegree = (degree: string) => {
    setFormProfessional(s => ({
      ...s,
      selectedDegrees: Array.from(new Set([...(s.selectedDegrees || []), degree])),
    }));
    setDegreeModalVisible(false);
  };

  // ---------- UI ----------

  if (loading && !doctorData) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading Profile details...</Text>
      </SafeAreaView>
    );
  }

  // if (!doctorData) {
  //   return (
  //     <SafeAreaView style={styles.centerContainer}>
  //       <Text style={styles.noDataText}>No doctor data available</Text>
  //     </SafeAreaView>
  //   );
  // }

  const showEditButtonKYC = !kycServer?.pan?.number;
  const avatarSrc = currentuserDetails?.profilepic || doctorData?.profilepic;

  return (
    <SafeAreaView style={styles.safeArea}>
      <CommonHeader title="Profile" />
      <ScrollView style={styles.container}>

        <View style={styles.row}>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <PersonIcon size={ICON_SIZE.sm} color="#3b82f6" />
                <Text style={styles.cardTitle}>Personal Information</Text>
              </View>
              <TouchableOpacity onPress={() => handleEditOpen('personal')}>
                {role === "doctor" && <EditIcon size={ICON_SIZE.md} color="#3b82f6" />}
              </TouchableOpacity>
            </View>

            <View style={styles.avatarContainer}>
              {avatarSrc ? (
                <Image
                  source={{ uri: avatarSrc }}
                  style={{
                    width: responsiveWidth(15),
                    height: responsiveWidth(15),
                    borderRadius: responsiveWidth(7.5),
                    backgroundColor: '#ccc',
                    marginBottom: SPACING.sm,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: responsiveWidth(15),
                    height: responsiveWidth(15),
                    borderRadius: responsiveWidth(7.5),
                    backgroundColor: '#1E88E5',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: SPACING.sm,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: responsiveText(24), fontWeight: 'bold' }}>
                    {(doctorData?.firstname?.[0] ?? 'D').toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.doctorName}>{currentuserDetails?.role === 'doctor' && 'Dr. '}{doctorData?.firstname} {doctorData?.lastname}</Text>
            </View>

            <View style={styles.infoSection}>

              <View style={styles.infoItem}>
                <PhoneIcon size={ICON_SIZE.sm} color="#333" />
                <Text style={styles.infoText}><Text style={styles.bold}>Mobile Number:</Text> {doctorData?.mobile}</Text>
              </View>
              <View style={styles.infoItem}>
                <PersonIcon size={ICON_SIZE.sm} color="#333" />
                <Text style={styles.infoText}><Text style={styles.bold}>Gender:</Text> {doctorData?.gender}</Text>
              </View>
              <View style={styles.infoItem}>
                <MailIcon size={ICON_SIZE.sm} color="#333" />
                <Text style={styles.infoText}><Text style={styles.bold}>Email:</Text> {doctorData?.email}</Text>
              </View>
              <View style={styles.infoItem}>
                <PhoneIcon size={ICON_SIZE.sm} color="#333" />
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>WhatsApp Name:</Text>{' '}
                  {(doctorData as any)?.whatsappDisplayName || '  --'}
                </Text>
              </View>
            </View>
            {role === 'doctor' &&
              <View style={styles.infoSection}>
                <Text style={[styles.infoText, styles.bold]}>Languages:</Text>
                <View style={styles.tagsContainer}>
                  {(doctorData?.spokenLanguage || []).length > 0 ? (
                    doctorData?.spokenLanguage?.map((lang, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{lang}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No languages added</Text>
                  )}
                </View>
              </View>}
          </View>

          {currentuserDetails?.role === 'doctor' &&
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MedicalSuitcaseIcon size={ICON_SIZE.sm} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Professional Summary</Text>
                </View>
                <TouchableOpacity onPress={() => handleEditOpen('professional')}>
                  <EditIcon size={ICON_SIZE.md} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoText}><Text style={styles.bold}>Medical Registration:</Text> {doctorData?.medicalRegistrationNumber}</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoText}><Text style={styles.bold}>State Medical Council:</Text> TSMC</Text>
                </View>

                <Text style={[styles.infoText, styles.bold, styles.sectionTitle]}>Specializations</Text>
                <View style={styles.tagsContainer}>
                  {specializationsDisplay.length > 0 ? (
                    specializationsDisplay.map((spec, idx) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{spec}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No specializations added</Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoText}>
                    <Text style={styles.bold}>Work Experience:</Text> {doctorData?.specialization?.[0]?.experience || 0} Years
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoText}>
                    <Text style={styles.bold}>About:</Text> {doctorData?.specialization?.[0]?.bio || 'Not Mentioned'}
                  </Text>
                </View>

                {/* <Text style={[styles.infoText, styles.bold, styles.sectionTitle]}>Certifications</Text> */}
                {doctorData?.certifications.length > 0 ? (
                  doctorData?.certifications.map((cert, index) => (
                    <View key={index} style={styles.certificationItem}>

                      <View style={styles.certificationActions}>
                        {!!cert.image && (
                          <TouchableOpacity style={styles.viewButton} onPress={() => showDocModal({ type: 'Specialization Certificate', data: cert.image })}>
                            <Text style={styles.viewButtonText}>View Certificate</Text>
                          </TouchableOpacity>
                        )}
                        {!!cert.degreeCertificate && (
                          <TouchableOpacity style={styles.viewButton} onPress={() => showDocModal({ type: 'Degree Certificate', data: cert.degreeCertificate })}>
                            <Text style={styles.viewButtonText}>View Degree</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No certifications added</Text>
                )}
              </View>
            </View>
          }

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <BookIcon size={ICON_SIZE.sm} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Academic Degrees</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setAddDegreeModalVisible(true)}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEditOpen('professional')}>
                    <EditIcon size={ICON_SIZE.md} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>

              {doctorData?.doctorProfile?.degrees && Array.isArray(doctorData.doctorProfile.degrees) ? (
                doctorData.doctorProfile.degrees
                  .filter(degree => degree.status === 'active')
                  .length > 0 ? (
                  doctorData.doctorProfile.degrees
                    .filter(degree => degree.status === 'active')
                    .map((deg, idx) => (
                      <View key={idx} style={styles.degreeCard}>
                        <View style={styles.degreeCardContent}>
                          <View style={styles.degreeCardInfo}>
                            <Text style={styles.degreeTitle}>{deg.degree}</Text>
                            <Text style={styles.degreeInstitute}>{deg.institute}</Text>
                            <Text style={styles.degreeYear}>Year of Passing: {deg.yearOfPassing}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.degreeDeleteButton}
                            onPress={() => handleDeleteDegree(deg._id, deg.degree)}
                          >
                            <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                ) : (
                  <Text style={styles.noDataText}>No active degrees found</Text>
                )
              ) : degreesDisplay.length > 0 ? (
                <View style={styles.tagsContainer}>
                  {degreesDisplay.map((deg, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{deg}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>No degrees added</Text>
              )}
            </View>
          )}

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <TrophyIcon size={ICON_SIZE.sm} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Awards & Recognitions</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setAddAwardModalVisible(true)}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              </View>

              {awardsDisplay.length > 0 ? (
                awardsDisplay.map((award, idx) => (
                  <View key={idx} style={styles.awardCard}>
                    <View style={styles.awardCardContent}>
                      <View style={styles.awardCardInfo}>
                        <Text style={styles.awardDescription}>{award.description}</Text>
                        <Text style={styles.awardYear}>Year: {award.year}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.awardDeleteButton}
                        onPress={() => handleDeleteAward(award._id, award.description)}
                      >
                        <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No awards added</Text>
              )}
            </View>
          )}

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <StaffManagementIcon size={ICON_SIZE.sm} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Professional Experience</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setAddExperienceModalVisible(true)}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              </View>

              {professionalExperienceDisplay.length > 0 ? (
                professionalExperienceDisplay.map((experience, idx) => (
                  <View key={idx} style={styles.experienceCard}>
                    <View style={styles.experienceCardContent}>
                      <View style={styles.experienceCardInfo}>
                        <Text style={styles.experienceInstitution}>{experience.institution}</Text>
                        <Text style={styles.experienceDuration}>{experience.fromYear} - {experience.toYear}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.experienceDeleteButton}
                        onPress={() => handleDeleteProfessionalExperience(experience._id, experience.institution)}
                      >
                        <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No professional experience added</Text>
              )}
            </View>
          )}

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <PersonInCardIcon size={ICON_SIZE.sm} color="#8b5cf6" />
                  <Text style={styles.cardTitle}>Professional Memberships</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setAddMembershipModalVisible(true)}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              </View>

              {professionalMembershipsDisplay.length > 0 ? (
                professionalMembershipsDisplay.map((membership, idx) => (
                  <View key={idx} style={styles.membershipCard}>
                    <View style={styles.membershipCardContent}>
                      <View style={styles.membershipCardInfo}>
                        <Text style={styles.membershipOrganization}>{membership.organization}</Text>
                        <Text style={styles.membershipYear}>Member since: {membership.year}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.membershipDeleteButton}
                        onPress={() => handleDeleteProfessionalMembership(membership._id, membership.organization)}
                      >
                        <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No professional memberships added</Text>
              )}
            </View>
          )}

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <MedicalSuitcaseIcon size={ICON_SIZE.sm} color="#f59e0b" />
                  <Text style={styles.cardTitle}>Treatments & Procedures</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setAddTreatmentModalVisible(true)}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              </View>

              {treatmentsAndProceduresDisplay.length > 0 ? (
                treatmentsAndProceduresDisplay.map((treatment, idx) => (
                  <View key={idx} style={styles.treatmentCard}>
                    <View style={styles.treatmentCardContent}>
                      <View style={styles.treatmentCardInfo}>
                        <Text style={styles.treatmentDescription}>{treatment.description}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.treatmentDeleteButton}
                        onPress={() => handleDeleteTreatmentAndProcedure(treatment._id, treatment.description)}
                      >
                        <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No treatments or procedures added</Text>
              )}
            </View>
          )}

          {currentuserDetails?.role === 'doctor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <BookIcon size={ICON_SIZE.sm} color="#0d9488" />
                  <Text style={styles.cardTitle}>Certifications</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => {
                      setEditCertificationId(null);
                      setNewCertificationForm({
                        certificationName: '',
                        issuingOrganization: '',
                        issueDate: '',
                        expiryDate: '',
                        credentialId: '',
                        description: '',
                      });
                      setCertificationFile(null);
                      setAddCertificationModalVisible(true);
                    }}
                    style={{ marginRight: moderateScale(8) }}
                  >
                    <AddIcon size={ICON_SIZE.md} color="#16a34a" />
                  </TouchableOpacity>
                </View>
              </View>

              {certificationsDisplay.length > 0 ? (
                certificationsDisplay.map((cert, idx) => (
                  <View key={idx} style={styles.certificationCard}>
                    <View style={styles.certificationCardContent}>
                      <View style={styles.certificationCardInfo}>
                        <Text style={styles.certificationName}>{cert.certificationName}</Text>
                        <Text style={styles.certificationIssuer}>{cert.issuingOrganization}</Text>
                        {cert.issueDate && (
                          <Text style={styles.certificationDate}>
                            Issued: {moment(cert.issueDate).format('DD MMM YYYY')}
                          </Text>
                        )}
                        {cert.expiryDate && (
                          <Text style={styles.certificationDate}>
                            Expires: {moment(cert.expiryDate).format('DD MMM YYYY')}
                          </Text>
                        )}
                        {cert.credentialId && (
                          <Text style={styles.certificationCredential}>ID: {cert.credentialId}</Text>
                        )}
                      </View>
                      <View style={styles.certificationActions}>
                        <TouchableOpacity 
                          style={styles.certificationViewButton}
                          onPress={() => handleViewCertification(cert)}
                        >
                          <EyeOpenIcon size={ICON_SIZE.sm} color="#0d9488" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.certificationEditButton}
                          onPress={() => handleEditCertification(cert)}
                        >
                          <EditIcon size={ICON_SIZE.sm} color="#0d9488" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.certificationDeleteButton}
                          onPress={() => handleDeleteCertification(cert._id, cert.certificationName)}
                        >
                          <DeleteAccountIcon size={ICON_SIZE.sm} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>No certifications added</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.row}>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <PersonInCardIcon size={ICON_SIZE.sm} color="#3b82f6" />
                <Text style={styles.cardTitle}>KYC Details</Text>
              </View>
              {showEditButtonKYC && (
                <TouchableOpacity onPress={() => handleEditOpen('kyc')}>
                  <EditIcon size={ICON_SIZE.md} color="#3b82f6" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.kycItem}>
              <View style={styles.kycInfo}>
                <PersonInCardIcon size={ICON_SIZE.sm} color="#333" />
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>PAN Number:</Text> {kycServer?.pan?.number || doctorData?.kycDetails?.panNumber || 'N/A'}
                </Text>
              </View>
              {!!kycServer?.pan?.attachmentUrl && (
                <View style={styles.kycButtonContainer}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => showDocModal({ type: 'PAN', data: kycServer.pan.attachmentUrl })}
                  >
                    <Text style={styles.viewButtonText}>View PAN</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.row}>

          {currentuserDetails?.role === 'doctor' &&
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                  <AmountIcon size={ICON_SIZE.sm} color="#3b82f6" />
                  <Text style={styles.cardTitle}>Consultation Charges</Text>
                </View>
                <TouchableOpacity onPress={() => handleEditOpen('consultation')}>
                  <EditIcon size={ICON_SIZE.md} color="#3b82f6" />
                </TouchableOpacity>
              </View>

              {(doctorData?.consultationModeFee || []).map((mode, idx) => (
                <View key={idx} style={styles.consultationCard}>
                  <View style={styles.consultationInfo}>
                    {mode.type?.toLowerCase() === 'in-person' && <PersonIcon size={ICON_SIZE.sm} color="#3b82f6" />}
                    {mode.type?.toLowerCase() === 'video' && <VideoIcon size={ICON_SIZE.sm} color="#16a34a" />}
                    {mode.type?.toLowerCase() === 'home visit' && <HomeIcon size={ICON_SIZE.sm} color="#9333ea" />}
                    <View>
                      <Text style={[styles.infoText, styles.bold]}>{mode.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.consultationPrice}>
                    {mode.currency || '₹'} {mode.fee}
                  </Text>
                </View>
              ))}
            </View>}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <BankIcon size={ICON_SIZE.sm} color="#3b82f6" />
                <Text style={styles.cardTitle}>Bank Details</Text>
              </View>
                <TouchableOpacity onPress={() => handleEditOpen('bank')}>
                  <EditIcon size={ICON_SIZE.md} color="#3b82f6" />
                </TouchableOpacity>
            </View>

            <View style={styles.bankDetails}>
              <View style={styles.bankItem}>
                <Text style={styles.infoText}><Text style={styles.bold}>Bank:</Text> {doctorData?.bankDetails?.bankName || 'N/A'}</Text>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.infoText}><Text style={styles.bold}>Account Holder:</Text> {doctorData?.bankDetails?.accountHolderName || 'N/A'}</Text>
              </View>
              <View style={styles.bankItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <Text style={styles.infoText}><Text style={styles.bold}>Account Number:</Text> {doctorData?.bankDetails?.accountNumber || 'N/A'}</Text>
                {!!doctorData?.bankDetails?.accountProof && (
                  <TouchableOpacity onPress={() => showDocModal({ type: 'Account Proof', data: doctorData?.bankDetails.accountProof })}>
                    <EyeOpenIcon size={ICON_SIZE.md} color="#3b82f6" />
                  </TouchableOpacity>
                )}
                </View>
              </View>
              <View style={styles.bankItem}>
                <Text style={styles.infoText}><Text style={styles.bold}>Bank IFSC:</Text> {doctorData?.bankDetails?.ifscCode || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Document Preview Modal */}
<Modal visible={isDocModalVisible} transparent animationType="fade" onRequestClose={closeDocModal}>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      {/* Header with X - fixed at top */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: responsiveWidth(4) }}>
        <Text style={[styles.modalTitle, { marginBottom: 0 }]}>{selectedDocument?.type || 'Document'}</Text>
        <TouchableOpacity onPress={closeDocModal} style={{ padding: moderateScale(4) }}>
          <CloseXIcon size={ICON_SIZE.md} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Certification Details Card */}
        {selectedDocument?.certDetails && (
          <View style={styles.certDetailsContainer}>
            {selectedDocument.certDetails.certificationName && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Certification Name:</Text>
                <Text style={styles.certDetailValue}>{selectedDocument.certDetails.certificationName}</Text>
              </View>
            )}
            {selectedDocument.certDetails.issuingOrganization && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Issuing Organization:</Text>
                <Text style={styles.certDetailValue}>{selectedDocument.certDetails.issuingOrganization}</Text>
              </View>
            )}
            {selectedDocument.certDetails.issueDate && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Issue Date:</Text>
                <Text style={styles.certDetailValue}>
                  {moment(selectedDocument.certDetails.issueDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
            {selectedDocument.certDetails.expiryDate && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Expiry Date:</Text>
                <Text style={styles.certDetailValue}>
                  {moment(selectedDocument.certDetails.expiryDate).format('DD MMM YYYY')}
                </Text>
              </View>
            )}
            {selectedDocument.certDetails.credentialId && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Credential ID:</Text>
                <Text style={styles.certDetailValue}>{selectedDocument.certDetails.credentialId}</Text>
              </View>
            )}
            {selectedDocument.certDetails.description && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>Description:</Text>
                <Text style={styles.certDetailValue}>{selectedDocument.certDetails.description}</Text>
              </View>
            )}
            {selectedDocument.certDetails.fileName && (
              <View style={styles.certDetailRow}>
                <Text style={styles.certDetailLabel}>File Name:</Text>
                <Text style={styles.certDetailValue}>{selectedDocument.certDetails.fileName}</Text>
              </View>
            )}
          </View>
        )}

        {/* File Preview */}
        {selectedDocument?.data ? (
          selectedDocument.fileType === 'pdf' ? (
            <View style={styles.pdfPlaceholder}>
              <Text style={styles.pdfText}>PDF File: {selectedDocument.certDetails?.fileName || 'document.pdf'}</Text>
              <TouchableOpacity
                style={styles.openPdfButton}
                onPress={() => {
                  Alert.alert('Open PDF', 'Would you like to open this PDF?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open', onPress: () => console.log('Open PDF:', selectedDocument.data) }
                  ]);
                }}
              >
                <Text style={styles.openPdfButtonText}>Open PDF</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Image
              source={{ uri: selectedDocument.data }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )
        ) : (
          <Text style={styles.noDataText}>No file available for preview.</Text>
        )}

      </ScrollView>

    </View>
  </View>
</Modal>

        {/* Edit Modals */}
        <Modal visible={editModalType === 'personal'} transparent animationType="slide" onRequestClose={handleEditClose}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Personal Details</Text>
              <ScrollView style={styles.formContainer}>

                <View style={styles.profilePhotoContainerInline}>
                  <View style={styles.profileWrapperInline}>
                    {profileImage?.uri ? (
                      <Image
                        source={{ uri: profileImage.uri }}
                        style={styles.profilePhotoInline}
                        resizeMode="cover"
                      />
                    ) : avatarSrc ? (
                      <Image
                        source={{ uri: avatarSrc }}
                        style={styles.profilePhotoInline}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.profilePhotoInline, styles.placeholderAvatarInline]}>
                        <Text style={{ color: '#fff', fontSize: responsiveText(18), fontWeight: 'bold' }}>
                          {(doctorData?.firstname?.[0] ?? 'D').toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.fabCameraInline}
                      onPress={handleProfileImagePick}
                      activeOpacity={0.85}
                    >
                      <CameraIcon size={ICON_SIZE.xs} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.photoHintTextInline}>Tap the camera to change profile photo</Text>
                  {profileUploaded && <Text style={styles.successText}>Selected: {profileImage?.name}</Text>}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formPersonal.firstname}
                    onChangeText={(v) => setFormPersonal((s) => ({ ...s, firstname: v.replace(/[^A-Za-z\s]/g, '') }))}
                    placeholder="Enter first name"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formPersonal.lastname}
                    onChangeText={(v) => setFormPersonal((s) => ({ ...s, lastname: v.replace(/[^A-Za-z\s]/g, '') }))}
                    placeholder="Enter last name"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={formPersonal.email}
                    onChangeText={(v) => setFormPersonal((s) => ({ ...s, email: v }))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="Enter email address"
                    placeholderTextColor="#888"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>WhatsApp Display Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formPersonal.whatsappDisplayName}
                    onChangeText={(v) =>
                      setFormPersonal((s) => ({
                        ...s,
                        whatsappDisplayName: v.replace(/[^A-Za-z\s]/g, '').slice(0, 50),
                      }))
                    }
                    placeholder="Enter WhatsApp display name"
                    placeholderTextColor="#888"
                    maxLength={50}
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Languages</Text>

                  <TouchableOpacity onPress={openLanguageSelector} style={[styles.pickerOutline, {
                    justifyContent: 'center',
                    paddingHorizontal: moderateScale(10),
                    height: responsiveHeight(6),
                    borderWidth: 1,
                    borderColor: '#B0BEC5',
                    borderRadius: moderateScale(6),
                    backgroundColor: '#fff',
                  }]}>
                    <Text style={{
                      color: formPersonal.spokenLanguage.length > 0 ? '#000' : '#888',
                      fontSize: FONT_SIZE.md,
                    }}>
                      {formPersonal.spokenLanguage.length > 0 ?
                        `Selected: ${formPersonal.spokenLanguage.join(', ')}` :
                        'Tap to select languages'
                      }
                    </Text>
                  </TouchableOpacity>

                  <Modal visible={languagePickerVisible} transparent animationType="fade" onRequestClose={() => setLanguagePickerVisible(false)}>
                    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                      <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Select Language</Text>
                        <Picker
                          selectedValue={''}
                          onValueChange={(v) => onAndroidLanguagePick(v)}
                        >
                          <Picker.Item label="Select a language" value="" />
                          {languageOptions.map((opt) => (
                            <Picker.Item key={opt.value} label={opt.label} value={opt.value} enabled={!formPersonal.spokenLanguage.includes(opt.value)} />
                          ))}
                        </Picker>

                        <TouchableOpacity onPress={() => setLanguagePickerVisible(false)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
                          <Text>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>

                  {formPersonal.spokenLanguage.length > 0 && (
                    <>
                      <Text style={[styles.label, { marginTop: SPACING.sm }]}>Selected Languages:</Text>
                      <View style={styles.tagsContainer}>
                        {formPersonal.spokenLanguage.map((lang, index) => (
                          <View key={index} style={[styles.tag, { marginBottom: SPACING.sm }]}>
                            <Text style={styles.tagText}>{lang}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                setFormPersonal((s) => ({
                                  ...s,
                                  spokenLanguage: s.spokenLanguage.filter((l) => l !== lang),
                                }));
                              }}
                              style={{ marginLeft: moderateScale(6), padding: moderateScale(2) }}
                            >
                              <CloseXIcon size={ICON_SIZE.xs} color="#D32F2F" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleEditClose}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={savePersonal}>
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={editModalType === 'professional'} transparent animationType="slide" onRequestClose={() => handleEditClose()}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Professional Details</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Degrees</Text>
                  <TouchableOpacity
                    style={[styles.pickerOutline, {
                      justifyContent: 'center',
                      paddingHorizontal: moderateScale(10),
                      height: responsiveHeight(6),
                      borderWidth: 1,
                      borderColor: '#B0BEC5',
                      borderRadius: moderateScale(6),
                      backgroundColor: '#fff',
                    }]}
                    onPress={openDegreeModal}
                  >
                    <Text style={{
                      color: formProfessional.selectedDegrees.length > 0 ? '#000' : '#888',
                      fontSize: FONT_SIZE.md,
                    }}>
                      {formProfessional.selectedDegrees.length > 0 ?
                        formProfessional.selectedDegrees.join(', ') :
                        'Tap to select degrees'
                      }
                    </Text>
                  </TouchableOpacity>

                  <View style={{ marginTop: 8 }}>
                    <Text style={[styles.label, { marginTop: SPACING.sm }]}>Selected Degrees:</Text>
                    <View style={styles.tagsContainer}>
                      {formProfessional.selectedDegrees.map((d, idx) => (
                        <View key={idx} style={[styles.tag]}>
                          <Text style={styles.tagText}>{d}</Text>
                          <TouchableOpacity onPress={() =>
                            setFormProfessional(s => ({
                              ...s,
                              selectedDegrees: s.selectedDegrees.filter(x => x !== d)
                            }))} style={{ marginLeft: moderateScale(6), padding: moderateScale(2) }}>
                            <CloseXIcon size={ICON_SIZE.xs} color="#D32F2F" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Experience (years)</Text>
                  <TextInput style={styles.input} value={formProfessional.experience} onChangeText={(v) => setFormProfessional(s => ({ ...s, experience: v.replace(/[^0-9.]/g, '') }))} keyboardType="numeric" placeholder="Enter experience" />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>About</Text>
                  <TextInput style={[styles.input, { height: responsiveHeight(20) }]} value={formProfessional.about} onChangeText={(v) => setFormProfessional(s => ({ ...s, about: v }))} multiline placeholder="Short bio" />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => handleEditClose()}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveProfessional}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {Platform.OS === 'android' && (
          <Modal visible={degreeModalVisible} transparent animationType="fade" onRequestClose={() => setDegreeModalVisible(false)}>
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
              <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 8, maxHeight: '80%', paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
                  <Text style={{ fontWeight: 'bold' }}>Select Degree</Text>
                  <TouchableOpacity onPress={() => setDegreeModalVisible(false)}><Text>Close</Text></TouchableOpacity>
                </View>
                <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                  <TextInput placeholder="Search degrees..." value={degreeSearchText} onChangeText={setDegreeSearchText} style={[styles.input, { marginBottom: 8 }]} />
                </View>
                <FlatList
                  data={filteredDegrees}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onSelectDegree(item)} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  )}
                  style={{ paddingHorizontal: 8 }}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </View>
          </Modal>
        )}

        <Modal visible={editModalType === 'kyc'} transparent animationType="slide" onRequestClose={handleEditClose}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add KYC Details</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>PAN Number</Text>
                  <TextInput
                    style={styles.input}
                    value={panNumber}
                    onChangeText={(v) => setPanNumber(v.replace(/[^A-Z0-9]/g, '').toUpperCase().slice(0, 10))}
                    maxLength={10}
                    autoCapitalize="characters"
                    placeholder="Enter PAN number (e.g., ABCDE1234F)"
                    placeholderTextColor="#888"
                  />
                </View>

                <Text style={styles.label}>Upload Pancard Proof</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={handlePancardUpload}>
                  <PersonInCardIcon size={SCREEN_WIDTH * 0.08} color="#00203F" />
                  <Text style={styles.uploadText}>Upload</Text>
                  <Text style={styles.acceptedText}>Accepted: PDF, JPG, PNG</Text>
                </TouchableOpacity>
                {pancardUploaded && (
                  <Text style={styles.successText}>File: {panImage?.name || 'Pancard uploaded successfully!'}</Text>
                )}
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleEditClose}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveKYC}>
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={editModalType === 'consultation'} transparent animationType="slide" onRequestClose={handleEditClose}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Consultation Charges</Text>

              <ScrollView style={styles.formContainer}>
                {(formConsultation || []).map((row, idx) => {
                  const active = row.active ?? Number(row.fee) > 0;

                  return (
                    <View
                      key={idx}
                      style={[
                        styles.consultationRow,
                        { borderBottomColor: '#eee', borderBottomWidth: 1, flexDirection: 'row', alignItems: 'flex-start' }
                      ]}
                    >

                      <View style={{ justifyContent: 'center', marginRight: 8, paddingTop: 26 }}>
                        <TouchableOpacity
                          onPress={() => {
                            const next = [...formConsultation];
                            const wasActive = next[idx].active ?? Number(next[idx].fee) > 0;
                            next[idx].active = !wasActive;
                            if (!next[idx].active) {
                              // on uncheck: force fee to "0" and keep input disabled
                              next[idx].fee = '0';
                            } else {
                              // on re-check: set to minimum 10 if current fee is less than 10
                              const currentFee = Number(next[idx].fee);
                              if (currentFee < 10) next[idx].fee = '10';
                            }
                            setFormConsultation(next);
                          }}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: active }}
                          style={{
                            width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#666',
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: active ? '#00796B' : '#fff'
                          }}
                        >
                          {active ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}
                        </TouchableOpacity>
                      </View>

                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.label}>Type</Text>
                        <TextInput
                          style={styles.input}
                          value={row.type}
                          onChangeText={(v) => {
                            const next = [...formConsultation];
                            next[idx].type = v;
                            setFormConsultation(next);
                          }}
                          placeholder="e.g., In-Person, Video, Home Visit"
                          placeholderTextColor="#888"
                        />
                      </View>

                      <View style={{ width: 120, marginRight: 8 }}>
                        <Text style={styles.label}>Fee (₹)</Text>
                        {(() => {
                          let isFeeInvalid = active && (!row.fee || Number(row.fee) < 10); // Changed from <= 0 to < 10
                          return (
                            <>
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderColor: isFeeInvalid ? '#D32F2F' : '#E0E0E0',
                                borderWidth: 1,
                                borderRadius: 8,
                                backgroundColor: '#FFFFFF',
                                paddingHorizontal: 8,
                                opacity: active ? 1 : 0.5,
                              }}>
                                <Text style={{
                                  fontSize: responsiveText(16),
                                  color: active ? '#000000' : '#888888',
                                  marginRight: 4,
                                }}>₹</Text>
                                <TextInput
                                  style={[
                                    styles.input,
                                    {
                                      borderWidth: 0,
                                      flex: 1,
                                      paddingHorizontal: 0,
                                    }
                                  ]}
                                  value={String(row.fee ?? '')}
                                  onChangeText={(v) => {
                                    const next = [...formConsultation];
                                    const digits = v.replace(/[^0-9]/g, '');
                                    next[idx].fee = digits;
                                    // active is controlled by checkbox; keep as-is
                                    setFormConsultation(next);
                                  }}
                                  editable={!!active}           // disabled when unchecked
                                  keyboardType="numeric"
                                  placeholder="Enter fee"
                                  placeholderTextColor="#888"
                                />
                              </View>
                              {isFeeInvalid && (
                                <Text style={{ color: '#D32F2F', marginTop: 4, fontSize: 12 }}>
                                  Enter amount ≥ ₹10
                                </Text>
                              )}
                            </>
                          );
                        })()}
                      </View>

                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleEditClose}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveConsultation}>
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={editModalType === 'bank'} transparent animationType="slide" onRequestClose={handleEditClose}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Bank Details</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Bank Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formBank.bankName}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^A-Za-z\s]/g, '');
                      setFormBank((s) => ({ ...s, bankName: clean }));
                    }}
                    placeholder="Enter bank name"
                    placeholderTextColor="#888"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Holder Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formBank.accountHolderName}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^A-Za-z\s]/g, '');
                      setFormBank((s) => ({ ...s, accountHolderName: clean }));
                    }}
                    placeholder="Enter account holder name"
                    placeholderTextColor="#888"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Account Number</Text>
                  <TextInput
                    style={styles.input}
                    value={formBank.accountNumber}
                    onChangeText={(v) => setFormBank((s) => ({ ...s, accountNumber: v.replace(/[^0-9]/g, '').slice(0, 18) }))}
                    keyboardType="numeric"
                    maxLength={18}
                    placeholder="Enter account number"
                    placeholderTextColor="#888"
                  />
                </View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>IFSC Code</Text>
                  <TextInput
                    style={styles.input}
                    value={formBank.ifscCode}
                    onChangeText={(v) => setFormBank((s) => ({ ...s, ifscCode: sanitizeIFSC(v) }))}
                    autoCapitalize="characters"
                    maxLength={11}
                    placeholder="Enter IFSC code (e.g., HDFC0ABCD12)"
                    placeholderTextColor="#888"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleEditClose}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveBank}>
                  <Text style={styles.modalButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addDegreeModalVisible} transparent animationType="slide" onRequestClose={() => setAddDegreeModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Degree</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Degree Name</Text>
                  <TextInput
                    style={styles.input}
                    value={newDegreeForm.degree}
                    onChangeText={(v) => setNewDegreeForm(s => ({ ...s, degree: v }))}
                    placeholder="e.g., MBBS, B.Tech, 10th"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Institute/University</Text>
                  <TextInput
                    style={styles.input}
                    value={newDegreeForm.institute}
                    onChangeText={(v) => setNewDegreeForm(s => ({ ...s, institute: v }))}
                    placeholder="e.g., JNTU, SSC AP"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Year of Passing</Text>
                  <TextInput
                    style={styles.input}
                    value={newDegreeForm.yearOfPassing}
                    onChangeText={(v) => setNewDegreeForm(s => ({ ...s, yearOfPassing: v.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="e.g., 2020"
                    placeholderTextColor="#888"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setNewDegreeForm({ degree: '', institute: '', yearOfPassing: '' });
                    setAddDegreeModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddDegree}>
                  <Text style={styles.modalButtonText}>Add Degree</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addAwardModalVisible} transparent animationType="slide" onRequestClose={() => setAddAwardModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Award</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Award Description</Text>
                  <TextInput
                    style={[styles.input, { height: responsiveHeight(12) }]}
                    value={newAwardForm.description}
                    onChangeText={(v) => setNewAwardForm(s => ({ ...s, description: v }))}
                    placeholder="e.g., Best Doctor Award, Excellence in Patient Care"
                    placeholderTextColor="#888"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Year</Text>
                  <TextInput
                    style={styles.input}
                    value={newAwardForm.year}
                    onChangeText={(v) => setNewAwardForm(s => ({ ...s, year: v.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="e.g., 2024"
                    placeholderTextColor="#888"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setNewAwardForm({ description: '', year: '' });
                    setAddAwardModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddAward}>
                  <Text style={styles.modalButtonText}>Add Award</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addExperienceModalVisible} transparent animationType="slide" onRequestClose={() => setAddExperienceModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Professional Experience</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Institution/Organization</Text>
                  <TextInput
                    style={styles.input}
                    value={newExperienceForm.institution}
                    onChangeText={(v) => setNewExperienceForm(s => ({ ...s, institution: v }))}
                    placeholder="e.g., Apollo Hospital, City Medical Center"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>From Year</Text>
                  <TextInput
                    style={styles.input}
                    value={newExperienceForm.fromYear}
                    onChangeText={(v) => setNewExperienceForm(s => ({ ...s, fromYear: v.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="e.g., 2015"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>To Year</Text>
                  <TextInput
                    style={styles.input}
                    value={newExperienceForm.toYear}
                    onChangeText={(v) => setNewExperienceForm(s => ({ ...s, toYear: v.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="e.g., 2020"
                    placeholderTextColor="#888"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setNewExperienceForm({ institution: '', fromYear: '', toYear: '' });
                    setAddExperienceModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddProfessionalExperience}>
                  <Text style={styles.modalButtonText}>Add Experience</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addMembershipModalVisible} transparent animationType="slide" onRequestClose={() => setAddMembershipModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Professional Membership</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Organization/Association</Text>
                  <TextInput
                    style={styles.input}
                    value={newMembershipForm.organization}
                    onChangeText={(v) => setNewMembershipForm(s => ({ ...s, organization: v }))}
                    placeholder="e.g., Indian Medical Association, Medical Council"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Year</Text>
                  <TextInput
                    style={styles.input}
                    value={newMembershipForm.year}
                    onChangeText={(v) => setNewMembershipForm(s => ({ ...s, year: v.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="e.g., 2018"
                    placeholderTextColor="#888"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setNewMembershipForm({ organization: '', year: '' });
                    setAddMembershipModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddProfessionalMembership}>
                  <Text style={styles.modalButtonText}>Add Membership</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={addTreatmentModalVisible} transparent animationType="slide" onRequestClose={() => setAddTreatmentModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Treatment/Procedure</Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={styles.input}
                    value={newTreatmentForm.description}
                    onChangeText={(v) => setNewTreatmentForm(s => ({ ...s, description: v }))}
                    placeholder="e.g., Cardiac Surgery, Wound Cleaning, Injection"
                    placeholderTextColor="#888"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setNewTreatmentForm({ description: '' });
                    setAddTreatmentModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddTreatmentAndProcedure}>
                  <Text style={styles.modalButtonText}>Add Treatment</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add/Edit Certification Modal */}
        <Modal visible={addCertificationModalVisible} transparent animationType="slide" onRequestClose={() => {
          setAddCertificationModalVisible(false);
          setNewCertificationForm({
            certificationName: '',
            issuingOrganization: '',
            issueDate: '',
            expiryDate: '',
            credentialId: '',
            description: '',
          });
          setCertificationFile(null);
          setEditCertificationId(null);
          setCertificationErrors({
            certificationName: '',
            issuingOrganization: '',
            issueDate: '',
            file: '',
          });
        }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editCertificationId ? 'Edit Certification' : 'Add Certification'}
              </Text>
              <ScrollView style={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Certification Name *</Text>
                  <TextInput
                    style={[styles.input, certificationErrors.certificationName ? styles.inputError : null]}
                    value={newCertificationForm.certificationName}
                    onChangeText={(v) => {
                      setNewCertificationForm(s => ({ ...s, certificationName: v }));
                      setCertificationErrors(e => ({ ...e, certificationName: '' }));
                    }}
                    placeholder="e.g., Basic Life Support (BLS)"
                    placeholderTextColor="#888"
                  />
                  {certificationErrors.certificationName ? (
                    <Text style={styles.errorText}>{certificationErrors.certificationName}</Text>
                  ) : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Issuing Organization *</Text>
                  <TextInput
                    style={[styles.input, certificationErrors.issuingOrganization ? styles.inputError : null]}
                    value={newCertificationForm.issuingOrganization}
                    onChangeText={(v) => {
                      setNewCertificationForm(s => ({ ...s, issuingOrganization: v }));
                      setCertificationErrors(e => ({ ...e, issuingOrganization: '' }));
                    }}
                    placeholder="e.g., American Heart Association"
                    placeholderTextColor="#888"
                  />
                  {certificationErrors.issuingOrganization ? (
                    <Text style={styles.errorText}>{certificationErrors.issuingOrganization}</Text>
                  ) : null}
                </View>

                {/* ── Issue Date – calendar picker (same pattern as DoctorDashboard) ── */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Issue Date *</Text>
                  <TouchableOpacity
                    style={[
                      styles.input,
                      styles.datePickerButton,
                      certificationErrors.issueDate ? styles.inputError : null,
                    ]}
                    onPress={openCertIssueDatePicker}
                  >
                    <Text style={newCertificationForm.issueDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {newCertificationForm.issueDate
                        ? moment(newCertificationForm.issueDate, 'YYYY-MM-DD').format('DD MMM YYYY')
                        : 'Select issue date'}
                    </Text>
                  </TouchableOpacity>
                  {certificationErrors.issueDate ? (
                    <Text style={styles.errorText}>{certificationErrors.issueDate}</Text>
                  ) : null}
                  {/* Android picker – rendered inline outside modal scroll to avoid nesting issues */}
                  {Platform.OS === 'android' && showCertIssueDatePicker && (
                    <DateTimePicker
                      value={
                        newCertificationForm.issueDate
                          ? moment(newCertificationForm.issueDate, 'YYYY-MM-DD').toDate()
                          : new Date()
                      }
                      mode="date"
                      display="spinner"
                      maximumDate={new Date()}
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={handleCertIssueDateAndroid}
                    />
                  )}
                </View>

                {/* ── Expiry Date – calendar picker ── */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Expiry Date (Optional)</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.datePickerButton]}
                    onPress={openCertExpiryDatePicker}
                  >
                    <Text style={newCertificationForm.expiryDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {newCertificationForm.expiryDate
                        ? moment(newCertificationForm.expiryDate, 'YYYY-MM-DD').format('DD MMM YYYY')
                        : 'Select expiry date (optional)'}
                    </Text>
                  </TouchableOpacity>
                  {Platform.OS === 'android' && showCertExpiryDatePicker && (
                    <DateTimePicker
                      value={
                        newCertificationForm.expiryDate
                          ? moment(newCertificationForm.expiryDate, 'YYYY-MM-DD').toDate()
                          : new Date()
                      }
                      mode="date"
                      display="spinner"
                      minimumDate={new Date(1900, 0, 1)}
                      onChange={handleCertExpiryDateAndroid}
                    />
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Credential ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newCertificationForm.credentialId}
                    onChangeText={(v) => setNewCertificationForm(s => ({ ...s, credentialId: v }))}
                    placeholder="e.g., BLS-2023-12345"
                    placeholderTextColor="#888"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description (Optional)</Text>
                  <TextInput
                    style={[styles.input, { height: responsiveHeight(12) }]}
                    value={newCertificationForm.description}
                    onChangeText={(v) => setNewCertificationForm(s => ({ ...s, description: v }))}
                    placeholder="Brief description"
                    placeholderTextColor="#888"
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    {editCertificationId ? 'Replace Certificate File (Optional)' : 'Upload Certificate File *'}
                  </Text>
                  <TouchableOpacity style={styles.uploadBox} onPress={handleCertificationFilePick}>
                    <CameraIcon size={ICON_SIZE.md} color="#00203F" />
                    <Text style={styles.uploadText}>Choose File</Text>
                    <Text style={styles.acceptedText}>Accepted: PDF, JPG, PNG (Max 5MB)</Text>
                  </TouchableOpacity>
                  {certificationFile && (
                    <Text style={styles.successText}>Selected: {certificationFile.name}</Text>
                  )}
                  {certificationErrors.file ? (
                    <Text style={styles.errorText}>{certificationErrors.file}</Text>
                  ) : null}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => {
                    setAddCertificationModalVisible(false);
                    setNewCertificationForm({
                      certificationName: '',
                      issuingOrganization: '',
                      issueDate: '',
                      expiryDate: '',
                      credentialId: '',
                      description: '',
                    });
                    setCertificationFile(null);
                    setEditCertificationId(null);
                    setCertificationErrors({
                      certificationName: '',
                      issuingOrganization: '',
                      issueDate: '',
                      file: '',
                    });
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveCertification}>
                  <Text style={styles.modalButtonText}>
                    {editCertificationId ? 'Update' : 'Add'} Certification
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>

      {/* iOS IOSCalendarPicker for certification issue date */}
      {Platform.OS === 'ios' && (
        <IOSCalendarPicker
          visible={showCertIssueCalendar}
          currentDate={certCalendarCurrentDate}
          onConfirm={handleCertIssueDateIOS}
          onCancel={() => setShowCertIssueCalendar(false)}
          title="Select Issue Date"
          mode="date"
          minDate={new Date(1900, 0, 1)}
          maxDate={new Date()}
        />
      )}

      {/* iOS IOSCalendarPicker for certification expiry date */}
      {Platform.OS === 'ios' && (
        <IOSCalendarPicker
          visible={showCertExpiryCalendar}
          currentDate={certCalendarCurrentDate}
          onConfirm={handleCertExpiryDateIOS}
          onCancel={() => setShowCertExpiryCalendar(false)}
          title="Select Expiry Date"
          mode="date"
          minDate={new Date(1900, 0, 1)}
        />
      )}
    </SafeAreaView>
  );
};

// ---------- Styles ----------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1, paddingHorizontal: responsiveWidth(3), paddingVertical: SPACING.sm },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: FONT_SIZE.md, color: '#333', marginTop: SPACING.sm },
  // Make row stacked (inline) for tabs - single-column flow
  row: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    justifyContent: 'flex-start',
    marginBottom: responsiveWidth(4),
    paddingHorizontal: responsiveWidth(2),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: responsiveWidth(4),
    marginBottom: responsiveWidth(4),
    // shadow
    ...LAYOUT.shadow.sm,
    // FORCE single-column: always 100% width (stacked)
    width: '100%',
    minWidth: '100%',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: responsiveWidth(4), borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
    paddingBottom: responsiveWidth(2),
  },
  cardTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: responsiveText(16), fontWeight: 'bold', color: '#1E88E5', marginLeft: moderateScale(8) },
  avatarContainer: { alignItems: 'center', marginBottom: responsiveWidth(4) },
  doctorName: { fontSize: responsiveText(16), fontWeight: 'bold', color: '#212121', marginBottom: moderateScale(4) },
  infoSection: { marginBottom: responsiveWidth(4) },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: responsiveWidth(2) },
  infoText: { fontSize: responsiveText(14), color: '#333', marginLeft: moderateScale(8) },
  bold: { fontWeight: 'bold', color: '#212121' },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: responsiveWidth(2),
  },
  degreeCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#1E88E5',
  },
  degreeCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  degreeCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  degreeDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  // Award styles
  awardCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  awardCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  awardCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  awardDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  awardDescription: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: moderateScale(4),
  },
  awardYear: {
    fontSize: responsiveText(14),
    color: '#424242',
    fontStyle: 'italic',
  },
  // Professional Experience styles
  experienceCard: {
    backgroundColor: '#f8fdf8',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#16a34a',
  },
  experienceCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  experienceCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  experienceDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  experienceInstitution: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: moderateScale(4),
  },
  experienceDuration: {
    fontSize: responsiveText(14),
    color: '#424242',
    fontStyle: 'italic',
  },
  // Professional Membership styles
  membershipCard: {
    backgroundColor: '#fdf8ff',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  membershipCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  membershipCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  membershipDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  membershipOrganization: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: moderateScale(4),
  },
  membershipYear: {
    fontSize: responsiveText(14),
    color: '#424242',
    fontStyle: 'italic',
  },
  // Treatments and Procedures styles
  treatmentCard: {
    backgroundColor: '#fffbeb',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  treatmentCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  treatmentCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  treatmentDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  treatmentDescription: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    lineHeight: responsiveText(22),
  },
  // Certification styles
  certificationCard: {
    backgroundColor: '#f0fdfa',
    borderRadius: LAYOUT.borderRadius.md,
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    borderLeftWidth: 3,
    borderLeftColor: '#0d9488',
  },
  certificationCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  certificationCardInfo: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  certificationName: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: moderateScale(4),
  },
  certificationIssuer: {
    fontSize: responsiveText(14),
    color: '#424242',
    marginBottom: moderateScale(2),
  },
  certificationDate: {
    fontSize: responsiveText(12),
    color: '#666666',
    marginTop: moderateScale(2),
  },
  certificationCredential: {
    fontSize: responsiveText(12),
    color: '#666666',
    marginTop: moderateScale(2),
    fontStyle: 'italic',
  },
  certificationActions: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  certificationViewButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  certificationEditButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  certificationDeleteButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(4),
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(32),
    minHeight: moderateScale(32),
  },
  degreeTitle: {
    fontSize: responsiveText(16),
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: moderateScale(4),
  },
  degreeInstitute: {
    fontSize: responsiveText(14),
    color: '#424242',
    marginBottom: moderateScale(2),
  },
  degreeYear: {
    fontSize: responsiveText(12),
    color: '#666666',
    fontStyle: 'italic',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: LAYOUT.borderRadius.pill,
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    marginRight: moderateScale(8),
    marginBottom: moderateScale(8),
  },
  tagText: {
    fontSize: FONT_SIZE.sm,
    color: '#333',
  }, noDataText: { fontSize: responsiveText(14), color: '#616161', fontStyle: 'italic' },
  sectionTitle: { fontSize: responsiveText(14), color: '#166534', fontWeight: 'bold', marginTop: moderateScale(6), marginBottom: responsiveWidth(2) },
  certificationItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: responsiveWidth(3), borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  certificationInfo: { flex: 1 },
  certificationNumber: { fontSize: responsiveText(12), color: '#424242' },
  viewButton: {
    backgroundColor: '#1E88E5', paddingHorizontal: responsiveWidth(3), paddingVertical: responsiveWidth(1.5),
    borderRadius: moderateScale(4), marginLeft: responsiveWidth(2), marginBottom: responsiveWidth(1),
  },
  kycButtonContainer: {
    marginTop: responsiveWidth(2),
    width: '100%',
    alignItems: 'flex-start',
  },
  viewButtonText: { color: '#fff', fontSize: responsiveText(12) },
  closeButton: {
    marginLeft: moderateScale(8),
    padding: moderateScale(4),
  },
  locationCard: { backgroundColor: '#E8EAF6', borderRadius: moderateScale(8), padding: responsiveWidth(3), marginBottom: responsiveWidth(2) },
  locationInfo: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDetails: { marginLeft: responsiveWidth(2), flex: 1 },
  locationAddress: { fontSize: responsiveText(12), color: '#424242', marginBottom: responsiveWidth(1) },
  locationTimings: { fontSize: responsiveText(12), color: '#424242' },

  kycItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: responsiveWidth(4) },
  kycInfo: { flexDirection: 'row', alignItems: 'center' },

  consultationCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#E8F5E9', borderRadius: moderateScale(8), padding: responsiveWidth(3), marginBottom: responsiveWidth(2),
  },
  consultationInfo: { flexDirection: 'row', alignItems: 'center', gap: moderateScale(8) },
  consultationPrice: { fontSize: responsiveText(16), fontWeight: 'bold', color: '#1E88E5' },

  bankDetails: { marginTop: responsiveWidth(2), },
  bankItem: { flexDirection: 'row', alignItems: 'center', marginBottom: responsiveWidth(3), justifyContent: 'space-between' },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { backgroundColor: '#fff', borderRadius: moderateScale(8), padding: responsiveWidth(5), width: responsiveWidth(90), maxHeight: '85%' },
  modalTitle: { fontSize: responsiveText(18), fontWeight: 'bold', color: '#212121', marginBottom: responsiveWidth(4), textAlign: 'center' },
  modalImage: { width: '100%', height: responsiveWidth(70), marginBottom: responsiveWidth(4) },
  modalButton: { backgroundColor: '#3b82f6', padding: responsiveWidth(3), borderRadius: moderateScale(6), alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: responsiveText(14) },

  certDetailsContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: moderateScale(8),
    padding: moderateScale(16),
    marginBottom: moderateScale(16),
  },
  certDetailRow: {
    marginBottom: moderateScale(8),
  },
  certDetailLabel: {
    fontSize: responsiveText(12),
    color: '#64748b',
    marginBottom: moderateScale(2),
  },
  certDetailValue: {
    fontSize: responsiveText(14),
    fontWeight: '500',
    color: '#1e293b',
  },
  pdfPlaceholder: {
    padding: moderateScale(24),
    backgroundColor: '#f8f9fa',
    borderRadius: moderateScale(8),
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  pdfText: {
    fontSize: responsiveText(14),
    color: '#666',
    marginBottom: moderateScale(12),
  },
  openPdfButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  openPdfButtonText: {
    color: '#fff',
    fontWeight: '500',
  },

  formContainer: { maxHeight: responsiveHeight(60), marginBottom: responsiveWidth(4) },
  formGroup: { marginBottom: responsiveWidth(4) },
  label: { fontSize: responsiveText(14), fontWeight: 'bold', color: '#000000', marginBottom: responsiveWidth(2) },
  input: { borderWidth: 1, borderColor: '#B0BEC5', borderRadius: moderateScale(6), padding: moderateScale(10), fontSize: FONT_SIZE.input, color: '#333' },
  inputError: { borderColor: '#dc2626' },
  errorText: { color: '#dc2626', fontSize: FONT_SIZE.xs, marginTop: moderateScale(2) },
  // Date picker button styles (mirrors the datePicker row in DoctorDashboard)
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  datePickerText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  datePickerPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#888',
  },
  // Add this to your styles
  pickerOutline: {
    height: responsiveHeight(6),
    flex: 1,
    marginRight: moderateScale(8),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: moderateScale(6),
    backgroundColor: '#fff',
  },
  languageItem: { flexDirection: 'row', alignItems: 'center', marginBottom: responsiveWidth(2) },
  picker: {
    height: responsiveHeight(6),
    flex: 1,
    marginRight: moderateScale(8),
    color: '#333',
  },
  addButton: { backgroundColor: '#E3F2FD', padding: moderateScale(8), borderRadius: moderateScale(6), alignItems: 'center' },
  addButtonText: { color: '#1565C0', fontWeight: 'bold', fontSize: FONT_SIZE.sm },

  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: moderateScale(8) },
  cancelButton: { backgroundColor: '#757575', flex: 1, marginRight: moderateScale(8) },
  saveButton: { backgroundColor: '#16a34a', flex: 1, marginLeft: moderateScale(8) },

  acceptedText: { fontSize: FONT_SIZE.xs, color: '#666', textAlign: 'center', fontWeight: '500' },
  successText: { color: '#00203F', fontSize: FONT_SIZE.sm, marginTop: moderateScale(6), marginBottom: moderateScale(8), textAlign: 'center' },
  uploadBox: {
    borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', borderRadius: moderateScale(8), padding: responsiveWidth(4),
    alignItems: 'center', backgroundColor: '#fff', marginBottom: responsiveHeight(1), ...LAYOUT.shadow.sm,
  },
  uploadText: { fontSize: responsiveText(14), color: '#00203F', textAlign: 'center', fontWeight: '500' },

  togglePill: {
    borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(6), borderRadius: LAYOUT.borderRadius.pill,
    marginRight: moderateScale(8), marginBottom: moderateScale(8), backgroundColor: '#fff',
  },
  togglePillSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  togglePillText: { color: '#111827' },

  consultationRow: {
    paddingVertical: moderateScale(8),
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: moderateScale(6),
    marginBottom: responsiveWidth(2),
    overflow: 'hidden',
  },

  profilePhotoContainerInline: { alignItems: 'center', marginBottom: responsiveWidth(3) },
  profileWrapperInline: {
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoInline: {
    width: responsiveWidth(30),
    height: responsiveWidth(30),
    borderRadius: responsiveWidth(15),
    borderWidth: moderateScale(3),
    borderColor: '#00203F',
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderAvatarInline: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fabCameraInline: {
    position: 'absolute',
    right: moderateScale(-6),
    bottom: moderateScale(-6),
    width: responsiveWidth(11),
    height: responsiveWidth(11),
    borderRadius: responsiveWidth(11) / 2,
    backgroundColor: '#00796B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: '#fff',
    ...LAYOUT.shadow.md,
  },
  photoHintTextInline: {
    marginTop: moderateScale(8),
    fontSize: FONT_SIZE.xs,
    color: '#666',
  },
  pickerInline: {
    height: responsiveHeight(6),
    flex: 1,
    marginRight: moderateScale(8),
    color: '#333',
  },
  // SafetyCertificate icon style
  safetyCertificate: {
    width: ICON_SIZE.sm,
    height: ICON_SIZE.sm,
    tintColor: '#eb2f96',
  },
});

export default DoctorProfileView;