import { describe, it, expect } from 'vitest';
import { groupStatsByMonth, diffStats } from '../../src/features/finance/lib/monthStatsMath';
import { statsFromTransactions } from '../../src/features/finance/lib/summary';
import type { Transaction } from '../../src/features/finance/types';

let seq = 0;
function tx(
  partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amountCents' | 'month'>,
): Transaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    description: 'Lançamento',
    categoryId: 'cat-1',
    date: `${partial.month}-10`,
    status: 'confirmed',
    source: 'manual',
    recurrenceId: null,
    ...partial,
  };
}

describe('groupStatsByMonth', () => {
  it('separa entradas e saídas por mês', () => {
    const stats = groupStatsByMonth([
      tx({ type: 'income', amountCents: 500000, month: '2026-07' }),
      tx({ type: 'expense', amountCents: 120000, month: '2026-07' }),
      tx({ type: 'expense', amountCents: 35050, month: '2026-08' }),
    ]);

    expect(stats).toEqual({
      '2026-07': { incomeCents: 500000, expenseCents: 120000 },
      '2026-08': { incomeCents: 0, expenseCents: 35050 },
    });
  });

  it('ignora previstos — só o efetivado entra no agregado', () => {
    const stats = groupStatsByMonth([
      tx({ type: 'expense', amountCents: 120000, month: '2026-08', status: 'planned' }),
      tx({ type: 'expense', amountCents: 5000, month: '2026-08' }),
    ]);

    expect(stats['2026-08']).toEqual({ incomeCents: 0, expenseCents: 5000 });
  });

  it('sem movimentação, não há mês algum', () => {
    expect(groupStatsByMonth([])).toEqual({});
  });

  it('chega ao mesmo resultado que a soma direta do mês (SC-004)', () => {
    const transactions = [
      tx({ type: 'income', amountCents: 123456, month: '2026-08' }),
      tx({ type: 'expense', amountCents: 999, month: '2026-08' }),
      tx({ type: 'expense', amountCents: 1, month: '2026-08' }),
    ];

    expect(groupStatsByMonth(transactions)['2026-08']).toEqual(
      statsFromTransactions(transactions),
    );
  });
});

describe('diffStats', () => {
  it('não devolve nada quando o cache já está correto', () => {
    const stats = { '2026-08': { incomeCents: 500000, expenseCents: 120000 } };
    expect(diffStats(stats, stats)).toEqual({});
  });

  it('corrige um cache que divergiu', () => {
    const stored = { '2026-08': { incomeCents: 500000, expenseCents: 119000 } };
    const rebuilt = { '2026-08': { incomeCents: 500000, expenseCents: 120000 } };

    expect(diffStats(stored, rebuilt)).toEqual({
      '2026-08': { incomeCents: 500000, expenseCents: 120000 },
    });
  });

  it('cria o agregado de um mês que ainda não existia no cache', () => {
    expect(diffStats({}, { '2026-08': { incomeCents: 100, expenseCents: 0 } })).toEqual({
      '2026-08': { incomeCents: 100, expenseCents: 0 },
    });
  });

  it('zera um mês órfão em vez de deixar valor fantasma', () => {
    const stored = { '2026-07': { incomeCents: 900, expenseCents: 300 } };
    expect(diffStats(stored, {})).toEqual({
      '2026-07': { incomeCents: 0, expenseCents: 0 },
    });
  });

  it('mexe apenas nos meses errados, deixando os corretos de fora', () => {
    const stored = {
      '2026-07': { incomeCents: 500000, expenseCents: 450000 },
      '2026-08': { incomeCents: 0, expenseCents: 0 },
    };
    const rebuilt = {
      '2026-07': { incomeCents: 500000, expenseCents: 450000 },
      '2026-08': { incomeCents: 500000, expenseCents: 300000 },
    };

    expect(Object.keys(diffStats(stored, rebuilt))).toEqual(['2026-08']);
  });

  it('a reconstrução é idempotente: rodar de novo não muda nada', () => {
    const transactions = [
      tx({ type: 'income', amountCents: 500000, month: '2026-08' }),
      tx({ type: 'expense', amountCents: 120000, month: '2026-08' }),
    ];
    const rebuilt = groupStatsByMonth(transactions);

    expect(diffStats(rebuilt, groupStatsByMonth(transactions))).toEqual({});
  });
});
