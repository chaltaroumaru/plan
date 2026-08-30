import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile, RunState } from '../types';

const PROFILE_KEY = 'spire-cross/profile';
const RUN_KEY = 'spire-cross/run';

export const DEFAULT_PROFILE: PlayerProfile = {
  gold: 300,
  gems: 300,
  ownedCharacterIds: ['apprentice_warrior', 'shield_recruit'],
  pityCounter: 0,
  totalPulls: 0,
  bestFloorCleared: 0,
};

export async function loadProfile(): Promise<PlayerProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadRun(): Promise<RunState | null> {
  try {
    const raw = await AsyncStorage.getItem(RUN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RunState;
  } catch {
    return null;
  }
}

export async function saveRun(run: RunState | null): Promise<void> {
  if (run === null) {
    await AsyncStorage.removeItem(RUN_KEY);
  } else {
    await AsyncStorage.setItem(RUN_KEY, JSON.stringify(run));
  }
}
