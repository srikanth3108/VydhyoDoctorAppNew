import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import { useSelector } from "react-redux";
import Toast from "react-native-toast-message";
import { AuthFetch } from "../../auth/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import LabPatientManagement from "./LabPatientManagement";
import TestManagement from "./TestManagement";

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
import CommonHeader from "../../utility/CommonHeader";

type RootState = any;

type RevenueCards = {
  today?: { revenue?: number; patients?: number };
  month?: { revenue?: number; patients?: number };
};

const Tabs = ["Patients", "Completed", "Tests"] as const;
type TabKey = typeof Tabs[number];

export default function LabsScreen() {
      const user = useSelector((state: any) => state.currentUser);
    
//   const user = useSelector((state: RootState) => state.currentUserData);
  const doctorId = user?.role === "doctor" ? user?.userId : user?.createdBy;

  const [active, setActive] = useState<TabKey>("Patients");
  const [cardsData, setCardsData] = useState<RevenueCards>({});
  const [searchValue, setSearchValue] = useState("");
  const hasFetched = useRef(false);

  const fetchRevenueCount= async() =>{
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await AuthFetch(
        `finance/getDoctorTodayAndThisMonthRevenue/lab?doctorId=${doctorId}`, token
      );
      if (res?.data?.status === "success" && res?.data?.data) {
        setCardsData(res?.data?.data);
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Failed to load revenue" });
    }
  }

  useEffect(() => {
    if (user && doctorId && !hasFetched.current) {
      hasFetched.current = true;
      fetchRevenueCount();
    }
  }, [user, doctorId]);

  const updateCount = () => fetchRevenueCount();

  return (
     <KeyboardAvoidingView 
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
  >
    <CommonHeader title="Labs" />

    <View style={styles.container}>

      <View style={styles.headerRow}>
        
        <TextInput
          placeholder="Search by Patient Id"
          value={searchValue}
          onChangeText={(t) => setSearchValue(t.trim())}
          style={styles.search}
          placeholderTextColor="#9aa0a6"
        />
      </View>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: "#DBEAFE" }]}>
          <Text style={[styles.cardLabel, { color: "#2563EB" }]}>Today Revenue</Text>
          <Text style={[styles.cardValue, { color: "#2563EB" }]}>
            ₹ {cardsData?.today?.revenue || 0}
          </Text>
          <Text style={[styles.cardPatients, { color: "#2563EB" }]}>
            Patients: {cardsData?.today?.patients || 0}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: "#DCFCE7" }]}>
          <Text style={[styles.cardLabel, { color: "#16A34A" }]}>This Month Revenue</Text>
          <Text style={[styles.cardValue, { color: "#16A34A" }]}>
            ₹ {cardsData?.month?.revenue || 0}
          </Text>
          <Text style={[styles.cardPatients, { color: "#16A34A" }]}>
            Patients: {cardsData?.month?.patients || 0}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {Tabs.map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActive(t)}
            style={[styles.tab, active === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, active === t && styles.tabTextActive]}>
              {t === "Patients" ? "Pending" : t === "Completed" ? "Completed" : "Tests"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bodyContainer}>
        {active === "Patients" && (
          <LabPatientManagement
            status="pending"
            searchValue={searchValue}
            updateCount={updateCount}
          />
        )}
        {active === "Completed" && (
          <LabPatientManagement
            status="completed"
            searchValue={searchValue}
            updateCount={updateCount}
          />
        )}
        {active === "Tests" && 
        <TestManagement />
        }
      </View>
       <Toast />
    </View>
     </KeyboardAvoidingView>
 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: isTablet ? SPACING.lg : SPACING.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconBox: {
    width: moderateScale(isTablet ? 40 : 32),
    height: moderateScale(isTablet ? 40 : 32),
    backgroundColor: "#1890ff",
    borderRadius: LAYOUT.borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: moderateScale(isTablet ? 20 : 16),
  },
  title: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: "700",
    color: "#262626"
  },
  search: {
    width: '100%',
    backgroundColor: "#fff",
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: moderateScale(8),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  cardsRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  card: {
    flex: 1,
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.md,
    ...LAYOUT.shadow.sm,
  },
  cardLabel: {
    fontWeight: "600",
    marginBottom: SPACING.xs,
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  cardValue: {
    fontWeight: "800",
    fontSize: responsiveText(isTablet ? FONT_SIZE.xxl : FONT_SIZE.xl),
    marginBottom: SPACING.xs,
  },
  cardPatients: {
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    padding: moderateScale(4),
    borderRadius: LAYOUT.borderRadius.lg,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: moderateScale(8),
    borderRadius: LAYOUT.borderRadius.md,
  },
  tabActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  tabTextActive: {
    color: "#111827",
  },
  bodyContainer: {
    flex: 1,
  },
});