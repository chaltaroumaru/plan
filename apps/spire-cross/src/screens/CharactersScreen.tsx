import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { CHARACTERS } from '../data/characters';
import { CharacterDef } from '../types';
import CharacterTile from '../components/CharacterTile';
import CharacterDetailView from './CharacterDetailView';
import PartyEditorView from './PartyEditorView';
import DeckEditorView from './DeckEditorView';

type Mode = 'list' | 'detail' | 'party' | 'deck';

export default function CharactersScreen() {
  const { profile } = useGame();
  const [mode, setMode] = useState<Mode>('list');
  const [selected, setSelected] = useState<CharacterDef | null>(null);

  if (mode === 'detail' && selected) {
    return <CharacterDetailView character={selected} onBack={() => setMode('list')} />;
  }
  if (mode === 'party') {
    return <PartyEditorView onBack={() => setMode('list')} />;
  }
  if (mode === 'deck') {
    return <DeckEditorView onBack={() => setMode('list')} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>キャラ</Text>
        <Text style={styles.subtitle}>
          {Object.keys(profile.ownedCharacterCounts).length} / {CHARACTERS.length} 体所持
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn} onPress={() => setMode('party')}>
            <Text style={styles.actionBtnText}>👥 パーティ編成</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => setMode('deck')}>
            <Text style={styles.actionBtnText}>🎴 デッキ編成</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {CHARACTERS.map((c) => {
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', marginTop: 4, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#1c1c26', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
