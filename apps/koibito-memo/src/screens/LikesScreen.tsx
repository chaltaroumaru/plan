import React, { useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LikeItem } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { makeId, useStoredList } from '../storage/useStoredList';
import { Chip, COLORS, EmptyState, ScreenTitle, TextField } from '../components/ui';
import ItemCard from '../components/ItemCard';
import FormModal from '../components/FormModal';

const SUGGESTED_CATEGORIES = ['好きな食べ物', '好きな色', 'サイズ', '好きなブランド', '苦手なもの', 'その他'];

const EMPTY: Omit<LikeItem, 'id'> = { category: SUGGESTED_CATEGORIES[0], text: '' };

export default function LikesScreen() {
  const { items, addItem, updateItem, removeItem } = useStoredList<LikeItem>(STORAGE_KEYS.likes);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<LikeItem, 'id'>>(EMPTY);

  const sections = useMemo(() => {
    const grouped = new Map<string, LikeItem[]>();
    items.forEach((item) => {
      const list = grouped.get(item.category) ?? [];
      list.push(item);
      grouped.set(item.category, list);
    });
    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (item: LikeItem) => {
    setEditingId(item.id);
    setForm({ category: item.category, text: item.text });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!form.text.trim()) {
      Alert.alert('入力エラー', '内容を入力してください。');
      return;
    }
    if (!form.category.trim()) {
      Alert.alert('入力エラー', 'カテゴリを入力してください。');
      return;
    }
    if (editingId) {
      updateItem(editingId, (prev) => ({ ...prev, ...form }));
    } else {
      addItem({ id: makeId(), ...form });
    }
    setModalVisible(false);
  };

  const handleDelete = () => {
    if (editingId) removeItem(editingId);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <ScreenTitle title="好きなもの" subtitle="好み・サイズ・苦手なものをメモ" />
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </Pressable>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="好きなものはまだ登録されていません。" />}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <ItemCard
              title={item.text}
              onEdit={() => openEdit(item)}
              onDelete={() =>
                Alert.alert('削除確認', `「${item.text}」を削除しますか?`, [
                  { text: 'キャンセル', style: 'cancel' },
                  { text: '削除', style: 'destructive', onPress: () => removeItem(item.id) },
                ])
              }
            />
          )}
        />
      </View>

      <FormModal
        visible={modalVisible}
        title={editingId ? '好きなものを編集' : '好きなものを追加'}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        showDelete={!!editingId}
        onDelete={handleDelete}
      >
        <Text style={styles.label}>カテゴリ</Text>
        <View style={styles.chipRow}>
          {SUGGESTED_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={form.category === c}
              onPress={() => setForm((f) => ({ ...f, category: c }))}
            />
          ))}
        </View>
        <TextField
          label="カテゴリ名 (自由入力も可)"
          value={form.category}
          onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
          placeholder="例: 好きな映画"
        />
        <TextField
          label="内容"
          value={form.text}
          onChangeText={(v) => setForm((f) => ({ ...f, text: v }))}
          placeholder="例: いちご味、Mサイズ、猫アレルギー など"
          multiline
        />
      </FormModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  label: { fontSize: 12, color: COLORS.subtext, marginBottom: 4, fontWeight: '600' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 12,
    marginBottom: 6,
  },
});
