import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Colors from '../../constants/colors';
import AppCard from './AppCard';

type StatCardProps = {
  label: string;
  value: string;
  tone?: 'neutral' | 'income' | 'expense';
};

export default function StatCard({ label, value, tone = 'neutral' }: StatCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          tone === 'income' && styles.income,
          tone === 'expense' && styles.expense,
        ]}
      >
        {value}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 12,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    marginTop: 6,
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  income: {
    color: Colors.success,
  },
  expense: {
    color: Colors.error,
  },
});
