import { useState, useRef } from 'react';
import { View, ScrollView, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../src/ThemeContext';
import { getData, save, setLang } from '../src/utils/storage';
import { EXERCISES, exName } from '../src/utils/exercises';
import { todayStr } from '../src/utils/debtEngine';
import { t } from '../src/utils/translations';

const MAX_STEP = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { C, lang: themeLang, rtl: themeRtl, refresh } = useTheme();
  const [selectedLang, setSelectedLang] = useState(themeLang || 'he');
  const lang = selectedLang;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [targets, setTargets] = useState({});
  const [penalty, setPenalty] = useState('double');
  const [pctValue, setPctValue] = useState(20);

  const stepRef = useRef(step);
  stepRef.current = step;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 30,
      onPanResponderRelease: (_, gs) => {
        const s = stepRef.current;
        if (gs.dx < -50 && s < MAX_STEP) setStep(s + 1);
        else if (gs.dx > 50 && s > 0) setStep(s - 1);
      },
    })
  ).current;

  const DATA = getData();
  const existingExercises = new Set((DATA.deals || []).filter(d => d.active).map(d => d.exercise));
  const available = Object.keys(EXERCISES).filter(ex => !existingExercises.has(ex));
  const rtl = lang === 'he';

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
    if (step === 2 && selected.size === 0) return;
    setStep(s => s + 1);
  }

  async function chooseLang(l) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLang(l);
    await setLang(l);
    refresh();
    setStep(1);
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

  const s = makeStyles(C);

  function renderContent() {
    if (step === 0) {
      return (
        <View style={s.screen}>
          <View style={s.iconRing}>
            <Ionicons name="language" size={48} color={C.accent} />
          </View>
          <Text style={s.bigTitle}>{t('chooseLang', 'en')}</Text>
          <Text style={s.bigTitle}>{t('chooseLang', 'he')}</Text>
          <TouchableOpacity style={s.langSelectBtn} onPress={() => chooseLang('he')}>
            <Text style={s.langSelectBtnText}>עברית</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.langSelectBtn} onPress={() => chooseLang('en')}>
            <Text style={s.langSelectBtnText}>English</Text>
          </TouchableOpacity>
          <Dots active={0} C={C} />
        </View>
      );
    }

    if (step === 1) {
      return (
        <View style={[s.screen, rtl && s.rtl]}>
          <View style={s.iconRing}>
            <Ionicons name="shield-checkmark" size={48} color={C.accent} />
          </View>
          <Text style={[s.bigTitle, rtl && s.rtlText]}>{t('obTitle', lang)}</Text>
          <Text style={[s.body, rtl && s.rtlText]}>{t('obBody', lang)}</Text>
          <Dots active={1} C={C} />
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>{rtl ? `← ${t('letsGo', lang)}` : `${t('letsGo', lang)} →`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(0)}>
            <Text style={s.backText}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 2) {
      return (
        <ScrollView contentContainerStyle={[s.screen, rtl && s.rtl]}>
          <View style={s.iconRing}>
            <Ionicons name="pulse" size={48} color={C.accent} />
          </View>
          <Text style={[s.bigTitle, rtl && s.rtlText]}>{t('chooseChallenges', lang)}</Text>
          <Text style={[s.subBody, rtl && s.rtlText]}>{t('pickOne', lang)}</Text>
          <View style={s.exerciseRow}>
            {available.map(ex => (
              <TouchableOpacity
                key={ex}
                style={[s.exerciseCard, selected.has(ex) && s.exerciseCardSel]}
                onPress={() => toggleExercise(ex)}
              >
                <View style={s.ecRing}>
                  <Ionicons name={EXERCISES[ex].icon} size={22} color={C.accent} />
                </View>
                <Text style={[s.ecName, rtl && s.rtlText]}>{exName(ex, lang)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {[...selected].map(ex => (
            <View key={ex} style={[s.targetRow, rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={[s.targetName, rtl && s.rtlText]}>{exName(ex, lang)}</Text>
              <View style={s.stepper}>
                <TouchableOpacity style={s.stepBtn} onPress={() => changeTarget(ex, -5)}>
                  <Text style={s.stepBtnText}>{'−'}</Text>
                </TouchableOpacity>
                <Text style={s.targetVal}>{targets[ex]}</Text>
                <TouchableOpacity style={s.stepBtn} onPress={() => changeTarget(ex, 5)}>
                  <Text style={s.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.unitLabel}>{EXERCISES[ex].unit}</Text>
            </View>
          ))}
          <Dots active={2} C={C} />
          <TouchableOpacity style={[s.primaryBtn, selected.size === 0 && { opacity: 0.4 }]} onPress={next}>
            <Text style={s.primaryBtnText}>{rtl ? `← ${t('next', lang)}` : `${t('next', lang)} →`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(1)}>
            <Text style={s.backText}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    if (step === 3) {
      return (
        <ScrollView contentContainerStyle={[s.screen, rtl && s.rtl]}>
          <View style={s.iconRing}>
            <Ionicons name="warning" size={48} color={C.accent} />
          </View>
          <Text style={[s.bigTitle, rtl && s.rtlText]}>{t('missedDay', lang)}</Text>
          <TouchableOpacity
            style={[s.penaltyCard, penalty === 'accumulate' && s.penaltyCardSel]}
            onPress={() => setPenalty('accumulate')}
          >
            <Text style={[s.penTitle, rtl && s.rtlText]}>{t('accumulateTitle', lang)}</Text>
            <Text style={[s.penDesc, rtl && s.rtlText]}>{t('accumulateDesc', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.penaltyCard, penalty === 'double' && s.penaltyCardSel]}
            onPress={() => setPenalty('double')}
          >
            <Text style={[s.penTitle, rtl && s.rtlText]}>{t('doubleTitle', lang)}</Text>
            <Text style={[s.penDesc, rtl && s.rtlText]}>{t('doubleDesc', lang)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.penaltyCard, penalty === 'percent' && s.penaltyCardSel]}
            onPress={() => setPenalty('percent')}
          >
            <Text style={[s.penTitle, rtl && s.rtlText]}>{t('compoundTitle', lang)}</Text>
            <Text style={[s.penDesc, rtl && s.rtlText]}>{t('compoundDesc', lang)}</Text>
          </TouchableOpacity>
          <Dots active={3} C={C} />
          <TouchableOpacity style={s.primaryBtn} onPress={next}>
            <Text style={s.primaryBtnText}>{rtl ? `← ${t('next', lang)}` : `${t('next', lang)} →`}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(2)}>
            <Text style={s.backText}>{t('back', lang)}</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <View style={[s.screen, rtl && s.rtl]}>
        <View style={s.iconRing}>
          <Ionicons name="clipboard" size={48} color={C.accent} />
        </View>
        <Text style={[s.bigTitle, rtl && s.rtlText]}>{t('yourDeal', lang)}</Text>
        <View style={s.summaryCard}>
          {[...selected].map(ex => (
            <View key={ex} style={[s.summaryRow, rtl && { flexDirection: 'row-reverse' }]}>
              <Text style={[s.summaryKey, rtl && s.rtlText]}>{exName(ex, lang)}</Text>
              <Text style={[s.summaryVal, rtl && s.rtlText]}>{targets[ex]} {EXERCISES[ex].unit}</Text>
            </View>
          ))}
          <View style={[s.summaryRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[s.summaryKey, rtl && s.rtlText]}>{t('penalty', lang)}</Text>
            <Text style={[s.summaryVal, rtl && s.rtlText]}>
              {penalty === 'double' ? t('double', lang) : penalty === 'accumulate' ? t('accumulate', lang) : `${pctValue}%`}
            </Text>
          </View>
          <View style={[s.summaryRow, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[s.summaryKey, rtl && s.rtlText]}>{t('starts', lang)}</Text>
            <Text style={[s.summaryVal, rtl && s.rtlText]}>{t('today', lang)}</Text>
          </View>
        </View>
        <Text style={[s.subBody, rtl && s.rtlText]}>{t('tapToSign', lang)}</Text>
        <TouchableOpacity style={s.signBtn} onPress={signDeal}>
          <Ionicons name="checkmark" size={56} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {renderContent()}
    </View>
  );
}

function Dots({ active, C }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={{
            width: i === active ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === active ? C.accent : C.bg4,
          }}
        />
      ))}
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    screen: {
      flex: 1, backgroundColor: C.bg,
      alignItems: 'center', justifyContent: 'center',
      padding: 28, gap: 20,
    },
    rtl: { direction: 'rtl' },
    rtlText: { writingDirection: 'rtl', textAlign: 'right' },
    iconRing: {
      width: 96, height: 96, borderRadius: 48,
      backgroundColor: C.accentCont,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    bigTitle: { fontSize: 26, fontWeight: '500', color: C.label, textAlign: 'center' },
    body: { fontSize: 15, color: C.label2, textAlign: 'center', lineHeight: 26 },
    subBody: { fontSize: 13, color: C.label2, textAlign: 'center' },
    primaryBtn: {
      width: '100%', backgroundColor: C.accent,
      borderRadius: 50, paddingVertical: 16, alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backText: { color: C.accent, fontSize: 16, paddingVertical: 12 },
    langSelectBtn: {
      width: '100%', backgroundColor: C.bg2, borderRadius: 16,
      paddingVertical: 20, alignItems: 'center',
      borderWidth: 2, borderColor: 'transparent',
    },
    langSelectBtnText: { fontSize: 22, fontWeight: '600', color: C.label },
    exerciseRow: { flexDirection: 'row', gap: 8, width: '100%' },
    exerciseCard: {
      flex: 1, backgroundColor: C.bg2, borderWidth: 2, borderColor: 'transparent',
      borderRadius: 14, padding: 12, alignItems: 'center', gap: 8,
    },
    exerciseCardSel: { borderColor: C.accent, backgroundColor: C.accentCont },
    ecRing: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.accentCont,
      alignItems: 'center', justifyContent: 'center',
    },
    ecName: { fontSize: 12, fontWeight: '600', color: C.label, textAlign: 'center' },
    targetRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
      backgroundColor: C.bg2, borderRadius: 12, padding: 10, paddingHorizontal: 14,
    },
    targetName: { flex: 1, fontSize: 14, color: C.label },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg3,
      alignItems: 'center', justifyContent: 'center',
    },
    stepBtnText: { fontSize: 18, color: C.label },
    targetVal: { fontSize: 18, fontWeight: '700', color: C.label, minWidth: 32, textAlign: 'center' },
    unitLabel: { fontSize: 12, color: C.label3, minWidth: 42 },
    penaltyCard: {
      width: '100%', backgroundColor: C.bg2, borderRadius: 14,
      padding: 16, borderWidth: 2, borderColor: 'transparent',
    },
    penaltyCardSel: { borderColor: C.accent, backgroundColor: C.accentCont },
    penTitle: { fontSize: 16, fontWeight: '600', color: C.label, marginBottom: 4 },
    penDesc: { fontSize: 13, color: C.label2, lineHeight: 20 },
    summaryCard: { width: '100%', backgroundColor: C.bg2, borderRadius: 16, overflow: 'hidden' },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingHorizontal: 18, paddingVertical: 15,
      borderBottomWidth: 1, borderBottomColor: C.sep,
    },
    summaryKey: { fontSize: 15, color: C.label2 },
    summaryVal: { fontSize: 15, fontWeight: '500', color: C.label },
    signBtn: {
      width: 120, height: 120, borderRadius: 60,
      backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
      shadowColor: C.accent, shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35, shadowRadius: 32, elevation: 12,
    },
  });
}
