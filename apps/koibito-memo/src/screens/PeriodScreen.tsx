import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PeriodLog } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { makeId, useStoredList } from '../storage/useStoredList';
import { COLORS, EmptyState, ScreenTitle, TextField } from '../components/ui';
import ItemCard from '../components/ItemCard';
import FormModal from '../components/FormModal';
import { addDays, averageCycleLength, daysBetween, formatJP, parseISODate, todayISO } from '../utils/date';

const DEFAULT_CYCLE = 28;

const EMPTY: Omit<PeriodLog, 'id'> = { startDate: todayISO(), note: '' };

export default function PeriodScreen() {
  const { items, addItem, updateItem, removeItem } = useStoredList<PeriodLog>(
    STORAGE_KEYS.periods
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PeriodLog, 'id'>>(EMPTY);

  const sortedDesc = useMemo(
    () => [...items].sort((a, b) => (a.startDate < b.startDate ? 1 : -1)),
    [items]
  );
  const sortedAsc = useMemo(() => [...sortedDesc].reverse(), [sortedDesc]);

  const cycleLength = averageCycleLength(sortedAsc.map((p) => p.startDate)) ?? DEFAULT_CYCLE;
  const lastStart = sortedDesc[0]?.startDate ?? null;
  const nextPredicted = lastStart ? addDays(lastStart, cycleLength) : null;
  const daysUntilNextPeriod = useMemo(() => {
    if (!nextPredicted) return null;
    const target = parseISODate(nextPredicted);
    if (!target) return null;
    return daysBetween(new Date(), target);
  }, [nextPredicted]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setModalVisible(true);
  };

  const openEdit = (item: PeriodLog) => {
    setEditingId(item.id);
    setForm({ startDate: item.startDate, note: item.note });
    setModalVisible(true);
  };

  const handleSubmit = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
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
          <ScreenTitle title="生理管理" subtitle="開始日を記録して周期を予測" />
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Text style={styles.addBtnText}>＋ 記録</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          {lastStart ? (
            <>
              <Text style={styles.summaryLine}>前回開始日: {formatJP(lastStart)}</Text>
              <Text style={styles.summaryLine}>
                平均周期: {cycleLength}日{sortedAsc.length < 2 ? ' (デフォルト値)' : ''}
              </Text>
              {nextPredicted && (
                <Text style={styles.summaryHighlight}>
                  次回予測日: {formatJP(nextPredicted)}
                  {daysUntilNextPeriod !== null
                    ? daysUntilNextPeriod >= 0
                      ? ` (あと${daysUntilNextPeriod}日)`
                      : ` (${Math.abs(daysUntilNextPeriod)}日超過)`
                    : ''}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.summaryLine}>記録を追加すると次回予測が表示されます。</Text>
          )}
        </View>

        <FlatList
          data={sortedDesc}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<EmptyState text="記録はまだありません。" />}
          renderItem={({ item }) => (
            <ItemCard
              title={formatJP(item.startDate)}
              detail={item.note}
              onEdit={() => openEdit(item)}
              onDelete={() =>
                Alert.alert('削除確認', `${formatJP(item.startDate)}の記録を削除しますか?`, [
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
        title={editingId ? '記録を編集' : '開始日を記録'}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmit}
        showDelete={!!editingId}
        onDelete={handleDelete}
      >
        <TextField
          label="開始日 (YYYY-MM-DD)"
          value={form.startDate}
          onChangeText={(v) => setForm((f) => ({ ...f, startDate: v }))}
          placeholder="2024-01-01"
        />
        <TextField
          label="メモ"
          value={form.note}
          onChangeText={(v) => setForm((f) => ({ ...f, note: v }))}
          placeholder="体調など (任意)"
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
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
  },
  summaryLine: { fontSize: 13, color: COLORS.text, marginBottom: 4 },
  summaryHighlight: { fontSize: 15, color: COLORS.primaryDark, fontWeight: '800', marginTop: 2 },
});
