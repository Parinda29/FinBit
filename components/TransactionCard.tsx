import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export interface TransactionCardProps {
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense'; 
}

const TransactionCard: React.FC<TransactionCardProps> = ({ title, category, amount, type }) => {
  const amountColor = type === 'income' ? Colors.success : Colors.error;

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.category}>{category}</Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {type === 'income' ? '+' : '-'}${amount.toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.shadowLight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  category: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TransactionCard;