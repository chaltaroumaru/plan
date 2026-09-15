import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

export default function CharacterEvolutionView({ onBack }: { onBack: () => void }) {
  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラクターへ戻る</Text>
      </Pressable>
      <Text style={styles.title}>キャラクター進化</Text>

      <View style={styles.devBox}>
        <Text style={styles.devBadge}>🚧 開発中</Text>
        <Text style={styles.devText}>
          進化は、ダンジョンで集めた進化素材を使ってキャラクターの見た目やレアリティを次の段階へ引き上げる要素として構想中です。
        </Text>
        <Text style={styles.devSubText}>想定している効果:</Text>
        <Text style={styles.devBullet}>・立ち絵/アイコンが進化後のデザインに変化</Text>
        <Text style={styles.devBullet}>・基礎ステータス(HP/攻撃力/防御力)の底上げ</Text>
        <Text style={styles.devSubText}>想定している解放条件:</Text>
        <Text style={styles.devBullet}>・ダンジョン(進化カテゴリ)で進化素材を規定数集める</Text>
        <Text style={styles.devBullet}>・キャラクターが一定レベルに到達している</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  devBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 16 },
  devBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8a52f',
    color: '#1a1330',
    fontWeight: '800',
    fontSize: 11,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  devText: { color: '#c4c4d4', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  devSubText: { color: '#fff', fontWeight: '700', fontSize: 12, marginTop: 8, marginBottom: 4 },
  devBullet: { color: '#9a9ab0', fontSize: 12, marginBottom: 3 },
});
