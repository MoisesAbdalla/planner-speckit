import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import type { Category } from '../types';

/**
 * Todas as categorias, inclusive arquivadas.
 *
 * As arquivadas continuam sendo lidas porque o histórico precisa do nome
 * delas — arquivar esconde da escolha, não apaga o passado (FR-006).
 */
export function useCategories(uid: string) {
  const { data, loading } = useLiveQuery<Category>(`categories:${uid}`, (emit, fail) =>
    onSnapshot(
      query(collection(db, 'users', uid, 'categories'), orderBy('sortOrder', 'asc')),
      (snapshot) =>
        emit(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category)),
      fail,
    ),
  );

  return {
    categories: data,
    active: data.filter((c) => !c.archived),
    loading,
  };
}
