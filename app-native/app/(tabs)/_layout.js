import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme';
import { getLang } from '../../src/utils/storage';
import { t } from '../../src/utils/translations';

export default function TabLayout() {
  const lang = getLang();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.navBg, borderBottomColor: COLORS.sep, borderBottomWidth: 1 },
        headerTintColor: COLORS.label,
        headerTitleStyle: { fontSize: 20, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: COLORS.navBg,
          borderTopColor: COLORS.sep,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.label3,
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
