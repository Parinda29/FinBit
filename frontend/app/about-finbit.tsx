import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import FinbitLogo from '../components/ui/FinbitLogo';

const APP_VERSION = '1.0.0';

export default function AboutFinbitPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>About FinBit</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close about page"
        >
          <MaterialIcons name="close" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Personal finance tracking with fast imports, budgeting, and smart alerts.</Text>
      <View style={styles.logoWrap}>
        <FinbitLogo size="sm" showTagline={false} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <MaterialIcons name="verified" size={20} color={Colors.primaryDark} />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>FinBit</Text>
          <Text style={styles.heroMeta}>Version {APP_VERSION}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What FinBit Does</Text>
      <View style={styles.groupCard}>
        <View style={styles.groupRow}>
          <View style={styles.rowIconWrap}>
            <MaterialIcons name="sms" size={16} color={Colors.primaryDark} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>SMS and PDF Import</Text>
            <Text style={styles.rowSubtitle}>Convert bank/wallet messages and statements into transactions quickly.</Text>
          </View>
        </View>

        <View style={[styles.groupRow, styles.groupRowBorder]}>
          <View style={styles.rowIconWrap}>
            <MaterialIcons name="pie-chart-outline" size={16} color={Colors.primaryDark} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Budget Monitoring</Text>
            <Text style={styles.rowSubtitle}>Track budget usage with automatic alerts and monthly summaries.</Text>
          </View>
        </View>

        <View style={styles.groupRow}>
          <View style={styles.rowIconWrap}>
            <MaterialIcons name="insights" size={16} color={Colors.primaryDark} />
          </View>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Reports and Insights</Text>
            <Text style={styles.rowSubtitle}>Review expenses and income trends to improve financial decisions.</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footerText}>Built for simple, reliable personal finance management.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  logoWrap: {
    marginBottom: 10,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: Colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  heroMeta: {
    marginTop: 2,
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 14,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  groupRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
});
