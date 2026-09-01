import { useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import { OVERALL_GOAL_ID } from '../lib/goalWrites';
import type { BudgetGoal } from '../types';

/**
 * Metas do usuário, em tempo real.
 *
 * Lê a coleção inteira porque ela é pequena — uma entrada por categoria mais
 * o teto geral — e porque a meta vigente de um mês é resolvida em memória,
 * não por consulta.
 */
export function useBudgetGoals(uid: string) {
  const { data, loading } = useLiveQuery<BudgetGoal>(`budgetGoals:${uid}`, (emit, fail) =>
    onSnapshot(
      collection(db, 'users', uid, 'budgetGoals'),
      (snapshot) =>
        emit(
          snapshot.docs.map((d) => {
            const raw = d.data() as Partial<BudgetGoal>;
            return {
              id: d.id,
              target: raw.target ?? 'category',
              categoryId: raw.categoryId ?? null,
              versions: raw.versions ?? [],
              overrides: raw.overrides ?? {},
            } as BudgetGoal;
          }),
        ),
      fail,
    ),
  );

  return useMemo(() => {
    const byTarget = new Map(data.map((g) => [g.id, g]));
    return {
      goals: data,
      /** Teto do mês, se definido. */
      overall: byTarget.get(OVERALL_GOAL_ID),
      /** Meta de uma categoria, se definida. */
      forCategory: (categoryId: string) => byTarget.get(categoryId),
      hasAnyGoal: data.length > 0,
      loading,
    };
  }, [data, loading]);
}
