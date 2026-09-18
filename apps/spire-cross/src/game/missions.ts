import { PlayerProfile } from '../types';

export type Mission = { id: string; label: string; done: boolean };

export function getMissions(profile: PlayerProfile): Mission[] {
  return [
    { id: 'm1', label: 'ガチャを1回引く', done: profile.totalCharPulls + profile.totalCardPulls > 0 },
    { id: 'm2', label: 'パーティを編成する', done: profile.partyIds.length > 0 },
    { id: 'm3', label: 'ストーリー第1章を1つクリアする', done: profile.clearedStoryStageIds.length > 0 },
  ];
}
