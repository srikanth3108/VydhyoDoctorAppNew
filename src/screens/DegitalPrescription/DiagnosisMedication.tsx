import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Modal,
  ActivityIndicator,
  Dimensions,
  ActionSheetIOS,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { AuthFetch } from '../../auth/auth';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { FlatList } from 'react-native';

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

// Import medication calculation utility
import { calculateMedicationQuantity } from '../../utility/medicationUtils';

const PrescriptionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { patientDetails, formData: initialFormData } = route.params;
  const currentUser = useSelector((state: any) => state.currentUser);
  const doctorId = currentUser.role === 'doctor' ? currentUser.userId : currentUser.createdBy;

  // master form data (tests + diagnosis + meds)
  const [formData, setFormData] = useState(
    initialFormData || { diagnosis: { selectedTests: [], medications: [] } }
  );

  // tests state
  const [testInput, setTestInput] = useState('');
  const [testList, setTestList] = useState<any[]>([]);
  const [testOptions, setTestOptions] = useState<any[]>([]);
  const [filteredTests, setFilteredTests] = useState<any[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<'test' | 'medicine' | null>(null);

  // medicines/inventory state
  const [medInventory, setMedInventory] = useState<any[]>([]);
  const [medicineOptions, setMedicineOptions] = useState<any[]>([]);
  // suggestion items for the dropdown
  const [filteredMedicines, setFilteredMedicines] = useState<
    { label: string; name: string; dosage?: string; type?: string }[]
  >([]);
  const [lastMedQuery, setLastMedQuery] = useState<string>(''); // to recompute suggestions when async data arrives

  // saved cards (finalized for this visit)
  const [savedMeds, setSavedMeds] = useState<any[]>(
    formData?.diagnosis?.medications || []
  );

  // NEW: support multiple draft forms (every draft is a dropdown-editable block)
  const [draftMeds, setDraftMeds] = useState<any[]>([]);
  const showMedicationForm = draftMeds.length > 0;

  // Previous prescriptions state
  const [previousPrescriptions, setPreviousPrescriptions] = useState<any[]>([]);
  const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Template functionality
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  // Dropdown selection inside Template modal
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // ===== previous-medicine suggestions for the name input =====
  const [prevMedSuggestions, setPrevMedSuggestions] = useState<
    { name: string; dosage?: string; type?: string }[]
  >([]);
  const [loadingPrevMeds, setLoadingPrevMeds] = useState(false);

  const [tplKey, setTplKey] = useState(0);
  const [prevKey, setPrevKey] = useState(0);

  // const frequencyOptions = ['1-0-0', '1-0-1', '1-1-1', '0-0-1', '0-1-0', '1-1-0', '0-1-1', 'SOS'];
    const frequencyOptions = [
    "1-0-0",
    "0-1-0",
    "0-0-1",
    "1-1-0",
    "1-0-1",
    "0-1-1",
    "1-1-1",

    // Half tablet combinations
    "1/2-0-0", // Half Morning
    "0-1/2-0", // Half Afternoon
    "0-0-1/2", // Half Night
    "1/2-1/2-0",
    "1/2-0-1/2",
    "0-1/2-1/2",
    "1/2-1/2-1/2",
    "SOS",
  ];
  const timingOptions = ['Before Breakfast', 'After Breakfast', 'Before Lunch', 'After Lunch', 'Before Dinner', 'After Dinner', 'Bedtime'];
  const medicineTypeOptions = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops'];
  const manualQuantityTypes = ['Syrup', 'Cream', 'Drops'];

  // NEW: State for modal pickers on iOS
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerType, setPickerType] = useState<'type' | 'frequency' | null>(null);
  const [pickerDraftId, setPickerDraftId] = useState<number | null>(null);
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [selectedPickerValue, setSelectedPickerValue] = useState<string | null>(null);

  // ---------- data fetchers ----------
const fetchInventory = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('authToken');
    const response = await AuthFetch('pharmacy/getAllMedicinesByDoctorID', storedToken);
    const medicines = response?.data?.data || [];
    const sortedMedicines = [...medicines].sort((a, b) => a.medName.localeCompare(b.medName));
    setMedInventory(sortedMedicines);
    setMedicineOptions(
      sortedMedicines.map((med) => ({
        value: med.medName,
        label: `${med.medName}${med.dosage ? ` (${med.dosage})` : ''}`, // Include dosage in label
        name: med.medName,
        dosage: med.dosage, // Add dosage here
        id: med._id,
      }))
    );
  } catch {
    // silent
  }
};
  const fetchTests = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(`lab/getTestsByDoctorId/${doctorId}`, storedToken);
      const tests = response?.data?.data?.tests || [];
      const sorted = [...tests].sort((a, b) => a.testName.localeCompare(b.testName));
      setTestList(sorted);
      setTestOptions(sorted.map((test) => ({ value: test.testName, label: test.testName })));
    } catch {
      // silent
    }
  };

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const storedToken = await AsyncStorage.getItem('authToken');
      const response = await AuthFetch(`template/getTemplatesByDoctorId?doctorId=${doctorId}`, storedToken);
      const data = response?.data?.data || response?.data || [];
      const templateList = Array.isArray(data) ? data : [];
      templateList.sort((a, b) => new Date(b?.updatedAt || 0).getTime() - new Date(a?.updatedAt || 0).getTime());
      setTemplates(templateList);
      if (templateList.length > 0) {
        setSelectedTemplateId(templateList[0]._id);
      }
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Failed to load templates' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Fetch previous prescriptions (for modal)
  const fetchPreviousPrescriptions = async () => {
    try {
      setLoadingPrescriptions(true);
      const storedToken = await AsyncStorage.getItem('authToken');
      const patientId = patientDetails?.patientId || patientDetails?.userId;

      if (!patientId) {
        Toast.show({ type: 'error', text1: 'Patient ID not found' });
        return;
      }

      const response = await AuthFetch(
        `pharmacy/getEPrescriptionByPatientIdAndDoctorId/${patientId}?doctorId=${doctorId}`,
        storedToken
      );
      if (response?.status === 'success') {
        const sortedPrescriptions = (response?.data?.data || [])
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPreviousPrescriptions(sortedPrescriptions);
        setShowPrescriptionsModal(true);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to fetch prescriptions' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error fetching prescriptions' });
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // ===== NEW: fetch just previous medicines for suggestions (used under Name input) =====
  const fetchPreviousMedicineSuggestions = async () => {
    try {
      setLoadingPrevMeds(true);
      const storedToken = await AsyncStorage.getItem('authToken');
      const patientId = patientDetails?.patientId || patientDetails?.userId;
      if (!patientId) return;

      const response = await AuthFetch(
        `pharmacy/getEPrescriptionByPatientIdAndDoctorId/${patientId}?doctorId=${doctorId}`,
        storedToken
      );

      const list = (response?.data?.data || []) as any[];
      // Flatten meds, dedupe by medName+dosage, keep most recent first
      const seen = new Set<string>();
      const out: { name: string; dosage?: string; type?: string }[] = [];

      // Sort by createdAt desc, then traverse
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      for (const rx of list) {
        const meds = Array.isArray(rx.medications) ? rx.medications : [];
        for (const m of meds) {
          const key = `${(m.medName || '').toLowerCase()}|${(m.dosage || '').toLowerCase()}`;
          if (m.medName && !seen.has(key)) {
            seen.add(key);
            out.push({
              name: m.medName,
              dosage: m.dosage,
              type: m.medicineType,
            });
          }
        }
      }

      setPrevMedSuggestions(out);
    } catch (e) {
      // silent; suggestions are optional
    } finally {
      setLoadingPrevMeds(false);
    }
  };

  useEffect(() => {
    fetchTests();
    fetchInventory();
    fetchTemplates();
    fetchPreviousMedicineSuggestions(); // load previous-meds suggestions once patient/doctor known
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  // keep tests suggestions filtered
  useEffect(() => {
    const matches = testOptions
      .filter((t) => t.label.toLowerCase().includes(testInput.toLowerCase()))
      .map((t) => t.label);
    setFilteredTests(matches);
  }, [testInput, testOptions]);

  // whenever savedMeds change, reflect back into formData
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      diagnosis: { ...(prev?.diagnosis || {}), medications: savedMeds },
    }));
  }, [savedMeds]);

  // ---------- helpers ----------
  const [editingSavedIndices, setEditingSavedIndices] = useState<Set<number>>(new Set());

  const validateDosage = (dosage: string) =>
    (/^\d+\s*(mg|ml|g|tablet|tab|capsule|cap|spoon|drop)s?$/i).test(dosage);

  const validateMedication = (med: any) => {
    if (!med?.name || !String(med.name).trim()) { Alert.alert('Error', 'Enter a valid medicine name'); return false; }
    if (med.duration === null || med.duration === undefined || med.duration <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return false;
    }
    if (med.duration > 365) {
      Alert.alert('Error', 'Duration cannot exceed 365 days');
      return false;
    }

    // Optional but validate if filled
    if (med.dosage && !validateDosage(med.dosage)) { Alert.alert('Error', 'Enter valid dosage Ex: 100mg'); return false; }
    
    // Validate timing: if frequency is set and not SOS, timings must match the frequency requirement
    if (med.frequency && med.frequency !== 'SOS') {
      // Count required timings using parseFloat to handle fractions like "1/2"
      const required = med.frequency
        .split('-')
        .filter((x: string) => parseFloat(x) > 0)
        .length;
      const selected = (med.timing?.length || 0);
      if (selected !== required) { 
        Alert.alert('Error', `Select ${required} timing(s)`); 
        return false; 
      }
    }
    return true;
  };

  // Check if medicine already exists in today's saved cards (same name + dosage)
  const isMedicineAlreadyAdded = (medicineName: string, dosage: string) => {
    return savedMeds.some(med =>
      med.medName?.toLowerCase() === medicineName?.toLowerCase() &&
      med.dosage?.toLowerCase() === dosage?.toLowerCase()
    );
  };

  // Build suggestions (dynamic, deduped) from previous meds + inventory as fallback
// Build suggestions (dynamic, deduped) from previous meds + inventory as fallback
const buildMedicineMatches = (q: string) => {
  const query = (q || '').toLowerCase();
  const prev = (prevMedSuggestions || [])
    .filter(m => (m.name || '').toLowerCase().includes(query))
    .map(m => ({
      label: `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`, // Format: "Medicine Name (dosage)"
      name: m.name,
      dosage: m.dosage,
      type: m.type,
    }));

  // fallback: add inventory items WITH dosage
  const inv = (medicineOptions || [])
    .filter(m => (m.label || '').toLowerCase().includes(query))
    .map(m => ({
      label: m.label, // This already includes dosage from the updated fetchInventory
      name: m.name,
      dosage: m.dosage, // Include dosage
    }));

  // dedupe by name+dosage
  const seen = new Set<string>();
  const merged: { label: string; name: string; dosage?: string; type?: string }[] = [];
  [...prev, ...inv].forEach(it => {
    const key = `${(it.name || '').toLowerCase()}|${(it.dosage || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(it);
    }
  });

  return merged.slice(0, 50);
};

  // Recompute dropdown suggestions when data arrives (so it isn't blank and non-scrollable)
  useEffect(() => {
    if (activeDropdown === 'medicine') {
      setFilteredMedicines(buildMedicineMatches(lastMedQuery));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevMedSuggestions, medicineOptions, activeDropdown]);

  // ---------- Draft creation helpers ----------
  const createDraftFromMed = (med: any, opts?: { fromPrev?: boolean; fromTemplate?: boolean; originalPrescriptionId?: string | null; templateId?: string | null; editingSavedIndex?: number | null }) => {
    return {
      id: Date.now() + Math.random(),
      name: med.medName || med.name || '',
      type: med.medicineType || med.type || null,
      dosage: med.dosage || '',
      duration: med.duration ?? null,
      timing: med.timings || med.timing || [],
      frequency: med.frequency || null,
      quantity: med.quantity ?? 0,
      manualQuantity: manualQuantityTypes.includes((med.medicineType || med.type) || ''),
      notes: med.notes || '',
      isFromPrevious: !!opts?.fromPrev,
      isFromTemplate: !!opts?.fromTemplate,
      originalPrescriptionId: opts?.originalPrescriptionId || null,
      templateId: opts?.templateId || null,
      isEditingSaved: typeof opts?.editingSavedIndex === 'number',
      editingSavedIndex: typeof opts?.editingSavedIndex === 'number' ? opts?.editingSavedIndex : null,
    };
  };

  const draftToCard = (d: any) => ({
    medInventoryId: medInventory.find(m => m.medName === d.name)?._id || null,
    medName: d.name,
    quantity: d.quantity,
    medicineType: d.type,
    dosage: d.dosage,
    duration: d.duration,
    frequency: d.frequency,
    timings: d.timing || [],
    notes: d.notes || '',
    isFromPrevious: d.isFromPrevious || false,
    isFromTemplate: d.isFromTemplate || false,
    originalPrescriptionId: d.originalPrescriptionId || null,
    templateId: d.templateId || null,
  });

  // ---------- Loaders (now ALWAYS into drafts) ----------
  const loadPrescriptionIntoForm = (medication: any) => {
    if (isMedicineAlreadyAdded(medication.medName, medication.dosage)) {
      Toast.show({ type: 'error', text1: 'This medicine is already present in today\'s prescription' });
      return;
    }

    const newDraft = createDraftFromMed(medication, {
      fromPrev: true,
      originalPrescriptionId: medication.prescriptionId || null,
    });
    setDraftMeds(prev => [...prev, newDraft]);
    setActiveDropdown('medicine');
    setShowPrescriptionsModal(false);
    Toast.show({ type: 'success', text1: 'Medicine loaded into form' });
  };

  const handleEditSavedMedicine = (index: number) => {
    const med = savedMeds[index];
    if (!med) return;

    // Create a draft seeded from the saved card, tagged as "editing this index"
    const draft = createDraftFromMed(med, { editingSavedIndex: index });

    setDraftMeds(prev => [...prev, draft]);
    setActiveDropdown('medicine');

    // Hide the original card while it's being edited
    setEditingSavedIndices(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });

    Toast.show({ type: 'success', text1: 'Editing medicine…' });
  };

  const handleCancelDraft = (id: number) => {
    setDraftMeds(prev => {
      const draft = prev.find(d => d.id === id);
      // if this draft was editing a saved card, show that card again
      if (draft?.isEditingSaved && typeof draft.editingSavedIndex === 'number') {
        setEditingSavedIndices(prevSet => {
          const next = new Set(prevSet);
          next.delete(draft.editingSavedIndex as number);
          return next;
        });
      }
      return prev.filter(d => d.id !== id);
    });
    setFilteredMedicines([]);
    setActiveDropdown(null);
  };

  const loadEntirePrescription = (prescription: any) => {
    const duplicateMeds = (prescription.medications || []).filter((med: any) =>
      isMedicineAlreadyAdded(med.medName, med.dosage)
    );

    if (duplicateMeds.length > 0) {
      Toast.show({
        type: 'error',
        text1: `${duplicateMeds.length} medicine(s) already present in today's prescription`,
        text2: 'Only non-duplicate medications will be loaded'
      });
    }

    if (prescription.selectedTests && prescription.selectedTests.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis,
          selectedTests: prescription.selectedTests.map((test: any) => ({
            testName: test.testName,
            testInventoryId: test.testInventoryId,
          })),
        },
      }));
    }
    if (prescription.diagnosisList) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis,
          diagnosisList: prescription.diagnosisList,
        },
      }));
    }

    const nonDuplicateMeds = (prescription.medications || []).filter((med: any) =>
      !isMedicineAlreadyAdded(med.medName, med.dosage)
    );

    const drafts = nonDuplicateMeds.map((m: any) =>
      createDraftFromMed(m, { fromPrev: true, originalPrescriptionId: prescription._id })
    );

    if (drafts.length === 0) {
      Toast.show({ type: 'info', text1: 'All medications from this prescription are already present' });
      setShowPrescriptionsModal(false);
      return;
    }
    setDraftMeds(prev => [...prev, ...drafts]);
    setActiveDropdown('medicine');
    setShowPrescriptionsModal(false);
    Toast.show({ type: 'success', text1: 'Non-duplicate medications loaded into forms' });
  };

  const loadTemplateAsDrafts = (template: any) => {
    // Check for duplicate medications before loading
    const duplicateMeds = (template.medications || []).filter((med: any) =>
      isMedicineAlreadyAdded(med.medName, med.dosage)
    );

    if (duplicateMeds.length > 0) {
      Toast.show({
        type: 'error',
        text1: `${duplicateMeds.length} medicine(s) already present in today's prescription`,
        text2: 'Only non-duplicate medications will be loaded'
      });
    }

    const filteredDrafts = draftMeds.filter(draft => !draft.isFromTemplate);
    const filteredSaved = savedMeds.filter(med => !med.isFromTemplate);

    if (template.selectedTests && template.selectedTests.length > 0) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis,
          selectedTests: template.selectedTests.map((test: any) => ({
            testName: test.testName,
            testInventoryId: test.testInventoryId,
          })),
        },
      }));
    }
    if (template.diagnosisList) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis,
          diagnosisList: template.diagnosisList,
        },
      }));
    }

    if (!template?.medications || template.medications.length === 0) {
      Toast.show({ type: 'error', text1: 'No medications found in template' });
      return;
    }

    // Filter out duplicate medications
    const nonDuplicateMeds = (template.medications || []).filter((med: any) =>
      !isMedicineAlreadyAdded(med.medName, med.dosage)
    );

    const drafts = nonDuplicateMeds.map((m: any) =>
      createDraftFromMed(m, { fromTemplate: true, templateId: template._id })
    );

    if (drafts.length === 0) {
      Toast.show({ type: 'info', text1: 'All medications from this template are already present' });
      setShowTemplateModal(false);
      return;
    }

    setDraftMeds([...filteredDrafts, ...drafts]);
    setSavedMeds(filteredSaved);
    setActiveDropdown('medicine');
    setShowTemplateModal(false);
    Toast.show({ type: 'success', text1: `Medications from "${template.name}" loaded into forms` });
  };

  // Update previous prescription when medicine is edited (placeholder)
  const updatePreviousPrescription = async (updatedMedication: any) => {
    try {
      if (!updatedMedication.originalPrescriptionId) return;
      const storedToken = await AsyncStorage.getItem('authToken');
      Toast.show({ type: 'success', text1: 'Previous prescription updated' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to update previous prescription' });
    }
  };

  // ---------- tests ----------
  const handleAddTest = (testName: string) => {
    if (!testName) return Toast.show({ type: 'error', text1: 'Please enter a valid test name' });
    const exists = (formData?.diagnosis?.selectedTests || []).some(
      (item: any) => item.testName.toLowerCase().trim() === testName.toLowerCase().trim()
    );
    if (!exists) {
      setFormData((prev: any) => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis,
          selectedTests: [...(prev.diagnosis?.selectedTests || []), { testName: testName.trim() }],
        },
      }));
      Toast.show({ type: 'success', text1: 'Test added successfully' });
    } else {
      Toast.show({ type: 'error', text1: 'This test is already added' });
    }
    setTestInput('');
    setFilteredTests([]);
    setActiveDropdown(null);
  };

  const handleRemoveTest = (index: number) => {
    const updatedTests = [...(formData?.diagnosis?.selectedTests || [])];
    updatedTests.splice(index, 1);
    setFormData((prev: any) => ({
      ...prev,
      diagnosis: { ...prev.diagnosis, selectedTests: updatedTests },
    }));
    Toast.show({ type: 'success', text1: 'Test removed' });
  };

  // ---------- medicines: add/open, edit draft(s), remove ----------
  const handleAddMedicine = () => {
    const newDraft = {
      id: Date.now(),
      name: '',
      type: null,
      dosage: '',
      duration: null,
      timing: [],
      frequency: null,
      quantity: 0,
      manualQuantity: false,
      notes: '',
      isFromPrevious: false,
      isFromTemplate: false,
      originalPrescriptionId: null,
      templateId: null,
    };
    setDraftMeds(prev => [...prev, newDraft]);
    setActiveDropdown('medicine');
    Toast.show({ type: 'success', text1: 'Medicine form added' });
  };

  const handleDraftChange = (id: number, field: string, value: any) => {
    setDraftMeds(prev => {
      const next = prev.map(d => {
        if (d.id !== id) return d;
        let updated = { ...d, [field]: value };

        if (field === 'type') {
          updated.manualQuantity = manualQuantityTypes.includes(value);
          updated.quantity = updated.manualQuantity
            ? 0
            : calculateMedicationQuantity(value, updated.duration, updated.frequency);
        }

        if ((field === 'frequency' || field === 'duration') && !updated.manualQuantity) {
          updated.quantity = calculateMedicationQuantity(updated.type, updated.duration, updated.frequency);
        }

        return updated;
      });
      return next;
    });

    if (field === 'name') {
      const q = String(value || '');
      setLastMedQuery(q);
      setFilteredMedicines(buildMedicineMatches(q));
    }
  };

  const updateDraftFrequency = (id: number, value: string) => {
    setDraftMeds(prev => prev.map(d => {
      if (d.id !== id) return d;
      const maxSel = value === 'SOS' ? 0 : value.split('-').filter((x) => x === '1').length;
      const newTiming = value === 'SOS' ? [] : (d.timing || []).slice(0, maxSel);
      return {
        ...d,
        frequency: value,
        timing: newTiming,
        quantity: d.manualQuantity ? d.quantity : calculateMedicationQuantity(d.type, d.duration, value),
      };
    }));
  };

  const handleRemoveMedicine = (index: number) => {
    const medicineToRemove = savedMeds[index];
    if (medicineToRemove.isFromPrevious) {
      Toast.show({ type: 'info', text1: 'Medicine from previous prescription removed' });
    }
    if (medicineToRemove.isFromTemplate) {
      Toast.show({ type: 'info', text1: 'Medicine from template removed' });
    }
    const updated = savedMeds.filter((_, i) => i !== index);
    setSavedMeds(updated);
    Toast.show({ type: 'success', text1: 'Medicine removed' });
    setFilteredMedicines([]);
    setActiveDropdown(null);
  };

  // ---------- NEW: iOS-friendly picker functions ----------
  const openPickerIOS = (type: 'type' | 'frequency', draftId: number, currentValue: string | null) => {
    if (Platform.OS === 'ios') {
      const options = type === 'type' 
        ? [...medicineTypeOptions, 'Cancel']
        : [...frequencyOptions, 'Cancel'];
      
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex === options.length - 1) return; // Cancel pressed
          
          const selectedValue = options[buttonIndex];
          
          if (type === 'type') {
            handleDraftChange(draftId, 'type', selectedValue);
          } else {
            updateDraftFrequency(draftId, selectedValue);
          }
        }
      );
    } else {
      // For Android, use the existing Picker but open in modal for consistency
      setPickerType(type);
      setPickerDraftId(draftId);
      setPickerOptions(type === 'type' ? medicineTypeOptions : frequencyOptions);
      setSelectedPickerValue(currentValue);
      setShowPickerModal(true);
    }
  };

  const closePickerModal = () => {
    setShowPickerModal(false);
    setPickerType(null);
    setPickerDraftId(null);
    setPickerOptions([]);
    setSelectedPickerValue(null);
  };

  const confirmPickerSelection = () => {
    if (pickerDraftId !== null && pickerType && selectedPickerValue) {
      if (pickerType === 'type') {
        handleDraftChange(pickerDraftId, 'type', selectedPickerValue);
      } else {
        updateDraftFrequency(pickerDraftId, selectedPickerValue);
      }
    }
    closePickerModal();
  };

  // ---------- next ----------
  const handleNext = () => {
    if (draftMeds.length > 0) {
      // 1) validate all open drafts
      for (const d of draftMeds) {
        if (!validateMedication(d)) return;
      }

      // 2) start from current saved cards
      const merged = [...savedMeds];

      // 2a) apply edits (drafts created from existing saved cards)
      const editingDrafts = draftMeds.filter(d => d.isEditingSaved && typeof d.editingSavedIndex === 'number');
      editingDrafts.forEach(d => {
        const idx = d.editingSavedIndex as number;
        const card = draftToCard(d);
        if (idx >= 0 && idx < merged.length) {
          merged[idx] = card; // replace in-place
        } else {
          merged.push(card);  // fallback (shouldn't happen)
        }
      });

      // 2b) append truly new drafts
      const newDrafts = draftMeds.filter(d => !d.isEditingSaved);
      newDrafts.forEach(d => merged.push(draftToCard(d)));

      // 3) DUPLICATE CHECK (same medName + same dosage)
      const norm = (s: any) => String(s || '').trim().toLowerCase();
      const seen = new Set<string>();
      for (const m of merged) {
        const key = `${norm(m.medName)}|${norm(m.dosage)}`;
        if (seen.has(key) && norm(m.medName) && norm(m.dosage)) {
          Alert.alert(
            'Duplicate Medicine',
            '2 medicines with same dosage exist. Please remove one.'
          );
          return; // stop here, let user fix duplicates
        }
        seen.add(key);
      }

      // 4) proceed if no duplicates
      const nextFormData = {
        ...formData,
        diagnosis: {
          ...(formData?.diagnosis || {}),
          medications: merged,
        },
      };

      setSavedMeds(merged);
      setDraftMeds([]);
      setFilteredMedicines([]);
      setActiveDropdown(null);
      setEditingSavedIndices(new Set()); // clear any "hidden while editing" flags
      navigation.navigate('PatientReports', { patientDetails, formData: nextFormData });
      return;
    }

    // No drafts open -> still enforce duplicate check on current savedMeds
    const norm = (s: any) => String(s || '').trim().toLowerCase();
    const seen = new Set<string>();
    for (const m of savedMeds) {
      const key = `${norm(m.medName)}|${norm(m.dosage)}`;
      if (seen.has(key) && norm(m.medName) && norm(m.dosage)) {
        Toast.show({
          type: 'error',
          text1: '2 medicines with same dosage exists please remove one',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }
      seen.add(key);
    }
    navigation.navigate('PatientReports', { patientDetails, formData });
  };

  // Adjust this offset if your header/navigation bar height differs
  const keyboardVerticalOffset = Platform.select({ 
    ios: moderateScale(80), 
    android: moderateScale(80) 
  }) as number;

  // helpers for UI
  const getTemplateById = (id: string | null) => templates.find(t => t._id === id);

  const modalScrollMaxHeight = Platform.OS === 'android'
    ? 0.85 * Dimensions.get('window').height
    : undefined;

      const getMaxTimings = (frequency:any) => {
  if (!frequency || frequency === "SOS") {
    return 0;
  }

  return frequency
    .split("-")
    .filter((x) => parseFloat(x) > 0)
    .length;
};
console.log("savedMeds",savedMeds)
  return (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled
          removeClippedSubviews={false}
          scrollEnabled
          showsVerticalScrollIndicator
          contentContainerStyle={[styles.container, { flexGrow: 1, paddingBottom: responsiveHeight(18) }]}
        >

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧪 Diagnostic Tests</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter test name"
              value={testInput}
              onChangeText={setTestInput}
              onFocus={() => setActiveDropdown('test')}
              placeholderTextColor="#9CA3AF"
            />
            {activeDropdown === 'test' && testOptions.length > 0 && (
              <ScrollView style={styles.dropdown} nestedScrollEnabled={true}>
                {testOptions.map((test, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      handleAddTest(test.value);
                      setActiveDropdown(null);
                    }}
                    style={styles.dropdownItem}
                  >
                    <Text style={{ color: 'black', fontSize: responsiveText(FONT_SIZE.sm) }}>{test.value}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.addButton} onPress={() => handleAddTest(testInput)}>
              <Text style={styles.addButtonText}>+ Add Test</Text>
            </TouchableOpacity>

            {(formData?.diagnosis?.selectedTests || []).map((test: any, index: number) => (
              <View key={index} style={styles.testItemContainer}>
                <Text style={styles.testTag}>{test.testName}</Text>
                <TouchableOpacity onPress={() => handleRemoveTest(index)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🩺 Diagnosis</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Hypertension, Diabetes"
              multiline
              value={formData?.diagnosis?.diagnosisList ? String(formData.diagnosis.diagnosisList) : ''}
              onChangeText={(text) =>
                setFormData((prev: any) => ({
                  ...prev,
                  diagnosis: { ...prev.diagnosis, diagnosisList: text },
                }))
              }
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.buttonRowContainer}>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => {
                setTplKey((k) => k + 1);
                setShowTemplateModal(true);
              }}
              disabled={loadingTemplates}
            >
              {loadingTemplates ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.templateButtonText}>Templates</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.getPrescriptionButton}
              onPress={() => {
                setPrevKey((k) => k + 1);
                fetchPreviousPrescriptions();
              }}
              disabled={loadingPrescriptions}
            >
              {loadingPrescriptions ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.getPrescriptionButtonText}>Previous Prescriptions</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.medHeader}>
              <Text style={styles.sectionTitle}>💊 Prescribed Medications</Text>
            </View>

            {savedMeds.map((med: any, index: number) => {
              if (editingSavedIndices.has(index)) return null;

              return (
                <View key={`card-${index}`} style={styles.medicationItemContainer}>
                  <View style={styles.medicationContent}>
                    <Text style={styles.medicationText}>
                      {med.medName} {med.dosage}
                      {med.isFromPrevious && <Text style={styles.previousTag}> (Previous)</Text>}
                      {med.isFromTemplate && <Text style={styles.templateTag}> (Template)</Text>}
                    </Text>
                    <Text style={styles.medicationSubText}>
                      {med.duration} days • {med.frequency} • {med.medicineType}
                    </Text>
                    {med.timings && med.timings.length > 0 && (
                      <Text style={styles.medicationSubText}>Timings: {med.timings.join(', ')}</Text>
                    )}
                    <Text style={styles.medicationSubText}>
                      Qty: {med.quantity}
                    </Text>
                    {med.notes && (
                      <Text style={styles.medicationSubText}>
                        Notes: {med.notes}
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: SPACING.xs }}>
                    <TouchableOpacity
                      onPress={() => handleEditSavedMedicine(index)}
                      style={[styles.deleteButton, { backgroundColor: '#1e90ff' }]}
                    >
                      <Text style={styles.deleteText}>✎</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleRemoveMedicine(index)} style={styles.deleteButton}>
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {showMedicationForm && draftMeds.map((draft) => (
              <View key={draft.id} style={styles.medBlock}>
                <View style={styles.rowSpaceBetween}>
                  <Text style={styles.medLabel}>
                    {draft.isFromPrevious
                      ? '📋 Previous Medicine'
                      : draft.isFromTemplate
                        ? '📄 Template Medicine'
                        : ' New Medicine'}
                  </Text>
                  <TouchableOpacity onPress={() => handleCancelDraft(draft.id)}>
                    <Text style={{ color: 'red', fontSize: moderateScale(16) }}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ position: 'relative' }}>
                  <TextInput
                    placeholder="Medicine Name"
                    style={[styles.input, (draft.isFromPrevious || draft.isFromTemplate) && styles.disabledInput]}
                    value={draft.name}
                    onChangeText={(text) => {
                      handleDraftChange(draft.id, 'name', text);
                      const matches = buildMedicineMatches(text);
                      setLastMedQuery(text);
                      setFilteredMedicines(matches);
                      setActiveDropdown(matches.length > 0 ? 'medicine' : null);
                    }}
                    onFocus={() => {
                      if (!prevMedSuggestions.length) fetchPreviousMedicineSuggestions();
                      const matches = buildMedicineMatches(''); // Empty query = all medicines
                      setLastMedQuery('');
                      setFilteredMedicines(matches);
                      setActiveDropdown(matches.length > 0 ? 'medicine' : null);
                    }}
                    onBlur={() => {
                      setTimeout(() => setActiveDropdown(null), 200);
                    }}
                    placeholderTextColor="#9CA3AF"
                    editable={!draft.isFromPrevious && !draft.isFromTemplate}
                  />

                  {activeDropdown === 'medicine' &&
                    !draft.isFromPrevious &&
                    !draft.isFromTemplate &&
                    filteredMedicines.length > 0 && (  // This is the key condition
                      <View
                        style={[
                          styles.dropdown,
                          {
                            position: 'absolute',
                            top: moderateScale(52),
                            left: 0,
                            right: 0,
                            zIndex: 3000,
                            elevation: 8,
                          },
                        ]}
                      >
                        {loadingPrevMeds ? (
                          <View style={{ padding: SPACING.md, alignItems: 'center' }}>
                            <ActivityIndicator />
                            <Text style={{ marginTop: SPACING.sm, color: '#475569', fontSize: responsiveText(FONT_SIZE.sm) }}>Loading medicines…</Text>
                          </View>
                        ) : (
                          <FlatList
                            data={filteredMedicines}
                            keyExtractor={(_, idx) => `med-opt-${idx}`}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                onPress={() => {
                                  handleDraftChange(draft.id, 'name', item.name);
                                  if (item.dosage && !(draft.isFromPrevious || draft.isFromTemplate)) {
                                    handleDraftChange(draft.id, 'dosage', item.dosage);
                                  }
                                  if (item.type && !(draft.isFromPrevious || draft.isFromTemplate)) {
                                    handleDraftChange(draft.id, 'type', item.type);
                                  }
                                  setActiveDropdown(null);
                                  setFilteredMedicines([]);
                                  Toast.show({ type: 'success', text1: 'Selected from suggestions' });
                                }}
                                style={styles.dropdownItem}
                              >
                                <Text style={{ color: 'black', fontSize: responsiveText(FONT_SIZE.sm) }}>{item.label}</Text>
                              </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="always"
                            nestedScrollEnabled
                            style={{ maxHeight: moderateScale(220) }}
                          />
                        )}
                      </View>
                    )}
                </View>

                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={[styles.pickerWrapper, styles.iosPickerTouchable]}
                    onPress={() => openPickerIOS('type', draft.id, draft.type)}
                  >
                    <Text style={[styles.pickerText, { color: draft.type ? '#111' : '#928686', fontSize: responsiveText(FONT_SIZE.sm) }]}>
                      {draft.type || 'Select Type'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={draft.type}
                      onValueChange={(value) => handleDraftChange(draft.id, 'type', value)}
                      style={[styles.pickerInner, { color: draft.type ? '#111' : '#928686', fontSize: responsiveText(FONT_SIZE.sm) }]}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Type" value={null} color="#928686ff" />
                      {medicineTypeOptions.map((option) => (
                        <Picker.Item key={option} label={option} value={option} />
                      ))}
                    </Picker>
                  </View>
                )}

                <TextInput
                  placeholder="Dosage (e.g. 100mg, 5ml)"
                  style={styles.input}
                  value={draft.dosage}
                  onChangeText={(text) => handleDraftChange(draft.id, 'dosage', text)}
                  placeholderTextColor="#9CA3AF"
                />
                <TextInput
                  placeholder="Duration (days)"
                  style={[
                    styles.input,
                    draft.duration && draft.duration > 365 && { borderColor: '#ef4444', borderWidth: 2 }
                  ]}
                  value={draft.duration?.toString() || ''}
                  onChangeText={(text) => {
                    // Remove all non-digit characters and limit to 3 digits
                    const clean = text.replace(/[^\d]/g, '').slice(0, 3);
                    const num = clean === '' ? null : parseInt(clean, 10);
                    handleDraftChange(draft.id, 'duration', num);
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  maxLength={3} // Prevents typing beyond 3 digits
                />
                {draft.duration && draft.duration > 365 && (
                  <Text style={{ color: '#dc2626', fontSize: responsiveText(FONT_SIZE.xs), marginTop: SPACING.xs, marginBottom: SPACING.md }}>
                    Duration cannot exceed 365 days
                  </Text>
                )}

                {Platform.OS === 'ios' ? (
                  <TouchableOpacity
                    style={[styles.pickerWrapper, styles.iosPickerTouchable]}
                    onPress={() => openPickerIOS('frequency', draft.id, draft.frequency)}
                  >
                    <Text style={[styles.pickerText, { color: draft.frequency ? '#111' : '#928686', fontSize: responsiveText(FONT_SIZE.sm) }]}>
                      {draft.frequency || 'Select Frequency'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={draft.frequency}
                      onValueChange={(value) => updateDraftFrequency(draft.id, value)}
                      style={[styles.pickerInner, { color: draft.type ? '#111' : '#928686', fontSize: responsiveText(FONT_SIZE.sm) }]}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select Frequency" value={null} color="#9a9aa5ff" />
                      {frequencyOptions.map((option) => (
                        <Picker.Item key={option} label={option} value={option} />
                      ))}
                    </Picker>
                  </View>
                )}

                <View style={{ marginBottom: SPACING.md }}>
                  <Text style={{ fontWeight: '600', marginBottom: SPACING.xs, color: 'black', fontSize: responsiveText(FONT_SIZE.sm) }}>Timing:</Text>
                  {timingOptions.map((option) => {
                    const selected = (draft.timing || []).includes(option);
                    const maxTimings = getMaxTimings(draft.frequency);
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          if (draft.frequency === 'SOS') return;
                          const current = draft.timing || [];
                          let updated = current;
                          if (selected) {
                            updated = current.filter((t: string) => t !== option);
                          } else if (current.length < maxTimings) {
                            updated = [...current, option];
                          } else {
                            Toast.show({ type: 'error', text1: `You can select max ${maxTimings} timing(s)` });
                            return;
                          }
                          handleDraftChange(draft.id, 'timing', updated);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: SPACING.xs,
                          backgroundColor: selected ? '#007bff' : '#f0f0f0',
                          padding: SPACING.sm,
                          borderRadius: LAYOUT.borderRadius.sm,
                        }}
                      >
                        <Text style={{ color: selected ? '#fff' : '#000', fontSize: responsiveText(FONT_SIZE.sm) }}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {draft.manualQuantity ? (
                  <TextInput
                    placeholder="Quantity (e.g. 1 bottle, 1 tube)"
                    style={styles.input}
                    value={String(draft.quantity ?? '')}
                    onChangeText={(text) => handleDraftChange(draft.id, 'quantity', text)}
                    keyboardType="default"
                  />
                ) : (
                  <TextInput
                    placeholder="Quantity"
                    style={[styles.input, { backgroundColor: '#eaeaea' }]}
                    value={String(draft.quantity ?? '')}
                    editable={false}
                    placeholderTextColor="#9CA3AF"
                  />
                )}

                <TextInput
                  placeholder="Notes"
                  style={styles.textArea}
                  multiline
                  value={draft.notes || ''}
                  onChangeText={(text) => handleDraftChange(draft.id, 'notes', text)}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ))}

            <TouchableOpacity onPress={handleAddMedicine} style={[styles.blueButton, { marginTop: SPACING.md }]}>
              <Text style={styles.blueButtonText}>+ Add Medicine</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }} />
        </ScrollView>

        <Modal
          visible={showTemplateModal}
          animationType="slide"
          onRequestClose={() => setShowTemplateModal(false)}
          presentationStyle="fullScreen"
          statusBarTranslucent
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Templates</Text>
                <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} key={`tpl-wrap-${tplKey}`}>
                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  removeClippedSubviews={false}
                  scrollEnabled
                  style={{ maxHeight: modalScrollMaxHeight }}
                  showsVerticalScrollIndicator
                >

                  {templates.length > 0 && (
                    <View style={{ marginBottom: SPACING.md }}>
                      <Text style={{ color: '#0A2342', fontWeight: '600', marginBottom: SPACING.sm, fontSize: responsiveText(FONT_SIZE.sm) }}>Select Template</Text>
                      {Platform.OS === 'ios' ? (
                        <TouchableOpacity
                          style={[styles.pickerWrapper, styles.iosPickerTouchable, { marginBottom: SPACING.md }]}
                          onPress={() => {
                            const options = [...templates.map(t => t.name || 'Untitled'), 'Cancel'];
                            ActionSheetIOS.showActionSheetWithOptions(
                              {
                                options,
                                cancelButtonIndex: options.length - 1,
                              },
                              (buttonIndex) => {
                                if (buttonIndex < templates.length) {
                                  setSelectedTemplateId(templates[buttonIndex]._id);
                                }
                              }
                            );
                          }}
                        >
                          <Text style={[styles.pickerText, { color: '#111', fontSize: responsiveText(FONT_SIZE.sm) }]}>
                            {templates.find(t => t._id === selectedTemplateId)?.name || 'Select Template'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.pickerWrapper, { marginBottom: SPACING.md }]}>
                          <Picker
                            selectedValue={selectedTemplateId}
                            onValueChange={(v) => setSelectedTemplateId(v)}
                            style={[styles.pickerInner, { fontSize: responsiveText(FONT_SIZE.sm) }]}
                            mode="dropdown"
                          >
                            {templates.map((t) => (
                              <Picker.Item key={t._id} label={t.name || 'Untitled'} value={t._id} />
                            ))}
                          </Picker>
                        </View>
                      )}
                      {selectedTemplateId && (() => {
                        const selectedTemplate = templates.find(t => t._id === selectedTemplateId);
                        if (!selectedTemplate) return null;

                        return (
                          <View style={styles.prescriptionItem}>
                            <View style={styles.prescriptionHeader}>
                              <Text style={styles.prescriptionTitle}>
                                {selectedTemplate.name}
                              </Text>
                              <Text style={styles.prescriptionDate}>
                                {selectedTemplate.updatedAt ? new Date(selectedTemplate.updatedAt).toLocaleDateString() : 'No date'}
                              </Text>
                            </View>

                            <View style={styles.prescriptionStats}>
                              <Text style={styles.prescriptionStat}>
                                💊 {selectedTemplate.medications?.length || 0} Medications
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.loadFullButton}
                              onPress={() => loadTemplateAsDrafts(selectedTemplate)}
                            >
                              <Text style={styles.loadFullButtonText}>Use This Template</Text>
                            </TouchableOpacity>

                            <Text style={styles.medicationsTitle}>Medications:</Text>
                            {selectedTemplate.medications?.map((med: any, medIndex: number) => (
                              <TouchableOpacity
                                key={medIndex}
                                style={[
                                  styles.medicationButton,
                                  isMedicineAlreadyAdded(med.medName, med.dosage) && styles.medicationButtonAdded
                                ]}
                                onPress={() => {
                                  if (isMedicineAlreadyAdded(med.medName, med.dosage)) {
                                    Toast.show({ type: 'error', text1: 'This medicine is already present in today\'s prescription' });
                                    return;
                                  }
                                  const newDraft = createDraftFromMed(med, { fromTemplate: true, templateId: selectedTemplate._id });
                                  setDraftMeds(prev => [...prev, newDraft]);
                                  setShowTemplateModal(false);
                                  setActiveDropdown('medicine');
                                  Toast.show({ type: 'success', text1: 'Medicine loaded into form' });
                                }}
                              >
                                <View style={styles.medicationButtonContent}>
                                  <Text style={styles.medicationButtonText}>
                                    {med.medName} - {med.dosage}
                                  </Text>
                                  <Text style={styles.medicationButtonSubText}>
                                    {med.frequency} • {med.duration} days
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        );
                      })()}
                    </View>
                  )}

                  {templates.length === 0 && (
                    <Text style={styles.noPrescriptionsText}>No templates found</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showPrescriptionsModal}
          animationType="slide"
          onRequestClose={() => setShowPrescriptionsModal(false)}
          presentationStyle="fullScreen"
          statusBarTranslucent
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Previous Prescriptions</Text>
                <TouchableOpacity onPress={() => setShowPrescriptionsModal(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }} key={`prev-wrap-${prevKey}`}>
                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  removeClippedSubviews={false}
                  scrollEnabled
                  style={{ maxHeight: modalScrollMaxHeight }}
                  showsVerticalScrollIndicator
                >
                  {previousPrescriptions.length === 0 ? (
                    <Text style={styles.noPrescriptionsText}>No previous prescriptions found</Text>
                  ) : (
                    previousPrescriptions.map((prescription, index) => (
                      <View key={index} style={styles.prescriptionItem}>
                        <View style={styles.prescriptionHeader}>
                          <Text style={styles.prescriptionTitle}>
                            Prescription #{previousPrescriptions.length - index}
                          </Text>
                        </View>

                        <View style={styles.prescriptionStats}>
                          <Text style={styles.prescriptionStat}>
                            💊 {prescription.medications?.length || 0} Medications
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.loadFullButton}
                          onPress={() => loadEntirePrescription(prescription)}
                        >
                          <Text style={styles.loadFullButtonText}>Use This Prescription</Text>
                        </TouchableOpacity>

                        {prescription.medications?.length ? (
                          <>
                            <Text style={styles.medicationsTitle}>Medications:</Text>
                            {prescription.medications?.map((med: any, medIndex: number) => (
                              <TouchableOpacity
                                key={medIndex}
                                style={[
                                  styles.medicationButton,
                                  isMedicineAlreadyAdded(med.medName, med.dosage) && styles.medicationButtonAdded
                                ]}
                                onPress={() => loadPrescriptionIntoForm(med)}
                              >
                                <View style={styles.medicationButtonContent}>
                                  <Text style={styles.medicationButtonText}>
                                    {med.medName} - {med.dosage}
                                  </Text>
                                  <Text style={styles.medicationButtonSubText}>
                                    {med.frequency} • {med.duration} days
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            ))}
                          </>
                        ) : null}
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={showPickerModal}
          transparent
          animationType="slide"
          onRequestClose={closePickerModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerModalHeader}>
                <Pressable onPress={closePickerModal}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmPickerSelection}>
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <View style={styles.pickerModalBody}>
                <Picker
                  selectedValue={selectedPickerValue}
                  onValueChange={(value) => setSelectedPickerValue(value)}
                  style={styles.pickerModalPicker}
                >
                  <Picker.Item label={`Select ${pickerType === 'type' ? 'Type' : 'Frequency'}`} value={null} />
                  {pickerOptions.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
        </Modal>

        <View style={[styles.buttonRow, { paddingBottom: Platform.OS === 'ios' ? SAFE_AREA.safeBottom + SPACING.md : SAFE_AREA.safeBottom + SPACING.sm }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { Keyboard.dismiss(); navigation.goBack(); }}>
            <Text style={styles.cancelText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PrescriptionScreen;

const styles = StyleSheet.create({
  container: { 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    backgroundColor: '#f6f6f6',
    paddingTop: SPACING.md,
  },
  section: { 
    backgroundColor: '#fff', 
    padding: isTablet ? SPACING.lg : SPACING.md, 
    borderRadius: LAYOUT.borderRadius.lg, 
    marginBottom: SPACING.md, 
    ...LAYOUT.shadow.sm 
  },
  sectionTitle: { 
    fontWeight: '600', 
    fontSize: responsiveText(isTablet ? FONT_SIZE.lg : FONT_SIZE.md), 
    marginBottom: SPACING.sm, 
    color: '#0A2342' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    marginBottom: SPACING.md, 
    color: 'black', 
    backgroundColor: '#fff',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  disabledInput: { 
    backgroundColor: '#f5f5f5', 
    color: '#666' 
  },
  picker: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: LAYOUT.borderRadius.md, 
    marginBottom: SPACING.md, 
    backgroundColor: '#fff', 
    color: 'gray' 
  },
  textArea: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: LAYOUT.borderRadius.md, 
    padding: SPACING.md, 
    minHeight: moderateScale(80), 
    textAlignVertical: 'top', 
    backgroundColor: '#fff', 
    marginBottom: SPACING.md, 
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  addButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.sm, 
    alignSelf: 'flex-start', 
    marginTop: SPACING.sm 
  },
  addButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  testTag: { 
    backgroundColor: '#e2e2e2', 
    padding: SPACING.sm, 
    borderRadius: LAYOUT.borderRadius.sm, 
    marginTop: SPACING.xs, 
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  dropdown: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: LAYOUT.borderRadius.md, 
    marginBottom: SPACING.sm, 
    maxHeight: moderateScale(220), 
    overflow: 'hidden' 
  },
  dropdownItem: { 
    padding: SPACING.md, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  medHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  blueButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: SPACING.sm, 
    paddingHorizontal: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.sm 
  },
  blueButtonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  medBlock: { 
    marginTop: SPACING.md, 
    backgroundColor: '#f9f9f9', 
    padding: SPACING.md, 
    borderRadius: LAYOUT.borderRadius.md 
  },
  rowSpaceBetween: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  buttonRow: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#f6f6f6', 
    borderTopWidth: 1, 
    borderTopColor: '#e5e7eb', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: isTablet ? SPACING.lg : SPACING.md, 
    paddingVertical: SPACING.md 
  },
  cancelButton: { 
    backgroundColor: '#ccc', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.lg, 
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48),
  },
  nextButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: SPACING.md, 
    paddingHorizontal: SPACING.lg, 
    borderRadius: LAYOUT.borderRadius.md,
    flex: 1,
    marginLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(48),
  },
  cancelText: { 
    color: '#000', 
    fontWeight: '500',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  nextText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: SPACING.sm, 
    flex: 1 
  },
  medLabel: { 
    color: '#0A2342', 
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  testItemContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: SPACING.sm 
  },
  medicationItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    backgroundColor: '#f8f9fa',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff'
  },
  medicationContent: { 
    flex: 1, 
    marginRight: SPACING.md 
  },
  medicationText: { 
    color: 'black', 
    marginBottom: SPACING.xxs, 
    fontSize: responsiveText(FONT_SIZE.sm), 
    fontWeight: '500' 
  },
  medicationSubText: { 
    color: '#666', 
    fontSize: responsiveText(FONT_SIZE.xs), 
    marginBottom: SPACING.xxs 
  },
  previousTag: { 
    color: '#28a745', 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '600' 
  },
  templateTag: { 
    color: '#ff6b35', 
    fontSize: responsiveText(FONT_SIZE.xs), 
    fontWeight: '600' 
  },
  deleteButton: { 
    backgroundColor: '#dc3545', 
    borderRadius: moderateScale(12), 
    width: moderateScale(24), 
    height: moderateScale(24), 
    justifyContent: 'center', 
    alignItems: 'center', 
    flexShrink: 0 
  },
  pickerWrapper: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: LAYOUT.borderRadius.md, 
    backgroundColor: '#fff', 
    marginBottom: SPACING.md, 
    height: moderateScale(48), 
    justifyContent: 'center', 
    paddingHorizontal: SPACING.sm, 
    overflow: 'hidden' 
  },
  pickerInner: { 
    alignSelf: 'stretch', 
    height: moderateScale(48), 
    color: 'gray', 
    margin: 0, 
    padding: 0 
  },
  iosPickerTouchable: {
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#999',
  },
  deleteText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: moderateScale(12) 
  },

  // Button row container for Template and Previous Prescriptions
  buttonRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  templateButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: moderateScale(48),
  },
  templateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  getPrescriptionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: LAYOUT.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: moderateScale(48),
  },
  getPrescriptionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f8f9fa',
    paddingTop: SAFE_AREA.safeTop + SPACING.md,
  },
  modalTitle: {
    fontSize: responsiveText(isTablet ? FONT_SIZE.xl : FONT_SIZE.lg),
    fontWeight: '600',
    color: '#0A2342',
  },
  closeButton: {
    fontSize: moderateScale(20),
    color: '#dc2626',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: SPACING.lg,
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  prescriptionItem: {
    backgroundColor: '#fff',
    padding: SPACING.lg,
    borderRadius: LAYOUT.borderRadius.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#e9ecef',
    ...LAYOUT.shadow.sm,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  prescriptionTitle: {
    fontSize: responsiveText(FONT_SIZE.md),
    fontWeight: '600',
    color: '#0A2342',
    flex: 1,
  },
  prescriptionDate: {
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#6c757d',
    fontWeight: '500',
  },
  prescriptionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  prescriptionStat: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#495057',
    fontWeight: '500',
  },
  loadFullButton: {
    backgroundColor: '#007bff',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  loadFullButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  medicationsTitle: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '600',
    color: '#495057',
    marginBottom: SPACING.sm,
  },
  medicationButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: SPACING.md,
    borderRadius: LAYOUT.borderRadius.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  medicationButtonAdded: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  medicationButtonContent: {
    flex: 1,
  },
  medicationButtonText: {
    fontSize: responsiveText(FONT_SIZE.sm),
    fontWeight: '500',
    color: '#212529',
    marginBottom: SPACING.xxs,
  },
  medicationButtonSubText: {
    fontSize: responsiveText(FONT_SIZE.xs),
    color: '#6c757d',
  },
  addText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  addedText: {
    color: '#155724',
    fontWeight: '600',
    fontSize: responsiveText(FONT_SIZE.xs),
  },
  noPrescriptionsText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: responsiveText(FONT_SIZE.md),
    marginTop: SPACING.lg,
  },
  // Picker Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: LAYOUT.borderRadius.lg,
    borderTopRightRadius: LAYOUT.borderRadius.lg,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  pickerModalBody: {
    paddingHorizontal: 0,
    paddingBottom: SAFE_AREA.safeBottom,
  },
  pickerModalPicker: {
    height: moderateScale(200),
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
});