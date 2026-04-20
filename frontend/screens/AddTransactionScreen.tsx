import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';
import CustomButton from '../components/CustomButton';
import { createTransaction } from '../services/transactionService';

const AddTransactionScreen: React.FC = () => {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !amount || !category) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const resp = await createTransaction({
        title,
        amount: parseFloat(amount),
        category,
        type,
      });
      if (resp && resp.id) {
        Alert.alert('Success', 'Transaction saved');
        router.back();
      } else {
        Alert.alert('Error', 'Failed to save');
      }
    } catch (e) {
      console.error('Save transaction error', e);
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>

      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={{ marginTop: 12, marginBottom: 4 }}>Category</Text>
      <TextInput
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <Text style={{ marginTop: 12, marginBottom: 4 }}>Type</Text>
      <Picker
        selectedValue={type}
        onValueChange={v => setType(v)}
        style={styles.picker}
      >
        <Picker.Item label="Income" value="income" />
        <Picker.Item label="Expense" value="expense" />
      </Picker>

      <CustomButton title="Save Transaction" onPress={handleSave} style={{ marginTop: 24 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 20 },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: Colors.textPrimary,
  },
  picker: { height: 50, borderWidth: 1, borderColor: Colors.mediumGray, borderRadius: 10 },
});

export default AddTransactionScreen;