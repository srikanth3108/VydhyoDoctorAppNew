// IOSCalendarPicker.tsx
import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useColorScheme,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  SAFE_AREA,
  SPACING,
  FONT_SIZE,
  LAYOUT,
  responsiveWidth,
  responsiveHeight,
  moderateScale,
  isTablet,
} from '../utility/responsive';

export interface IOSCalendarPickerProps {
  visible: boolean;
  currentDate: Date;
  minDate?: Date;
  maxDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
  mode?: 'date' | 'time' | 'datetime';
}

// Add getMaxFutureDate function here
const getMaxFutureDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d;
};

const getSafeDate = (date?: Date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const IOSCalendarPicker: React.FC<IOSCalendarPickerProps> = ({
  visible,
  currentDate,
  minDate,
  maxDate,
  onConfirm,
  onCancel,
  title,
  mode = 'date',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tempDate, setTempDate] = useState<Date>(getSafeDate(currentDate));

  useEffect(() => {
    if (visible) {
      setTempDate(getSafeDate(currentDate));
    }
  }, [visible, currentDate]);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'dismissed') return;
    if (date) {
      setTempDate(getSafeDate(date));
    }
  };

  const handleConfirmPress = () => {
    onConfirm(tempDate);
  };

  const handleCancelPress = () => {
    onCancel();
  };

  const pickerMode: 'date' | 'time' =
    mode === 'time' ? 'time' : 'date';

  const displayTitle =
    title ||
    (mode === 'date'
      ? 'Select Date'
      : mode === 'time'
      ? 'Select Time'
      : 'Select Date & Time');

  const today = getToday();
  const effectiveMinDate = minDate ? getSafeDate(minDate) : new Date(1900, 0, 1);
  const effectiveMaxDate = maxDate ? getSafeDate(maxDate) : getMaxFutureDate(); // Use getMaxFutureDate here

  // Always use white background regardless of dark mode
  const backgroundColor = '#ffffff';
  const textColor = '#000000'; // Always black text for better contrast on white
  const modalBackground = 'rgba(0,0,0,0.5)'; // Semi-transparent backdrop

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancelPress}
    >
      <View style={[styles.backdrop, { backgroundColor: modalBackground }]}>
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>
              {displayTitle}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode={pickerMode}
              display="spinner"
              minimumDate={effectiveMinDate}
              maximumDate={effectiveMaxDate}
              onChange={handleChange}
              // Use light theme for both modes since background is white
              themeVariant="light"
              textColor="#000000" // Force black text
              style={styles.picker}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancelPress}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirmPress}
            >
              <Text style={[styles.buttonText, styles.confirmText]}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    width: responsiveWidth(90),
    maxWidth: moderateScale(400),
    borderRadius: LAYOUT.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    elevation: 5,
  },
  header: {
    paddingVertical: isTablet ? SPACING.xl : SPACING.lg,
    paddingHorizontal: isTablet ? SPACING.xxl : SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light gray border
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: isTablet ? FONT_SIZE.xl : FONT_SIZE.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    alignItems: 'center', // Center the spinner horizontally
    justifyContent: 'center', // Center the spinner vertically
    minHeight: moderateScale(200),
    paddingVertical: SPACING.lg,
  },
  picker: {
    width: '100%',
    backgroundColor: '#ffffff',
    alignSelf: 'center', // Ensure the picker itself is centered
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0', // Light gray border
    backgroundColor: '#ffffff',
  },
  button: {
    flex: 1,
    paddingVertical: isTablet ? SPACING.xl : SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cancelButton: {
    borderRightWidth: 0.5,
    borderRightColor: '#e0e0e0', // Light gray border
  },
  confirmButton: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#e0e0e0', // Light gray border
  },
  buttonText: {
    fontSize: isTablet ? FONT_SIZE.lg : FONT_SIZE.md,
    fontWeight: '600',
  },
  cancelText: {
    color: '#007aff', // iOS blue
  },
  confirmText: {
    color: '#007aff', // iOS blue
  },
});

export default IOSCalendarPicker;