import { formatCents } from '../../../shared/money';
import { ColumnLabel } from '../../../design/components/Card';
import { Meter } from '../../../design/components/charts/Meter';
import { CategoryBreakdown } from './CategoryBreakdown';
import { MonthTrend } from './MonthTrend';
import { goalConsumption, hasMonthOverride, resolveGoal } from '../lib/goals';
import type { MonthSummary as Summary } from '../lib/summary';
import type { BudgetGoal, MonthStats } from '../types';
import { formatMonthLong, type ISOMonth } from '../../../shared/dates';

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
    <div className="flex flex-col gap-3.5">
      {/* Cartão do saldo: gradiente e um brilho atrás do número. É a única
          superfície do app com tratamento — o resto é plano, então ela lidera
          sem precisar competir. */}
      <section
        className="relative overflow-hidden rounded-lg border p-5 pt-[22px]"
        style={{
          background: 'var(--surface-hero)',
          borderColor: 'var(--surface-hero-border)',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-28 h-56 w-56 rounded-pill"
          style={{ background: 'var(--surface-hero-glow)' }}
        />

        <div className="relative flex flex-col gap-1">
          <ColumnLabel>Saldo de {formatMonthLong(month).replace(' de ', ' · ')}</ColumnLabel>
          <p
            className={`figures font-display text-[42px] font-semibold leading-none tracking-[-0.035em] ${
              positive ? 'text-ink' : 'text-saida'
            }`}
          >
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
        </div>

        {!vazio && (
          <div className="relative mt-[18px]">
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
      </section>

      {/* Entrou e saiu ganham cartão próprio, cada um com o tom da sua
          semântica: a distinção deixa de depender só da cor do número. */}
      <dl className="flex gap-2.5">
        <div
          className="flex flex-1 flex-col gap-1 rounded-md border p-3.5"
          style={{ background: 'var(--surface-stat-in)', borderColor: 'var(--surface-stat-in-border)' }}
        >
          <dt>
            <ColumnLabel>Entrou</ColumnLabel>
          </dt>
          <dd className="figures text-lg font-medium text-entrada">{formatCents(incomeCents)}</dd>
        </div>
        <div
          className="flex flex-1 flex-col gap-1 rounded-md border p-3.5"
          style={{ background: 'var(--surface-stat-out)', borderColor: 'var(--surface-stat-out-border)' }}
        >
          <dt>
            <ColumnLabel>Saiu</ColumnLabel>
          </dt>
          <dd className="figures text-lg font-medium text-saida">{formatCents(expenseCents)}</dd>
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
    </div>
  );
}
