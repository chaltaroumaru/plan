import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';

export default function ShopScreen() {
  const { profile, updateProfile } = useGame();

  const handleAddTestStones = () => {
    updateProfile((prev) => ({ ...prev, stones: prev.stones + 1000 }));
    Alert.alert('追加しました', '交界石を1000個追加しました。');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>屋台</Text>
        <Text style={styles.subtitle}>拠点の隅に店を構える、旅の道具屋。</Text>

        <View style={styles.walletRow}>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💰</Text>
            <Text style={styles.walletText}>{profile.gold}</Text>
          </View>
          <View style={styles.walletChip}>
            <Text style={styles.walletEmoji}>💎</Text>
            <Text style={styles.walletText}>{profile.stones}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 品揃え(準備中)</Text>
          <Text style={styles.infoText}>
            素材・強化アイテムの販売は準備中です。しばらくお待ちください。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 テスト用(製品版では削除予定)</Text>
          <Text style={styles.infoText}>
            動作確認用に交界石を追加します。データは端末内保存のため、ここから自分の端末に
            直接付与してください。
          </Text>
          <Pressable style={styles.testBtn} onPress={handleAddTestStones}>
            <Text style={styles.testBtnText}>💎 交界石 +1000 を追加</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { color: '#9a9ab0', fontSize: 12, marginBottom: 16 },
  walletRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.28)',
  },
  walletEmoji: { fontSize: 14 },
  walletText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  section: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 8 },
  infoText: { color: '#9a9ab0', fontSize: 12, marginBottom: 4 },
  testBtn: { backgroundColor: '#e8a52f', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  testBtnText: { color: '#1a1330', fontWeight: '800', fontSize: 13 },
});
