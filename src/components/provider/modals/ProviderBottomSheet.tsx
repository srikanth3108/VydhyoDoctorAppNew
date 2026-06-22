import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {X} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {PROVIDER_THEME} from '../../../theme/providerTheme';
import {moderateScale} from '../../../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
};

export default function ProviderBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  tall,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.sheet,
              tall && styles.sheetTall,
              {paddingBottom: Math.max(insets.bottom, moderateScale(16))},
            ]}
            onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <X color={PROVIDER_THEME.textMuted} size={moderateScale(22)} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 32, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PROVIDER_THEME.pearl,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    maxHeight: '78%',
    paddingTop: moderateScale(8),
    paddingHorizontal: moderateScale(20),
  },
  sheetTall: {maxHeight: '88%'},
  handle: {
    alignSelf: 'center',
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: 2,
    backgroundColor: PROVIDER_THEME.sandDeep,
    marginBottom: moderateScale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
    gap: moderateScale(12),
  },
  headerText: {flex: 1},
  title: {
    fontSize: moderateScale(20),
    fontWeight: '800',
    color: PROVIDER_THEME.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: PROVIDER_THEME.textMuted,
    marginTop: moderateScale(6),
    lineHeight: moderateScale(19),
  },
  closeBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(12),
    backgroundColor: PROVIDER_THEME.pearlMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {flexGrow: 0},
  footer: {
    paddingTop: moderateScale(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PROVIDER_THEME.border,
    marginTop: moderateScale(8),
  },
});
