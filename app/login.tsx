import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/LoginScreen';

/**
 * Login Screen - Wrapped with Expo Router Navigation
 * This manages the login UI and handles navigation to register
 */
export default function LoginPage() {
  const router = useRouter();

  const handleNavigateToRegister = () => {
    router.push('/register');
  };

  const handleLoginPress = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    // TODO: Call your authentication service
    // Once authenticated, navigate to main app:
    // router.replace('/(auth)/(tabs)');
  };

  return (
    <LoginScreen
      onNavigateToRegister={handleNavigateToRegister}
      onLoginPress={handleLoginPress}
    />
  );
}
