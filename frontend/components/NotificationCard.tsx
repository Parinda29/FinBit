import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppColors from '../constants/colors';

export interface NotificationCardProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info'; 
}

const NotificationCard: React.FC<NotificationCardProps> = ({ message, type }) => {
  const bgColor =
    type === 'success'
      ? AppColors.success
      : type === 'warning'
      ? AppColors.warning
      : type === 'error'
      ? AppColors.error
      : AppColors.info;

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
  text: { color: AppColors.white, fontWeight: '500' },
});

export default NotificationCard;