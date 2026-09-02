import { describe, it, expect } from 'vitest';
import { construirHistorico } from '../../src/features/finance/lib/descriptionHistory';
import { matchCategory } from '../../src/features/finance/lib/categoryHints';
import { parsePhrase } from '../../src/features/finance/lib/phraseParser';
import { CATEGORIAS, HOJE, MES_EM_EXIBICAO } from './fixtures/phrases';
import type { Transaction } from '../../src/features/finance/types';

/**
 * A memória de categorias é o que faz o assistente parecer que aprendeu. Ela
 * não guarda nada: é uma projeção dos lançamentos que já existem.
 */

const lancamento = (over: Partial<Transaction>): Transaction => ({
  id: 'x',
  type: 'expense',
  amountCents: 1000,
  description: 'padaria',
  categoryId: 'cat-alimentacao',
  date: '2026-08-10',
  month: '2026-08',
  status: 'confirmed',
  source: 'manual',
  recurrenceId: null,
  ...over,
});

describe('construção do histórico', () => {
  it('liga a descrição à categoria usada com ela', () => {
    const h = construirHistorico([lancamento({})]);
    expect(h['padaria']).toBe('cat-alimentacao');
  });

  it('escolhe a categoria mais frequente', () => {
    const h = construirHistorico([
      lancamento({ description: 'academia', categoryId: 'cat-saude', date: '2026-07-01' }),
      lancamento({ description: 'academia', categoryId: 'cat-lazer', date: '2026-08-01' }),
      lancamento({ description: 'academia', categoryId: 'cat-lazer', date: '2026-08-15' }),
    ]);
    expect(h['academia']).toBe('cat-lazer');
  });

  it('empate vai para a mais recente — hábito novo vence hábito velho', () => {
    const h = construirHistorico([
      lancamento({ description: 'academia', categoryId: 'cat-saude', date: '2026-07-01' }),
      lancamento({ description: 'academia', categoryId: 'cat-lazer', date: '2026-08-20' }),
    ]);
    expect(h['academia']).toBe('cat-lazer');
  });

  it('acento e caixa não dividem a mesma descrição em duas', () => {
    const h = construirHistorico([
      lancamento({ description: 'Farmácia', categoryId: 'cat-saude' }),
      lancamento({ description: 'farmacia', categoryId: 'cat-saude' }),
      lancamento({ description: 'FARMÁCIA ', categoryId: 'cat-saude' }),
    ]);
    // Se dividisse, a memória viraria três chaves fracas em vez de uma forte.
    expect(Object.keys(h)).toEqual(['farmacia']);
  });

  it('ignora lançamento sem descrição ou sem categoria', () => {
    const h = construirHistorico([
      lancamento({ description: '' }),
      lancamento({ description: 'sem categoria', categoryId: '' }),
    ]);
    expect(h).toEqual({});
  });

  it('lista vazia devolve histórico vazio, sem estourar', () => {
    expect(construirHistorico([])).toEqual({});
  });
});

describe('o histórico dentro do interpretador', () => {
  const ctx = {
    categories: CATEGORIAS,
    history: construirHistorico([
      lancamento({ description: 'petshop', categoryId: 'cat-outros' }),
      lancamento({ description: 'academia', categoryId: 'cat-lazer' }),
    ]),
    today: HOJE,
    viewMonth: MES_EM_EXIBICAO,
  };

  it('a segunda vez que escrevo a descrição, a categoria já vem', () => {
    const semMemoria = { ...ctx, history: {} };
    expect(parsePhrase('35 petshop', semMemoria).categoryId).toBeNull();
    expect(parsePhrase('35 petshop', ctx).categoryId).toBe('cat-outros');
  });

  it('o que a pessoa faz vence o dicionário genérico', () => {
    // "academia" está no dicionário como Saúde.
    expect(matchCategory('academia', CATEGORIAS)?.source).toBe('dicionário');
    expect(parsePhrase('90 academia', ctx).categoryId).toBe('cat-lazer');
    expect(parsePhrase('90 academia', ctx).categorySource).toBe('histórico');
  });

  it('descrição inédita continua sem categoria', () => {
    expect(parsePhrase('50 bicicleta', ctx).categoryId).toBeNull();
  });
});
