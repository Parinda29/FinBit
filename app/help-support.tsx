import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import FinbitLogo from '../components/ui/FinbitLogo';

type HelpItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

const FAQ_ROWS: HelpItem[] = [
  {
    icon: 'login',
    title: 'Login and Session Issues',
    subtitle: 'Check internet, then sign out and sign in once to refresh your session.',
  },
  {
    icon: 'sms',
    title: 'SMS Import Not Working',
    subtitle: 'Grant SMS permission and use Android dev build instead of Expo Go.',
  },
  {
    icon: 'notifications-none',
    title: 'Notification Actions',
    subtitle: 'Swipe left to delete and tap Mark as read on each notification.',
  },
];

export default function HelpSupportPage() {
  const router = useRouter();

  const contactRows: HelpItem[] = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      subtitle: 'finbit.support@yourapp.com',
      onPress: () => Linking.openURL('mailto:finbit.support@yourapp.com?subject=FinBit%20Support'),
    },
    {
      icon: 'language',
      title: 'Visit Help Center',
      subtitle: 'Open support docs in browser',
      onPress: () => Linking.openURL('https://example.com/finbit-help'),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Help & Support</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close help and support"
        >
          <MaterialIcons name="close" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Need assistance? Find quick fixes and contact options below.</Text>
      <View style={styles.logoWrap}>
        <FinbitLogo size="sm" showTagline={false} />
      </View>

      <View style={styles.highlightCard}>
        <View style={styles.highlightIconWrap}>
          <MaterialIcons name="verified-user" size={18} color={Colors.primaryDark} />
        </View>
        <View style={styles.highlightTextWrap}>
          <Text style={styles.highlightTitle}>Fastest Resolution Path</Text>
          <Text style={styles.highlightText}>Open Settings, check permissions, and restart app once after updates.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Common Questions</Text>
      <View style={styles.groupCard}>
        {FAQ_ROWS.map((row, index) => (
          <View key={row.title} style={[styles.groupRow, index !== FAQ_ROWS.length - 1 && styles.groupRowBorder]}>
            <View style={styles.iconWrap}>
              <MaterialIcons name={row.icon} size={16} color={Colors.primaryDark} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Contact Support</Text>
      <View style={styles.groupCard}>
        {contactRows.map((row, index) => (
          <TouchableOpacity
            key={row.title}
            style={[styles.groupRow, index !== contactRows.length - 1 && styles.groupRowBorder]}
            activeOpacity={0.86}
            onPress={row.onPress}
          >
            <View style={styles.iconWrap}>
              <MaterialIcons name={row.icon} size={16} color={Colors.primaryDark} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            <MaterialIcons name="open-in-new" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 18,
    paddingTop: 16,
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
    borderColor: Colors.border,
    backgroundColor: Colors.white,
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
  highlightCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  highlightIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  highlightTextWrap: {
    flex: 1,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  highlightText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.primaryDark,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    marginTop: 2,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
  },
  groupRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconWrap: {
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
    color: Colors.textSecondary,
  },
});
