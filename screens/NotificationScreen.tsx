import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import NotificationCard from '../components/NotificationCard';

type NotificationType = 'success' | 'warning' | 'error' | 'info';

interface Notification {
  message: string;
  type: NotificationType;
}

const NotificationsScreen: React.FC = () => {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const notifications: Notification[] = [
    { message: 'Transaction successful', type: 'success' },
    { message: 'Low balance warning', type: 'warning' },
    { message: 'Password changed successfully', type: 'info' },
    { message: 'Failed transaction', type: 'error' },
    { message: 'New premium plan available', type: 'info' },
    { message: 'Bill payment failed', type: 'error' },
  ];

  // Filter notifications based on selected filter
  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter(n => n.type === filter);

  const handleFilterChange = (type: NotificationType | 'all') => setFilter(type);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.screenTitle}>Notifications</Text>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'success', 'warning', 'info', 'error'] as (NotificationType | 'all')[]).map(
          type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                filter === type && { backgroundColor: Colors.primary },
              ]}
              onPress={() => handleFilterChange(type)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === type && { color: Colors.white },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Notifications List */}
      <View style={styles.notificationsList}>
        {filteredNotifications.map((notif, index) => (
          <NotificationCard key={index} message={notif.message} type={notif.type} />
        ))}
        {filteredNotifications.length === 0 && (
          <Text style={styles.noNotifications}>No notifications to display.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },

  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    marginRight: 8,
    marginBottom: 8,
  },
  filterText: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },

  notificationsList: { marginBottom: 20 },
  noNotifications: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
});

export default NotificationsScreen;