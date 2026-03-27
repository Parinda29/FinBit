import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';


const STORAGE_KEY = 'finbit_custom_categories';
const SUGGESTED = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment'];

export default function ManageCategories() {
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setCategories(parsed.filter((item) => typeof item === 'string'));
        }
      } catch {
        // Ignore storage read errors and continue with empty list.
      }
    };
    load();
  }, []);

  const persist = async (next: string[]) => {
    setCategories(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write errors.
    }
  };

  const addCategory = async () => {
    const value = category.trim();
    if (!value) return;
    if (categories.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setCategory('');
      return;
    }
    await persist([value, ...categories]);
    setCategory('');
  };

  const addSuggested = async (value: string) => {
    if (categories.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    await persist([value, ...categories]);
  };

  const deleteCategory = async (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    await persist(updated);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Manage Categories</Text>
      <Text style={styles.subtitle}>Create and organize custom categories for faster transaction entry.</Text>

      <View style={styles.inputCard}>
        <Text style={styles.label}>New Category</Text>
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Enter category name"
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholderTextColor={Colors.textTertiary}
          />
          <TouchableOpacity style={styles.addButton} onPress={addCategory}>
            <MaterialIcons name="add" size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.suggestedCard}>
        <Text style={styles.label}>Quick Add</Text>
        <View style={styles.suggestedRow}>
          {SUGGESTED.map((item) => (
            <TouchableOpacity key={item} style={styles.suggestedChip} onPress={() => addSuggested(item)}>
              <Text style={styles.suggestedText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.listTitle}>Your Categories ({categories.length})</Text>
        {!categories.length ? (
          <Text style={styles.emptyText}>No custom categories yet. Add one above.</Text>
        ) : (
          categories.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.dot} />
                <Text style={styles.categoryText}>{item}</Text>
              </View>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteCategory(index)}>
                <MaterialIcons name="delete-outline" size={15} color={Colors.error} />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F5',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  inputCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 10,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 10,
  },
  suggestedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    minHeight: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D5E8E8',
    backgroundColor: Colors.white,
    padding: 12,
  },
  listTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  categoryText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteText: {
    color: Colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
});
