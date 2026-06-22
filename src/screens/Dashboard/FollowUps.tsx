import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import { AuthFetch } from '../../auth/auth';

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
  isSmallDevice,
} from '../../utility/responsive';

// Import iOS Calendar Picker
import IOSCalendarPicker from '../../utility/iosCalendarPicker';
import CommonHeader from '../../utility/CommonHeader';

interface FollowUp {
  _id: string;
  prescriptionId: string;
  appointmentId: string;
  userId: string;
  doctorId: string;
  patientInfo: {
    patientName: string;
    age: string;
    gender: string;
    mobileNumber: string;
    chiefComplaint: string;
    pastMedicalHistory: string | null;
    familyMedicalHistory: string | null;
    physicalExamination: string | null;
  };
  advice: {
    followUpDate: string;
  };
}

const FollowUpsScreen = () => {
  const navigation = useNavigation<any>();
  const currentuserDetails = useSelector((state: any) => state.currentUser);
  const doctorId =
    currentuserDetails?.role === 'doctor'
      ? currentuserDetails?.userId
      : currentuserDetails?.createdBy;

  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>('all');
  // default filter date = today
  const [filterDate, setFilterDate] = useState<string | undefined>(moment().format('YYYY-MM-DD'));
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [loader, setLoader] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // iOS Calendar State
  const [showFilterCalendar, setShowFilterCalendar] = useState(false);
  const [filterCalendarDate, setFilterCalendarDate] = useState<Date>(new Date());

  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchFollowUps = async (page = 1, limit = 10) => {
    try {
      setLoader(true);

      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };

      if (filterDate) {
        params.date = filterDate;
      } else {
        params.date = moment().format('YYYY-MM-DD');
      }

      if (selectedStatus && selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      if (search) {
        params.searchText = search;
      }

      const queryString = new URLSearchParams(params).toString();

      const token = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(
        `pharmacy/followup/${doctorId}?${queryString}`,
        token
      );

      let items: any[] = [];
      let serverPg: any = {};

      if (response?.data?.status === 'success' && Array.isArray(response.data.data)) {
        items = response?.data?.data;
        serverPg = response?.data.data?.pagination || {};
      } else {
        items = [];
      }

      setFollowUps(items || []);

      setPagination((prev) => ({
        current: serverPg.currentPage || serverPg.current || page,
        pageSize: serverPg.pageSize || serverPg.limit || limit,
        total: serverPg.totalItems || serverPg.total || items.length || prev.total,
      }));
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.response?.data?.message || 'Error fetching follow-ups',
      });
      setFollowUps([]);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    if (currentuserDetails && doctorId) {
      setPagination((p) => ({ ...p, current: 1 }));
      fetchFollowUps(1, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, doctorId, search, selectedStatus]);

  useEffect(() => {
    if (currentuserDetails && doctorId) {
      fetchFollowUps(pagination.current, pagination.pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageSize]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      setFilterDate(moment(selectedDate).format('YYYY-MM-DD'));
    }
  };

  // Calendar Handlers
  const openFilterCalendar = () => {
    if (Platform.OS === 'android') {
      setShowFilterDatePicker(true);
    } else {
      // Always use today's date when opening calendar
      setFilterCalendarDate(new Date());
      setShowFilterCalendar(true);
    }
  };

  const handleFilterDateChangeIOS = (date: Date) => {
    setFilterDate(moment(date).format('YYYY-MM-DD'));
    setShowFilterCalendar(false);
  };

  const cancelFilterCalendarIOS = () => {
    setShowFilterCalendar(false);
  };

  const handleFollowUpPress = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    // small delay to avoid press propagation closing modal overlay
    setTimeout(() => setModalVisible(true), 100);
  };

  const filteredFollowUps = useMemo(() => {
    let filtered = followUps;

    if (search) {
      filtered = filtered.filter((followUp) =>
        (followUp.patientInfo?.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (followUp.prescriptionId || '').toLowerCase().includes(search.toLowerCase()) ||
        (followUp.appointmentId || '').toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [followUps, search]);

  const renderFollowUpCard = ({ item }: { item: FollowUp }) => (
    <TouchableOpacity style={styles.apptCard} onPress={() => handleFollowUpPress(item)}>
      <View style={styles.cardRow}>
        <View style={styles.placeholderCircle}>
          <Text style={styles.placeholderText}>{item.patientInfo.patientName?.[0]?.toUpperCase() || ''}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{item.patientInfo.patientName}</Text>
          <Text style={styles.id}>Age: {item.patientInfo.age} • {item.patientInfo.gender}</Text>
          <Text style={styles.id}>ID: {item.appointmentId}</Text>
        </View>
      </View>

      <View style={[styles.cardRow, styles.bottomRow]}>
        <View style={[styles.tag, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.tagText, { color: '#3B82F6' }]}>Follow-up</Text>
        </View>

        <Text style={styles.date}>{moment(item.advice.followUpDate).format('DD-MMM-YYYY')}</Text>

        <View style={[styles.status, { backgroundColor: '#e8f5e8' }]}>
          <Text style={styles.statusText}>Scheduled</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => (
    <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
      <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Follow-up Details</Text>
            {selectedFollowUp && (
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {selectedFollowUp.patientInfo.patientName}
              </Text>
            )}
          </View>

          {selectedFollowUp && (
            <ScrollView style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Patient Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.patientInfo.patientName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Age:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.patientInfo.age}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Gender:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.patientInfo.gender}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Mobile:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.patientInfo.mobileNumber}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Medical Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.fullWidthItem}>
                  <Text style={styles.detailLabel}>Chief Complaint:</Text>
                  <Text style={[styles.detailValue, styles.multilineText]}>{selectedFollowUp.patientInfo.chiefComplaint}</Text>
                </View>
                {selectedFollowUp.patientInfo.pastMedicalHistory && (
                  <View style={styles.fullWidthItem}>
                    <Text style={styles.detailLabel}>Past Medical History:</Text>
                    <Text style={[styles.detailValue, styles.multilineText]}>{selectedFollowUp.patientInfo.pastMedicalHistory}</Text>
                  </View>
                )}
                {selectedFollowUp.patientInfo.familyMedicalHistory && (
                  <View style={styles.fullWidthItem}>
                    <Text style={styles.detailLabel}>Family History:</Text>
                    <Text style={[styles.detailValue, styles.multilineText]}>{selectedFollowUp.patientInfo.familyMedicalHistory}</Text>
                  </View>
                )}
                {selectedFollowUp.patientInfo.physicalExamination && (
                  <View style={styles.fullWidthItem}>
                    <Text style={styles.detailLabel}>Physical Exam:</Text>
                    <Text style={[styles.detailValue, styles.multilineText]}>{selectedFollowUp.patientInfo.physicalExamination}</Text>
                  </View>
                )}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Follow-up Information</Text>
                <View style={styles.detailGrid}>
                  <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Follow-up Date:</Text>
                  <Text style={styles.detailValue}>{moment(selectedFollowUp.advice.followUpDate).format('DD MMM YYYY')}</Text>
                </View>
                <View style={styles.fullWidthItem}>
                  <Text style={styles.detailLabel}>Prescription ID:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.prescriptionId}</Text>
                </View>
                <View style={styles.fullWidthItem}>
                  <Text style={styles.detailLabel}>Appointment ID:</Text>
                  <Text style={styles.detailValue}>{selectedFollowUp.appointmentId}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          <View style={styles.modalButtons}>
            <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );

  const handlePageChange = (newPage: number) => {
    const totalPages = Math.max(1, Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)));
    const next = Math.min(Math.max(1, newPage), totalPages);
    setPagination((prev) => ({ ...prev, current: next }));
    fetchFollowUps(next, pagination.pageSize);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <CommonHeader title="Follow-Ups" />
      <View style={styles.container}>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by Patient Name or ID"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.inlineFiltersRow}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Date</Text>
            <View style={styles.dateFilterRow}>
              <TouchableOpacity style={styles.dateBtn} onPress={openFilterCalendar}>
                <Text style={styles.dateBtnText}>
                  {filterDate ? moment(filterDate, 'YYYY-MM-DD').format('DD-MMM-YYYY') : 'DD-MMM-YYYY'}
                </Text>
              </TouchableOpacity>
              {!!filterDate && (
                <TouchableOpacity style={styles.clearDateBtn} onPress={() => setFilterDate(undefined)}>
                  <Text style={styles.clearDateText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {showFilterDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={new Date()} // Always show today's date by default
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        </View>

        {Platform.OS === 'ios' && (
          <IOSCalendarPicker
            visible={showFilterCalendar}
            currentDate={filterCalendarDate}
            onConfirm={handleFilterDateChangeIOS}
            onCancel={cancelFilterCalendarIOS}
            title="Select Follow-up Date"
            mode="date"
          />
        )}

        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdown}>
              {['all', 'scheduled', 'completed'].map((status) => (
                <Pressable
                  key={status}
                  style={styles.option}
                  onPress={() => {
                    setSelectedStatus(status);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {loader ? (
          <View style={styles.spinningContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Loading Follow-ups...</Text>
          </View>
        ) : filteredFollowUps?.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No Follow-ups Found</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredFollowUps}
              keyExtractor={(item) => item._id}
              renderItem={renderFollowUpCard}
              contentContainerStyle={styles.listContent}
            />

            <View style={styles.paginationContainer}>
              <TouchableOpacity
                onPress={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                style={[styles.paginationButton, pagination.current === 1 && styles.disabledButton,]}
              >
                <Text style={[ styles.paginationText, pagination.current === 1 && styles.disabledText,]}>Previous</Text>
              </TouchableOpacity>

              <Text style={styles.paginationInfo}>
                Page {pagination.current} of{' '} {Math.max( 1, Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)))}
              </Text>

              <TouchableOpacity
                onPress={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >=Math.ceil((pagination.total || 1) / (pagination.pageSize || 1))}
                style={[ styles.paginationButton, pagination.current >= Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)) && styles.disabledButton,]}
              >
                <Text style={[styles.paginationText, pagination.current >= Math.ceil((pagination.total || 1) / (pagination.pageSize || 1)) && styles.disabledText, ]}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {renderDetailModal()}
      </View>
    </KeyboardAvoidingView>
  );
};

export default FollowUpsScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    height: moderateScale(45),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingHorizontal: SPACING.md,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: 'black',
    ...LAYOUT.shadow.sm,
  },
  inlineFiltersRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  filterContainer: {
    flex: 1,
  },
  filterLabel: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#111827',
    marginBottom: SPACING.xs,
    fontWeight: '500',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#fff',
    ...LAYOUT.shadow.xs,
  },
  dateBtnText: {
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  clearDateBtn: {
    marginLeft: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: LAYOUT.borderRadius.md,
    backgroundColor: '#EEF2FF',
    minWidth: moderateScale(44),
    alignItems: 'center',
  },
  clearDateText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  apptCard: {
    backgroundColor: '#fff',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: LAYOUT.borderRadius.lg,
    ...LAYOUT.shadow.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  bottomRow: {
    marginTop: SPACING.sm,
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
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#111827',
    marginBottom: SPACING.xxs,
  },
  id: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6B7280',
    marginBottom: SPACING.xxs,
  },
  tag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.md,
  },
  tagText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#3B82F6',
    fontWeight: '500',
  },
  date: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#4B5563',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: SPACING.sm,
  },
  status: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: LAYOUT.borderRadius.pill,
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  statusText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#16A34A',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: responsiveHeight(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: moderateScale(500),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    maxHeight: '85%',          // let modal take up to 85% of screen height
    overflow: 'hidden',
    ...LAYOUT.shadow.lg,
  },
  modalHeader: {
    padding: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalSubtitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
    textAlign: 'center',
  },
  modalBody: {
    // key change: give ScrollView a maxHeight instead of flex: 1
    maxHeight: responsiveHeight(isTablet ? 65 : 60),
  },
  modalBodyContent: {
    padding: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  detailSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 2,
    borderBottomColor: '#dfd4d4ff',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  fullWidthItem: {
    width: '100%',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: responsiveText(FONT_SIZE.xs),
    fontWeight: '600',
    color: '#374151',
    marginBottom: SPACING.xxs,
  },
  detailValue: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6B7280',
  },
  multilineText: {
    flexWrap: 'wrap',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: LAYOUT.borderRadius.md,
    minWidth: moderateScale(120),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  dropdown: {
    width: responsiveWidth(80),
    maxWidth: moderateScale(300),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    ...LAYOUT.shadow.md,
  },
  option: {
    paddingVertical: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  optionText: {
    color: '#000',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  spinningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.md),
    marginTop: SPACING.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(10),
  },
  emptyText: {
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  paginationContainer: {
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
    minWidth: moderateScale(80),
    alignItems: 'center',
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
    marginHorizontal: SPACING.md,
    textAlign: 'center',
  },
});
