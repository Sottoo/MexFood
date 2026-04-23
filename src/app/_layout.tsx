import 'react-native-url-polyfill/auto'; // requerido por @supabase/supabase-js en RN
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/src/constants/theme';
import '@/src/i18n';
export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.text,
        headerShadowVisible: false, // Clean look
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false // Hide header for welcome screen
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false, // Hide native header since we built a custom one
          headerBackVisible: false, // Don't allow going back to welcome
          gestureEnabled: false, // Prevent swiping back on iOS
        }}
      />
    </Stack>
  );
}
