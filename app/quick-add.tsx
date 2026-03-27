import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';

const todayYmd = () => new Date().toISOString().slice(0, 10);

export default function QuickAddScreen() {
  const router = useRouter();
  const selectedDate = todayYmd();

  const pushExpense = () => {
    router.push(`/add-expense?date=${selectedDate}`);
  };

  const pushIncome = () => {
    router.push(`/add-income?date=${selectedDate}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroShapeA} />
        <View style={styles.heroShapeB} />
        <Image source={require('../assets/images/icon.png')} style={styles.heroImage} resizeMode="contain" />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Transaction</Text>
        </View>

        <Text style={styles.subtitle}>Choose flow and log your money movement in seconds.</Text>

        <View style={styles.dateCard}>
          <MaterialIcons name="event" size={18} color="#0F172A" />
          <View style={styles.dateTextWrap}>
            <Text style={styles.dateLabel}>Selected Date</Text>
            <Text style={styles.dateValue}>{selectedDate}</Text>
          </View>
          <View style={styles.todayPill}>
            <Text style={styles.todayPillText}>Auto</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.expenseCard} activeOpacity={0.9} onPress={pushExpense}>
          <View style={styles.iconBubbleExpense}>
            <MaterialIcons name="south-west" size={20} color="#B91C1C" />
          </View>
          <Text style={styles.actionTitle}>Add Expense</Text>
          <Text style={styles.actionMeta}>Track spend, category, notes, and date in one flow.</Text>
          <View style={styles.actionFooter}>
            <Text style={styles.footerText}>Go to expense form</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#B91C1C" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.incomeCard} activeOpacity={0.9} onPress={pushIncome}>
          <View style={styles.iconBubbleIncome}>
            <MaterialIcons name="north-east" size={20} color="#166534" />
          </View>
          <Text style={styles.actionTitle}>Add Income</Text>
          <Text style={styles.actionMeta}>Log salary, freelance, business, and bonuses fast.</Text>
          <View style={styles.actionFooter}>
            <Text style={[styles.footerText, { color: '#166534' }]}>Go to income form</Text>
            <MaterialIcons name="arrow-forward" size={16} color="#166534" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.extraCard}>
        <Text style={styles.extraTitle}>Smart Shortcuts</Text>
        <Text style={styles.extraSubtitle}>Capture or import first, then confirm in transactions.</Text>

        <TouchableOpacity
          style={styles.shortcutRow}
          onPress={() => router.push('/receipt-scanner')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#CCFBF1' }]}>
            <MaterialIcons name="document-scanner" size={17} color="#0F766E" />
          </View>
          <View style={styles.shortcutTextWrap}>
            <Text style={styles.shortcutTitle}>Scan Receipt</Text>
            <Text style={styles.shortcutMeta}>Use camera OCR and save with transaction.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={19} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutRow}
          onPress={() => router.push('/sms-listener')}
        >
          <View style={[styles.shortcutIcon, { backgroundColor: '#DBEAFE' }]}>
            <MaterialIcons name="sms" size={17} color="#1D4ED8" />
          </View>
          <View style={styles.shortcutTextWrap}>
            <Text style={styles.shortcutTitle}>Import From SMS</Text>
            <Text style={styles.shortcutMeta}>Parse and convert bank alerts into records.</Text>
          </View>
          <MaterialIcons name="chevron-right" size={19} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 18,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 12,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    padding: 14,
    overflow: 'hidden',
  },
  heroShapeA: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -28,
    top: -45,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  heroShapeB: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    left: -30,
    bottom: -32,
    backgroundColor: 'rgba(167, 139, 250, 0.24)',
  },
  heroImage: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 70,
    height: 70,
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#B6DFDB',
    backgroundColor: 'rgba(255,255,255,0.76)',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 27,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 12,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 19,
  },
  dateCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
    backgroundColor: 'rgba(255,255,255,0.74)',
    minHeight: 62,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateTextWrap: {
    flex: 1,
  },
  dateLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  dateValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  todayPill: {
    borderRadius: 999,
    minHeight: 24,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  todayPillText: {
    color: Colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  expenseCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
    padding: 12,
    minHeight: 190,
  },
  incomeCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#FAF8FF',
    padding: 12,
    minHeight: 190,
  },
  iconBubbleExpense: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  iconBubbleIncome: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  actionTitle: {
    marginTop: 10,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  actionMeta: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
  },
  actionFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '800',
  },
  extraCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 12,
  },
  extraTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  extraSubtitle: {
    marginTop: 3,
    marginBottom: 9,
    color: '#64748B',
    fontSize: 12,
  },
  shortcutRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 56,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  shortcutIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTextWrap: {
    flex: 1,
  },
  shortcutTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  shortcutMeta: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 11,
  },
});
