import { describe, it, expect } from 'vitest';
import {
  matchesDay,
  occurrenceDates,
  expandTasks,
  groupByDay,
  overdue,
} from '../../src/features/planner/lib/expandTasks';
import type { Recur, Task, TaskOverride } from '../../src/features/planner/types';

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    notes: null,
    time: null,
    recurrence: null,
    date: null,
    startDate: '2026-08-01',
    endDate: null,
    ...partial,
  };
}

function override(partial: Partial<TaskOverride> & Pick<TaskOverride, 'taskId' | 'date'>): TaskOverride {
  return {
    id: `${partial.taskId}_${partial.date}`,
    done: false,
    deleted: false,
    ...partial,
  };
}

describe('matchesDay', () => {
  it('diário cai todo dia', () => {
    expect(matchesDay({ freq: 'daily' }, '2026-08-29')).toBe(true);
    expect(matchesDay({ freq: 'daily' }, '2026-08-30')).toBe(true);
  });

  it('semanal cai só nos dias escolhidos', () => {
    // 2026-08-31 é segunda, 09-02 é quarta, 09-04 é sexta.
    const segQuaSex: Recur = { freq: 'weekly', weekdays: [1, 3, 5] };
    expect(matchesDay(segQuaSex, '2026-08-31')).toBe(true);
    expect(matchesDay(segQuaSex, '2026-09-02')).toBe(true);
    expect(matchesDay(segQuaSex, '2026-09-04')).toBe(true);
    expect(matchesDay(segQuaSex, '2026-09-01')).toBe(false);
    expect(matchesDay(segQuaSex, '2026-09-05')).toBe(false);
  });

  it('mensal cai no dia escolhido', () => {
    expect(matchesDay({ freq: 'monthly', dayOfMonth: 5 }, '2026-08-05')).toBe(true);
    expect(matchesDay({ freq: 'monthly', dayOfMonth: 5 }, '2026-08-06')).toBe(false);
  });

  it('mensal no dia 31 cai no último dia do mês curto', () => {
    const dia31: Recur = { freq: 'monthly', dayOfMonth: 31 };
    expect(matchesDay(dia31, '2026-02-28')).toBe(true);
    expect(matchesDay(dia31, '2026-02-27')).toBe(false);
    expect(matchesDay(dia31, '2024-02-29')).toBe(true);
    expect(matchesDay(dia31, '2026-04-30')).toBe(true);
    expect(matchesDay(dia31, '2026-01-31')).toBe(true);
  });
});

describe('occurrenceDates', () => {
  it('tarefa avulsa aparece só na própria data', () => {
    const avulsa = task({ id: 't1', title: 'Dentista', date: '2026-08-29' });
    expect(occurrenceDates(avulsa, '2026-08-23', '2026-08-29')).toEqual(['2026-08-29']);
    expect(occurrenceDates(avulsa, '2026-09-01', '2026-09-30')).toEqual([]);
  });

  it('recorrente semanal aparece nos três dias da semana', () => {
    const academia = task({
      id: 't2',
      title: 'Academia',
      recurrence: { freq: 'weekly', weekdays: [1, 3, 5] },
      startDate: '2026-08-01',
    });
    expect(occurrenceDates(academia, '2026-08-30', '2026-09-05')).toEqual([
      '2026-08-31',
      '2026-09-02',
      '2026-09-04',
    ]);
  });

  it('não aparece antes do início da série', () => {
    const t = task({
      id: 't3',
      title: 'Curso',
      recurrence: { freq: 'daily' },
      startDate: '2026-08-15',
    });
    expect(occurrenceDates(t, '2026-08-13', '2026-08-16')).toEqual(['2026-08-15', '2026-08-16']);
  });

  it('não aparece depois do fim da série', () => {
    const t = task({
      id: 't4',
      title: 'Curso',
      recurrence: { freq: 'daily' },
      startDate: '2026-08-01',
      endDate: '2026-08-03',
    });
    expect(occurrenceDates(t, '2026-08-01', '2026-08-10')).toEqual([
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
    ]);
  });

  it('devolve vazio quando a série termina antes do intervalo pedido', () => {
    const t = task({
      id: 't5',
      title: 'Antigo',
      recurrence: { freq: 'daily' },
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(occurrenceDates(t, '2026-08-01', '2026-08-31')).toEqual([]);
  });
});

describe('expandTasks', () => {
  const academia = task({
    id: 'academia',
    title: 'Academia',
    time: '07:00',
    recurrence: { freq: 'weekly', weekdays: [1, 3, 5] },
    startDate: '2026-08-01',
  });
  const ingles = task({ id: 'ingles', title: 'Estudar inglês', time: '19:00', date: '2026-08-31' });

  it('junta avulsas e recorrentes na mesma lista', () => {
    const occurrences = expandTasks([academia, ingles], [], '2026-08-31', '2026-08-31');
    expect(occurrences.map((o) => o.title)).toEqual(['Academia', 'Estudar inglês']);
  });

  it('ordena por hora dentro do dia, deixando sem-hora no fim', () => {
    const semHora = task({ id: 'x', title: 'Comprar pão', date: '2026-08-31' });
    const occurrences = expandTasks([ingles, semHora, academia], [], '2026-08-31', '2026-08-31');
    expect(occurrences.map((o) => o.title)).toEqual([
      'Academia',
      'Estudar inglês',
      'Comprar pão',
    ]);
  });

  it('marcar concluída afeta só aquele dia (FR-016)', () => {
    const occurrences = expandTasks(
      [academia],
      [override({ taskId: 'academia', date: '2026-08-31', done: true })],
      '2026-08-31',
      '2026-09-04',
    );

    expect(occurrences).toHaveLength(3);
    expect(occurrences[0]!.date).toBe('2026-08-31');
    expect(occurrences[0]!.done).toBe(true);
    expect(occurrences[1]!.done).toBe(false);
    expect(occurrences[2]!.done).toBe(false);
  });

  it('excluir uma ocorrência tira só aquele dia da série (FR-017)', () => {
    const occurrences = expandTasks(
      [academia],
      [override({ taskId: 'academia', date: '2026-09-02', deleted: true })],
      '2026-08-31',
      '2026-09-04',
    );

    expect(occurrences.map((o) => o.date)).toEqual(['2026-08-31', '2026-09-04']);
  });

  it('editar uma ocorrência muda só ela', () => {
    const occurrences = expandTasks(
      [academia],
      [
        override({
          taskId: 'academia',
          date: '2026-09-02',
          titleOverride: 'Academia (leve)',
          timeOverride: '18:00',
        }),
      ],
      '2026-08-31',
      '2026-09-04',
    );

    expect(occurrences[1]!.title).toBe('Academia (leve)');
    expect(occurrences[1]!.time).toBe('18:00');
    expect(occurrences[0]!.title).toBe('Academia');
    expect(occurrences[0]!.time).toBe('07:00');
  });

  it('override de hora para null tira a hora só daquele dia', () => {
    const occurrences = expandTasks(
      [academia],
      [override({ taskId: 'academia', date: '2026-08-31', timeOverride: null })],
      '2026-08-31',
      '2026-08-31',
    );
    expect(occurrences[0]!.time).toBeNull();
  });

  it('marca o que é série e o que é avulso', () => {
    const occurrences = expandTasks([academia, ingles], [], '2026-08-31', '2026-08-31');
    expect(occurrences.find((o) => o.taskId === 'academia')!.recurring).toBe(true);
    expect(occurrences.find((o) => o.taskId === 'ingles')!.recurring).toBe(false);
  });

  it('intervalo sem tarefas devolve lista vazia', () => {
    expect(expandTasks([academia], [], '2026-09-01', '2026-09-01')).toEqual([]);
    expect(expandTasks([], [], '2026-08-01', '2026-08-31')).toEqual([]);
  });

  it('override de um dia fora do intervalo não interfere', () => {
    const occurrences = expandTasks(
      [academia],
      [override({ taskId: 'academia', date: '2026-12-25', done: true })],
      '2026-08-31',
      '2026-08-31',
    );
    expect(occurrences[0]!.done).toBe(false);
  });
});

describe('groupByDay e overdue', () => {
  const diaria = task({
    id: 'd',
    title: 'Remédio',
    recurrence: { freq: 'daily' },
    startDate: '2026-08-27',
  });

  it('agrupa as ocorrências por dia', () => {
    const grupos = groupByDay(expandTasks([diaria], [], '2026-08-27', '2026-08-29'));
    expect([...grupos.keys()]).toEqual(['2026-08-27', '2026-08-28', '2026-08-29']);
    expect(grupos.get('2026-08-27')).toHaveLength(1);
  });

  it('lista como atrasado só o que está pendente em dia passado (FR-018)', () => {
    const occurrences = expandTasks(
      [diaria],
      [override({ taskId: 'd', date: '2026-08-27', done: true })],
      '2026-08-27',
      '2026-08-29',
    );

    expect(overdue(occurrences, '2026-08-29').map((o) => o.date)).toEqual(['2026-08-28']);
  });

  it('o dia de hoje não conta como atrasado', () => {
    const occurrences = expandTasks([diaria], [], '2026-08-29', '2026-08-29');
    expect(overdue(occurrences, '2026-08-29')).toEqual([]);
  });
});
