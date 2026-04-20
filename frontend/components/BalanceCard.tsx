import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export interface BalanceCardProps {
  total: number;
  income: number;
  expenses: number;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ total, income, expenses }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Balance</Text>
      <Text style={styles.total}>${total.toFixed(2)}</Text>
      <View style={styles.row}>
        <Text style={styles.income}>Income: ${income.toFixed(2)}</Text>
        <Text style={styles.expenses}>Expenses: ${expenses.toFixed(2)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: Colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  total: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  income: {
    color: Colors.success,
    fontWeight: '600',
  },
  expenses: {
    color: Colors.error,
    fontWeight: '600',
  },
});

export default BalanceCard;