import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type { BudgetGoal, GoalVersion } from '../types';
import type { ISOMonth } from '../../../shared/dates';

/**
 * Escritas das metas.
 *
 * A regra que governa tudo aqui: **definir um valor novo acrescenta uma
 * versão, nunca edita as anteriores.** É o que impede o app de reescrever
 * como um mês passado foi avaliado.
 */

export const OVERALL_GOAL_ID = 'overall';

const goalRef = (uid: string, target: string) => doc(db, 'users', uid, 'budgetGoals', target);

/** Alvo de uma meta: o teto do mês ou uma categoria. */
export function goalTargetId(categoryId?: string | null): string {
  return categoryId ?? OVERALL_GOAL_ID;
}

/**
 * Insere a versão preservando o histórico.
 * Definir de novo no mesmo mês substitui aquela versão — não empilha duas.
 */
export function withVersion(
  versions: GoalVersion[],
  from: ISOMonth,
  amountCents: number,
): GoalVersion[] {
  return [...versions.filter((v) => v.from !== from), { from, amountCents }].sort((a, b) =>
    a.from < b.from ? -1 : a.from > b.from ? 1 : 0,
  );
}

/**
 * Define o valor padrão, valendo a partir do mês informado.
 * Os meses anteriores continuam encontrando a versão que valia à época.
 */
export async function setDefaultGoal(
  uid: string,
  categoryId: string | null,
  fromMonth: ISOMonth,
  amountCents: number,
): Promise<void> {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error('Meta precisa ser um valor igual ou maior que zero.');
  }

  const target = goalTargetId(categoryId);
  const ref = goalRef(uid, target);
  const existing = await getDoc(ref);
  const current = existing.exists() ? (existing.data() as BudgetGoal) : null;

  await setDoc(
    ref,
    {
      target: categoryId ? 'category' : 'overall',
      categoryId: categoryId ?? null,
      versions: withVersion(current?.versions ?? [], fromMonth, amountCents),
      overrides: current?.overrides ?? {},
      createdAt: current ? (current.createdAt ?? serverTimestamp()) : serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Ajusta apenas um mês, sem tocar no padrão (FR-004). */
export async function setMonthOverride(
  uid: string,
  categoryId: string | null,
  month: ISOMonth,
  amountCents: number,
): Promise<void> {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new Error('Meta precisa ser um valor igual ou maior que zero.');
  }
  await updateDoc(goalRef(uid, goalTargetId(categoryId)), {
    [`overrides.${month}`]: amountCents,
    updatedAt: serverTimestamp(),
  });
}

/** Desfaz o ajuste, devolvendo o mês ao padrão (FR-005). */
export async function clearMonthOverride(
  uid: string,
  categoryId: string | null,
  month: ISOMonth,
): Promise<void> {
  await updateDoc(goalRef(uid, goalTargetId(categoryId)), {
    [`overrides.${month}`]: deleteField(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove a meta inteira (FR-006).
 * Apaga o documento: uma meta com histórico vazio seria estado inválido.
 */
export async function removeGoal(uid: string, categoryId: string | null): Promise<void> {
  await deleteDoc(goalRef(uid, goalTargetId(categoryId)));
}
