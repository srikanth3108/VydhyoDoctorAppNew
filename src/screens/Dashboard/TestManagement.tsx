import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { pick, types } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import * as XLSX from 'xlsx';
import { AuthFetch, AuthPost } from '../../auth/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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

type RootState = any;

type TestRow = {
  testId: string;
  testName: string;
  price: number;
};

export default function TestManagement() {
  const user = useSelector((s: RootState) => s.currentUser);
  const doctorId = user?.role === 'doctor' ? user?.userId : user?.createdBy;
  const navigation = useNavigation<any>();
  const [tests, setTests] = useState<TestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');

  // bulk modal-like flow (inline)
  const [bulkPreview, setBulkPreview] = useState<
    { testName: string; testPrice: number; row: number }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  const fetchTests = useCallback(
    async (pg = 1) => {
      try {
        const token = await AsyncStorage.getItem('authToken');

        setLoading(true);
        const res = await AuthFetch(
          `lab/getTestsByDoctorId/${doctorId}?page=${pg}&limit=${pageSize}`,
          token,
        );
        const fetched = (res?.data?.data?.tests || []).map((t: any) => ({
          testId: t.id,
          testName: t.testName,
          price: t.testPrice,
        }));
        if (pg === 1) setTests(fetched);
        else setTests(prev => [...prev, ...fetched]);

        setTotal(res?.data?.data?.pagination?.totalTests || 0);
        setPage(pg);
      } catch (e: any) {
        Toast.show({
          type: 'error',
          text1: e?.response?.data?.message || 'Failed to fetch tests',
        });
      } finally {
        setLoading(false);
      }
    },
    [doctorId, pageSize],
  );

  useEffect(() => {
    if (doctorId) fetchTests(1);
  }, [doctorId, fetchTests]);

  const loadMore = () => {
    const max = Math.ceil(total / pageSize);
    if (!loading && page < max) fetchTests(page + 1);
  };

  const openAdd = () => {
    setAddOpen(true);
    setName('');
    setPrice('');
  };

  const addTest = async () => {
    if (!name.trim())
      return Toast.show({ type: 'error', text1: 'Enter test name' });
    const p = Number(price);
    if (isNaN(p) || p < 0)
      return Toast.show({ type: 'error', text1: 'Enter valid price' });

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        //show alert after 3 seconds navigate to login screen
        Alert.alert('Error', 'Authentication token missing. Please login ');
        setAddOpen(false);
        setTimeout(() => {
          navigation.navigate('Authloader');
        }, 3000);
        return;
      }

      const resp = await AuthPost(
        'lab/addtest',
        { testName: name.trim(), testPrice: p, doctorId },
        token,
      );
      if (resp?.status === 'success') {
        Toast.show({ type: 'success', text1: 'Test added' });
        setAddOpen(false);
        fetchTests(1);
      } else {
        Alert.alert('Error', resp?.message?.message);
      }
    } catch (e: any) {
      const msg =
        e?.response?.status === 400 &&
          e?.response?.data?.message?.message ===
          'A test with this name already exists'
          ? 'A test with this name already exists'
          : e?.response?.data?.message?.message || 'Failed to add test';
      Alert.alert('Error', e?.message || msg);
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  const pickExcel = async () => {
    try {
      const result = await pick({
        allowMultiSelection: false,
        type: [types.allFiles],
        copyTo: 'cachesDirectory',
      });

      const file = Array.isArray(result) ? result[0] : result;
      const uri = (file as any)?.fileCopyUri || (file as any)?.uri;
      if (!uri) throw new Error('No file path returned by picker');

      const path =
        Platform.OS === 'ios'
          ? decodeURIComponent(uri.replace('file://', ''))
          : uri;

      const fileData = await RNFS.readFile(path, 'base64');
      const wb = XLSX.read(fileData, { type: 'base64' });
      const sheet = wb.SheetNames[0];
      const ws = wb.Sheets[sheet];
      const json = XLSX.utils.sheet_to_json(ws) as any[];

      const processed = json.map((row, idx) => {
        if (row.testName == null || row.testPrice == null) {
          throw new Error(
            'Excel must contain exactly "testName" and "testPrice" columns',
          );
        }
        return {
          testName: String(row.testName),
          testPrice: Number(row.testPrice),
          row: idx + 2,
        };
      });

      setBulkPreview(processed);
      Toast.show({
        type: 'success',
        text1: 'Parsed file. Review preview below.',
      });
    } catch (e: any) {
      if (e?.code && String(e.code).toLowerCase().includes('cancel')) return;
      if (e?.message && String(e.message).toLowerCase().includes('cancel'))
        return;
      Toast.show({ type: 'error', text1: e?.message || 'Could not read file' });
    }
  };

  const uploadBulk = async () => {
    if (!bulkPreview.length)
      return Toast.show({ type: 'error', text1: 'No data to upload' });
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('authToken');

      const resp = await AuthPost(
        'lab/addtest/bulkMobileJson',
        {
          doctorId,
          tests: bulkPreview.map(x => ({
            testName: x.testName,
            testPrice: x.testPrice,
          })),
        },
        token,
      );

      if (resp?.data?.data?.insertedCount > 0) {
        Toast.show({
          type: 'success',
          text1: `${resp.data.data.insertedCount} tests added`,
        });
        setBulkPreview([]);
        fetchTests(1);
      } else if (resp?.data?.data?.errors?.length) {
        Toast.show({ type: 'error', text1: 'All tests already exist' });
      }
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e?.response?.data?.message || 'Bulk upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: TestRow }) => (
    <View style={styles.row}>
      <View style={styles.testInfo}>
        <Text style={styles.tname}>{item.testName}</Text>
      </View>
      <Text style={styles.price}>
        ₹ {Number(item.price).toLocaleString('en-IN')}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.topBar}>
        
        <TouchableOpacity style={styles.primary} onPress={openAdd}>
          <Text style={styles.primaryText}>Add Test</Text>
        </TouchableOpacity>
      </View>

      {loading && tests.length === 0 ? (
        <View style={styles.spinningContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading List...</Text>
        </View>
      ) : tests?.length === 0 ? (
        <View style={styles.spinningContainer}>
          <Text style={styles.noDataText}>No Data Found</Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={x => x.testId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshing={loading}
          onRefresh={() => fetchTests(1)}
        />
      )}

      {bulkPreview.length > 0 && (
        <View style={styles.bulkPanel}>
          <Text style={styles.bulkTitle}>Preview ({bulkPreview.length})</Text>
          <ScrollView style={styles.bulkScrollView}>
            {bulkPreview.map(r => (
              <View key={r.row} style={styles.previewRow}>
                <Text style={styles.previewName} numberOfLines={1}>{r.testName}</Text>
                <Text style={styles.previewPrice}>
                  ₹ {r.testPrice.toLocaleString('en-IN')}
                </Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.outlined, styles.bulkActionButton]}
              onPress={() => setBulkPreview([])}
            >
              <Text style={styles.outlinedText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primary,
                styles.bulkActionButton,
                { opacity: uploading ? 0.6 : 1 },
              ]}
              disabled={uploading}
              onPress={uploadBulk}
            >
              <Text style={styles.primaryText}>
                {uploading ? 'Uploading...' : 'Upload Tests'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Test</Text>
            <TextInput
              placeholder="Test Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="#999999"
            />
            <TextInput
              placeholder="Test Price (₹)"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
              style={styles.input}
              placeholderTextColor="#999999"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.outlined, styles.modalActionButton]}
                onPress={() => setAddOpen(false)}
              >
                <Text style={styles.outlinedText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primary, styles.modalActionButton]}
                onPress={addTest}
              >
                <Text style={styles.primaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: isTablet ? SPACING.lg : SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...LAYOUT.shadow.sm,
  },
  testInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  tname: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  price: {
    fontWeight: '800',
    color: '#111827',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#1A3C6A',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: moderateScale(10),
    paddingHorizontal: SPACING.md,
  },
  outlinedText: {
    color: '#1A3C6A',
    fontWeight: '700',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  primary: {
    backgroundColor: '#1A3C6A',
    borderRadius: LAYOUT.borderRadius.md,
    paddingVertical: moderateScale(10),
    paddingHorizontal: SPACING.md,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
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
    fontSize: responsiveText(FONT_SIZE.sm),
    marginTop: SPACING.md,
  },
  noDataText: {
    color: 'black',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  listContent: {
    paddingBottom: SAFE_AREA.safeBottom + SPACING.lg,
  },
  bulkPanel: {
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    marginHorizontal: SPACING.xs,
    ...LAYOUT.shadow.sm,
  },
  bulkTitle: {
    fontWeight: '800',
    marginBottom: SPACING.sm,
    color: '#0f172a',
    fontSize: responsiveText(FONT_SIZE.md),
  },
  bulkScrollView: {
    maxHeight: moderateScale(220),
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  previewName: {
    flex: 1,
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#334155',
  },
  previewPrice: {
    width: moderateScale(90),
    textAlign: 'right',
    fontSize: responsiveText(FONT_SIZE.sm),
    color: '#111827',
    fontWeight: '600',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  bulkActionButton: {
    flex: 1,
  },
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: moderateScale(400),
    backgroundColor: '#fff',
    borderRadius: LAYOUT.borderRadius.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
    ...LAYOUT.shadow.lg,
  },
  modalTitle: {
    fontWeight: '800',
    fontSize: responsiveText(FONT_SIZE.lg),
    marginBottom: SPACING.xs,
    color: '#0f172a',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: LAYOUT.borderRadius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: moderateScale(12),
    backgroundColor: '#fff',
    color: '#000000',
    fontSize: responsiveText(FONT_SIZE.sm),
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  modalActionButton: {
    flex: 1,
  },
});