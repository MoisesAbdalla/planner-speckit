import { describe, it, expect } from 'vitest';
import { extractTime } from '../../src/features/finance/lib/phraseTime';

describe('a marca é o que faz a hora existir', () => {
  /**
   * O par que justifica a regra inteira. Os dois textos contêm "15"; só a
   * marca decide se aquilo é um compromisso ou um lanche.
   */
  it('"reunião às 15h" é hora; "paguei 15 no lanche" não é', () => {
    expect(extractTime('reunião às 15h')?.time).toBe('15:00');
    expect(extractTime('paguei 15 no lanche')).toBeNull();
  });

  it('número solto nunca vira hora', () => {
    expect(extractTime('20 no mercado')).toBeNull();
    expect(extractTime('gastei 7 no café')).toBeNull();
    expect(extractTime('lembrar de comprar 3 pães')).toBeNull();
  });
});

describe('as formas de dizer a hora', () => {
  it('com h, com e sem minutos', () => {
    expect(extractTime('academia 7h')?.time).toBe('07:00');
    expect(extractTime('academia 7h30')?.time).toBe('07:30');
    expect(extractTime('reunião 15h45')?.time).toBe('15:45');
  });

  it('com "às" na frente', () => {
    expect(extractTime('academia às 7h')?.time).toBe('07:00');
    expect(extractTime('reunião às 15h30')?.time).toBe('15:30');
  });

  it('com dois pontos', () => {
    expect(extractTime('reunião 7:30')?.time).toBe('07:30');
    expect(extractTime('consulta às 07:30')?.time).toBe('07:30');
    expect(extractTime('plantão 23:59')?.time).toBe('23:59');
  });

  it('meio-dia e meia-noite', () => {
    expect(extractTime('almoço meio-dia')?.time).toBe('12:00');
    expect(extractTime('almoço meio dia')?.time).toBe('12:00');
    expect(extractTime('plantão meia-noite')?.time).toBe('00:00');
  });
});

describe('faixas inválidas são descartadas, não ajustadas', () => {
  it('hora acima de 23 não vira hora', () => {
    // Ajustar inventaria um horário que a pessoa não disse.
    expect(extractTime('reunião às 25h')).toBeNull();
    expect(extractTime('reunião 99h')).toBeNull();
  });

  it('minuto acima de 59 não vira hora', () => {
    expect(extractTime('reunião 15h75')).toBeNull();
    expect(extractTime('reunião 15:75')).toBeNull();
  });

  it('meia-noite é 00:00 e não é descartada por ser zero', () => {
    expect(extractTime('plantão 0h')?.time).toBe('00:00');
  });
});

describe('o texto restante', () => {
  it('volta sem a expressão de hora — é o que permite achar o valor depois', () => {
    const r = extractTime('reunião às 15h');
    expect(r?.rest).not.toContain('15');
    expect(r?.rest).toContain('reuniao');
  });

  it('devolve null quando a frase não fala de hora', () => {
    expect(extractTime('lembrar de pagar o IPTU')).toBeNull();
  });
});
