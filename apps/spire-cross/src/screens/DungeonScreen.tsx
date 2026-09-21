import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { THEME } from '../components/AppBackground';
import DungeonStageListView from './DungeonStageListView';
import StoryScreen from './StoryScreen';

type Mode = 'hub' | 'training' | 'story' | 'event';

type PanelDef = {
  key: Mode;
  emoji: string;
  label: string;
  description: string;
};

const PANELS: PanelDef[] = [
  { key: 'training', emoji: '⚔️', label: '育成ダンジョン', description: '仲間を強くするための試練が待っている' },
  { key: 'story', emoji: '📖', label: 'ストーリーダンジョン', description: '忘れられた記憶の欠片を辿る旅へ' },
  { key: 'event', emoji: '✨', label: 'イベントダンジョン', description: '期間限定の特別な試練に挑戦しよう' },
];

/**
 * ホームの塔をタップした先、塔の内部。育成/ストーリー/イベントの
 * 3つのダンジョンモードへ進む入口。
 */
export default function DungeonScreen() {
  const [mode, setMode] = useState<Mode>('hub');

  if (mode === 'training') {
    return (
      <DungeonStageListView
        title="育成ダンジョン"
        categories={['enhance', 'evolve', 'unlock', 'memory', 'raid']}
        onBack={() => setMode('hub')}
      />
    );
  }
  if (mode === 'event') {
    return (
      <DungeonStageListView title="イベントダンジョン" categories={['event']} onBack={() => setMode('hub')} />
    );
  }
  if (mode === 'story') {
    return <StoryScreen onBack={() => setMode('hub')} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>塔の中心</Text>
        {PANELS.map((p) => (
          <Pressable key={p.key} style={styles.panel} onPress={() => setMode(p.key)}>
            <Text style={styles.panelEmoji}>{p.emoji}</Text>
            <View style={styles.panelTextCol}>
              <Text style={styles.panelLabel}>{p.label}</Text>
              <Text style={styles.panelDesc}>{p.description}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 16, gap: 12 },
  title: { color: THEME.gold, fontSize: 18, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(20,14,42,0.72)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
    padding: 16,
  },
  panelEmoji: { fontSize: 30 },
  panelTextCol: { flex: 1 },
  panelLabel: { color: '#fff', fontSize: 15, fontWeight: '800' },
  panelDesc: { color: THEME.lavender, fontSize: 12, marginTop: 3 },
});
