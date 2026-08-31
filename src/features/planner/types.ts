import type { Timestamp } from 'firebase/firestore';
import type { ISODate, Weekday } from '../../shared/dates';

/** Padrões de repetição aceitos (FR-015). */
export type Recur =
  | { freq: 'daily' }
  | { freq: 'weekly'; weekdays: Weekday[] }
  | { freq: 'monthly'; dayOfMonth: number };

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  /** "HH:mm" ou null quando o item não tem hora marcada. */
  time: string | null;
  /** null = item avulso, com data única em `date`. */
  recurrence: Recur | null;
  date: ISODate | null;
  startDate: ISODate;
  endDate: ISODate | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Exceção de uma ocorrência. Só existe quando a pessoa mexeu naquele dia —
 * ausência de override significa ocorrência pendente e sem alterações.
 */
export interface TaskOverride {
  id: string;
  taskId: string;
  date: ISODate;
  done: boolean;
  deleted: boolean;
  titleOverride?: string | null;
  timeOverride?: string | null;
  notesOverride?: string | null;
}

/** O que as visões renderizam: uma tarefa materializada num dia. */
export interface Occurrence {
  taskId: string;
  date: ISODate;
  title: string;
  time: string | null;
  notes: string | null;
  done: boolean;
  /** Item avulso ou parte de uma série — muda o que perguntamos ao editar. */
  recurring: boolean;
}

export function overrideId(taskId: string, date: ISODate): string {
  return `${taskId}_${date}`;
}
