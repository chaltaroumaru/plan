import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, View, Pressable, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CosmeticItem } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { makeId, useStoredList } from '../storage/useStoredList';
import { Chip, COLORS, EmptyState, ScreenTitle, TextField } from '../components/ui';
import ItemCard from '../components/ItemCard';
import FormModal from '../components/FormModal';
import { addDays, formatJP, todayISO } from '../utils/date';

const CATEGORIES = ['スキンケア', 'メイク', 'ヘアケア', 'ボディケア', 'その他'];

const EMPTY: Omit<CosmeticItem, 'id'> = {
  name: '',
  category: 'スキンケア',
  openedDate: '',
  expiryMonths: '',
  repurchase: false,
  note: '',
};

function expiryInfo(item: CosmeticItem): { text: string; warn: boolean } | null {
  if (!item.openedDate || !item.expiryMonths) return null;
  const months = Number(item.expiryMonths);
  if (!Number.isFinite(months) || months <= 0) return null;
  const expiry = addDays(item.openedDate, Math.round(months * 30.4));
  if (!expiry) return null;
  const daysLeft = Math.round((new Date(expiry).getTime() - new Date(todayISO()).getTime()) / 86400000);
  if (daysLeft < 0) return { text: `使用期限切れ (${formatJP(expiry)})`, warn: true };
  if (daysLeft <= 30) return { text: `あと${daysLeft}日で使用期限 (${formatJP(expiry)})`, warn: true };
  return { text: `使用期限: ${formatJP(expiry)}`, warn: false };
}

export default function CosmeticsScreen() {
  const { items, addItem, updateItem, removeItem } = useStoredList<CosmeticItem>(
    STORAGE_KEYS.cosmetics
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CosmeticItem, 'id'>>(EMPTY);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (item: CosmeticItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      openedDate: item.openedDate,
      expiryMonths: item.expiryMonths,
      repurchase: item.repurchase,
      note: item.note,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      Alert.alert('入力エラー', '商品名を入力してください。');
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
          <ScreenTitle title="化粧品" subtitle="使用期限とリピート希望を管理" />
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </Pressable>
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="化粧品はまだ登録されていません。" />}
          renderItem={({ item }) => {
            const info = expiryInfo(item);
            return (
              <ItemCard
                title={item.name}
                subtitle={`${item.category}${item.repurchase ? ' ・ 🔁リピート希望' : ''}`}
                detail={`${info?.text ?? ''}${item.note ? `\n${item.note}` : ''}`}
                badge={info?.warn ? '要注意' : undefined}
                badgeColor={COLORS.danger}
                onEdit={() => openEdit(item)}
                onDelete={() =>
                  Alert.alert('削除確認', `「${item.name}」を削除しますか?`, [
                    { text: 'キャンセル', style: 'cancel' },
                    { text: '削除', style: 'destructive', onPress: () => removeItem(item.id) },
                  ])
                }
              />
            );
          }}
        />
      </View>

      <FormModal
        visible={modalVisible}
        title={editingId ? '化粧品を編集' : '化粧品を追加'}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        showDelete={!!editingId}
        onDelete={handleDelete}
      >
        <TextField
          label="商品名"
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="例: 化粧水 〇〇"
        />
        <Text style={styles.label}>カテゴリ</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              selected={form.category === c}
              onPress={() => setForm((f) => ({ ...f, category: c }))}
            />
          ))}
        </View>
        <TextField
          label="開封日 (YYYY-MM-DD)"
          value={form.openedDate}
          onChangeText={(v) => setForm((f) => ({ ...f, openedDate: v }))}
          placeholder="2024-01-01"
        />
        <TextField
          label="使用期限 (開封後 何ヶ月)"
          value={form.expiryMonths}
          onChangeText={(v) => setForm((f) => ({ ...f, expiryMonths: v }))}
          placeholder="例: 6"
          keyboardType="numeric"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>リピート購入したい</Text>
          <Switch
            value={form.repurchase}
            onValueChange={(v) => setForm((f) => ({ ...f, repurchase: v }))}
          />
        </View>
        <TextField
          label="メモ"
          value={form.note}
          onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
          placeholder="使用感など"
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
});
