import { describe, it, expect } from 'vitest';
import { readPhrase } from '../../src/features/finance/lib/phraseReading';
import { CASOS_LEITURA } from './fixtures/readings';
import { CATEGORIAS, HOJE, MES_EM_EXIBICAO } from './fixtures/phrases';

const ctx = { categories: CATEGORIAS, history: {}, today: HOJE, viewMonth: MES_EM_EXIBICAO };

describe('a tabela de decisão', () => {
  it('marca de lembrete sem valor é tarefa', () => {
    const r = readPhrase('lembrar de pagar o IPTU sexta', ctx);
    expect(r.kind).toBe('task');
    expect(r.ambiguous).toBe(false);
  });

  it('valor sem marca de lembrete é lançamento', () => {
    const r = readPhrase('20 no mercado', ctx);
    expect(r.kind).toBe('transaction');
    expect(r.ambiguous).toBe(false);
  });

  it('os dois juntos é ambíguo, e escolhe lançamento', () => {
    // Escolhe o lado do valor porque refazer um valor à mão custa mais do que
    // refazer um título — e a troca fica a um toque.
    const r = readPhrase('pagar 200 do IPTU sexta', ctx);
    expect(r.ambiguous).toBe(true);
    expect(r.kind).toBe('transaction');
  });

  it('sem sinal de nenhum dos lados continua lançamento, como hoje', () => {
    // A linha que protege quem já usa o assistente.
    expect(readPhrase('mercado', ctx).kind).toBe('transaction');
    expect(readPhrase('uber', ctx).kind).toBe('transaction');
  });
});

describe('o par que separa hora de dinheiro', () => {
  it('"paguei 15 no lanche" é lançamento de R$ 15,00', () => {
    const r = readPhrase('paguei 15 no lanche', ctx);
    expect(r.kind).toBe('transaction');
    expect(r.transaction.amountCents).toBe(1500);
    expect(r.task.time).toBeNull();
  });

  it('"reunião às 15h" é tarefa às 15:00, sem virar R$ 15,00', () => {
    const r = readPhrase('reunião às 15h', ctx);
    expect(r.kind).toBe('task');
    expect(r.task.time).toBe('15:00');
  });
});

describe('as duas leituras existem sempre', () => {
  it('mesmo quando só uma será usada — é o que faz a troca ser instantânea', () => {
    const r = readPhrase('lembrar de pagar o IPTU sexta', ctx);
    expect(r.kind).toBe('task');
    // A leitura financeira está lá, pronta, caso a pessoa troque.
    expect(r.transaction).toBeDefined();
    expect(r.transaction.date).toBe('2026-08-28');
  });

  it('e a de tarefa existe mesmo numa frase claramente financeira', () => {
    const r = readPhrase('20 no mercado', ctx);
    expect(r.task).toBeDefined();
    expect(r.task.title).toBe('mercado');
  });
});

describe('o conjunto rotulado (SC-003)', () => {
  it('acerta o lado em pelo menos 85% das frases', () => {
    const erros: string[] = [];

    for (const caso of CASOS_LEITURA) {
      const r = readPhrase(caso.phrase, ctx);
      if (caso.expected === 'ambigua') {
        // Na ambígua o acerto é **anunciar a dúvida**, qualquer que seja o
        // lado escolhido — contar de outro jeito premiaria o palpite sortudo.
        if (!r.ambiguous) erros.push(`"${caso.phrase}" não foi anunciada como ambígua`);
      } else if (r.kind !== caso.expected) {
        erros.push(`"${caso.phrase}" → ${r.kind} (esperado ${caso.expected})`);
      }
    }

    const acerto = (CASOS_LEITURA.length - erros.length) / CASOS_LEITURA.length;
    expect(
      acerto,
      `${(acerto * 100).toFixed(1)}% de acerto. Falhas:\n${erros.join('\n')}`,
    ).toBeGreaterThanOrEqual(0.85);
  });

  it('o conjunto tem os três grupos', () => {
    expect(CASOS_LEITURA.length).toBeGreaterThanOrEqual(20);
    for (const grupo of ['transaction', 'task', 'ambigua'] as const) {
      expect(CASOS_LEITURA.some((c) => c.expected === grupo)).toBe(true);
    }
  });
});
