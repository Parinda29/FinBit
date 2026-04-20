import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { createTransaction } from '../services/transactionService';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

const todayYmd = () => new Date().toISOString().slice(0, 10);

const normalizeDateInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Date is invalid. Use format YYYY-MM-DD.');
  }
  return parsed.toISOString();
};

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Bonus', 'Refund', 'Investment', 'Gifts', 'Other'] as const;
const PAYMENT_METHODS = ['Bank', 'Cash', 'Card'] as const;
const INCOME_TAGS = ['Regular', 'One-time', 'Side Project'] as const;

export default function AddIncome() {
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const initialDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : todayYmd();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<(typeof INCOME_CATEGORIES)[number]>('Salary');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>('Bank');
  const [tags, setTags] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [description, setDescription] = useState('');
  const [dateText, setDateText] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const onSaveIncome = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const numericAmount = Number(amount.replace(/,/g, ''));
      const finalCategory = category === 'Other' ? customCategory.trim() || 'Other' : category;
      if (!title.trim()) throw new Error('Title is required.');
      if (!numericAmount || numericAmount <= 0) throw new Error('Amount must be greater than zero.');
      if (!finalCategory.trim()) throw new Error('Category is required.');

      await createTransaction({
        title: title.trim(),
        category: finalCategory,
        description: description.trim(),
        amount: numericAmount,
        type: 'income',
        source: 'manual',
        transaction_date: normalizeDateInput(dateText),
      });

      setMessage('Income saved successfully.');
      setTitle('');
      setAmount('');
      setCategory('Salary');
      setCustomCategory('');
      setPaymentMethod('Bank');
      setTags([]);
      setIsRecurring(false);
      setDescription('');
      setDateText(todayYmd());

      setTimeout(() => {
        router.push('/(tabs)/transactions');
      }, 420);
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, 'Failed to save income.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Modern Hero with Gradient */}
      <View style={styles.heroCard}>
        <View style={styles.heroBlobOne} />
        <View style={styles.heroBlobTwo} />
        <Image source={require('../assets/images/icon.png')} style={styles.heroImage} resizeMode="contain" />

        <View style={styles.heroTopRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Log Income</Text>
            <Text style={styles.heroSubtitle}>Track your money inflow</Text>
          </View>
        </View>
      </View>

      {/* Amount Input Card - Premium style */}
      <View style={styles.amountCard}>
        <View style={styles.amountLabelRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountHint}>{todayYmd()}</Text>
        </View>
        <View style={styles.amountInputRow}>
          <Text style={styles.currencySymbol}>NPR</Text>
          <TextInput
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.amountMainInput}
            placeholderTextColor="#9CA3AF"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      {/* Form Sections */}
      <View style={styles.formCard}>
        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <TextInput
            placeholder="e.g. Salary, Project Payment, Bonus"
            style={styles.input}
            placeholderTextColor="#D1D5DB"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryRow}>
            {INCOME_CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {category === 'Other' && (
            <TextInput
              placeholder="Enter custom category"
              style={styles.input}
              placeholderTextColor="#D1D5DB"
              value={customCategory}
              onChangeText={setCustomCategory}
            />
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Received Via</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.methodChip, paymentMethod === method && styles.methodChipActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.methodText, paymentMethod === method && styles.methodTextActive]}>
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Income Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income Type</Text>
          <View style={styles.tagRow}>
            {INCOME_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, tags.includes(tag) && styles.tagChipActive]}
                onPress={() => toggleTag(tag)}
              >
                <MaterialIcons 
                  name={tags.includes(tag) ? 'check-circle' : 'circle'} 
                  size={14} 
                  color={tags.includes(tag) ? Colors.primary : '#9CA3AF'} 
                />
                <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date & Recurring */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When</Text>
          <View style={styles.dateWrap}>
            <MaterialIcons name="calendar-today" size={16} color={Colors.primary} />
            <TextInput
              placeholder="YYYY-MM-DD"
              style={styles.dateInput}
              placeholderTextColor="#D1D5DB"
              value={dateText}
              onChangeText={setDateText}
            />
            <TouchableOpacity style={styles.todayButton} onPress={() => setDateText(todayYmd())}>
              <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
          </View>

          {/* Recurring toggle */}
          <TouchableOpacity style={styles.recurringOption} onPress={() => setIsRecurring(!isRecurring)}>
            <View style={[styles.checkbox, isRecurring && styles.checkboxActive]}>
              {isRecurring && <MaterialIcons name="check" size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.recurringText}>Expected to recur monthly</Text>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            placeholder="Add optional details (project name, invoice, etc.)"
            style={[styles.input, styles.textArea]}
            multiline
            placeholderTextColor="#D1D5DB"
            value={description}
            onChangeText={setDescription}
          />
        </View>
      </View>

      {/* Status Messages */}
      {message && <Text style={styles.successText}>{message}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={onSaveIncome} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Income</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 120,
    gap: 14,
    marginTop: 12,
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: Colors.primary,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  heroBlobOne: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -40,
    top: -50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroBlobTwo: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    left: -30,
    bottom: -20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroImage: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    width: 70,
    height: 70,
    opacity: 0.85,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  amountCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  amountLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  amountMainInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  formCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 44,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 36,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryChipText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: Colors.primaryDark,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  methodText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  methodTextActive: {
    color: Colors.primaryDark,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 36,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  tagText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: Colors.primaryDark,
  },
  dateWrap: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  dateInput: {
    flex: 1,
    color: '#1F2937',
    fontSize: 14,
  },
  todayButton: {
    borderRadius: 8,
    paddingHorizontal: 10,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  todayText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  recurringOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  recurringText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  successText: {
    marginHorizontal: 16,
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    marginHorizontal: 16,
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    marginHorizontal: 16,
    borderRadius: 14,
    minHeight: 52,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
