import { useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme';
import { activeDeals, getLang } from '../../src/utils/storage';
import { processDebt } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import DealCard from '../../src/components/DealCard';

export default function HomeScreen() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const lang = getLang();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await processDebt();
        setDeals([...activeDeals()]);
      })();
    }, [])
  );

  if (deals.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.accent} />
        </View>
        <Text style={styles.emptyText}>{t('noActiveDeal', lang)}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {deals.map(deal => (
        <DealCard
          key={deal.exercise}
          deal={deal}
          onLog={() => router.push({ pathname: '/log', params: { exercise: deal.exercise } })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  empty: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accentCont,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: COLORS.label2, textAlign: 'center', lineHeight: 24 },
});
