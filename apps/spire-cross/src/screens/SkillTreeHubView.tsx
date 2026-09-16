import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useGame } from '../state/GameContext';
import { RARITY_COLOR, getRosterCharacters } from '../data/characters';
import SkillTreePanel from '../components/SkillTreePanel';

export default function SkillTreeHubView({
  initialCharacterId,
  onBack,
}: {
  initialCharacterId: string | null;
  onBack: () => void;
}) {
  const { profile } = useGame();
  const ownedCharacters = useMemo(
    () => getRosterCharacters().filter((c) => !!profile.ownedCharacterCounts[c.id]),
    [profile.ownedCharacterCounts, profile.traveler]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    initialCharacterId && profile.ownedCharacterCounts[initialCharacterId]
      ? initialCharacterId
      : ownedCharacters[0]?.id ?? null
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = selectedId ? ownedCharacters.find((c) => c.id === selectedId) ?? null : null;

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← キャラクターへ戻る</Text>
        </Pressable>
        <Text style={styles.title}>スキルツリー</Text>

        {!selected ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>キャラクターを所持していません。ガチャで仲間を集めましょう。</Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.charHeaderCard} onPress={() => setPickerOpen(true)}>
              <View style={[styles.charAvatar, { borderColor: RARITY_COLOR[selected.rarity] }]}>
                <Text style={styles.charEmoji}>{selected.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[selected.rarity] }]}>
                    <Text style={styles.rarityText}>{selected.rarity}</Text>
                  </View>
                  <Text style={styles.charName}>{selected.name}</Text>
                </View>
                <Text style={styles.charSub}>
                  {selected.title} ・ {selected.element}属性 ・ Lv.{profile.characterProgress[selected.id]?.level ?? 1}
                </Text>
                <Text style={styles.switchHint}>タップしてキャラを切り替え ▾</Text>
              </View>
            </Pressable>

            <SkillTreePanel character={selected} />
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>キャラクターを選択</Text>
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {ownedCharacters.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.modalTile, { borderColor: RARITY_COLOR[c.rarity] }, c.id === selectedId && styles.modalTileSelected]}
                  onPress={() => {
                    setSelectedId(c.id);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={styles.modalEmoji}>{c.emoji}</Text>
                  <Text style={styles.modalName} numberOfLines={1}>
                    {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 48 },
  backLink: { color: '#7c5cff', fontSize: 13, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 12 },
  emptyBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { color: '#9a9ab0', fontSize: 13, textAlign: 'center' },
  charHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,20,58,0.9)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,92,255,0.35)',
  },
  charAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    backgroundColor: 'rgba(15,11,32,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  charEmoji: { fontSize: 32 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rarityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  charName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  charSub: { color: '#9a9ab0', fontSize: 11, marginTop: 3 },
  switchHint: { color: '#7c5cff', fontSize: 11, marginTop: 6, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#150f2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 24 },
  modalTile: {
    width: 84,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'rgba(30,20,58,0.78)',
    padding: 8,
    alignItems: 'center',
    margin: 4,
  },
  modalTileSelected: { backgroundColor: '#33334a' },
  modalEmoji: { fontSize: 26, marginBottom: 4 },
  modalName: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
