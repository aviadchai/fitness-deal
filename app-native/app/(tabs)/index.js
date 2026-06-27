import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
let Pedometer = null;
try { Pedometer = require('expo-sensors').Pedometer; } catch (e) {}
import { useTheme } from '../../src/ThemeContext';
import { activeDeals, getShownDebtKeys, markDebtShown } from '../../src/utils/storage';
import { processDebt, dealLogged, dealDue, todayStr, addDays, daysBetween, getDealTotalReps, getTimeLeft } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import { exName, EXERCISES, isTimerExercise } from '../../src/utils/exercises';
import DealCard from '../../src/components/DealCard';

function RingChart({ size, deals, getProgress, ringColors, C }) {
  const baseStroke = 12;
  const gap = 5;

  const rings = deals.slice(0, 3).map((deal, i) => {
    const pct = getProgress(deal);
    const radius = (size - baseStroke) / 2 - i * (baseStroke + gap);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.min(1, pct));
    return { radius, circumference, offset, color: ringColors[i] || C.accent };
  });

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {rings.map((ring, i) => (
        <React.Fragment key={i}>
          <Circle
            cx={size / 2} cy={size / 2} r={ring.radius}
            fill="none" stroke={C.bg3} strokeWidth={baseStroke}
            strokeOpacity={0.3}
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
  );
}

function DualRings({ deals, C, lang, rtl }) {
  const ringSize = 150;
  const ringColors = [C.ring1, C.ring2, C.ring3];

  function dailyProgress(deal) {
    const target = deal.dailyTarget + (deal.debt || 0);
    return target > 0 ? dealLogged(deal) / target : 1;
  }

  function overallProgress(deal) {
    const tod = todayStr();
    const totalDays = Math.max(1, daysBetween(deal.startDate, tod));
    const totalTarget = totalDays * deal.dailyTarget;
    const totalDone = getDealTotalReps(deal);
    return totalTarget > 0 ? totalDone / totalTarget : 1;
  }

  return (
    <View style={[rs.dualWrap, rtl && { flexDirection: 'row-reverse' }]}>
      <View style={rs.ringCol}>
        <RingChart size={ringSize} deals={deals} getProgress={dailyProgress} ringColors={ringColors} C={C} />
        <Text style={[rs.ringLabel, { color: C.label2 }]}>{t('daily', lang)}</Text>
      </View>
      <View style={rs.ringCol}>
        <RingChart size={ringSize} deals={deals} getProgress={overallProgress} ringColors={ringColors} C={C} />
        <Text style={[rs.ringLabel, { color: C.label2 }]}>{t('overall', lang)}</Text>
      </View>
    </View>
  );
}

function SummaryRows({ deals, C, lang, rtl }) {
  return (
    <View style={[rs.summaryCard, { backgroundColor: C.bg2, borderColor: C.cardBorder }]}>
      {deals.map((deal, i) => {
        const logged = dealLogged(deal);
        const due = deal.dailyTarget + (deal.debt || 0);
        const name = exName(deal.exercise, lang);
        const isTimer = isTimerExercise(deal.exercise);
        const ringColors = [C.ring1, C.ring2, C.ring3];
        const color = ringColors[i] || C.accent;

        function fmtTime(s) {
          const m = Math.floor(s / 60);
          const sec = s % 60;
          return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        }

        const progressText = isTimer ? `${fmtTime(logged)}/${fmtTime(due)}` : `${logged}/${due}`;

        return (
          <View key={deal.exercise}>
            {i > 0 && <View style={[rs.sep, { backgroundColor: C.sep }]} />}
            <View style={[rs.summaryRow, rtl && { flexDirection: 'row-reverse' }]}>
              <View style={[rs.summaryDot, { backgroundColor: color }]} />
              <Text style={[rs.summaryName, { color: C.label }, rtl && { textAlign: 'right' }]}>{name}</Text>
              <Text style={[rs.summaryProgress, { color }]}>{progressText}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const rs = StyleSheet.create({
  dualWrap: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 4 },
  ringCol: { alignItems: 'center', gap: 8 },
  ringLabel: { fontSize: 14, fontWeight: '500' },
  summaryCard: { borderRadius: 16, padding: 14, borderWidth: 1 },
  sep: { height: 1, marginVertical: 2 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  summaryDot: { width: 8, height: 8, borderRadius: 4 },
  summaryName: { flex: 1, fontSize: 16, fontWeight: '500' },
  summaryProgress: { fontSize: 18, fontWeight: '700' },
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
  const [steps, setSteps] = useState(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await processDebt();
        const d = [...activeDeals()];
        setDeals(d);

        const shownKeys = getShownDebtKeys();
        const debtDeals = d.filter(deal => (deal.debt || 0) > 0);
        const newDebts = debtDeals.filter(deal => {
          const key = `${deal.exercise}:${deal.debt}`;
          return !shownKeys.includes(key);
        });

        if (newDebts.length > 0) {
          const info = newDebts.map(deal => ({
            name: exName(deal.exercise, lang),
            exercise: deal.exercise,
            debt: deal.debt,
            unit: deal.exercise === 'plank' ? 'sec' : 'reps',
            missedDate: findLastMissedDate(deal),
          }));
          setDebtPopup(info);
        }
      })();

      let sub;
      if (Pedometer) {
        (async () => {
          try {
            const available = await Pedometer.isAvailableAsync();
            if (available) {
              const end = new Date();
              const start = new Date();
              start.setHours(0, 0, 0, 0);
              const result = await Pedometer.getStepCountAsync(start, end);
              if (result) setSteps(result.steps);
              sub = Pedometer.watchStepCount(r => {
                setSteps(prev => (prev || 0) + r.steps);
              });
            }
          } catch (e) {}
        })();
      }

      return () => { if (sub) sub.remove(); };
    }, [])
  );

  async function dismissDebt() {
    if (debtPopup) {
      for (const item of debtPopup) {
        await markDebtShown(`${item.exercise}:${item.debt}`);
      }
    }
    setDebtPopup(null);
  }

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
        <DualRings deals={deals} C={C} lang={lang} rtl={rtl} />

        <SummaryRows deals={deals} C={C} lang={lang} rtl={rtl} />

        {steps !== null && (
          <View style={[styles.stepsCard, { backgroundColor: C.bg2, borderColor: C.cardBorder }]}>
            <View style={[styles.stepsRow, rtl && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.stepsIconRing, { backgroundColor: C.accentCont }]}>
                <Ionicons name="footsteps" size={22} color={C.accent} />
              </View>
              <View style={rtl ? { alignItems: 'flex-end' } : {}}>
                <Text style={[styles.stepsCount, { color: C.label }]}>
                  {steps.toLocaleString()}
                </Text>
                <Text style={[styles.stepsLabel, { color: C.label2 }]}>
                  {t('stepsToday', lang)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {deals.map((deal, index) => (
          <DealCard
            key={deal.exercise}
            deal={deal}
            ringIndex={index}
            onLog={() => router.push({ pathname: '/log', params: { exercise: deal.exercise } })}
          />
        ))}
      </ScrollView>

      <Modal visible={!!debtPopup} transparent animationType="fade" onRequestClose={dismissDebt}>
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
              onPress={dismissDebt}
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
  content: { padding: 20, gap: 16, paddingBottom: 110 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  stepsCard: {
    borderRadius: 16, padding: 16, borderWidth: 1,
  },
  stepsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  stepsIconRing: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  stepsCount: { fontSize: 24, fontWeight: '700' },
  stepsLabel: { fontSize: 13 },
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
