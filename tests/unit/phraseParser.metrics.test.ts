import { describe, it, expect } from 'vitest';
import { parsePhrase } from '../../src/features/finance/lib/phraseParser';
import { CASOS, CASOS_SEM_VALOR, CATEGORIAS, HOJE, MES_EM_EXIBICAO } from './fixtures/phrases';

/**
 * O portão dos critérios de sucesso.
 *
 * Os dois números aqui têm forças diferentes de propósito. Errar a categoria
 * custa um toque de correção; preencher um valor que a pessoa não disse
 * corrompe o saldo dela em silêncio, e ela só descobre quando os números não
 * fecharem. Não é a mesma classe de erro, então não tem a mesma meta.
 */

const contexto = {
  categories: CATEGORIAS,
  history: {},
  today: HOJE,
  viewMonth: MES_EM_EXIBICAO,
};

describe('SC-002 — acerto de valor, tipo e data', () => {
  it('acerta pelo menos 90% das frases do conjunto', () => {
    const erros: string[] = [];

    for (const caso of CASOS) {
      const r = parsePhrase(caso.phrase, contexto);
      const esperadoData = caso.date ?? HOJE;

      if (r.amountCents !== caso.amountCents) {
        erros.push(`valor  "${caso.phrase}" → ${r.amountCents} (esperado ${caso.amountCents})`);
      }
      if (r.type !== caso.type) {
        erros.push(`tipo   "${caso.phrase}" → ${r.type} (esperado ${caso.type})`);
      }
      if (r.date !== esperadoData) {
        erros.push(`data   "${caso.phrase}" → ${r.date} (esperado ${esperadoData})`);
      }
    }

    const total = CASOS.length * 3;
    const acerto = (total - erros.length) / total;

    // A mensagem lista o que errou: um percentual sozinho não diz o que corrigir.
    expect(
      acerto,
      `${(acerto * 100).toFixed(1)}% de acerto. Falhas:\n${erros.join('\n')}`,
    ).toBeGreaterThanOrEqual(0.9);
  });

  it('o conjunto tem tamanho suficiente para o percentual significar algo', () => {
    expect(CASOS.length).toBeGreaterThanOrEqual(40);
    expect(CASOS_SEM_VALOR.length).toBeGreaterThanOrEqual(5);
  });
});

describe('SC-003 — o assistente nunca inventa um valor', () => {
  /**
   * Sem tolerância: uma única ocorrência reprova. É a garantia que separa um
   * atalho de digitação de um app em que não dá para confiar.
   */
  it('frase sem número nenhum devolve valor vazio, sem exceção', () => {
    for (const caso of CASOS_SEM_VALOR) {
      const r = parsePhrase(caso.phrase, contexto);
      expect(r.amountCents, `"${caso.phrase}" inventou ${r.amountCents}`).toBeNull();
    }
  });

  it('nem mesmo quando a frase tem números que não são dinheiro', () => {
    const semDinheiro = ['dia 5', 'ontem', 'segunda', '28/08', 'bom dia'];
    for (const frase of semDinheiro) {
      const r = parsePhrase(frase, contexto);
      expect(r.amountCents, `"${frase}" inventou ${r.amountCents}`).toBeNull();
    }
  });
});

describe('garantias que valem para qualquer entrada', () => {
  const entradasHostis = [
    '',
    '   ',
    '🙂🙂🙂',
    'a'.repeat(500),
    '!!!???',
    '0',
    '-50 mercado',
    'R$',
    '999999999999',
  ];

  it('nunca lança exceção', () => {
    for (const frase of entradasHostis) {
      expect(() => parsePhrase(frase, contexto), `"${frase.slice(0, 20)}"`).not.toThrow();
    }
  });

  it('a categoria é sempre nula ou de uma categoria existente', () => {
    const ids = new Set(CATEGORIAS.map((c) => c.id));
    for (const caso of [...CASOS, ...entradasHostis.map((phrase) => ({ phrase }))]) {
      const r = parsePhrase(caso.phrase, contexto);
      if (r.categoryId !== null) expect(ids.has(r.categoryId)).toBe(true);
    }
  });

  it('a data é sempre uma data de calendário válida', () => {
    for (const caso of CASOS) {
      const r = parsePhrase(caso.phrase, contexto);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(r.date).getTime())).toBe(false);
    }
  });

  it('valor zero ou negativo nunca vira lançamento', () => {
    for (const frase of ['0 mercado', '0,00 mercado', '-50 mercado']) {
      const r = parsePhrase(frase, contexto);
      expect(r.amountCents === null || r.amountCents > 0).toBe(true);
    }
  });
});
