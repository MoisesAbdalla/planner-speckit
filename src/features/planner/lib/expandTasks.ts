import {
  clampDayToMonth,
  eachDay,
  monthOf,
  weekdayOf,
  type ISODate,
} from '../../../shared/dates';
import { overrideId, type Occurrence, type Recur, type Task, type TaskOverride } from '../types';

/**
 * Expansão das tarefas para um intervalo — em memória, sem gravar nada.
 *
 * Ao contrário das recorrências financeiras, uma ocorrência de tarefa não tem
 * efeito agregado: ela só precisa existir no banco quando a pessoa interage
 * com ela (concluir, editar, excluir aquele dia). Por isso a série é virtual
 * e as exceções são documentos à parte.
 */

/** A tarefa cai neste dia? */
export function matchesDay(recurrence: Recur, day: ISODate): boolean {
  switch (recurrence.freq) {
    case 'daily':
      return true;
    case 'weekly':
      return recurrence.weekdays.includes(weekdayOf(day));
    case 'monthly': {
      // Dia 31 em fevereiro cai no último dia — mesma regra do financeiro.
      const target = clampDayToMonth(monthOf(day), recurrence.dayOfMonth);
      return Number(day.slice(8, 10)) === target;
    }
  }
}

/** Dias em que a tarefa aparece dentro do intervalo pedido. */
export function occurrenceDates(task: Task, from: ISODate, to: ISODate): ISODate[] {
  if (!task.recurrence) {
    const date = task.date ?? task.startDate;
    return date >= from && date <= to ? [date] : [];
  }

  const start = task.startDate > from ? task.startDate : from;
  const end = task.endDate !== null && task.endDate < to ? task.endDate : to;
  if (start > end) return [];

  return eachDay(start, end).filter((day) => matchesDay(task.recurrence!, day));
}

/** Ordena por dia; dentro do dia, os com hora vêm primeiro, na ordem do relógio. */
function compare(a: Occurrence, b: Occurrence): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.time !== b.time) {
    if (a.time === null) return 1;
    if (b.time === null) return -1;
    return a.time < b.time ? -1 : 1;
  }
  return a.title.localeCompare(b.title, 'pt-BR');
}

export function expandTasks(
  tasks: Task[],
  overrides: TaskOverride[],
  from: ISODate,
  to: ISODate,
): Occurrence[] {
  const overrideByKey = new Map(overrides.map((o) => [overrideId(o.taskId, o.date), o]));
  const occurrences: Occurrence[] = [];

  for (const task of tasks) {
    for (const date of occurrenceDates(task, from, to)) {
      const override = overrideByKey.get(overrideId(task.id, date));
      if (override?.deleted) continue;

      occurrences.push({
        taskId: task.id,
        date,
        title: override?.titleOverride ?? task.title,
        time: override?.timeOverride !== undefined ? override.timeOverride : task.time,
        notes: override?.notesOverride !== undefined ? override.notesOverride : task.notes,
        done: override?.done ?? false,
        recurring: task.recurrence !== null,
      });
    }
  }

  return occurrences.sort(compare);
}

/** Agrupa por dia, para as visões de semana e mês. */
export function groupByDay(occurrences: Occurrence[]): Map<ISODate, Occurrence[]> {
  const byDay = new Map<ISODate, Occurrence[]>();
  for (const occurrence of occurrences) {
    const list = byDay.get(occurrence.date) ?? [];
    list.push(occurrence);
    byDay.set(occurrence.date, list);
  }
  return byDay;
}

/** Pendentes de dias anteriores a hoje (FR-018). */
export function overdue(occurrences: Occurrence[], today: ISODate): Occurrence[] {
  return occurrences.filter((o) => !o.done && o.date < today);
}
