import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '../constants/colors';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryCardProps {
  name: string;
  spent: number;
  budget: number;
  color: string;
  onEdit?: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, spent, budget, color, onEdit }) => {
  const percent = Math.min((spent / budget) * 100, 100);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.budget}>
          ${spent.toFixed(2)} / ${budget.toFixed(2)}
        </Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: color }]} />
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <MaterialIcons name="edit" size={22} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    marginBottom: 12,
    borderLeftWidth: 6,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  budget: { fontSize: 14, color: Colors.textSecondary, marginBottom: 6 },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3 },
  editButton: { justifyContent: 'center', alignItems: 'center', paddingLeft: 12 },
});

export default CategoryCard;