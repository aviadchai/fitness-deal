import { useState, useCallback } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Switch, Alert, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '../../src/theme';
import { getData, save, activeDeals, getLang, setLang } from '../../src/utils/storage';
import { EXERCISES, exName } from '../../src/utils/exercises';
import { t } from '../../src/utils/translations';

export default function SettingsScreen() {
  const [, setRefresh] = useState(0);
  const router = useRouter();
  const lang = getLang();
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
    setRefresh(n => n + 1);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {deals.map(deal => {
        const ex = EXERCISES[deal.exercise];
        const name = exName(deal.exercise, lang);
        const penStr = deal.penaltyType === 'double' ? t('double', lang) : deal.penaltyType === 'accumulate' ? t('accumulate', lang) : `${deal.penaltyPercent}%`;
        return (
          <View key={deal.exercise}>
            <Text style={styles.sectionHdr}>{name}</Text>
            <View style={styles.group}>
              <Row label={t('dailyGoal', lang)} value={`${deal.dailyTarget} ${ex.unit}`} />
              <Row label={t('penaltyLbl', lang)} value={penStr} />
              <Row label={t('openDebtLbl', lang)} value={deal.debt > 0 ? `${deal.debt} ${ex.unit}` : t('noneCheck', lang)}
                valueColor={deal.debt > 0 ? COLORS.orange : COLORS.green} />
              <TouchableOpacity style={styles.dangerRow} onPress={() => removeDeal(deal.exercise)}>
                <Text style={styles.dangerText}>{t('remove', lang)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <Text style={styles.sectionHdr}>{t('language', lang)}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('langLabel', lang)}</Text>
          <TouchableOpacity style={styles.langBtn} onPress={handleToggleLang}>
            <Text style={styles.langBtnText}>
              {lang === 'en' ? 'English → עברית' : 'עברית → English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHdr}>{t('notifications', lang)}</Text>
      <View style={styles.group}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('dailyReminder', lang)}</Text>
          <Switch
            value={!!s.notificationsEnabled}
            onValueChange={toggleNotif}
            trackColor={{ false: COLORS.bg4, true: COLORS.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.actions}>
        {canAddMore && (
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/onboarding')}>
            <Text style={styles.primaryBtnText}>{t('addChallenge', lang)}</Text>
          </TouchableOpacity>
        )}
        {deals.length > 0 && (
          <TouchableOpacity style={styles.dangerBtn} onPress={confirmReset}>
            <Text style={styles.dangerBtnText}>{t('resetEverything', lang)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 100 },
  sectionHdr: {
    fontSize: 12, fontWeight: '500', color: COLORS.accent,
    textTransform: 'uppercase', letterSpacing: 0.6,
    paddingHorizontal: 6, marginTop: 28, marginBottom: 8,
  },
  group: { backgroundColor: COLORS.bg2, borderRadius: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.sep,
  },
  rowLabel: { flex: 1, fontSize: 16, color: COLORS.label },
  rowValue: { fontSize: 16, color: COLORS.label2 },
  dangerRow: {
    paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center',
  },
  dangerText: { fontSize: 16, color: COLORS.red, fontWeight: '500' },
  langBtn: {
    backgroundColor: COLORS.bg3, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  langBtnText: { fontSize: 14, color: COLORS.label2, fontWeight: '500' },
  actions: { marginTop: 28, gap: 10 },
  primaryBtn: {
    backgroundColor: COLORS.accent, borderRadius: 50,
    paddingVertical: 16, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  dangerBtn: {
    backgroundColor: 'rgba(207,102,121,0.12)', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  dangerBtnText: { color: COLORS.red, fontSize: 16, fontWeight: '500' },
});
