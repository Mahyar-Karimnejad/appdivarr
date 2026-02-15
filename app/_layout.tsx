import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { I18nManager, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AdFormProvider } from '@/src/contexts/AdFormContext';

// جلوگیری از نمایش splash screen تا فونت‌ها لود بشن
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Set RTL direction - Allow RTL but don't force it
  // We'll use flexDirection: 'row-reverse' manually where needed
  useEffect(() => {
    I18nManager.allowRTL(true);
  }, []);

  const [fontsLoaded, error] = useFonts({
    'Vazir': require('../assets/Font/Vazir.ttf'),
    'Vazir-Thin': require('../assets/Font/Vazir-Thin.ttf'),
    'Vazir-Light': require('../assets/Font/Vazir-Light.ttf'),
    'Vazir-Medium': require('../assets/Font/Vazir-Medium.ttf'),
    'Vazir-Bold': require('../assets/Font/Vazir-Bold.ttf'),
    'Vazir-Black': require('../assets/Font/Vazir-Black.ttf'),
    'Vazir-FD': require('../assets/Font/Vazir-FD.ttf'),
    'Vazir-Thin-FD': require('../assets/Font/Vazir-Thin-FD.ttf'),
    'Vazir-Light-FD': require('../assets/Font/Vazir-Light-FD.ttf'),
    'Vazir-Medium-FD': require('../assets/Font/Vazir-Medium-FD.ttf'),
    'Vazir-Bold-FD': require('../assets/Font/Vazir-Bold-FD.ttf'),
    'Vazir-Black-FD': require('../assets/Font/Vazir-Black-FD.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || error) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AdFormProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="verify-code" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="ads-list" options={{ headerShown: false }} />
          <Stack.Screen name="ad-detail" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="user-profile" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="rules" options={{ headerShown: false }} />
          <Stack.Screen name="post-ad" options={{ headerShown: false }} />
          <Stack.Screen name="post-ad-category" options={{ headerShown: false }} />
          <Stack.Screen name="post-ad-extra-features" options={{ headerShown: false }} />
          <Stack.Screen name="categories-management" options={{ headerShown: false }} />
          <Stack.Screen name="category-ads-list" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'مودال' }} />
        </Stack>
        <StatusBar style="auto" />
        </AdFormProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
