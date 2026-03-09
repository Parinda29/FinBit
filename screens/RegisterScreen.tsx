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
}

const API_URL = 'http://192.168.0.5:8000/api/register/';

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigateToLogin }) => {
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
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }), 
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!');
        onNavigateToLogin && onNavigateToLogin();
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setAgreedToTerms(false);
      } else {
        
        const errorMessages = Object.values(data)
          .flat()
          .join('\n');
        Alert.alert('Error', errorMessages || 'Registration failed');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={onNavigateToLogin}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="trending-up" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.appTitle}>FinBit</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <AuthInput placeholder="Full Name" value={name} onChangeText={setName} icon="person" autoCapitalize="words" error={errors.name} editable={!loading} />
            <AuthInput placeholder="Email Address" value={email} onChangeText={setEmail} icon="email" keyboardType="email-address" autoCapitalize="none" error={errors.email} editable={!loading} />
            <AuthInput placeholder="Password" value={password} onChangeText={setPassword} icon="lock" isPassword error={errors.password} editable={!loading} />
            <AuthInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} icon="lock-outline" isPassword error={errors.confirmPassword} editable={!loading} />

            {/* Terms */}
            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <MaterialIcons name="check" size={14} color={Colors.white} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <AuthButton title="Create Account" onPress={handleRegister} loading={loading} disabled={loading} size="large" style={styles.registerButton} />

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  keyboardAvoid: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },

  backButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },

  headerSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 70, height: 70, borderRadius: 16, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appTitle: { fontSize: 32, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  formSection: { marginBottom: 20 },

  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.mediumGray, justifyContent: 'center', alignItems: 'center', marginRight: 10, marginTop: 2 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', flex: 1, lineHeight: 20 },
  termsLink: { color: Colors.primary, fontWeight: '600' },

  registerButton: { marginBottom: 16, marginTop: 8 },

  signInContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  signInLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
});

export default RegisterScreen;