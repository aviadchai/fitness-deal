import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/ThemeContext';
import { t } from '../../src/utils/translations';

export default function TabLayout() {
  const { C, isDark, lang, rtl } = useTheme();

  const tabs = [
    { name: 'index', title: t('appTitle', lang), label: t('home', lang), icon: 'home' },
    { name: 'calendar', title: t('workoutCalendar', lang), label: t('calendar', lang), icon: 'calendar' },
    { name: 'stats', title: t('statistics', lang), label: t('stats', lang), icon: 'bar-chart' },
    { name: 'settings', title: t('settings', lang), label: t('settings', lang), icon: 'settings' },
  ];

  const ordered = rtl ? [...tabs].reverse() : tabs;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: C.bg,
          borderBottomColor: C.sep,
          borderBottomWidth: 1,
        },
        headerTintColor: C.label,
        headerTitleStyle: { fontSize: 20, fontWeight: '500' },
        headerTitleAlign: rtl ? 'right' : 'left',
        tabBarStyle: {
          position: 'absolute',
          bottom: 28,
          left: 24,
          right: 24,
          borderRadius: 28,
          backgroundColor: C.navBg,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          paddingBottom: 0,
          paddingTop: 8,
          height: 60,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 32,
          elevation: 12,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.label3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      {ordered.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarLabel: tab.label,
            tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
