import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { getFriendlyErrorMessage } from '../utils/errorMessages';

import {
  BudgetItem,
  BudgetStatus,
  deleteBudget,
  fetchBudgets,
  getBudgetSummary,
  saveBudget,
} from '../services/transactionService';

const currency = (value: string | number) => {
  const parsed = Number(value || 0);
  const amount = Number.isFinite(parsed) ? parsed : 0;
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const compactCurrency = (value: string | number) => {
  const parsed = Number(value || 0);
  const amount = Number.isFinite(parsed) ? parsed : 0;
  return `NPR ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const monthDefault = () => new Date().toISOString().slice(0, 7);

const CATEGORY_OPTIONS = ['Food', 'Transport', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Other'];

const statusColor = (usage: number) => {
  if (usage > 100) return '#EF4444';
  if (usage >= 80) return '#F59E0B';
  return '#16A34A';
};

export default function BudgetPage() {
  const [selectedMonth, setSelectedMonth] = useState(monthDefault());
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [summary, setSummary] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState(CATEGORY_OPTIONS[0]);
  const [newLimit, setNewLimit] = useState('');
  const [newMonth, setNewMonth] = useState(monthDefault());

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, summaryData] = await Promise.all([
        fetchBudgets(selectedMonth),
        getBudgetSummary(selectedMonth),
      ]);
      setBudgets(rows);
      setSummary(summaryData);
    } catch (fetchError) {
      setError(getFriendlyErrorMessage(fetchError, 'Failed to load budgets.'));
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadBudgetData();
    }, [loadBudgetData])
  );

  const exceededAlertMessage = useMemo(() => {
    if (!summary?.categories?.length) return null;
    const exceeded = summary.categories.find((item) => item.exceeded);
    if (!exceeded) return null;
    const exceededBy = Math.max(0, Number(exceeded.current_spent) - Number(exceeded.limit_amount));
    return `Your ${exceeded.category} spending exceeded by ${currency(exceededBy)}.`;
  }, [summary]);

  const onSaveBudget = async () => {
    const parsedLimit = Number(newLimit.replace(/,/g, ''));
    if (!newCategory.trim()) {
      setError('Category is required.');
      return;
    }
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setError('Budget limit should be a positive amount.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveBudget({
        category: newCategory,
        limit_amount: parsedLimit,
        month: newMonth,
      });
      setModalOpen(false);
      setNewLimit('');
      setSelectedMonth(newMonth);
      await loadBudgetData();
    } catch (saveError) {
      setError(getFriendlyErrorMessage(saveError, 'Failed to save budget.'));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteBudget = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      await deleteBudget(id);
      await loadBudgetData();
    } catch (deleteError) {
      setError(getFriendlyErrorMessage(deleteError, 'Failed to delete budget.'));
    } finally {
      setSaving(false);
    }
  };

  const totalPercent = summary?.usage_percent || 0;
  const totalSpent = Number(summary?.total_spent || 0);
  const totalBudget = Number(summary?.total_budget || 0);
  const totalRemaining = Math.max(0, Number(summary?.total_remaining || totalBudget - totalSpent));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <View style={styles.headerAccentBar} />

          <View style={styles.headerTop}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconCircle}>
                <MaterialIcons name="savings" size={18} color="#5B21B6" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Budget Studio</Text>
                <Text style={styles.headerSub}>Plan category limits and stay ahead of overspending.</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.headerMonthPill} activeOpacity={1}>
              <MaterialIcons name="calendar-month" size={14} color="#5B21B6" />
              <Text style={styles.headerMonthText}>{selectedMonth}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerMetaRow}>
            <View style={styles.heroMiniCard}>
              <Text style={styles.heroMiniLabel}>Categories</Text>
              <Text style={styles.heroMiniValue}>{budgets.length}</Text>
            </View>
            <View style={styles.heroMiniCard}>
              <Text style={styles.heroMiniLabel}>Usage</Text>
              <Text style={[styles.heroMiniValue, { color: statusColor(totalPercent) }]}>{totalPercent.toFixed(0)}%</Text>
            </View>
          </View>

          <View style={styles.monthInputWrap}>
            <MaterialIcons name="edit-calendar" size={16} color="#64748B" />
            <TextInput
              style={styles.monthInput}
              value={selectedMonth}
              onChangeText={setSelectedMonth}
              placeholder="YYYY-MM"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading budget summary...</Text>
          </View>
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Total Budget</Text>
                <Text style={styles.kpiValue}>{compactCurrency(summary?.total_budget || 0)}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Spent</Text>
                <Text style={[styles.kpiValue, { color: '#DC2626' }]}>{compactCurrency(summary?.total_spent || 0)}</Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHead}>
                <Text style={styles.summaryTitle}>Monthly Utilization</Text>
                <Text style={[styles.summaryPercent, { color: statusColor(totalPercent) }]}>{totalPercent.toFixed(1)}%</Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(100, totalPercent)}%` as any,
                      backgroundColor: statusColor(totalPercent),
                    },
                  ]}
                />
              </View>

              <View style={styles.summaryMetaRow}>
                <View>
                  <Text style={styles.summaryMetaLabel}>Remaining</Text>
                  <Text style={styles.summaryMetaValue}>{currency(totalRemaining)}</Text>
                </View>
                <View style={styles.summaryMetaRight}>
                  <Text style={styles.summaryMetaLabel}>Days Left</Text>
                  <Text style={styles.summaryMetaValue}>{summary?.days_remaining ?? 0}</Text>
                </View>
              </View>
            </View>

            {!!exceededAlertMessage && (
              <View style={styles.alertCard}>
                <View style={styles.alertIconWrap}>
                  <MaterialIcons name="warning-amber" size={16} color="#B91C1C" />
                </View>
                <Text style={styles.alertText}>{exceededAlertMessage}</Text>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Budgets</Text>
              <Text style={styles.sectionCount}>{budgets.length}</Text>
            </View>

            {!summary?.categories?.length ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="inventory-2" size={20} color="#94A3B8" />
                <Text style={styles.emptyText}>No category budgets set for this month.</Text>
              </View>
            ) : (
              summary.categories.map((item) => {
                const usage = item.usage_percent || 0;
                const color = statusColor(usage);
                return (
                  <View key={String(item.id)} style={styles.categoryCard}>
                    <View style={styles.categoryTop}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.categoryIconWrap, { backgroundColor: `${color}1A` }]}> 
                          <MaterialIcons name={item.icon as any} size={15} color={color} />
                        </View>
                        <View>
                          <Text style={styles.categoryName}>{item.category}</Text>
                          <Text style={styles.categoryAmount}>{currency(item.current_spent)} / {currency(item.limit_amount)}</Text>
                        </View>
                      </View>

                      <View style={styles.categoryRight}>
                        <Text style={[styles.categoryPercent, { color }]}>{usage.toFixed(0)}%</Text>
                        <TouchableOpacity onPress={() => onDeleteBudget(item.id)} disabled={saving}>
                          <MaterialIcons name="delete-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.progressTrackSmall}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, usage)}%` as any,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>

                    <Text style={[styles.categoryStatus, { color }]}>
                      {item.exceeded ? 'Exceeded' : item.near_limit ? 'Near Limit' : 'On Track'}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}

        {!!error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)} activeOpacity={0.9}>
        <MaterialIcons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Budget</Text>

            <Text style={styles.modalLabel}>Category</Text>
            <View style={styles.modalCategoryRow}>
              {CATEGORY_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.modalCategoryChip, newCategory === item && styles.modalCategoryChipActive]}
                  onPress={() => setNewCategory(item)}
                >
                  <Text
                    style={[
                      styles.modalCategoryChipText,
                      newCategory === item && styles.modalCategoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Limit Amount</Text>
            <TextInput
              style={styles.modalInput}
              value={newLimit}
              onChangeText={setNewLimit}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor={Colors.textTertiary}
            />

            <Text style={styles.modalLabel}>Month (YYYY-MM)</Text>
            <TextInput
              style={styles.modalInput}
              value={newMonth}
              onChangeText={setNewMonth}
              placeholder="2026-03"
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={onSaveBudget} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },
  content: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 120,
  },
  headerCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  headerAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#6D28D9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSub: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 11,
    maxWidth: 220,
  },
  headerMonthPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  headerMonthText: {
    color: '#5B21B6',
    fontSize: 11,
    fontWeight: '800',
  },
  headerMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  heroMiniCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  heroMiniLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  heroMiniValue: {
    marginTop: 2,
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '900',
  },
  monthInputWrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minHeight: 42,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthInput: {
    flex: 1,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '600',
  },
  loadingCard: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  kpiLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  kpiValue: {
    marginTop: 3,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressTrackSmall: {
    width: '100%',
    height: 7,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  summaryMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryMetaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryMetaValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  summaryMetaRight: {
    alignItems: 'flex-end',
  },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#5B21B6',
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: '#EDE9FE',
    overflow: 'hidden',
    paddingTop: 3,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
    padding: 12,
    marginBottom: 10,
  },
  categoryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  categoryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  categoryAmount: {
    marginTop: 1,
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  categoryPercent: {
    fontSize: 12,
    fontWeight: '900',
  },
  categoryStatus: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '800',
  },
  errorText: {
    marginTop: 8,
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.white,
    padding: 14,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  modalCategoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    minHeight: 30,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategoryChipActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#EDE9FE',
  },
  modalCategoryChipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  modalCategoryChipTextActive: {
    color: '#5B21B6',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    minHeight: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
    color: Colors.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalSave: {
    flex: 1,
    borderRadius: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
  },
  modalSaveText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
