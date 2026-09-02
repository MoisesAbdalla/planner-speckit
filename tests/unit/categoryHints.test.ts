import { describe, it, expect } from 'vitest';
import { matchCategory } from '../../src/features/finance/lib/categoryHints';
import { CATEGORIAS } from './fixtures/phrases';
import type { Category } from '../../src/features/finance/types';

/**
 * A categoria é o campo que decide onde o dinheiro aparece nos gráficos.
 * Preenchê-la no chute estraga o relatório em silêncio — por isso o
 * comportamento testado aqui é "prefere não responder a responder errado".
 */
describe('as três tentativas, em ordem', () => {
  it('o nome da categoria dito na frase vence tudo', () => {
    expect(matchCategory('lazer', CATEGORIAS)).toEqual({
      categoryId: 'cat-lazer',
      source: 'nome',
    });
  });

  it('o histórico vem antes do dicionário', () => {
    // "academia" está no dicionário como Saúde. Mas se esta pessoa lança em
    // Lazer, é isso que vale para ela.
    const r = matchCategory('academia', CATEGORIAS, { academia: 'cat-lazer' });
    expect(r).toEqual({ categoryId: 'cat-lazer', source: 'histórico' });
  });

  it('o dicionário responde quando não há nome nem histórico', () => {
    expect(matchCategory('mercado', CATEGORIAS)).toEqual({
      categoryId: 'cat-alimentacao',
      source: 'dicionário',
    });
  });
});

describe('nunca sugere o que não existe', () => {
  it('categoria removida faz a palavra do dicionário não sugerir nada', () => {
    // O dicionário mapeia NOMES, não ids: sem "Alimentação", "mercado" cala.
    const semAlimentacao = CATEGORIAS.filter((c) => c.id !== 'cat-alimentacao');
    expect(matchCategory('mercado', semAlimentacao)).toBeNull();
  });

  it('categoria arquivada nunca é sugerida', () => {
    const arquivada: Category[] = CATEGORIAS.map((c) =>
      c.id === 'cat-lazer' ? { ...c, archived: true } : c,
    );
    expect(matchCategory('lazer', arquivada)).toBeNull();
    expect(matchCategory('cinema', arquivada)).toBeNull();
  });

  it('histórico apontando para categoria que sumiu é ignorado', () => {
    const r = matchCategory('padaria', CATEGORIAS, { padaria: 'cat-que-nao-existe' });
    // Cai para o dicionário, em vez de devolver um id inválido.
    expect(r?.categoryId).toBe('cat-alimentacao');
  });

  it('descrição desconhecida devolve null, e não uma escolha qualquer', () => {
    expect(matchCategory('petshop', CATEGORIAS)).toBeNull();
    expect(matchCategory('presente para a ana', CATEGORIAS)).toBeNull();
  });
});

describe('normalização', () => {
  it('acento e caixa não separam a mesma palavra', () => {
    expect(matchCategory('FARMÁCIA', CATEGORIAS)?.categoryId).toBe('cat-saude');
    expect(matchCategory('farmacia', CATEGORIAS)?.categoryId).toBe('cat-saude');
  });

  it('o nome da categoria casa mesmo escrito com acento na frase', () => {
    expect(matchCategory('saúde', CATEGORIAS)?.categoryId).toBe('cat-saude');
    expect(matchCategory('alimentação', CATEGORIAS)?.categoryId).toBe('cat-alimentacao');
  });

  it('texto vazio devolve null', () => {
    expect(matchCategory('', CATEGORIAS)).toBeNull();
    expect(matchCategory('   ', CATEGORIAS)).toBeNull();
  });
});
