import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { getRosterCharacters } from '../data/characters';
import { CharacterDef } from '../types';
import CharacterTile from '../components/CharacterTile';
import CharacterDetailView from './CharacterDetailView';
import PartyEditorView from './PartyEditorView';
import DeckEditorView from './DeckEditorView';
import SkillTreeHubView from './SkillTreeHubView';
import CharacterAwakeningView from './CharacterAwakeningView';
import CharacterEvolutionView from './CharacterEvolutionView';
import TravelerCreateView from './TravelerCreateView';

type Mode = 'hub' | 'list' | 'detail' | 'party' | 'deck' | 'awakening' | 'evolution' | 'skilltree' | 'traveler';

export default function CharactersScreen() {
  const { profile } = useGame();
  const [mode, setMode] = useState<Mode>('hub');
  const [selected, setSelected] = useState<CharacterDef | null>(null);
  const [skillTreeCharacterId, setSkillTreeCharacterId] = useState<string | null>(null);

  const backToHub = () => setMode('hub');

  if (mode === 'traveler') {
    return <TravelerCreateView onBack={backToHub} />;
  }
  if (mode === 'party') {
    return <PartyEditorView onBack={backToHub} />;
  }
  if (mode === 'deck') {
    return <DeckEditorView onBack={backToHub} />;
  }
  if (mode === 'awakening') {
    return <CharacterAwakeningView onBack={backToHub} />;
  }
  if (mode === 'evolution') {
    return <CharacterEvolutionView onBack={backToHub} />;
  }
  if (mode === 'skilltree') {
    return (
      <SkillTreeHubView
        initialCharacterId={skillTreeCharacterId}
        onBack={backToHub}
      />
    );
  }
  if (mode === 'detail' && selected) {
    return (
      <CharacterDetailView
        character={selected}
        onBack={() => setMode('list')}
        onOpenSkillTree={(character) => {
          setSkillTreeCharacterId(character.id);
          setMode('skilltree');
        }}
      />
    );
  }
  if (mode === 'list') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Pressable onPress={backToHub}>
            <Text style={styles.backLink}>← キャラクターへ戻る</Text>
          </Pressable>
          <Text style={styles.subtitle}>
            {Object.keys(profile.ownedCharacterCounts).length} / {getRosterCharacters().length} 体所持
          </Text>
          <View style={styles.grid}>
            {getRosterCharacters().map((c) => {
              const owned = !!profile.ownedCharacterCounts[c.id];
              return (
                <CharacterTile
                  key={c.id}
                  character={c}
                  owned={owned}
                  level={profile.characterProgress[c.id]?.level}
                  onPress={
                    owned
                      ? () => {
                          setSelected(c);
                          setMode('detail');
                        }
                      : undefined
                  }
                />
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>
          {Object.keys(profile.ownedCharacterCounts).length} / {getRosterCharacters().length} 体所持
        </Text>

        <Pressable style={[styles.menuBtnWide, styles.menuBtnHighlight]} onPress={() => setMode('traveler')}>
          <Text style={styles.menuEmoji}>🧭</Text>
          <Text style={styles.menuLabel}>{profile.traveler ? '旅人を編集' : '旅人を作成'}</Text>
        </Pressable>

        <Pressable style={styles.menuBtnWide} onPress={() => setMode('party')}>
          <Text style={styles.menuEmoji}>👥</Text>
          <Text style={styles.menuLabel}>キャラクター編成</Text>
        </Pressable>

        <Pressable style={styles.menuBtnWide} onPress={() => setMode('deck')}>
          <Text style={styles.menuEmoji}>🎴</Text>
          <Text style={styles.menuLabel}>デッキ編成</Text>
        </Pressable>

        <View style={styles.menuRow}>
          <Pressable style={styles.menuBtnHalf} onPress={() => setMode('awakening')}>
            <Text style={styles.menuEmoji}>✨</Text>
            <Text style={styles.menuLabel}>キャラクター覚醒</Text>
          </Pressable>
          <Pressable style={styles.menuBtnHalf} onPress={() => setMode('evolution')}>
            <Text style={styles.menuEmoji}>🦋</Text>
            <Text style={styles.menuLabel}>キャラクター進化</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.menuBtnWide}
          onPress={() => {
            setSkillTreeCharacterId(null);
            setMode('skilltree');
          }}
        >
          <Text style={styles.menuEmoji}>🌳</Text>
          <Text style={styles.menuLabel}>スキルツリー</Text>
        </Pressable>

        <Pressable style={styles.menuBtnWide} onPress={() => setMode('list')}>
          <Text style={styles.menuEmoji}>📖</Text>
          <Text style={styles.menuLabel}>キャラクター一覧</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', marginTop: 4, marginBottom: 16 },
  menuBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.25)',
  },
  menuBtnHighlight: { borderColor: 'rgba(255,215,106,0.55)', backgroundColor: 'rgba(255,215,106,0.12)' },
  menuRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  menuBtnHalf: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.78)',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.25)',
  },
  menuEmoji: { fontSize: 26, marginRight: 12 },
  menuLabel: { color: '#fff', fontWeight: '800', fontSize: 15, flexShrink: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
