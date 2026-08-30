import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View, Pressable, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Anniversary } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { makeId, useStoredList } from '../storage/useStoredList';
import { COLORS, EmptyState, ScreenTitle, TextField } from '../components/ui';
import ItemCard from '../components/ItemCard';
import FormModal from '../components/FormModal';
import { daysUntilNext, formatJP, todayISO, yearsSince } from '../utils/date';

const EMPTY: Omit<Anniversary, 'id'> = {
  title: '',
  date: todayISO(),
  repeatYearly: true,
  note: '',
};

export default function AnniversaryScreen() {
  const { items, addItem, updateItem, removeItem } = useStoredList<Anniversary>(
    STORAGE_KEYS.anniversaries
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Anniversary, 'id'>>(EMPTY);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = daysUntilNext(a.date, a.repeatYearly) ?? 99999;
      const db = daysUntilNext(b.date, b.repeatYearly) ?? 99999;
      return da - db;
    });
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (item: Anniversary) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      date: item.date,
      repeatYearly: item.repeatYearly,
      note: item.note,
    });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください。');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      Alert.alert('入力エラー', '日付は YYYY-MM-DD の形式で入力してください。');
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
          <ScreenTitle title="記念日" subtitle="大切な日をカウントダウン" />
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ 追加</Text>
          </Pressable>
        </View>

        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="記念日はまだ登録されていません。" />}
          renderItem={({ item }) => {
            const days = daysUntilNext(item.date, item.repeatYearly);
            const years = item.repeatYearly ? yearsSince(item.date) : null;
            let badge = '';
            let badgeColor = COLORS.accent;
            if (days !== null) {
              if (days === 0) {
                badge = '今日!';
                badgeColor = COLORS.primary;
              } else if (days > 0) {
                badge = `あと${days}日`;
                if (days <= 7) badgeColor = COLORS.primary;
              } else {
                badge = `${Math.abs(days)}日前`;
                badgeColor = '#b7a2aa';
              }
            }
            return (
              <ItemCard
                title={item.title}
                subtitle={`${formatJP(item.date)}${item.repeatYearly ? ' (毎年)' : ''}${
                  years !== null && years >= 0 ? ` ・ ${years}周年` : ''
                }`}
                detail={item.note}
                badge={badge}
                badgeColor={badgeColor}
                onEdit={() => openEdit(item)}
                onDelete={() =>
                  Alert.alert('削除確認', `「${item.title}」を削除しますか?`, [
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
        title={editingId ? '記念日を編集' : '記念日を追加'}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        showDelete={!!editingId}
        onDelete={handleDelete}
      >
        <TextField
          label="タイトル"
          value={form.title}
          onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
          placeholder="例: 付き合った記念日"
        />
        <TextField
          label="日付 (YYYY-MM-DD)"
          value={form.date}
          onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
          placeholder="2024-01-01"
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>毎年繰り返す</Text>
          <Switch
            value={form.repeatYearly}
            onValueChange={(v) => setForm((f) => ({ ...f, repeatYearly: v }))}
          />
        </View>
        <TextField
          label="メモ"
          value={form.note}
          onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
          placeholder="任意メモ"
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  switchLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
});
