import { describe, it, expect } from 'vitest';
import { parseTask } from '../../src/features/finance/lib/taskParser';
import { CASOS_TAREFA, CASOS_SEM_HORA, HOJE, MES_EM_EXIBICAO } from './fixtures/tasks';
import { CATEGORIAS } from './fixtures/phrases';

const ctx = { categories: CATEGORIAS, history: {}, today: HOJE, viewMonth: MES_EM_EXIBICAO };

/**
 * Duas metas com forças diferentes, de propósito. Errar a data custa um toque
 * de correção; inventar uma hora coloca um compromisso falso na agenda de
 * alguém, e essa pessoa só descobre quando não aparecer.
 */
describe('SC-002 — acerto de data e hora', () => {
  it('acerta pelo menos 90% do conjunto', () => {
    const erros: string[] = [];

    for (const caso of CASOS_TAREFA) {
      const r = parseTask(caso.phrase, ctx);
      const dataEsperada = caso.date ?? HOJE;
      if (r.date !== dataEsperada) {
        erros.push(`data "${caso.phrase}" → ${r.date} (esperado ${dataEsperada})`);
      }
      if (r.time !== caso.time) {
        erros.push(`hora "${caso.phrase}" → ${r.time} (esperado ${caso.time})`);
      }
    }

    const total = CASOS_TAREFA.length * 2;
    const acerto = (total - erros.length) / total;
    expect(
      acerto,
      `${(acerto * 100).toFixed(1)}% de acerto. Falhas:\n${erros.join('\n')}`,
    ).toBeGreaterThanOrEqual(0.9);
  });

  it('o conjunto é grande o bastante para o percentual significar algo', () => {
    expect(CASOS_TAREFA.length).toBeGreaterThanOrEqual(30);
    expect(CASOS_SEM_HORA.length).toBeGreaterThanOrEqual(3);
  });
});

describe('SC-004 — o assistente nunca inventa uma hora', () => {
  it('frase sem marca de hora devolve hora vazia, sem exceção', () => {
    for (const caso of CASOS_SEM_HORA) {
      const r = parseTask(caso.phrase, ctx);
      expect(r.time, `"${caso.phrase}" inventou ${r.time}`).toBeNull();
    }
  });

  it('nem quando a frase tem números que não são hora', () => {
    for (const frase of ['comprar 3 pães', 'separar 20 folhas', 'pagar 200 do IPTU']) {
      expect(parseTask(frase, ctx).time, `"${frase}"`).toBeNull();
    }
  });
});

describe('títulos', () => {
  it('as marcas de lembrete somem do título', () => {
    expect(parseTask('lembrar de pagar o IPTU sexta', ctx).title).toBe('pagar iptu');
    expect(parseTask('preciso ligar para o médico', ctx).title).toBe('ligar medico');
  });

  it('a data e a hora somem do título', () => {
    const r = parseTask('academia amanhã às 7h', ctx);
    expect(r.title).toBe('academia');
    expect(r.date).toBe('2026-09-02');
    expect(r.time).toBe('07:00');
  });

  it('título pode ser vazio, e o formulário pede o nome', () => {
    expect(parseTask('lembrar de sexta', ctx).title).toBe('');
  });

  it('a data padrão vem marcada como NÃO vinda da frase', () => {
    expect(parseTask('reunião com o contador', ctx).dateFromPhrase).toBe(false);
    expect(parseTask('reunião amanhã', ctx).dateFromPhrase).toBe(true);
  });
});
