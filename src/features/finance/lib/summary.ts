import type { Category, MonthStats, Transaction } from '../types';
import { categoryColor, OTHER_COLOR } from '../../../design/palette';
import type { ISOMonth } from '../../../shared/dates';

/**
 * Todo total é derivado das movimentações — nada de saldo guardado como
 * verdade (Princípio IV). Funções puras, sem Firestore, para poderem ser
 * testadas centavo a centavo.
 */

export interface CategorySlice {
  categoryId: string;
  name: string;
  /** Referencia CSS do slot validado — troca de tema sozinha. */
  color: string;
  cents: number;
  /** Fração do total de saídas efetivadas, de 0 a 1. */
  share: number;
}

export interface MonthSummary {
  /** Entradas efetivadas. */
  incomeCents: number;
  /** Saídas efetivadas. */
  expenseCents: number;
  /** Entradas − saídas, só do que já aconteceu. */
  balanceCents: number;
  /** O mesmo cálculo incluindo o que está previsto e ainda não foi confirmado. */
  projectedBalanceCents: number;
  /** Quanto ainda está previsto (não confirmado) no mês. */
  plannedIncomeCents: number;
  plannedExpenseCents: number;
  /** Distribuição das saídas efetivadas, da maior para a menor. */
  byCategory: CategorySlice[];
  /**
   * Previsto por categoria, à parte da distribuição.
   *
   * Fica separado de propósito: `byCategory` responde "para onde o dinheiro
   * foi", uma pergunta sobre o passado, e uma categoria que só tem previsto
   * não pertence a essa lista. Mas a meta precisa do previsto para usar a
   * mesma base do teto geral, então ele vive aqui.
   */
  plannedByCategory: Record<string, number>;
  confirmedCount: number;
  plannedCount: number;
}

const EMPTY: MonthSummary = {
  incomeCents: 0,
  expenseCents: 0,
  balanceCents: 0,
  projectedBalanceCents: 0,
  plannedIncomeCents: 0,
  plannedExpenseCents: 0,
  byCategory: [],
  plannedByCategory: {},
  confirmedCount: 0,
  plannedCount: 0,
};

export function summarizeMonth(
  transactions: Transaction[],
  categories: Category[] = [],
): MonthSummary {
  if (transactions.length === 0) return { ...EMPTY, byCategory: [], plannedByCategory: {} };

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const perCategory = new Map<string, number>();
  const plannedPerCategory = new Map<string, number>();

  let incomeCents = 0;
  let expenseCents = 0;
  let plannedIncomeCents = 0;
  let plannedExpenseCents = 0;
  let confirmedCount = 0;
  let plannedCount = 0;

  for (const tx of transactions) {
    if (tx.status === 'confirmed') {
      confirmedCount += 1;
      if (tx.type === 'income') {
        incomeCents += tx.amountCents;
      } else {
        expenseCents += tx.amountCents;
        perCategory.set(tx.categoryId, (perCategory.get(tx.categoryId) ?? 0) + tx.amountCents);
      }
    } else {
      plannedCount += 1;
      if (tx.type === 'income') {
        plannedIncomeCents += tx.amountCents;
      } else {
        plannedExpenseCents += tx.amountCents;
        plannedPerCategory.set(
          tx.categoryId,
          (plannedPerCategory.get(tx.categoryId) ?? 0) + tx.amountCents,
        );
      }
    }
  }

  const balanceCents = incomeCents - expenseCents;

  const byCategory: CategorySlice[] = [...perCategory.entries()]
    .map(([categoryId, cents]) => {
      const category = categoryById.get(categoryId);
      return {
        categoryId,
        name: category?.name ?? 'Sem categoria',
        color: category ? categoryColor(category.sortOrder) : OTHER_COLOR,
        cents,
        plannedCents: plannedPerCategory.get(categoryId) ?? 0,
        share: expenseCents === 0 ? 0 : cents / expenseCents,
      };
    })
    .sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name, 'pt-BR'));

  return {
    incomeCents,
    expenseCents,
    balanceCents,
    projectedBalanceCents:
      incomeCents + plannedIncomeCents - (expenseCents + plannedExpenseCents),
    plannedIncomeCents,
    plannedExpenseCents,
    byCategory,
    plannedByCategory: Object.fromEntries(plannedPerCategory),
    confirmedCount,
    plannedCount,
  };
}

/**
 * Saldo acumulado até o mês visualizado (FR-007a): soma dos resultados de
 * todos os meses anteriores e do próprio mês, só com o que foi efetivado.
 */
export function accumulatedBalance(
  stats: Record<ISOMonth, MonthStats>,
  upToMonth: ISOMonth,
): number {
  let total = 0;
  for (const [month, value] of Object.entries(stats)) {
    if (month <= upToMonth) total += value.incomeCents - value.expenseCents;
  }
  return total;
}

/** Deriva os agregados de um mês a partir das movimentações — base da reconstrução. */
export function statsFromTransactions(transactions: Transaction[]): MonthStats {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    if (tx.type === 'income') incomeCents += tx.amountCents;
    else expenseCents += tx.amountCents;
  }
  return { incomeCents, expenseCents };
}

/**
 * Delta que uma escrita provoca nos agregados do mês.
 * `before`/`after` como `null` representam criação e exclusão.
 */
export function statsDelta(
  before: Pick<Transaction, 'type' | 'amountCents' | 'status'> | null,
  after: Pick<Transaction, 'type' | 'amountCents' | 'status'> | null,
): MonthStats {
  const signed = (tx: typeof before, factor: 1 | -1): MonthStats => {
    if (!tx || tx.status !== 'confirmed') return { incomeCents: 0, expenseCents: 0 };
    return tx.type === 'income'
      ? { incomeCents: factor * tx.amountCents, expenseCents: 0 }
      : { incomeCents: 0, expenseCents: factor * tx.amountCents };
  };

  const removed = signed(before, -1);
  const added = signed(after, 1);

  return {
    incomeCents: removed.incomeCents + added.incomeCents,
    expenseCents: removed.expenseCents + added.expenseCents,
  };
}
