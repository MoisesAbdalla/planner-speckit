import type { Timestamp } from 'firebase/firestore';
import type { ISODate, ISOMonth } from '../../shared/dates';

export type MovementType = 'expense' | 'income';

/**
 * `planned` (previsto) x `confirmed` (efetivado) — na interface, "previsto" e
 * "efetivado". Só o efetivado entra no saldo real (FR-010a).
 */
export type TransactionStatus = 'planned' | 'confirmed';

export type TransactionSource = 'manual' | 'recurrence';

export interface Transaction {
  id: string;
  type: MovementType;
  amountCents: number;
  description: string;
  categoryId: string;
  date: ISODate;
  month: ISOMonth;
  status: TransactionStatus;
  source: TransactionSource;
  recurrenceId: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

/** O que um formulário produz — o id e os carimbos de tempo vêm depois. */
export type TransactionDraft = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

export type CategoryKind = MovementType | 'both';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  color: string;
  isDefault: boolean;
  archived: boolean;
  sortOrder: number;
}

export interface Recurrence {
  id: string;
  type: MovementType;
  amountCents: number;
  description: string;
  categoryId: string;
  /** 1–31; meses curtos recebem o clamp para o último dia. */
  dayOfMonth: number;
  startMonth: ISOMonth;
  /** `null` = ativa. Encerrar grava o último mês que ainda gera lançamento. */
  endMonth: ISOMonth | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MonthStats {
  incomeCents: number;
  expenseCents: number;
}

/** Paleta das categorias — tons de mesma família, para a lista não virar arco-íris. */
export const CATEGORY_COLORS = [
  '#1F6F5C',
  '#2F4B7C',
  '#8C3B4A',
  '#8A5F1C',
  '#4A6B57',
  '#6B4E71',
  '#31687A',
  '#8B5E3C',
] as const;

export interface DefaultCategorySeed {
  name: string;
  kind: CategoryKind;
  color: string;
}

/** Semeadas no primeiro acesso (FR-006). */
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Alimentação', kind: 'expense', color: '#1F6F5C' },
  { name: 'Moradia', kind: 'expense', color: '#2F4B7C' },
  { name: 'Transporte', kind: 'expense', color: '#31687A' },
  { name: 'Saúde', kind: 'expense', color: '#8C3B4A' },
  { name: 'Lazer', kind: 'expense', color: '#6B4E71' },
  { name: 'Outros', kind: 'expense', color: '#8B5E3C' },
  { name: 'Salário', kind: 'income', color: '#1F6F5C' },
  { name: 'Extra', kind: 'income', color: '#8A5F1C' },
];
