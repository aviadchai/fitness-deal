import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
let CameraView = null;
try { CameraView = require('expo-camera').CameraView; } catch (e) {}
import { useTheme } from '../src/ThemeContext';
import { getDeal } from '../src/utils/storage';
import { EXERCISES, exName, isTimerExercise } from '../src/utils/exercises';
import { dealLogged, dealDue, addLogToDeal } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';
import ProgressRing from '../src/components/ProgressRing';

function TimePicker({ visible, onClose, onConfirm, initialSeconds, C, lang, rtl }) {
  const initMin = Math.floor((initialSeconds || 0) / 60);
  const initSec = (initialSeconds || 0) % 60;
  const [selMin, setSelMin] = useState(initMin);
  const [selSec, setSelSec] = useState(initSec);

  const ITEM_H = 44;
  const VISIBLE = 5;
  const CENTER = Math.floor(VISIBLE / 2);

  function WheelPicker({ count, value, onChange, label }) {
    const scrollRef = useRef(null);
    const items = Array.from({ length: count }, (_, i) => i);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: value * ITEM_H, animated: false });
      }
    }, [visible]);

    return (
      <View style={tp.wheelCol}>
        <Text style={[tp.wheelLabel, { color: C.label2 }]}>{label}</Text>
        <View style={[tp.wheelWrap, { height: ITEM_H * VISIBLE }]}>
          <View style={[tp.wheelHighlight, { top: ITEM_H * CENTER, backgroundColor: C.bg3 }]} />
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_H}
            decelerationRate="fast"
            contentContainerStyle={{ paddingVertical: ITEM_H * CENTER }}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
              onChange(Math.max(0, Math.min(count - 1, idx)));
            }}
          >
            {items.map(i => (
              <View key={i} style={[tp.wheelItem, { height: ITEM_H }]}>
                <Text style={[tp.wheelItemText, { color: i === value ? C.label : C.label3 }]}>
                  {String(i).padStart(2, '0')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={tp.overlay}>
        <View style={[tp.sheet, { backgroundColor: C.bg2, direction: rtl ? 'rtl' : 'ltr' }]}>
          <Text style={[tp.title, { color: C.label }]}>{t('setTime', lang)}</Text>
          <View style={tp.wheels}>
            <WheelPicker count={60} value={selMin} onChange={setSelMin} label={t('minutes', lang)} />
            <Text style={[tp.colon, { color: C.label }]}>:</Text>
            <WheelPicker count={60} value={selSec} onChange={setSelSec} label={t('seconds', lang)} />
          </View>
          <View style={tp.btns}>
            <TouchableOpacity
              style={[tp.confirmBtn, { backgroundColor: C.accent }]}
              onPress={() => onConfirm(selMin * 60 + selSec)}
            >
              <Text style={tp.confirmText}>{t('confirm', lang)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={[tp.cancelText, { color: C.label2 }]}>{t('cancel', lang)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const tp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  wheels: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colon: { fontSize: 32, fontWeight: '700', marginTop: 24 },
  wheelCol: { alignItems: 'center' },
  wheelLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  wheelWrap: { width: 70, overflow: 'hidden', borderRadius: 12 },
  wheelHighlight: { position: 'absolute', left: 0, right: 0, height: 44, borderRadius: 10 },
  wheelItem: { alignItems: 'center', justifyContent: 'center' },
  wheelItemText: { fontSize: 22, fontWeight: '600' },
  btns: { marginTop: 24, width: '100%', alignItems: 'center', gap: 12 },
  confirmBtn: { width: '100%', borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { fontSize: 16, fontWeight: '500', paddingVertical: 8 },
});

export default function LogScreen() {
  const { exercise } = useLocalSearchParams();
  const router = useRouter();
  const { C, lang, rtl } = useTheme();
  const deal = getDeal(exercise);
  const ex = EXERCISES[exercise];
  const name = exName(exercise, lang);
  const useTimer = isTimerExercise(exercise);
  const isPushups = exercise === 'pushups';

  const [reps, setReps] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [targetReached, setTargetReached] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
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

  function handleTimePickerConfirm(totalSec) {
    setShowTimePicker(false);
    setSeconds(totalSec);
    setReps(totalSec);
  }

  function cameraTap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReps(prev => prev + 1);
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

  if (cameraMode && CameraView) {
    return (
      <View style={[st.container, { backgroundColor: '#000' }]}>
        <CameraView style={StyleSheet.absoluteFill} facing="front" />
        <View style={st.cameraOverlay}>
          <TouchableOpacity style={st.cameraClose} onPress={() => setCameraMode(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={st.cameraTapZone} onPress={cameraTap} activeOpacity={0.8}>
            <Text style={st.cameraCount}>{reps}</Text>
            <Text style={st.cameraTapLabel}>{t('tapToCount', lang)}</Text>
          </TouchableOpacity>
          <View style={st.cameraBottom}>
            <TouchableOpacity style={[st.saveBtn, { backgroundColor: C.accent }]} onPress={handleSave}>
              <Text style={st.saveBtnText}>{t('save', lang)} ({reps})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
            <TouchableOpacity onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Text style={[st.manualLink, { color: C.accent }]}>{t('orManual', lang)}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={st.repsSection}>
          <View style={st.repsControls}>
            <TouchableOpacity style={[st.repsBtn, { backgroundColor: C.bg3 }]} onPress={() => changeReps(-1)}>
              <Text style={[st.repsBtnText, { color: C.label }]}>-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeReps(0)}>
              <Text style={[st.repsDisplay, { color: C.accent }]}>{reps}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.repsBtn, { backgroundColor: C.bg3 }]} onPress={() => changeReps(1)}>
              <Text style={[st.repsBtnText, { color: C.label }]}>+</Text>
            </TouchableOpacity>
          </View>

          {isPushups && CameraView && (
            <TouchableOpacity
              style={[st.cameraBtn, { backgroundColor: C.bg3 }]}
              onPress={() => setCameraMode(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="camera" size={20} color={C.accent} />
              <Text style={[st.cameraBtnText, { color: C.accent }]}>{t('openCamera', lang)}</Text>
            </TouchableOpacity>
          )}
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

      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onConfirm={handleTimePickerConfirm}
        initialSeconds={seconds}
        C={C} lang={lang} rtl={rtl}
      />
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
  repsSection: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 24 },
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
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 50, paddingVertical: 14, paddingHorizontal: 24,
  },
  cameraBtnText: { fontSize: 15, fontWeight: '600' },
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
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24, paddingTop: 60,
  },
  cameraClose: {
    alignSelf: 'flex-end',
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraTapZone: {
    alignItems: 'center', justifyContent: 'center',
    flex: 1,
  },
  cameraCount: {
    fontSize: 120, fontWeight: '800', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  cameraTapLabel: {
    fontSize: 16, color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  cameraBottom: {
    width: '100%',
  },
});
