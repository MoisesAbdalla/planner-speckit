import { describe, it, expect } from 'vitest';
import { extractDate } from '../../src/features/finance/lib/phraseDates';

/**
 * `today` é injetado em todos os casos: um teste que lê o relógio quebra
 * sozinho quando o dia vira, e aí ninguém confia mais nele.
 *
 * Referência: terça, 1º de setembro de 2026 — escolhida de propósito num dia
 * 1º, porque é quando "ontem" cai no mês anterior.
 */
const HOJE = '2026-09-01';
const MES = '2026-09';

describe('datas relativas', () => {
  it('hoje, ontem e amanhã', () => {
    expect(extractDate('gastei 20 hoje', HOJE, MES)?.date).toBe('2026-09-01');
    expect(extractDate('gastei 20 ontem', HOJE, MES)?.date).toBe('2026-08-31');
    expect(extractDate('gastei 20 amanhã', HOJE, MES)?.date).toBe('2026-09-02');
  });

  it('anteontem é testado ANTES de ontem — senão vira ontem', () => {
    // "anteontem" contém "ontem". Invertida a ordem, o erro é de um dia
    // e passa despercebido em qualquer conferência rápida.
    expect(extractDate('gastei 20 anteontem', HOJE, MES)?.date).toBe('2026-08-30');
  });

  it('depois de amanhã não é lido como amanhã', () => {
    expect(extractDate('cinema depois de amanhã', HOJE, MES)?.date).toBe('2026-09-03');
  });
});

describe('dia da semana', () => {
  it('sem qualificador, é o mais recente que já passou', () => {
    // Quem lança um gasto está quase sempre falando do passado.
    expect(extractDate('padaria sexta', HOJE, MES)?.date).toBe('2026-08-28');
    expect(extractDate('uber segunda', HOJE, MES)?.date).toBe('2026-08-31');
  });

  it('hoje é terça, então "terça" é hoje mesmo', () => {
    expect(extractDate('mercado terça', HOJE, MES)?.date).toBe('2026-09-01');
  });

  it('"que vem" olha para frente', () => {
    expect(extractDate('cinema sexta que vem', HOJE, MES)?.date).toBe('2026-09-04');
  });

  it('"passada" volta uma semana quando o dia é hoje', () => {
    expect(extractDate('mercado terça passada', HOJE, MES)?.date).toBe('2026-08-25');
  });

  it('aceita a forma com -feira', () => {
    expect(extractDate('padaria sexta-feira', HOJE, MES)?.date).toBe('2026-08-28');
  });
});

describe('data explícita', () => {
  it('"dia N" usa o mês em exibição, não o mês corrente', () => {
    // Quem está olhando agosto e escreve "dia 5" quer 5 de agosto.
    expect(extractDate('gastei 20 dia 5', HOJE, '2026-08')?.date).toBe('2026-08-05');
    expect(extractDate('gastei 20 dia 5', HOJE, '2026-09')?.date).toBe('2026-09-05');
  });

  it('DD/MM usa o ano corrente', () => {
    expect(extractDate('posto 150 em 28/08', HOJE, MES)?.date).toBe('2026-08-28');
  });

  it('ignora dia ou mês fora da faixa', () => {
    expect(extractDate('gastei 20 dia 45', HOJE, MES)).toBeNull();
    expect(extractDate('gastei 20 em 10/45', HOJE, MES)).toBeNull();
  });
});

describe('o texto restante', () => {
  it('volta sem a expressão de data — é o que permite achar o valor depois', () => {
    const r = extractDate('gastei 20 dia 5', HOJE, MES);
    expect(r?.rest).not.toContain('dia 5');
    expect(r?.rest).toContain('20');
  });

  it('devolve null quando a frase não fala de data', () => {
    expect(extractDate('20 no mercado', HOJE, MES)).toBeNull();
  });
});
