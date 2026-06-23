import { getData, save, activeDeals, getDeal } from './storage';

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(s, n) {
  const d = new Date(s + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}

function processDealDebt(deal) {
  const { dailyTarget, penaltyType, penaltyPercent, startDate } = deal;
  if (!deal.debt) deal.debt = 0;
  if (!deal.logs) deal.logs = {};
  const tod = todayStr();

  let cursor = deal.lastProcessed ? addDays(deal.lastProcessed, 1) : startDate;

  while (cursor < tod) {
    if (cursor >= startDate) {
      if (penaltyType === 'percent' && deal.debt > 0) {
        const pct = parseFloat(penaltyPercent) || 20;
        deal.debt = Math.ceil(deal.debt * (1 + pct / 100));
      }
      const logged = deal.logs[cursor] || 0;
      const missed = Math.max(0, dailyTarget - logged);
      if (missed > 0) {
        if (penaltyType === 'double') {
          deal.debt += missed * 2;
        } else if (penaltyType === 'accumulate') {
          deal.debt += missed;
        } else {
          deal.debt += missed;
        }
      }
    }
    cursor = addDays(cursor, 1);
  }

  const cap = dailyTarget * 5;
  deal.debtOverCap = deal.debt >= cap;
  deal.debt = Math.min(deal.debt, cap);
  deal.lastProcessed = addDays(tod, -1);
}

export async function processDebt() {
  activeDeals().forEach(processDealDebt);
  await save();
}

export function dealLogged(deal) {
  return (deal.logs && deal.logs[todayStr()]) || 0;
}

export function dealRemaining(deal) {
  return Math.max(0, deal.dailyTarget - dealLogged(deal));
}

export function dealDue(deal) {
  return dealRemaining(deal) + (deal.debt || 0);
}

export function dealDone(deal) {
  return dealLogged(deal) >= deal.dailyTarget && (deal.debt || 0) === 0;
}

export async function addLogToDeal(exercise, reps) {
  const deal = getDeal(exercise);
  if (!deal) return;
  if (!deal.logs) deal.logs = {};
  const tod = todayStr();
  const before = deal.logs[tod] || 0;
  deal.logs[tod] = before + reps;

  const overTarget = Math.max(0, (before + reps) - deal.dailyTarget);
  if (overTarget > 0 && deal.debt > 0) {
    deal.debt = Math.max(0, deal.debt - overTarget);
  }
  await save();
}

export function getDealDayStatus(deal, d) {
  const tod = todayStr();
  if (d < deal.startDate) return 'no-deal';
  if (d > tod) return 'future';
  const logged = (deal.logs && deal.logs[d]) || 0;
  const target = deal.dailyTarget;
  if (d === tod) {
    if (logged >= target) return 'complete';
    if (logged > 0) return 'today-partial';
    return 'today';
  }
  if (logged >= target) return 'complete';
  if (logged > 0) return 'partial';
  return 'missed';
}

export function getDealStreak(deal) {
  const tod = todayStr();
  let cur = 0, best = 0, d = tod;
  while (true) {
    const s = getDealDayStatus(deal, d);
    if (s === 'complete' || s === 'today-partial') { cur++; best = Math.max(best, cur); }
    else if (s === 'today' || s === 'future') { /* skip */ }
    else break;
    if (d <= deal.startDate) break;
    d = addDays(d, -1);
  }
  let brun = 0, cursor2 = deal.startDate;
  while (cursor2 <= tod) {
    const s = getDealDayStatus(deal, cursor2);
    if (s === 'complete') { brun++; best = Math.max(best, brun); }
    else { brun = 0; }
    cursor2 = addDays(cursor2, 1);
  }
  return { current: cur, best };
}

export function getDealTotalReps(deal) {
  if (!deal.logs) return 0;
  return Object.values(deal.logs).reduce((a, b) => a + (b || 0), 0);
}

export function getTimeLeft() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msLeft = midnight - now;
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return { h, m };
}
