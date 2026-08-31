import type { MonthStats, Transaction } from '../types';
import type { ISOMonth } from '../../../shared/dates';

/**
 * Aritmética dos agregados mensais — sem Firestore, para ser testável direto.
 * É a base da reconstrução que garante o Princípio IV: `monthStats` é cache,
 * e um cache só é cache se puder ser refeito.
 */

/** Agrupa as movimentações efetivadas por mês. */
export function groupStatsByMonth(transactions: Transaction[]): Record<ISOMonth, MonthStats> {
  const byMonth: Record<ISOMonth, MonthStats> = {};

  for (const tx of transactions) {
    if (tx.status !== 'confirmed') continue;
    const current = byMonth[tx.month] ?? { incomeCents: 0, expenseCents: 0 };
    if (tx.type === 'income') current.incomeCents += tx.amountCents;
    else current.expenseCents += tx.amountCents;
    byMonth[tx.month] = current;
  }

  return byMonth;
}

/**
 * Compara o cache atual com o recalculado e devolve só os meses que mudam.
 * Meses que sumiram das movimentações voltam a zero em vez de manter valor
 * órfão.
 */
export function diffStats(
  stored: Record<ISOMonth, MonthStats>,
  rebuilt: Record<ISOMonth, MonthStats>,
): Record<ISOMonth, MonthStats> {
  const months = new Set([...Object.keys(stored), ...Object.keys(rebuilt)]);
  const changes: Record<ISOMonth, MonthStats> = {};

  for (const month of months) {
    const before = stored[month] ?? { incomeCents: 0, expenseCents: 0 };
    const after = rebuilt[month] ?? { incomeCents: 0, expenseCents: 0 };
    if (before.incomeCents !== after.incomeCents || before.expenseCents !== after.expenseCents) {
      changes[month] = after;
    }
  }

  return changes;
}
