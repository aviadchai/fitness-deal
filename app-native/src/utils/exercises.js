export const EXERCISES = {
  pushups: {
    name: 'שכיבות סמיכה',
    nameEn: 'Push-Ups',
    unit: 'reps',
    defaultTarget: 25,
    calPerUnit: 0.45,
    muscles: 'Chest, Shoulders, Triceps, Core',
    musclesHe: 'חזה, כתפיים, טריצפס, לב',
    icon: 'fitness',
    emoji: '💪',
  },
  situps: {
    name: 'כפיפות בטן',
    nameEn: 'Sit-Ups',
    unit: 'reps',
    defaultTarget: 20,
    calPerUnit: 0.3,
    muscles: 'Abs, Hip Flexors, Core',
    musclesHe: 'בטן, כופפי ירך, לב',
    icon: 'body',
    emoji: '🧘',
  },
  plank: {
    name: 'פלאנקים',
    nameEn: 'Plank',
    unit: 'sec',
    defaultTarget: 60,
    calPerUnit: 0.05,
    muscles: 'Core, Shoulders, Back, Glutes',
    musclesHe: 'לב, כתפיים, גב, ישבן',
    icon: 'timer',
    emoji: '🧘',
  },
};

export function isTimerExercise(exercise) {
  return exercise === 'plank';
}

export function exName(exercise, lang) {
  const ex = EXERCISES[exercise];
  return lang === 'he' ? ex.name : ex.nameEn;
}
