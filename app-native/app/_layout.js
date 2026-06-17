import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/theme';
import { load, activeDeals } from '../src/utils/storage';
import { processDebt } from '../src/utils/debtEngine';
import { useRouter } from 'expo-router';

export default function RootLayout() {
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
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="log" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </>
  );
}
