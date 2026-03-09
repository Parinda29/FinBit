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

interface LoginScreenProps {
  onNavigateToRegister?: () => void;
}

// ✅ Backend API URL
const API_URL = 'http://192.168.0.5:8000/api/login/';

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Logged in successfully!');
        // TODO: Save token or navigate to Home screen
      } else {
       
        const errorMessages = Object.values(data)
          .flat()
          .join('\n');
        Alert.alert('Error', errorMessages || 'Login failed');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="trending-up" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.appTitle}>FinBit</Text>
            <Text style={styles.subtitle}>Manage your money smarter</Text>
          </View>

          {/* Welcome */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeDescription}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <AuthInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              icon="email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              editable={!loading}
            />
            <AuthInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              icon="lock"
              isPassword
              error={errors.password}
              editable={!loading}
            />

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
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateToRegister}>
                <Text style={styles.signUpLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              By signing in, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, justifyContent: 'space-between' },

  headerSection: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 70, height: 70, borderRadius: 16, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appTitle: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  welcomeSection: { marginBottom: 32 },
  welcomeTitle: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
  welcomeDescription: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },

  formSection: { marginBottom: 24 },
  forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotPasswordText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  loginButton: { marginBottom: 20 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.mediumGray },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  signUpContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signUpLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  footerSection: { marginTop: 20 },
  footerText: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  footerLink: { color: Colors.primary, fontWeight: '600' },
});

export default LoginScreen;