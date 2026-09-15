import { AP_MAX, AP_RECOVER_MINUTES } from '../data/economy';
import { ApState } from '../types';

export function createInitialAp(): ApState {
  return { current: AP_MAX, updatedAt: new Date().toISOString() };
}

/** 経過時間に応じてAPを回復させた新しい状態を返す(表示直前・消費前に必ず通す) */
export function recoverAp(state: ApState): ApState {
  if (state.current >= AP_MAX) {
    return state;
  }
  const lastMs = new Date(state.updatedAt).getTime();
  const elapsedMin = (Date.now() - lastMs) / 60000;
  const recovered = Math.floor(elapsedMin / AP_RECOVER_MINUTES);
  if (recovered <= 0) {
    return state;
  }
  const nextCurrent = Math.min(AP_MAX, state.current + recovered);
  if (nextCurrent >= AP_MAX) {
    return { current: AP_MAX, updatedAt: new Date().toISOString() };
  }
  const consumedMs = recovered * AP_RECOVER_MINUTES * 60000;
  return { current: nextCurrent, updatedAt: new Date(lastMs + consumedMs).toISOString() };
}

export function minutesUntilNextAp(state: ApState): number {
  const recovered = recoverAp(state);
  if (recovered.current >= AP_MAX) return 0;
  const lastMs = new Date(recovered.updatedAt).getTime();
  const elapsedMin = (Date.now() - lastMs) / 60000;
  return Math.max(0, Math.ceil(AP_RECOVER_MINUTES - elapsedMin));
}

export function consumeAp(state: ApState, amount: number): ApState {
  const recovered = recoverAp(state);
  if (recovered.current < amount) {
    throw new Error('APが足りません');
  }
  return { current: recovered.current - amount, updatedAt: new Date().toISOString() };
}
