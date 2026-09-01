import { formatCents } from '../../../shared/money';
import { ColumnLabel } from '../../../design/components/Card';
import { Meter } from '../../../design/components/charts/Meter';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthTrend } from './MonthTrend';
import { goalConsumption, hasMonthOverride, resolveGoal } from '../lib/goals';
import type { MonthSummary as Summary } from '../lib/summary';
import type { BudgetGoal, MonthStats } from '../types';
import type { ISOMonth } from '../../../shared/dates';

interface MonthSummaryProps {
  summary: Summary;
  accumulatedCents: number;
  hasHistory: boolean;
  stats: Record<ISOMonth, MonthStats>;
  month: ISOMonth;
  /** Teto do mês, quando definido. Sem ele, nada muda na tela. */
  overallGoal?: BudgetGoal;
  /** Meta de uma categoria, quando definida. */
  goalFor?: (categoryId: string) => BudgetGoal | undefined;
}

/**
 * O resumo do mês, liderado pela leitura visual.
 *
 * A ordem responde às perguntas na sequência em que a pessoa as faz: como
 * fechei (saldo), quanto do que entrou já saiu (medidor), para onde foi
 * (categorias) e como isso se compara ao de sempre (meses anteriores).
 */
export function MonthSummary({
  summary,
  accumulatedCents,
  hasHistory,
  stats,
  month,
  overallGoal,
  goalFor,
}: MonthSummaryProps) {
  const { balanceCents, incomeCents, expenseCents, projectedBalanceCents } = summary;
  const positive = balanceCents >= 0;
  const hasPlanned = summary.plannedCount > 0;
  const vazio = incomeCents === 0 && expenseCents === 0 && !hasPlanned;

  // Sem teto, o resumo renderiza exatamente o que renderizava antes: nenhum
  // espaço vazio, nenhum convite (FR-020, SC-008).
  const tetoCents = resolveGoal(overallGoal, month);
  const consumo =
    tetoCents === null
      ? null
      : goalConsumption({
          goalCents: tetoCents,
          usedCents: expenseCents,
          plannedCents: summary.plannedExpenseCents,
          incomeCents,
        });
  const tetoAjustado = hasMonthOverride(overallGoal, month);

  return (
    <section className="rounded-md border border-rule bg-paper-raised shadow-raised">
      <div className="px-4 pt-4">
        <ColumnLabel>Saldo do mês</ColumnLabel>
        <p className={`figures mt-1 text-3xl font-medium ${positive ? 'text-ink' : 'text-saida'}`}>
          {formatCents(balanceCents)}
        </p>

        <p className="mt-1 text-xs text-ink-soft">
          {hasHistory && (
            <>
              Acumulado até aqui:{' '}
              <span className="figures text-ink-soft">{formatCents(accumulatedCents)}</span>
            </>
          )}
          {hasPlanned && (
            <>
              {hasHistory && ' · '}
              Com o previsto:{' '}
              <span className="figures text-ink-soft">{formatCents(projectedBalanceCents)}</span>
            </>
          )}
        </p>

        {!vazio && (
          <div className="mt-4">
            <Meter
              incomeCents={incomeCents}
              expenseCents={expenseCents}
              plannedExpenseCents={summary.plannedExpenseCents}
              goal={consumo}
            />
            {consumo && (
              <p className="mt-1 text-xs text-ink-faint">
                Meta de <span className="figures">{formatCents(consumo.goalCents)}</span>
                {tetoAjustado && ' · ajuste só deste mês'}
              </p>
            )}
          </div>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 border-t border-rule">
        <div className="border-r border-rule px-4 py-3">
          <dt>
            <ColumnLabel>Entrou</ColumnLabel>
          </dt>
          <dd className="figures mt-0.5 text-lg font-medium text-entrada">
            {formatCents(incomeCents)}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt>
            <ColumnLabel>Saiu</ColumnLabel>
          </dt>
          <dd className="figures mt-0.5 text-lg font-medium text-saida">
            {formatCents(expenseCents)}
          </dd>
        </div>
      </dl>

      <CategoryBreakdown
        slices={summary.byCategory}
        expenseCents={expenseCents}
        month={month}
        plannedByCategory={summary.plannedByCategory}
        goalFor={goalFor}
      />

      <MonthTrend stats={stats} month={month} />
    </section>
  );
}
