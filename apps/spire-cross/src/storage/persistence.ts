import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile } from '../types';
import { createInitialAp } from '../game/ap';
import { createInitialProgress } from '../game/leveling';
import { buildDefaultDeck } from '../game/deck';

const PROFILE_KEY = 'spire-cross/profile-v2';

function buildDefaultProfile(): PlayerProfile {
  const starterCharacterIds = ['apprentice_warrior', 'shield_recruit'];
  const base: PlayerProfile = {
    gold: 300,
    stones: 300,
    ap: createInitialAp(),
    materials: { enhance: 0, evolve: 0, unlock: 0, memory: 0 },
    ownedCharacterCounts: Object.fromEntries(starterCharacterIds.map((id) => [id, 1])),
    ownedCardCounts: {
      apprentice_warrior_atk: 1,
      apprentice_warrior_skl: 1,
      shield_recruit_atk: 1,
      shield_recruit_skl: 1,
    },
    characterProgress: Object.fromEntries(
      starterCharacterIds.map((id) => [id, createInitialProgress()])
    ),
    partyIds: starterCharacterIds,
    deckCardIds: [],
    charPity: 0,
    cardPity: 0,
    totalCharPulls: 0,
    totalCardPulls: 0,
    clearedStoryStageIds: [],
    settings: { bgmOn: true, seOn: true, notifyMissionComplete: true, notifyApFull: true },
  };
  return { ...base, deckCardIds: buildDefaultDeck(base) };
}

export const DEFAULT_PROFILE: PlayerProfile = buildDefaultProfile();

export async function loadProfile(): Promise<PlayerProfile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return buildDefaultProfile();
    const parsed = JSON.parse(raw);
    const defaults = buildDefaultProfile();
    return {
      ...defaults,
      ...parsed,
      settings: { ...defaults.settings, ...(parsed.settings ?? {}) },
      materials: { ...defaults.materials, ...(parsed.materials ?? {}) },
    };
  } catch {
    return buildDefaultProfile();
  }
}

export async function saveProfile(profile: PlayerProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
