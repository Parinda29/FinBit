import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import BalanceCard from '../components/BalanceCard';
import QuickActionButton from '../components/QuickActionButton';
import TransactionCard, { TransactionCardProps } from '../components/TransactionCard';
import NotificationCard, { NotificationCardProps } from '../components/NotificationCard';
import PieChartCard, { PieChartData } from '../components/PieChartCard';
import Colors from '../constants/colors';

const HomeScreen: React.FC = () => {
  const balance = 2540.75;
  const income = 3200.5;
  const expenses = 659.75;

  //  Explicit types
  const transactions: TransactionCardProps[] = [
    { title: 'Salary', category: 'Income', amount: 2500, type: 'income' },
    { title: 'Groceries', category: 'Food', amount: 150, type: 'expense' },
    { title: 'Freelance', category: 'Income', amount: 700, type: 'income' },
    { title: 'Utilities', category: 'Bills', amount: 100, type: 'expense' },
  ];

  const notifications: NotificationCardProps[] = [
    { message: 'Transaction successful', type: 'success' },
    { message: 'Low balance warning', type: 'warning' },
    { message: 'Password changed successfully', type: 'info' },
    { message: 'Failed transaction', type: 'error' },
  ];

  const categoryData: PieChartData[] = [
    { name: 'Food', amount: 300, color: Colors.primary },
    { name: 'Bills', amount: 200, color: Colors.warning },
    { name: 'Shopping', amount: 150, color: Colors.info },
    { name: 'Entertainment', amount: 100, color: Colors.success },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <BalanceCard total={balance} income={income} expenses={expenses} />

      <View style={styles.quickActionsContainer}>
        <QuickActionButton title="Add Income" onPress={() => {}} color={Colors.success} />
        <QuickActionButton title="Add Expense" onPress={() => {}} color={Colors.error} />
      </View>

      <PieChartCard data={categoryData} title="Spending by Category" />

      <Text style={styles.sectionTitle}>Notifications</Text>
      {notifications.map((notif, index) => (
        <NotificationCard key={index} message={notif.message} type={notif.type} />
      ))}

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {transactions.map((txn, index) => (
        <TransactionCard
          key={index}
          title={txn.title}
          category={txn.category}
          amount={txn.amount}
          type={txn.type}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    marginTop: 16,
  },
});

export default HomeScreen;