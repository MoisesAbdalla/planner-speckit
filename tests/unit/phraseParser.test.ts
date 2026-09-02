import { describe, it, expect } from 'vitest';
import { parsePhrase } from '../../src/features/finance/lib/phraseParser';
import { CATEGORIAS, HOJE, MES_EM_EXIBICAO } from './fixtures/phrases';

const ctx = {
  categories: CATEGORIAS,
  history: {},
  today: HOJE,
  viewMonth: MES_EM_EXIBICAO,
};

/** Os casos que a tabela do contrato fixa. */
describe('a tabela do contrato', () => {
  it('20 no mercado', () => {
    const r = parsePhrase('20 no mercado', ctx);
    expect(r.amountCents).toBe(2000);
    expect(r.type).toBe('expense');
    expect(r.date).toBe(HOJE);
    expect(r.description).toBe('mercado');
    expect(r.categoryId).toBe('cat-alimentacao');
  });

  it('registre gasto de 20 reais mercado — as palavras de comando somem', () => {
    expect(parsePhrase('registre gasto de 20 reais mercado', ctx).description).toBe('mercado');
  });

  it('salário 3200 é receita', () => {
    const r = parsePhrase('salário 3200', ctx);
    expect(r.type).toBe('income');
    expect(r.typeFromPhrase).toBe(true);
    expect(r.amountCents).toBe(320000);
  });

  it('paguei 47,90 no posto ontem', () => {
    const r = parsePhrase('paguei 47,90 no posto ontem', ctx);
    expect(r.amountCents).toBe(4790);
    expect(r.date).toBe('2026-08-31');
    expect(r.dateFromPhrase).toBe(true);
    expect(r.description).toBe('posto');
  });

  it('R$ 1.200,00 aluguel — o ponto é milhar, não centavo', () => {
    expect(parsePhrase('R$ 1.200,00 aluguel', ctx).amountCents).toBe(120000);
  });

  it('vinte reais no mercado — por extenso', () => {
    expect(parsePhrase('vinte reais no mercado', ctx).amountCents).toBe(2000);
  });

  it('gastei 20 dia 5 — a data sai da frase ANTES do valor', () => {
    // Invertida a ordem, o "5" de "dia 5" viraria R$ 5,00 e a frase
    // continuaria parecendo certa.
    const r = parsePhrase('gastei 20 dia 5', ctx);
    expect(r.amountCents).toBe(2000);
    expect(r.date).toBe('2026-09-05');
  });

  it('no mercado — sem número, o valor fica vazio', () => {
    const r = parsePhrase('no mercado', ctx);
    expect(r.amountCents).toBeNull();
    expect(r.categoryId).toBe('cat-alimentacao');
    expect(r.understood).toBe(true);
  });

  it('bom dia — nada aproveitável', () => {
    const r = parsePhrase('bom dia', ctx);
    expect(r.amountCents).toBeNull();
    expect(r.understood).toBe(false);
  });
});

describe('os campos que separam entendimento de padrão', () => {
  it('o tipo padrão vem marcado como NÃO vindo da frase', () => {
    // Sem isso, a interface apresentaria o padrão como entendimento (FR-009).
    const r = parsePhrase('20 no mercado', ctx);
    expect(r.type).toBe('expense');
    expect(r.typeFromPhrase).toBe(false);
  });

  it('a data padrão vem marcada como NÃO vinda da frase', () => {
    expect(parsePhrase('20 no mercado', ctx).dateFromPhrase).toBe(false);
    expect(parsePhrase('20 no mercado ontem', ctx).dateFromPhrase).toBe(true);
  });

  it('a origem da categoria é registrada', () => {
    expect(parsePhrase('20 no mercado', ctx).categorySource).toBe('dicionário');
    expect(parsePhrase('20 em lazer', ctx).categorySource).toBe('nome');
    expect(parsePhrase('20 petshop', ctx).categorySource).toBeNull();
  });
});

describe('o contexto é injetado, nunca lido do ambiente', () => {
  it('a mesma frase em dias diferentes produz datas diferentes', () => {
    const outroDia = { ...ctx, today: '2026-12-25' };
    expect(parsePhrase('20 mercado ontem', ctx).date).toBe('2026-08-31');
    expect(parsePhrase('20 mercado ontem', outroDia).date).toBe('2026-12-24');
  });

  it('o histórico do contexto muda a categoria sugerida', () => {
    const comHistorico = { ...ctx, history: { petshop: 'cat-outros' } };
    expect(parsePhrase('35 petshop', ctx).categoryId).toBeNull();
    expect(parsePhrase('35 petshop', comHistorico).categoryId).toBe('cat-outros');
  });
});
