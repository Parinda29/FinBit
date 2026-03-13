import React from 'react';
import { useRouter } from 'expo-router';
import RegisterScreen from '../screens/RegisterScreen';

/**
 * Register screen wrapper – navigate after successful signup.
 */
export default function RegisterPage() {
  const router = useRouter();

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  const handleRegisterSuccess = () => {
    router.replace('/home');
  };

  return (
    <RegisterScreen
      onNavigateToLogin={handleNavigateToLogin}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}
