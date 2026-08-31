import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import type { Task, TaskOverride } from '../types';
import type { ISODate } from '../../../shared/dates';

/**
 * Tarefas do usuário. A coleção inteira é carregada porque a expansão da
 * série acontece em memória — filtrar por data no servidor não funcionaria
 * para uma recorrência, que não tem documento por dia.
 */
export function useTasks(uid: string) {
  const { data, loading } = useLiveQuery<Task>(`tasks:${uid}`, (emit, fail) =>
    onSnapshot(
      collection(db, 'users', uid, 'tasks'),
      (snapshot) => emit(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
      fail,
    ),
  );

  return { tasks: data, loading };
}

/** Exceções do intervalo visível — só existem onde a pessoa interagiu. */
export function useTaskOverrides(uid: string, from: ISODate, to: ISODate) {
  const { data } = useLiveQuery<TaskOverride>(
    `taskOverrides:${uid}:${from}:${to}`,
    (emit, fail) =>
      onSnapshot(
        query(
          collection(db, 'users', uid, 'taskOverrides'),
          where('date', '>=', from),
          where('date', '<=', to),
        ),
        (snapshot) =>
          emit(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TaskOverride)),
        fail,
      ),
  );

  return data;
}
