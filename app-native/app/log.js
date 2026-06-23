import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../src/theme';
import { getDeal, getLang } from '../src/utils/storage';
import { EXERCISES, exName, isTimerExercise } from '../src/utils/exercises';
import { dealLogged, dealDue, addLogToDeal } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';
import ProgressRing from '../src/components/ProgressRing';

export default function LogScreen() {
  const { exercise } = useLocalSearchParams();
  const router = useRouter();
  const lang = getLang();
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
  const timerColor = targetReached ? COLORS.green : COLORS.ring1;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{t('logWorkout', lang)} {name}</Text>
          <Text style={styles.sub}>
            {logged > 0
              ? `${logged} ${t('done', lang)} — ${Math.max(0, due - logged)} ${ex.unit} ${t('remaining', lang)}`
              : `${t('goal', lang)}: ${due} ${ex.unit}`}
          </Text>
        </View>
      </View>

      {useTimer ? (
        <View style={styles.timerSection}>
          <ProgressRing
            size={200} strokeWidth={12}
            progress={timerPct} color={timerColor}
            centerText={formatTime(seconds)}
            centerColor={targetReached ? COLORS.green : COLORS.ring1}
          />
          <TouchableOpacity
            style={[styles.timerBtn, timerRunning && styles.timerBtnRunning]}
            onPress={toggleTimer} activeOpacity={0.75}
          >
            <Text style={styles.timerBtnText}>
              {timerRunning ? t('stop', lang) : seconds > 0 ? t('resume', lang) : t('start', lang)}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.repsSection}>
          <View style={styles.repsControls}>
            <TouchableOpacity style={styles.repsBtn} onPress={() => changeReps(-1)}>
              <Text style={styles.repsBtnText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={editManual}>
              <Text style={styles.repsDisplay}>{reps}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.repsBtn} onPress={() => changeReps(1)}>
              <Text style={styles.repsBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.75}>
          <Text style={styles.saveBtnText}>{t('save', lang)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>{t('cancel', lang)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg2,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingBottom: 40,
    alignItems: 'center', gap: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: COLORS.bg4, marginTop: 12, marginBottom: 4,
  },
  headerRow: { width: '100%' },
  title: { fontSize: 20, fontWeight: '500', color: COLORS.label },
  sub: { fontSize: 14, color: COLORS.label2, marginTop: 4 },
  repsSection: { flex: 1, justifyContent: 'center' },
  repsControls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  repsBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.bg3,
    alignItems: 'center', justifyContent: 'center',
  },
  repsBtnText: { fontSize: 32, color: COLORS.label },
  repsDisplay: {
    fontSize: 88, fontWeight: '700', letterSpacing: -5,
    color: COLORS.accent, textAlign: 'center', minWidth: 120,
  },
  timerSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  timerBtn: {
    width: '100%', backgroundColor: COLORS.accent,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  timerBtnRunning: { backgroundColor: COLORS.red },
  timerBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  saveBtn: {
    flex: 1, backgroundColor: COLORS.accent,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.bg3,
    borderRadius: 50, paddingVertical: 16, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.label2, fontSize: 16, fontWeight: '600' },
});
