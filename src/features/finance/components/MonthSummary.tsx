import { formatCents } from '../../../shared/money';
import { ColumnLabel } from '../../../design/components/Card';
import type { MonthSummary as Summary } from '../lib/summary';

interface MonthSummaryProps {
  summary: Summary;
  accumulatedCents: number;
  hasHistory: boolean;
}

/**
 * O destaque é o resultado do próprio mês; o acumulado entra como número
 * secundário (FR-007/FR-007a). O previsto aparece só quando existe — sem
 * lançamento previsto, não há por que ocupar espaço com ele.
 */
export function MonthSummary({ summary, accumulatedCents, hasHistory }: MonthSummaryProps) {
  const { balanceCents, incomeCents, expenseCents, projectedBalanceCents, byCategory } = summary;
  const positive = balanceCents >= 0;
  const hasPlanned = summary.plannedCount > 0;

  return (
    <section className="rounded-md border border-rule bg-paper-raised shadow-raised">
      <div className="px-4 pt-4">
        <ColumnLabel>Saldo do mês</ColumnLabel>
        <p
          className={`figures mt-1 text-3xl font-medium ${positive ? 'text-ink' : 'text-saida'}`}
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

      {byCategory.length > 0 && (
        <div className="border-t border-rule px-4 py-4">
          <ColumnLabel>Para onde foi</ColumnLabel>

          {/* Barra proporcional: a forma do mês antes dos números. */}
          <div
            className="mt-2 flex h-2 w-full overflow-hidden rounded-pill bg-paper-sunken"
            role="img"
            aria-label="Proporção dos gastos por categoria"
          >
            {byCategory.map((slice) => (
              <span
                key={slice.categoryId}
                style={{ width: `${slice.share * 100}%`, backgroundColor: slice.color }}
              />
            ))}
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {byCategory.map((slice) => (
              <li key={slice.categoryId} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-pill"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="min-w-0 flex-1 truncate text-ink-soft">{slice.name}</span>
                <span className="figures text-xs text-ink-faint">
                  {Math.round(slice.share * 100)}%
                </span>
                <span className="figures w-24 text-right text-ink">{formatCents(slice.cents)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
