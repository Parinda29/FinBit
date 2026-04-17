import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import Colors from '../constants/colors';
import { fetchTransactions, TransactionItem } from '../services/transactionService';

const PIE_COLORS = ['#7C3AED', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#6366F1'];
const screenWidth = Dimensions.get('window').width;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatNpr = (value: number) =>
  `NPR ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toNumber = (value?: string | number) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

type PeriodFilter = 'thisMonth' | 'last3Months' | 'all';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('thisMonth');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const rows = await fetchTransactions({ pageSize: 700 });
      setTransactions(rows);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to load reports data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  const periodFilteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter((tx) => {
      const date = new Date(tx.transaction_date || tx.created_at || Date.now());
      if (Number.isNaN(date.getTime())) return false;

      if (period === 'thisMonth') {
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }

      const monthsDiff = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
      return monthsDiff >= 0 && monthsDiff < 3;
    });
  }, [transactions, period]);

  const report = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals: Record<string, number> = {};

    periodFilteredTransactions.forEach((tx) => {
      const amount = toNumber(tx.amount);
      if (tx.type === 'income') {
        income += amount;
      } else {
        expense += amount;
        const key = tx.category || 'Other';
        categoryTotals[key] = (categoryTotals[key] || 0) + amount;
      }
    });

    const entries = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], idx) => ({
        name,
        amount,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }));

    const topCategories = entries.length
      ? entries
      : [{ name: 'No Expense', amount: 0, color: '#CBD5E1' }];

    return {
      income,
      expense,
      net: income - expense,
      topCategories,
      totalExpense: expense,
    };
  }, [periodFilteredTransactions]);

  const trend = useMemo(() => {
    const now = new Date();
    const monthsCount = period === 'thisMonth' ? 4 : period === 'last3Months' ? 6 : 8;

    const monthIndexes = Array.from({ length: monthsCount }, (_, i) => {
      const idx = (now.getMonth() - (monthsCount - 1 - i) + 12) % 12;
      return idx;
    });

    const labels = monthIndexes.map((idx) => MONTH_LABELS[idx]);
    const incomeSeries = new Array(monthsCount).fill(0);
    const expenseSeries = new Array(monthsCount).fill(0);

    periodFilteredTransactions.forEach((tx) => {
      const date = new Date(tx.transaction_date || tx.created_at || Date.now());
      if (Number.isNaN(date.getTime())) return;

      const month = date.getMonth();
      const slot = monthIndexes.findIndex((value) => value === month);
      if (slot === -1) return;

      const amount = toNumber(tx.amount);
      if (tx.type === 'income') incomeSeries[slot] += amount;
      if (tx.type === 'expense') expenseSeries[slot] += amount;
    });

    return {
      labels,
      incomeSeries: incomeSeries.map((value) => Math.round(value)),
      expenseSeries: expenseSeries.map((value) => Math.round(value)),
    };
  }, [periodFilteredTransactions, period]);

  const activeCategory = useMemo(() => {
    if (!selectedCategory) return null;
    return report.topCategories.find((item) => item.name === selectedCategory) || null;
  }, [selectedCategory, report.topCategories]);

  const pieData = useMemo(() => {
    if (!report.topCategories.length) {
      return [
        {
          name: 'No Expense',
          population: 1,
          color: '#CBD5E1',
          legendFontColor: '#64748B',
          legendFontSize: 11,
        },
      ];
    }

    return report.topCategories.map((item) => {
      const isActive = !selectedCategory || selectedCategory === item.name;
      return {
        name: item.name,
        population: Math.max(item.amount, 0.0001),
        color: isActive ? item.color : '#E2E8F0',
        legendFontColor: '#334155',
        legendFontSize: 11,
      };
    });
  }, [report.topCategories, selectedCategory]);

  const activeAmount = activeCategory ? activeCategory.amount : report.totalExpense;
  const activePercent = report.totalExpense > 0 ? (activeAmount / report.totalExpense) * 100 : 0;

  const insights = useMemo(() => {
    const txCount = periodFilteredTransactions.length;
    const avgPerTx = txCount > 0 ? (report.income + report.expense) / txCount : 0;
    const savingsRate = report.income > 0 ? (report.net / report.income) * 100 : 0;
    const expenseRatio = report.income > 0 ? (report.expense / report.income) * 100 : 0;
    const topCategory = report.topCategories[0] || null;

    return {
      txCount,
      avgPerTx,
      savingsRate,
      expenseRatio,
      topCategory,
    };
  }, [periodFilteredTransactions, report]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadReports(true)} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerIconWrap}>
          <MaterialIcons name="analytics" size={18} color="#6D28D9" />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Simple analytics for your income and expenses.</Text>
        </View>
      </View>

      <View style={styles.periodRow}>
        {([
          ['thisMonth', 'This Month'],
          ['last3Months', 'Last 3M'],
          ['all', 'All'],
        ] as const).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.periodChip, period === value && styles.periodChipActive]}
            onPress={() => setPeriod(value)}
          >
            <Text style={[styles.periodChipText, period === value && styles.periodChipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCardIncome}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryValueIncome}>{formatNpr(report.income)}</Text>
        </View>

        <View style={styles.summaryCardExpense}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={styles.summaryValueExpense}>{formatNpr(report.expense)}</Text>
        </View>
      </View>

      <View style={styles.netCard}>
        <Text style={styles.netLabel}>Net Balance</Text>
        <Text style={[styles.netValue, { color: report.net >= 0 ? '#16A34A' : '#DC2626' }]}>{formatNpr(report.net)}</Text>
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {!loading && (
        <>
          <View style={styles.metricsStrip}>
            <View style={styles.metricsStripCard}>
              <Text style={styles.metricsStripLabel}>Transactions</Text>
              <Text style={styles.metricsStripValue}>{insights.txCount}</Text>
            </View>
            <View style={styles.metricsStripCard}>
              <Text style={styles.metricsStripLabel}>Savings Rate</Text>
              <Text
                style={[
                  styles.metricsStripValue,
                  { color: insights.savingsRate >= 0 ? '#16A34A' : '#DC2626' },
                ]}
              >
                {`${insights.savingsRate.toFixed(1)}%`}
              </Text>
            </View>
          </View>

          <View style={styles.healthCard}>
            <View style={styles.healthHeader}>
              <Text style={styles.healthTitle}>Spending Health</Text>
              <Text style={[styles.healthRate, { color: insights.savingsRate >= 0 ? '#16A34A' : '#DC2626' }]}>
                {`${insights.savingsRate.toFixed(1)}%`}
              </Text>
            </View>

            <View style={styles.healthTrack}>
              <View
                style={[
                  styles.healthFill,
                  {
                    width: `${Math.min(100, Math.max(0, insights.expenseRatio))}%` as any,
                    backgroundColor: insights.expenseRatio <= 70 ? '#16A34A' : insights.expenseRatio <= 100 ? '#F59E0B' : '#DC2626',
                  },
                ]}
              />
            </View>

            <View style={styles.healthMetaRow}>
              <Text style={styles.healthMetaText}>Expense / Income</Text>
              <Text style={styles.healthMetaText}>{`${insights.expenseRatio.toFixed(1)}%`}</Text>
            </View>
          </View>

          {!!insights.topCategory && (
            <View style={styles.topCategoryCard}>
              <View style={[styles.topCategoryDot, { backgroundColor: insights.topCategory.color }]} />
              <View style={styles.topCategoryTextWrap}>
                <Text style={styles.topCategoryLabel}>Top Expense Category</Text>
                <Text style={styles.topCategoryName}>{insights.topCategory.name}</Text>
              </View>
              <Text style={styles.topCategoryAmount}>{formatNpr(insights.topCategory.amount)}</Text>
            </View>
          )}

          <View style={styles.lineCard}>
            <View style={styles.pieHeader}>
              <Text style={styles.pieTitle}>Income vs Expense Trend</Text>
            </View>

            <LineChart
              data={{
                labels: trend.labels,
                datasets: [
                  {
                    data: trend.incomeSeries,
                    color: () => '#16A34A',
                    strokeWidth: 3,
                  },
                  {
                    data: trend.expenseSeries,
                    color: () => '#DC2626',
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth - 56}
              height={220}
              yAxisInterval={1}
              withVerticalLines={false}
              withOuterLines={false}
              withInnerLines
              fromZero
              bezier
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(15,23,42,${opacity})`,
                labelColor: (opacity = 1) => `rgba(100,116,139,${opacity})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#FFFFFF',
                },
                propsForBackgroundLines: {
                  stroke: 'rgba(148,163,184,0.2)',
                  strokeDasharray: '0',
                },
              }}
              style={styles.lineChart}
            />

            <View style={styles.lineLegendRow}>
              <View style={styles.lineLegendItem}>
                <View style={[styles.lineLegendDot, { backgroundColor: '#16A34A' }]} />
                <Text style={styles.lineLegendText}>Income</Text>
              </View>
              <View style={styles.lineLegendItem}>
                <View style={[styles.lineLegendDot, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.lineLegendText}>Expense</Text>
              </View>
            </View>
          </View>

          <View style={styles.pieCard}>
            <View style={styles.pieHeader}>
              <Text style={styles.pieTitle}>Expense Breakdown</Text>
              {!!selectedCategory && (
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.pieWrap}>
              <PieChart
                data={pieData}
                width={290}
                height={210}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="16"
                absolute={false}
                hasLegend={false}
                chartConfig={{
                  color: (opacity = 1) => `rgba(15,23,42,${opacity})`,
                  labelColor: () => Colors.textPrimary,
                }}
              />
              <View style={styles.pieCenterBadge}>
                <Text style={styles.pieCenterLabel}>{selectedCategory || 'Total'}</Text>
                <Text style={styles.pieCenterValue}>{formatNpr(activeAmount)}</Text>
                <Text style={styles.pieCenterPercent}>{`${activePercent.toFixed(1)}%`}</Text>
              </View>
            </View>

            <View style={styles.legendList}>
              {report.topCategories.map((item) => {
                const selected = selectedCategory === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    style={[styles.legendRow, selected && styles.legendRowActive]}
                    onPress={() => setSelectedCategory((prev) => (prev === item.name ? null : item.name))}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendName}>{item.name}</Text>
                    <Text style={styles.legendAmount}>{formatNpr(item.amount)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Quick Insights</Text>
            <Text style={styles.insightItem}>{`1. Net balance is ${formatNpr(report.net)} for this period.`}</Text>
            <Text style={styles.insightItem}>{`2. You spent ${formatNpr(report.expense)} and earned ${formatNpr(report.income)}.`}</Text>
            <Text style={styles.insightItem}>{`3. Savings rate is ${insights.savingsRate.toFixed(1)}%.`}</Text>
          </View>
        </>
      )}
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
    paddingBottom: 120,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 12,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  periodChip: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  periodChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  periodChipTextActive: {
    color: '#6D28D9',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  summaryCardIncome: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    padding: 10,
  },
  summaryCardExpense: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 10,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryValueIncome: {
    marginTop: 3,
    color: '#166534',
    fontSize: 15,
    fontWeight: '900',
  },
  summaryValueExpense: {
    marginTop: 3,
    color: '#B91C1C',
    fontSize: 15,
    fontWeight: '900',
  },
  netCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    minHeight: 46,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  netValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  metricsStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metricsStripCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  metricsStripLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  metricsStripValue: {
    marginTop: 3,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  healthCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 10,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  healthTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  healthRate: {
    fontSize: 13,
    fontWeight: '900',
  },
  healthTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 999,
  },
  healthMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  healthMetaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingWrap: {
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
  pieCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginTop: 10,
  },
  lineCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  lineChart: {
    borderRadius: 12,
    marginTop: 2,
  },
  lineLegendRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineLegendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  lineLegendText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  pieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pieTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  clearText: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '700',
  },
  pieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieCenterBadge: {
    position: 'absolute',
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  pieCenterValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  pieCenterPercent: {
    marginTop: 2,
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '800',
  },
  legendList: {
    marginTop: 8,
    gap: 6,
  },
  legendRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRowActive: {
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  legendAmount: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  topCategoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minHeight: 52,
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  topCategoryTextWrap: {
    flex: 1,
  },
  topCategoryLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  topCategoryName: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  topCategoryAmount: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '900',
  },
  insightsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginTop: 10,
  },
  insightsTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  insightItem: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
    fontWeight: '600',
  },
});
