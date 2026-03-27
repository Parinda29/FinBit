import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';

import {
  deleteReceiptCapture,
  listReceiptCaptures,
  ReceiptCaptureItem,
  toReceiptCapturePreviewUrl,
} from '../services/receiptService';

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const DEMO_RECEIPTS: ReceiptCaptureItem[] = [
  {
    id: 1,
    ocr_amount: '550',
    category: 'food',
    source: 'camera',
    extracted_title: 'Restaurant Order',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    transaction_title: 'Lunch at Cafe',
  },
  {
    id: 2,
    ocr_amount: '1200',
    category: 'bill',
    source: 'upload',
    extracted_title: 'Electricity Bill',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    transaction_title: 'Monthly Bill Payment',
  },
  {
    id: 3,
    ocr_amount: '350',
    category: 'shopping',
    source: 'camera',
    extracted_title: 'Store Purchase',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    transaction_title: 'Grocery Shopping',
  },
  {
    id: 4,
    ocr_amount: '800',
    category: 'transport',
    source: 'camera',
    extracted_title: 'Taxi Receipt',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    transaction_title: 'Ride to Airport',
  },
];

export default function Receipts() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savedCaptures, setSavedCaptures] = useState<ReceiptCaptureItem[]>([]);
  const [selectedCapture, setSelectedCapture] = useState<ReceiptCaptureItem | null>(null);

  const loadCaptures = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const rows = await listReceiptCaptures();
      setSavedCaptures(rows);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load saved receipts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCaptures();
    }, [loadCaptures])
  );

  const onDeleteCapture = useCallback(async (captureId: number) => {
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteReceiptCapture(captureId);
      setSavedCaptures((prev) => prev.filter((item) => item.id !== captureId));
      setSuccess('Saved receipt deleted.');
      if (selectedCapture?.id === captureId) setSelectedCapture(null);
      // Sync in background after optimistic UI update.
      setTimeout(() => {
        void loadCaptures(true);
      }, 500);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  }, [selectedCapture?.id, loadCaptures]);

  const handleSelectCapture = useCallback((capture: ReceiptCaptureItem) => {
    setError(null);
    setSuccess(null);
    setSelectedCapture(capture);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedCapture(null);
    setError(null);
    setSuccess(null);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCaptures(true)} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Saved Receipts</Text>
      <Text style={styles.subtitle}>Only saved receipts are shown here. Tap any card to view full details.</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <MaterialIcons name="photo-library" size={18} color={Colors.primaryDark} />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>Receipt Vault</Text>
          <Text style={styles.heroMeta}>Persistent saved gallery with detail preview.</Text>
        </View>
      </View>

      {success && <Text style={styles.successText}>{success}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading saved receipts...</Text>
        </View>
      ) : savedCaptures.length === 0 ? (
        <View>
          <Text style={styles.demoTitle}>Sample Receipts</Text>
          <Text style={styles.demoSubtitle}>Tap the camera button below to add your first receipt</Text>
          <View style={styles.grid}>
            {DEMO_RECEIPTS.map((capture) => (
              <View key={String(capture.id)} style={styles.card}>
                <View style={styles.demoCardWrapper}>
                  <View style={styles.cardImageFallback}>
                    <MaterialIcons name="receipt" size={24} color={Colors.primary} />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {capture.extracted_title || 'Saved Receipt'}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {capture.category.toUpperCase()} Â· {formatDate(capture.created_at)}
                    </Text>
                    <Text style={styles.cardAmount} numberOfLines={1}>
                      {capture.ocr_amount ? `NPR ${capture.ocr_amount}` : 'NPR N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.grid}>
          {savedCaptures.map((capture) => {
            const imageUrl = toReceiptCapturePreviewUrl(capture);
            return (
              <View key={String(capture.id)} style={styles.card}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectCapture(capture)}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.cardImageFallback}>
                      <MaterialIcons name="broken-image" size={18} color={Colors.textTertiary} />
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {capture.extracted_title || 'Saved Receipt'}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {capture.category.toUpperCase()} Â· {formatDate(capture.created_at)}
                    </Text>
                    <Text style={styles.cardAmount} numberOfLines={1}>
                      {capture.ocr_amount ? `NPR ${capture.ocr_amount}` : 'NPR N/A'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={!!selectedCapture} transparent animationType="fade" onRequestClose={() => setSelectedCapture(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedCapture && (
              <>
                <Text style={styles.modalTitle}>{selectedCapture.extracted_title || 'Receipt Details'}</Text>

                {!!toReceiptCapturePreviewUrl(selectedCapture) && (
                  <Image
                    source={{ uri: toReceiptCapturePreviewUrl(selectedCapture)! }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                )}

                <Text style={styles.modalMeta}>Amount: {selectedCapture.ocr_amount ? `NPR ${selectedCapture.ocr_amount}` : 'N/A'}</Text>
                <Text style={styles.modalMeta}>Category: {selectedCapture.category}</Text>
                <Text style={styles.modalMeta}>Source: {selectedCapture.source}</Text>
                <Text style={styles.modalMeta}>Saved: {new Date(selectedCapture.created_at).toLocaleString()}</Text>

                <TouchableOpacity
                  style={styles.deleteModalButton}
                  onPress={() => onDeleteCapture(selectedCapture.id)}
                  disabled={busy}
                >
                  <Text style={styles.deleteModalText}>{busy ? 'Deleting...' : 'Delete Receipt'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeModalButton} onPress={handleCloseModal}>
                  <Text style={styles.closeModalText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push('/receipt-scanner')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="photo-camera" size={28} color={Colors.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  title: {
    color: '#112A2A',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F7FBFB',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: '#113535',
    fontSize: 15,
    fontWeight: '800',
  },
  heroMeta: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  successText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  loadingWrap: {
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE7E7',
    backgroundColor: Colors.white,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 88,
  },
  cardImageFallback: {
    width: '100%',
    height: 88,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  cardMeta: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  cardAmount: {
    marginTop: 3,
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    padding: 12,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    marginBottom: 8,
  },
  modalMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  deleteModalButton: {
    marginTop: 8,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteModalText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
  },
  closeModalButton: {
    marginTop: 8,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  closeModalText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  demoTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 12,
  },
  demoSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  demoCardWrapper: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

