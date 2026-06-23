import { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../src/theme';
import { getData, save, getLang } from '../src/utils/storage';
import { EXERCISES, exName } from '../src/utils/exercises';
import { todayStr } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';

export default function OnboardingScreen() {
  const router = useRouter();
  const lang = getLang();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [targets, setTargets] = useState({});
  const [penalty, setPenalty] = useState('double');
  const [pctValue, setPctValue] = useState(20);

  const DATA = getData();
  const existingExercises = new Set((DATA.deals || []).filter(d => d.active).map(d => d.exercise));
  const available = Object.keys(EXERCISES).filter(ex => !existingExercises.has(ex));

  function toggleExercise(ex) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(selected);
    if (next.has(ex)) {
      next.delete(ex);
      const t2 = { ...targets };
      delete t2[ex];
      setTargets(t2);
    } else {
      next.add(ex);
      setTargets(prev => ({ ...prev, [ex]: EXERCISES[ex].defaultTarget }));
    }
    setSelected(next);
  }

  function changeTarget(ex, delta) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargets(prev => ({
      ...prev,
      [ex]: Math.max(1, Math.min(200, (prev[ex] || 0) + delta)),
    }));
  }

  function next() {
    if (step === 1 && selected.size === 0) return;
    setStep(s => s + 1);
  }

  async function signDeal() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!DATA.deals) DATA.deals = [];
    [...selected].forEach(ex => {
      DATA.deals.push({
        exercise: ex,
        dailyTarget: targets[ex],
        penaltyType: penalty,
        penaltyPercent: pctValue,
        startDate: todayStr(),
        active: true,
        createdAt: todayStr(),
        logs: {},
        debt: 0,
        lastProcessed: todayStr(),
        debtOverCap: false,
      });
    });
    await save();
    router.replace('/(tabs)');
  }

  if (step === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.iconRing}>
          <Ionicons name="shield-checkmark" size={48} color={COLORS.accent} />
        </View>
        <Text style={styles.bigTitle}>{t('obTitle', lang)}</Text>
        <Text style={styles.body}>{t('obBody', lang)}</Text>
        <Dots active={0} />
        <TouchableOpacity style={styles.primaryBtn} onPress={next}>
          <Text style={styles.primaryBtnText}>{t('letsGo', lang)} →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.iconRing}>
          <Ionicons name="pulse" size={48} color={COLORS.accent} />
        </View>
        <Text style={styles.bigTitle}>{t('chooseChallenges', lang)}</Text>
        <Text style={styles.subBody}>{t('pickOne', lang)}</Text>
        <View style={styles.exerciseRow}>
          {available.map(ex => (
            <TouchableOpacity
              key={ex}
              style={[styles.exerciseCard, selected.has(ex) && styles.exerciseCardSel]}
              onPress={() => toggleExercise(ex)}
            >
              <View style={styles.ecRing}>
                <Text style={styles.ecEmoji}>{EXERCISES[ex].emoji}</Text>
              </View>
              <Text style={styles.ecName}>{exName(ex, lang)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {[...selected].map(ex => (
          <View key={ex} style={styles.targetRow}>
            <Text style={styles.targetName}>{exName(ex, lang)}</Text>
            <View style={styles.stepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => changeTarget(ex, -5)}>
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.targetVal}>{targets[ex]}</Text>
              <TouchableOpacity style={styles.stepBtn} onPress={() => changeTarget(ex, 5)}>
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.unitLabel}>{EXERCISES[ex].unit}</Text>
          </View>
        ))}
        <Dots active={1} />
        <TouchableOpacity style={[styles.primaryBtn, selected.size === 0 && { opacity: 0.4 }]} onPress={next}>
          <Text style={styles.primaryBtnText}>{t('next', lang)} →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStep(0)}>
          <Text style={styles.backText}>{t('back', lang)}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (step === 2) {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <View style={styles.iconRing}>
          <Ionicons name="warning" size={48} color={COLORS.accent} />
        </View>
        <Text style={styles.bigTitle}>{t('missedDay', lang)}</Text>
        <TouchableOpacity
          style={[styles.penaltyCard, penalty === 'double' && styles.penaltyCardSel]}
          onPress={() => setPenalty('double')}
        >
          <Text style={styles.penTitle}>{t('doubleTitle', lang)}</Text>
          <Text style={styles.penDesc}>{t('doubleDesc', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.penaltyCard, penalty === 'percent' && styles.penaltyCardSel]}
          onPress={() => setPenalty('percent')}
        >
          <Text style={styles.penTitle}>{t('compoundTitle', lang)}</Text>
          <Text style={styles.penDesc}>{t('compoundDesc', lang)}</Text>
        </TouchableOpacity>
        <Dots active={2} />
        <TouchableOpacity style={styles.primaryBtn} onPress={next}>
          <Text style={styles.primaryBtnText}>{t('next', lang)} →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setStep(1)}>
          <Text style={styles.backText}>{t('back', lang)}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step 3 — summary + sign
  return (
    <View style={styles.screen}>
      <View style={styles.iconRing}>
        <Ionicons name="clipboard" size={48} color={COLORS.accent} />
      </View>
      <Text style={styles.bigTitle}>{t('yourDeal', lang)}</Text>
      <View style={styles.summaryCard}>
        {[...selected].map(ex => (
          <View key={ex} style={styles.summaryRow}>
            <Text style={styles.summaryKey}>{exName(ex, lang)}</Text>
            <Text style={styles.summaryVal}>{targets[ex]} {EXERCISES[ex].unit}</Text>
          </View>
        ))}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>{t('penalty', lang)}</Text>
          <Text style={styles.summaryVal}>
            {penalty === 'double' ? t('double', lang) : `${pctValue}%`}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryKey}>{t('starts', lang)}</Text>
          <Text style={styles.summaryVal}>{t('today', lang)}</Text>
        </View>
      </View>
      <Text style={styles.subBody}>{t('tapToSign', lang)}</Text>
      <TouchableOpacity style={styles.signBtn} onPress={signDeal}>
        <Ionicons name="checkmark" size={56} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Dots({ active }) {
  return (
    <View style={styles.dots}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
    padding: 28, gap: 20,
  },
  iconRing: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.accentCont,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  bigTitle: { fontSize: 26, fontWeight: '500', color: COLORS.label, textAlign: 'center' },
  body: { fontSize: 15, color: COLORS.label2, textAlign: 'center', lineHeight: 26 },
  subBody: { fontSize: 13, color: COLORS.label2, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.bg4 },
  dotActive: { width: 22, backgroundColor: COLORS.accent },
  primaryBtn: {
    width: '100%', backgroundColor: COLORS.accent,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backText: { color: COLORS.accent, fontSize: 16, paddingVertical: 12 },
  exerciseRow: { flexDirection: 'row', gap: 8, width: '100%' },
  exerciseCard: {
    flex: 1, backgroundColor: COLORS.bg2, borderWidth: 2, borderColor: 'transparent',
    borderRadius: 14, padding: 12, alignItems: 'center', gap: 8,
  },
  exerciseCardSel: { borderColor: COLORS.accent, backgroundColor: COLORS.accentCont },
  ecRing: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  ecEmoji: { fontSize: 22 },
  ecName: { fontSize: 12, fontWeight: '600', color: COLORS.label, textAlign: 'center' },
  targetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    backgroundColor: COLORS.bg2, borderRadius: 12, padding: 10, paddingHorizontal: 14,
  },
  targetName: { flex: 1, fontSize: 14, color: COLORS.label },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg3,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, color: COLORS.label },
  targetVal: { fontSize: 18, fontWeight: '700', color: COLORS.label, minWidth: 32, textAlign: 'center' },
  unitLabel: { fontSize: 12, color: COLORS.label3, minWidth: 42 },
  penaltyCard: {
    width: '100%', backgroundColor: COLORS.bg2, borderRadius: 14,
    padding: 16, borderWidth: 2, borderColor: 'transparent',
  },
  penaltyCardSel: { borderColor: COLORS.accent, backgroundColor: COLORS.accentCont },
  penTitle: { fontSize: 16, fontWeight: '600', color: COLORS.label, marginBottom: 4 },
  penDesc: { fontSize: 13, color: COLORS.label2, lineHeight: 20 },
  summaryCard: { width: '100%', backgroundColor: COLORS.bg2, borderRadius: 16, overflow: 'hidden' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.sep,
  },
  summaryKey: { fontSize: 15, color: COLORS.label2 },
  summaryVal: { fontSize: 15, fontWeight: '500', color: COLORS.label },
  signBtn: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 32, elevation: 12,
  },
});
