import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../state/GameContext';
import { CHARACTERS, RARITY_COLOR } from '../data/characters';
import { getCard } from '../data/cards';
import CharacterTile from '../components/CharacterTile';
import CardView from '../components/CardView';
import { CharacterDef } from '../types';

export default function CollectionScreen() {
  const { profile } = useGame();
  const [selected, setSelected] = useState<CharacterDef | null>(null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>コレクション</Text>
        <Text style={styles.subtitle}>
          {profile.ownedCharacterIds.length} / {CHARACTERS.length} 体所持
        </Text>
        <View style={styles.grid}>
          {CHARACTERS.map((c) => (
            <CharacterTile
              key={c.id}
              character={c}
              owned={profile.ownedCharacterIds.includes(c.id)}
              onPress={
                profile.ownedCharacterIds.includes(c.id) ? () => setSelected(c) : undefined
              }
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}>
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            {selected && (
              <>
                <Text style={styles.modalEmoji}>{selected.emoji}</Text>
                <View
                  style={[styles.modalRarity, { backgroundColor: RARITY_COLOR[selected.rarity] }]}
                >
                  <Text style={styles.modalRarityText}>{selected.rarity}</Text>
                </View>
                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalSub}>{selected.title} ・ {selected.element}属性</Text>
                <Text style={styles.modalStat}>体力ボーナス +{selected.bonusHp}</Text>
                <Text style={styles.modalSectionTitle}>専用カード</Text>
                <View style={styles.modalCards}>
                  {selected.cardIds.map((cid) => (
                    <CardView key={cid} card={getCard(cid)} compact />
                  ))}
                </View>
                <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>閉じる</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitle: { color: '#9a9ab0', marginTop: 4, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1c1c26',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalEmoji: { fontSize: 48 },
  modalRarity: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 8,
  },
  modalRarityText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  modalName: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  modalSub: { color: '#9a9ab0', fontSize: 13, marginTop: 2 },
  modalStat: { color: '#c4c4d4', fontSize: 13, marginTop: 8 },
  modalSectionTitle: { color: '#fff', fontWeight: '700', marginTop: 16, alignSelf: 'flex-start' },
  modalCards: { flexDirection: 'row', marginTop: 8 },
  closeBtn: { marginTop: 20, backgroundColor: '#3f8efc', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  closeBtnText: { color: '#fff', fontWeight: '700' },
});
