import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '../constants/colors';

export default function Transactions() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Transactions</Text>
      <Text>No transactions yet</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F8F8', padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#173C3C', marginBottom: 12 },
});