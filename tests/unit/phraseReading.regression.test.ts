import { describe, it, expect } from 'vitest';
import { parsePhrase } from '../../src/features/finance/lib/phraseParser';
import { readPhrase } from '../../src/features/finance/lib/phraseReading';
import { CASOS, CATEGORIAS, HOJE, MES_EM_EXIBICAO } from './fixtures/phrases';

/**
 * O teste mais importante desta feature.
 *
 * O assistente financeiro está em produção e é usado todo dia. Esta feature
 * mexe na porta de entrada dele. A única forma honesta de saber que ele
 * continua o mesmo é perguntar a ele, frase a frase, antes de construir por
 * cima — e é isso que este arquivo faz, sobre o conjunto de 45 frases que já
 * existia, **sem alterar uma única expectativa dele**.
 *
 * Se algo aqui falhar, o código novo é que está errado. Nunca o teste antigo.
 */

const contexto = {
  categories: CATEGORIAS,
  history: {},
  today: HOJE,
  viewMonth: MES_EM_EXIBICAO,
};

describe('SC-005 — o assistente financeiro continua idêntico', () => {
  it('as 45 frases financeiras continuam sendo lidas como lançamento', () => {
    const desviaram = CASOS.filter(
      (caso) => readPhrase(caso.phrase, contexto).kind !== 'transaction',
    ).map((c) => c.phrase);

    expect(desviaram, `estas frases mudaram de lado: ${desviaram.join(' | ')}`).toEqual([]);
  });

  it('e produzem um resultado idêntico ao de parsePhrase, campo a campo', () => {
    for (const caso of CASOS) {
      const antes = parsePhrase(caso.phrase, contexto);
      const depois = readPhrase(caso.phrase, contexto).transaction;
      expect(depois, `"${caso.phrase}" mudou de resultado`).toEqual(antes);
    }
  });

  it('nenhuma delas é anunciada como ambígua sem motivo', () => {
    // Ambígua exige valor E marca de lembrete. Nenhuma frase do conjunto
    // financeiro tem marca de lembrete, então nenhuma pode sair ambígua.
    const ambiguas = CASOS.filter((c) => readPhrase(c.phrase, contexto).ambiguous).map(
      (c) => c.phrase,
    );
    expect(ambiguas).toEqual([]);
  });

  it('o valor continua vazio nas frases que não tinham número', () => {
    for (const caso of CASOS.filter((c) => c.amountCents === null)) {
      expect(readPhrase(caso.phrase, contexto).transaction.amountCents).toBeNull();
    }
  });
});
