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

import { loginUser } from '../services/authService';

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = useState('');

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Enter a valid email';

    if (!password.trim()) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setAuthError('');
    setLoading(true);
    const { success, error } = await loginUser({ email, password });
    setLoading(false);

    if (success) {
      onLoginSuccess && onLoginSuccess();
      Alert.alert('Success', 'Logged in successfully!');
    } else {
      const message = error || 'Invalid email or password';
      const lower = message.toLowerCase();

      if (
        lower.includes('invalid email or password') ||
        lower.includes('invalid credentials') ||
        lower.includes('login failed')
      ) {
        setErrors({
          email: 'ID or email is incorrect',
          password: 'Password is incorrect',
        });
        setAuthError('Wrong ID/email or password. Please try again.');
      } else {
        setAuthError(message);
      }
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <View style={styles.logoWrap}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="account-balance-wallet" size={32} color={Colors.white} />
              </View>
            </View>
            <Text style={styles.appEyebrow}>FINBIT PERSONAL FINANCE</Text>
            <Text style={styles.appTitle}>Own your money, every day.</Text>
            <Text style={styles.subtitle}>Sign in to track spending, income, and goals in one secure place.</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>24/7</Text>
              <Text style={styles.metricLabel}>Account Access</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>256-bit</Text>
              <Text style={styles.metricLabel}>Data Security</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>Real-time</Text>
              <Text style={styles.metricLabel}>Insights</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Continue where you left off</Text>

            <AuthInput
              placeholder="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setAuthError('');
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              icon="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              editable={!loading}
            />
            <AuthInput
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setAuthError('');
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              icon="lock"
              isPassword
              error={errors.password}
              editable={!loading}
            />

            {!!authError && <Text style={styles.authErrorText}>{authError}</Text>}

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <AuthButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              size="large"
              style={styles.loginButton}
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>new to FinBit?</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>No account yet? </Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.signUpLink}>Create one</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.trustPanel}>
            <MaterialIcons name="verified-user" size={18} color={Colors.success} />
            <Text style={styles.trustText}>Bank-level encryption with private, local-first session handling.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F8F8' },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },

  bgOrbTop: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(13, 110, 110, 0.08)',
    top: -90,
    right: -70,
  },
  bgOrbBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(16, 185, 129, 0.09)',
    bottom: -80,
    left: -60,
  },

  headerSection: { marginBottom: 22 },
  logoWrap: { marginBottom: 14 },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 4,
  },
  appEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#103434',
    lineHeight: 38,
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#365A5A',
    fontWeight: '500',
    lineHeight: 21,
  },

  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEEEE',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4E9E9',
    padding: 16,
    marginBottom: 18,
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
  forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -4 },
  forgotPasswordText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '700' },
  loginButton: { marginBottom: 16, borderRadius: 14 },
  authErrorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
  },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#D4E0E0' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },

  signUpContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signUpLink: { fontSize: 14, color: Colors.primaryDark, fontWeight: '700' },

  trustPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1,
    borderColor: '#D7E8E8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: '#4A6363',
    fontWeight: '500',
    lineHeight: 17,
  },
});

export default LoginScreen;