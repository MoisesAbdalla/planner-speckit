import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import type { Recurrence } from '../types';

/**
 * Recorrências do usuário, em tempo real.
 *
 * **Sem `orderBy` de propósito.** O Firestore exclui do resultado todo
 * documento que não tem o campo ordenado, e a recorrência semanal não tem
 * `dayOfMonth`: ordenar por ele a faria sumir da lista, das ativas e da
 * geração — gravada com sucesso e invisível para o app, sem erro nenhum.
 *
 * A coleção tem no máximo uma dezena de documentos, então ordenar no servidor
 * não compra nada. A ordenação acontece em memória, e por isso pode usar o
 * critério que interessa de verdade.
 */
export function useRecurrences(uid: string) {
  const { data, loading } = useLiveQuery<Recurrence>(`recurrences:${uid}`, (emit, fail) =>
    onSnapshot(
      collection(db, 'users', uid, 'recurrences'),
      (snapshot) =>
        emit(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Recurrence)),
      fail,
    ),
  );

  return {
    recurrences: data,
    active: data.filter((r) => r.endMonth === null),
    loading,
  };
}
