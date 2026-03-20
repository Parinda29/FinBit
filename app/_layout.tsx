import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import SMSListener from './sms-listener';

/**
 * Root Layout - Clean Stack Navigation for FinBit Auth
 * Manages all app navigation with no default header
 */
export default function RootLayout() {
  return (
    <>
      {/* SMS Listener added here */}
      <SMSListener />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="login"
      >
        {/* Auth screens */}
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}