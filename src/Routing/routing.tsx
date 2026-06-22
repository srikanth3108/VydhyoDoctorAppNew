import React from "react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from "../screens/splashScreen";
import { RootStackParamList } from "./navigationTypes";
import DoctorLoginScreen from "../screens/login";
import PersonalInfoScreen from "../screens/PersonalInfo/personalInfo";
import SpecializationDetails from "../screens/PersonalInfo/specialization";
import PracticeScreen from "../screens/PersonalInfo/practice";
import ConsultationPreferences from "../screens/PersonalInfo/consultationPreferences";
import FinancialSetupScreen from "../screens/PersonalInfo/financialSetup";
import KYCDetailsScreen from "../screens/PersonalInfo/KYCDetails";
import ConfirmationScreen from "../screens/PersonalInfo/confirmationScreen";
import ProfileReview from "../screens/PersonalInfo/profileReview";
import AccountVerified from "../screens/PersonalInfo/accountVerified";
import DoctorDashboard from "../screens/Dashboard/dashboard";
import Sidebar from "../screens/Dashboard/sidebar";
import AddAppointment from "../screens/appointments/AddAppointment";
import Availability from "../screens/Dashboard/Availability";
import StaffManagement from "../screens/Dashboard/StaffManagement";
import AddStaffScreen from "../screens/Dashboard/AddStaff";
import MyPatient from "../screens/Dashboard/MyPatient";
import Appointments from "../screens/Dashboard/Appointments";
// import dashboard from "../components/Dashboard/dashboard";
import Accounts from "../screens/Revenue/Accounts";
import expenditure from "../screens/Revenue/expenditure";
// import Labs from "../components/Dashboard/Labs";
import Pharmacy from "../screens/Dashboard/Pharmacy";
import PharmacyPatientsTab from "../screens/Dashboard/PharmacyMedicinesTab";
import PharmacyMedicinesTab from "../screens/Dashboard/PharmacyMedicinesTab"
import Clinic from "../screens/Dashboard/Clinic";
import AddClinic from "../screens/Dashboard/AddClinic";
import Reviews from "../screens/Dashboard/Reviews";
import DoctorDetails from "../screens/DegitalPrescription/DoctorDetails";
import PatientDetails from "../screens/DegitalPrescription/PatientDetails";
import Vitals from "../screens/DegitalPrescription/Vitals";
import DiagnosisMedication from "../screens/DegitalPrescription/DiagnosisMedication";
import AdviceFollowup from "../screens/DegitalPrescription/AdviceFollowup";
import Profile from "../screens/PersonalInfo/Profile";
import PrescriptionPreview from "../screens/DegitalPrescription/PrescriptionPreview";
import Authloader from "../screens/Authloader";
import EPrescriptionList from "../screens/DegitalPrescription/EPrescriptionList";
import PreviousPrescription from "../screens/DegitalPrescription/PreviousPrescription";
import labs from "../screens/Dashboard/labs";
import LabPatientManagement from "../screens/Dashboard/LabPatientManagement";
import Billing from "../screens/Dashboard/Billing";
import Templates from "../screens/Dashboard/Templates";
import FollowUpsScreen from "../screens/Dashboard/FollowUps";
import PinManagement from "../screens/PinManagement";
import PatientReports from "../screens/DegitalPrescription/PatientReports";
import ProviderTabDashboard from "../screens/homeCare/ProviderTabDashboard";
import ProviderNavigator from "./ProviderNavigator";
// import Appointments from "../components/appointments/appointments";
// import MyPatient from "../components/Dashboard/MyPatient";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routing = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator >
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Authloader" component={Authloader} options={{ headerShown: false }} />

        <Stack.Screen name="Login" component={DoctorLoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Specialization" component={SpecializationDetails} options={{ headerShown: false }} />
        <Stack.Screen name="Practice" component={PracticeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConsultationPreferences" component={ConsultationPreferences} options={{ headerShown: false }} />
        <Stack.Screen name="FinancialSetupScreen" component={FinancialSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="KYCDetailsScreen" component={KYCDetailsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConfirmationScreen" component={ConfirmationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileReview" component={ProfileReview} options={{ headerShown: false }} />
        <Stack.Screen name="AccountVerified" component={AccountVerified} options={{ headerShown: false }} />
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="Sidebar" component={Sidebar} options={{ headerShown: false }} />
        <Stack.Screen name="AddAppointment" component={AddAppointment} options={{ title: "Walk-in Consultation", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="Availability" component={Availability} options={{ headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="StaffManagement" component={StaffManagement} options={{ title: "Staff Management", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="AddStaff" component={AddStaffScreen} options={{ title: "Add Staff", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="MyPatient" component={MyPatient} options={{ title: "My Patients", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="Appointments" component={Appointments} options={{ headerTitleAlign: "center", headerShown: false }} />

        <Stack.Screen name="Accounts" component={Accounts} options={{ headerShown: false }} />
        <Stack.Screen name="expenditure" component={expenditure} options={{ title: "Expenditure", headerTitleAlign: "center", headerShown: false }} />

        <Stack.Screen name="Clinic" component={Clinic} options={{ title: "Clinic Management", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="labs" component={labs} options={{ title: "Lab", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="LabPatientManagement" component={LabPatientManagement} />

        <Stack.Screen name="Billing" component={Billing} options={{ headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="Pharmacy" component={Pharmacy} options={{ headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="PharmacyPatientsTab" component={PharmacyPatientsTab} />
        <Stack.Screen name="PharmacyMedicinesTab" component={PharmacyMedicinesTab} />

        <Stack.Screen name="AddClinic" component={AddClinic} options={{ title: "Clinic Management", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="Reviews" component={Reviews} options={{ title: "Reviews", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="DoctorDetails" component={DoctorDetails} options={{ title: "Consulting Physician", headerTitleAlign: "center", }} />
        <Stack.Screen name="PatientDetails" component={PatientDetails} options={{ title: "Patient Details", headerTitleAlign: "center", }} />
        <Stack.Screen name="Vitals" component={Vitals} options={{ title: "Vitals", headerTitleAlign: "center", }} />
        <Stack.Screen name="DiagnosisMedication" component={DiagnosisMedication} options={{ title: "Diagnosis & Medication", headerTitleAlign: "center", }} />
        <Stack.Screen name="AdviceFollowup" component={AdviceFollowup} options={{ title: "Advice & Followup", headerTitleAlign: "center", }} />
        <Stack.Screen name="PatientReports" component={PatientReports} options={{ title: "Patient Reports", headerTitleAlign: "center", }} />
        <Stack.Screen name="PrescriptionPreview" component={PrescriptionPreview} options={{ title: "Prescription Preview", headerTitleAlign: "center", }} />
        <Stack.Screen name="Profile" component={Profile} options={{ title: "Profile", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="PreviousPrescription" component={PreviousPrescription} options={{ title: "Previous Prescription", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen
          name="EPrescriptionList"
          component={EPrescriptionList}
          options={{
            title: "Digital Prescription",
            headerTitleAlign: "center",
            headerShown: true,
          }}
        />
        <Stack.Screen name="ProviderTabDashboard" component={ProviderNavigator} options={{ title: "Digital-Prescription", headerTitleAlign: "center", headerShown: false }} />
        {/* <Stack.Screen name="EPrescriptionList" component={EPrescriptionList} options={{ title: "Digital-Prescription", headerTitleAlign: "center",headerShown: false }}/> */}
        <Stack.Screen name="Templates" component={Templates} options={{ title: "Templates", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="FollowUps" component={FollowUpsScreen} options={{ title: "Follow-Ups", headerTitleAlign: "center", headerShown: false }} />
        <Stack.Screen name="PinManagement" component={PinManagement} options={{ title: "Pin Management", headerTitleAlign: "center", headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default Routing