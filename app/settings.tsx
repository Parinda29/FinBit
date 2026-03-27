import React, { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors from '../constants/colors';

export default function SettingsPage() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsHintsEnabled, setSmsHintsEnabled] = useState(true);
  const [currency] = useState<'NPR'>('NPR');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Lightweight controls for app behavior and tools.</Text>

      <View style={styles.currencyBanner}>
        <MaterialIcons name="currency-rupee" size={18} color={Colors.primaryDark} />
        <View style={styles.currencyBannerTextWrap}>
          <Text style={styles.currencyBannerTitle}>Currency Mode: NPR</Text>
          <Text style={styles.currencyBannerSubtitle}>Home dashboard is displayed in Nepali Rupees.</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.rowItem}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowSubtitle}>Enable reminders and app alerts</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor={Colors.primary}
            trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
          />
        </View>

        <View style={styles.rowItem}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Import Tips</Text>
            <Text style={styles.rowSubtitle}>Show SMS/PDF import guidance</Text>
          </View>
          <Switch
            value={smsHintsEnabled}
            onValueChange={setSmsHintsEnabled}
            thumbColor={Colors.primary}
            trackColor={{ false: '#CBD5E1', true: '#DDD6FE' }}
          />
        </View>

        <View style={styles.currencyLockRow}>
          <Text style={styles.rowTitle}>Currency</Text>
          <View style={styles.currencyLockChip}>
            <Text style={styles.currencyLockText}>{currency}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Tools</Text>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/manage-categories')}>
          <MaterialIcons name="category" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>Manage Categories</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/sms-listener')}>
          <MaterialIcons name="import-export" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>SMS Scan</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/receipts')}>
          <MaterialIcons name="document-scanner" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>Receipt Manager</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/receipt-scanner')}>
          <MaterialIcons name="photo-camera" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>Open Scanner</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/budget')}>
          <MaterialIcons name="account-balance-wallet" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>Budget Settings</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navRow} onPress={() => router.push('/(tabs)/reports')}>
          <MaterialIcons name="show-chart" size={18} color={Colors.primaryDark} />
          <Text style={styles.navText}>Open Reports</Text>
          <MaterialIcons name="chevron-right" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 10,
  },
  currencyBanner: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currencyBannerTextWrap: {
    flex: 1,
  },
  currencyBannerTitle: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  currencyBannerSubtitle: {
    color: Colors.primaryDark,
    fontSize: 11,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  currencyLockRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyLockChip: {
    borderRadius: 999,
    minHeight: 30,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyLockText: {
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: Colors.lightGray,
  },
  navText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});

