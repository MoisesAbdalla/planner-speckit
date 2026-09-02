import { describe, it, expect } from 'vitest';
import { resolveCategoryId } from '../../src/features/finance/lib/formCategory';
import { CATEGORIAS } from './fixtures/phrases';

const gastos = CATEGORIAS.filter((c) => c.kind === 'expense');

/**
 * Os dois lados desta função são os dois caminhos do app, e o teste existe
 * para provar que acrescentar o segundo não mexeu no primeiro.
 */
describe('o caminho manual, como sempre foi', () => {
  it('sem escolha, cai na primeira categoria da lista', () => {
    expect(resolveCategoryId(gastos, '')).toBe('cat-alimentacao');
  });

  it('escolha que não está na lista também cai na primeira', () => {
    // Acontece ao trocar de gasto para ganho: a lista muda debaixo da escolha.
    expect(resolveCategoryId(gastos, 'cat-salario')).toBe('cat-alimentacao');
  });

  it('escolha válida é respeitada', () => {
    expect(resolveCategoryId(gastos, 'cat-lazer')).toBe('cat-lazer');
  });

  it('lista vazia devolve vazio, sem estourar', () => {
    expect(resolveCategoryId([], '')).toBe('');
  });
});

describe('o caminho do assistente, quando não reconheceu a categoria', () => {
  it('fica vazio em vez de escolher a primeira', () => {
    expect(resolveCategoryId(gastos, '', true)).toBe('');
  });

  it('mas respeita a categoria que o assistente reconheceu', () => {
    expect(resolveCategoryId(gastos, 'cat-transporte', true)).toBe('cat-transporte');
  });

  it('e continua vazio se a categoria reconhecida não serve para o tipo', () => {
    // Assistente entendeu "salário" mas a pessoa marcou gasto: some da lista.
    expect(resolveCategoryId(gastos, 'cat-salario', true)).toBe('');
  });
});
