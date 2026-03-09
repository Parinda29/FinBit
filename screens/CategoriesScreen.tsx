import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Colors from '../constants/colors';
import PieChartCard from '../components/PieChartCard';
import CategoryCard from '../components/CategoryCard';
import CustomButton from '../components/CustomButton';

interface Category {
  id: number;
  name: string;
  spent: number;
  budget: number;
  color: string;
}

const CategoryScreen: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Food', spent: 250, budget: 400, color: Colors.primary },
    { id: 2, name: 'Bills', spent: 150, budget: 300, color: Colors.warning },
    { id: 3, name: 'Shopping', spent: 120, budget: 200, color: Colors.info },
    { id: 4, name: 'Entertainment', spent: 80, budget: 150, color: Colors.success },
  ]);

  // Data for PieChartCard
  const pieData = categories.map(cat => ({
    name: cat.name,
    amount: cat.spent,
    color: cat.color,
  }));

  const handleEditCategory = (cat: Category) => {
    Alert.alert('Edit Category', `Edit budget/color for ${cat.name}`);
  };

  const handleAddCategory = () => {
    Alert.alert('Add Category', 'Open modal to add new category');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.screenTitle}>Categories & Budgets</Text>

      {/* Pie Chart for Spending */}
      <PieChartCard data={pieData} title="Spending by Category" />

      {/* Category List */}
      <Text style={styles.sectionTitle}>Your Categories</Text>
      <View style={styles.categoryList}>
        {categories.map(cat => (
          <CategoryCard
            key={cat.id}
            name={cat.name}
            spent={cat.spent}
            budget={cat.budget}
            color={cat.color}
            onEdit={() => handleEditCategory(cat)}
          />
        ))}
      </View>

      {/* Add Category Button */}
      <View style={styles.addButton}>
        <CustomButton title="Add Category" onPress={handleAddCategory} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12, marginTop: 16 },
  categoryList: { marginBottom: 20 },
  addButton: { marginTop: 10 },
});

export default CategoryScreen;