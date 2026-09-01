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
  /**
   * Legado: cor gravada pela versao anterior do app. Nao decide mais nada —
   * a cor vem do slot validado, derivado de `sortOrder` (src/design/palette.ts).
   * Mantido para nao exigir migracao dos dados ja existentes.
   */
  color?: string;
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

export interface DefaultCategorySeed {
  name: string;
  kind: CategoryKind;
}

/** Semeadas no primeiro acesso (FR-006). */
export const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Alimentação', kind: 'expense' },
  { name: 'Moradia', kind: 'expense' },
  { name: 'Transporte', kind: 'expense' },
  { name: 'Saúde', kind: 'expense' },
  { name: 'Lazer', kind: 'expense' },
  { name: 'Outros', kind: 'expense' },
  { name: 'Salário', kind: 'income' },
  { name: 'Extra', kind: 'income' },
];
