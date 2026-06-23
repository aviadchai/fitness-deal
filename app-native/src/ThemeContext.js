import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT } from './theme';
import { getData, save, getLang } from './utils/storage';

const ThemeContext = createContext({
  C: DARK,
  isDark: true,
  toggleTheme: () => {},
  lang: 'he',
  rtl: true,
  refresh: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [tick, setTick] = useState(0);

  const settings = getData().settings || {};
  const themeMode = settings.theme || 'system';
  const isDark = themeMode === 'system' ? systemScheme !== 'light' : themeMode === 'dark';
  const C = isDark ? DARK : LIGHT;
  const lang = getLang();
  const rtl = lang === 'he';

  const toggleTheme = useCallback(async () => {
    const data = getData();
    if (!data.settings) data.settings = {};
    data.settings.theme = isDark ? 'light' : 'dark';
    await save();
    setTick(n => n + 1);
  }, [isDark]);

  const refresh = useCallback(() => setTick(n => n + 1), []);

  return (
    <ThemeContext.Provider value={{ C, isDark, toggleTheme, lang, rtl, refresh }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
