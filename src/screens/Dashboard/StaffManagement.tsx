import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, ScrollView, Keyboard, SafeAreaView } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthPost, AuthFetch, AuthPut } from '../../auth/auth';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// Import responsive utilities
import {
  responsiveHeight,
  responsiveText,
  moderateScale,
  isTablet,
  SPACING,
  FONT_SIZE,
  LAYOUT,
} from '../../utility/responsive';
import CommonHeader from '../../utility/CommonHeader';
import { DeleteAccountIcon, DropdownIcon, EditIcon, EyeOpenIcon, FilterIcon } from '../../utility/SvgIcons';

interface Staff {
  profilepic: string;
  DOB: any;
  gender: string;
  mobile: string;
  userId: string;
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Online' | 'Offline' | 'Blocked';
  avatar: string;
  lastLogin: string;
  isBlocked?: boolean;
  access?: string[];
}

const StaffManagement = () => {
  const currentuserDetails = useSelector((state: any) => state.currentUser);

// const { role, createdBy } = currentuserDetails || {};
// const isDoctor = role?.toLowerCase() === "doctor";
// const userId = isDoctor? currentuserDetails?.userId : createdBy;
interface UserDetails {
  role?: string;
  userId?: string;
  createdBy?: string;
}

const { role, userId: currentUserId, createdBy } = (currentuserDetails as UserDetails) || {};
const isDoctor = role?.toLowerCase() === "doctor";
const userId = isDoctor ? currentUserId : createdBy;

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor':
        return '#A855F7';
      case 'assistant':
        return '#F97316';
      case 'receptionist':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const navigation = useNavigation<any>();

  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'delete' | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [form, setForm] = useState({
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    gender: '',
    DOB: '',
    profilepic: {},
    access: [] as string[],
    role: ''
  });

  const accessOptions = [
    { value: "my-patients", label: "My Patients" },
    { value: "appointments", label: "Appointments" },
    { value: "labs", label: "Labs" },
    { value: "dashboard", label: "Dashboard" },
    { value: "pharmacy", label: "Pharmacy" },
    { value: "availability", label: "Availability" },
    { value: "staff-management", label: "Staff Management" },
    { value: "clinic-management", label: "Clinic Management" },
    { value: "billing", label: "Billing" },
    { value: "reviews", label: "Reviews" },
  ];

  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [accessDropdownVisible, setAccessDropdownVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Lab Assistant' | 'Pharmacy Assistant' | 'Assistant' | 'Receptionist'>('all');

  const options = [
    { label: 'All', value: 'all' },
    { label: 'Lab Assistant', value: 'lab_assistant' },
    { label: 'Pharmacy Assistant', value: 'pharmacy_assistant' },
    { label: 'Assistant', value: 'assistant' },
    { label: 'Receptionist', value: 'receptionist' },
  ];

  const [searchText, setSearchText] = useState('');
  const [originalStaffData, setOriginalStaffData] = useState<Staff[]>([]);
  const [fetchLoading, setFetchLoading] = useState<boolean>(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

const openModal = (type: 'view' | 'edit' | 'delete', staff: Staff) => {
  setSelectedStaff(staff);
  
  // Better name splitting logic
  const nameParts = staff.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  
  setForm({
    userId: staff.userId,
    firstName: firstName,
    lastName: lastName,
    email: staff.email,
    mobile: staff.mobile || '',
    gender: staff.gender || '',
    DOB: staff.DOB || 'N/A',
    profilepic: staff.profilepic || {},
    access: staff.access || [],
    role: staff.role || '',
  });
  setMode(type);
  setModalVisible(true);
};

  const closeModal = () => {
    setModalVisible(false);
    setMode(null);
    setSelectedStaff(null);
    setAccessDropdownVisible(false);
  };

  const handleEditSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const formatDOBToDDMMYYYY = (dobString: string): string => {
        const date = new Date(dobString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const { firstName, lastName, ...restForm } = form;
      const payload = {
        ...restForm,
        stafftype: form.role,
        userId: form.userId,
        DOB: form.DOB,
        firstname: form.firstName,
        lastname: form.lastName
      };

      const res = await AuthPut('doctor/editReceptionist', payload, token);
      if (res.status === 'success' || res.data?.status === 'success' || res.data?.status === 'Success') {
        fetchStaff();
        Alert.alert('Success', res.data?.message || res.message || 'Staff updated successfully');
        closeModal();
        return;
      } else {
        const errorMessage = res.message?.message || res.message || 'Failed to update staff';
        Alert.alert('Error', errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update staff';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token)return;
      const res = await AuthFetch(`users/deleteMyAccount?userId=${selectedStaff?.userId}`, token);
      if (res?.data?.status === 'success') {
        fetchStaff();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Staff Deleted Successfully',
          position: 'top',
          visibilityTime: 3000,
        });
        closeModal();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to delete staff');
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setStaffData(originalStaffData);
    } else {
      const filtered = originalStaffData.filter((staff) =>
        staff.email.toLowerCase().includes(text.toLowerCase())
      );
      setStaffData(filtered);
    }
  };

  useEffect(() => {
    if (selectedStatus !== 'all') {
      const filtered = originalStaffData.filter((staff) =>
        staff.role.toLowerCase() === selectedStatus.toLowerCase()
      );
      setStaffData(filtered);
    } else {
      setStaffData(originalStaffData);
    }
  }, [selectedStatus]);

  const fetchStaff = async () => {
    if (!userId) return;
    try {
      setFetchLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await AuthFetch(`doctor/getStaffByCreator/${userId}`, token);

      let filterData: any[] = [];
      if ('data' in response && response.data && Array.isArray(response.data.data)) {
        filterData = response.data.data.filter(
          (each: { userId: any }) => each.userId !== currentuserDetails.createdBy
        );
      }

      const sortedData = [...filterData].sort((a, b) => {
        const dateA = new Date(a.joinDate).getTime();
        const dateB = new Date(b.joinDate).getTime();
        return dateB - dateA;
      });

      const formattedData: Staff[] = sortedData.map((staff, index) => ({
        id: staff._id || String(index + 1),
        name: staff.name,
        userId: staff.userId,
        role: staff.stafftype || 'Unknown',
        email: staff.email,
        mobile: staff.mobile || 'N/A',
        gender: staff.gender || 'Unknown',
        DOB: staff.DOB || 'N/A',
        profilepic: staff.profilepic || '',
        avatar: staff.avatar || 'https://via.placeholder.com/150',
        status: staff.isLoggedIn ? 'Online' : (staff.status?.toLowerCase() === 'blocked' ? 'Blocked' : 'Offline'),
        lastLogin: staff.lastLogin && staff.lastLogin !== "N/A"
          ? dayjs(staff.lastLogin).isValid()
            ? dayjs(staff.lastLogin).format("YYYY-MM-DD HH:mm:ss")
            : staff.lastLogin
          : "-",
        isBlocked: staff.status?.toLowerCase() === 'blocked',
        access: staff.access || []
      }));

      setOriginalStaffData(formattedData);
      setStaffData(formattedData);
    } catch (error: any) {
      let errorMessage = 'Failed to fetch staff data';
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Error Fetching Staff', errorMessage);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const renderStaffCard = ({ item }: { item: Staff }) => (
    <View style={styles.card}>
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
        ) : (
          <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={[
            styles.statusDot,
            {
              backgroundColor:
                item.status === 'Online' ? '#22C55E' :
                  item.status === 'Offline' ? '#FBBF24' : 'gray',
            },
          ]} />
        </View>

        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
        
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.lastLogin}>
          {item.isBlocked ? 'Account blocked' : `Last login: ${item.lastLogin}`}
        </Text>
      </View>
      <View style={styles.bottomRow}>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => openModal('view', item)}>
            <EyeOpenIcon size={moderateScale(20)} color="#6B7280" />
          </TouchableOpacity>

          {isDoctor && (
            <>
              <TouchableOpacity style={styles.iconButton} onPress={() => openModal('edit', item)}>
                <EditIcon size={moderateScale(20)} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => openModal('delete', item)}>
                <DeleteAccountIcon size={moderateScale(20)} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={() => {
      setDropdownVisible(false);
      setAccessDropdownVisible(false);
      Keyboard.dismiss();
    }}>

    <View style={styles.container}>
      <CommonHeader title="Staff Management" />

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search by email"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.filterButton}
              onPress={() => setDropdownVisible((prev) => !prev)}
            >
              <FilterIcon size={moderateScale(24)} color="#fff" />
          </TouchableOpacity>
        </View>
        {dropdownVisible && (
          <View style={styles.dropdown}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setSelectedStatus(option.value as typeof selectedStatus);
                  setDropdownVisible(false);
                }}
                style={styles.dropdownOption}
              >
                <Text style={styles.dropdownText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isDoctor && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddStaff')}>
          <Text style={styles.addButtonText}>+ Add Staff</Text>
        </TouchableOpacity>
      )}

        {fetchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B7280" />
            <Text style={styles.loadingText}>Loading staff...</Text>
          </View>
        ) : (
          <FlatList
            data={staffData}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffCard}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No staff found.</Text>
              </View>
            }
          />
        )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setAccessDropdownVisible(false);
            Keyboard.dismiss();
          }}
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.modal}>
              <ScrollView
                style={[styles.modalScroll, { maxHeight: responsiveHeight(70) }]}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: SPACING.lg * 2 }]}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
              <Text style={styles.title}>
                {mode === 'view' && 'Staff Details'}
                {mode === 'edit' && 'Edit Staff'}
                {mode === 'delete' && 'Delete Staff'}
              </Text>

              {['firstName', 'lastName', 'email', 'mobile', 'gender', 'DOB', 'access'].map((field, i) => (
                <View key={i} style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {field === 'firstName' ? 'Firstname' :
                      field === 'lastName' ? 'Lastname' :
                        field === 'DOB' ? 'Date of Birth' :
                          field === 'access' ? 'Access' :
                            field.charAt(0).toUpperCase() + field.slice(1)}
                  </Text>
                  {mode === 'view' ? (
                    <Text style={styles.value}>
                      {field === 'access'
                        ? Array.isArray(form.access)
                          ? form.access.join(', ')
                          : ''
                        : String(form[field as keyof typeof form] ?? '')}
                    </Text>
                  ) : field === 'access' ? (
                    <>
                      <View style={styles.accessContainer}>
                          {Array.isArray(form.access) &&
                          form.access.map((item, idx) => (
                            <View key={idx} style={styles.accessItem}>
                              <Text style={styles.accessText}>{item}</Text>
                              <Text
                                style={styles.removeButton}
                                onPress={() =>
                                  setForm({
                                    ...form,
                                    access: form.access.filter((_, ii) => ii !== idx),
                                  })
                                }
                              >
                                ✕
                              </Text>
                            </View>
                          ))}
                      </View>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setAccessDropdownVisible((prev) => !prev)}
                      >
                        <Text style={styles.dropdownButtonText}>Select access to add...</Text>
                        <DropdownIcon size={moderateScale(20)} color="#6B7280"/>
                      </TouchableOpacity>
                      {accessDropdownVisible && (
                        <View style={styles.accessDropdown}>
                          <ScrollView 
                            style={{ maxHeight: moderateScale(200) }}
                            nestedScrollEnabled={true}
                          >
                            {accessOptions.map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                onPress={() => {
                                  if (!form.access.includes(option.value)) {
                                    setForm({ ...form, access: [...form.access, option.value] });
                                  }
                                  setAccessDropdownVisible(false);
                                }}
                                style={styles.modalDropdownOption}
                              >
                                <Text style={styles.modalDropdownText}>{option.label}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </>
                  ) : field === 'mobile' ? (
                    <TextInput
                      value={String(form.mobile ?? '')}
                      onChangeText={(text) => {
                        const onlyDigits = text.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, mobile: onlyDigits });
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                      style={styles.input}
                      editable={mode === 'edit'}
                      placeholder="10-digit mobile"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <TextInput
                      value={
                        Array.isArray(form[field as keyof typeof form])
                          ? ''
                          : String(form[field as keyof typeof form] ?? '')
                      }
                      onChangeText={(text) => setForm({ ...form, [field]: text })}
                      style={styles.input}
                      editable={mode === 'edit'}
                          placeholderTextColor="#999"
                    />
                  )}
                </View>
              ))}

              <View style={[styles.buttonRow, isKeyboardVisible && { marginTop: SPACING.md }]}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                {isDoctor && (
                  <>
                    {mode === 'edit' && (
                      <TouchableOpacity style={styles.saveButton} onPress={handleEditSubmit}>
                        <Text style={styles.saveText}>Save</Text>
                      </TouchableOpacity>
                    )}
                    {mode === 'delete' && (
                      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default StaffManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.sm,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: moderateScale(40),
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#fff',
    marginRight: SPACING.sm,
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: SPACING.xs,
  },
  filterButton: {
    padding: SPACING.xs,
    backgroundColor: '#3B82F6',
    borderRadius: LAYOUT.borderRadius.md,
  },
  addButton: {
    backgroundColor: '#10B981',
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  addButtonText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...LAYOUT.shadow.sm,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#111827',
    marginRight: SPACING.sm,
  },
  roleBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: SPACING.xs,
  },
  roleText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#fff',
    fontWeight: '500',
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  email: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  lastLogin: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#9CA3AF',
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  iconButton: {
    paddingHorizontal: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modal: {
    width: '100%',
    maxWidth: moderateScale(600),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.lg,
    maxHeight: '90%',
  },
  modalScroll: {
    width: '100%'
  },
  modalScrollContent: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '700',
    marginBottom: SPACING.md,
    textAlign: 'center',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: '#555',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  value: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: 'black',
    paddingVertical: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    fontSize: responsiveText(FONT_SIZE.sm),
    backgroundColor: '#f9fafb',
    color: 'black',
    minHeight: moderateScale(40),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#e5e7eb',
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(40),
    justifyContent: 'center',
  },
  cancelText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  saveButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#10b981',
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(40),
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  deleteButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#ef4444',
    borderRadius: LAYOUT.borderRadius.md,
    minHeight: moderateScale(40),
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  dropdown: {
    position: 'absolute',
    top: moderateScale(50),
    right: 0,
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    elevation: 5,
    zIndex: 999,
    width: moderateScale(150),
    paddingVertical: SPACING.xs,
    ...LAYOUT.shadow.md,
  },
  dropdownOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  dropdownText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
  },
  avatarContainer: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
  },
  avatarText: {
    color: '#f6f8fcff',
    fontSize: moderateScale(20),
    fontWeight: 'bold',
  },
  accessContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  accessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.pill,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  accessText: {
    marginRight: SPACING.xs,
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  removeButton: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    backgroundColor: '#f9fafb',
    marginTop: SPACING.xs,
    minHeight: moderateScale(40),
  },
  dropdownButtonText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
  },
  accessDropdown: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 5,
    zIndex: 999,
    marginTop: SPACING.xs,
    width: '100%',
    ...LAYOUT.shadow.md,
  },
  modalDropdownOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  modalDropdownText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: '#6B7280',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: responsiveHeight(20),
  },
  emptyText: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: responsiveHeight(15),
  },
});