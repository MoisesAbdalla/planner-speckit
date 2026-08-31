import { useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import { accumulatedBalance } from '../lib/summary';
import type { MonthStats } from '../types';
import type { ISOMonth } from '../../../shared/dates';

interface MonthStatsDoc extends MonthStats {
  id: ISOMonth;
}

/**
 * Saldo acumulado até o mês visualizado (FR-007a).
 *
 * Lê os agregados mensais (um documento por mês) em vez do histórico inteiro
 * de movimentações. Esses agregados são cache: `rebuildMonthStats` os
 * recalcula a partir das movimentações sempre que preciso.
 */
export function useAccumulated(uid: string, upToMonth: ISOMonth) {
  const { data, loading } = useLiveQuery<MonthStatsDoc>(`monthStats:${uid}`, (emit, fail) =>
    onSnapshot(
      collection(db, 'users', uid, 'monthStats'),
      (snapshot) =>
        emit(
          snapshot.docs.map((d) => {
            const stats = d.data() as MonthStats;
            return {
              id: d.id,
              incomeCents: stats.incomeCents ?? 0,
              expenseCents: stats.expenseCents ?? 0,
            };
          }),
        ),
      fail,
    ),
  );

  const accumulatedCents = useMemo(() => {
    const byMonth: Record<ISOMonth, MonthStats> = {};
    data.forEach(({ id, incomeCents, expenseCents }) => {
      byMonth[id] = { incomeCents, expenseCents };
    });
    return accumulatedBalance(byMonth, upToMonth);
  }, [data, upToMonth]);

  return { accumulatedCents, hasHistory: data.length > 0, loading };
}
