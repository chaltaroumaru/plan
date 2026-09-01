import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GiftEntry, GiftForWhom, GiftStatus } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { makeId, useStoredList } from '../storage/useStoredList';
import { Chip, COLORS, EmptyState, ScreenTitle, TextField } from '../components/ui';
import ItemCard from '../components/ItemCard';
import FormModal from '../components/FormModal';
import PhotoField from '../components/PhotoField';
import { formatJP, todayISO } from '../utils/date';

const STATUS_LABEL: Record<GiftStatus, string> = {
  idea: 'アイデア',
  planned: '予定',
  given: '贈った',
  received: 'もらった',
};

const STATUS_COLOR: Record<GiftStatus, string> = {
  idea: '#c7a8b0',
  planned: '#e8a35c',
  given: COLORS.primary,
  received: '#7bb08a',
};

const FOR_WHOM_LABEL: Record<GiftForWhom, string> = {
  partner: '相手へ',
  me: '自分へ',
};

const EMPTY: Omit<GiftEntry, 'id'> = {
  title: '',
  forWhom: 'partner',
  occasion: '',
  status: 'idea',
  price: '',
  date: todayISO(),
  note: '',
  photoUri: '',
};

export default function GiftScreen() {
  const { items, addItem, updateItem, removeItem } = useStoredList<GiftEntry>(STORAGE_KEYS.gifts);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<GiftEntry, 'id'>>(EMPTY);
  const [filter, setFilter] = useState<GiftStatus | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.status === filter)),
    [items, filter]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (item: GiftEntry) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      forWhom: item.forWhom,
      occasion: item.occasion,
      status: item.status,
      price: item.price,
      date: item.date,
      note: item.note,
      photoUri: item.photoUri,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください。');
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
          <ScreenTitle title="プレゼント" subtitle="贈り物のアイデアと記録" />
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Chip label="すべて" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {(Object.keys(STATUS_LABEL) as GiftStatus[]).map((s) => (
            <Chip key={s} label={STATUS_LABEL[s]} selected={filter === s} onPress={() => setFilter(s)} />
          ))}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="プレゼントの記録はまだありません。" />}
          renderItem={({ item }) => (
            <ItemCard
              title={item.title}
              subtitle={`${FOR_WHOM_LABEL[item.forWhom]}${item.occasion ? ` ・ ${item.occasion}` : ''}${
                item.price ? ` ・ ¥${item.price}` : ''
              }`}
              detail={`${item.date ? formatJP(item.date) : ''}${item.note ? ` ・ ${item.note}` : ''}`}
              badge={STATUS_LABEL[item.status]}
              badgeColor={STATUS_COLOR[item.status]}
              photoUri={item.photoUri}
              onEdit={() => openEdit(item)}
              onDelete={() =>
                Alert.alert('削除確認', `「${item.title}」を削除しますか?`, [
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
        title={editingId ? 'プレゼントを編集' : 'プレゼントを追加'}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        showDelete={!!editingId}
        onDelete={handleDelete}
      >
        <TextField
          label="タイトル"
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholder="例: 誕生日のネックレス"
        />
        <Text style={styles.label}>誰へ</Text>
        <View style={styles.chipRow}>
          {(Object.keys(FOR_WHOM_LABEL) as GiftForWhom[]).map((k) => (
            <Chip
              key={k}
              label={FOR_WHOM_LABEL[k]}
              selected={form.forWhom === k}
              onPress={() => setForm((f) => ({ ...f, forWhom: k }))}
            />
          ))}
        </View>
        <Text style={styles.label}>ステータス</Text>
        <View style={styles.chipRow}>
          {(Object.keys(STATUS_LABEL) as GiftStatus[]).map((k) => (
            <Chip
              key={k}
              label={STATUS_LABEL[k]}
              selected={form.status === k}
              onPress={() => setForm((f) => ({ ...f, status: k }))}
            />
          ))}
        </View>
        <TextField
          label="機会 (誕生日など)"
          value={form.occasion}
          onChangeText={(v) => setForm((f) => ({ ...f, occasion: v }))}
          placeholder="例: クリスマス"
        />
        <TextField
          label="金額"
          value={form.price}
          onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
          placeholder="例: 5000"
          keyboardType="numeric"
        />
        <TextField
          label="日付 (YYYY-MM-DD)"
          value={form.date}
          onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          placeholder="2024-01-01"
        />
        <TextField
          label="メモ"
          value={form.note}
          onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
          placeholder="サイズ・色など"
          multiline
        />
        <PhotoField uri={form.photoUri} onChange={(v) => setForm((f) => ({ ...f, photoUri: v }))} />
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
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  label: { fontSize: 12, color: COLORS.subtext, marginBottom: 4, fontWeight: '600' },
});
