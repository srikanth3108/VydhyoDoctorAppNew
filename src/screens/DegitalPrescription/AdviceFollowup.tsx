import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

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
} from '../../utility/responsive';
import IOSCalendarPicker from '../../utility/iosCalendarPicker';

const AdviceScreen = () => {
  const navigation = useNavigation<any>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const route = useRoute<any>();
  const { patientDetails, formData: initialFormData } = route.params;
  const [formData, setFormData] = useState(initialFormData || { advice: {} });
  const [showDateCalendar, setShowDateCalendar] = useState(false); // Changed from showDateModal
  const [calendarDate, setCalendarDate] = useState<Date>(new Date()); // Changed from tempDate

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      advice: {
        ...prev.advice,
        [name]: value,
      },
    }));
  };

  const onChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Store in YYYY-MM-DD format for consistency
      const formatted = moment(selectedDate).format('YYYY-MM-DD');
      handleChange('followUpDate', formatted);
    }
  };

  // Adjust offset if you have a custom header; bump for larger headers
const openDatePicker = () => {
  if (Platform.OS === 'android') {
    setShowDatePicker(true);
  } else {
    // Always use today's date when opening calendar
    const currentDate = new Date(); // Today's date
    setCalendarDate(currentDate);
    setShowDateCalendar(true);
  }
};

// Update confirmDateSelection function
const confirmDateSelection = (date: Date) => {
  const formatted = moment(date).format('YYYY-MM-DD');
  handleChange('followUpDate', formatted);
  setShowDateCalendar(false);
};

// Update cancelDateSelection function
const cancelDateSelection = () => {
  setShowDateCalendar(false);
};

  const keyboardVerticalOffset = Platform.select({ ios: SAFE_AREA.safeTop + (isTablet ? 100 : 80), android: 80 }) as number;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View>
              

              <View style={styles.card}>
                <Text style={styles.cardTitle}>ℹ️ General Notes</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter general notes..."
                  placeholderTextColor={'#9CA3AF'}
                  multiline
                  value={formData.advice?.medicationNotes || ''}
                  onChangeText={text => handleChange('medicationNotes', text)}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Advice</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Enter findings from clinical examination..."
                  multiline
                  value={formData.advice?.advice || ''}
                  onChangeText={text => handleChange('advice', text)}
                  placeholderTextColor={'#9CA3AF'}
                />
              </View>

              <Text style={styles.cardTitle}>Follow-Ups</Text>

              <TouchableOpacity onPress={openDatePicker}>
                <TextInput
                  style={styles.input}
                  placeholder="dd-mmm-yyyy"
                  value={
                    formData.advice?.followUpDate
                      ? moment(formData.advice.followUpDate).format('DD-MMM-YYYY')
                      : ''
                  }
                  editable={false}
                  pointerEvents="none"
                  placeholderTextColor={'#9CA3AF'}
                />
              </TouchableOpacity>

              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={formData.advice?.followUpDate 
                    ? moment(formData.advice.followUpDate, 'YYYY-MM-DD').toDate() 
                    : new Date()
                  }
                  mode="date"
                  display="spinner"
                  minimumDate={new Date()}
                  onChange={onChange}
                />
              )}
            </View>

            <View style={styles.spacer} />
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Keyboard.dismiss();
                navigation.goBack();
              }}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={() =>
                navigation.navigate('PrescriptionPreview', {
                  patientDetails,
                  formData,
                })
              }
            >
              <Text style={[styles.buttonText, styles.nextButtonText]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
{Platform.OS === 'ios' && (
  <IOSCalendarPicker
    visible={showDateCalendar}
    currentDate={calendarDate}
    onConfirm={confirmDateSelection}
    onCancel={cancelDateSelection}
    title="Select Follow-up Date"
    mode="date"
    minDate={new Date()} // Only allow future dates
  />
)}

    </KeyboardAvoidingView>
  );
};

export default AdviceScreen;

const styles = StyleSheet.create({
  flex: { 
    flex: 1 
  },
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: responsiveHeight(20),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerText: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: 'bold',
    color: '#007bff',
  },
  stepText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#007bff',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...LAYOUT.shadow.sm,
  },
  cardTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: '#0A2342',
  },
  textArea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    minHeight: moderateScale(100),
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    borderRadius: LAYOUT.borderRadius.md,
    padding: SPACING.md,
    backgroundColor: '#fff',
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: SPACING.xs,
  },
  spacer: {
    height: responsiveHeight(15),
  },
  buttonRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F0FDF4',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.md,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#007bff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    minHeight: moderateScale(48),
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#1f2937',
  },
  nextButtonText: {
    color: '#fff',
  },
  // iOS Date Picker Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  dateModalContent: {
    backgroundColor: '#fff',
    paddingBottom: SAFE_AREA.safeBottom + SPACING.base,
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancel: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  modalDone: {
    color: '#007aff',
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
  },
  datePickerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});