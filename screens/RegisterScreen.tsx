import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AuthInput from '../components/AuthInput';
import AuthButton from '../components/AuthButton';
import Colors from '../constants/colors';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void; // callback after successful registration
}

import { registerUser } from '../services/authService';

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    else if (name.trim().length < 3) newErrors.name = 'Name must be at least 3 characters';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    if (!agreedToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    const { success, error } = await registerUser({
      name,
      email,
      password,
      confirmPassword,
    });

    setLoading(false);

    if (success) {
      onRegisterSuccess && onRegisterSuccess();
      Alert.alert('Success', 'Account created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreedToTerms(false);
    } else {
      Alert.alert('Error', error || 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="savings" size={34} color={Colors.white} />
            </View>
            <Text style={styles.appEyebrow}>GET STARTED</Text>
            <Text style={styles.appTitle}>Build better money habits.</Text>
            <Text style={styles.subtitle}>Create your FinBit account and get instant visibility into your cash flow.</Text>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.benefitChip}>
              <MaterialIcons name="insights" size={14} color={Colors.primaryDark} />
              <Text style={styles.benefitText}>Smart Reports</Text>
            </View>
            <View style={styles.benefitChip}>
              <MaterialIcons name="shield" size={14} color={Colors.primaryDark} />
              <Text style={styles.benefitText}>Secure Account</Text>
            </View>
            <View style={styles.benefitChip}>
              <MaterialIcons name="payments" size={14} color={Colors.primaryDark} />
              <Text style={styles.benefitText}>Budget Control</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Create account</Text>
            <Text style={styles.formSubtitle}>It takes less than a minute</Text>

            <AuthInput placeholder="Full Name" value={name} onChangeText={setName} icon="person" autoCapitalize="words" error={errors.name} editable={!loading} />
            <AuthInput placeholder="Email Address" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" autoCapitalize="none" error={errors.email} editable={!loading} />
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} icon="lock" isPassword error={errors.password} editable={!loading} />
            <AuthInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} icon="lock-outline" isPassword error={errors.confirmPassword} editable={!loading} />

            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <MaterialIcons name="check" size={14} color={Colors.white} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <AuthButton title="Create Account" onPress={handleRegister} loading={loading} disabled={loading} size="large" style={styles.registerButton} />

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footNoteWrap}>
            <MaterialIcons name="lock" size={16} color={Colors.success} />
            <Text style={styles.footNoteText}>Your financial records stay private and encrypted.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F8F7' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },

  bgOrbTop: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(13, 110, 110, 0.09)',
    top: -70,
    left: -60,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    bottom: -90,
    right: -70,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCEAEA',
  },

  headerSection: { marginBottom: 16 },
  logoContainer: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  appEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    letterSpacing: 1,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    color: '#133838',
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#446464',
    fontWeight: '500',
    lineHeight: 21,
  },

  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  benefitChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F1F1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE3E3',
    paddingVertical: 8,
    gap: 5,
  },
  benefitText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  formSection: {
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6E7E7',
    padding: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },

  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 14 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.mediumGray, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', flex: 1, lineHeight: 20 },
  termsLink: { color: Colors.primaryDark, fontWeight: '700' },

  registerButton: { marginBottom: 14, marginTop: 6, borderRadius: 14 },

  signInContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signInLink: { fontSize: 14, color: Colors.primaryDark, fontWeight: '700' },

  footNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#D7E7E7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  footNoteText: {
    fontSize: 12,
    color: '#506B6B',
    fontWeight: '500',
    lineHeight: 16,
  },
});

export default RegisterScreen;