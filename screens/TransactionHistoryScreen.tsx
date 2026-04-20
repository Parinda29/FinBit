import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import TransactionCard from '../components/TransactionCard';
import Colors from '../constants/colors';
import CustomButton from '../components/CustomButton';
import { fetchTransactions, TransactionItem } from '../services/transactionService';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  searchInput: {
    height: 40,
    borderColor: Colors.mediumGray,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: Colors.textPrimary,
  },
  filterContainer: { flexDirection: 'row', marginBottom: 12 },
});

// initial dummy data replaced by API response
const TransactionHistoryScreen: React.FC = () => {
  const [transactionsData, setTransactionsData] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const rows = await fetchTransactions();
      setTransactionsData(rows || []);
    } catch (e) {
      console.error('Error fetching transactions', e);
    } finally {
      setLoading(false);
    }
  };

  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused) {
      loadTransactions();
    }
  }, [isFocused]);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = transactionsData.filter(txn => {
    const matchesSearch =
      txn.title.toLowerCase().includes(search.toLowerCase()) ||
      txn.category.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ? true : txn.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <>
          <Text style={styles.title}>Transaction History</Text>

          <TextInput
            placeholder="Search by title or category"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <View style={styles.filterContainer}>
            {['all', 'income', 'expense'].map(f => (
              <CustomButton
                key={f}
                title={f.toUpperCase()}
                onPress={() => setFilter(f as any)}
                style={{
                  marginRight: 8,
                  backgroundColor: filter === f ? Colors.primary : Colors.lightGray,
                }}
              />
            ))}
          </View>

          <FlatList
            data={filteredTransactions}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TransactionCard
                title={item.title}
                category={item.category}
                amount={Number(item.amount || 0)}
                type={item.type}
              />
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </>
      )}
    </View>
  );
};

export default TransactionHistoryScreen;