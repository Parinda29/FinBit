import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../constants/colors';

const BudgetScreen: React.FC = () => {
  const [budget, setBudget] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('');

  const handleSave = () => {
    console.log({ budget, alertThreshold });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.heading}>Monthly Budget</Text>

      <Text style={styles.label}>Set Budget Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="$0.00"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Alert Threshold (%)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 80"
        value={alertThreshold}
        onChangeText={setAlertThreshold}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  heading: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  saveButton: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
});

export default BudgetScreen;