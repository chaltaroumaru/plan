import { useCallback, useEffect, useState } from 'react';
import { loadList, saveList } from './persistence';

export function useStoredList<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await loadList<T>(key);
      setItems(list);
      setLoading(false);
    })();
  }, [key]);

  const persist = useCallback(
    (next: T[]) => {
      setItems(next);
      saveList(key, next);
    },
    [key]
  );

  const addItem = useCallback(
    (item: T) => {
      persist([item, ...items]);
    },
    [items, persist]
  );

  const updateItem = useCallback(
    (id: string, updater: (item: T) => T) => {
      persist(items.map((it) => (it.id === id ? updater(it) : it)));
    },
    [items, persist]
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((it) => it.id !== id));
    },
    [items, persist]
  );

  return { items, loading, addItem, updateItem, removeItem, setItems: persist };
}

export function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
