import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/ThemeContext';
import { getDeal } from '../src/utils/storage';
import { EXERCISES, exName, isTimerExercise } from '../src/utils/exercises';
import { dealLogged, dealDue, addLogToDeal } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';
import ProgressRing from '../src/components/ProgressRing';

export default function LogScreen() {
  const { exercise } = useLocalSearchParams();
  const router = useRouter();
  const { C, lang, rtl } = useTheme();
  const deal = getDeal(exercise);
  const ex = EXERCISES[exercise];
  const name = exName(exercise, lang);
  const useTimer = isTimerExercise(exercise);

  const [reps, setReps] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [targetReached, setTargetReached] = useState(false);
  const intervalRef = useRef(null);

  const logged = deal ? dealLogged(deal) : 0;
  const due = deal ? dealDue(deal) : 0;
  const target = deal ? deal.dailyTarget : 0;

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  function changeReps(delta) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReps(prev => Math.max(0, Math.min(500, prev + delta)));
  }

  function editManual() {
    Alert.prompt(t('enterAmount', lang), '', [
      { text: t('cancel', lang), style: 'cancel' },
      { text: 'OK', onPress: val => {
        const n = parseInt(val);
        if (!isNaN(n) && n >= 0 && n <= 500) {
          setReps(n);
          if (useTimer) setSeconds(n);
        }
      }},
    ], 'plain-text', String(useTimer ? seconds : reps), 'number-pad');
  }

  function toggleTimer() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (timerRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTimerRunning(false);
      setReps(seconds);
    } else {
      setTimerRunning(true);
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          setReps(next);
          if (next >= target && !targetReached) {
            setTargetReached(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          return next;
        });
      }, 1000);
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  async function handleSave() {
    if (reps <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addLogToDeal(exercise, reps);
    router.back();
  }

  if (!deal) return null;

  const timerPct = target > 0 ? Math.min(1, seconds / target) : 0;
  const timerColor = targetReached ? C.green : C.ring1;

  return (
    <View style={[st.container, { backgroundColor: C.bg2, direction: rtl ? 'rtl' : 'ltr' }]}>
      <View style={[st.handle, { backgroundColor: C.bg4 }]} />

      <View style={st.headerRow}>
        <Text style={[st.title, { color: C.label }, rtl && st.rtlText]}>
          {t('logWorkout', lang)} {name}
        </Text>
        <Text style={[st.sub, { color: C.label2 }, rtl && st.rtlText]}>
          {logged > 0
            ? `${logged} ${t('done', lang)} — ${Math.max(0, due - logged)} ${ex.unit} ${t('remaining', lang)}`
            : `${t('goal', lang)}: ${due} ${ex.unit}`}
        </Text>
      </View>

      {useTimer ? (
        <View style={st.timerSection}>
          <ProgressRing
            size={200} strokeWidth={12}
            progress={timerPct} color={timerColor}
            centerText={formatTime(seconds)}
            centerColor={targetReached ? C.green : C.ring1}
          />
          <TouchableOpacity
            style={[st.timerBtn, { backgroundColor: timerRunning ? C.red : C.accent }]}
            onPress={toggleTimer} activeOpacity={0.75}
          >
            <Ionicons name={timerRunning ? 'stop' : 'play'} size={22} color="#fff" />
            <Text style={st.timerBtnText}>
              {timerRunning ? t('stop', lang) : seconds > 0 ? t('resume', lang) : t('start', lang)}
            </Text>
          </TouchableOpacity>
          {!timerRunning && (
            <TouchableOpacity onPress={editManual} activeOpacity={0.7}>
              <Text style={[st.manualLink, { color: C.accent }]}>{t('orManual', lang)}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={st.repsSection}>
          <View style={st.repsControls}>
            <TouchableOpacity style={[st.repsBtn, { backgroundColor: C.bg3 }]} onPress={() => changeReps(-1)}>
              <Text style={[st.repsBtnText, { color: C.label }]}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={editManual}>
              <Text style={[st.repsDisplay, { color: C.accent }]}>{reps}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.repsBtn, { backgroundColor: C.bg3 }]} onPress={() => changeReps(1)}>
              <Text style={[st.repsBtnText, { color: C.label }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[st.actions, { direction: 'ltr' }]}>
        <TouchableOpacity style={[st.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave} activeOpacity={0.75}>
          <Text style={st.saveBtnText}>{t('save', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[st.cancelBtn, { backgroundColor: C.bg3 }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[st.cancelBtnText, { color: C.label2 }]}>{t('cancel', lang)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40,
    alignItems: 'center', gap: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    marginTop: 12, marginBottom: 4,
  },
  headerRow: { width: '100%' },
  title: { fontSize: 20, fontWeight: '500' },
  sub: { fontSize: 14, marginTop: 4 },
  rtlText: { writingDirection: 'rtl', textAlign: 'right' },
  repsSection: { flex: 1, justifyContent: 'center' },
  repsControls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  repsBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  repsBtnText: { fontSize: 32 },
  repsDisplay: {
    fontSize: 88, fontWeight: '700', letterSpacing: -5,
    textAlign: 'center', minWidth: 120,
  },
  timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  timerBtn: {
    width: '100%',
    borderRadius: 50, paddingVertical: 18, paddingHorizontal: 32,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  timerBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  manualLink: { fontSize: 15, fontWeight: '500', paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  saveBtn: {
    flex: 1,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    flex: 1,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600' },
});
