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
      Alert.alert('Success', 'Logged in successfully!', [
        {
          text: 'Continue',
          onPress: () => {
            onLoginSuccess && onLoginSuccess();
          },
        },
      ]);
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBar}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="account-balance-wallet" size={26} color={Colors.white} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.appEyebrow}>FINBIT</Text>
              <Text style={styles.brandCaption}>Personal Finance Companion</Text>
            </View>
            <View style={styles.secureBadge}>
              <MaterialIcons name="verified-user" size={14} color={Colors.primaryDark} />
              <Text style={styles.secureBadgeText}>Secure</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.appTitle}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue managing your spending and income.</Text>

            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatValue}>24/7</Text>
                <Text style={styles.heroStatLabel}>Access</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatValue}>Live</Text>
                <Text style={styles.heroStatLabel}>Insights</Text>
              </View>
              <View style={styles.heroStatChip}>
                <Text style={styles.heroStatValue}>Safe</Text>
                <Text style={styles.heroStatLabel}>Tokens</Text>
              </View>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Use your email and password</Text>

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
            <Text style={styles.trustText}>Bank-level encryption and secure token authentication enabled.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 34 },

  brandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandCopy: {
    flex: 1,
    marginLeft: 10,
  },
  secureBadge: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  secureBadgeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  appEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.primaryDark,
  },
  brandCaption: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  heroCard: {
    borderRadius: 24,
    backgroundColor: Colors.primary,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 36,
    letterSpacing: -0.7,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '500',
    lineHeight: 20,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 14,
  },
  heroStatChip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  heroStatValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -3 },
  forgotPasswordText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '700' },
  loginButton: { marginBottom: 16, borderRadius: 16 },
  authErrorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
  },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },

  signUpContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signUpLink: { fontSize: 14, color: Colors.primaryDark, fontWeight: '700' },

  trustPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  trustText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 17,
  },
});

export default LoginScreen;