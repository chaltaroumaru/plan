import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import DungeonStageListView from './DungeonStageListView';
import StoryScreen from './StoryScreen';

const DUNGEON_IMAGE_ASPECT_RATIO = 941 / 1672;
const TRAINING_BG = { source: require('../../assets/backgrounds/dungeon_training_background.jpg'), aspectRatio: 942 / 1670 };
const STORY_BG = { source: require('../../assets/backgrounds/dungeon_story_background.jpg'), aspectRatio: 942 / 1670 };
const EVENT_BG = { source: require('../../assets/backgrounds/dungeon_event_background.jpg'), aspectRatio: 942 / 1670 };

type Mode = 'hub' | 'training' | 'story' | 'event';

type PanelHotspot = {
  key: string;
  label: string;
  left: number; // 画像内でのX位置(0〜1)
  top: number; // 画像内でのY位置(0〜1)
  width: number;
  height: number;
  onPress: () => void;
};

/**
 * ホームの塔をタップしてズームインした先、塔の内部。中央に据えられた
 * 3枚のクリスタルパネル(育成/ストーリー/イベント)をタップして、
 * それぞれのダンジョンモードへ進む。
 */
export default function DungeonScreen() {
  const [mode, setMode] = useState<Mode>('hub');

  if (mode === 'training') {
    return (
      <DungeonStageListView
        title="育成ダンジョン"
        categories={['enhance', 'evolve', 'unlock', 'memory', 'raid']}
        onBack={() => setMode('hub')}
        background={TRAINING_BG}
      />
    );
  }
  if (mode === 'event') {
    return (
      <DungeonStageListView
        title="イベントダンジョン"
        categories={['event']}
        onBack={() => setMode('hub')}
        background={EVENT_BG}
      />
    );
  }
  if (mode === 'story') {
    return <StoryScreen background={STORY_BG} onBack={() => setMode('hub')} />;
  }

  const panels: PanelHotspot[] = [
    {
      key: 'training',
      label: '育成ダンジョン',
      left: 0.06,
      top: 0.375,
      width: 0.29,
      height: 0.295,
      onPress: () => setMode('training'),
    },
    {
      key: 'story',
      label: 'ストーリーダンジョン',
      left: 0.35,
      top: 0.335,
      width: 0.31,
      height: 0.335,
      onPress: () => setMode('story'),
    },
    {
      key: 'event',
      label: 'イベントダンジョン',
      left: 0.65,
      top: 0.375,
      width: 0.29,
      height: 0.295,
      onPress: () => setMode('event'),
    },
  ];

  return (
    <View style={styles.root}>
      <ScreenBackground source={require('../../assets/backgrounds/dungeon_background.jpg')} aspectRatio={DUNGEON_IMAGE_ASPECT_RATIO} dim={0.12}>
        {({ width, height }) =>
          panels.map((p) => (
            <Pressable
              key={p.key}
              onPress={p.onPress}
              style={{
                position: 'absolute',
                left: width * p.left,
                top: height * p.top,
                width: width * p.width,
                height: height * p.height,
              }}
            />
          ))
        }
      </ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']} pointerEvents="box-none">
        <Text style={styles.title}>塔の中心</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 6,
  },
});
