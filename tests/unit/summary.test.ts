import { describe, it, expect } from 'vitest';
import { summarizeMonth, accumulatedBalance } from '../../src/features/finance/lib/summary';
import type { Category, Transaction } from '../../src/features/finance/types';
import { parseAmountToCents } from '../../src/shared/money';

let seq = 0;
function tx(partial: Partial<Transaction> & Pick<Transaction, 'type' | 'amountCents'>): Transaction {
  seq += 1;
  return {
    id: `tx-${seq}`,
    description: 'Lançamento',
    categoryId: 'cat-1',
    date: '2026-08-10',
    month: '2026-08',
    status: 'confirmed',
    source: 'manual',
    recurrenceId: null,
    ...partial,
  };
}

const categories: Category[] = [
  { id: 'cat-1', name: 'Alimentação', kind: 'expense', color: '#1F6F5C', isDefault: true, archived: false, sortOrder: 0 },
  { id: 'cat-2', name: 'Moradia', kind: 'expense', color: '#2F4B7C', isDefault: true, archived: false, sortOrder: 1 },
  { id: 'cat-3', name: 'Salário', kind: 'income', color: '#1F6F5C', isDefault: true, archived: false, sortOrder: 2 },
];

describe('summarizeMonth', () => {
  it('devolve zeros para um mês sem movimentação (estado vazio, não erro)', () => {
    const s = summarizeMonth([], categories);
    expect(s.incomeCents).toBe(0);
    expect(s.expenseCents).toBe(0);
    expect(s.balanceCents).toBe(0);
    expect(s.projectedBalanceCents).toBe(0);
    expect(s.byCategory).toEqual([]);
  });

  it('soma entradas e saídas efetivadas e fecha o saldo', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'income', amountCents: 500000, categoryId: 'cat-3' }),
        tx({ type: 'expense', amountCents: 120000, categoryId: 'cat-2' }),
        tx({ type: 'expense', amountCents: 35050, categoryId: 'cat-1' }),
      ],
      categories,
    );

    expect(s.incomeCents).toBe(500000);
    expect(s.expenseCents).toBe(155050);
    expect(s.balanceCents).toBe(344950);
    expect(s.confirmedCount).toBe(3);
  });

  it('bate centavo a centavo com a soma manual (SC-004)', () => {
    const valores = ['19,99', '8,15', '0,01', '1.234,56', '77,77'];
    const transactions = valores.map((v) =>
      tx({ type: 'expense', amountCents: parseAmountToCents(v)! }),
    );
    const somaManual = valores.reduce((acc, v) => acc + parseAmountToCents(v)!, 0);

    expect(summarizeMonth(transactions, categories).expenseCents).toBe(somaManual);
    expect(somaManual).toBe(134048);
  });

  it('mantém previstos fora do saldo real e dentro do previsto (FR-010a)', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'income', amountCents: 500000, categoryId: 'cat-3' }),
        tx({ type: 'expense', amountCents: 120000, categoryId: 'cat-2', status: 'planned' }),
      ],
      categories,
    );

    expect(s.balanceCents).toBe(500000);
    expect(s.projectedBalanceCents).toBe(380000);
    expect(s.plannedExpenseCents).toBe(120000);
    expect(s.plannedCount).toBe(1);
    expect(s.confirmedCount).toBe(1);
  });

  it('não deixa previsto contaminar a distribuição por categoria', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 10000, categoryId: 'cat-1' }),
        tx({ type: 'expense', amountCents: 90000, categoryId: 'cat-2', status: 'planned' }),
      ],
      categories,
    );

    expect(s.byCategory).toHaveLength(1);
    expect(s.byCategory[0]!.categoryId).toBe('cat-1');
    expect(s.byCategory[0]!.share).toBe(1);
  });

  it('distribui as saídas por categoria, da maior para a menor', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 25000, categoryId: 'cat-1' }),
        tx({ type: 'expense', amountCents: 75000, categoryId: 'cat-2' }),
        tx({ type: 'expense', amountCents: 25000, categoryId: 'cat-1' }),
      ],
      categories,
    );

    expect(s.byCategory.map((c) => c.name)).toEqual(['Moradia', 'Alimentação']);
    expect(s.byCategory[0]!.cents).toBe(75000);
    expect(s.byCategory[0]!.share).toBeCloseTo(0.6, 10);
    expect(s.byCategory[1]!.cents).toBe(50000);
    expect(s.byCategory[1]!.share).toBeCloseTo(0.4, 10);
  });

  it('as fatias somam o total de saídas, sem sobra', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 3333, categoryId: 'cat-1' }),
        tx({ type: 'expense', amountCents: 3333, categoryId: 'cat-2' }),
      ],
      categories,
    );
    expect(s.byCategory.reduce((acc, c) => acc + c.cents, 0)).toBe(s.expenseCents);
  });

  it('não quebra quando a categoria foi arquivada e sumiu da lista', () => {
    const s = summarizeMonth([tx({ type: 'expense', amountCents: 1000, categoryId: 'sumida' })], []);
    expect(s.byCategory[0]!.name).toBe('Sem categoria');
    expect(s.expenseCents).toBe(1000);
  });

  it('entradas não entram na distribuição de gastos', () => {
    const s = summarizeMonth(
      [tx({ type: 'income', amountCents: 500000, categoryId: 'cat-3' })],
      categories,
    );
    expect(s.byCategory).toEqual([]);
  });
});

describe('accumulatedBalance', () => {
  const stats = {
    '2026-06': { incomeCents: 500000, expenseCents: 450000 },
    '2026-07': { incomeCents: 500000, expenseCents: 520000 },
    '2026-08': { incomeCents: 500000, expenseCents: 300000 },
  };

  it('soma os resultados de todos os meses até o mês visualizado (FR-007a)', () => {
    expect(accumulatedBalance(stats, '2026-06')).toBe(50000);
    expect(accumulatedBalance(stats, '2026-07')).toBe(30000);
    expect(accumulatedBalance(stats, '2026-08')).toBe(230000);
  });

  it('ignora meses posteriores ao visualizado', () => {
    expect(accumulatedBalance(stats, '2026-05')).toBe(0);
  });

  it('aceita acumulado negativo — o mês pode fechar no vermelho', () => {
    expect(accumulatedBalance({ '2026-07': { incomeCents: 100, expenseCents: 900 } }, '2026-07')).toBe(
      -800,
    );
  });

  it('devolve zero quando não há histórico', () => {
    expect(accumulatedBalance({}, '2026-08')).toBe(0);
  });
});

describe('previsto por categoria', () => {
  it('separa o previsto do efetivado na mesma categoria', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 10000, categoryId: 'cat-1' }),
        tx({ type: 'expense', amountCents: 25000, categoryId: 'cat-1', status: 'planned' }),
      ],
      categories,
    );

    expect(s.byCategory.find((c) => c.categoryId === 'cat-1')!.cents).toBe(10000);
    expect(s.plannedByCategory['cat-1']).toBe(25000);
  });

  it('categoria só com previsto ainda aparece — senão a meta dela ficaria invisível', () => {
    const s = summarizeMonth(
      [tx({ type: 'expense', amountCents: 120000, categoryId: 'cat-2', status: 'planned' })],
      categories,
    );

    // Nao entra na distribuicao — ela e sobre o que ja saiu.
    expect(s.byCategory.find((c) => c.categoryId === 'cat-2')).toBeUndefined();
    // Mas o previsto esta disponivel para a camada de metas.
    expect(s.plannedByCategory['cat-2']).toBe(120000);
  });

  it('a soma do previsto por categoria fecha com o total previsto do mês', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 25000, categoryId: 'cat-1', status: 'planned' }),
        tx({ type: 'expense', amountCents: 120000, categoryId: 'cat-2', status: 'planned' }),
        tx({ type: 'income', amountCents: 500000, categoryId: 'cat-3', status: 'planned' }),
      ],
      categories,
    );

    const somaCategorias = Object.values(s.plannedByCategory).reduce((a, b) => a + b, 0);
    expect(somaCategorias).toBe(s.plannedExpenseCents);
    expect(somaCategorias).toBe(145000);
  });

  it('previsto não contamina a fração da distribuição, que é do efetivado', () => {
    const s = summarizeMonth(
      [
        tx({ type: 'expense', amountCents: 10000, categoryId: 'cat-1' }),
        tx({ type: 'expense', amountCents: 90000, categoryId: 'cat-2', status: 'planned' }),
      ],
      categories,
    );

    expect(s.byCategory).toHaveLength(1);
    expect(s.byCategory[0]!.share).toBe(1);
    expect(s.plannedByCategory['cat-2']).toBe(90000);
  });
});
