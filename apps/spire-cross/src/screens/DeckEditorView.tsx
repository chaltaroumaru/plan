import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useGame } from '../state/GameContext';
import { getCard } from '../data/cards';
import { RARITY_COLOR } from '../data/characters';
import {
  DECK_MAX_SIZE,
  DECK_MIN_SIZE,
  availableCardPool,
  canAddCardToDeck,
  countInDeck,
  isDeckValid,
} from '../game/deck';

export default function DeckEditorView({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile } = useGame();
  const deck = profile.deckCardIds;
  const pool = availableCardPool(profile);
  const valid = isDeckValid(deck);

  const addCard = (cardId: string) => {
    if (!canAddCardToDeck(deck, cardId, profile)) return;
    updateProfile((prev) => ({ ...prev, deckCardIds: [...prev.deckCardIds, cardId] }));
  };

  const removeCard = (cardId: string) => {
    updateProfile((prev) => {
      const idx = prev.deckCardIds.indexOf(cardId);
      if (idx === -1) return prev;
      const next = [...prev.deckCardIds];
      next.splice(idx, 1);
      return { ...prev, deckCardIds: next };
    });
  };

  return (
    <ScrollView style={styles.safe} contentContainerStyle={styles.container}>
      <Pressable onPress={onBack}>
        <Text style={styles.backLink}>← キャラ一覧に戻る</Text>
      </Pressable>
      <Text style={styles.title}>デッキ編成</Text>
      <Text style={[styles.sizeText, !valid && styles.sizeTextInvalid]}>
        デッキ枚数 {deck.length}枚(必要: {DECK_MIN_SIZE}〜{DECK_MAX_SIZE}枚)
      </Text>
      <Text style={styles.helpText}>
        パーティに入れた3体のうち誰でも、デッキ内のどのカードも使用できます。
      </Text>

      {pool.map(({ cardId, max }) => {
        const card = getCard(cardId);
        const count = countInDeck(deck, cardId);
        return (
          <View key={cardId} style={[styles.row, { borderColor: RARITY_COLOR[card.rarity] }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.cardName}>
                {card.name} <Text style={styles.cardCost}>(コスト{card.cost})</Text>
              </Text>
              <Text style={styles.cardDesc}>{card.description}</Text>
            </View>
            <View style={styles.countControls}>
              <Pressable
                style={[styles.countBtn, count === 0 && styles.countBtnDisabled]}
                disabled={count === 0}
                onPress={() => removeCard(cardId)}
              >
                <Text style={styles.countBtnText}>−</Text>
              </Pressable>
              <Text style={styles.countText}>
                {count}/{max}
              </Text>
              <Pressable
                style={[styles.countBtn, !canAddCardToDeck(deck, cardId, profile) && styles.countBtnDisabled]}
                disabled={!canAddCardToDeck(deck, cardId, profile)}
                onPress={() => addCard(cardId)}
              >
                <Text style={styles.countBtnText}>＋</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#12121a' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#3f8efc', fontSize: 13, marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  sizeText: { color: '#5fae6b', fontSize: 12, marginTop: 6, fontWeight: '700' },
  sizeTextInvalid: { color: '#e8452f' },
  helpText: { color: '#9a9ab0', fontSize: 11, marginTop: 4, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c26',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  rowInfo: { flex: 1, marginRight: 8 },
  cardName: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardCost: { color: '#9a9ab0', fontWeight: '400', fontSize: 11 },
  cardDesc: { color: '#9a9ab0', fontSize: 11, marginTop: 2 },
  countControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3f8efc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnDisabled: { backgroundColor: '#2a2a35' },
  countBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700', minWidth: 34, textAlign: 'center' },
});
