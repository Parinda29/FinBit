import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../screens/LoginScreen';

/**
 * Login screen wrapper – only handles register navigation now.
 */
export default function LoginPage() {
  const router = useRouter();

  const handleNavigateToRegister = () => {
    router.push('/register');
  };

  const handleLoginSuccess = () => {
    // redirect to home after successful login
    router.replace('/(tabs)');
  };

  return (
    <LoginScreen
      onNavigateToRegister={handleNavigateToRegister}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}
