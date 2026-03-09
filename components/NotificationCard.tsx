import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export interface NotificationCardProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info'; 
}

const NotificationCard: React.FC<NotificationCardProps> = ({ message, type }) => {
  const bgColor =
    type === 'success'
      ? Colors.success
      : type === 'warning'
      ? Colors.warning
      : type === 'error'
      ? Colors.error
      : Colors.info;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: { color: Colors.white, fontWeight: '500' },
});

export default NotificationCard;