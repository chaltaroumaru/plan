import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { PlayerProfile, RunState } from '../types';
import { DEFAULT_PROFILE, loadProfile, loadRun, saveProfile, saveRun } from '../storage/persistence';

interface GameContextValue {
  profile: PlayerProfile;
  run: RunState | null;
  loading: boolean;
  updateProfile: (updater: (p: PlayerProfile) => PlayerProfile) => void;
  updateRun: (updater: (r: RunState | null) => RunState | null) => void;
  setRun: (r: RunState | null) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<PlayerProfile>(DEFAULT_PROFILE);
  const [run, setRunState] = useState<RunState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, r] = await Promise.all([loadProfile(), loadRun()]);
      setProfileState(p);
      setRunState(r);
      setLoading(false);
    })();
  }, []);

  const updateProfile = useCallback((updater: (p: PlayerProfile) => PlayerProfile) => {
    setProfileState((prev) => {
      const next = updater(prev);
      saveProfile(next);
      return next;
    });
  }, []);

  const updateRun = useCallback((updater: (r: RunState | null) => RunState | null) => {
    setRunState((prev) => {
      const next = updater(prev);
      saveRun(next);
      return next;
    });
  }, []);

  const setRun = useCallback((r: RunState | null) => {
    setRunState(r);
    saveRun(r);
  }, []);

  const value = useMemo(
    () => ({ profile, run, loading, updateProfile, updateRun, setRun }),
    [profile, run, loading, updateProfile, updateRun, setRun]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
