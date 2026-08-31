import { collection, doc, increment, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { MonthStats, Transaction, TransactionDraft } from '../types';
import { statsDelta } from './summary';
import { monthOf, type ISOMonth } from '../../../shared/dates';

/**
 * Escritas de movimentação.
 *
 * Toda mudança em algo efetivado ajusta `monthStats` na mesma batch, sempre
 * com `increment()`. Ler-somar-gravar perderia uma confirmação quando dois
 * aparelhos gravam ao mesmo tempo — e perder um lançamento de dinheiro é o
 * pior erro que este app pode cometer.
 */

const txCollection = (uid: string) => collection(db, 'users', uid, 'transactions');
const txDoc = (uid: string, id: string) => doc(db, 'users', uid, 'transactions', id);
const statsDoc = (uid: string, month: ISOMonth) => doc(db, 'users', uid, 'monthStats', month);

function isZero(delta: MonthStats): boolean {
  return delta.incomeCents === 0 && delta.expenseCents === 0;
}

type Batch = ReturnType<typeof writeBatch>;

function applyStats(batch: Batch, uid: string, month: ISOMonth, delta: MonthStats): void {
  if (isZero(delta)) return;
  batch.set(
    statsDoc(uid, month),
    {
      incomeCents: increment(delta.incomeCents),
      expenseCents: increment(delta.expenseCents),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function createTransaction(uid: string, draft: TransactionDraft): Promise<string> {
  const ref = doc(txCollection(uid));
  const batch = writeBatch(db);

  batch.set(ref, {
    ...draft,
    month: monthOf(draft.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  applyStats(batch, uid, monthOf(draft.date), statsDelta(null, draft));

  await batch.commit();
  return ref.id;
}

export async function updateTransaction(
  uid: string,
  before: Transaction,
  changes: TransactionDraft,
): Promise<void> {
  const batch = writeBatch(db);
  const nextMonth = monthOf(changes.date);

  batch.update(txDoc(uid, before.id), {
    ...changes,
    month: nextMonth,
    updatedAt: serverTimestamp(),
  });

  if (before.month === nextMonth) {
    applyStats(batch, uid, nextMonth, statsDelta(before, changes));
  } else {
    // Mudou de mês: sai inteiro de um agregado e entra inteiro no outro.
    applyStats(batch, uid, before.month, statsDelta(before, null));
    applyStats(batch, uid, nextMonth, statsDelta(null, changes));
  }

  await batch.commit();
}

export async function deleteTransaction(uid: string, before: Transaction): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(txDoc(uid, before.id));
  applyStats(batch, uid, before.month, statsDelta(before, null));
  await batch.commit();
}

/**
 * Confirma um lançamento previsto (FR-010a). É a ação de um toque: muda o
 * estado e joga o valor no saldo real, nada mais.
 */
export async function confirmTransaction(uid: string, before: Transaction): Promise<void> {
  if (before.status === 'confirmed') return;

  const batch = writeBatch(db);
  batch.update(txDoc(uid, before.id), { status: 'confirmed', updatedAt: serverTimestamp() });
  applyStats(batch, uid, before.month, statsDelta(before, { ...before, status: 'confirmed' }));
  await batch.commit();
}

/** Desfaz a confirmação — confirmar por engano não pode ser irreversível. */
export async function unconfirmTransaction(uid: string, before: Transaction): Promise<void> {
  if (before.status === 'planned') return;

  const batch = writeBatch(db);
  batch.update(txDoc(uid, before.id), { status: 'planned', updatedAt: serverTimestamp() });
  applyStats(batch, uid, before.month, statsDelta(before, { ...before, status: 'planned' }));
  await batch.commit();
}

/** Usado pela materialização de recorrências, que grava com id determinístico. */
export async function createTransactionWithId(
  uid: string,
  id: string,
  draft: TransactionDraft,
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(txDoc(uid, id), {
    ...draft,
    month: monthOf(draft.date),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  applyStats(batch, uid, monthOf(draft.date), statsDelta(null, draft));
  await batch.commit();
}
