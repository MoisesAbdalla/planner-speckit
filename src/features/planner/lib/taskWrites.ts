import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { overrideId, type Occurrence, type TaskDraft } from '../types';
import type { ISODate } from '../../../shared/dates';

const tasksRef = (uid: string) => collection(db, 'users', uid, 'tasks');
const overridesRef = (uid: string) => collection(db, 'users', uid, 'taskOverrides');

export async function createTask(uid: string, draft: TaskDraft): Promise<string> {
  const ref = await addDoc(tasksRef(uid), {
    ...draft,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/** Editar a série inteira. */
export async function updateTask(uid: string, taskId: string, draft: TaskDraft): Promise<void> {
  await updateDoc(doc(tasksRef(uid), taskId), { ...draft, updatedAt: serverTimestamp() });
}

/**
 * Concluir ou desmarcar um dia. Grava a exceção com id determinístico, então
 * dois aparelhos marcando o mesmo dia convergem em vez de duplicar.
 */
export async function setOccurrenceDone(
  uid: string,
  taskId: string,
  date: ISODate,
  done: boolean,
): Promise<void> {
  await setDoc(
    doc(overridesRef(uid), overrideId(taskId, date)),
    { taskId, date, done, deleted: false, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** Editar só um dia da série. */
export async function overrideOccurrence(
  uid: string,
  occurrence: Occurrence,
  changes: { title?: string; time?: string | null; notes?: string | null },
): Promise<void> {
  await setDoc(
    doc(overridesRef(uid), overrideId(occurrence.taskId, occurrence.date)),
    {
      taskId: occurrence.taskId,
      date: occurrence.date,
      done: occurrence.done,
      deleted: false,
      ...(changes.title !== undefined ? { titleOverride: changes.title } : {}),
      ...(changes.time !== undefined ? { timeOverride: changes.time } : {}),
      ...(changes.notes !== undefined ? { notesOverride: changes.notes } : {}),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Excluir só aquele dia (FR-017). */
export async function deleteOccurrence(
  uid: string,
  taskId: string,
  date: ISODate,
): Promise<void> {
  await setDoc(
    doc(overridesRef(uid), overrideId(taskId, date)),
    { taskId, date, done: false, deleted: true, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/**
 * Excluir a série inteira: apaga a tarefa e as exceções dela, para não deixar
 * documentos órfãos ocupando espaço.
 */
export async function deleteTaskSeries(uid: string, taskId: string): Promise<void> {
  const orphans = await getDocs(query(overridesRef(uid), where('taskId', '==', taskId)));

  const batch = writeBatch(db);
  batch.delete(doc(tasksRef(uid), taskId));
  orphans.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
