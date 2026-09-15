import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useGame } from '../state/GameContext';
import { CHARACTERS } from '../data/characters';
import CharacterTile from '../components/CharacterTile';

const MAX_PARTY = 3;

export default function PartyEditorView({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile } = useGame();

  const toggle = (id: string) => {
    updateProfile((prev) => {
      const inParty = prev.partyIds.includes(id);
      if (inParty) {
        return { ...prev, partyIds: prev.partyIds.filter((p) => p !== id) };
      }
      if (prev.partyIds.length >= MAX_PARTY) {
        Alert.alert('パーティは3体までです', '外してから別のキャラを選んでください。');
        return prev;
      }
      return { ...prev, partyIds: [...prev.partyIds, id] };
    });
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラ一覧に戻る</Text>
      </Pressable>
      <Text style={styles.title}>パーティ編成 ({profile.partyIds.length}/{MAX_PARTY})</Text>
      <Text style={styles.helpText}>タップで出撃キャラを選択(所持キャラのみ)。</Text>
      <View style={styles.grid}>
        {CHARACTERS.map((c) => (
          <CharacterTile
            key={c.id}
            character={c}
            owned={!!profile.ownedCharacterCounts[c.id]}
            selected={profile.partyIds.includes(c.id)}
            level={profile.characterProgress[c.id]?.level}
            onPress={profile.ownedCharacterCounts[c.id] ? () => toggle(c.id) : undefined}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#3f8efc', fontSize: 13, marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  helpText: { color: '#9a9ab0', fontSize: 12, marginTop: 4, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
