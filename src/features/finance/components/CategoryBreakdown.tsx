import { BarRow } from '../../../design/components/charts/BarRow';
import { ColumnLabel } from '../../../design/components/Card';
import { foldCategories, OTHER_CATEGORY_ID } from '../lib/categoryBreakdown';
import { goalConsumption, hasMonthOverride, resolveGoal } from '../lib/goals';
import { formatCents } from '../../../shared/money';
import type { ISOMonth } from '../../../shared/dates';
import type { CategorySlice } from '../lib/summary';
import type { BudgetGoal } from '../types';

interface CategoryBreakdownProps {
  slices: CategorySlice[];
  expenseCents: number;
  month: ISOMonth;
  /** Previsto por categoria — a meta usa a mesma base do teto geral (FR-015). */
  plannedByCategory?: Record<string, number>;
  /** Metas por categoria. Vazio = a seção fica idêntica ao que era antes. */
  goalFor?: (categoryId: string) => BudgetGoal | undefined;
}

/**
 * Para onde o dinheiro foi, da maior fatia para a menor.
 *
 * Ordenado por valor para a categoria dominante aparecer primeiro e ser
 * identificável sem ler número algum (SC-004).
 *
 * Categorias com meta ganham a marca de limite e um rótulo de estado.
 * Categorias sem meta ficam **exatamente** como estavam — sem alerta e sem
 * aparência de pendência (FR-016).
 */
export function CategoryBreakdown({
  slices,
  expenseCents,
  month,
  plannedByCategory = {},
  goalFor,
}: CategoryBreakdownProps) {
  if (slices.length === 0 || expenseCents === 0) {
    return (
      <section
        className="rounded-md border px-4 py-4"
        style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-card-border)' }}
      >
        <ColumnLabel>Para onde foi</ColumnLabel>
        <p className="mt-1 text-sm text-ink-soft">Nenhum gasto efetivado ainda neste mês.</p>
      </section>
    );
  }

  const dobradas = foldCategories(slices);
  const maior = dobradas[0]?.cents ?? 1;

  return (
    <section
      className="rounded-md border px-4 py-4"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-card-border)' }}
    >
      {/* O "X lidera com Y%" saiu: com o percentual em corpo grande na frente
          de cada linha, a frase virava repetição do que já se lê de relance. */}
      <ColumnLabel>Para onde foi</ColumnLabel>

      <ul className="mt-3 flex flex-col">
        {dobradas.map((slice) => {
          // "Outros" agrega categorias diferentes — não tem meta própria.
          const agregada = slice.categoryId === OTHER_CATEGORY_ID;
          const goal = agregada ? undefined : goalFor?.(slice.categoryId);
          const metaCents = resolveGoal(goal, month);

          const consumo =
            metaCents === null
              ? null
              : goalConsumption({
                  goalCents: metaCents,
                  usedCents: slice.cents,
                  plannedCents: plannedByCategory[slice.categoryId] ?? 0,
                });

          // A barra é proporcional à maior da lista; a marca da meta precisa
          // cair na mesma escala para significar alguma coisa.
          const limitAt = consumo && maior > 0 ? consumo.goalCents / maior : null;

          const statusLabel = !consumo
            ? undefined
            : consumo.state === 'over'
              ? `passou em ${formatCents(slice.cents - consumo.goalCents)} · meta ${formatCents(consumo.goalCents)}`
              : consumo.state === 'near'
                ? `perto do limite · sobra ${formatCents(consumo.remainingCents)} de ${formatCents(consumo.goalCents)}`
                : undefined;

          return (
            <BarRow
              key={slice.categoryId}
              fill={slice.cents / maior}
              color={slice.color}
              label={
                slice.count > 1
                  ? `Outros (${slice.count} categorias)`
                  : hasMonthOverride(goal, month)
                    ? `${slice.name} · meta ajustada`
                    : slice.name
              }
              value={formatCents(slice.cents)}
              share={slice.share}
              limitAt={limitAt}
              limitLabel={consumo ? `Meta ${formatCents(consumo.goalCents)}` : ''}
              statusLabel={statusLabel}
              statusTone={consumo?.state === 'over' ? 'saida' : 'atencao'}
            />
          );
        })}
      </ul>
    </section>
  );
}
