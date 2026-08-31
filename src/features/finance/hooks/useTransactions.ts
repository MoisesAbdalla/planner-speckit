import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import type { Transaction } from '../types';
import type { ISODate, ISOMonth } from '../../../shared/dates';

const toTransactions = (docs: { id: string; data: () => unknown }[]) =>
  docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as Transaction);

/**
 * Movimentações de um mês, em tempo real.
 *
 * `onSnapshot` já resolve a sincronização entre aparelhos (FR-019) e devolve
 * a escrita local antes de o servidor confirmar, o que faz o resumo parecer
 * instantâneo (SC-002). Não há cache paralelo aqui de propósito.
 */
export function useTransactions(uid: string, month: ISOMonth) {
  const { data, loading, error } = useLiveQuery<Transaction>(
    `transactions:${uid}:${month}`,
    (emit, fail) =>
      onSnapshot(
        query(
          collection(db, 'users', uid, 'transactions'),
          where('month', '==', month),
          orderBy('date', 'asc'),
          orderBy('createdAt', 'asc'),
        ),
        (snapshot) => emit(toTransactions(snapshot.docs)),
        fail,
      ),
    'Não foi possível carregar as movimentações deste mês.',
  );

  return { transactions: data, loading, error };
}

/** Lançamentos previstos de um intervalo — é o que o planner mostra (FR-018a). */
export function usePlannedTransactions(uid: string, from: ISODate, to: ISODate) {
  const { data, loading } = useLiveQuery<Transaction>(
    `planned:${uid}:${from}:${to}`,
    (emit, fail) =>
      onSnapshot(
        query(
          collection(db, 'users', uid, 'transactions'),
          where('status', '==', 'planned'),
          where('date', '>=', from),
          where('date', '<=', to),
          orderBy('date', 'asc'),
        ),
        (snapshot) => emit(toTransactions(snapshot.docs)),
        fail,
      ),
  );

  return { planned: data, loading };
}
