import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { EXERCISES, exName } from '../utils/exercises';
import { dealLogged, dealDue, dealDone, getDealStreak, getTimeLeft } from '../utils/debtEngine';
import { getLang } from '../utils/storage';
import { t } from '../utils/translations';
import ProgressRing from './ProgressRing';

export default function DealCard({ deal, onLog }) {
  const lang = getLang();
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

  const ringColor = done ? COLORS.green : debt > 0 ? COLORS.orange : COLORS.accent;

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  useEffect(() => {
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {streak > 1 && (
          <Text style={styles.streak}>{streak} {t('days', lang)} \u{1F525}</Text>
        )}
      </View>

      <ProgressRing
        size={140} strokeWidth={14}
        progress={pct} color={ringColor}
        centerText={done ? '✓' : String(due)}
        centerColor={done ? COLORS.green : COLORS.label}
        subText={done ? t('doneToday', lang) : t('remaining', lang)}
        subText2={!done ? `${logged} / ${total}` : ''}
      />

      {!done && (
        <Text style={styles.countdown}>
          {timeLeft.h}h {timeLeft.m}m {t('daysLeft', lang)}
        </Text>
      )}

      <View style={styles.chips}>
        <View style={styles.chip}>
          <Text style={styles.chipVal}>{target}</Text>
          <Text style={styles.chipKey}>{t('goal', lang)}</Text>
        </View>
        {debt > 0 && (
          <View style={styles.chip}>
            <Text style={[styles.chipVal, { color: COLORS.orange }]}>{debt}</Text>
            <Text style={styles.chipKey}>{t('debt', lang)}</Text>
          </View>
        )}
        <View style={styles.chip}>
          <Text style={[styles.chipVal, { color: COLORS.green }]}>{logged}</Text>
          <Text style={styles.chipKey}>{t('doneLbl', lang)}</Text>
        </View>
      </View>

      {!done && (
        <TouchableOpacity style={styles.cta} onPress={onLog} activeOpacity={0.75}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.ctaText}>{t('logWorkout', lang)} {name}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bg2,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: { fontSize: 16, fontWeight: '600', color: COLORS.label },
  streak: { fontSize: 12, color: COLORS.label2 },
  countdown: { fontSize: 12, color: COLORS.label3 },
  chips: { flexDirection: 'row', gap: 12 },
  chip: {
    backgroundColor: COLORS.bg2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 2,
  },
  chipVal: { fontSize: 22, fontWeight: '700', color: COLORS.label },
  chipKey: { fontSize: 10, color: COLORS.label2, fontWeight: '500', textTransform: 'uppercase' },
  cta: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 50,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
