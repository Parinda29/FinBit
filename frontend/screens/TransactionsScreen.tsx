import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

interface TransactionDetailsProps {
  route: { params: { title: string; category: string; amount: number; type: 'income' | 'expense'; date: string } };
}

const TransactionDetailsScreen: React.FC<TransactionDetailsProps> = ({ route }) => {
  const { title, category, amount, type, date } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons
          name={type === 'income' ? 'arrow-downward' : 'arrow-upward'}
          size={50}
          color={type === 'income' ? Colors.success : Colors.error}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.amount}>
          {type === 'income' ? '+' : '-'}${amount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{category}</Text>

        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{date}</Text>

        <Text style={styles.label}>Transaction Type</Text>
        <Text style={styles.value}>{type === 'income' ? 'Income' : 'Expense'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  amount: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  details: { backgroundColor: Colors.surface, padding: 16, borderRadius: 12 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary, marginTop: 12 },
  value: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
});

export default TransactionDetailsScreen;