import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import Colors from '../constants/colors';
import CustomButton from '../components/CustomButton';

const SettingsScreen: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);
  const toggleBiometric = () => setBiometricEnabled(prev => !prev);

  const handleChangeCurrency = () => {
    Alert.alert('Select Currency', 'Here you can open a modal to choose currency (e.g., USD, EUR, GBP)');
  };

  const handleResetSettings = () => {
    Alert.alert('Reset Settings', 'Are you sure you want to reset all settings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => {
          setIsDarkMode(false);
          setNotificationsEnabled(true);
          setCurrency('USD');
          setBiometricEnabled(false);
          Alert.alert('Settings reset!');
        }, style: 'destructive' }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.screenTitle}>Settings</Text>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>
      </View>

      {/* Currency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{currency}</Text>
          <CustomButton
            title="Change"
            onPress={handleChangeCurrency}
            style={{ paddingHorizontal: 12, backgroundColor: Colors.primary, height: 36 }}
            textStyle={{ fontSize: 14 }}
          />
        </View>
      </View>

      {/* Security */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Biometric / App Lock</Text>
          <Switch value={biometricEnabled} onValueChange={toggleBiometric} />
        </View>
      </View>

      {/* Reset Settings */}
      <View style={styles.section}>
        <CustomButton
          title="Reset Settings"
          onPress={handleResetSettings}
          style={{ backgroundColor: Colors.error }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20 },
  screenTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 16, color: Colors.textPrimary },
});

export default SettingsScreen;