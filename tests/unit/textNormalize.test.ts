import { describe, it, expect } from 'vitest';
import { normalize, words } from '../../src/features/finance/lib/textNormalize';

/**
 * Existe uma normalização só na feature inteira. Se o histórico normalizasse
 * de um jeito e o dicionário de outro, "Padaria" e "padaria" virariam chaves
 * diferentes e a memória de categorias se dividiria em variantes — parecendo
 * simplesmente não funcionar.
 */
describe('normalize', () => {
  it('tira acento e baixa a caixa', () => {
    expect(normalize('Alimentação')).toBe('alimentacao');
    expect(normalize('SAÚDE')).toBe('saude');
    expect(normalize('Almoço')).toBe('almoco');
  });

  it('colapsa espaços e apara as pontas', () => {
    expect(normalize('  mercado   grande  ')).toBe('mercado grande');
  });

  it('as variantes de escrita viram a mesma chave', () => {
    expect(normalize('Padaria')).toBe(normalize('padaria '));
    expect(normalize('FARMÁCIA')).toBe(normalize('farmacia'));
  });

  it('preserva dígitos e os separadores que o dinheiro e a data usam', () => {
    expect(normalize('R$ 1.200,00')).toContain('1.200,00');
    expect(normalize('em 28/08')).toContain('28/08');
  });

  it('texto vazio continua vazio', () => {
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');
  });
});

describe('words', () => {
  it('divide já normalizado e sem vazios', () => {
    expect(words('  Gastei 20 no  Mercado ')).toEqual(['gastei', '20', 'no', 'mercado']);
  });

  it('devolve lista vazia para texto vazio', () => {
    expect(words('   ')).toEqual([]);
  });
});
