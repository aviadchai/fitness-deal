import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = 'deal_fitness_v1';

let DATA = {};
let listeners = [];

export function subscribe(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notify() {
  listeners.forEach(fn => fn(DATA));
}

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    DATA = raw ? JSON.parse(raw) : {};
  } catch {
    DATA = {};
  }
  migrateData();
  return DATA;
}

export async function save() {
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(DATA));
  notify();
}

function migrateData() {
  if (DATA.deal && !DATA.deals) {
    const d = DATA.deal;
    DATA.deals = [{
      exercise: d.exercise,
      dailyTarget: d.dailyTarget,
      penaltyType: d.penaltyType,
      penaltyPercent: d.penaltyPercent,
      startDate: d.startDate,
      active: d.active,
      createdAt: d.createdAt,
      logs: d.logs || {},
      debt: d.debt || 0,
      lastProcessed: d.lastProcessed,
      debtOverCap: d.debtOverCap || false,
    }];
    delete DATA.deal;
    delete DATA.logs;
    delete DATA.debt;
    delete DATA.lastProcessed;
    delete DATA.debtOverCap;
  }
  if (!DATA.deals) DATA.deals = [];
  if (!DATA.settings) DATA.settings = { notificationsEnabled: false, reminderHour: 20, lang: 'en' };
}

export function getData() { return DATA; }
export function setData(d) { DATA = d; }

export function activeDeals() {
  return (DATA.deals || []).filter(d => d.active);
}

export function getDeal(exercise) {
  return (DATA.deals || []).find(d => d.exercise === exercise);
}

export function getLang() {
  return (DATA.settings && DATA.settings.lang) || 'en';
}

export async function setLang(lang) {
  if (!DATA.settings) DATA.settings = {};
  DATA.settings.lang = lang;
  await save();
}
