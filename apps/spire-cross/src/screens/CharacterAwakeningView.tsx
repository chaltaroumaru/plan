import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useGame } from '../state/GameContext';
import { CHARACTERS, RARITY_COLOR } from '../data/characters';
import { getAwakeningStory } from '../data/awakeningStories';
import { AWAKENING_REQUIRED_LEVEL, AWAKENING_REQUIRED_MEMORY, canAwaken, awakenCharacter } from '../game/awakening';

export default function CharacterAwakeningView({ onBack }: { onBack: () => void }) {
  const { profile, updateProfile } = useGame();
  const ownedCharacters = useMemo(
    () => CHARACTERS.filter((c) => !!profile.ownedCharacterCounts[c.id]),
    [profile.ownedCharacterCounts]
  );
  const [selectedId, setSelectedId] = useState<string | null>(ownedCharacters[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = selectedId ? ownedCharacters.find((c) => c.id === selectedId) ?? null : null;
  const progress = selected ? profile.characterProgress[selected.id] : null;
  const story = selected ? getAwakeningStory(selected.id) : null;
  const memoryOwned = profile.materials.memory ?? 0;
  const check = selected && progress ? canAwaken(selected, progress, profile) : null;

  const handleAwaken = () => {
    if (!selected || !progress) return;
    const result = canAwaken(selected, progress, profile);
    if (!result.ok) {
      Alert.alert('覚醒できません', result.reason ?? '');
      return;
    }
    updateProfile((prev) => awakenCharacter(prev, selected, prev.characterProgress[selected.id]));
  };

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={onBack}>
          <Text style={styles.backLink}>← キャラクターへ戻る</Text>
        </Pressable>
        <Text style={styles.title}>キャラクター覚醒</Text>
        <Text style={styles.subtitle}>
          ダンジョン「記憶のかけらクエスト」で🧩記憶のかけらを集め、失った大切な人の記憶と向き合うことで
          キャラクターが一段強くなる。
        </Text>

        {!selected || !progress ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>キャラクターを所持していません。ガチャで仲間を集めましょう。</Text>
          </View>
        ) : (
          <>
            <Pressable style={styles.charHeaderCard} onPress={() => setPickerOpen(true)}>
              <View style={[styles.charAvatar, { borderColor: RARITY_COLOR[selected.rarity] }]}>
                <Text style={styles.charEmoji}>{selected.emoji}</Text>
                {progress.awakened && (
                  <View style={styles.awakenedBadge}>
                    <Text style={styles.awakenedBadgeText}>覚醒済</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[selected.rarity] }]}>
                    <Text style={styles.rarityText}>{selected.rarity}</Text>
                  </View>
                  <Text style={styles.charName}>{selected.name}</Text>
                </View>
                <Text style={styles.charSub}>
                  {selected.title} ・ Lv.{progress.level}
                </Text>
                <Text style={styles.switchHint}>タップしてキャラを切り替え ▾</Text>
              </View>
            </Pressable>

            {story && (
              <View style={styles.storyBox}>
                <Text style={styles.storySectionLabel}>抱えている想い</Text>
                <Text style={styles.storyText}>{story.loss}</Text>
              </View>
            )}

            {progress.awakened ? (
              <View style={[styles.storyBox, styles.storyBoxResolved]}>
                <Text style={styles.storySectionLabel}>✨ 覚醒 — 見つけた記憶</Text>
                <Text style={styles.storyText}>{story?.resolution}</Text>
                <Text style={styles.bonusText}>HP・攻撃力・防御力 +12%</Text>
              </View>
            ) : (
              <View style={styles.progressBox}>
                <Text style={styles.progressLabel}>覚醒条件</Text>
                <Text style={[styles.progressLine, progress.level >= AWAKENING_REQUIRED_LEVEL && styles.progressOk]}>
                  ・ Lv.{AWAKENING_REQUIRED_LEVEL}以上(現在 Lv.{progress.level})
                </Text>
                <Text style={[styles.progressLine, memoryOwned >= AWAKENING_REQUIRED_MEMORY && styles.progressOk]}>
                  ・ 🧩記憶のかけら {AWAKENING_REQUIRED_MEMORY}個(所持 {memoryOwned}個)
                </Text>
                <Pressable
                  style={[styles.awakenBtn, !check?.ok && styles.awakenBtnDisabled]}
                  disabled={!check?.ok}
                  onPress={handleAwaken}
                >
                  <Text style={styles.awakenBtnText}>{check?.ok ? '覚醒する' : '条件を満たしていません'}</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <Text style={styles.modalTitle}>キャラクターを選択</Text>
            <ScrollView contentContainerStyle={styles.modalGrid}>
              {ownedCharacters.map((c) => {
                const p = profile.characterProgress[c.id];
                return (
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
                    {p?.awakened && <Text style={styles.modalAwakened}>✨覚醒済</Text>}
                  </Pressable>
                );
              })}
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
  title: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#9a9ab0', fontSize: 12, lineHeight: 18, marginBottom: 16 },
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
  awakenedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    backgroundColor: '#f5b400',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  awakenedBadgeText: { color: '#1a1330', fontSize: 8, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rarityBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  rarityText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  charName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  charSub: { color: '#9a9ab0', fontSize: 11, marginTop: 3 },
  switchHint: { color: '#7c5cff', fontSize: 11, marginTop: 6, fontWeight: '700' },
  storyBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14, marginBottom: 14 },
  storyBoxResolved: { borderWidth: 1, borderColor: 'rgba(245,180,0,0.5)' },
  storySectionLabel: { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 6 },
  storyText: { color: '#c4c4d4', fontSize: 12, lineHeight: 19 },
  bonusText: { color: '#f5b400', fontSize: 12, fontWeight: '800', marginTop: 10 },
  progressBox: { backgroundColor: 'rgba(30,20,58,0.78)', borderRadius: 12, padding: 14 },
  progressLabel: { color: '#fff', fontWeight: '800', fontSize: 13, marginBottom: 8 },
  progressLine: { color: '#9a9ab0', fontSize: 12, marginBottom: 4 },
  progressOk: { color: '#5fae6b', fontWeight: '700' },
  awakenBtn: { backgroundColor: '#7c5cff', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  awakenBtnDisabled: { backgroundColor: 'rgba(124,92,255,0.28)' },
  awakenBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
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
  modalAwakened: { color: '#f5b400', fontSize: 8, fontWeight: '800', marginTop: 2 },
});
