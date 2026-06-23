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

  const target = deal.dailyTarget;

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
                if (!d) return <View key={i} style={styles.cellOuter} />;
                const s = getDealDayStatus(deal, d);
                const logged = (deal.logs && deal.logs[d]) || 0;
                const dayNum = parseInt(d.substring(8));
                const fillPct = target > 0 ? Math.min(1, logged / target) : 0;
                const isToday = s === 'today' || s === 'today-partial';
                const isComplete = s === 'complete' || (isToday && logged >= target);
                const isMissed = s === 'missed';
                const isFuture = s === 'future' || s === 'no-deal';

                // Determine fill color and height
                let fillColor = 'transparent';
                let fillHeight = '0%';
                if (isComplete) {
                  fillColor = COLORS.ring1;
                  fillHeight = '100%';
                } else if (fillPct > 0) {
                  fillColor = COLORS.ring3;
                  fillHeight = `${Math.round(fillPct * 100)}%`;
                } else if (isMissed) {
                  fillColor = COLORS.bg4;
                  fillHeight = '100%';
                }

                const textColor = isComplete ? '#fff'
                  : fillPct > 0.5 ? '#fff'
                  : isFuture ? COLORS.label3
                  : isMissed ? COLORS.label3
                  : COLORS.label2;

                return (
                  <View key={i} style={styles.cellOuter}>
                    <View style={[
                      styles.cell,
                      isFuture && styles.cellFuture,
                      isToday && styles.cellToday,
                    ]}>
                      {/* Liquid fill */}
                      {fillHeight !== '0%' && (
                        <View
                          style={[
                            styles.cellFill,
                            {
                              height: fillHeight,
                              backgroundColor: fillColor,
                              opacity: isMissed ? 0.4 : 0.85,
                            },
                          ]}
                        />
                      )}
                      <Text style={[styles.cellText, { color: textColor, zIndex: 1 }]}>
                        {dayNum}
                      </Text>
                    </View>
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
  content: { padding: 16, paddingBottom: 100 },
  tabs: { marginBottom: 16, flexGrow: 0 },
  tab: {
    backgroundColor: COLORS.bg2, borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 8,
    marginRight: 8, borderWidth: 2, borderColor: 'transparent',
  },
  tabActive: { borderColor: COLORS.accent, backgroundColor: COLORS.accentCont },
  tabText: { fontSize: 14, fontWeight: '500', color: COLORS.label2 },
  tabTextActive: { color: COLORS.label },
  month: { marginBottom: 32 },
  monthLabel: { fontSize: 18, fontWeight: '600', color: COLORS.label, marginBottom: 14, letterSpacing: 0.5 },
  weekLabels: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, fontSize: 11, color: COLORS.label3, textAlign: 'center', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellOuter: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  cell: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: COLORS.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFuture: { backgroundColor: COLORS.bg2, opacity: 0.3 },
  cellToday: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  cellFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 0,
  },
  cellText: { fontSize: 11, fontWeight: '600', position: 'absolute' },
});
