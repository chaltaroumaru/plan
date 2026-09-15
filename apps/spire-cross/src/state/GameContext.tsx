import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PlayerProfile } from '../types';
import { DEFAULT_PROFILE, loadProfile, saveProfile } from '../storage/persistence';
import { recoverAp } from '../game/ap';

interface GameContextValue {
  profile: PlayerProfile;
  loading: boolean;
  updateProfile: (updater: (p: PlayerProfile) => PlayerProfile) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded = await loadProfile();
      setProfileState({ ...loaded, ap: recoverAp(loaded.ap) });
      setLoading(false);
    })();
  }, []);

  const updateProfile = useCallback((updater: (p: PlayerProfile) => PlayerProfile) => {
    setProfileState((prev) => {
      const next = updater({ ...prev, ap: recoverAp(prev.ap) });
      saveProfile(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ profile, loading, updateProfile }), [profile, loading, updateProfile]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
