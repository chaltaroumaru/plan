import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { CharacterDef } from '../types';
import { useGame } from '../state/GameContext';
import { RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import { expForNextLevel } from '../game/leveling';
import Bar from '../components/Bar';

export default function CharacterDetailView({
  character,
  onBack,
  onOpenSkillTree,
}: {
  character: CharacterDef;
  onBack: () => void;
  onOpenSkillTree: (character: CharacterDef) => void;
}) {
  const { profile } = useGame();
  const progress = profile.characterProgress[character.id];

  if (!progress) {
    return null;
  }

  const signatureCard = getCard(character.signatureCardId);
  const ownsSignatureCard = (profile.ownedCardCounts[character.signatureCardId] ?? 0) > 0;

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラ一覧に戻る</Text>
      </Pressable>

      <View style={styles.headerRow}>
        <Text style={styles.emoji}>{character.emoji}</Text>
        <View style={{ flex: 1 }}>
          <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[character.rarity] }]}>
            <Text style={styles.rarityText}>{character.rarity}</Text>
          </View>
          <Text style={styles.name}>{character.name}</Text>
          <Text style={styles.title}>
            {character.title} ・ {character.element}属性
          </Text>
        </View>
      </View>

      <View style={styles.levelBox}>
        <Text style={styles.levelText}>
          Lv.{progress.level} ・ EXP {progress.exp}/{expForNextLevel(progress.level)} ・ スキルポイント{' '}
          {progress.skillPoints}
        </Text>
        <Bar value={progress.exp} max={expForNextLevel(progress.level)} color="#f5b400" height={8} />
      </View>

      <Text style={styles.sectionTitle}>専用カード</Text>
      <View style={styles.signatureBox}>
        <Text style={styles.signatureText}>
          {signatureCard.name}({signatureCard.description}) を{ownsSignatureCard ? '所持しています' : '所持していません'}
        </Text>
      </View>

      <Pressable style={styles.skillTreeBtn} onPress={() => onOpenSkillTree(character)}>
        <Text style={styles.skillTreeBtnText}>🌳 スキルツリーで育成する →</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  emoji: { fontSize: 48, marginRight: 12 },
  rarityBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  title: { color: '#9a9ab0', fontSize: 12, marginTop: 2 },
  levelBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 10, marginBottom: 12 },
  levelText: { color: '#fff', fontSize: 12, marginBottom: 6, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 8, marginTop: 4 },
  signatureBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 10, padding: 12, marginBottom: 16 },
  signatureText: { color: '#c4c4d4', fontSize: 12 },
  skillTreeBtn: { backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  skillTreeBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
