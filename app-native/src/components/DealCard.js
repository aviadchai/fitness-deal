import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { EXERCISES, exName } from '../utils/exercises';
import { dealLogged, dealDue, dealDone, getDealStreak, getTimeLeft } from '../utils/debtEngine';
import { t } from '../utils/translations';
import ProgressRing from './ProgressRing';

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
  const total = target + debt;
  const pct = total > 0 ? Math.min(1, logged / total) : 1;

  const dealRingColor = RING_COLORS[ringIndex % RING_COLORS.length];
  const ringColor = done ? C.green : debt > 0 ? C.accent : dealRingColor;

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 30000);
    return () => clearInterval(iv);
  }, []);

  const s = makeStyles(C);

  return (
    <View style={[s.card, rtl && { direction: 'rtl' }]}>
      <View style={[s.header, rtl && { flexDirection: 'row-reverse' }]}>
        <View style={[s.headerLeft, rtl && { flexDirection: 'row-reverse' }]}>
          <View style={[s.ringDot, { backgroundColor: dealRingColor }]} />
          <Text style={[s.title, rtl && { writingDirection: 'rtl', textAlign: 'right' }]}>{name}</Text>
        </View>
        {streak > 1 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={s.streak}>{streak} {t('days', lang)}</Text>
            <Ionicons name="flame" size={14} color={C.orange} />
          </View>
        )}
      </View>

      <ProgressRing
        size={140} strokeWidth={14}
        progress={pct} color={ringColor}
        centerText={done ? '✓' : String(due)}
        centerColor={done ? C.green : C.label}
        subText={done ? t('doneToday', lang) : t('remaining', lang)}
        subText2={!done ? `${logged} / ${total}` : ''}
      />

      {!done && (
        <Text style={s.countdown}>
          {timeLeft.h}h {timeLeft.m}m {t('daysLeft', lang)}
        </Text>
      )}

      <View style={s.chips}>
        <View style={s.chip}>
          <Text style={s.chipVal}>{target}</Text>
          <Text style={s.chipKey}>{t('goal', lang)}</Text>
        </View>
        {debt > 0 && (
          <View style={s.chip}>
            <Text style={[s.chipVal, { color: C.accent }]}>{debt}</Text>
            <Text style={s.chipKey}>{t('debt', lang)}</Text>
          </View>
        )}
        <View style={s.chip}>
          <Text style={[s.chipVal, { color: C.green }]}>{logged}</Text>
          <Text style={s.chipKey}>{t('doneLbl', lang)}</Text>
        </View>
      </View>

      {!done && (
        <TouchableOpacity style={s.cta} onPress={onLog} activeOpacity={0.75}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.ctaText}>{t('logWorkout', lang)} {name}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.bg2,
      borderRadius: 20,
      padding: 22,
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: C.cardBorder,
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
    title: { fontSize: 16, fontWeight: '600', color: C.label },
    streak: { fontSize: 12, color: C.label2 },
    countdown: { fontSize: 12, color: C.label3 },
    chips: { flexDirection: 'row', gap: 12 },
    chip: {
      backgroundColor: C.bg3,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 18,
      alignItems: 'center',
      gap: 2,
    },
    chipVal: { fontSize: 22, fontWeight: '700', color: C.label },
    chipKey: { fontSize: 10, color: C.label2, fontWeight: '500', textTransform: 'uppercase' },
    cta: {
      width: '100%',
      backgroundColor: C.accent,
      borderRadius: 50,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
