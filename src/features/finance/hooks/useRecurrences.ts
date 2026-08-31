import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useLiveQuery } from '../../../shared/useLiveQuery';
import type { Recurrence } from '../types';

export function useRecurrences(uid: string) {
  const { data, loading } = useLiveQuery<Recurrence>(`recurrences:${uid}`, (emit, fail) =>
    onSnapshot(
      query(collection(db, 'users', uid, 'recurrences'), orderBy('dayOfMonth', 'asc')),
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
