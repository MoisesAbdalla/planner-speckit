import { describe, it, expect } from 'vitest';
import {
  appliesTo,
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

describe('plannedDraft', () => {
  it('nasce como previsto, com origem e vínculo preenchidos (FR-010a)', () => {
    const draft = plannedDraft(recurrence(), '2026-08');
    expect(draft.status).toBe('planned');
    expect(draft.source).toBe('recurrence');
    expect(draft.recurrenceId).toBe('rec-aluguel');
  });

  it('cai no dia certo do mês', () => {
    expect(plannedDraft(recurrence(), '2026-08').date).toBe('2026-08-05');
    expect(plannedDraft(recurrence(), '2026-09').date).toBe('2026-09-05');
  });

  it('joga o dia 31 para o último dia do mês curto', () => {
    const dia31 = recurrence({ dayOfMonth: 31 });
    expect(plannedDraft(dia31, '2026-02').date).toBe('2026-02-28');
    expect(plannedDraft(dia31, '2024-02').date).toBe('2024-02-29');
    expect(plannedDraft(dia31, '2026-04').date).toBe('2026-04-30');
    expect(plannedDraft(dia31, '2026-01').date).toBe('2026-01-31');
  });

  it('mantém month coerente com a data', () => {
    const draft = plannedDraft(recurrence({ dayOfMonth: 31 }), '2026-02');
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
  it('prepara o mês atual e os seguintes', () => {
    expect(horizonFrom('2026-08', 3)).toEqual(['2026-08', '2026-09', '2026-10']);
  });

  it('vira o ano corretamente', () => {
    expect(horizonFrom('2026-11', 3)).toEqual(['2026-11', '2026-12', '2027-01']);
  });
});
