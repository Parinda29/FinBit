import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';

export default function HomePage() {
  const router = useRouter();

  const sidebarItems = [
    { label: 'Quick Check', route: '/quickcheck' },
    { label: 'Transactions', route: '/transactions' },
    { label: 'Budget', route: '/budget' },
    { label: 'Receipts', route: '/receipts' },
  ];

  const quickActions = [
    { icon: "add-circle-outline", label: "Add Income", route: "/add-income" },
    { icon: "remove-circle-outline", label: "Add Expense", route: "/add-expense" },
    { icon: "receipt-long", label: "Receipts", route: "/manage-categories" },
    { icon: "analytics", label: "Reports", route: "/reports" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Good Evening</Text>
          <Text style={styles.userName}>Your Finance Dashboard</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push('/notifications' as any)}
            style={styles.iconButton}
          >
            <MaterialIcons name="notifications-none" size={24} color={Colors.primaryDark} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={styles.iconButton}
          >
            <MaterialIcons name="person-outline" size={24} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* Sidebar */}
        <View style={styles.sidebar}>
          {sidebarItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.sidebarItem}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.sidebarText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Middle Section */}
        <ScrollView style={styles.middleContent} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Total Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>Total Balance</Text>
            <Text style={styles.balanceAmount}>$0.00</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.quickIconWrap}>
                  <MaterialIcons name={action.icon as any} size={20} color={Colors.primaryDark} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scanner */}
          <View style={styles.scannerCard}>
            <Text style={styles.scannerText}>Scanner</Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F8F8' },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  greeting: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600'
  },

  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#173E3E'
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBE9E9',
  },

  mainContent: {
    flex: 1,
    flexDirection: 'row'
  },

  sidebar: {
    width: 120,
    backgroundColor: '#fff',
    paddingVertical: 20
  },

  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 10
  },

  sidebarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#173C3C'
  },

  middleContent: {
    flex: 1,
    padding: 18
  },

  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16
  },

  balanceTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600'
  },

  balanceAmount: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16
  },

  quickCard: {
    width: '48.5%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D8E7E7'
  },

  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D9EDED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },

  quickLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#173C3C'
  },

  scannerCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center'
  },

  scannerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#173C3C'
  },
});