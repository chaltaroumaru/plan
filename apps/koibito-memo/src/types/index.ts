export interface Anniversary {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  repeatYearly: boolean;
  note: string;
  photoUri: string; // data URI or local file URI, optional
}

export type GiftStatus = 'idea' | 'planned' | 'given' | 'received';
export type GiftForWhom = 'partner' | 'me';

export interface GiftEntry {
  id: string;
  title: string;
  forWhom: GiftForWhom;
  occasion: string;
  status: GiftStatus;
  price: string;
  date: string; // ISO yyyy-mm-dd, optional
  note: string;
  photoUri: string; // data URI or local file URI, optional
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: string;
  openedDate: string; // ISO yyyy-mm-dd, optional
  expiryMonths: string; // number of months as string for form binding
  repurchase: boolean;
  note: string;
  photoUri: string; // data URI or local file URI, optional
}

export interface LikeItem {
  id: string;
  category: string;
  text: string;
}

export interface PeriodLog {
  id: string;
  startDate: string; // ISO yyyy-mm-dd
  note: string;
}
