import React from 'react';
import { useRouter } from 'expo-router';
import RegisterScreen from '../screens/RegisterScreen';

/**
 * Register Screen - Wrapped with Expo Router Navigation
 * This manages the registration UI and handles navigation to login
 */
export default function RegisterPage() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.back();
  };

  const handleRegisterPress = (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    console.log('Registration attempt:', data);
    // TODO: Call your authentication service
    // Once registered, navigate to main app:
    // router.replace('/(auth)/(tabs)');
  };

  return (
    <RegisterScreen
      onNavigateToLogin={handleNavigateToLogin}
      onRegisterPress={handleRegisterPress}
    />
  );
}
