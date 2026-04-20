import 'react-native-reanimated';

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppThemeProvider } from '../context/AppThemeContext';
import { ToastProvider } from '../context/ToastContext';
import SplashScreen from '../components/SplashScreen';
import Colors from '../constants/colors';
import { bootstrapAuthSession } from '../services/authService';

function RootNavigator({ initialRouteName }: { initialRouteName: 'login' | '(tabs)' }) {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: Colors.background,
            paddingTop: 14,
          },
        }}
        initialRouteName={initialRouteName}
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
        <Stack.Screen name="help-support" />
        <Stack.Screen name="about-finbit" />
      </Stack>

      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<'login' | '(tabs)'>('login');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAuthState = async () => {
      try {
        const hasSession = await bootstrapAuthSession();
        if (!mounted) return;

        setInitialRouteName(hasSession ? '(tabs)' : 'login');
      } finally {
        if (mounted) setAuthReady(true);
      }
    };

    loadAuthState();

    // Keep the splash visible briefly while storage and the UI settle.
    const timer = setTimeout(() => {
      if (mounted) setShowSplash(false);
    }, 900);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (showSplash || !authReady) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ToastProvider>
          <RootNavigator initialRouteName={initialRouteName} />
        </ToastProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
