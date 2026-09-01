import { describe, it, expect } from 'vitest';
import {
  foldCategories,
  breakdownTotal,
  OTHER_CATEGORY_ID,
} from '../../src/features/finance/lib/categoryBreakdown';
import { categoryColor } from '../../src/design/palette';
import type { CategorySlice } from '../../src/features/finance/lib/summary';

/** Fatias já ordenadas da maior para a menor, como `summarizeMonth` entrega. */
function slices(...valores: number[]): CategorySlice[] {
  const total = valores.reduce((a, b) => a + b, 0);
  return valores.map((cents, i) => ({
    categoryId: `cat-${i}`,
    name: `Categoria ${i}`,
    color: categoryColor(i),
    cents,
    share: total === 0 ? 0 : cents / total,
  }));
}

describe('foldCategories', () => {
  it('até 6 categorias passam inteiras', () => {
    const resultado = foldCategories(slices(600, 500, 400, 300, 200, 100));
    expect(resultado).toHaveLength(6);
    expect(resultado.some((s) => s.categoryId === OTHER_CATEGORY_ID)).toBe(false);
    expect(resultado.every((s) => s.count === 1)).toBe(true);
  });

  it('acima de 6, dobra a cauda em "Outros" e nunca passa de 6 linhas', () => {
    const resultado = foldCategories(slices(700, 600, 500, 400, 300, 200, 100));
    expect(resultado).toHaveLength(6);
    expect(resultado.at(-1)!.categoryId).toBe(OTHER_CATEGORY_ID);
    expect(resultado.at(-1)!.name).toBe('Outros');
  });

  it('"Outros" agrega pelo menos duas categorias — nunca vira apelido de uma só', () => {
    // 7 categorias com teto 6: sobram 5 nomeadas e 2 dobradas.
    expect(foldCategories(slices(700, 600, 500, 400, 300, 200, 100)).at(-1)!.count).toBe(2);
    // 8 categorias: 5 nomeadas e 3 dobradas.
    expect(foldCategories(slices(8, 7, 6, 5, 4, 3, 2, 1)).at(-1)!.count).toBe(3);
  });

  it('a soma das fatias fecha com o total, sem sobra', () => {
    const entrada = slices(700, 600, 500, 400, 300, 200, 100);
    const totalOriginal = entrada.reduce((s, c) => s + c.cents, 0);
    expect(breakdownTotal(foldCategories(entrada))).toBe(totalOriginal);
    expect(totalOriginal).toBe(2800);
  });

  it('as frações também somam 1 depois da dobra', () => {
    const resultado = foldCategories(slices(700, 600, 500, 400, 300, 200, 100));
    const soma = resultado.reduce((s, c) => s + c.share, 0);
    expect(soma).toBeCloseTo(1, 10);
  });

  it('a cor segue a categoria, não a posição — reordenar não repinta', () => {
    // Mesmas categorias, valores trocados: quem era maior vira menor.
    const antes = foldCategories(slices(900, 100));
    const depois = foldCategories([
      { ...antes[1]!, cents: 900, share: 0.9 },
      { ...antes[0]!, cents: 100, share: 0.1 },
    ]);
    const corPorId = (lista: { categoryId: string; color: string }[]) =>
      Object.fromEntries(lista.map((s) => [s.categoryId, s.color]));

    expect(corPorId(depois)).toEqual(corPorId(antes));
  });

  it('"Outros" usa o cinza neutro, nunca um matiz gerado', () => {
    const resultado = foldCategories(slices(7, 6, 5, 4, 3, 2, 1));
    expect(resultado.at(-1)!.color).toBe('var(--color-cat-other)');
  });

  it('categoria única com 100% continua legível', () => {
    const resultado = foldCategories(slices(5000));
    expect(resultado).toHaveLength(1);
    expect(resultado[0]!.share).toBe(1);
  });

  it('lista vazia devolve lista vazia', () => {
    expect(foldCategories([])).toEqual([]);
    expect(breakdownTotal([])).toBe(0);
  });

  it('respeita um teto customizado', () => {
    const resultado = foldCategories(slices(5, 4, 3, 2, 1), 3);
    expect(resultado).toHaveLength(3);
    expect(resultado.at(-1)!.count).toBe(3);
    expect(breakdownTotal(resultado)).toBe(15);
  });

  it('exatamente no teto não dobra', () => {
    const resultado = foldCategories(slices(3, 2, 1), 3);
    expect(resultado.some((s) => s.categoryId === OTHER_CATEGORY_ID)).toBe(false);
  });
});
