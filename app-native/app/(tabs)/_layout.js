import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/ThemeContext';
import { t } from '../../src/utils/translations';

export default function TabLayout() {
  const { C, isDark, lang, rtl } = useTheme();

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
          flexDirection: rtl ? 'row-reverse' : 'row',
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.label3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('appTitle', lang),
          tabBarLabel: t('home', lang),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('workoutCalendar', lang),
          tabBarLabel: t('calendar', lang),
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('statistics', lang),
          tabBarLabel: t('stats', lang),
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings', lang),
          tabBarLabel: t('settings', lang),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
