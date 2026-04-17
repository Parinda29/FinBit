import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Colors from '../constants/colors';
import EmptyState from '../components/ui/EmptyState';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

import {
  AppNotification,
  getNotifications,
  markNotificationRead,
  removeNotification,
} from '../services/transactionService';

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await getNotifications();
      setItems(payload.notifications);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleMarkRead = async (item: AppNotification) => {
    if (item.is_read) return;

    if (item.id >= 1000000) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, is_read: true, read_at: new Date().toISOString() }
            : row
        )
      );
      return;
    }

    try {
      const updated = await markNotificationRead(item.id);
      setItems((prev) => prev.map((row) => (row.id === item.id ? updated : row)));
    } catch (error) {
      Alert.alert('Action Failed', getFriendlyErrorMessage(error, 'Could not mark as read.'));
    }
  };

  const handleDelete = async (item: AppNotification) => {
    if (item.id >= 1000000) {
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      return;
    }

    try {
      await removeNotification(item.id);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (error) {
      Alert.alert('Delete Failed', getFriendlyErrorMessage(error, 'Could not delete notification.'));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close notifications"
        >
          <MaterialIcons name="close" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>Budget warnings, income entries, and expense entries.</Text>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !items.length && (
        <EmptyState
          icon="notifications-none"
          title="No Notifications"
          subtitle="You are all caught up for now. Budget and system alerts will show up here."
        />
      )}

      {items.map((item, index) => (
        <Swipeable
          key={`${item.id}-${item.created_at}-${index}`}
          overshootRight={false}
          renderRightActions={() => (
            <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(item)}>
              <MaterialIcons name="delete-outline" size={18} color="#FFFFFF" />
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
          )}
        >
          <View
            style={[
              styles.notificationCard,
              item.type === 'income' && styles.incomeCard,
              item.type === 'expense' && styles.expenseCard,
              item.is_read && styles.readCard,
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                item.type === 'income' && styles.incomeIconWrap,
                item.type === 'expense' && styles.expenseIconWrap,
              ]}
            >
              <MaterialIcons
                name={item.type === 'income' ? 'trending-up' : item.type === 'expense' ? 'trending-down' : 'warning-amber'}
                size={16}
                color={item.type === 'income' ? '#166534' : item.type === 'expense' ? '#991B1B' : Colors.warning}
              />
            </View>
            <View style={styles.cardContent}>
              <Text
                style={[
                  styles.cardTitle,
                  item.type === 'income' && styles.incomeText,
                  item.type === 'expense' && styles.expenseText,
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.cardMessage,
                  item.type === 'income' && styles.incomeText,
                  item.type === 'expense' && styles.expenseText,
                ]}
              >
                {item.message}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.category ? `${item.category} • ` : ''}{item.month}</Text>
                {!item.is_read ? (
                  <TouchableOpacity style={styles.readButton} onPress={() => handleMarkRead(item)}>
                    <Text style={styles.readButtonText}>Mark as read</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.readDoneText}>Read</Text>
                )}
              </View>
            </View>
          </View>
        </Swipeable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  notificationCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 10,
  },
  readCard: {
    opacity: 0.78,
  },
  incomeCard: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  expenseCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
  },
  incomeIconWrap: {
    backgroundColor: '#DCFCE7',
  },
  expenseIconWrap: {
    backgroundColor: '#FEE2E2',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  incomeText: {
    color: '#166534',
  },
  expenseText: {
    color: '#991B1B',
  },
  cardMessage: {
    marginTop: 2,
    color: '#78350F',
    fontSize: 12,
    fontWeight: '600',
  },
  cardMeta: {
    marginTop: 5,
    color: '#A16207',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  readButtonText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  readDoneText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  deleteAction: {
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    width: 94,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

