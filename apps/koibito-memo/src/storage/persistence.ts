import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'koibito-memo/';

export async function loadList<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveList<T>(key: string, list: T[]): Promise<void> {
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(list));
}

export const STORAGE_KEYS = {
  anniversaries: 'anniversaries',
  gifts: 'gifts',
  cosmetics: 'cosmetics',
  likes: 'likes',
  periods: 'periods',
} as const;
