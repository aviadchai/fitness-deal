import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../src/ThemeContext';
import { load, activeDeals } from '../src/utils/storage';
import { processDebt } from '../src/utils/debtEngine';

function RootStack() {
  const { C, isDark } = useTheme();
  const [ready, setReady] = useState(false);
  const [hasDeals, setHasDeals] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await load();
      const deals = activeDeals();
      if (deals.length > 0) await processDebt();
      setHasDeals(deals.length > 0);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready && !hasDeals) {
      router.replace('/onboarding');
    }
  }, [ready, hasDeals]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={C.accent} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}
