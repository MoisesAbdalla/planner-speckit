import { addMonths, type ISOMonth } from '../../../shared/dates';
import type { MonthStats } from '../types';

/**
 * Série dos últimos meses, para comparar o mês em foco com o passado recente.
 *
 * Deriva dos `monthStats` que o app já lê para o saldo acumulado — nenhuma
 * leitura nova. Só efetivado: misturar previsto de meses futuros com
 * realizado de meses passados tornaria a série incomparável consigo mesma.
 */

/** Horizonte da comparação: contexto imediato, não relatório. */
export const SERIES_LENGTH = 6;

export interface MonthPoint {
  month: ISOMonth;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** O mês em foco — é ele que recebe a ênfase visual. */
  isCurrent: boolean;
}

export function buildMonthSeries(
  stats: Record<ISOMonth, MonthStats>,
  upToMonth: ISOMonth,
  length: number = SERIES_LENGTH,
): MonthPoint[] {
  const points: MonthPoint[] = [];

  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const month = addMonths(upToMonth, -offset);
    // Mês sem registro entra com zeros: um buraco no eixo faria a série
    // parecer mais curta do que é.
    const entry = stats[month] ?? { incomeCents: 0, expenseCents: 0 };
    points.push({
      month,
      incomeCents: entry.incomeCents,
      expenseCents: entry.expenseCents,
      balanceCents: entry.incomeCents - entry.expenseCents,
      isCurrent: month === upToMonth,
    });
  }

  return points;
}

/**
 * Maior valor absoluto da série — a escala das colunas.
 * Zero quando não há movimento algum, o que sinaliza o estado vazio.
 */
export function seriesScale(points: MonthPoint[]): number {
  return points.reduce((max, point) => Math.max(max, Math.abs(point.balanceCents)), 0);
}

/** Há algo a mostrar? Série toda zerada não vira gráfico (FR-014). */
export function hasSeriesData(points: MonthPoint[]): boolean {
  return points.some((p) => p.incomeCents !== 0 || p.expenseCents !== 0);
}

/** Quantos meses da série têm registro — abaixo de 2 não há o que comparar. */
export function monthsWithData(points: MonthPoint[]): number {
  return points.filter((p) => p.incomeCents !== 0 || p.expenseCents !== 0).length;
}
