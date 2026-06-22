import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AuthFetch } from '../../auth/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import moment from 'moment';

// Import responsive utilities
import {
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
import { CloseXIcon, EyeOpenIcon, FilterIcon, SearchIcon } from '../../utility/SvgIcons';

interface Patient {
  id: string;
  appointmentId: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other' ;
  age: string;
  phone: string;
  lastVisit: string;
  appointmentType: string;
  status: string;
  department: string;
  appointmentStatus: string;
  appointmentReason: string;
  appointmentTime: string;
  appointmentCount: number;
  allAppointments: any[];
  ePrescription: any | null;
  avatar: string;
}

interface PrescriptionData {
  medicines: Array<{
    id?: string;
    medName: string;
    quantity: string;
    dosage: string;
    duration: string;
    frequency: string;
  }>;
  tests: Array<{
    id?: string;
    name: string;
    labTestID: string;
    status: string;
  }>;
}

const MyPatients: React.FC = () => {
  const currentUserDetails = useSelector((state: any) => state.currentUser);
  const doctorId = currentUserDetails?.role === 'doctor' ? currentUserDetails?.userId : currentUserDetails?.createdBy;
  const hasFetchedPatients = useRef(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'id' | 'department'>('all');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'new-walkin' | 'new-homecare' | 'new-patient-walkthrough' | 'followup-walkin' | 'followup-video' | 'followup-homecare'
  >('all');
  const [isPrescriptionModalVisible, setIsPrescriptionModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData>({ medicines: [], tests: [] });
  const [ePrescriptionData, setEPrescriptionData] = useState<any | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  // Separate pagination for server-side data (for API calls and Next/Prev buttons)
  const [serverPagination, setServerPagination] = useState({
    pageSize: 5,
    total: 0,
    currentPage: 1,
  });

  const options = [
    { label: 'All', value: 'all' },
    { label: 'New Walkin', value: 'new-walkin' },
    { label: 'New HomeCare', value: 'new-homecare' },
    { label: 'New Patient Walkthrough', value: 'new-patient-walkthrough' },
    { label: 'Followup Walkin', value: 'followup-walkin' },
    { label: 'Followup Video', value: 'followup-video' },
    { label: 'Followup Homecare', value: 'followup-homecare' },
  ];

  const calculateAge = (dob: string): string => {
    if (!dob) return '';
    return moment().diff(moment(dob, 'DD-MM-YYYY'), 'years').toString();
  };

  const fetchPatients = useCallback(async (page: number = 1, limit: number = 5) => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        return;
      }

      const queryParams = new URLSearchParams({
        doctorId: String(doctorId),
        ...(searchText && { searchText: String(searchText) }),
        ...(selectedStatus !== 'all' && { appointmentType: String(selectedStatus) }),
        page: String(page),
        limit: String(limit),
      });
// /appointment/getUniqueAppointmentsByDoctorID
      const res = await AuthFetch(`appointment/getUniqueAppointmentsByDoctorID?${queryParams.toString()}`, token);
      if (res.status === 'success' && res.data?.data) {
        const { appointments, pagination: apiPagination, summary } = res.data.data;
        
        // Set total unique patients count
        if (summary?.totalUniquePatients) {
          setTotalPatients(summary.totalUniquePatients);
        }
        
        const formattedPatients = appointments.map((appointment: any) => ({
          id: appointment.userId || appointment._id || '',
          appointmentId: appointment.appointmentId || '',
          name: appointment.patientName || '',
          gender: appointment.patientDetails?.gender || '',
          age: appointment.patientDetails?.dob
            ? calculateAge(appointment.patientDetails.dob)
            : appointment.patientDetails?.age || '',
          phone: appointment.patientDetails?.mobile || '',
          lastVisit: appointment.appointmentDate
            ? moment(appointment.appointmentDate).format('DD MMMM YYYY')
            : '',
          appointmentType: appointment.appointmentType || '',
          status:
            appointment.appointmentType === 'new-walkin' ||
            appointment.appointmentType === 'New-Walkin'
              ? 'New Patient'
              : 'Follow-up',
          department: appointment.appointmentDepartment || '',
          appointmentStatus: appointment.appointmentStatus || '',
          appointmentReason: appointment.appointmentReason || '',
          appointmentTime: appointment.appointmentTime || '',
          appointmentCount: 1,
          allAppointments: [appointment],
          ePrescription: appointment.ePrescription || null,
          avatar: 'https://i.pravatar.cc/150?img=12',
        }));

        setPatients(formattedPatients);
        setFilteredPatients(formattedPatients);
        
        // Update server-side pagination (controls Next/Previous buttons)
        setServerPagination({
          pageSize: apiPagination.pageSize || limit,
          total: apiPagination.totalItems || 0,
          currentPage: page,
        });
        
        setCurrentPage(page); // Ensure currentPage is set to the fetched page
      } else {
        setPatients([]);
        setFilteredPatients([]);
        setTotalPatients(0);
        setServerPagination({ pageSize: limit, total: 0, currentPage: 1 });
        setCurrentPage(1); // Reset to page 1 on empty data
      }
    } catch (error) {
      setPatients([]);
      setFilteredPatients([]);
      setTotalPatients(0);
      setServerPagination({ pageSize: limit, total: 0, currentPage: 1 });
      setCurrentPage(1); // Reset to page 1 on error
    } finally {
      setLoading(false);
    }
  }, [doctorId, searchText, selectedStatus]);

  const fetchPrescriptionDetails = useCallback(
    async (patientId: string) => {
      setPrescriptionLoading(true);
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          return;
        }

        const response = await AuthFetch(`pharmacy/getPatientPrescriptionDetails/${patientId}`, token);
        if (response.status === 'success' && response.data?.success) {
          setPrescriptionData({
            medicines: response.data.data.medicines?.map((med: any) => ({
              id: med.id || undefined,
              medName: String(med.medName || ''),
              quantity: String(med.quantity || ''),
              dosage: String(med.dosage || ''),
              duration: String(med.duration || ''),
              frequency: String(med.frequency || ''),
            })) || [],
            tests: response.data.data.tests?.map((test: any) => ({
              id: test.id || undefined,
              name: String(test.testName || ''),
              labTestID: String(test.labTestID || ''),
              status: String(test.status || ''),
            })) || [],
          });
        } else {
          throw new Error('Failed to fetch prescription details');
        }
      } catch (error) {
        setPrescriptionData({ medicines: [], tests: [] });
      } finally {
        setPrescriptionLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    
      hasFetchedPatients.current = true;
      fetchPatients(1, serverPagination.pageSize);
    
  }, [currentUserDetails, doctorId, serverPagination.pageSize, selectedStatus]);

  useEffect(() => {
    const filtered = patients.filter((patient) => {
      const searchLower = searchText.toLowerCase();
      if (searchField === 'all') {
        return (
          patient.name.toLowerCase().includes(searchLower) ||
          patient.id.toLowerCase().includes(searchLower) ||
          patient.department.toLowerCase().includes(searchLower) ||
          patient.phone.includes(searchLower)
        );
      } else if (searchField === 'name') {
        return patient.name.toLowerCase().includes(searchLower);
      } else if (searchField === 'id') {
        return patient.id.toLowerCase().includes(searchLower);
      } else if (searchField === 'department') {
        return patient.department.toLowerCase().includes(searchLower);
      }
      return true;
    });
    setFilteredPatients(filtered);
    
    // Don't update pagination.total here as it should only reflect server data
    // Only reset currentPage if the filter reduces the total pages below currentPage for SERVER pagination
    const serverTotalPages = Math.ceil(serverPagination.total / serverPagination.pageSize);
    if (currentPage > serverTotalPages && serverTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [searchText, searchField, patients, serverPagination.pageSize, serverPagination.total, currentPage]);

  const handlePageChange = (newPage: number) => {
    const serverTotalPages = Math.ceil(serverPagination.total / serverPagination.pageSize);
    if (newPage >= 1 && newPage <= serverTotalPages && !loading) {
      setCurrentPage(newPage);
      fetchPatients(newPage, serverPagination.pageSize);
    }
  };

  const handleViewPrescription = (patient: Patient) => {
    setSelectedPatient(patient);
    setPrescriptionData({ medicines: [], tests: [] });
    setEPrescriptionData(patient.ePrescription || null);
    fetchPrescriptionDetails(patient.id);
    setIsPrescriptionModalVisible(true);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'New Patient':
        return { container: styles.newTag, text: styles.newText };
      case 'Follow-up':
        return { container: styles.followUpTag, text: styles.followUpText };
      default:
        return { container: styles.defaultTag, text: styles.defaultText };
    }
  };

const shouldDisplayValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;

  const str = String(value).trim();
  if (!str) return false;

  const lower = str.toLowerCase();
  // common "empty" placeholders
  if (['n/a', 'na', 'undefined', 'null'].includes(lower)) return false;

  // treat only slashes/dashes ("/", "//", "-", "--", "/ - /" etc.) as empty
  const noSlashesDashes = str.replace(/[\/\-]/g, '').trim();
  if (!noSlashesDashes) return false;

  return true;
};

  const renderPatientItem = ({ item }: { item: Patient }) => {
    const { container, text } = getStatusStyles(item.status);
    return (
      <View style={styles.card}>
        
                     <View style={styles.placeholderCircle}>
                  <Text style={styles.placeholderText}>{item.name[0].toUpperCase() || ""}</Text>
                </View>

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.id}>ID: {item.id}</Text>
          <Text style={styles.id}>{item.appointmentType}</Text>

          <Text style={styles.details}>
            {item.gender}, {item.age} years
          </Text>
          <Text style={styles.phone}>{item.phone}</Text>
          <Text style={styles.lastVisit}>Last Visit: {item.lastVisit}</Text>
        </View>
        <View style={[styles.statusTag, container]}>
          <Text style={[styles.statusText, text]}>{item.status}</Text>
        </View>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewPrescription(item)}
        >
          <EyeOpenIcon size={moderateScale(20)} color="#9ca3af"/>
        </TouchableOpacity>
      </View>
    );
  };

  const handleFilterSelect = (value: typeof selectedStatus) => {
    setSelectedStatus(value);
    setDropdownVisible(false);
    setCurrentPage(1);
    // Fetch immediately with the new status
    // fetchPatients(1, serverPagination.pageSize, value);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >

      <CommonHeader title="My Patients" />

      <View style={styles.searchContainer}>
        <SearchIcon size={moderateScale(20)} color="#999" style={styles.searchIcon}/>
        <TextInput
          placeholder={`Search by ${searchField === 'all' ? 'Patient ID, Name' : searchField}`}
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setDropdownVisible((prev) => !prev)}>
       <FilterIcon size={moderateScale(24)} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {dropdownVisible && (
        <View style={styles.dropdown}>
          {options.map((option) => (
<TouchableOpacity
  key={option.value}
  onPress={() => handleFilterSelect(option.value as typeof selectedStatus)}
  // onPress={() => {
  //   setSelectedStatus(option.value);
  //   setDropdownVisible(false);
  //   setCurrentPage(1); // Reset to first page on filter change
  //   fetchPatients(1, pagination.pageSize); // Fetch patients with new filter
  // }}
  style={[
    styles.dropdownOption,
    selectedStatus === option.value && styles.dropdownOptionSelected, // Highlight when active
  ]}
>
  <Text
    style={[
      styles.dropdownText,
      selectedStatus === option.value && styles.dropdownTextSelected, // Change text color
    ]}
  >
    {option.label}
  </Text>
</TouchableOpacity>

          ))}
          
        </View>
      )}

      <FlatList
        data={filteredPatients}
        keyExtractor={(item) => item.appointmentId}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
<View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Loading Patients...</Text> 
            </View>
            ) : (
              <Text style={styles.emptyText}>No patients found.</Text>
            )}
          </View>
        }
        renderItem={renderPatientItem}
      />

      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
        >
          <Text style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>
        
        <View style={styles.paginationCenter}>
          <Text style={styles.paginationInfo}>
            Page {currentPage} of {Math.ceil(serverPagination.total / serverPagination.pageSize) || 1}
          </Text>
          <Text style={styles.paginationSubInfo}>
            Total: {totalPatients} patients
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= Math.ceil(serverPagination.total / serverPagination.pageSize)}
          style={[
            styles.paginationButton,
            currentPage >= Math.ceil(serverPagination.total / serverPagination.pageSize) && styles.disabledButton,
          ]}
        >
          <Text
            style={[
              styles.paginationText,
              currentPage >= Math.ceil(serverPagination.total / serverPagination.pageSize) && styles.disabledText,
            ]}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isPrescriptionModalVisible}
        animationType="slide"
        onRequestClose={() => setIsPrescriptionModalVisible(false)}
        transparent={false}
      >
         <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >

          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                Patient Prescription Details
              </Text>
              {selectedPatient && (
                <Text style={styles.modalSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  {selectedPatient.name}
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsPrescriptionModalVisible(false)}
            >
              <CloseXIcon size={moderateScale(24)} color="#1E293B" />
            </TouchableOpacity>
          </View>
          
          {selectedPatient && (
            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <View style={styles.prescriptionSection}>
                <Text style={styles.sectionTitle}>Patient Information</Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Patient ID:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.id || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.name || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Gender:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.gender || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.phone || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Last Visit:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.lastVisit || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Department:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.department || ''}</Text>
                  </View>
                  <View style={styles.infoItemContainer}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>{selectedPatient.status || ''}</Text>
                  </View>
                </View>
              </View>

              {ePrescriptionData && (
                <View style={styles.prescriptionSection}>
                  <Text style={styles.sectionTitle}>ePrescription Details</Text>
                  {ePrescriptionData.patientInfo && (
                    <View style={styles.subSection}>
                      <Text style={styles.subSectionTitle}>Patient Info</Text>
                    <View style={styles.infoGrid}>
                      {shouldDisplayValue(ePrescriptionData.patientInfo.age) && (
                        <View style={styles.infoItemContainer}>
                          <Text style={styles.infoLabel}>Age:</Text>
                          <Text style={styles.infoValue}>{String(ePrescriptionData.patientInfo.age)}</Text>
                        </View>
                      )}
                      {shouldDisplayValue(ePrescriptionData.patientInfo.chiefComplaint) && (
                        <View style={styles.infoItemContainer}>
                          <Text style={styles.infoLabel}>Chief Complaint:</Text>
                          <Text style={styles.infoValue}>{String(ePrescriptionData.patientInfo.chiefComplaint)}</Text>
                        </View>
                      )}
                    </View>
                    </View>
                  )}

                  {ePrescriptionData.vitals && (
                    <View style={styles.subSection}>
                      <Text style={styles.subSectionTitle}>Vitals</Text>
                      <View style={styles.infoGrid}>
                        {shouldDisplayValue(ePrescriptionData.vitals.bp) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>BP:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.bp)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.pulseRate) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>Pulse Rate:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.pulseRate)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.respiratoryRate) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>Respiratory Rate:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.respiratoryRate)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.temperature) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>Temperature:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.temperature)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.spo2) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>SPO2:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.spo2)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.height) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>Height:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.height)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.weight) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>Weight:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.weight)}</Text>
                          </View>
                        )}
                        {shouldDisplayValue(ePrescriptionData.vitals.bmi) && (
                          <View style={styles.infoItemContainer}>
                            <Text style={styles.infoLabel}>BMI:</Text>
                            <Text style={styles.infoValue}>{String(ePrescriptionData.vitals.bmi)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {ePrescriptionData.diagnosis && shouldDisplayValue(ePrescriptionData.diagnosis.diagnosisNote) && (
                    <View style={styles.subSection}>
                      <Text style={styles.subSectionTitle}>Diagnosis</Text>
                      <View style={styles.infoItemContainer}>
                        <Text style={styles.infoLabel}>Diagnosis Note:</Text>
                        <Text style={[styles.infoValue, styles.multilineText]}>{String(ePrescriptionData.diagnosis.diagnosisNote)}</Text>
                      </View>
                    </View>
                  )}

                  {ePrescriptionData.advice && (
                    <View style={styles.subSection}>
                      <Text style={styles.subSectionTitle}>Advice</Text>
                    <View style={styles.infoGrid}>
                      {shouldDisplayValue(ePrescriptionData.advice.followUpDate) && (
                        <View style={styles.infoItemContainer}>
                          <Text style={styles.infoLabel}>Follow-up Date:</Text>
                          <Text style={styles.infoValue}>
                            {moment(ePrescriptionData.advice.followUpDate).format('DD MMMM YYYY')}
                          </Text>
                        </View>
                      )}
                      {shouldDisplayValue(ePrescriptionData.advice.advice) && (
                        <View style={styles.infoItemContainer}>
                          <Text style={styles.infoLabel}>Advice:</Text>
                          <Text style={[styles.infoValue, styles.multilineText]}>{String(ePrescriptionData.advice.advice)}</Text>
                        </View>
                      )}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.prescriptionSection}>
                <Text style={styles.sectionTitle}>Prescribed Medicines</Text>
                {prescriptionLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : ePrescriptionData?.diagnosis?.medications?.length > 0 ? (
                  <View style={styles.tableContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(140) }]}>Medicine Name</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(70) }]}>Quantity</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(80) }]}>Dosage</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(80) }]}>Duration</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(90) }]}>Frequency</Text>
                    </View>
                    {ePrescriptionData.diagnosis.medications.map((med: any, index: number) => (
                      <View key={med.medInventoryId || index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: moderateScale(140) }]} numberOfLines={2}>{String(med.medName || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(70) }]}>{String(med.quantity || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(80) }]}>{String(med.dosage || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(80) }]}>{String(med.duration || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(90) }]}>{String(med.frequency || '')}</Text>
                      </View>
                    ))}
                  </View>
                    </ScrollView>
                  </View>
                ) : prescriptionData.medicines.length > 0 ? (
                  <View style={styles.tableContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(140) }]}>Medicine Name</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(70) }]}>Quantity</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(80) }]}>Dosage</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(80) }]}>Duration</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(90) }]}>Frequency</Text>
                    </View>
                    {prescriptionData.medicines.map((med, index) => (
                      <View key={med.id || index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: moderateScale(140) }]} numberOfLines={2}>{String(med.medName || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(70) }]}>{String(med.quantity || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(80) }]}>{String(med.dosage || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(80) }]}>{String(med.duration || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(90) }]}>{String(med.frequency || '')}</Text>
                      </View>
                    ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noDataMessage}>No medicines prescribed for this patient.</Text>
                )}
              </View>

              <View style={styles.prescriptionSection}>
                <Text style={styles.sectionTitle}>Prescribed Tests</Text>
                {prescriptionLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : ePrescriptionData?.diagnosis?.selectedTests?.length > 0 ? (
                <View style={styles.tableContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCellHeader, { width: moderateScale(150) }]}>Test Name</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(120) }]}>Lab Test ID</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(90) }]}>Status</Text>
                    </View>
                    {ePrescriptionData.diagnosis.selectedTests.map((test: any, index: number) => (
                      <View key={test.testInventoryId || test.testName || index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: moderateScale(150) }]} numberOfLines={2}>{String(test.testName || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(120) }]}>{String(test.testInventoryId || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(90) }]}>{String(test.status || 'Prescribed')}</Text>
                      </View>
                    ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : prescriptionData.tests.length > 0 ? (
                  <View style={styles.tableContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(150) }]}>Test Name</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(120) }]}>Lab Test ID</Text>
                      <Text style={[styles.tableCellHeader, { width: moderateScale(90) }]}>Status</Text>
                    </View>
                    {prescriptionData.tests.map((test, index) => (
                      <View key={test.id || index} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: moderateScale(150) }]} numberOfLines={2}>{String(test.name || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(120) }]}>{String(test.labTestID || '')}</Text>
                        <Text style={[styles.tableCell, { width: moderateScale(90) }]}>{String(test.status || '')}</Text>
                      </View>
                    ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.noDataMessage}>No tests prescribed for this patient.</Text>
                )}
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
    height: moderateScale(44),
  },
  countContainer: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  countCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    ...LAYOUT.shadow.sm,
  },
  countNumber: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxxl : FONT_SIZE.xxl),
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: SPACING.xs,
  },
  countLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center', // Changed from flex-start to center for better alignment
    position: 'relative',
    ...LAYOUT.shadow.sm,
  },
  placeholderCircle: {
    width: moderateScale(isTablet ? 60 : 50), 
    height: moderateScale(isTablet ? 60 : 50), 
    borderRadius: moderateScale(25), 
    backgroundColor: '#1e3a5f',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: SPACING.md,
  },
  placeholderText: { 
    fontSize: moderateScale(isTablet ? 28 : 22), 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  name: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#1E293B',
  },
  id: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginTop: SPACING.xxs,
  },
  details: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#334155',
    marginTop: SPACING.xxs,
  },
  phone: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#059669',
    fontWeight: '500',
    marginTop: SPACING.xxs,
  },
  lastVisit: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#64748B',
    marginTop: SPACING.xxs,
  },
  statusTag: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(45), // Adjusted to prevent overlap with eye icon
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.pill,
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  newTag: {
    backgroundColor: '#DCFCE7',
  },
  followUpTag: {
    backgroundColor: '#FEF3C7',
  },
  defaultTag: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    textAlign: 'center',
  },
  newText: {
    color: '#15803D',
  },
  followUpText: {
    color: '#B45309',
  },
  defaultText: {
    color: '#374151',
  },
  actionButton: {
    position: 'absolute',
    top: moderateScale(12),
    right: moderateScale(12),
    padding: SPACING.xs,
    zIndex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: moderateScale(70),
    right: SPACING.md,
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.md,
    elevation: 5,
    zIndex: 999,
    width: moderateScale(200),
    paddingVertical: SPACING.sm,
    ...LAYOUT.shadow.md,
  },
  dropdownOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  dropdownOptionSelected: {
    backgroundColor: '#007bff',
  },
  dropdownText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
  },
  dropdownTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  paginationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.xs,
    backgroundColor: '#3b82f6',
    borderRadius: LAYOUT.borderRadius.md,
  },
  disabledButton: {
    backgroundColor: '#e5e7eb',
  },
  paginationText: {
    color: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  disabledText: {
    color: '#9ca3af',
  },
  paginationInfo: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
    textAlign: 'center',
  },
  paginationCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  paginationSubInfo: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginTop: SPACING.xxs,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: responsiveHeight(10),
    paddingTop: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: responsiveHeight(15),
  },
  emptyText: {
    fontSize: responsiveText(FONT_SIZE.md),
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: SPACING.md,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingTop: SAFE_AREA.safeTop + SPACING.sm,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  modalTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: '600',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    marginTop: SPACING.xxs,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  prescriptionSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: SPACING.md,
  },
  subSection: {
    marginBottom: SPACING.md,
  },
  subSectionTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
    color: '#334155',
    marginBottom: SPACING.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  infoItemContainer: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  infoLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  infoValue: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
    flexWrap: 'wrap',
  },
  multilineText: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    minHeight: moderateScale(40),
  },
  tableHeader: {
    backgroundColor: '#F1F5F9',
    borderTopLeftRadius: LAYOUT.borderRadius.sm,
    borderTopRightRadius: LAYOUT.borderRadius.sm,
    paddingVertical: SPACING.md,
  },
  tableCell: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#1E293B',
    paddingHorizontal: SPACING.xs,
    textAlign: 'center',
  },
  tableCellHeader: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#1E293B',
    paddingHorizontal: SPACING.xs,
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
});

export default MyPatients;