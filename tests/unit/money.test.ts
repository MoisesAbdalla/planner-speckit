import { describe, it, expect } from 'vitest';
import {
  formatCents,
  formatCentsPlain,
  formatCentsSigned,
  centsToInputValue,
  parseAmountToCents,
  isValidAmount,
} from '../../src/shared/money';

/** Espaço fino não-quebrável que o Intl usa entre "R$" e o número. */
const norm = (s: string) => s.replace(/[\u00A0\u202F]/g, ' ');

describe('formatCents', () => {
  it('formata no padrão brasileiro (FR-012)', () => {
    expect(norm(formatCents(123456))).toBe('R$ 1.234,56');
    expect(norm(formatCents(50))).toBe('R$ 0,50');
    expect(norm(formatCents(0))).toBe('R$ 0,00');
  });

  it('formata valores altos sem perder separadores', () => {
    expect(norm(formatCents(123456789012))).toBe('R$ 1.234.567.890,12');
  });

  it('formata sem símbolo quando a coluna já diz R$', () => {
    expect(formatCentsPlain(123456)).toBe('1.234,56');
  });

  it('usa o menos tipográfico no valor com sinal', () => {
    expect(norm(formatCentsSigned(5000))).toBe('+R$ 50,00');
    expect(norm(formatCentsSigned(-5000))).toBe('−R$ 50,00');
    expect(norm(formatCentsSigned(0))).toBe('R$ 0,00');
  });
});

describe('centsToInputValue', () => {
  it('devolve o valor pronto para edição', () => {
    expect(centsToInputValue(123456)).toBe('1234,56');
    expect(centsToInputValue(5)).toBe('0,05');
    expect(centsToInputValue(100)).toBe('1,00');
  });
});

describe('parseAmountToCents', () => {
  it('aceita número inteiro digitado direto', () => {
    expect(parseAmountToCents('50')).toBe(5000);
  });

  it('aceita vírgula como decimal (padrão pt-BR)', () => {
    expect(parseAmountToCents('1234,56')).toBe(123456);
    expect(parseAmountToCents('0,05')).toBe(5);
    expect(parseAmountToCents('1234,5')).toBe(123450);
  });

  it('aceita ponto de milhar com vírgula decimal', () => {
    expect(parseAmountToCents('1.234,56')).toBe(123456);
    expect(parseAmountToCents('1.234.567,89')).toBe(123456789);
  });

  it('lê ponto sozinho com 3 dígitos como milhar', () => {
    expect(parseAmountToCents('1.500')).toBe(150000);
  });

  it('lê ponto sozinho com 1 ou 2 dígitos como decimal', () => {
    expect(parseAmountToCents('1.50')).toBe(150);
    expect(parseAmountToCents('1.5')).toBe(150);
  });

  it('ignora o símbolo da moeda e espaços', () => {
    expect(parseAmountToCents('R$ 1.234,56')).toBe(123456);
    expect(parseAmountToCents('  99,90  ')).toBe(9990);
  });

  it('trunca centavos além da segunda casa em vez de arredondar para cima', () => {
    expect(parseAmountToCents('10,999')).toBe(1099);
  });

  it('não perde centavos em valores que quebram em ponto flutuante', () => {
    // 0.1 + 0.2 !== 0.3 em float; aqui o caminho é inteiro do começo ao fim.
    expect(parseAmountToCents('0,10')! + parseAmountToCents('0,20')!).toBe(
      parseAmountToCents('0,30'),
    );
    expect(parseAmountToCents('19,99')).toBe(1999);
    expect(parseAmountToCents('8,15')).toBe(815);
  });

  it('devolve null para entrada vazia ou sem número', () => {
    expect(parseAmountToCents('')).toBeNull();
    expect(parseAmountToCents('   ')).toBeNull();
    expect(parseAmountToCents('abc')).toBeNull();
    expect(parseAmountToCents('R$')).toBeNull();
    expect(parseAmountToCents(',')).toBeNull();
  });

  it('preserva o sinal negativo para quem chama decidir', () => {
    expect(parseAmountToCents('-50')).toBe(-5000);
  });
});

describe('isValidAmount', () => {
  it('rejeita zero e negativo (FR-011)', () => {
    expect(isValidAmount(parseAmountToCents('0'))).toBe(false);
    expect(isValidAmount(parseAmountToCents('0,00'))).toBe(false);
    expect(isValidAmount(parseAmountToCents('-10'))).toBe(false);
    expect(isValidAmount(null)).toBe(false);
  });

  it('aceita qualquer valor positivo, inclusive alto', () => {
    expect(isValidAmount(parseAmountToCents('0,01'))).toBe(true);
    expect(isValidAmount(parseAmountToCents('1.234.567,89'))).toBe(true);
  });
});
