import { useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/ThemeContext';
import { getData, save, activeDeals } from '../src/utils/storage';
import { EXERCISES, exName } from '../src/utils/exercises';
import { todayStr } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';

export default function AddChallengeScreen() {
  const router = useRouter();
  const { C, lang, rtl } = useTheme();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [target, setTarget] = useState(0);
  const [penalty, setPenalty] = useState('double');
  const [pctValue] = useState(20);

  const DATA = getData();
  const existingExercises = new Set((DATA.deals || []).filter(d => d.active).map(d => d.exercise));
  const available = Object.keys(EXERCISES).filter(ex => !existingExercises.has(ex));

  function selectExercise(ex) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(ex);
    setTarget(EXERCISES[ex].defaultTarget);
    setStep(1);
  }

  function changeTarget(delta) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTarget(prev => Math.max(1, Math.min(200, prev + delta)));
  }

  async function confirm() {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!DATA.deals) DATA.deals = [];
    DATA.deals.push({
      exercise: selected,
      dailyTarget: target,
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
    await save();
    router.back();
  }

  if (available.length === 0) {
    return (
      <View style={[s.container, { backgroundColor: C.bg }]}>
        <View style={[s.handle, { backgroundColor: C.bg4 }]} />
        <View style={s.emptyWrap}>
          <Ionicons name="checkmark-circle" size={48} color={C.green} />
          <Text style={[s.emptyText, { color: C.label2 }]}>
            {lang === 'he' ? 'כל התרגילים כבר פעילים' : 'All exercises are active'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: C.bg2, direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={[s.handle, { backgroundColor: C.bg4 }]} />

      {step === 0 && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={[s.title, { color: C.label }, rtl && s.rtlText]}>{t('selectExercise', lang)}</Text>
          <View style={s.exerciseList}>
            {available.map(ex => (
              <TouchableOpacity
                key={ex}
                style={[s.exerciseCard, { backgroundColor: C.bg3 }]}
                onPress={() => selectExercise(ex)}
                activeOpacity={0.75}
              >
                <View style={[s.ecRing, { backgroundColor: C.accentCont }]}>
                  <Ionicons name={EXERCISES[ex].icon} size={24} color={C.accent} />
                </View>
                <Text style={[s.ecName, { color: C.label }, rtl && s.rtlText]}>{exName(ex, lang)}</Text>
                <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={20} color={C.label3} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {step === 1 && selected && (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={[s.title, { color: C.label }, rtl && s.rtlText]}>
            {t('setDailyTarget', lang)} — {exName(selected, lang)}
          </Text>
          <View style={s.targetSection}>
            <View style={s.stepper}>
              <TouchableOpacity style={[s.stepBtn, { backgroundColor: C.bg3 }]} onPress={() => changeTarget(-5)}>
                <Text style={[s.stepBtnText, { color: C.label }]}>-</Text>
              </TouchableOpacity>
              <Text style={[s.targetVal, { color: C.accent }]}>{target}</Text>
              <TouchableOpacity style={[s.stepBtn, { backgroundColor: C.bg3 }]} onPress={() => changeTarget(5)}>
                <Text style={[s.stepBtnText, { color: C.label }]}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[s.unitLabel, { color: C.label2 }]}>{EXERCISES[selected].unit}</Text>
          </View>

          <Text style={[s.title, { color: C.label, marginTop: 28 }, rtl && s.rtlText]}>
            {t('choosePenalty', lang)}
          </Text>
          <TouchableOpacity
            style={[s.penCard, { backgroundColor: C.bg3 }, penalty === 'accumulate' && { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accentCont }]}
            onPress={() => setPenalty('accumulate')}
          >
            <Text style={[s.penTitle, { color: C.label }, rtl && s.rtlText]}>{t('accumulateTitle', lang)}</Text>
            <Text style={[s.penDesc, { color: C.label2 }, rtl && s.rtlText]}>{t('accumulateDesc', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.penCard, { backgroundColor: C.bg3 }, penalty === 'double' && { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accentCont }]}
            onPress={() => setPenalty('double')}
          >
            <Text style={[s.penTitle, { color: C.label }, rtl && s.rtlText]}>{t('doubleTitle', lang)}</Text>
            <Text style={[s.penDesc, { color: C.label2 }, rtl && s.rtlText]}>{t('doubleDesc', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.penCard, { backgroundColor: C.bg3 }, penalty === 'percent' && { borderColor: C.accent, borderWidth: 2, backgroundColor: C.accentCont }]}
            onPress={() => setPenalty('percent')}
          >
            <Text style={[s.penTitle, { color: C.label }, rtl && s.rtlText]}>{t('compoundTitle', lang)}</Text>
            <Text style={[s.penDesc, { color: C.label2 }, rtl && s.rtlText]}>{t('compoundDesc', lang)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.confirmBtn, { backgroundColor: C.accent }]} onPress={confirm} activeOpacity={0.75}>
            <Text style={s.confirmText}>{t('confirm', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(0)}>
            <Text style={[s.backLink, { color: C.accent }]}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    marginTop: 12, marginBottom: 4, alignSelf: 'center',
  },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: 16 },
  exerciseList: { gap: 10 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16,
  },
  ecRing: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  ecName: { flex: 1, fontSize: 17, fontWeight: '500' },
  targetSection: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 28 },
  targetVal: { fontSize: 64, fontWeight: '700', minWidth: 100, textAlign: 'center' },
  unitLabel: { fontSize: 14 },
  penCard: {
    borderRadius: 14, padding: 16, borderWidth: 2, borderColor: 'transparent',
  },
  penTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  penDesc: { fontSize: 13, lineHeight: 20 },
  confirmBtn: {
    borderRadius: 50, paddingVertical: 16, alignItems: 'center', marginTop: 16,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { fontSize: 16, textAlign: 'center', paddingVertical: 12 },
});
