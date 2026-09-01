import type { BudgetGoal, GoalConsumption, GoalState } from '../types';
import type { ISOMonth } from '../../../shared/dates';

/**
 * Metas de orçamento — regra temporal e consumo, em funções puras.
 *
 * A regra que sustenta a feature: alterar o padrão **nunca** muda como um mês
 * passado foi avaliado. Cada mês encontra o valor que valia à época, porque a
 * meta é uma linha do tempo e não um número.
 */

/** A partir de onde o consumo passa a avisar. Fixo nesta versão. */
export const NEAR_THRESHOLD = 0.8;

/**
 * Meta vigente num mês.
 *
 * Devolve `null` para "sem meta", que é estado **diferente** de meta zero:
 * sem meta não há limite algum; meta zero é um limite de zero, e qualquer
 * gasto já o ultrapassa. Confundir os dois faria toda categoria sem meta
 * aparecer estourada.
 */
export function resolveGoal(goal: BudgetGoal | undefined, month: ISOMonth): number | null {
  if (!goal) return null;

  // A exceção do mês ganha do padrão — é o ajuste de mês atípico.
  const override = goal.overrides?.[month];
  if (typeof override === 'number') return override;

  // Sem exceção, vale a última versão que já estava em vigor naquele mês.
  let vigente: number | null = null;
  for (const version of goal.versions ?? []) {
    if (version.from <= month) vigente = version.amountCents;
  }
  return vigente;
}

/** O mês tem ajuste próprio? A interface precisa dizer que aquele valor é excepcional. */
export function hasMonthOverride(goal: BudgetGoal | undefined, month: ISOMonth): boolean {
  return typeof goal?.overrides?.[month] === 'number';
}

export function goalState(usedCents: number, goalCents: number): GoalState {
  // Meta zero é limite de zero: qualquer gasto passa, e nada gasto está dentro.
  // Tratado antes da divisão, que aqui seria por zero.
  if (goalCents === 0) return usedCents > 0 ? 'over' : 'within';

  const ratio = usedCents / goalCents;
  if (ratio > 1) return 'over';
  if (ratio >= NEAR_THRESHOLD) return 'near';
  return 'within';
}

interface ConsumptionInput {
  goalCents: number;
  /** Gastos efetivados do alvo no mês. */
  usedCents: number;
  /** Gastos previstos do alvo, ainda não confirmados. */
  plannedCents?: number;
  /** Entrada do mês — vira marca sobre a barra, só no teto geral. */
  incomeCents?: number | null;
}

/**
 * Consumo de uma meta no mês.
 *
 * O estado considera só o efetivado: o previsto ainda pode ser cancelado, e
 * declarar "você passou" por causa de algo que não aconteceu seria mentira.
 * Mas o previsto entra em `remainingCents`, porque "quanto ainda posso
 * gastar" precisa descontar o que já está comprometido.
 */
export function goalConsumption({
  goalCents,
  usedCents,
  plannedCents = 0,
  incomeCents = null,
}: ConsumptionInput): GoalConsumption {
  const ratio = goalCents === 0 ? (usedCents > 0 ? Infinity : 0) : usedCents / goalCents;

  return {
    goalCents,
    usedCents,
    plannedCents,
    remainingCents: goalCents - usedCents - plannedCents,
    ratio,
    // Marca fora da barra é resultado legítimo: significa meta acima da renda,
    // que é exatamente o que a pessoa precisa ver.
    incomeMark:
      incomeCents === null || goalCents === 0 ? null : incomeCents / goalCents,
    state: goalState(usedCents, goalCents),
  };
}

/**
 * Metas cuja soma o usuário precisa conferir contra o teto (FR-009).
 * Devolve a soma das metas de categoria vigentes no mês.
 */
export function sumCategoryGoals(
  goals: BudgetGoal[],
  month: ISOMonth,
  isActive: (categoryId: string) => boolean,
): number {
  return goals
    .filter((g) => g.target === 'category' && g.categoryId && isActive(g.categoryId))
    .reduce((sum, g) => sum + (resolveGoal(g, month) ?? 0), 0);
}
