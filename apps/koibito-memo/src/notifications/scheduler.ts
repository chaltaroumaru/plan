import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Anniversary, CosmeticItem, PeriodLog } from '../types';
import { addDays, averageCycleLength, parseISODate } from '../utils/date';

const REMINDER_DAYS_BEFORE = 3;
const NOTIFY_HOUR = 9;
const NOTIFY_MINUTE = 0;

const isSupported = Platform.OS !== 'web';

if (isSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Requests notification permission once (e.g. on app launch). No-op on web. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isSupported) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'デフォルト',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function isPermissionGranted(): Promise<boolean> {
  if (!isSupported) return false;
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

async function safeCancel(identifier: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // identifier may not exist yet; ignore
  }
}

function atNotifyTime(d: Date): Date {
  const next = new Date(d);
  next.setHours(NOTIFY_HOUR, NOTIFY_MINUTE, 0, 0);
  return next;
}

/** (Re)schedules reminders for every anniversary: on the day, and a few days before. */
export async function syncAnniversaryNotifications(items: Anniversary[]): Promise<void> {
  if (!(await isPermissionGranted())) return;

  for (const item of items) {
    const base = parseISODate(item.date);
    const dayId = `anniv-day-${item.id}`;
    const beforeId = `anniv-before-${item.id}`;
    await safeCancel(dayId);
    await safeCancel(beforeId);
    if (!base) continue;

    if (item.repeatYearly) {
      await Notifications.scheduleNotificationAsync({
        identifier: dayId,
        content: { title: '🎉 今日は記念日です', body: item.title },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: base.getMonth(),
          day: base.getDate(),
          hour: NOTIFY_HOUR,
          minute: NOTIFY_MINUTE,
        },
      });
      const before = new Date(base);
      before.setDate(before.getDate() - REMINDER_DAYS_BEFORE);
      await Notifications.scheduleNotificationAsync({
        identifier: beforeId,
        content: {
          title: `📅 ${REMINDER_DAYS_BEFORE}日後は記念日です`,
          body: item.title,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
          month: before.getMonth(),
          day: before.getDate(),
          hour: NOTIFY_HOUR,
          minute: NOTIFY_MINUTE,
        },
      });
    } else {
      const dayDate = atNotifyTime(base);
      if (dayDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          identifier: dayId,
          content: { title: '🎉 今日は記念日です', body: item.title },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayDate },
        });
      }
      const before = new Date(base);
      before.setDate(before.getDate() - REMINDER_DAYS_BEFORE);
      const beforeDate = atNotifyTime(before);
      if (beforeDate.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          identifier: beforeId,
          content: {
            title: `📅 ${REMINDER_DAYS_BEFORE}日後は記念日です`,
            body: item.title,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: beforeDate },
        });
      }
    }
  }
}

/** (Re)schedules a reminder a few days before each cosmetic item's use-by date. */
export async function syncCosmeticNotifications(items: CosmeticItem[]): Promise<void> {
  if (!(await isPermissionGranted())) return;

  for (const item of items) {
    const id = `cosmetic-expiry-${item.id}`;
    await safeCancel(id);

    if (!item.openedDate || !item.expiryMonths) continue;
    const months = Number(item.expiryMonths);
    if (!Number.isFinite(months) || months <= 0) continue;
    const expiryIso = addDays(item.openedDate, Math.round(months * 30.4));
    if (!expiryIso) continue;
    const expiry = parseISODate(expiryIso);
    if (!expiry) continue;

    const notifyAt = atNotifyTime(expiry);
    notifyAt.setDate(notifyAt.getDate() - REMINDER_DAYS_BEFORE);
    if (notifyAt.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: '💄 化粧品の使用期限が近づいています',
        body: `${item.name} の使用期限まであと${REMINDER_DAYS_BEFORE}日です`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
    });
  }
}

/** (Re)schedules a single reminder the day before the next predicted period start date. */
export async function syncPeriodNotification(periods: PeriodLog[]): Promise<void> {
  if (!(await isPermissionGranted())) return;

  const id = 'period-next';
  await safeCancel(id);
  if (periods.length === 0) return;

  const sortedAsc = [...periods].sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  const last = sortedAsc[sortedAsc.length - 1];
  const cycle = averageCycleLength(sortedAsc.map((p) => p.startDate)) ?? 28;
  const nextIso = addDays(last.startDate, cycle);
  if (!nextIso) return;
  const next = parseISODate(nextIso);
  if (!next) return;

  const notifyAt = atNotifyTime(next);
  notifyAt.setDate(notifyAt.getDate() - 1);
  if (notifyAt.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: '🩷 生理予測日が近づいています',
      body: `次回の予測日は明日 (${nextIso}) です`,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
  });
}
