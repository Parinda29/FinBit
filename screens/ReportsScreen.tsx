import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Colors from '../constants/colors';
import PieChartCard, { PieChartData } from '../components/PieChartCard';

const ReportsScreen: React.FC = () => {
  const reportData: PieChartData[] = [
    { name: 'Food', amount: 300, color: Colors.primary },
    { name: 'Bills', amount: 200, color: Colors.warning },
    { name: 'Shopping', amount: 150, color: Colors.info },
    { name: 'Entertainment', amount: 100, color: Colors.success },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Reports</Text>
      <PieChartCard title="Spending by Category" data={reportData} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  heading: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 16 },
});

export default ReportsScreen;