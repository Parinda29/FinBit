import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import Colors from '../../constants/colors';
import QuickActionCard from './QuickActionCard';
import TransactionListItem from './TransactionListItem';
import { getFriendlyErrorMessage } from '../../utils/errorMessages';
import {
  getHomeDashboardData,
  getBudgetSummary,
  getNotifications,
  BudgetStatus,
  TransactionItem,
} from '../../services/transactionService';
import { fetchUserProfile } from '../../services/authService';

type QuickAction = {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
};

type WeeklyPoint = {
  label: string;
  income: number;
  expense: number;
};

const quickActions: QuickAction[] = [
  { label: 'Add Income', icon: 'add-circle-outline', route: '/add-income' },
  { label: 'Add Expense', icon: 'remove-circle-outline', route: '/add-expense' },
  { label: 'Scan', icon: 'document-scanner', route: '/receipt-scanner' },
  { label: 'SMS Scanner', icon: 'sms', route: '/sms-listener' },
  { label: 'Receipts', icon: 'receipt-long', route: '/receipts' },
  { label: 'Reports', icon: 'insights', route: '/(tabs)/reports' },
];

const PIE_COLORS = ['#4F46E5', '#0EA5E9', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6'];

const currency = (amount: number | string) => {
  const parsed = Number(amount || 0);
  const value = Number.isFinite(parsed) ? parsed : 0;
  return `NPR ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const shortCurrency = (amount: number) => {
  if (Math.abs(amount) >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (Math.abs(amount) >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toFixed(0);
};

const parseAmount = (amount: string | number): number => {
  const numeric = Number(amount);
  return Number.isFinite(numeric) ? numeric : 0;
};

const displayDate = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const now = new Date();
  const sameDay =
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate();

  if (sameDay) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const mondayIndex = (day: number) => (day + 6) % 7;

export default function HomeDashboard() {
  const router = useRouter();
  const chartWidth = Math.max(160, Dimensions.get('window').width * 0.36);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [monthlyNet, setMonthlyNet] = useState(0);
  const [budgetSummary, setBudgetSummary] = useState<BudgetStatus | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [userName, setUserName] = useState('User');

  const greetingPrefix = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, budgetData, notificationData] = await Promise.all([
        getHomeDashboardData(),
        getBudgetSummary().catch(() => null),
        getNotifications().catch(() => ({ unread_count: 0, notifications: [] })),
      ]);

      setTransactions(data.transactions);
      setMonthlyIncome(data.summary.total_income);
      setMonthlyExpense(data.summary.total_expense);
      setMonthlyNet(data.summary.net_balance);
      setBudgetSummary(budgetData);
      setNotificationCount(notificationData.unread_count || 0);

      const profile = await fetchUserProfile().catch(() => null);
      const profileName =
        profile?.user?.name ||
        profile?.name ||
        profile?.user?.username ||
        profile?.username ||
        null;
      if (typeof profileName === 'string' && profileName.trim()) {
        setUserName(profileName.trim());
      }
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to load dashboard data.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const weeklyData = useMemo<WeeklyPoint[]>(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start = new Date(today);
    start.setDate(today.getDate() - mondayIndex(today.getDay()));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const base = labels.map((label) => ({ label, income: 0, expense: 0 }));

    transactions.forEach((transaction) => {
      const dateValue = transaction.transaction_date || transaction.created_at;
      if (!dateValue) return;
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) return;
      if (date < start || date >= end) return;

      const idx = mondayIndex(date.getDay());
      const amount = parseAmount(transaction.amount);
      if (transaction.type === 'income') base[idx].income += amount;
      if (transaction.type === 'expense') base[idx].expense += amount;
    });

    return base;
  }, [transactions]);

  const weeklyMax = useMemo(() => {
    return weeklyData.reduce((max, day) => Math.max(max, day.income, day.expense), 0) || 1;
  }, [weeklyData]);

  const chartSource = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthExpenses = transactions.filter((transaction) => {
      if (transaction.type !== 'expense') return false;
      const dateString = transaction.transaction_date || transaction.created_at;
      if (!dateString) return false;
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return false;
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const byCategory = monthExpenses.reduce<Record<string, number>>((acc, transaction) => {
      const key = transaction.category || 'Other';
      acc[key] = (acc[key] || 0) + parseAmount(transaction.amount);
      return acc;
    }, {});

    const entries = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    if (!entries.length) {
      return [
        {
          name: 'No Data',
          amount: 1,
          rawAmount: 0,
          color: '#E2E8F0',
        },
      ];
    }

    return entries.map(([name, amount], index) => ({
      name,
      amount,
      rawAmount: amount,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));
  }, [transactions]);

  const chartTotal = useMemo(
    () => chartSource.reduce((sum, item) => sum + item.rawAmount, 0),
    [chartSource]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 3), [transactions]);

  const balance = monthlyIncome - monthlyExpense;
  const budgetUsage = Math.min(100, Math.max(0, Number(budgetSummary?.usage_percent || 0)));
  const budgetSpent = parseAmount(budgetSummary?.total_spent || monthlyExpense);
  const budgetTotal = parseAmount(budgetSummary?.total_budget || monthlyIncome || 1);
  const budgetDisplay = budgetTotal > 0 ? Math.min(100, (budgetSpent / budgetTotal) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
              {`${greetingPrefix}, ${userName}`}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
              Here&apos;s your financial overview
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="notifications" size={19} color={Colors.textPrimary} />
              {notificationCount > 0 && <View style={styles.notificationDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/profile')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="person" size={19} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceGlowOne} />
          <View style={styles.balanceGlowTwo} />
          <View style={styles.balanceContent}>
            <View style={styles.balanceTrendBadge}>
              <MaterialIcons name="trending-up" size={14} color="#F3E8FF" />
              <Text style={styles.balanceTrendBadgeText}>{`${monthlyNet >= 0 ? '+' : ''}${shortCurrency(monthlyNet)}`}</Text>
            </View>

            <Text style={styles.balanceCaption}>Total Balance</Text>
            <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
              {currency(balance)}
            </Text>

            <View style={styles.balanceDivider} />

            <View style={styles.balanceStatsRow}>
              <View style={styles.balanceStatItem}>
                <Text style={styles.balanceStatLabel}>Income</Text>
                <Text style={styles.balanceIncomeValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {currency(monthlyIncome)}
                </Text>
              </View>
              <View style={styles.balanceStatDivider} />
              <View style={[styles.balanceStatItem, styles.balanceExpenseStatItem]}>
                <Text style={styles.balanceStatLabel}>Expense</Text>
                <Text style={styles.balanceExpenseValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {currency(monthlyExpense)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Syncing latest transactions...</Text>
          </View>
        )}

        {!!error && !loading && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.quickActionsRow}>
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.label}
              label={action.label}
              icon={action.icon}
              onPress={() => router.push(action.route as never)}
            />
          ))}
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightIconWrap}>
            <MaterialIcons name="emoji-objects" size={17} color="#6D28D9" />
          </View>
          <Text style={styles.insightText}>
            You spent <Text style={styles.insightAccent}>{budgetUsage.toFixed(0)}% used</Text> this month.
            Keep your food and transport categories in check.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Cash Flow</Text>
            <View style={styles.legendWrap}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
          </View>

          <View style={styles.weekChartArea}>
            {weeklyData.map((day) => {
              const incomeHeight = Math.max(6, (day.income / weeklyMax) * 74);
              const expenseHeight = Math.max(6, (day.expense / weeklyMax) * 74);
              return (
                <View key={day.label} style={styles.weekBarCol}>
                  <View style={styles.weekBarPair}>
                    <View style={[styles.weekBar, { height: incomeHeight, backgroundColor: '#16A34A' }]} />
                    <View style={[styles.weekBar, { height: expenseHeight, backgroundColor: '#DC2626' }]} />
                  </View>
                  <Text style={styles.weekLabel}>{day.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/budget')}
          activeOpacity={0.9}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Budget</Text>
            <Text style={styles.budgetUsedText}>{`${budgetDisplay.toFixed(0)}% Used`}</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${budgetDisplay}%` as any }]} />
          </View>

          <View style={styles.budgetMetaRow}>
            <Text style={styles.budgetMetaText}>{`Spent: ${currency(budgetSpent)}`}</Text>
            <Text style={styles.budgetMetaText}>{`Total: ${currency(budgetTotal)}`}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Category Spending</Text>
          <View style={styles.categoryRow}>
            <View style={styles.pieWrap}>
              <PieChart
                data={chartSource}
                width={chartWidth}
                height={160}
                accessor="amount"
                backgroundColor="transparent"
                hasLegend={false}
                paddingLeft="16"
                chartConfig={{
                  color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`,
                  labelColor: () => Colors.textPrimary,
                }}
                center={[20, 0]}
                absolute={false}
              />
              <View style={styles.chartCenterBadge}>
                <Text style={styles.chartCenterLabel}>Total</Text>
                <Text style={styles.chartCenterAmount}>{shortCurrency(chartTotal)}</Text>
              </View>
            </View>

            <View style={styles.categoryList}>
              {chartSource.map((item) => (
                <View key={item.name} style={styles.categoryItem}>
                  <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                  <Text style={styles.categoryName}>{item.name}</Text>
                  <Text style={styles.categoryAmount}>{currency(item.rawAmount)}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {!recentTransactions.length && !loading && (
          <Text style={styles.emptyText}>No transactions yet. Add one to get started.</Text>
        )}

        {recentTransactions.map((transaction) => (
          <TransactionListItem
            key={String(transaction.id)}
            title={transaction.title}
            category={transaction.category}
            amount={`${transaction.type === 'income' ? '+' : '-'}${currency(parseAmount(transaction.amount))}`}
            date={displayDate(transaction.transaction_date || transaction.created_at)}
            type={transaction.type}
            status={transaction.source ? transaction.source.toUpperCase() : 'COMPLETED'}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 130,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  greeting: {
    fontSize: 40 / 2,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 28 / 2,
    color: '#475569',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    right: 10,
    top: 9,
  },
  balanceCard: {
    borderRadius: 24,
    backgroundColor: '#5B21B6',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#4C1D95',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceContent: {
    zIndex: 2,
  },
  balanceGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(167,139,250,0.30)',
    right: -40,
    top: -35,
    zIndex: 0,
  },
  balanceGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(196,181,253,0.26)',
    right: 40,
    top: 8,
    zIndex: 0,
  },
  balanceTrendBadge: {
    alignSelf: 'flex-end',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceTrendBadgeText: {
    color: '#F5F3FF',
    fontSize: 12,
    fontWeight: '800',
  },
  balanceCaption: {
    fontSize: 15,
    color: '#E9D5FF',
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 31,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(76,29,149,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  balanceDivider: {
    marginTop: 14,
    marginBottom: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  balanceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceStatItem: {
    flex: 1,
  },
  balanceExpenseStatItem: {
    paddingLeft: 10,
  },
  balanceStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  balanceStatLabel: {
    color: '#E9D5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceIncomeValue: {
    marginTop: 3,
    color: '#34D399',
    fontSize: 31 / 2,
    fontWeight: '900',
  },
  balanceExpenseValue: {
    marginTop: 3,
    color: '#F5F3FF',
    fontSize: 31 / 2,
    fontWeight: '900',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  insightAccent: {
    color: '#6D28D9',
    fontWeight: '800',
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 33 / 2,
    fontWeight: '800',
    color: '#111827',
  },
  legendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },
  weekChartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  weekBarCol: {
    width: '13.5%',
    alignItems: 'center',
  },
  weekBarPair: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  weekBar: {
    width: 7,
    borderRadius: 5,
  },
  weekLabel: {
    marginTop: 7,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  budgetUsedText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 9,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#334155',
  },
  budgetMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetMetaText: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 8,
    alignItems: 'center',
  },
  pieWrap: {
    width: '46%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chartCenterBadge: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  chartCenterAmount: {
    marginTop: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
  },
  categoryList: {
    width: '54%',
    paddingLeft: 6,
    gap: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 34 / 2,
    color: '#111827',
    fontWeight: '800',
  },
  sectionLink: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
});
