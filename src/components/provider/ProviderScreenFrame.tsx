import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ViewStyle,
  RefreshControl,
} from 'react-native';
import {PROVIDER_THEME} from '../../theme/providerTheme';
import {moderateScale} from '../../utils/responsive';

type Props = {
  children: React.ReactNode;
  /** Slim ink strip (brand bar) */
  hero?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  sheetStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  sheetTopInset?: number;
  bottomInset?: number;
};

/**
 * Compact ink top bar + pearl content sheet (header content stays visible)
 */
export default function ProviderScreenFrame({
  children,
  hero,
  scroll = true,
  contentStyle,
  sheetStyle,
  refreshing,
  onRefresh,
  sheetTopInset = moderateScale(12),
  bottomInset = moderateScale(100),
}: Props) {
  const sheet = (
    <View style={[styles.sheet, sheetStyle, contentStyle]}>
      <View style={styles.sheetHandle} />
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PROVIDER_THEME.bg} />
      {hero ? (
        <View style={styles.hero}>
          <SafeAreaView style={styles.heroSafe}>{hero}</SafeAreaView>
        </View>
      ) : null}
      <View style={[styles.sheetWrap, !hero && styles.sheetWrapFull]}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing ?? false}
                  onRefresh={onRefresh}
                  tintColor={PROVIDER_THEME.jade}
                />
              ) : undefined
            }>
            {sheet}
          </ScrollView>
        ) : (
          sheet
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: PROVIDER_THEME.bg},
  hero: {
    backgroundColor: PROVIDER_THEME.bg,
    zIndex: 1,
  },
  heroSafe: {zIndex: 2},
  sheetWrap: {
    flex: 1,
    zIndex: 2,
    marginTop: moderateScale(-12),
  },
  sheetWrapFull: {marginTop: 0},
  sheet: {
    backgroundColor: PROVIDER_THEME.surface,
    borderTopLeftRadius: moderateScale(PROVIDER_THEME.sheetRadius),
    borderTopRightRadius: moderateScale(PROVIDER_THEME.sheetRadius),
    paddingTop: moderateScale(6),
    paddingHorizontal: moderateScale(20),
    minHeight: moderateScale(500),
    ...PROVIDER_THEME.shadowStyles.header,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: moderateScale(40),
    height: moderateScale(4),
    borderRadius: 2,
    backgroundColor: PROVIDER_THEME.sandDeep,
    marginBottom: moderateScale(14),
    marginTop: moderateScale(6),
  },
  scrollContent: {
    paddingBottom: moderateScale(PROVIDER_THEME.tabBarClearance),
    flexGrow: 1,
  },
});
