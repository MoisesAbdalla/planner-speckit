import { describe, it, expect } from 'vitest';
import { wordsToNumber, extractNumberWords } from '../../src/features/finance/lib/numberWords';

/**
 * Números por extenso existem por causa da voz: quem fala diz "quarenta
 * reais", não "quatro zero". Sem isto, a US2 entregaria valor vazio na maioria
 * das frases faladas.
 */
describe('wordsToNumber', () => {
  it('unidades e dezenas', () => {
    expect(wordsToNumber('vinte')).toBe(20);
    expect(wordsToNumber('quinze')).toBe(15);
    expect(wordsToNumber('quarenta e cinco')).toBe(45);
    expect(wordsToNumber('noventa e nove')).toBe(99);
  });

  it('centenas, com "cem" e "cento" distintos', () => {
    expect(wordsToNumber('cem')).toBe(100);
    expect(wordsToNumber('cento e vinte')).toBe(120);
    expect(wordsToNumber('duzentos e cinquenta')).toBe(250);
    expect(wordsToNumber('novecentos e noventa e nove')).toBe(999);
  });

  it('mil multiplica o que veio antes, e sozinho vale 1000', () => {
    expect(wordsToNumber('mil')).toBe(1000);
    expect(wordsToNumber('mil e duzentos')).toBe(1200);
    expect(wordsToNumber('tres mil e duzentos')).toBe(3200);
    expect(wordsToNumber('dez mil')).toBe(10000);
  });

  it('aceita acento e caixa, porque a transcrição os produz', () => {
    expect(wordsToNumber('três mil')).toBe(3000);
    expect(wordsToNumber('TRÊS MIL')).toBe(3000);
  });

  it('devolve null para o que não é número', () => {
    expect(wordsToNumber('mercado')).toBeNull();
    expect(wordsToNumber('')).toBeNull();
    expect(wordsToNumber('vinte mercado')).toBeNull();
  });
});

describe('extractNumberWords', () => {
  it('acha o número dentro da frase e devolve o resto', () => {
    expect(extractNumberWords('vinte reais no mercado')).toEqual({
      value: 20,
      rest: 'reais no mercado',
    });
  });

  it('pega a sequência inteira, não só a primeira palavra', () => {
    expect(extractNumberWords('quarenta e cinco no posto')?.value).toBe(45);
    expect(extractNumberWords('mil e duzentos de aluguel')?.value).toBe(1200);
  });

  it('não engole o "e" que pertence à frase', () => {
    const r = extractNumberWords('vinte e mercado');
    expect(r?.value).toBe(20);
  });

  it('devolve null quando não há número por extenso', () => {
    expect(extractNumberWords('gastei no mercado')).toBeNull();
  });
});
