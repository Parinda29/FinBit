import 'react-native-reanimated';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider } from '../context/AppThemeContext';
import { ToastProvider } from '../context/ToastContext';
import SplashScreen from '../components/SplashScreen';
import Colors from '../constants/colors';

function RootNavigator() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: Colors.background,
            paddingTop: 8,
          },
        }}
        initialRouteName="login"
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="home" />
        <Stack.Screen name="sms-listener" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="receipts" />
        <Stack.Screen name="receipt-scanner" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="quick-add" />
        <Stack.Screen name="daily-expenses" />
      </Stack>

      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 1.5 seconds on app start
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return (
    <AppThemeProvider>
      <ToastProvider>
        <RootNavigator />
      </ToastProvider>
    </AppThemeProvider>
  );
}
