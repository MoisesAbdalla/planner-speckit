import type { User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';
import { db } from '../../../firebase';
import { DEFAULT_CATEGORIES } from '../../finance/types';

/**
 * Cria o perfil e semeia as categorias padrão no primeiro acesso.
 *
 * Idempotente de propósito: entrar em dois aparelhos ao mesmo tempo não pode
 * duplicar categorias. Se o perfil já existe, não faz nada.
 */
export async function bootstrapUser(user: User): Promise<void> {
  const profileRef = doc(db, 'users', user.uid);
  const existing = await getDoc(profileRef);
  if (existing.exists()) return;

  const batch = writeBatch(db);

  batch.set(profileRef, {
    displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Você',
    email: user.email ?? '',
    createdAt: serverTimestamp(),
  });

  const categories = collection(db, 'users', user.uid, 'categories');
  DEFAULT_CATEGORIES.forEach((seed, index) => {
    batch.set(doc(categories), {
      name: seed.name,
      kind: seed.kind,
      isDefault: true,
      archived: false,
      sortOrder: index,
    });
  });

  await batch.commit();
}
