import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import CustomButton from '../components/CustomButton';
import { logoutUser } from '../services/authService';

export default function HomePage() {
  const router = useRouter();

  const quickActions = [
    { icon: 'add-circle-outline', label: 'Add Income' },
    { icon: 'remove-circle-outline', label: 'Add Expense' },
    { icon: 'receipt-long', label: 'Receipts' },
    { icon: 'analytics', label: 'Reports' },
  ];

  const recentTransactions = [
    { id: 1, title: 'Groceries', category: 'Food & Essentials', amount: '-$84.30', icon: 'shopping-cart', color: '#F97316' },
    { id: 2, title: 'Salary', category: 'Monthly Income', amount: '+$2,900.00', icon: 'payments', color: '#10B981' },
    { id: 3, title: 'Internet Bill', category: 'Utilities', amount: '-$45.00', icon: 'wifi', color: '#3B82F6' },
  ];

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good Evening</Text>
            <Text style={styles.userName}>Your Finance Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Total Balance</Text>
            <TouchableOpacity style={styles.monthPill}>
              <Text style={styles.monthPillText}>This Month</Text>
              <MaterialIcons name="expand-more" size={16} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>$8,420.25</Text>
          <Text style={styles.balanceTrend}>+4.2% from last month</Text>

          <View style={styles.balanceStatsRow}>
            <View style={styles.balanceStatChip}>
              <MaterialIcons name="arrow-downward" size={14} color={Colors.success} />
              <View>
                <Text style={styles.balanceStatLabel}>Income</Text>
                <Text style={styles.balanceStatValue}>$5,120</Text>
              </View>
            </View>
            <View style={styles.balanceStatChip}>
              <MaterialIcons name="arrow-upward" size={14} color={Colors.error} />
              <View>
                <Text style={styles.balanceStatLabel}>Expenses</Text>
                <Text style={styles.balanceStatValue}>$2,390</Text>
              </View>
            </View>
            <View style={styles.balanceStatChip}>
              <MaterialIcons name="savings" size={14} color={Colors.info} />
              <View>
                <Text style={styles.balanceStatLabel}>Savings</Text>
                <Text style={styles.balanceStatValue}>$2,730</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity>
            <Text style={styles.sectionActionText}>Customize</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.quickCard}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name={action.icon as any} size={20} color={Colors.primaryDark} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Savings Goal</Text>
          <Text style={styles.goalAmount}>$2,730 / $4,000</Text>
        </View>
        <View style={styles.goalCard}>
          <View style={styles.goalProgressTrack}>
            <View style={styles.goalProgressFill} />
          </View>
          <Text style={styles.goalHint}>68% completed. Keep your expense ratio under 45% this month.</Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.sectionActionText}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsCard}>
          {recentTransactions.map((item) => (
            <TouchableOpacity key={item.id} style={styles.transactionRow}>
              <View style={[styles.txIconWrap, { backgroundColor: `${item.color}20` }]}>
                <MaterialIcons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.txTextWrap}>
                <Text style={styles.txTitle}>{item.title}</Text>
                <Text style={styles.txCategory}>{item.category}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: item.amount.startsWith('+') ? Colors.success : Colors.error },
                ]}
              >
                {item.amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomButton
          title="Logout"
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F8F8' },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 34 },

  bgOrbTop: {
    position: 'absolute',
    top: -90,
    right: -60,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(13, 110, 110, 0.10)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -110,
    left: -70,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    color: '#173E3E',
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBE9E9',
  },

  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  balanceTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 2,
  },
  monthPillText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  balanceAmount: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  balanceTrend: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 14,
  },
  balanceStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  balanceStatChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: 8,
  },
  balanceStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  balanceStatValue: {
    fontSize: 13,
    color: Colors.white,
    fontWeight: '700',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionActionText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D8E7E7',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D9EDED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 14,
    color: '#173C3C',
    fontWeight: '700',
  },

  goalAmount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  goalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E8E8',
    padding: 14,
    marginBottom: 16,
  },
  goalProgressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E6F1F1',
    overflow: 'hidden',
    marginBottom: 10,
  },
  goalProgressFill: {
    width: '68%',
    height: '100%',
    backgroundColor: Colors.success,
  },
  goalHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },

  transactionsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E8E8',
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3F3',
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  txTextWrap: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginBottom: 2,
  },
  txCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  logoutButton: {
    backgroundColor: Colors.error,
    marginTop: 4,
  },
});
