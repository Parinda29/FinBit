import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import Colors from '../constants/colors';
import { useRouter } from 'expo-router';

export default function Budget() {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    if (!budgetAmount || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Send data to backend API (replace URL with your API endpoint)
    try {
      const response = await fetch('https://your-backend.com/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgetAmount, startDate, endDate }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Budget saved successfully');
        // Optionally navigate back or reset form
      } else {
        Alert.alert('Error', 'Failed to save budget');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Your Budget</Text>

      <TextInput
        style={styles.input}
        placeholder="Budget Amount"
        keyboardType="numeric"
        value={budgetAmount}
        onChangeText={setBudgetAmount}
      />

      <TextInput
        style={styles.input}
        placeholder="Start Date (YYYY-MM-DD)"
        value={startDate}
        onChangeText={setStartDate}
      />

      <TextInput
        style={styles.input}
        placeholder="End Date (YYYY-MM-DD)"
        value={endDate}
        onChangeText={setEndDate}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F2F8F8' },
  title: { fontSize: 20, fontWeight: '700', color: '#173C3C', marginBottom: 16 },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#D9E8E8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});