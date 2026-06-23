import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../../src/theme';
import { activeDeals, getLang } from '../../src/utils/storage';
import { processDebt, dealLogged, dealDue } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import DealCard from '../../src/components/DealCard';

const RING_COLORS = [COLORS.ring1, COLORS.ring2, COLORS.ring3];

function ConcentricRings({ deals }) {
  const size = 220;
  const baseStroke = 14;
  const gap = 6;

  let totalLogged = 0;
  let totalTarget = 0;

  const rings = deals.slice(0, 3).map((deal, i) => {
    const logged = dealLogged(deal);
    const target = deal.dailyTarget + (deal.debt || 0);
    totalLogged += logged;
    totalTarget += target;
    const pct = target > 0 ? Math.min(1, logged / target) : 1;
    const radius = (size - baseStroke) / 2 - i * (baseStroke + gap);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct);
    return { radius, circumference, offset, color: RING_COLORS[i] || COLORS.accent };
  });

  return (
    <View style={ringStyles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map((ring, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={size / 2} cy={size / 2} r={ring.radius}
              fill="none" stroke={COLORS.bg3} strokeWidth={baseStroke}
              strokeOpacity={0.4}
            />
            <Circle
              cx={size / 2} cy={size / 2} r={ring.radius}
              fill="none" stroke={ring.color} strokeWidth={baseStroke}
              strokeLinecap="round"
              strokeDasharray={ring.circumference}
              strokeDashoffset={ring.offset}
            />
          </React.Fragment>
        ))}
      </Svg>
      <View style={ringStyles.center}>
        <Text style={ringStyles.centerNum}>{totalLogged}</Text>
        <Text style={ringStyles.centerSlash}>/ {totalTarget}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerNum: { fontSize: 36, fontWeight: '700', color: COLORS.label, letterSpacing: -2 },
  centerSlash: { fontSize: 14, color: COLORS.label2, marginTop: 2 },
});

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
      <ConcentricRings deals={deals} />
      {deals.map((deal, index) => (
        <DealCard
          key={deal.exercise}
          deal={deal}
          ringIndex={index}
          onLog={() => router.push({ pathname: '/log', params: { exercise: deal.exercise } })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  empty: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.accentCont,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, color: COLORS.label2, textAlign: 'center', lineHeight: 24 },
});
