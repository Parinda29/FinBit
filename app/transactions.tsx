import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import TransactionListItem from '../components/dashboard/TransactionListItem';
import { fetchTransactions, TransactionItem } from '../services/transactionService';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

const formatNpr = (value: number) =>
  `NPR ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const sectionLabelFromDate = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
};

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const loadTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const data = await fetchTransactions({ pageSize: 300 });
      setTransactions(data);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to fetch transactions.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) return false;
      if (!normalizedQuery) return true;
      return (
        transaction.title.toLowerCase().includes(normalizedQuery) ||
        transaction.category.toLowerCase().includes(normalizedQuery) ||
        String(transaction.amount).includes(normalizedQuery)
      );
    });
  }, [transactions, typeFilter, query]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionItem[]> = {};
    filteredTransactions.forEach((tx) => {
      const key = sectionLabelFromDate(tx.transaction_date || tx.created_at);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });

    const priority = ['Today', 'Yesterday'];
    const keys = Object.keys(groups).sort((a, b) => {
      const aIndex = priority.indexOf(a);
      const bIndex = priority.indexOf(b);
      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }
      return a.localeCompare(b);
    });

    return keys.map((label) => ({ label, items: groups[label] }));
  }, [filteredTransactions]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      const amount = Number(tx.amount || 0);
      if (!Number.isFinite(amount)) continue;
      if (tx.type === 'income') income += amount;
      else expense += amount;
    }
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const formatAmount = (amount: string, type: 'income' | 'expense') => {
    const numeric = Number(amount);
    const value = Number.isFinite(numeric) ? numeric : 0;
    const formatted = formatNpr(value);
    return `${type === 'income' ? '+' : '-'}${formatted}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return time.toUpperCase();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} />}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <MaterialIcons name="receipt-long" size={18} color="#6D28D9" />
          </View>
          <View>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.subtitle}>Track your activity</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.filterIconButton} activeOpacity={0.85}>
          <MaterialIcons name="tune" size={18} color="#6D28D9" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.textTertiary}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              typeFilter === filter && styles.filterChipActive,
              typeFilter === filter && filter === 'income' && styles.filterChipIncome,
              typeFilter === filter && filter === 'expense' && styles.filterChipExpense,
            ]}
            onPress={() => setTypeFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                typeFilter === filter && styles.filterChipTextActive,
                typeFilter === filter && filter === 'income' && styles.filterChipTextIncome,
                typeFilter === filter && filter === 'expense' && styles.filterChipTextExpense,
              ]}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCardIncome}>
          <Text style={styles.summaryLabelIncome}>Total Income</Text>
          <Text style={styles.summaryValueIncome}>{formatNpr(summary.income)}</Text>
        </View>
        <View style={styles.summaryCardExpense}>
          <Text style={styles.summaryLabelExpense}>Total Expense</Text>
          <Text style={styles.summaryValueExpense}>{formatNpr(summary.expense)}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      )}

      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !filteredTransactions.length && (
        <View style={styles.emptyCard}>
          <MaterialIcons name="inbox" size={22} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No transactions found for current filters.</Text>
        </View>
      )}

      {groupedTransactions.map((group) => (
        <View key={group.label} style={styles.groupSection}>
          <Text style={styles.groupTitle}>{group.label}</Text>
          <View style={styles.groupCard}>
            {group.items.map((transaction) => (
              <TransactionListItem
                key={String(transaction.id)}
                title={transaction.title}
                category={transaction.category}
                amount={formatAmount(transaction.amount, transaction.type)}
                date={formatDate(transaction.transaction_date || transaction.created_at)}
                type={transaction.type}
                status={transaction.source ? transaction.source.toUpperCase() : 'COMPLETED'}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 130,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30 / 2,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 50,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: {
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  filterChipIncome: {
    borderColor: '#86EFAC',
    backgroundColor: '#DCFCE7',
  },
  filterChipExpense: {
    borderColor: '#FECACA',
    backgroundColor: '#FEE2E2',
  },
  filterChipText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  filterChipTextActive: {
    color: '#6D28D9',
  },
  filterChipTextIncome: {
    color: '#166534',
  },
  filterChipTextExpense: {
    color: '#B91C1C',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  summaryCardIncome: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryCardExpense: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryLabelIncome: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryLabelExpense: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValueIncome: {
    marginTop: 4,
    fontSize: 16,
    color: '#166534',
    fontWeight: '900',
  },
  summaryValueExpense: {
    marginTop: 4,
    fontSize: 16,
    color: '#B91C1C',
    fontWeight: '900',
  },
  loadingWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  groupSection: {
    marginTop: 8,
  },
  groupTitle: {
    marginBottom: 8,
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  groupCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
