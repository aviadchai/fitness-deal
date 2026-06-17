import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../theme';

export default function ProgressRing({
  size = 150,
  strokeWidth = 14,
  progress = 0,
  color = COLORS.accent,
  centerText = '',
  centerColor,
  subText = '',
  subText2 = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, progress));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={COLORS.bg3} strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.centerText, { color: centerColor || color, fontSize: size * 0.28 }]}>
          {centerText}
        </Text>
        {subText ? <Text style={styles.subText}>{subText}</Text> : null}
        {subText2 ? <Text style={styles.subText2}>{subText2}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerText: { fontWeight: '700', letterSpacing: -2 },
  subText: { fontSize: 12, color: COLORS.label2, marginTop: 2 },
  subText2: { fontSize: 11, color: COLORS.label3, marginTop: 1 },
});
