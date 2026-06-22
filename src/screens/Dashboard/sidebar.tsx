import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { AuthFetch, AuthPost } from '../../auth/auth';

// Import responsive utilities
import {
  responsiveWidth,
  responsiveText,
  moderateScale,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  SAFE_AREA,
} from '../../utility/responsive';
// At the top, replace the old icon imports with your custom SVGs
import {
  DashboardIcon,
  AppointmentsIcon,
  FollowUpsIcon,
  MyPatientsIcon,
  DigitalPrescriptionIcon,
  LabsIcon,
  PharmacyIcon,
  TemplatesIcon,
  StaffManagementIcon,
  ClinicManagementIcon,
  AvailabilityIcon,
  BillingIcon,
  BankIcon,
  ReviewsIcon,
  PinManagementIcon,
  DeleteAccountIcon,
  LogoutIcon,
  EyeOpenIcon,
  RightIndicatorIcon,
  LoginIcon,
} from '../../utility/SvgIcons';

const Sidebar = () => {
  const navigation = useNavigation<any>();
  const currentuserDetails = useSelector((state: any) => state?.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;
  const userId = currentuserDetails?.userId
  const [department, setDepartment] = useState<string | undefined>(
    currentuserDetails?.specialization?.name
  );
  const [access, setAccess] = useState<string[]>(
    Array.isArray(currentuserDetails?.access) ? currentuserDetails.access : []
  );
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Get profile picture from currentuserDetails
  const profilePic = currentuserDetails?.profilepic;

  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: handleLogout,
        },
      ],
      { cancelable: true }
    );
  };
  // Base menu items (shared)
  const baseMenuItems = [
    {
      key: 'dashboard',
      label: ' Dashboard',
      description: 'Ratings, milestones, trust metrics',
      icon: DashboardIcon,
      onPress: () => navigation.navigate('DoctorDashboard'),
    },
    {
      key: 'appointments',
      label: 'Appointments',
      description: 'Manage your appointments',
      icon: AppointmentsIcon,
      onPress: () => navigation.navigate('Appointments'),
    },
    {
      key: 'followups',
      label: 'Follow-ups',
      description: 'Patient follow-up management',
      icon: FollowUpsIcon,
      onPress: () => navigation.navigate('FollowUps'),
    },
    {
      key: 'my-patients',
      label: 'My Patient',
      description: 'Total patient',
      icon: MyPatientsIcon,
      onPress: () => navigation.navigate('MyPatient'),
    },
    {
      key: 'prescription',
      label: 'Digital-Prescription',
      description: 'Patient Prescription',
      icon: DigitalPrescriptionIcon,
      onPress: () => navigation.navigate('EPrescriptionList'),
    },
    {
      key: 'labs',
      label: 'Labs',
      description: 'Labs',
      icon: LabsIcon,
      onPress: () => navigation.navigate('labs'),
    },
    {
      key: 'pharmacy',
      label: 'Pharmacy',
      description: 'Pharmacy',
      icon: PharmacyIcon,
      onPress: () => navigation.navigate('Pharmacy'),
    },
    {
      key: 'templates',
      label: 'Templates',
      description: 'Create & Reuse templates',
      icon: TemplatesIcon,
      onPress: () => navigation.navigate('Templates'),
    },

    {
      key: 'staff-management',
      label: 'Staff Management',
      description: 'Update Staff Management',
      icon: StaffManagementIcon,
      onPress: () => navigation.navigate('StaffManagement'),
    },
    {
      key: 'clinic-management',
      label: 'Clinic Management',
      description: 'Manage clinic settings and information',
      icon: ClinicManagementIcon,
      onPress: () => navigation.navigate('Clinic'),
    },
    {
      key: 'availability',
      label: 'Availability',
      description: 'Update Availability',
      icon: AvailabilityIcon,
      onPress: () => navigation.navigate('Availability'),
    },
    {
      key: 'billing',
      label: 'Billing',
      description: 'All Bills ',
      icon: BillingIcon,
      onPress: () => navigation.navigate('Billing'),
    },
    {
      key: 'accounts',
      label: 'Accounts',
      description: 'Accounts ',
      icon: BankIcon,
      onPress: () => navigation.navigate('Accounts'),
    },
    {
      key: 'reviews',
      label: 'Reviews',
      description: 'Manage reviews and ratings',
      icon: ReviewsIcon,
      onPress: () => navigation.navigate('Reviews'),
    },
        {
      key: 'pin-management',
      label: 'PIN Management',
      description: 'Set or change your PIN',
      icon: PinManagementIcon,
      onPress: () => navigation.navigate('PinManagement'),
    },
    {
          key: 'delete-account',
          label: 'Delete Account',
          description: 'Permanently delete your account',
          icon: DeleteAccountIcon,
          onPress: () => confirmDeleteAccount(),
        },
      ];

      const logoutMenu = {
        key: 'Logout',
        label: 'Logout',
        description: 'Sign out of your account',
        icon: LogoutIcon,
        onPress: confirmLogout,
      };

      const loginMenu = {
        key: 'Login',
        label: 'Login',
        description: 'Sign in to your account',
        icon: LoginIcon,
        onPress: () => navigation.navigate('Login'),
      };

      const menuItems = isLoggedIn ? [...baseMenuItems, logoutMenu] : [...baseMenuItems, loginMenu];

  const dispatch = useDispatch();

  const confirmDeleteAccount = ()=>{
    Alert.alert(
      'Confirm Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem('authToken');
              if (!storedToken) {
                Alert.alert('Error', 'Authentication token missing. Please login ');
              navigation.navigate('Login');
                return;
              }

              const response = await AuthFetch('/deleteMyAccount', storedToken);

              Alert.alert('Success', (response as any)?.message || 'Account deleted successfully');
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userId');

              dispatch({ type: 'currentUser', payload: null });
              dispatch({ type: 'currentUserID', payload: null });

              setIsLoggedIn(false);

              navigation.navigate('Login');
            } catch (error) {
              Alert.alert(
                'Error',
                typeof error === 'object' && error !== null && 'message' in error
                  ? (error as any).message
                  : 'Failed to delete account. Please try again.'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  }

  const fetchUserData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      //if we have token then we need to add one item in menuItems array for delete account

      if (storedToken) {
        const profileResponse = await AuthFetch(
          `users/getUser?userId=${userId}`,
          storedToken
        );
        if ((profileResponse as any)?.status === 'success' && (profileResponse as any)?.data) {
          const userData = (profileResponse as any)?.data?.data;

          if (userData?.role !== 'doctor') {
            setDepartment(userData?.specialization?.name || department);
          }
          if (userData?.access && Array.isArray(userData.access)) {
            const accessMap: { [key: string]: string } = {
              viewPatients: 'my-patients',
              myPatients: 'my-patients',
              'my-patients': 'my-patients',
              dashboard: 'dashboard',
              appointments: 'appointments',
              followups: 'followups',
              availability: 'availability',
              labs: 'labs',
              pharmacy: 'pharmacy',
              staff: 'staff-management',
              staffManagement: 'staff-management',
              'staff-management': 'staff-management',
              clinic: 'clinic-management',
              clinicManagement: 'clinic-management',
              'clinic-management': 'clinic-management',
              accounts: 'accounts',
              billing: 'billing',
              reviews: 'reviews',
              digitalPrescription: 'prescription',
              prescription: 'prescription',
              pinManagement: 'pin-management',
              'pin-management': 'pin-management',
            };
            const transformedAccess = userData.access
              .map((item: string) => {
                const mapped = accessMap[item];
                return mapped;
              })
              .filter((item: string | undefined) => item !== undefined);

            const uniqueAccess = [...new Set(transformedAccess)];
            setAccess(uniqueAccess as string[]);
          }
          dispatch({ type: 'currentDoctor', payload: userData });
        }
      }
    } catch (error) {
      Alert.alert(
        'Error',
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as any).message
          : 'Failed to fetch user data. Please try again.'
      );
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Check token and fetch user-specific data
    const checkAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        setIsLoggedIn(!!token);
      } catch (e) {
        setIsLoggedIn(false);
      }
    };

    checkAuthToken();
    fetchUserData();
  }, [doctorId]);

  const handleLogout = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      
    if (!storedToken) {
        //show alert after 3 seconds navigate to login screen
        Alert.alert('Error', 'Authentication token missing. Please login ');
        setTimeout(() => {
          navigation.navigate('Login');
        }, 3000);
        return;
      }

      const response = await AuthPost('auth/logout', {}, storedToken, undefined as any);

      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId');

  setIsLoggedIn(false);

      dispatch({ type: 'currentUser', payload: null });
      dispatch({ type: 'currentUserID', payload: null });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully',
        position: 'top',
        visibilityTime: 3000,
      });

      navigation.navigate('Login');
      return;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to log out. Please try again.',
        position: 'top',
        visibilityTime: 3000,
      });
    }
  };

  const imageSource = profilePic
  const name =
    currentuserDetails?.role === 'doctor'
      ? `Dr. ${currentuserDetails?.firstname || ''} ${currentuserDetails?.lastname || ''}`
      : `${currentuserDetails?.firstname || ''} ${currentuserDetails?.lastname || ''}`;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
    >

      <View style={styles.header}>
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={styles.profileImage}
            resizeMode="cover"
            onError={() => {}}
          />
        ) : (
          <View style={styles.placeholderCircle}>
            <Text style={styles.placeholderText}>
              {(currentuserDetails?.firstname?.[0]?.toUpperCase() || '') +
                (currentuserDetails?.lastname?.[0]?.toUpperCase() || '')}
            </Text>
          </View>
        )}

        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.title}>{department}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
         <RightIndicatorIcon size={moderateScale(24)} color="black" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <EyeOpenIcon size={moderateScale(16)} color="#007AFF" />
        
        <Text style={styles.profileButtonText}>View Profile</Text>
      </TouchableOpacity>

      {((currentuserDetails?.role === 'doctor' || !currentuserDetails)
        ? menuItems
        : menuItems?.filter(
          (item) => access?.includes(item.key) || item.key === 'Logout'
        )
      ).map((item, index) => (
        <MenuItem
          key={index}
          icon={item.icon}
          label={item.label}
          description={item.description}
          iconColor="#8B5CF6"
          onPress={item.onPress}
        />
      ))}
    </ScrollView>
  );
};

type MenuItemProps = {
  icon: React.FC<any>; // SVG Component
  label: string;
  description: string;
  iconColor: string;
  onPress?: () => void;
};

const MenuItem: React.FC<MenuItemProps> = ({
  icon: IconComponent,
  label,
  description,
  iconColor,
  onPress,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
     <IconComponent size={moderateScale(18)} color={iconColor} />
    </View>
    <View>
      <Text style={styles.menuText}>{label}</Text>
      <Text style={styles.subText}>{description}</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingHorizontal: responsiveWidth(5),
    paddingTop: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
    borderTopRightRadius: moderateScale(16),
    borderBottomRightRadius: moderateScale(16),
    backgroundColor: '#fff',
  },
  header: {
    marginTop: SAFE_AREA.safeTop + SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  profileImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    marginRight: SPACING.lg,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#111',
  },
  title: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#007AFF',
  },
  placeholderCircle: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(30),
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  placeholderText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#fff'
  },
  profileButton: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.lg,
  },
  profileButtonText: {
    marginLeft: SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#007AFF',
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  menuText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#111',
  },
  subText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#555',
  },
});

export default Sidebar;