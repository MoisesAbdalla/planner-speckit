import { collection, doc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import type { MonthStats, Transaction } from '../types';
import type { ISOMonth } from '../../../shared/dates';
import { diffStats, groupStatsByMonth } from './monthStatsMath';

/**
 * Reconstrói os agregados mensais a partir das movimentações.
 *
 * É isto que sustenta a afirmação "monthStats é cache, não fonte de verdade"
 * (Princípio IV): qualquer divergência — bug, escrita interrompida, migração —
 * é recuperável recalculando a partir do que de fato foi registrado.
 */
export async function rebuildMonthStats(uid: string): Promise<Record<ISOMonth, MonthStats>> {
  const [txSnap, statsSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'transactions')),
    getDocs(collection(db, 'users', uid, 'monthStats')),
  ]);

  const transactions = txSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);

  const stored: Record<ISOMonth, MonthStats> = {};
  statsSnap.docs.forEach((d) => {
    const data = d.data() as MonthStats;
    stored[d.id] = { incomeCents: data.incomeCents ?? 0, expenseCents: data.expenseCents ?? 0 };
  });

  const changes = diffStats(stored, groupStatsByMonth(transactions));
  const months = Object.keys(changes);
  if (months.length === 0) return changes;

  // Uma batch do Firestore aceita até 500 operações.
  for (let i = 0; i < months.length; i += 400) {
    const batch = writeBatch(db);
    for (const month of months.slice(i, i + 400)) {
      batch.set(doc(db, 'users', uid, 'monthStats', month), {
        ...changes[month],
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }

  return changes;
}

export { groupStatsByMonth, diffStats };
