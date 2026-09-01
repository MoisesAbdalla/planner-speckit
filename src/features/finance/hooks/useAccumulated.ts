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

  // O mesmo mapa serve ao acumulado e à comparação entre meses — uma leitura só.
  const stats = useMemo(() => {
    const byMonth: Record<ISOMonth, MonthStats> = {};
    data.forEach(({ id, incomeCents, expenseCents }) => {
      byMonth[id] = { incomeCents, expenseCents };
    });
    return byMonth;
  }, [data]);

  const accumulatedCents = useMemo(
    () => accumulatedBalance(stats, upToMonth),
    [stats, upToMonth],
  );

  return { accumulatedCents, stats, hasHistory: data.length > 0, loading };
}
