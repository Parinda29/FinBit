import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Colors from '../constants/colors';

export default function Receipts() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch categories from backend
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://your-backend.com/api/receipt-categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receipt Categories</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.amountSpent}>${item.totalSpent}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F2F8F8' },
  title: { fontSize: 20, fontWeight: '700', color: '#173C3C', marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E8E8',
    marginBottom: 10,
  },
  categoryName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  amountSpent: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
});