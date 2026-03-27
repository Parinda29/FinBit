import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import EmptyState from '../components/ui/EmptyState';

import { AppNotification, getNotifications } from '../services/transactionService';

export default function NotificationsPage() {
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
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Notifications</Text>
      <Text style={styles.subtitle}>Budget warnings and near-limit alerts.</Text>

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
        <View key={`${item.created_at}-${index}`} style={styles.notificationCard}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="warning-amber" size={16} color={Colors.warning} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
            <Text style={styles.cardMeta}>{item.month}</Text>
          </View>
        </View>
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
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
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
});

