import { MonthColumns } from '../../../design/components/charts/MonthColumns';
import { ColumnLabel } from '../../../design/components/Card';
import { buildMonthSeries, monthsWithData, seriesScale } from '../lib/monthSeries';
import { formatCents } from '../../../shared/money';
import { formatMonthLong, type ISOMonth } from '../../../shared/dates';
import type { MonthStats } from '../types';

interface MonthTrendProps {
  stats: Record<ISOMonth, MonthStats>;
  month: ISOMonth;
}

/** Rótulo curto do mês: "ago", "set" — cabe embaixo da coluna em 375px. */
const shortMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

function label(month: ISOMonth): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return shortMonth.format(new Date(y, m - 1, 1)).replace('.', '');
}

/**
 * Como este mês se compara aos anteriores.
 *
 * Aparece só quando há pelo menos dois meses com registro — comparar um mês
 * com nada não é comparação, é decoração (FR-014).
 */
export function MonthTrend({ stats, month }: MonthTrendProps) {
  const série = buildMonthSeries(stats, month);

  if (monthsWithData(série) < 2) return null;

  const escala = seriesScale(série);
  const atual = série.at(-1)!;
  const anteriores = série.filter((p) => !p.isCurrent && (p.incomeCents || p.expenseCents));
  const média = anteriores.length
    ? Math.round(anteriores.reduce((s, p) => s + p.balanceCents, 0) / anteriores.length)
    : 0;
  const diferença = atual.balanceCents - média;

  const resumo = série
    .map((p) => `${formatMonthLong(p.month)}: ${formatCents(p.balanceCents)}`)
    .join('; ');

  return (
    <div className="border-t border-rule px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <ColumnLabel>Comparado aos meses anteriores</ColumnLabel>
        {anteriores.length > 0 && (
          <span className="text-xs text-ink-faint">
            {diferença === 0
              ? 'na média'
              : diferença > 0
                ? `${formatCents(diferença)} acima da média`
                : `${formatCents(Math.abs(diferença))} abaixo da média`}
          </span>
        )}
      </div>

      <div className="mt-3">
        <MonthColumns
          columns={série.map((p) => ({
            key: p.month,
            label: label(p.month),
            value: p.balanceCents,
            emphasized: p.isCurrent,
          }))}
          scale={escala}
          summary={`Saldo dos últimos meses. ${resumo}.`}
          formatValue={formatCents}
        />
      </div>
    </div>
  );
}
