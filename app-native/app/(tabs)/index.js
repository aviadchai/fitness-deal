import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../src/ThemeContext';
import { activeDeals } from '../../src/utils/storage';
import { processDebt, dealLogged, dealDue, todayStr, addDays } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import { exName } from '../../src/utils/exercises';
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

function findLastMissedDate(deal) {
  const tod = todayStr();
  let d = addDays(tod, -1);
  for (let i = 0; i < 30; i++) {
    if (d < deal.startDate) break;
    const logged = (deal.logs && deal.logs[d]) || 0;
    if (logged < deal.dailyTarget) return d;
    d = addDays(d, -1);
  }
  return null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { C, lang, rtl } = useTheme();
  const [deals, setDeals] = useState([]);
  const [debtPopup, setDebtPopup] = useState(null);
  const [popupShown, setPopupShown] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await processDebt();
        const d = [...activeDeals()];
        setDeals(d);
        if (!popupShown) {
          const debtDeals = d.filter(deal => (deal.debt || 0) > 0);
          if (debtDeals.length > 0) {
            const info = debtDeals.map(deal => ({
              name: exName(deal.exercise, lang),
              debt: deal.debt,
              unit: deal.exercise === 'plank' ? 'sec' : 'reps',
              missedDate: findLastMissedDate(deal),
            }));
            setDebtPopup(info);
            setPopupShown(true);
          }
        }
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
    <View style={{ flex: 1 }}>
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

      <Modal visible={!!debtPopup} transparent animationType="fade" onRequestClose={() => setDebtPopup(null)}>
        <View style={styles.overlay}>
          <View style={[styles.popup, { backgroundColor: C.bg2, borderColor: C.cardBorder, direction: rtl ? 'rtl' : 'ltr' }]}>
            <View style={[styles.popupIconRing, { backgroundColor: 'rgba(255,140,0,0.15)' }]}>
              <Ionicons name="warning" size={32} color={C.orange} />
            </View>
            <Text style={[styles.popupTitle, { color: C.label }, rtl && styles.rtlText]}>
              {t('debtAlert', lang)}
            </Text>
            {debtPopup && debtPopup.map((item, i) => (
              <View key={i} style={[styles.popupRow, { backgroundColor: C.bg3 }]}>
                <Text style={[styles.popupExName, { color: C.label }, rtl && styles.rtlText]}>
                  {item.name}
                </Text>
                <Text style={[styles.popupDebt, { color: C.orange }]}>
                  {item.debt} {item.unit}
                </Text>
                {item.missedDate && (
                  <Text style={[styles.popupDate, { color: C.label2 }, rtl && styles.rtlText]}>
                    {t('fromDate', lang)} {item.missedDate}
                  </Text>
                )}
              </View>
            ))}
            <TouchableOpacity
              style={[styles.popupBtn, { backgroundColor: C.accent }]}
              onPress={() => setDebtPopup(null)}
              activeOpacity={0.75}
            >
              <Text style={styles.popupBtnText}>{t('dismiss', lang)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 110 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  popup: {
    width: '100%', borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 16, borderWidth: 1,
  },
  popupIconRing: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  popupTitle: { fontSize: 20, fontWeight: '600' },
  popupRow: {
    width: '100%', borderRadius: 12, padding: 14, gap: 4,
  },
  popupExName: { fontSize: 16, fontWeight: '600' },
  popupDebt: { fontSize: 22, fontWeight: '700' },
  popupDate: { fontSize: 13 },
  popupBtn: {
    width: '100%', borderRadius: 50, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  popupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
