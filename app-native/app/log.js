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
        if (!isNaN(n) && n >= 0 && n <= 500) setReps(n);
      }},
    ], 'plain-text', String(reps), 'number-pad');
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

  const s = makeStyles(C, rtl);

  return (
    <View style={s.container}>
      <View style={s.handle} />

      <View style={s.headerRow}>
        <View>
          <Text style={[s.title, rtl && s.rtlText]}>{t('logWorkout', lang)} {name}</Text>
          <Text style={[s.sub, rtl && s.rtlText]}>
            {logged > 0
              ? `${logged} ${t('done', lang)} — ${Math.max(0, due - logged)} ${ex.unit} ${t('remaining', lang)}`
              : `${t('goal', lang)}: ${due} ${ex.unit}`}
          </Text>
        </View>
      </View>

      {useTimer ? (
        <View style={s.timerSection}>
          <ProgressRing
            size={200} strokeWidth={12}
            progress={timerPct} color={timerColor}
            centerText={formatTime(seconds)}
            centerColor={targetReached ? C.green : C.ring1}
          />
          <TouchableOpacity
            style={[s.timerBtn, timerRunning && s.timerBtnRunning]}
            onPress={toggleTimer} activeOpacity={0.75}
          >
            <Text style={s.timerBtnText}>
              {timerRunning ? t('stop', lang) : seconds > 0 ? t('resume', lang) : t('start', lang)}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.repsSection}>
          <View style={s.repsControls}>
            <TouchableOpacity style={s.repsBtn} onPress={() => changeReps(-1)}>
              <Text style={s.repsBtnText}>{'−'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={editManual}>
              <Text style={s.repsDisplay}>{reps}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.repsBtn} onPress={() => changeReps(1)}>
              <Text style={s.repsBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={s.actions}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.75}>
          <Text style={s.saveBtnText}>{t('save', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={s.cancelBtnText}>{t('cancel', lang)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(C, rtl) {
  return StyleSheet.create({
    container: {
      flex: 1, backgroundColor: C.bg2,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingBottom: 40,
      alignItems: 'center', gap: 16,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: C.bg4, marginTop: 12, marginBottom: 4,
    },
    headerRow: { width: '100%' },
    title: { fontSize: 20, fontWeight: '500', color: C.label },
    sub: { fontSize: 14, color: C.label2, marginTop: 4 },
    rtlText: { writingDirection: 'rtl', textAlign: 'right' },
    repsSection: { flex: 1, justifyContent: 'center' },
    repsControls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
    repsBtn: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: C.bg3,
      alignItems: 'center', justifyContent: 'center',
    },
    repsBtnText: { fontSize: 32, color: C.label },
    repsDisplay: {
      fontSize: 88, fontWeight: '700', letterSpacing: -5,
      color: C.accent, textAlign: 'center', minWidth: 120,
    },
    timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
    timerBtn: {
      width: '100%', backgroundColor: C.accent,
      borderRadius: 50, paddingVertical: 16, alignItems: 'center',
    },
    timerBtnRunning: { backgroundColor: C.red },
    timerBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    actions: { flexDirection: 'row', gap: 10, width: '100%' },
    saveBtn: {
      flex: 1, backgroundColor: C.accent,
      borderRadius: 50, paddingVertical: 16, alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    cancelBtn: {
      flex: 1, backgroundColor: C.bg3,
      borderRadius: 50, paddingVertical: 16, alignItems: 'center',
    },
    cancelBtnText: { color: C.label2, fontSize: 16, fontWeight: '600' },
  });
}
