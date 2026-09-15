import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CharacterDef } from '../types';
import { RARITY_COLOR } from '../data/characters';

interface Props {
  character: CharacterDef;
  owned: boolean;
  selected?: boolean;
  level?: number;
  onPress?: () => void;
}

export default function CharacterTile({ character, owned, selected, level, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!owned || !onPress}
      style={[
        styles.tile,
        { borderColor: RARITY_COLOR[character.rarity] },
        !owned && styles.locked,
        selected && styles.selected,
      ]}
    >
      <Text style={styles.emoji}>{owned ? character.emoji : '❓'}</Text>
      <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[character.rarity] }]}>
        <Text style={styles.rarityText}>{character.rarity}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {owned ? character.name : '未所持'}
      </Text>
      {owned && (
        <Text style={styles.title} numberOfLines={1}>
          {character.title}
        </Text>
      )}
      {owned && level !== undefined && <Text style={styles.level}>Lv.{level}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 104,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1c1c26',
    padding: 8,
    alignItems: 'center',
    margin: 4,
  },
  locked: {
    opacity: 0.4,
  },
  selected: {
    backgroundColor: '#33334a',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  rarityBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rarityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  title: {
    color: '#9a9ab0',
    fontSize: 10,
    marginTop: 1,
  },
  level: {
    color: '#f5b400',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },
});
