import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getUserProfile} from '../../../services/apiHelpers';
import {
  LogOut,
  Shield,
  Phone,
  Award,
  ChevronRight,
  Star,
  CheckCircle,
  Compass,
  Edit2,
  Languages,
  HeartPulse,
  Stethoscope,
  Globe,
  X,
  Check,
  Activity,
} from 'lucide-react-native';
import {
  getProviderRole,
  getUserPhone,
  logout,
} from '../../../services/authSession';
import ProviderShell from '../../../components/provider/ProviderShell';
import ProviderCard from '../../../components/provider/ProviderCard';
import {useProviderModal} from '../../../context/ProviderModalContext';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

// Full configuration options
const AVAILABLE_SPECIALIZATIONS = [
  'Geriatric Care',
  'Wound Dressing',
  'IV Infusion',
  'Palliative Care',
  'ICU Monitoring',
  'Post-Op Rehab',
  'Diabetes Mgmt',
  'Catheterization',
  'Pediatric Care',
];

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Malayalam',
  'Kannada',
  'Bengali',
  'Marathi',
];

const AVAILABLE_EQUIPMENT = [
  {name: 'Digital BP Monitor', desc: 'Verified & Calibrated'},
  {name: 'Pulse Oximeter', desc: 'FDA Approved Sensor'},
  {name: 'Stethoscope', desc: 'Premium Acoustic'},
  {name: 'Infrared Thermometer', desc: 'No-contact Calibrated'},
  {name: 'Sterile First Aid Kit', desc: 'Restocked Weekly'},
  {name: 'Glucose Meter', desc: 'Active Strip Calibrated'},
];

export default function ProviderProfileTab() {
  const {
    showLogoutConfirm,
    showDispatchRadius,
    showSupportHotline,
    showPolicyInfo,
    showNotifications,
  } = useProviderModal();

  // API profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState<string | null>(null);

  // Profile fields state (populated from API)
  const [role, setRole] = useState('provider');
  const [phone, setPhone] = useState('—');
  const [fullName, setFullName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalExperience, setTotalExperience] = useState(0);
  const [consultationFee, setConsultationFee] = useState(0);
  const [maxDistance, setMaxDistance] = useState(15);

  // Advanced customizable state fields
  const [bio, setBio] = useState(
    'Compassionate clinical partner dedicated to delivering premium healthcare in the comfort of home.'
  );
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [languages, setLanguages] = useState(['English', 'Hindi', 'Tamil']);
  const [equipment, setEquipment] = useState([
    'Digital BP Monitor',
    'Pulse Oximeter',
    'Stethoscope',
    'Infrared Thermometer',
    'Sterile First Aid Kit',
  ]);

  // Modal controls
  const [isBioModalVisible, setIsBioModalVisible] = useState(false);
  const [isSpecModalVisible, setIsSpecModalVisible] = useState(false);
  const [isLangModalVisible, setIsLangModalVisible] = useState(false);
  const [isEquipModalVisible, setIsEquipModalVisible] = useState(false);

  // Temporary editor states
  const [tempBio, setTempBio] = useState('');
  const [tempSpecs, setTempSpecs] = useState<string[]>([]);
  const [tempLangs, setTempLangs] = useState<string[]>([]);
  const [tempEquip, setTempEquip] = useState<string[]>([]);

  // Fetch userId from AsyncStorage
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await AsyncStorage.getItem('userId');
        if (id) {
          setLocalUserId(id);
        }
      } catch (error) {
        console.error('Error fetching userId:', error);
      }
    };
    fetchUserId();
  }, []);

  // Fetch profile from API
  const loadProfile = useCallback(async () => {
    if (!localUserId) return;
    setLoading(true);
    try {
      const response: any = await getUserProfile(localUserId);
      const resData = response?.data?.data || response?.data || response;
      if (resData) {
        const user = resData.user;
        const profile = resData.profile;
        const documents = resData.documents;

        setProfileData(profile || user);
        setDocumentsData(documents?.documents ?? []);

        // Map API fields to state
        const fname = user?.firstname || '';
        const lname = user?.lastname || '';
        const nameFromUser = `${fname} ${lname}`.trim();
        setFullName(profile?.fullName || nameFromUser || 'Provider');

        const specName = (user?.specialization && typeof user.specialization === 'object') ? user.specialization.name : user?.specialization;
        setRole(profile?.role || profile?.profession || specName || 'provider');

        const rawMobile = user?.mobile || profile?.mobile || '';
        const formattedPhone = rawMobile.length === 10
          ? `${rawMobile.slice(0, 5)} ${rawMobile.slice(5)}`
          : rawMobile;
        setPhone(formattedPhone || '—');

        setProfilePhoto(user?.profilepic || profile?.profilePhoto || null);
        
        const isVer = user?.isVerified;
        setVerificationStatus(isVer ? 'approved' : 'pending');
        
        setOverallRating(user?.overallRating || profile?.overallRating || 0);
        setTotalReviews(profile?.totalReviews || 0);
        setTotalExperience(profile?.totalExperience || 0);

        let fee = profile?.consultationFee || 0;
        if (!fee && user?.consultationModeFee && Array.isArray(user.consultationModeFee)) {
          const homecareFee = user.consultationModeFee.find(
            (m: any) =>
              m.type?.toLowerCase() === 'homecare' ||
              m.type?.toLowerCase() === 'home-visit' ||
              m.type?.toLowerCase() === 'home care'
          );
          if (homecareFee) {
            fee = homecareFee.price || homecareFee.fee || homecareFee.amount || 0;
          } else if (user.consultationModeFee.length > 0) {
            fee = user.consultationModeFee[0].price || user.consultationModeFee[0].fee || user.consultationModeFee[0].amount || 0;
          }
        }
        setConsultationFee(fee);

        setSpecializations(profile?.selectedServices || (user?.specialization ? [specName] : []));
      } else {
        // Fallback to local session data
        getProviderRole().then(r => setRole(r ?? 'provider'));
        getUserPhone().then(p => setPhone(p ?? '—'));
      }
    } catch (e) {
      // Fallback to local session data
      getProviderRole().then(r => setRole(r ?? 'provider'));
      getUserPhone().then(p => setPhone(p ?? '—'));
    } finally {
      setLoading(false);
    }
  }, [localUserId]);

  useEffect(() => {
    if (localUserId) {
      loadProfile();
    }
  }, [loadProfile, localUserId]);

  const onLogout = () => {
    showLogoutConfirm(() => logout());
  };

  const handleAdjustDistance = () => {
    showDispatchRadius(maxDistance, km => {
      setMaxDistance(km);
      Toast.show({
        type: 'success',
        text1: 'Radius updated',
        text2: `You will receive offers within ${km} km.`,
      });
    });
  };

  // Bio editor save
  const handleSaveBio = () => {
    if (tempBio.trim().length < 20) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Bio length',
        text2: 'Bio must be at least 20 characters to showcase your expertise.',
      });
      return;
    }
    setBio(tempBio);
    setIsBioModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Bio Updated',
      text2: 'Your professional bio has been successfully saved.',
    });
  };

  // Specializations save
  const handleSaveSpecs = () => {
    if (tempSpecs.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please select at least one clinical specialization.',
      });
      return;
    }
    setSpecializations(tempSpecs);
    setIsSpecModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Specializations Updated',
      text2: 'Your active clinical services list has been refreshed.',
    });
  };

  // Languages save
  const handleSaveLangs = () => {
    if (tempLangs.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Selection Required',
        text2: 'Please select at least one spoken language.',
      });
      return;
    }
    setLanguages(tempLangs);
    setIsLangModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Languages Updated',
      text2: 'Your communication preferences have been saved.',
    });
  };

  // Equipment save
  const handleSaveEquip = () => {
    setEquipment(tempEquip);
    setIsEquipModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Equipment Inventory Saved',
      text2: 'Your verified kit checklist has been updated.',
    });
  };

  // Helpers to toggle items inside multi-select arrays
  const toggleTempSpec = (spec: string) => {
    if (tempSpecs.includes(spec)) {
      setTempSpecs(tempSpecs.filter(s => s !== spec));
    } else {
      setTempSpecs([...tempSpecs, spec]);
    }
  };

  const toggleTempLang = (lang: string) => {
    if (tempLangs.includes(lang)) {
      setTempLangs(tempLangs.filter(l => l !== lang));
    } else {
      setTempLangs([...tempLangs, lang]);
    }
  };

  const toggleTempEquip = (eq: string) => {
    if (tempEquip.includes(eq)) {
      setTempEquip(tempEquip.filter(e => e !== eq));
    } else {
      setTempEquip([...tempEquip, eq]);
    }
  };

  if (loading && !profileData) {
    return (
      <ProviderShell
        title="Profile"
        subtitle="Professional compliance & settings"
        onNotifications={showNotifications}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PROVIDER_THEME.teal} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </ProviderShell>
    );
  }

  const verifiedBadgeText =
    verificationStatus === 'approved'
      ? 'Verified Partner'
      : verificationStatus === 'pending'
      ? 'Pending Verification'
      : 'Under Review';

  const verifiedBadgeColor =
    verificationStatus === 'approved'
      ? PROVIDER_THEME.success
      : verificationStatus === 'pending'
      ? PROVIDER_THEME.warning
      : PROVIDER_THEME.textMuted;

  return (
    <ProviderShell
      title="Profile"
      subtitle="Professional compliance & settings"
      onNotifications={showNotifications}>
      
      {/* ── Premium Identity Hero Card ── */}
      <ProviderCard accent style={styles.heroCard}>
        <View style={styles.heroRow}>
          {profilePhoto ? (
            <View style={styles.heroAvatarWrap}>
              <Image source={{uri: profilePhoto}} style={styles.heroAvatarImage} />
              <View style={[styles.verifiedDot, {backgroundColor: verifiedBadgeColor}]}>
                <CheckCircle color="#FFFFFF" size={12} />
              </View>
            </View>
          ) : (
            <View style={styles.heroAvatar}>
              <Text style={styles.heroLetter}>
                {(fullName || role).charAt(0).toUpperCase()}
              </Text>
              <View style={[styles.verifiedDot, {backgroundColor: verifiedBadgeColor}]}>
                <CheckCircle color="#FFFFFF" size={12} />
              </View>
            </View>
          )}
          <View style={{flex: 1}}>
            <Text style={styles.heroName}>{fullName || 'Provider'}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.heroRole}>{role.replace('_', ' ')}</Text>
              <View style={[styles.partnerBadge, {backgroundColor: `${verifiedBadgeColor}12`}]}>
                <Text style={[styles.partnerBadgeText, {color: verifiedBadgeColor}]}>
                  {verifiedBadgeText}
                </Text>
              </View>
            </View>
            <Text style={styles.heroPhone}>+91 {phone}</Text>
            
            <View style={styles.metricsRow}>
              <View style={styles.ratingBadge}>
                <Star size={12} color={PROVIDER_THEME.gold} fill={PROVIDER_THEME.gold} />
                <Text style={styles.ratingText}>
                  {overallRating > 0 ? overallRating.toFixed(1) : 'New'}
                </Text>
              </View>
              <Text style={styles.bulletSeparator}>·</Text>
              <Text style={styles.completionText}>
                {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
              </Text>
            </View>
          </View>
        </View>
      </ProviderCard>

      {/* ── Premium Clinical Analytics Grid ── */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, {color: PROVIDER_THEME.gold}]}>
            {overallRating > 0 ? `${overallRating.toFixed(1)} ★` : 'New'}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, {color: PROVIDER_THEME.navy}]}>
            {totalReviews}
          </Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, {color: PROVIDER_THEME.success}]}>
            ₹{consultationFee}
          </Text>
          <Text style={styles.statLabel}>Consult Fee</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, {color: PROVIDER_THEME.violet}]}>
            {totalExperience}+ Yrs
          </Text>
          <Text style={styles.statLabel}>Experience</Text>
        </View>
      </View>

      {/* ── Professional Bio Card ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Professional Bio</Text>
        <TouchableOpacity
          style={styles.sectionHeaderBtn}
          onPress={() => {
            setTempBio(bio);
            setIsBioModalVisible(true);
          }}>
          <Edit2 size={13} color={PROVIDER_THEME.teal} />
          <Text style={styles.sectionHeaderBtnText}>Edit Bio</Text>
        </TouchableOpacity>
      </View>
      <ProviderCard style={styles.bioCard}>
        <Text style={styles.bioQuotes}>“</Text>
        <Text style={styles.bioText}>{bio}</Text>
        <View style={styles.verifiedFooterRow}>
          <CheckCircle size={12} color={PROVIDER_THEME.success} />
          <Text style={styles.verifiedFooterText}>Verified Patient-Facing Summary</Text>
        </View>
      </ProviderCard>

      {/* ── Specializations Tag List ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Clinical Specializations</Text>
        <TouchableOpacity
          style={styles.sectionHeaderBtn}
          onPress={() => {
            setTempSpecs([...specializations]);
            setIsSpecModalVisible(true);
          }}>
          <Activity size={13} color={PROVIDER_THEME.teal} />
          <Text style={styles.sectionHeaderBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {specializations.map((spec, index) => (
          <View key={index} style={styles.tagBadge}>
            <HeartPulse size={12} color={PROVIDER_THEME.navy} />
            <Text style={styles.tagBadgeText}>{spec}</Text>
          </View>
        ))}
      </View>

      {/* ── Languages Spoken Badges ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Languages Spoken</Text>
        <TouchableOpacity
          style={styles.sectionHeaderBtn}
          onPress={() => {
            setTempLangs([...languages]);
            setIsLangModalVisible(true);
          }}>
          <Globe size={13} color={PROVIDER_THEME.teal} />
          <Text style={styles.sectionHeaderBtnText}>Manage</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tagsContainer}>
        {languages.map((lang, index) => (
          <View key={index} style={[styles.tagBadge, {backgroundColor: PROVIDER_THEME.mintSoft}]}>
            <Languages size={12} color={PROVIDER_THEME.success} />
            <Text style={[styles.tagBadgeText, {color: PROVIDER_THEME.success}]}>{lang}</Text>
          </View>
        ))}
      </View>

      {/* ── Verified Home Visit Diagnostics Gear ── */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Verified Diagnostic Gear</Text>
        <TouchableOpacity
          style={styles.sectionHeaderBtn}
          onPress={() => {
            setTempEquip([...equipment]);
            setIsEquipModalVisible(true);
          }}>
          <Stethoscope size={13} color={PROVIDER_THEME.teal} />
          <Text style={styles.sectionHeaderBtnText}>Manage Gear</Text>
        </TouchableOpacity>
      </View>
      <ProviderCard style={styles.gearCard}>
        {equipment.length === 0 ? (
          <Text style={styles.noGearText}>No equipment listed. Add instruments to increase booking conversions.</Text>
        ) : (
          equipment.map((eqName, index) => {
            const defaultEq = AVAILABLE_EQUIPMENT.find(e => e.name === eqName);
            return (
              <View key={index} style={styles.gearItem}>
                <View style={styles.gearIconWrapper}>
                  <Stethoscope size={16} color={PROVIDER_THEME.navy} />
                </View>
                <View style={styles.gearDetails}>
                  <Text style={styles.gearLabel}>{eqName}</Text>
                  <Text style={styles.gearSub}>{defaultEq?.desc ?? 'Verified Partner Kit'}</Text>
                </View>
                <View style={styles.verifiedCalibrationBadge}>
                  <CheckCircle size={10} color={PROVIDER_THEME.success} />
                  <Text style={styles.calibrationText}>Calibrated</Text>
                </View>
              </View>
            );
          })
        )}
      </ProviderCard>

      {/* Compliance / KYC Checklist Status */}
      <Text style={styles.sectionTitle}>Compliance & Licensing</Text>
      <ProviderCard style={styles.complianceCard}>
        {documentsData.length > 0 ? (
          documentsData.map((doc: any, index: number) => (
            <View key={doc._id || index} style={styles.complianceItem}>
              <View style={styles.checkedWrapper}>
                <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(18)} />
              </View>
              <View style={styles.complianceTextWrap}>
                <Text style={styles.complianceLabel}>{doc.documentType}</Text>
                <Text style={styles.complianceSub}>Uploaded & Verified</Text>
              </View>
            </View>
          ))
        ) : (
          <>
            <View style={styles.complianceItem}>
              <View style={styles.checkedWrapper}>
                <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(18)} />
              </View>
              <View style={styles.complianceTextWrap}>
                <Text style={styles.complianceLabel}>Identity & Government Proof</Text>
                <Text style={styles.complianceSub}>Verified via National Registry</Text>
              </View>
            </View>
            <View style={styles.complianceItem}>
              <View style={styles.checkedWrapper}>
                <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(18)} />
              </View>
              <View style={styles.complianceTextWrap}>
                <Text style={styles.complianceLabel}>Medical / Care Council License</Text>
                <Text style={styles.complianceSub}>License Registration Active</Text>
              </View>
            </View>
            <View style={styles.complianceItem}>
              <View style={styles.checkedWrapper}>
                <CheckCircle color={PROVIDER_THEME.success} size={moderateScale(18)} />
              </View>
              <View style={styles.complianceTextWrap}>
                <Text style={styles.complianceLabel}>Weekly Settlement Bank account</Text>
                <Text style={styles.complianceSub}>Penny drop verified</Text>
              </View>
            </View>
          </>
        )}
      </ProviderCard>

      {/* Dispatch settings preferences */}
      <Text style={styles.sectionTitle}>Dispatch Preferences</Text>
      <ProviderCard>
        <TouchableOpacity style={styles.prefRow} onPress={handleAdjustDistance}>
          <View style={styles.iconBg}>
            <Compass color={PROVIDER_THEME.jade} size={moderateScale(20)} />
          </View>
          <View style={styles.prefTextCol}>
            <Text style={styles.prefLabel} numberOfLines={2}>
              Maximum dispatch radius
            </Text>
            <Text style={styles.prefSub} numberOfLines={2}>
              Control your home visit travel distance
            </Text>
          </View>
          <View style={styles.prefRight}>
            <Text style={styles.prefVal}>{maxDistance} km</Text>
            <ChevronRight color={PROVIDER_THEME.textSoft} size={moderateScale(16)} />
          </View>
        </TouchableOpacity>
      </ProviderCard>

      {/* Corporate support hotline & policies */}
      <Text style={styles.sectionTitle}>Support & Legal</Text>
      <ProviderCard style={styles.rowCard}>
        <Row
          icon={Award}
          label="Accreditation Credentials"
          value="Verified Badge"
          onPress={() =>
            Toast.show({type: 'success', text1: 'Credentials', text2: 'All badges active.'})
          }
        />
        <Row
          icon={Phone}
          label="Emergency Support Hotline"
          value="1800-202-CARE"
          onPress={showSupportHotline}
        />
        <Row
          icon={Shield}
          label="Privacy & Professional Conduct"
          value="View Policy"
          onPress={showPolicyInfo}
        />
      </ProviderCard>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <LogOut color="#FFF" size={moderateScale(20)} />
        <Text style={styles.logoutText}>Sign out of Duty</Text>
      </TouchableOpacity>
      <View style={styles.bottomSpacer} />

      {/* ── PROFESSIONAL BIO MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isBioModalVisible}
        onRequestClose={() => setIsBioModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Professional Bio</Text>
                <Text style={styles.modalSubtitle}>Tell patients about your medical background.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsBioModalVisible(false)}>
                <X color={PROVIDER_THEME.navy} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={styles.bioInput}
                multiline
                numberOfLines={6}
                value={tempBio}
                onChangeText={setTempBio}
                placeholder="Write a brief professional summary..."
                maxLength={350}
              />
              <Text style={styles.charCount}>
                {tempBio.length} / 350 characters
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsBioModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBio}>
                <Text style={styles.saveBtnText}>Save Bio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── CLINICAL SPECIALIZATIONS MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSpecModalVisible}
        onRequestClose={() => setIsSpecModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Services</Text>
                <Text style={styles.modalSubtitle}>Manage your certified clinical offerings.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsSpecModalVisible(false)}>
                <X color={PROVIDER_THEME.navy} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsList}>
                {AVAILABLE_SPECIALIZATIONS.map((spec, index) => {
                  const isChecked = tempSpecs.includes(spec);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionItem, isChecked && styles.optionItemChecked]}
                      onPress={() => toggleTempSpec(spec)}>
                      <View style={styles.optionLeft}>
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Check size={12} color="#FFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.optionText, isChecked && styles.optionTextChecked]}>
                          {spec}
                        </Text>
                      </View>
                      <HeartPulse size={16} color={isChecked ? PROVIDER_THEME.navy : PROVIDER_THEME.textSoft} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsSpecModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveSpecs}>
                <Text style={styles.saveBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── LANGUAGES SPOKEN MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLangModalVisible}
        onRequestClose={() => setIsLangModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Languages Spoken</Text>
                <Text style={styles.modalSubtitle}>Select all languages you speak fluently.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsLangModalVisible(false)}>
                <X color={PROVIDER_THEME.navy} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsList}>
                {AVAILABLE_LANGUAGES.map((lang, index) => {
                  const isChecked = tempLangs.includes(lang);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionItem, isChecked && styles.optionItemChecked]}
                      onPress={() => toggleTempLang(lang)}>
                      <View style={styles.optionLeft}>
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Check size={12} color="#FFF" strokeWidth={3} />}
                        </View>
                        <Text style={[styles.optionText, isChecked && styles.optionTextChecked]}>
                          {lang}
                        </Text>
                      </View>
                      <Globe size={16} color={isChecked ? PROVIDER_THEME.success : PROVIDER_THEME.textSoft} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsLangModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLangs}>
                <Text style={styles.saveBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── EQUIPMENT MODAL ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEquipModalVisible}
        onRequestClose={() => setIsEquipModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Medical Gear</Text>
                <Text style={styles.modalSubtitle}>Instruments active in your home travel kit.</Text>
              </View>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsEquipModalVisible(false)}>
                <X color={PROVIDER_THEME.navy} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.optionsList}>
                {AVAILABLE_EQUIPMENT.map((eq, index) => {
                  const isChecked = tempEquip.includes(eq.name);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.optionItem, isChecked && styles.optionItemChecked]}
                      onPress={() => toggleTempEquip(eq.name)}>
                      <View style={styles.optionLeft}>
                        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                          {isChecked && <Check size={12} color="#FFF" strokeWidth={3} />}
                        </View>
                        <View>
                          <Text style={[styles.optionText, isChecked && styles.optionTextChecked]}>
                            {eq.name}
                          </Text>
                          <Text style={styles.optionSub}>{eq.desc}</Text>
                        </View>
                      </View>
                      <Stethoscope size={16} color={isChecked ? PROVIDER_THEME.navy : PROVIDER_THEME.textSoft} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEquipModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEquip}>
                <Text style={styles.saveBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ProviderShell>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Icon color={PROVIDER_THEME.teal} size={moderateScale(20)} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      <ChevronRight color={PROVIDER_THEME.textSoft} size={moderateScale(18)} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(60),
  },
  loadingText: {
    marginTop: moderateScale(12),
    fontSize: moderateScale(14),
    color: PROVIDER_THEME.textMuted,
    fontWeight: '600',
  },
  heroCard: {
    padding: moderateScale(16),
    borderColor: 'rgba(13, 148, 136, 0.15)',
  },
  heroRow: {flexDirection: 'row', gap: moderateScale(16), alignItems: 'center'},
  heroAvatar: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(22),
    backgroundColor: PROVIDER_THEME.teal,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroAvatarWrap: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(22),
    position: 'relative',
    overflow: 'visible',
  },
  heroAvatarImage: {
    width: moderateScale(68),
    height: moderateScale(68),
    borderRadius: moderateScale(22),
  },
  heroLetter: {color: '#FFF', fontSize: moderateScale(28), fontWeight: '800'},
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: PROVIDER_THEME.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroName: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    marginTop: moderateScale(2),
  },
  heroRole: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.textMuted,
    textTransform: 'capitalize',
  },
  partnerBadge: {
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
  },
  partnerBadgeText: {
    fontSize: moderateScale(9),
    fontWeight: '800',
    color: PROVIDER_THEME.success,
  },
  heroPhone: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: moderateScale(8),
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: 'rgba(230, 138, 46, 0.1)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(6),
  },
  ratingText: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    color: PROVIDER_THEME.gold,
  },
  bulletSeparator: {
    fontSize: moderateScale(16),
    color: PROVIDER_THEME.textSoft,
    marginHorizontal: moderateScale(6),
  },
  completionText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: PROVIDER_THEME.success,
  },
  // Advanced stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: moderateScale(10),
    marginBottom: moderateScale(14),
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PROVIDER_THEME.border,
    ...PROVIDER_THEME.shadowStyles.card,
  },
  statValue: {
    fontSize: moderateScale(14),
    fontWeight: '800',
  },
  statLabel: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
    fontWeight: '600',
  },
  // Sections Header Row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
    letterSpacing: -0.2,
  },
  sectionHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  sectionHeaderBtnText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  // Bio card styles
  bioCard: {
    padding: moderateScale(14),
    position: 'relative',
    borderColor: 'rgba(29, 53, 87, 0.08)',
  },
  bioQuotes: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: 'rgba(29, 53, 87, 0.1)',
    position: 'absolute',
    left: moderateScale(8),
    top: moderateScale(-4),
  },
  bioText: {
    fontSize: moderateScale(12.5),
    color: PROVIDER_THEME.navy,
    lineHeight: moderateScale(18),
    paddingLeft: moderateScale(10),
    fontWeight: '500',
  },
  verifiedFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    marginTop: moderateScale(10),
    paddingLeft: moderateScale(10),
  },
  verifiedFooterText: {
    fontSize: moderateScale(10),
    color: PROVIDER_THEME.success,
    fontWeight: '700',
  },
  // Tag Container
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: moderateScale(8),
    marginBottom: moderateScale(4),
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'rgba(29, 53, 87, 0.08)',
  },
  tagBadgeText: {
    fontSize: moderateScale(11.5),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  // Diagnostic gear list
  gearCard: {
    paddingVertical: moderateScale(4),
    borderColor: 'rgba(29, 53, 87, 0.08)',
  },
  noGearText: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    textAlign: 'center',
    paddingVertical: moderateScale(12),
  },
  gearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: PROVIDER_THEME.border,
  },
  gearIconWrapper: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(8),
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },
  gearDetails: {
    flex: 1,
  },
  gearLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  gearSub: {
    fontSize: moderateScale(10.5),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(1),
  },
  verifiedCalibrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  calibrationText: {
    fontSize: moderateScale(10),
    fontWeight: '800',
    color: PROVIDER_THEME.success,
  },
  // Existing layout styles
  complianceCard: {
    paddingVertical: moderateScale(6),
    borderColor: 'rgba(16, 185, 129, 0.08)',
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: PROVIDER_THEME.border,
  },
  checkedWrapper: {
    marginRight: moderateScale(12),
  },
  complianceTextWrap: {
    flex: 1,
  },
  complianceLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  complianceSub: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(14),
    gap: moderateScale(12),
  },
  iconBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.jadeMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prefTextCol: {
    flex: 1,
    minWidth: 0,
    paddingRight: moderateScale(4),
  },
  prefLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.ink,
  },
  prefSub: {
    fontSize: moderateScale(12),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(3),
    lineHeight: moderateScale(17),
  },
  prefRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(4),
    flexShrink: 0,
  },
  prefVal: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: PROVIDER_THEME.jade,
  },
  rowCard: {
    paddingVertical: moderateScale(4),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(14),
    borderBottomWidth: 1,
    borderBottomColor: PROVIDER_THEME.border,
  },
  rowText: {flex: 1},
  rowLabel: {fontWeight: '700', color: PROVIDER_THEME.navy, fontSize: moderateScale(13)},
  rowValue: {
    fontSize: moderateScale(11),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: moderateScale(8),
    backgroundColor: PROVIDER_THEME.error,
    paddingVertical: moderateScale(16),
    borderRadius: moderateScale(14),
    marginTop: moderateScale(16),
    shadowColor: PROVIDER_THEME.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {color: '#FFF', fontWeight: '800', fontSize: moderateScale(15)},
  bottomSpacer: {height: moderateScale(24)},

  // ── MODAL POPUP DESIGN SYSTEM ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: Platform.OS === 'ios' ? moderateScale(34) : moderateScale(24),
    ...PROVIDER_THEME.shadowStyles.float,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: PROVIDER_THEME.navy,
  },
  modalSubtitle: {
    fontSize: moderateScale(11.5),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
  },
  closeModalBtn: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: moderateScale(16),
  },
  modalScrollBody: {
    marginBottom: moderateScale(16),
  },
  bioInput: {
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(29, 53, 87, 0.08)',
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.navy,
    textAlignVertical: 'top',
    height: moderateScale(120),
    lineHeight: moderateScale(18),
  },
  charCount: {
    textAlign: 'right',
    fontSize: moderateScale(10.5),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
    fontWeight: '600',
  },
  // Selection list styles
  optionsList: {
    gap: moderateScale(8),
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 53, 87, 0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(29, 53, 87, 0.05)',
    padding: moderateScale(14),
    borderRadius: moderateScale(14),
  },
  optionItemChecked: {
    backgroundColor: 'rgba(29, 53, 87, 0.06)',
    borderColor: PROVIDER_THEME.navy,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(12),
    flex: 1,
  },
  checkbox: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(6),
    borderWidth: 2,
    borderColor: 'rgba(29, 53, 87, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: PROVIDER_THEME.navy,
    borderColor: PROVIDER_THEME.navy,
  },
  optionText: {
    fontSize: moderateScale(13.5),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  optionTextChecked: {
    color: PROVIDER_THEME.navy,
  },
  optionSub: {
    fontSize: moderateScale(10.5),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(2),
  },
  modalFooter: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(29, 53, 87, 0.05)',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: PROVIDER_THEME.navy,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: PROVIDER_THEME.navy,
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
