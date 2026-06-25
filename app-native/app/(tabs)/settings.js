import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/ThemeContext';
import { getData, save, activeDeals, setLang } from '../../src/utils/storage';
import { EXERCISES, exName } from '../../src/utils/exercises';
import { t } from '../../src/utils/translations';

export default function SettingsScreen() {
  const { C, isDark, lang, toggleTheme, refresh } = useTheme();
  const [, setRefresh] = useState(0);
  const router = useRouter();
  const DATA = getData();
  const deals = activeDeals();
  const s = DATA.settings || {};

  useFocusEffect(useCallback(() => { setRefresh(n => n + 1); }, []));

  async function toggleNotif() {
    if (!DATA.settings) DATA.settings = {};
    DATA.settings.notificationsEnabled = !DATA.settings.notificationsEnabled;
    await save();
    setRefresh(n => n + 1);
  }

  async function handleToggleLang() {
    await setLang(lang === 'en' ? 'he' : 'en');
    refresh();
  }

  function removeDeal(exercise) {
    const deal = deals.find(d => d.exercise === exercise);
    if (!deal) return;
    const name = exName(exercise, lang);
    Alert.alert(t('remove', lang), `${name}?`, [
      { text: t('cancel', lang), style: 'cancel' },
      {
        text: t('remove', lang), style: 'destructive',
        onPress: async () => {
          DATA.deals = DATA.deals.filter(d => d.exercise !== exercise);
          await save();
          if (activeDeals().length === 0) {
            router.replace('/onboarding');
          } else {
            setRefresh(n => n + 1);
          }
        }
      }
    ]);
  }

  function confirmReset() {
    Alert.alert(t('resetEverything', lang), '', [
      { text: t('cancel', lang), style: 'cancel' },
      {
        text: t('resetEverything', lang), style: 'destructive',
        onPress: async () => {
          const langSave = lang;
          Object.keys(DATA).forEach(k => delete DATA[k]);
          DATA.deals = [];
          DATA.settings = { lang: langSave };
          await save();
          router.replace('/onboarding');
        }
      }
    ]);
  }

  const canAddMore = deals.length < Object.keys(EXERCISES).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg, direction: lang === 'he' ? 'rtl' : 'ltr' }}
      contentContainerStyle={styles.content}
    >
      {deals.map(deal => {
        const ex = EXERCISES[deal.exercise];
        const name = exName(deal.exercise, lang);
        const penStr = deal.penaltyType === 'double' ? t('double', lang) : deal.penaltyType === 'accumulate' ? t('accumulate', lang) : `${deal.penaltyPercent}%`;
        return (
          <View key={deal.exercise}>
            <Text style={[styles.sectionHdr, { color: C.accent }, lang === 'he' && { textAlign: 'right' }]}>{name}</Text>
            <View style={[styles.group, { backgroundColor: C.bg2 }]}>
              <Row C={C} rtl={lang === 'he'} label={t('dailyGoal', lang)} value={`${deal.dailyTarget} ${ex.unit}`} />
              <Row C={C} rtl={lang === 'he'} label={t('penaltyLbl', lang)} value={penStr} />
              <Row C={C} rtl={lang === 'he'} label={t('openDebtLbl', lang)} value={deal.debt > 0 ? `${deal.debt} ${ex.unit}` : t('noneCheck', lang)}
                valueColor={deal.debt > 0 ? C.orange : C.green} />
              <TouchableOpacity style={[styles.dangerRow, { borderBottomWidth: 0 }]} onPress={() => removeDeal(deal.exercise)}>
                <Text style={[styles.dangerText, { color: C.red }]}>{t('remove', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Text style={[styles.sectionHdr, { color: C.accent }, lang === 'he' && { textAlign: 'right' }]}>{t('language', lang)}</Text>
      <View style={[styles.group, { backgroundColor: C.bg2 }]}>
        <View style={[styles.row, { borderBottomColor: C.sep }, lang === 'he' && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.rowLabel, { color: C.label }, lang === 'he' && { textAlign: 'right' }]}>{t('langLabel', lang)}</Text>
          <TouchableOpacity style={[styles.langBtn, { backgroundColor: C.bg3 }]} onPress={handleToggleLang}>
            <Text style={[styles.langBtnText, { color: C.label2 }]}>
              {lang === 'en' ? 'English → עברית' : 'עברית → English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionHdr, { color: C.accent }, lang === 'he' && { textAlign: 'right' }]}>{t('theme', lang)}</Text>
      <View style={[styles.group, { backgroundColor: C.bg2 }]}>
        <View style={[styles.row, { borderBottomColor: C.sep }, lang === 'he' && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.rowLabel, { color: C.label }, lang === 'he' && { textAlign: 'right' }]}>{isDark ? t('dark', lang) : t('light', lang)}</Text>
          <TouchableOpacity style={[styles.langBtn, { backgroundColor: C.bg3 }]} onPress={toggleTheme}>
            <View style={styles.themeToggle}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={C.accent} />
              <Text style={[styles.langBtnText, { color: C.label2 }]}>
                {isDark ? t('light', lang) : t('dark', lang)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionHdr, { color: C.accent }, lang === 'he' && { textAlign: 'right' }]}>{t('notifications', lang)}</Text>
      <View style={[styles.group, { backgroundColor: C.bg2 }]}>
        <View style={[styles.row, { borderBottomColor: C.sep }, lang === 'he' && { flexDirection: 'row-reverse' }]}>
          <Text style={[styles.rowLabel, { color: C.label }, lang === 'he' && { textAlign: 'right' }]}>{t('dailyReminder', lang)}</Text>
          <Switch
            value={!!s.notificationsEnabled}
            onValueChange={toggleNotif}
            trackColor={{ false: C.bg4, true: C.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.actions}>
        {canAddMore && (
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.accent }]} onPress={() => router.push('/add-challenge')}>
            <Text style={styles.primaryBtnText}>{t('addChallenge', lang)}</Text>
          </TouchableOpacity>
        )}
        {deals.length > 0 && (
          <TouchableOpacity style={styles.dangerBtn} onPress={confirmReset}>
            <Text style={[styles.dangerBtnText, { color: C.red }]}>{t('resetEverything', lang)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ C, label, value, valueColor, rtl }) {
  return (
    <View style={[styles.row, { borderBottomColor: C.sep }, rtl && { flexDirection: 'row-reverse' }]}>
      <Text style={[styles.rowLabel, { color: C.label }, rtl && { textAlign: 'right' }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor || C.label2 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 100 },
  sectionHdr: {
    fontSize: 12, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: 6, marginTop: 28, marginBottom: 8,
  },
  group: { borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  rowLabel: { flex: 1, fontSize: 16 },
  rowValue: { fontSize: 16 },
  dangerRow: {
    paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { fontSize: 16, fontWeight: '500' },
  langBtn: {
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  langBtnText: { fontSize: 14, fontWeight: '500' },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { marginTop: 28, gap: 10 },
  primaryBtn: {
    borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dangerBtn: {
    backgroundColor: 'rgba(207,102,121,0.12)', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  dangerBtnText: { fontSize: 16, fontWeight: '500' },
});
