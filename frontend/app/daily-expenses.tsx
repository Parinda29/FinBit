import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { fetchTransactions, TransactionItem } from '../services/transactionService';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

const formatNpr = (value: number) =>
  `NPR ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const parseAmount = (amount: string | number) => {
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric : 0;
};

const toLocalDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getDateTime = (item: TransactionItem) => {
  const source = item.transaction_date || item.created_at;
  if (!source) return null;
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function DailyExpenses() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const loadTransactions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const data = await fetchTransactions({ type: 'expense', pageSize: 300 });
      setTransactions(data);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to fetch daily expenses.'));
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

  const todayKey = toLocalDateKey(new Date());

  const todayExpenses = useMemo(() => {
    return transactions
      .filter((item) => {
        const date = getDateTime(item);
        if (!date) return false;
        return toLocalDateKey(date) === todayKey;
      })
      .sort((a, b) => {
        const aDate = getDateTime(a);
        const bDate = getDateTime(b);
        return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      });
  }, [transactions, todayKey]);

  const totals = useMemo(() => {
    const total = todayExpenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
    return {
      total,
      count: todayExpenses.length,
      largest: todayExpenses.reduce((max, item) => Math.max(max, parseAmount(item.amount)), 0),
    };
  }, [todayExpenses]);

  const formatTime = (item: TransactionItem) => {
    const date = getDateTime(item);
    if (!date) return 'Unknown time';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(true)} />}
    >
      <Text style={styles.title}>Daily Expenses</Text>
      <Text style={styles.subtitle}>Track what you spent today, with time-level detail.</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Spent Today</Text>
          <Text style={styles.statValue}>{formatNpr(totals.total)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Transactions</Text>
          <Text style={styles.statValue}>{totals.count}</Text>
        </View>
      </View>

      <View style={styles.highlightCard}>
        <MaterialIcons name="local-fire-department" size={18} color="#B45309" />
        <Text style={styles.highlightText}>Largest single expense: {formatNpr(totals.largest)}</Text>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading today&apos;s expenses...</Text>
        </View>
      )}

      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {!loading && !todayExpenses.length && (
        <Text style={styles.emptyText}>No expenses recorded today yet.</Text>
      )}

      {todayExpenses.map((item) => (
        <TouchableOpacity key={String(item.id)} style={styles.itemCard} activeOpacity={0.85}>
          <View style={styles.itemLeft}>
            <View style={styles.iconWrap}>
              <MaterialIcons name="receipt-long" size={14} color={Colors.primaryDark} />
            </View>
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemMeta}>
                {item.category} • {formatTime(item)}
              </Text>
            </View>
          </View>

          <Text style={styles.itemAmount}>-{formatNpr(parseAmount(item.amount))}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDF5F3',
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    backgroundColor: Colors.white,
    padding: 12,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    marginTop: 4,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  highlightCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    backgroundColor: '#FFFBEB',
    minHeight: 42,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  highlightText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    backgroundColor: Colors.white,
    minHeight: 58,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  itemAmount: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '800',
  },
});