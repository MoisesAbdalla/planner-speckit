import { describe, it, expect } from 'vitest';
import { statsDelta, statsFromTransactions } from '../../src/features/finance/lib/summary';
import type { Transaction } from '../../src/features/finance/types';

type Movement = Pick<Transaction, 'type' | 'amountCents' | 'status'>;

const gasto = (amountCents: number, status: Movement['status'] = 'confirmed'): Movement => ({
  type: 'expense',
  amountCents,
  status,
});

const ganho = (amountCents: number, status: Movement['status'] = 'confirmed'): Movement => ({
  type: 'income',
  amountCents,
  status,
});

describe('statsDelta', () => {
  it('criar gasto efetivado soma nas saídas', () => {
    expect(statsDelta(null, gasto(5000))).toEqual({ incomeCents: 0, expenseCents: 5000 });
  });

  it('criar ganho efetivado soma nas entradas', () => {
    expect(statsDelta(null, ganho(500000))).toEqual({ incomeCents: 500000, expenseCents: 0 });
  });

  it('excluir devolve o valor', () => {
    expect(statsDelta(gasto(5000), null)).toEqual({ incomeCents: 0, expenseCents: -5000 });
  });

  it('editar o valor move só a diferença', () => {
    expect(statsDelta(gasto(5000), gasto(8000))).toEqual({ incomeCents: 0, expenseCents: 3000 });
    expect(statsDelta(gasto(8000), gasto(5000))).toEqual({ incomeCents: 0, expenseCents: -3000 });
  });

  it('previsto não mexe em nada enquanto não é confirmado', () => {
    expect(statsDelta(null, gasto(5000, 'planned'))).toEqual({ incomeCents: 0, expenseCents: 0 });
    expect(statsDelta(gasto(5000, 'planned'), gasto(9000, 'planned'))).toEqual({
      incomeCents: 0,
      expenseCents: 0,
    });
  });

  it('confirmar um previsto entra inteiro nas saídas', () => {
    expect(statsDelta(gasto(120000, 'planned'), gasto(120000, 'confirmed'))).toEqual({
      incomeCents: 0,
      expenseCents: 120000,
    });
  });

  it('desfazer a confirmação devolve o valor', () => {
    expect(statsDelta(gasto(120000, 'confirmed'), gasto(120000, 'planned'))).toEqual({
      incomeCents: 0,
      expenseCents: -120000,
    });
  });

  it('trocar gasto por ganho tira de um lado e põe no outro', () => {
    expect(statsDelta(gasto(5000), ganho(5000))).toEqual({
      incomeCents: 5000,
      expenseCents: -5000,
    });
  });

  it('excluir um previsto não altera os agregados', () => {
    expect(statsDelta(gasto(5000, 'planned'), null)).toEqual({ incomeCents: 0, expenseCents: 0 });
  });

  it('sem antes nem depois, o delta é nulo', () => {
    expect(statsDelta(null, null)).toEqual({ incomeCents: 0, expenseCents: 0 });
  });

  it('uma sequência de deltas chega ao mesmo lugar que a soma direta', () => {
    // Cria 3, edita 1, confirma 1 previsto, exclui 1 — os deltas têm de fechar.
    const passos = [
      statsDelta(null, gasto(1000)),
      statsDelta(null, gasto(2000)),
      statsDelta(null, ganho(10000)),
      statsDelta(gasto(2000), gasto(2500)),
      statsDelta(null, gasto(700, 'planned')),
      statsDelta(gasto(700, 'planned'), gasto(700, 'confirmed')),
      statsDelta(gasto(1000), null),
    ];
    const total = passos.reduce(
      (acc, d) => ({
        incomeCents: acc.incomeCents + d.incomeCents,
        expenseCents: acc.expenseCents + d.expenseCents,
      }),
      { incomeCents: 0, expenseCents: 0 },
    );

    expect(total).toEqual({ incomeCents: 10000, expenseCents: 3200 });
  });
});

describe('statsFromTransactions', () => {
  const base = {
    id: 'x',
    description: 'd',
    categoryId: 'c',
    date: '2026-08-10',
    month: '2026-08',
    source: 'manual' as const,
    recurrenceId: null,
  };

  it('deriva os agregados só do que foi efetivado', () => {
    const stats = statsFromTransactions([
      { ...base, id: '1', type: 'income', amountCents: 500000, status: 'confirmed' },
      { ...base, id: '2', type: 'expense', amountCents: 120000, status: 'confirmed' },
      { ...base, id: '3', type: 'expense', amountCents: 999999, status: 'planned' },
    ]);

    expect(stats).toEqual({ incomeCents: 500000, expenseCents: 120000 });
  });

  it('mês sem movimentação devolve zeros', () => {
    expect(statsFromTransactions([])).toEqual({ incomeCents: 0, expenseCents: 0 });
  });
});
