import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/ThemeContext';
import { activeDeals } from '../../src/utils/storage';
import { EXERCISES } from '../../src/utils/exercises';
import { todayStr, addDays, getDealDayStatus } from '../../src/utils/debtEngine';
import { t } from '../../src/utils/translations';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarScreen() {
  const { C, lang, rtl } = useTheme();
  const [deals, setDeals] = useState([]);
  const [selected, setSelected] = useState(null);

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
  if (!deal) return <View style={[styles.container, { backgroundColor: C.bg }]} />;

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
    <ScrollView
      style={[styles.container, { backgroundColor: C.bg, direction: rtl ? 'rtl' : 'ltr' }]}
      contentContainerStyle={styles.content}
    >
      {deals.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {deals.map(d => {
            const isActive = d.exercise === selected;
            const name = lang === 'he' ? EXERCISES[d.exercise].name : EXERCISES[d.exercise].nameEn;
            return (
              <TouchableOpacity
                key={d.exercise}
                style={[
                  styles.tab,
                  { backgroundColor: C.bg2, borderColor: 'transparent' },
                  isActive && { borderColor: C.accent, backgroundColor: C.accentCont },
                ]}
                onPress={() => setSelected(d.exercise)}
              >
                <Text style={[
                  styles.tabText,
                  { color: C.label2 },
                  isActive && { color: C.label },
                ]}>
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
            <Text style={[styles.monthLabel, { color: C.label }]}>{mLabel} {mYear}</Text>
            <View style={styles.weekLabels}>
              {WEEK_DAYS.map((d, i) => (
                <Text key={i} style={[styles.weekDay, { color: C.label3 }]}>{d}</Text>
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

                let fillColor = 'transparent';
                let fillHeight = '0%';
                if (isComplete) {
                  fillColor = C.ring1;
                  fillHeight = '100%';
                } else if (fillPct > 0) {
                  fillColor = C.ring3;
                  fillHeight = `${Math.round(fillPct * 100)}%`;
                } else if (isMissed) {
                  fillColor = C.bg4;
                  fillHeight = '100%';
                }

                const textColor = isComplete ? '#fff'
                  : fillPct > 0.5 ? '#fff'
                  : isFuture ? C.label3
                  : isMissed ? C.label3
                  : C.label2;

                return (
                  <View key={i} style={styles.cellOuter}>
                    <View style={[
                      styles.cell,
                      { backgroundColor: C.bg2 },
                      isFuture && { opacity: 0.3 },
                      isToday && {
                        borderWidth: 2,
                        borderColor: C.accent,
                        shadowColor: C.accent,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 8,
                        elevation: 6,
                      },
                    ]}>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  tabs: { marginBottom: 16, flexGrow: 0 },
  tab: {
    borderRadius: 50,
    paddingHorizontal: 18, paddingVertical: 8,
    marginRight: 8, borderWidth: 2,
  },
  tabText: { fontSize: 14, fontWeight: '500' },
  month: { marginBottom: 32 },
  monthLabel: { fontSize: 18, fontWeight: '600', marginBottom: 14, letterSpacing: 0.5 },
  weekLabels: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, fontSize: 11, textAlign: 'center', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellOuter: { width: '14.28%', aspectRatio: 1, padding: 2, alignItems: 'center', justifyContent: 'center' },
  cell: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
