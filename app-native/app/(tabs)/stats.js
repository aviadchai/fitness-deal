import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/theme';
import { activeDeals, getLang } from '../../src/utils/storage';
import { EXERCISES, exName } from '../../src/utils/exercises';
import { todayStr, addDays, daysBetween, getDealStreak, getDealTotalReps, getDealDayStatus } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';
import ProgressRing from '../../src/components/ProgressRing';

export default function StatsScreen() {
  const [deals, setDeals] = useState([]);
  const [selected, setSelected] = useState(null);
  const lang = getLang();

  useFocusEffect(
    useCallback(() => {
      const d = activeDeals();
      setDeals(d);
      if (d.length > 0 && (!selected || !d.find(x => x.exercise === selected))) {
        setSelected(d[0].exercise);
      }
    }, [])
  );

  const deal = deals.find(d => d.exercise === selected);
  if (!deal) return <View style={styles.container} />;

  const ex = EXERCISES[deal.exercise];
  const unit = ex.unit;
  const target = deal.dailyTarget;
  const totalReps = getDealTotalReps(deal);
  const { current: streak, best: bestStreak } = getDealStreak(deal);
  const debt = deal.debt || 0;
  const tod = todayStr();
  const daysSinceStart = Math.max(1, daysBetween(deal.startDate, tod));
  const completedDays = Object.keys(deal.logs || {})
    .filter(d => d >= deal.startDate && d <= tod && (deal.logs[d] || 0) >= target).length;
  const completionRate = Math.round(completedDays / daysSinceStart * 100);
  const totalCal = Math.round(totalReps * (ex.calPerUnit || 0));
  const todayCal = Math.round(((deal.logs && deal.logs[tod]) || 0) * (ex.calPerUnit || 0));

  const heroColor = completionRate >= 80 ? COLORS.green : completionRate >= 40 ? COLORS.orange : COLORS.accent;
  const streakPct = bestStreak > 0 ? Math.min(100, Math.round(streak / bestStreak * 100)) : (streak > 0 ? 100 : 0);
  const fireEmoji = streak >= 3 ? '🔥' : streak >= 1 ? '💪' : '😴';

  const last30 = [];
  for (let i = 29; i >= 0; i--) last30.push(addDays(tod, -i));
  const max30 = Math.max(...last30.map(d => (deal.logs && deal.logs[d]) || 0), target);

  const muscles = (ex.muscles || '').split(',').map(m => m.trim());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {deals.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {deals.map(d => (
            <TouchableOpacity
              key={d.exercise}
              style={[styles.tab, d.exercise === selected && styles.tabActive]}
              onPress={() => setSelected(d.exercise)}
            >
              <Text style={[styles.tabText, d.exercise === selected && styles.tabTextActive]}>
                {exName(d.exercise, lang)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Hero card */}
      <View style={styles.card}>
        <View style={styles.heroRow}>
          <ProgressRing
            size={120} strokeWidth={10}
            progress={completionRate / 100} color={heroColor}
            centerText={`${completionRate}%`}
            centerColor={heroColor}
          />
          <View style={styles.heroInfo}>
            <View style={styles.heroStat}>
              <Text style={styles.heroNum}>{totalReps.toLocaleString()}</Text>
              <Text style={styles.heroUnit}>{t('totalUnit', lang)} {unit}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroNum, { color: COLORS.orange }]}>{totalCal.toLocaleString()}</Text>
              <Text style={styles.heroUnit}>{t('caloriesBurned', lang)}</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroNum, { color: COLORS.accent }]}>{todayCal}</Text>
              <Text style={styles.heroUnit}>{t('kcalToday', lang)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Streak */}
      <View style={styles.card}>
        <View style={styles.streakRow}>
          <Text style={styles.streakFire}>{fireEmoji}</Text>
          <View style={styles.streakInfo}>
            <View style={styles.streakTop}>
              <Text style={styles.streakNum}>{streak}</Text>
              <Text style={styles.streakLbl}>{t('dayStreak', lang)}</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${streakPct}%` }]} />
            </View>
            <Text style={styles.streakBest}>{t('best', lang)}: {bestStreak} {t('days', lang)}</Text>
          </View>
        </View>
      </View>

      {/* 30-day chart */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('progress30', lang)}</Text>
        <View style={styles.chart}>
          {last30.map((d, i) => {
            const v = (deal.logs && deal.logs[d]) || 0;
            const h = max30 > 0 ? Math.max(4, Math.round((v / max30) * 100)) : 4;
            const color = v >= target ? COLORS.green : v > 0 ? COLORS.orange : COLORS.bg4;
            return (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.bar, { height: `${h}%`, backgroundColor: color }]} />
              </View>
            );
          })}
        </View>
      </View>

      {/* Muscles */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('musclesWorked', lang)}</Text>
        <View style={styles.musclesWrap}>
          {muscles.map(m => (
            <View key={m} style={styles.muscleTag}>
              <Text style={styles.muscleText}>{'💪'} {m}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Debt banner */}
      {debt > 0 && (
        <View style={styles.debtBanner}>
          <Text style={styles.debtNum}>{debt}</Text>
          <Text style={styles.debtInfo}>{t('openDebtLbl', lang)}: {debt} {unit}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  tabs: { flexGrow: 0 },
  tab: {
    backgroundColor: COLORS.bg2, borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 8,
    marginRight: 8, borderWidth: 2, borderColor: 'transparent',
  },
  tabActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentCont },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.label2 },
  tabTextActive: { color: COLORS.label },
  card: { backgroundColor: COLORS.bg2, borderRadius: 20, padding: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  heroInfo: { flex: 1, gap: 16 },
  heroStat: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heroNum: { fontSize: 28, fontWeight: '700', color: COLORS.label, letterSpacing: -1 },
  heroUnit: { fontSize: 13, color: COLORS.label2 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  streakFire: { fontSize: 36 },
  streakInfo: { flex: 1, gap: 8 },
  streakTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  streakNum: { fontSize: 28, fontWeight: '700', color: COLORS.label, letterSpacing: -1 },
  streakLbl: { fontSize: 13, color: COLORS.label2 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: COLORS.bg4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #F59E0B, #22C55E)' },
  streakBest: { fontSize: 11, color: COLORS.label3 },
  sectionLabel: { fontSize: 11, color: COLORS.label2, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 2 },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 2 },
  musclesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  muscleTag: {
    backgroundColor: COLORS.accentCont, borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 14,
  },
  muscleText: { fontSize: 13, fontWeight: '500', color: COLORS.accent },
  debtBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.25)',
    borderRadius: 16, padding: 16,
  },
  debtNum: { fontSize: 32, fontWeight: '700', color: COLORS.orange, letterSpacing: -1.5 },
  debtInfo: { flex: 1, fontSize: 14, color: COLORS.label2 },
});
