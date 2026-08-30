import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Anniversary, CosmeticItem, GiftEntry, PeriodLog } from '../types';
import { STORAGE_KEYS } from '../storage/persistence';
import { useStoredList } from '../storage/useStoredList';
import { COLORS, ScreenTitle } from '../components/ui';
import {
  addDays,
  averageCycleLength,
  daysBetween,
  daysUntilNext,
  formatJP,
  parseISODate,
  todayISO,
} from '../utils/date';

function SummaryCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {emoji} {title}
      </Text>
      {children}
    </View>
  );
}

export default function DashboardScreen() {
  const { items: anniversaries } = useStoredList<Anniversary>(STORAGE_KEYS.anniversaries);
  const { items: gifts } = useStoredList<GiftEntry>(STORAGE_KEYS.gifts);
  const { items: cosmetics } = useStoredList<CosmeticItem>(STORAGE_KEYS.cosmetics);
  const { items: periods } = useStoredList<PeriodLog>(STORAGE_KEYS.periods);

  const nextAnniversary = useMemo(() => {
    const withDays = anniversaries
      .map((a) => ({ a, days: daysUntilNext(a.date, a.repeatYearly) }))
      .filter((x) => x.days !== null && (x.a.repeatYearly ? x.days >= 0 : true))
      .sort((x, y) => (x.days ?? 0) - (y.days ?? 0));
    return withDays[0] ?? null;
  }, [anniversaries]);

  const pendingGifts = useMemo(
    () => gifts.filter((g) => g.status === 'idea' || g.status === 'planned'),
    [gifts]
  );

  const attentionCosmetics = useMemo(() => {
    return cosmetics.filter((c) => {
      if (c.repurchase) return true;
      if (!c.openedDate || !c.expiryMonths) return false;
      const months = Number(c.expiryMonths);
      if (!Number.isFinite(months) || months <= 0) return false;
      const expiry = addDays(c.openedDate, Math.round(months * 30.4));
      if (!expiry) return false;
      const d = parseISODate(expiry);
      if (!d) return false;
      return daysBetween(new Date(), d) <= 30;
    });
  }, [cosmetics]);

  const periodInfo = useMemo(() => {
    const sortedAsc = [...periods].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
    const last = sortedAsc[sortedAsc.length - 1] ?? null;
    if (!last) return null;
    const cycle = averageCycleLength(sortedAsc.map((p) => p.startDate)) ?? 28;
    const next = addDays(last.startDate, cycle);
    if (!next) return null;
    const nextDate = parseISODate(next);
    if (!nextDate) return null;
    return { next, daysLeft: daysBetween(new Date(), nextDate) };
  }, [periods]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <ScreenTitle title="恋人メモ" subtitle={`今日は ${formatJP(todayISO())}`} />

        <SummaryCard emoji="🎉" title="次の記念日">
          {nextAnniversary ? (
            <>
              <Text style={styles.mainLine}>{nextAnniversary.a.title}</Text>
              <Text style={styles.subLine}>
                {formatJP(nextAnniversary.a.date)} ・ あと{nextAnniversary.days}日
              </Text>
            </>
          ) : (
            <Text style={styles.subLine}>記念日はまだ登録されていません。</Text>
          )}
        </SummaryCard>

        <SummaryCard emoji="🎁" title="プレゼントの予定">
          {pendingGifts.length > 0 ? (
            <>
              <Text style={styles.mainLine}>未対応 {pendingGifts.length}件</Text>
              {pendingGifts.slice(0, 3).map((g) => (
                <Text key={g.id} style={styles.subLine}>
                  ・{g.title}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.subLine}>アイデア・予定中のプレゼントはありません。</Text>
          )}
        </SummaryCard>

        <SummaryCard emoji="💄" title="化粧品の注意">
          {attentionCosmetics.length > 0 ? (
            <>
              <Text style={styles.mainLine}>要チェック {attentionCosmetics.length}件</Text>
              {attentionCosmetics.slice(0, 3).map((c) => (
                <Text key={c.id} style={styles.subLine}>
                  ・{c.name}
                  {c.repurchase ? ' (リピート希望)' : ' (期限が近い)'}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.subLine}>期限切れ間近・リピート希望はありません。</Text>
          )}
        </SummaryCard>

        <SummaryCard emoji="🩷" title="生理予測">
          {periodInfo ? (
            <>
              <Text style={styles.mainLine}>次回予測: {formatJP(periodInfo.next)}</Text>
              <Text style={styles.subLine}>
                {periodInfo.daysLeft >= 0
                  ? `あと${periodInfo.daysLeft}日`
                  : `${Math.abs(periodInfo.daysLeft)}日超過`}
              </Text>
            </>
          ) : (
            <Text style={styles.subLine}>開始日を記録すると予測が表示されます。</Text>
          )}
        </SummaryCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, paddingBottom: 48 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.primaryDark, marginBottom: 8 },
  mainLine: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  subLine: { fontSize: 12, color: COLORS.subtext, marginTop: 2 },
});
