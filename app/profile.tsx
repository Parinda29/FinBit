import React, { useCallback, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import { fetchUserProfile, logoutUser, updateUserProfile } from '../services/authService';
import { getHomeDashboardData, getNotifications } from '../services/transactionService';

type ActionRow = {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconTone: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  route?: string;
  onPress?: () => void;
  badgeText?: string;
};

const initialsOf = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
};

const currencyCompact = (amount: number) => {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const ActionSection = ({
  title,
  rows,
  onDefaultRowPress,
}: {
  title: string;
  rows: ActionRow[];
  onDefaultRowPress: (route?: string) => void;
}) => {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.groupCard}>
        {rows.map((row, index) => (
          <TouchableOpacity
            key={row.title}
            style={[styles.groupRow, index !== rows.length - 1 && styles.groupRowBorder]}
            activeOpacity={0.86}
            onPress={() => {
              if (row.onPress) {
                row.onPress();
                return;
              }
              onDefaultRowPress(row.route);
            }}
          >
            <View style={[styles.rowIconWrap, { backgroundColor: row.iconBg }]}> 
              <MaterialIcons name={row.icon} size={15} color={row.iconTone} />
            </View>

            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{row.title}</Text>
            </View>

            {!!row.badgeText && (
              <View style={styles.rowBadge}>
                <Text style={styles.rowBadgeText}>{row.badgeText}</Text>
              </View>
            )}

            <MaterialIcons name="chevron-right" size={18} color="#C4B5D8" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('FinBit User');
  const [email, setEmail] = useState('user@example.com');
  const [error, setError] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileResponse, dashboard, notifications] = await Promise.all([
        fetchUserProfile(),
        getHomeDashboardData().catch(() => null),
        getNotifications().catch(() => ({ unread_count: 0, notifications: [] })),
      ]);

      const user = profileResponse?.user;
      if (user) {
        setName(user.name || 'FinBit User');
        setEmail(user.email || 'user@example.com');
      }

      if (dashboard) {
        setTransactionCount(dashboard.transactions.length || 0);
        setNetBalance(Number(dashboard.summary.net_balance || 0));
      }

      setUnreadNotifications(Number(notifications?.unread_count || 0));
    } catch {
      setError('Could not load profile details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onSaveProfile = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await updateUserProfile({ name: name.trim(), email: email.trim() });
      if (!response?.success) {
        throw new Error(response?.message || 'Update failed');
      }
      setEditOpen(false);
      await loadProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace('/login');
  };

  const accountRows: ActionRow[] = [
    {
      icon: 'person-outline',
      iconTone: '#6D28D9',
      iconBg: '#EDE9FE',
      title: 'Edit Profile',
      subtitle: 'Update your identity details',
      onPress: () => setEditOpen(true),
    },
    {
      icon: 'lock-outline',
      iconTone: '#6D28D9',
      iconBg: '#F3E8FF',
      title: 'Change Password',
      subtitle: 'Keep your account secure',
      route: '/settings',
    },
  ];

  const appRows: ActionRow[] = [
    {
      icon: 'notifications-none',
      iconTone: '#6D28D9',
      iconBg: '#F3E8FF',
      title: 'Notifications',
      subtitle: 'Manage alerts and reminders',
      route: '/notifications',
      badgeText: unreadNotifications > 0 ? String(unreadNotifications) : undefined,
    },
    {
      icon: 'tune',
      iconTone: '#4338CA',
      iconBg: '#E0E7FF',
      title: 'Preferences',
      subtitle: 'Theme, language and defaults',
      route: '/settings',
    },
  ];

  const supportRows: ActionRow[] = [
    {
      icon: 'help-outline',
      iconTone: '#7C3AED',
      iconBg: '#EDE9FE',
      title: 'Help & Support',
      subtitle: 'Get help for common issues',
      route: '/settings',
    },
    {
      icon: 'info-outline',
      iconTone: '#8B5CF6',
      iconBg: '#F5F3FF',
      title: 'About FinBit',
      subtitle: 'Version and app information',
      route: '/settings',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <TouchableOpacity style={styles.heroSettings} onPress={() => router.push('/settings')} activeOpacity={0.85}>
          <MaterialIcons name="settings" size={18} color="#F5F3FF" />
        </TouchableOpacity>

        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{initialsOf(name)}</Text>
          <TouchableOpacity style={styles.editFab} onPress={() => setEditOpen(true)} activeOpacity={0.85}>
            <MaterialIcons name="edit" size={12} color="#5B21B6" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heroName}>{name}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#EDE9FE' }]}> 
            <MaterialIcons name="receipt-long" size={15} color="#6D28D9" />
          </View>
          <Text style={styles.statLabel}>Transactions</Text>
          <Text style={styles.statValue}>{transactionCount}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}> 
            <MaterialIcons name="account-balance-wallet" size={15} color="#4F46E5" />
          </View>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={styles.statValue}>NPR {currencyCompact(netBalance)}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.inlineState}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.inlineText}>Loading profile...</Text>
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <ActionSection
        title="Account"
        rows={accountRows}
        onDefaultRowPress={(route) => route && router.push(route as never)}
      />

      <ActionSection
        title="App Settings"
        rows={appRows}
        onDefaultRowPress={(route) => route && router.push(route as never)}
      />

      <ActionSection
        title="Support"
        rows={supportRows}
        onDefaultRowPress={(route) => route && router.push(route as never)}
      />

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.9}>
        <MaterialIcons name="logout" size={15} color="#B91C1C" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={Colors.textTertiary}
            />
            <TextInput
              style={styles.modalInput}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={onSaveProfile}>
                {saving ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.modalSaveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF4',
  },
  content: {
    paddingBottom: 96,
  },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 56,
    backgroundColor: '#6D28D9',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -80,
    top: -70,
    backgroundColor: 'rgba(167,139,250,0.28)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: 22,
    top: -30,
    backgroundColor: 'rgba(196,181,253,0.2)',
  },
  heroSettings: {
    position: 'absolute',
    right: 16,
    top: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.26)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    marginTop: 12,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#5B21B6',
    fontSize: 20,
    fontWeight: '900',
  },
  editFab: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroEmail: {
    marginTop: 1,
    color: '#DDD6FE',
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    marginTop: -34,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    padding: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 2,
    fontSize: 15,
    color: '#111827',
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  inlineState: {
    marginTop: 1,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 2,
    marginHorizontal: 16,
    color: Colors.error,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionWrap: {
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 16,
  },
  sectionLabel: {
    marginBottom: 7,
    color: '#3A3348',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  groupRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F7',
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  rowBadge: {
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  rowBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  logoutBtn: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 14,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#F2CACA',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  logoutText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    backgroundColor: Colors.white,
    padding: 14,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    minHeight: 43,
    marginBottom: 8,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    backgroundColor: '#FAFCFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  modalCancel: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
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
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  modalSaveText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
