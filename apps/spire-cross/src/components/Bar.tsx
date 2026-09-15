import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  value: number;
  max: number;
  color: string;
  label?: string;
  height?: number;
}

export default function Bar({ value, max, color, label, height = 14 }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={[styles.track, { height }]}>
      <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color, height }]} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(124,92,255,0.28)',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 8,
  },
  label: {
    fontSize: 11,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
