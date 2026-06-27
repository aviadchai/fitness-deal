import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../ThemeContext';
import { EXERCISES, exName, isTimerExercise } from '../utils/exercises';
import { dealLogged, dealDue, dealDone, getDealStreak, getTimeLeft } from '../utils/debtEngine';
import { t } from '../utils/translations';

function BreakdownRing({ size, strokeWidth, goal, debt, logged, C }) {
  const total = goal + debt;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const donePct = total > 0 ? Math.min(1, logged / total) : 1;
  const goalPct = total > 0 ? goal / total : 1;

  const doneArc = circumference * donePct;
  const goalArc = circumference * goalPct;
  const debtArc = circumference - goalArc;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={C.bg3} strokeWidth={strokeWidth}
          strokeOpacity={0.3}
        />
        {debt > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={C.orange} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${debtArc} ${circumference - debtArc}`}
            strokeDashoffset={-goalArc}
            strokeOpacity={0.5}
          />
        )}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={C.accent} strokeWidth={strokeWidth}
          strokeDasharray={`${goalArc} ${circumference - goalArc}`}
          strokeOpacity={0.25}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={donePct >= 1 ? C.green : C.accent} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${doneArc} ${circumference - doneArc}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: size * 0.22, fontWeight: '700', color: donePct >= 1 ? C.green : C.label }}>
          {donePct >= 1 ? '✓' : `${Math.round(donePct * 100)}%`}
        </Text>
      </View>
    </View>
  );
}

export default function DealCard({ deal, onLog, ringIndex = 0 }) {
  const { C, lang, rtl } = useTheme();

  const RING_COLORS = [C.ring1, C.ring2, C.ring3];

  const ex = EXERCISES[deal.exercise];
  const name = exName(deal.exercise, lang);
  const target = deal.dailyTarget;
  const logged = dealLogged(deal);
  const debt = deal.debt || 0;
  const due = dealDue(deal);
  const done = dealDone(deal);
  const { current: streak } = getDealStreak(deal);
  const isTimer = isTimerExercise(deal.exercise);

  const dealRingColor = RING_COLORS[ringIndex % RING_COLORS.length];

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 30000);
    return () => clearInterval(iv);
  }, []);

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <View style={[s.card, { backgroundColor: C.bg2, borderColor: C.cardBorder }, rtl && { direction: 'rtl' }]}>
      <View style={[s.header, rtl && { flexDirection: 'row-reverse' }]}>
        <View style={[s.headerLeft, rtl && { flexDirection: 'row-reverse' }]}>
          <View style={[s.ringDot, { backgroundColor: dealRingColor }]} />
          <Text style={[s.title, { color: C.label }, rtl && { writingDirection: 'rtl', textAlign: 'right' }]}>{name}</Text>
        </View>
        {streak > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[s.streak, { color: C.label2 }]}>{streak} {t('days', lang)}</Text>
            <Ionicons name="flame" size={14} color={C.orange} />
          </View>
        )}
      </View>

      <View style={[s.body, rtl && { flexDirection: 'row-reverse' }]}>
        <BreakdownRing
          size={110}
          strokeWidth={10}
          goal={target}
          debt={debt}
          logged={logged}
          C={C}
        />

        <View style={[s.statsCol, rtl && { alignItems: 'flex-end' }]}>
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: C.accent }]}>{isTimer ? fmtTime(target) : target}</Text>
            <Text style={[s.statKey, { color: C.label2 }]}>{t('goal', lang)}</Text>
          </View>
          {debt > 0 && (
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: C.orange }]}>{isTimer ? fmtTime(debt) : debt}</Text>
              <Text style={[s.statKey, { color: C.label2 }]}>{t('debt', lang)}</Text>
            </View>
          )}
          <View style={s.statItem}>
            <Text style={[s.statVal, { color: C.green }]}>{isTimer ? fmtTime(logged) : logged}</Text>
            <Text style={[s.statKey, { color: C.label2 }]}>{t('doneLbl', lang)}</Text>
          </View>
        </View>
      </View>

      {!done && (
        <Text style={[s.countdown, { color: C.label3 }]}>
          {timeLeft.h}h {timeLeft.m}m {t('daysLeft', lang)}
        </Text>
      )}

      {!done && (
        <TouchableOpacity style={[s.cta, { backgroundColor: C.accent }]} onPress={onLog} activeOpacity={0.75}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.ctaText}>{t('logWorkout', lang)} {name}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
    gap: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ringDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: { fontSize: 18, fontWeight: '600' },
  streak: { fontSize: 12 },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  statsCol: {
    flex: 1,
    gap: 10,
  },
  statItem: {
    gap: 2,
  },
  statVal: { fontSize: 20, fontWeight: '700' },
  statKey: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase' },
  countdown: { fontSize: 12, textAlign: 'center' },
  cta: {
    width: '100%',
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
