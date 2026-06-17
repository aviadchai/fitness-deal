import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/theme';
import { activeDeals, getLang } from '../../src/utils/storage';
import { EXERCISES } from '../../src/utils/exercises';
import { todayStr, addDays, getDealDayStatus } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
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

  const tod = todayStr();
  const days = [];
  for (let i = 89; i >= 0; i--) days.push(addDays(tod, -i));

  const months = {};
  days.forEach(d => {
    const m = d.substring(0, 7);
    if (!months[m]) months[m] = [];
    months[m].push(d);
  });

  const isTime = EXERCISES[deal.exercise].unit === 'sec';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {deals.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {deals.map(d => {
            const name = lang === 'he' ? EXERCISES[d.exercise].name : EXERCISES[d.exercise].nameEn;
            return (
              <TouchableOpacity
                key={d.exercise}
                style={[styles.tab, d.exercise === selected && styles.tabActive]}
                onPress={() => setSelected(d.exercise)}
              >
                <Text style={[styles.tabText, d.exercise === selected && styles.tabTextActive]}>
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.legend}>
        {[
          [t('done', lang), COLORS.green],
          [t('partial', lang), COLORS.orange],
          [t('missed', lang), COLORS.red],
          [t('today', lang), COLORS.accent],
        ].map(([label, color]) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      {Object.entries(months).reverse().map(([m, mDays]) => {
        const mLabel = new Date(mDays[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const mYear = mDays[0].substring(0, 4);
        const firstDow = new Date(mDays[0] + 'T12:00:00').getDay();
        const cells = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        mDays.forEach(d => cells.push(d));
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <View key={m} style={styles.month}>
            <Text style={styles.monthLabel}>{mLabel} {mYear}</Text>
            <View style={styles.weekLabels}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={i} style={styles.weekDay}>{d}</Text>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((d, i) => {
                if (!d) return <View key={i} style={styles.cell} />;
                const s = getDealDayStatus(deal, d);
                const logged = (deal.logs && deal.logs[d]) || 0;
                const dayNum = parseInt(d.substring(8));

                let label;
                if (logged > 0 && isTime) {
                  const mm = Math.floor(logged / 60), ss = logged % 60;
                  label = mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;
                } else if (logged > 0) {
                  label = String(logged);
                } else {
                  label = String(dayNum);
                }

                const cellStyle = {
                  complete: { borderColor: COLORS.accent, backgroundColor: 'rgba(59,130,246,0.1)' },
                  partial: { borderColor: COLORS.orange, backgroundColor: 'rgba(245,158,11,0.08)' },
                  missed: { backgroundColor: COLORS.bg3 },
                  today: { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
                  'today-partial': { borderColor: COLORS.accent, backgroundColor: COLORS.accent },
                  future: { backgroundColor: COLORS.bg2, opacity: 0.3 },
                  'no-deal': { backgroundColor: COLORS.bg2, opacity: 0.3 },
                }[s] || {};

                const textColor = s === 'today' || s === 'today-partial' ? '#fff'
                  : s === 'complete' ? COLORS.accent
                  : s === 'partial' ? COLORS.orange
                  : COLORS.label3;

                return (
                  <View key={i} style={[styles.cell, styles.cellBorder, cellStyle]}>
                    <Text style={[styles.cellText, { color: textColor }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 40 },
  tabs: { marginBottom: 16, flexGrow: 0 },
  tab: {
    backgroundColor: COLORS.bg2, borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 8,
    marginRight: 8, borderWidth: 2, borderColor: 'transparent',
  },
  tabActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentCont },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.label2 },
  tabTextActive: { color: COLORS.label },
  legend: { flexDirection: 'row', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 4 },
  legendText: { fontSize: 12, color: COLORS.label2 },
  month: { marginBottom: 32 },
  monthLabel: { fontSize: 18, fontWeight: '600', color: COLORS.label, marginBottom: 14, letterSpacing: 0.5 },
  weekLabels: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, fontSize: 11, color: COLORS.label3, textAlign: 'center', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellBorder: { borderRadius: 100, borderWidth: 2, borderColor: 'transparent', margin: 1 },
  cellText: { fontSize: 11, fontWeight: '600' },
});
