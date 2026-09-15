import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CardDef } from '../types';
import { RARITY_COLOR } from '../data/characters';

interface Props {
  card: CardDef;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
  selected?: boolean;
  testID?: string;
}

const ELEMENT_ICON: Record<string, string> = {
  火: '🔥',
  水: '💧',
  風: '🌪️',
  土: '🪨',
  雷: '⚡',
  光: '✨',
  闇: '🌑',
};

const TYPE_LABEL: Record<CardDef['type'], string> = {
  attack: '攻撃',
  skill: 'スキル',
  power: 'パワー',
};

const TYPE_ICON: Record<CardDef['type'], string> = {
  attack: '⚔️',
  skill: '🛡️',
  power: '✨',
};

export default function CardView({ card, onPress, disabled, compact, selected, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderColor: RARITY_COLOR[card.rarity] },
        disabled && styles.disabled,
        selected && styles.selected,
      ]}
    >
      <View style={styles.costBadge}>
        <Text style={styles.costText}>{card.cost}</Text>
      </View>
      {card.element && <Text style={styles.elementBadge}>{ELEMENT_ICON[card.element]}</Text>}
      <Text style={styles.icon}>{TYPE_ICON[card.type]}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {card.name}
      </Text>
      <Text style={styles.type}>{TYPE_LABEL[card.type]}</Text>
      <Text style={styles.desc} numberOfLines={3}>
        {card.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 108,
    minHeight: 140,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#20202c',
    padding: 8,
    margin: 4,
  },
  cardCompact: {
    width: 92,
    minHeight: 120,
  },
  disabled: {
    opacity: 0.35,
  },
  selected: {
    backgroundColor: '#33334a',
    transform: [{ translateY: -8 }],
  },
  elementBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 14,
  },
  costBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7c5cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
    marginTop: 14,
  },
  name: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  type: {
    color: '#9a9ab0',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  desc: {
    color: '#c4c4d4',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});
