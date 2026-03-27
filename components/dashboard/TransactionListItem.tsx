import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../../constants/colors';

type TransactionListItemProps = {
  title: string;
  category: string;
  amount: string;
  date: string;
  type: 'income' | 'expense';
  status?: string;
};

export default function TransactionListItem({
  title,
  category,
  amount,
  date,
  type,
  status = 'Completed',
}: TransactionListItemProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View
          style={[
            styles.badge,
            { backgroundColor: type === 'income' ? '#ECFDF3' : '#FEE2E2' },
          ]}
        >
          <MaterialIcons
            name={type === 'income' ? 'south-west' : 'north-east'}
            size={14}
            color={type === 'income' ? Colors.primaryDark : Colors.error}
          />
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>
            {category} • {date}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={type === 'income' ? styles.amountIncome : styles.amountExpense}>{amount}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountIncome: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '800',
  },
  amountExpense: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '800',
  },
  status: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
