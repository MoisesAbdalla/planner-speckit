import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { createTransactionWithId } from './transactionWrites';
import { horizonFrom, pendingFor } from './recurrenceRules';
import type { ISOMonth } from '../../../shared/dates';
import type { Recurrence } from '../types';

/**
 * Materialização das recorrências no Firestore.
 *
 * A decisão de o que criar é pura (`recurrenceRules`); aqui só ficam as
 * leituras e escritas. Nada é sobrescrito: se o lançamento do mês já existe,
 * ele fica como está, inclusive quando a pessoa editou o valor daquele mês.
 */

async function existingIdsIn(uid: string, month: ISOMonth): Promise<string[]> {
  const snapshot = await getDocs(
    query(collection(db, 'users', uid, 'transactions'), where('month', '==', month)),
  );
  return snapshot.docs.map((d) => d.id);
}

/** Garante que um mês tenha todos os previstos das recorrências ativas. */
export async function materializeMonth(
  uid: string,
  recurrences: Recurrence[],
  month: ISOMonth,
): Promise<number> {
  if (recurrences.length === 0) return 0;

  const pending = pendingFor(recurrences, month, await existingIdsIn(uid, month));
  if (pending.length === 0) return 0;

  // Cada criação carrega seu próprio ajuste de agregado, e uma falha isolada
  // não derruba as demais.
  const results = await Promise.allSettled(
    pending.map((item) => createTransactionWithId(uid, item.id, item.draft)),
  );

  results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .forEach((r) => console.error('Falha ao materializar recorrência:', r.reason));

  return results.filter((r) => r.status === 'fulfilled').length;
}

/**
 * Prepara os meses que as recorrências realmente precisam.
 *
 * `horizonFrom` devolve só os meses em que alguma recorrência cai — a anual
 * alcança um ano à frente, mas contribui com um único mês. Quem não tem
 * recorrência anual consulta exatamente os mesmos meses de antes.
 */
export async function materializeHorizon(
  uid: string,
  recurrences: Recurrence[],
  fromMonth: ISOMonth,
): Promise<number> {
  let created = 0;
  for (const month of horizonFrom(recurrences, fromMonth)) {
    created += await materializeMonth(uid, recurrences, month);
  }
  return created;
}
