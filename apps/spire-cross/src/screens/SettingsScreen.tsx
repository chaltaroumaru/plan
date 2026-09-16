import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGame } from '../state/GameContext';
import { GameSettings } from '../types';

// 交界石+1000などのテスト用機能は屋台(ShopScreen)へ移動しました。

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextBox}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#3a3350', true: '#7c5cff' }}
        thumbColor="#fff"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { profile, updateProfile } = useGame();

  const setSetting = (key: keyof GameSettings, value: boolean) => {
    updateProfile((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  };

  const handleReset = () => {
    Alert.alert(
      'データをリセットしますか?',
      'すべての進行状況(キャラ・カード・ゴールド・交界石など)が削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセットする',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('spire-cross/profile-v2');
            Alert.alert('リセットしました', 'アプリを再起動すると初期状態に戻ります。');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>設定</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 音声設定</Text>
          <ToggleRow
            label="BGM"
            description="ホームやバトル中のBGMを再生します"
            value={profile.settings.bgmOn}
            onChange={(v) => setSetting('bgmOn', v)}
          />
          <ToggleRow
            label="効果音(SE)"
            description="カード使用や攻撃などの効果音を再生します"
            value={profile.settings.seOn}
            onChange={(v) => setSetting('seOn', v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 通知設定</Text>
          <ToggleRow
            label="ミッション達成通知"
            description="デイリー・ウィークリーミッションが達成可能になったら通知します"
            value={profile.settings.notifyMissionComplete}
            onChange={(v) => setSetting('notifyMissionComplete', v)}
          />
          <ToggleRow
            label="AP満タン通知"
            description="AP(スタミナ)が満タンになったら通知します"
            value={profile.settings.notifyApFull}
            onChange={(v) => setSetting('notifyApFull', v)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>アプリ情報</Text>
          <Text style={styles.infoText}>スパイア・クロス プロトタイプ v2</Text>
          <Text style={styles.infoText}>データはすべて端末内(AsyncStorage)に保存されます。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ管理</Text>
          <Pressable style={styles.dangerBtn} onPress={handleReset}>
            <Text style={styles.dangerBtnText}>進行状況をリセット</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  section: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  infoText: { color: '#9a9ab0', fontSize: 12, marginBottom: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  toggleTextBox: { flex: 1, marginRight: 12 },
  toggleLabel: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toggleDesc: { color: '#9a9ab0', fontSize: 10, marginTop: 2 },
  dangerBtn: { backgroundColor: '#e8452f', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  dangerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
