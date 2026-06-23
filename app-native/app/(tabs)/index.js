import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/ThemeContext';
import { activeDeals } from '../../src/utils/storage';
import { processDebt, dealLogged, dealDue } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import DealCard from '../../src/components/DealCard';

function ConcentricRings({ deals, C }) {
  const size = 220;
  const baseStroke = 14;
  const gap = 6;

  let totalLogged = 0;
  let totalTarget = 0;

  const ringColors = [C.ring1, C.ring2, C.ring3];

  const rings = deals.slice(0, 3).map((deal, i) => {
    const logged = dealLogged(deal);
    const target = deal.dailyTarget + (deal.debt || 0);
    totalLogged += logged;
    totalTarget += target;
    const pct = target > 0 ? Math.min(1, logged / target) : 1;
    const radius = (size - baseStroke) / 2 - i * (baseStroke + gap);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - pct);
    return { radius, circumference, offset, color: ringColors[i] || C.accent };
  });

  return (
    <View style={ringStyles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {rings.map((ring, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={size / 2} cy={size / 2} r={ring.radius}
              fill="none" stroke={C.bg3} strokeWidth={baseStroke}
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
        <Text style={[ringStyles.centerNum, { color: C.label }]}>{totalLogged}</Text>
        <Text style={[ringStyles.centerSlash, { color: C.label2 }]}>/ {totalTarget}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerNum: { fontSize: 36, fontWeight: '700', letterSpacing: -2 },
  centerSlash: { fontSize: 14, marginTop: 2 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { C, lang, rtl } = useTheme();
  const [deals, setDeals] = useState([]);

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
      <View style={[styles.empty, { backgroundColor: C.bg }]}>
        <View style={[styles.emptyIcon, { backgroundColor: C.accentCont }]}>
          <Ionicons name="alert-circle-outline" size={40} color={C.accent} />
        </View>
        <Text style={[styles.emptyText, { color: C.label2 }]}>{t('noActiveDeal', lang)}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: C.bg, direction: rtl ? 'rtl' : 'ltr' }]}
      contentContainerStyle={styles.content}
    >
      <ConcentricRings deals={deals} C={C} />
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
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
