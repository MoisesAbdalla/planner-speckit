import { describe, it, expect } from 'vitest';
import {
  appliesTo,
  describeFrequency,
  occurrenceBadge,
  occurrenceKeyOf,
  occurrencesIn,
  resolveFrequency,
  plannedDraft,
  plannedTransactionId,
  pendingFor,
  horizonFrom,
} from '../../src/features/finance/lib/recurrenceRules';
import type { Recurrence } from '../../src/features/finance/types';

function recurrence(partial: Partial<Recurrence> = {}): Recurrence {
  return {
    id: 'rec-aluguel',
    type: 'expense',
    amountCents: 120000,
    description: 'Aluguel',
    categoryId: 'cat-moradia',
    dayOfMonth: 5,
    startMonth: '2026-08',
    endMonth: null,
    ...partial,
  };
}

describe('appliesTo', () => {
  it('não gera antes do mês de início', () => {
    expect(appliesTo(recurrence(), '2026-07')).toBe(false);
  });

  it('gera no mês de início e nos seguintes', () => {
    expect(appliesTo(recurrence(), '2026-08')).toBe(true);
    expect(appliesTo(recurrence(), '2027-03')).toBe(true);
  });

  it('para de gerar depois do mês de encerramento (FR-010)', () => {
    const encerrada = recurrence({ endMonth: '2026-09' });
    expect(appliesTo(encerrada, '2026-09')).toBe(true);
    expect(appliesTo(encerrada, '2026-10')).toBe(false);
  });
});

/** Atalho: o rascunho da primeira ocorrência do mês, como a geração o produz. */
function draftDe(rec: Recurrence, month: string) {
  const [ocorrencia] = occurrencesIn(rec, month);
  return plannedDraft(rec, month, ocorrencia!.date);
}

describe('plannedDraft', () => {
  it('nasce como previsto, com origem e vínculo preenchidos (FR-010a)', () => {
    const draft = draftDe(recurrence(), '2026-08');
    expect(draft.status).toBe('planned');
    expect(draft.source).toBe('recurrence');
    expect(draft.recurrenceId).toBe('rec-aluguel');
  });

  it('cai no dia certo do mês', () => {
    expect(draftDe(recurrence(), '2026-08').date).toBe('2026-08-05');
    expect(draftDe(recurrence(), '2026-09').date).toBe('2026-09-05');
  });

  it('joga o dia 31 para o último dia do mês curto', () => {
    const dia31 = recurrence({ dayOfMonth: 31 });
    expect(draftDe(dia31, '2026-02').date).toBe('2026-02-28');
    expect(draftDe(dia31, '2024-02').date).toBe('2024-02-29');
    expect(draftDe(dia31, '2026-04').date).toBe('2026-04-30');
    expect(draftDe(dia31, '2026-01').date).toBe('2026-01-31');
  });

  it('mantém month coerente com a data', () => {
    const draft = draftDe(recurrence({ dayOfMonth: 31 }), '2026-02');
    expect(draft.month).toBe('2026-02');
    expect(draft.date.slice(0, 7)).toBe(draft.month);
  });
});

describe('plannedTransactionId', () => {
  it('é determinístico — a mesma recorrência e mês dão sempre o mesmo id', () => {
    expect(plannedTransactionId('rec-aluguel', '2026-08')).toBe('rec_rec-aluguel_2026-08');
    expect(plannedTransactionId('rec-aluguel', '2026-08')).toBe(
      plannedTransactionId('rec-aluguel', '2026-08'),
    );
  });

  it('separa meses e recorrências diferentes', () => {
    expect(plannedTransactionId('rec-a', '2026-08')).not.toBe(
      plannedTransactionId('rec-a', '2026-09'),
    );
    expect(plannedTransactionId('rec-a', '2026-08')).not.toBe(
      plannedTransactionId('rec-b', '2026-08'),
    );
  });
});

describe('pendingFor', () => {
  const recorrencias = [
    recurrence(),
    recurrence({ id: 'rec-salario', type: 'income', description: 'Salário', dayOfMonth: 1 }),
  ];

  it('lista o que falta criar num mês vazio', () => {
    const pending = pendingFor(recorrencias, '2026-08', []);
    expect(pending.map((p) => p.id)).toEqual([
      'rec_rec-aluguel_2026-08',
      'rec_rec-salario_2026-08',
    ]);
  });

  it('não recria o que já existe — rodar duas vezes não duplica', () => {
    const primeira = pendingFor(recorrencias, '2026-08', []);
    const jaCriados = primeira.map((p) => p.id);
    expect(pendingFor(recorrencias, '2026-08', jaCriados)).toEqual([]);
  });

  it('cria só o que falta quando um já existe', () => {
    const pending = pendingFor(recorrencias, '2026-08', ['rec_rec-aluguel_2026-08']);
    expect(pending.map((p) => p.id)).toEqual(['rec_rec-salario_2026-08']);
  });

  it('ignora recorrência encerrada', () => {
    const encerrada = [recurrence({ endMonth: '2026-08' })];
    expect(pendingFor(encerrada, '2026-08', [])).toHaveLength(1);
    expect(pendingFor(encerrada, '2026-09', [])).toEqual([]);
  });

  it('ignora recorrência que ainda não começou', () => {
    expect(pendingFor([recurrence({ startMonth: '2026-10' })], '2026-08', [])).toEqual([]);
  });

  it('não se confunde com lançamentos manuais já presentes no mês', () => {
    const pending = pendingFor(recorrencias, '2026-08', ['abc123', 'xyz789']);
    expect(pending).toHaveLength(2);
  });

  it('sem recorrências, não há nada a criar', () => {
    expect(pendingFor([], '2026-08', [])).toEqual([]);
  });
});

describe('horizonFrom', () => {
  it('prepara o mês atual e os seguintes para uma mensal', () => {
    expect(horizonFrom([recurrence()], '2026-08')).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('vira o ano corretamente', () => {
    expect(horizonFrom([recurrence()], '2026-11')).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('sem recorrência alguma, não prepara mês nenhum', () => {
    expect(horizonFrom([], '2026-08')).toEqual([]);
  });
});

describe('recorrência anual', () => {
  const anual = () =>
    recurrence({
      id: 'ipva',
      frequency: 'yearly',
      description: 'IPVA',
      dayOfMonth: 15,
      monthOfYear: 1,
      startMonth: '2026-09',
    });

  it('gera só no mês escolhido', () => {
    expect(occurrencesIn(anual(), '2027-01')).toHaveLength(1);
    expect(occurrencesIn(anual(), '2027-01')[0]!.date).toBe('2027-01-15');
  });

  it('não gera em nenhum outro mês', () => {
    for (const mes of ['2026-10', '2026-12', '2027-02', '2027-06']) {
      expect(occurrencesIn(anual(), mes)).toEqual([]);
    }
  });

  it('mantém a chave por mês — a chave por data seria mudança sem motivo', () => {
    expect(occurrencesIn(anual(), '2027-01')[0]!.key).toBe('2027-01');
  });

  it('29 de fevereiro cai no 28 em ano não bissexto', () => {
    const bissexto = recurrence({ frequency: 'yearly', dayOfMonth: 29, monthOfYear: 2 });
    expect(occurrencesIn(bissexto, '2027-02')[0]!.date).toBe('2027-02-28');
    expect(occurrencesIn(bissexto, '2028-02')[0]!.date).toBe('2028-02-29');
  });

  it('o horizonte alcança um ano e devolve só o mês em que ela cai', () => {
    expect(horizonFrom([anual()], '2026-09')).toEqual(['2027-01']);
  });

  it('encerrada não gera mais', () => {
    const encerrada = { ...anual(), endMonth: '2026-12' };
    expect(horizonFrom([encerrada], '2026-09')).toEqual([]);
  });
});

describe('recorrência semanal', () => {
  const semanal = () =>
    recurrence({
      id: 'feira',
      frequency: 'weekly',
      description: 'Feira',
      weekday: 2, // terça
      startMonth: '2026-09',
    });

  it('gera uma ocorrência em cada terça do mês', () => {
    // Setembro de 2026 tem cinco terças: 1, 8, 15, 22 e 29.
    const datas = occurrencesIn(semanal(), '2026-09').map((o) => o.date);
    expect(datas).toEqual([
      '2026-09-01',
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
      '2026-09-29',
    ]);
  });

  it('um mês com quatro ocorrências gera quatro', () => {
    // Fevereiro de 2027 tem quatro terças.
    expect(occurrencesIn(semanal(), '2027-02')).toHaveLength(4);
  });

  it('a chave é a data — a chave por mês colapsaria todas numa só', () => {
    const chaves = occurrencesIn(semanal(), '2026-09').map((o) => o.key);
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(chaves[0]).toBe('2026-09-01');
  });

  it('cria as cinco de uma vez quando nenhuma existe', () => {
    expect(pendingFor([semanal()], '2026-09', [])).toHaveLength(5);
  });

  it('não recria as que já existem — idempotência com várias por mês', () => {
    const primeira = pendingFor([semanal()], '2026-09', []);
    const jaCriadas = primeira.map((p) => p.id);
    expect(pendingFor([semanal()], '2026-09', jaCriadas)).toEqual([]);
  });

  it('cria só as que faltam', () => {
    const todas = pendingFor([semanal()], '2026-09', []).map((p) => p.id);
    const faltando = pendingFor([semanal()], '2026-09', todas.slice(0, 3));
    expect(faltando).toHaveLength(2);
  });
});

describe('descarte de ocorrência (FR-012)', () => {
  it('ocorrência descartada não é recriada', () => {
    const semanal = recurrence({
      id: 'feira',
      frequency: 'weekly',
      weekday: 2,
      startMonth: '2026-09',
      skips: ['2026-09-15'],
    });
    const datas = pendingFor([semanal], '2026-09', []).map((p) => p.draft.date);
    expect(datas).not.toContain('2026-09-15');
    expect(datas).toHaveLength(4);
  });

  it('descartar uma não afeta as outras', () => {
    const semanal = recurrence({
      id: 'feira',
      frequency: 'weekly',
      weekday: 2,
      startMonth: '2026-09',
      skips: ['2026-09-01'],
    });
    expect(pendingFor([semanal], '2026-09', []).map((p) => p.draft.date)).toEqual([
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
      '2026-09-29',
    ]);
  });

  it('a chave do descarte é a mesma que a geração produz', () => {
    const semanal = recurrence({ id: 'f', frequency: 'weekly', weekday: 2 });
    const mensal = recurrence({ id: 'm' });
    expect(occurrenceKeyOf(semanal, '2026-09-15')).toBe('2026-09-15');
    expect(occurrenceKeyOf(mensal, '2026-09-05')).toBe('2026-09');
  });

  it('descartar o previsto mensal também funciona', () => {
    const mensal = recurrence({ skips: ['2026-09'] });
    expect(pendingFor([mensal], '2026-09', [])).toEqual([]);
    expect(pendingFor([mensal], '2026-10', [])).toHaveLength(1);
  });
});

/**
 * REGRESSÃO — a rede de segurança desta feature.
 *
 * As recorrências gravadas antes dela não têm `frequency`. Se qualquer coisa
 * aqui falhar, o aluguel do mês que vem não seria lançado — ou seria lançado
 * duas vezes. É o tipo de quebra que só apareceria em produção, no dinheiro.
 */
describe('regressão: recorrência sem frequency continua mensal', () => {
  const antiga = () => recurrence({ id: 'rec-aluguel', dayOfMonth: 5, startMonth: '2026-08' });

  it('é tratada como mensal', () => {
    expect(resolveFrequency(antiga())).toBe('monthly');
  });

  it('gera exatamente uma ocorrência por mês, no mesmo dia de sempre', () => {
    expect(occurrencesIn(antiga(), '2026-09')).toEqual([
      { date: '2026-09-05', key: '2026-09' },
    ]);
  });

  it('mantém a chave por mês — mudá-la duplicaria tudo que já está gravado', () => {
    expect(pendingFor([antiga()], '2026-09', [])[0]!.id).toBe('rec_rec-aluguel_2026-09');
  });

  it('reconhece os lançamentos já criados e não os recria', () => {
    expect(pendingFor([antiga()], '2026-09', ['rec_rec-aluguel_2026-09'])).toEqual([]);
  });

  it('mantém o horizonte curto de três meses', () => {
    expect(horizonFrom([antiga()], '2026-09')).toEqual(['2026-09', '2026-10', '2026-11']);
  });

  it('continua respeitando o clamp do dia 31', () => {
    const dia31 = recurrence({ dayOfMonth: 31, startMonth: '2026-01' });
    expect(occurrencesIn(dia31, '2026-02')[0]!.date).toBe('2026-02-28');
  });

  it('continua parando de gerar quando encerrada', () => {
    const encerrada = { ...antiga(), endMonth: '2026-09' };
    expect(pendingFor([encerrada], '2026-10', [])).toEqual([]);
  });
});

describe('como a repetição é dita na lista', () => {
  it('mensal diz o dia', () => {
    expect(describeFrequency(recurrence({ dayOfMonth: 5 }))).toBe('dia 5, todo mês');
  });

  it('recorrência antiga, sem frequency, continua sendo dita como mensal', () => {
    expect(describeFrequency(recurrence({ dayOfMonth: 10 }))).toBe('dia 10, todo mês');
  });

  it('semanal diz o dia da semana por extenso', () => {
    expect(describeFrequency(recurrence({ frequency: 'weekly', weekday: 2 }))).toBe('toda terça');
    expect(describeFrequency(recurrence({ frequency: 'weekly', weekday: 6 }))).toBe('todo sábado');
  });

  it('anual diz o dia e o mês', () => {
    expect(
      describeFrequency(recurrence({ frequency: 'yearly', dayOfMonth: 15, monthOfYear: 1 })),
    ).toBe('15 de janeiro, todo ano');
  });

  it('o rótulo da esquerda é o dia da semana na semanal e o número nas outras', () => {
    expect(occurrenceBadge(recurrence({ frequency: 'weekly', weekday: 4 }))).toBe('qui');
    expect(occurrenceBadge(recurrence({ dayOfMonth: 5 }))).toBe('05');
    expect(occurrenceBadge(recurrence({ frequency: 'yearly', dayOfMonth: 15 }))).toBe('15');
  });
});
