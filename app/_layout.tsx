import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

/**
 * Root Layout - Clean Stack Navigation for FinBit Auth
 * Manages all app navigation with no default header
 */
export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
        initialRouteName="login"
      >
        {/* Auth screens */}
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
