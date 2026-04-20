import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '../constants/colors';
import { createTransaction, scanReceiptOcr } from '../services/transactionService';
import {
  createReceiptCapture,
  ReceiptCategory,
} from '../services/receiptService';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

type SelectedReceiptFile = {
  uri: string;
  name: string;
  type: string;
};

const isImageFile = (file: SelectedReceiptFile | null) =>
  !!file && (file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name));

const CATEGORY_OPTIONS: ReceiptCategory[] = [
  'food',
  'bill',
  'transport',
  'shopping',
  'health',
  'entertainment',
  'others',
];

const categoryLabel = (value: ReceiptCategory) =>
  value === 'food'
    ? 'Food'
    : value === 'bill'
      ? 'Bill'
      : value === 'transport'
        ? 'Transport'
        : value === 'shopping'
          ? 'Shopping'
          : value === 'health'
            ? 'Health'
            : value === 'entertainment'
              ? 'Entertainment'
              : 'Others';

export default function ReceiptScannerPage() {
  const router = useRouter();
  const { autoOpen } = useLocalSearchParams<{ autoOpen?: string }>();
  const autoOpenHandledRef = useRef(false);
  const [receiptFile, setReceiptFile] = useState<SelectedReceiptFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [flowMessage, setFlowMessage] = useState('Capture or upload receipt image, then save.');
  const [title, setTitle] = useState('Scanned Receipt');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [category, setCategory] = useState<ReceiptCategory>('others');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [captureSource, setCaptureSource] = useState<'camera' | 'upload'>('camera');

  const runOcrForFile = useCallback(async (file: SelectedReceiptFile) => {
    if (!isImageFile(file)) {
      setOcrStatus('failed');
      setFlowMessage('OCR works for image files. For PDF, enter amount manually and save.');
      return;
    }

    setOcrStatus('running');
    setFlowMessage('Running OCR scan on receipt image...');
    try {
      const parsed = await scanReceiptOcr(file, title);
      setNotice(null);
      setTitle(parsed.title || 'Scanned Receipt');
      setAmount(parsed.amount || '');
      setTransactionDate(parsed.transaction_date || new Date().toISOString().slice(0, 10));
      setCategory(
        parsed.category?.toLowerCase().includes('bill')
          ? 'bill'
          : parsed.category?.toLowerCase().includes('food')
            ? 'food'
            : parsed.category?.toLowerCase().includes('transport')
              ? 'transport'
              : parsed.category?.toLowerCase().includes('shop')
                ? 'shopping'
                : parsed.category?.toLowerCase().includes('health')
                  ? 'health'
                  : parsed.category?.toLowerCase().includes('entertainment')
                    ? 'entertainment'
            : 'others'
      );
      setDescription(parsed.description || 'OCR scanned receipt');
      setOcrStatus('success');
      setFlowMessage('OCR completed. Review fields and save receipt image.');
    } catch (error) {
      setOcrStatus('failed');
      setFlowMessage('OCR failed. You can still enter amount/category manually and save.');
      setNotice(getFriendlyErrorMessage(error, 'Could not parse scanned receipt.'));
    }
  }, [title]);

  const onOpenScanner = useCallback(async () => {
    setLoading(true);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Needed', 'Camera permission is required to scan receipts.');
        return;
      }

      const captureResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.45,
        allowsEditing: false,
      });

      if (captureResult.canceled || !captureResult.assets?.[0]) {
        return;
      }

      const asset = captureResult.assets[0];
      const file: SelectedReceiptFile = {
        uri: asset.uri,
        name: asset.fileName || `scan-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setCaptureSource('camera');
      setReceiptFile(file);
      setFlowMessage('Camera capture complete. Scanning OCR...');
      await runOcrForFile(file);
    } catch (error) {
      const message = getFriendlyErrorMessage(error, 'Could not capture receipt image.');
      if (/NoSuchMethodError|getServices\(\)/i.test(message)) {
        setNotice('Camera module mismatch detected. Rebuild app once: npx expo run:android --device');
      } else {
        setNotice(message);
      }
    } finally {
      setLoading(false);
    }
  }, [runOcrForFile]);

  const onUploadReceipt = async () => {
    setLoading(true);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      const asset = picked.assets[0];
      const file: SelectedReceiptFile = {
        uri: asset.uri,
        name: asset.name || `receipt-${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      };
      setCaptureSource('upload');
      setReceiptFile(file);
      setFlowMessage('Receipt uploaded. Running OCR scan...');
      await runOcrForFile(file);
    } catch (error) {
      setNotice(getFriendlyErrorMessage(error, 'Could not upload receipt file.'));
    } finally {
      setLoading(false);
    }
  };

  const onSaveReceiptImage = async () => {
    if (!receiptFile) {
      Alert.alert('No Receipt', 'Please scan or upload a receipt first.');
      return;
    }

    const numericAmount = Number(amount.replace(/,/g, ''));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Amount Required', 'Enter a valid amount before saving receipt and transaction.');
      return;
    }

    let selectedDateIso = new Date().toISOString();
    if (transactionDate.trim()) {
      const parsedDate = new Date(transactionDate.trim());
      if (Number.isNaN(parsedDate.getTime())) {
        Alert.alert('Invalid Date', 'Date should be valid, for example: 2026-03-25');
        return;
      }
      selectedDateIso = parsedDate.toISOString();
    }

    setSaving(true);
    try {
      const transaction = await createTransaction({
        title: title.trim() || 'Scanned Receipt',
        amount: numericAmount,
        category: categoryLabel(category),
        description: description.trim() || 'Receipt scan transaction',
        type: 'expense',
        source: 'scanner',
        transaction_date: selectedDateIso,
      });

      try {
        await createReceiptCapture(
          {
            uri: receiptFile.uri,
            name: receiptFile.name,
            type: receiptFile.type,
          },
          captureSource,
          category,
          title.trim() || 'Scanned Receipt',
          transaction.id,
          amount || undefined,
          description || undefined
        );
      } catch (captureError) {
        const reason = getFriendlyErrorMessage(captureError, 'Receipt image upload failed.');
        Alert.alert('Partially Saved', `Transaction saved, but receipt image failed: ${reason}`);
        return;
      }

      Alert.alert('Saved', 'Receipt image and transaction saved successfully.', [
        {
          text: 'OK',
          onPress: () => router.push('/receipts'),
        },
      ]);
      setReceiptFile(null);
      setTitle('Scanned Receipt');
      setAmount('');
      setTransactionDate('');
      setCategory('others');
      setDescription('');
      setOcrStatus('idle');
      setNotice(null);
      setFlowMessage('Capture or upload next receipt image, then save.');
    } catch (error) {
      Alert.alert('Save Failed', getFriendlyErrorMessage(error, 'Failed to save receipt image.'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (autoOpen !== '1') return;
    if (autoOpenHandledRef.current) return;
    autoOpenHandledRef.current = true;
    onOpenScanner();
  }, [autoOpen, onOpenScanner]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
        setRefreshing(false);
      }} />}
    >
      <Text style={styles.title}>Receipt Scanner</Text>
      <Text style={styles.subtitle}>Capture/upload receipt, OCR scan, review, then save as thumbnail.</Text>
      <Text style={styles.helperText}>SMS import is separate. This screen only captures and saves receipt images.</Text>
      <Text style={styles.flowText}>{flowMessage}</Text>
      {!!notice && <Text style={styles.noticeText}>{notice}</Text>}

      <View style={styles.stepRow}>
        <View style={styles.stepPill}><Text style={styles.stepText}>1. Capture</Text></View>
        <View style={styles.stepPill}><Text style={styles.stepText}>2. OCR</Text></View>
        <View style={styles.stepPill}><Text style={styles.stepText}>3. Save</Text></View>
      </View>

      <View style={styles.sourceRow}>
        <TouchableOpacity style={styles.sourceButton} onPress={onOpenScanner} disabled={loading || saving}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <MaterialIcons name="photo-camera" size={18} color={Colors.white} />
              <Text style={styles.sourceButtonText}>Scan Camera</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sourceButton, styles.uploadButton]} onPress={onUploadReceipt} disabled={loading || saving}>
          <MaterialIcons name="upload-file" size={18} color={Colors.primaryDark} />
          <Text style={[styles.sourceButtonText, styles.uploadButtonText]}>Upload Receipt</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ocrStatusRow}>
        <Text style={styles.ocrStatusLabel}>OCR Status:</Text>
        <Text
          style={[
            styles.ocrStatusValue,
            ocrStatus === 'success' && styles.ocrSuccess,
            ocrStatus === 'failed' && styles.ocrFailed,
          ]}
        >
          {ocrStatus.toUpperCase()}
        </Text>
        <TouchableOpacity
          style={styles.retryOcrButton}
          onPress={() => {
            if (!receiptFile) return;
            runOcrForFile(receiptFile);
          }}
          disabled={!receiptFile || loading || saving}
        >
          <Text style={styles.retryOcrText}>Retry OCR</Text>
        </TouchableOpacity>
      </View>

      {receiptFile && isImageFile(receiptFile) && (
        <Image source={{ uri: receiptFile.uri }} style={styles.previewImage} resizeMode="cover" />
      )}

      {receiptFile && !isImageFile(receiptFile) && (
        <TouchableOpacity style={styles.fileCard} activeOpacity={0.85}>
          <MaterialIcons name="picture-as-pdf" size={18} color={Colors.error} />
          <Text style={styles.fileText} numberOfLines={1}>{receiptFile.name}</Text>
        </TouchableOpacity>
      )}

      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" />
      <Text style={styles.categoryLabel}>Total Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="Total Amount (e.g., 325.00)"
      />
      <Text style={styles.categoryLabel}>Date</Text>
      <TextInput
        style={styles.input}
        value={transactionDate}
        onChangeText={setTransactionDate}
        placeholder="Date (YYYY-MM-DD)"
      />
      <Text style={styles.categoryLabel}>Select Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORY_OPTIONS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.categoryChip, category === item && styles.categoryChipActive]}
            onPress={() => setCategory(item)}
          >
            <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
              {categoryLabel(item)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Notes (optional)"
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={onSaveReceiptImage} disabled={saving || loading}>
        {saving ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Receipt Image</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F8F8',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
  },
  helperText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  flowText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  noticeText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stepPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '700',
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  sourceButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 46,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sourceButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  ocrStatusRow: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ocrStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  ocrStatusValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  ocrSuccess: {
    color: Colors.success,
  },
  ocrFailed: {
    color: Colors.error,
  },
  retryOcrButton: {
    marginLeft: 'auto',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryOcrText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  uploadButtonText: {
    color: Colors.primaryDark,
  },
  previewImage: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileCard: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  fileText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D9E8E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: '#6EE7B7',
    backgroundColor: '#ECFDF5',
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: Colors.primaryDark,
  },
  saveButton: {
    borderRadius: 12,
    minHeight: 46,
    backgroundColor: '#D9534F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
