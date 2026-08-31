import { addMonths, dateForDayOfMonth, type ISOMonth } from '../../../shared/dates';
import type { Recurrence, TransactionDraft } from '../types';

/**
 * Regras das recorrências financeiras — puras, sem Firestore.
 *
 * O id do lançamento é determinístico (`rec_{recorrência}_{mês}`): dois
 * aparelhos abrindo o mesmo mês ao mesmo tempo convergem para um único
 * documento, em vez de criarem duas cópias do aluguel.
 */

/** Quantos meses à frente são preparados sem a pessoa pedir. */
export const HORIZON_MONTHS = 3;

export function plannedTransactionId(recurrenceId: string, month: ISOMonth): string {
  return `rec_${recurrenceId}_${month}`;
}

/** Uma recorrência vale para o mês se já começou e ainda não foi encerrada. */
export function appliesTo(recurrence: Recurrence, month: ISOMonth): boolean {
  if (month < recurrence.startMonth) return false;
  if (recurrence.endMonth !== null && month > recurrence.endMonth) return false;
  return true;
}

/** O lançamento previsto que uma recorrência gera num mês. */
export function plannedDraft(recurrence: Recurrence, month: ISOMonth): TransactionDraft {
  return {
    type: recurrence.type,
    amountCents: recurrence.amountCents,
    description: recurrence.description,
    categoryId: recurrence.categoryId,
    date: dateForDayOfMonth(month, recurrence.dayOfMonth),
    month,
    status: 'planned',
    source: 'recurrence',
    recurrenceId: recurrence.id,
  };
}

export function horizonFrom(month: ISOMonth, count: number = HORIZON_MONTHS): ISOMonth[] {
  return Array.from({ length: count }, (_, i) => addMonths(month, i));
}

export interface PendingMaterialization {
  id: string;
  draft: TransactionDraft;
}

/**
 * O que falta criar num mês, dado o que já existe.
 * É aqui que mora a garantia de idempotência.
 */
export function pendingFor(
  recurrences: Recurrence[],
  month: ISOMonth,
  existingIds: Iterable<string>,
): PendingMaterialization[] {
  const existing = new Set(existingIds);

  return recurrences
    .filter((recurrence) => appliesTo(recurrence, month))
    .map((recurrence) => ({
      id: plannedTransactionId(recurrence.id, month),
      draft: plannedDraft(recurrence, month),
    }))
    .filter((candidate) => !existing.has(candidate.id));
}
