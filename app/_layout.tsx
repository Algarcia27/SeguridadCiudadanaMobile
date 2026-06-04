import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import ErrorBoundary from '@/src/components/ErrorBoundary';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { LocationProvider } from '@/src/context/LocationContext';
import { AuthProvider } from '@/src/context/AuthContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index1">
        <Stack.Screen name="index1" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" options={{ presentation: 'card' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'card' }} />
        <Stack.Screen name="report-emergency" options={{ presentation: 'card' }} />
        <Stack.Screen name="report-incident" options={{ presentation: 'card' }} />
        <Stack.Screen name="suggestions" options={{ presentation: 'card' }} />
        <Stack.Screen name="register" options={{ presentation: 'card' }} />
        <Stack.Screen name="forgot-password" options={{ presentation: 'card' }} />
        <Stack.Screen name="reset-password" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Inter_400Regular,
          Inter_500Medium,
          Inter_600SemiBold,
          Inter_700Bold,
        });
      } catch (e) {
        console.warn('Font loading failed:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <LocationProvider>
              <AuthProvider>
                <QueryClientProvider client={queryClient}>
                  <KeyboardProvider>
                    <ErrorBoundary>
                      <RootLayoutNav />
                    </ErrorBoundary>
                  </KeyboardProvider>
                </QueryClientProvider>
              </AuthProvider>
            </LocationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
