/**
 * Datas de calendário são strings `YYYY-MM-DD` e meses são `YYYY-MM`.
 *
 * Nada de Timestamp ou UTC para datas de negócio: um gasto do "dia 5" precisa
 * ser dia 5 em qualquer aparelho, em qualquer fuso (research R6). Quando um
 * `Date` é necessário para formatar, ele é construído no fuso local.
 */

export type ISODate = string; // YYYY-MM-DD
export type ISOMonth = string; // YYYY-MM

/** ISO 8601: 1 = segunda … 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Constrói um Date local — `new Date('2026-08-29')` seria UTC e pode voltar um dia. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function monthOf(iso: ISODate): ISOMonth {
  return iso.slice(0, 7);
}

export function currentMonth(now: Date = new Date()): ISOMonth {
  return monthOf(todayISO(now));
}

export function daysInMonth(month: ISOMonth): number {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return new Date(y, m, 0).getDate();
}

/** Dia 31 em fevereiro vira o último dia do mês (regra da spec para recorrências). */
export function clampDayToMonth(month: ISOMonth, dayOfMonth: number): number {
  const last = daysInMonth(month);
  if (dayOfMonth < 1) return 1;
  return Math.min(dayOfMonth, last);
}

/** Data de uma recorrência num mês, já com o clamp aplicado. */
export function dateForDayOfMonth(month: ISOMonth, dayOfMonth: number): ISODate {
  return `${month}-${pad(clampDayToMonth(month, dayOfMonth))}`;
}

export function addMonths(month: ISOMonth, delta: number): ISOMonth {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

export function addDays(iso: ISODate, delta: number): ISODate {
  const date = fromISODate(iso);
  date.setDate(date.getDate() + delta);
  return toISODate(date);
}

export function weekdayOf(iso: ISODate): Weekday {
  const jsDay = fromISODate(iso).getDay(); // 0 = domingo
  return (jsDay === 0 ? 7 : jsDay) as Weekday;
}

/** Semana começa no domingo — é como os calendários brasileiros são lidos. */
export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -(fromISODate(iso).getDay()));
}

export function endOfWeek(iso: ISODate): ISODate {
  return addDays(startOfWeek(iso), 6);
}

export function startOfMonth(month: ISOMonth): ISODate {
  return `${month}-01`;
}

export function endOfMonth(month: ISOMonth): ISODate {
  return `${month}-${pad(daysInMonth(month))}`;
}

/** Todos os dias de um intervalo, inclusive nas duas pontas. */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const days: ISODate[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function isBefore(a: ISODate, b: ISODate): boolean {
  return a < b;
}

export function isWithin(iso: ISODate, from: ISODate, to: ISODate): boolean {
  return iso >= from && iso <= to;
}

// — Exibição —————————————————————————————————————

const monthLong = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayLong = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const dayShort = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
const weekdayShort = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

/** "agosto de 2026" */
export function formatMonthLong(month: ISOMonth): string {
  return monthLong.format(fromISODate(startOfMonth(month)));
}

/** "sábado, 29 de agosto" */
export function formatDayLong(iso: ISODate): string {
  return dayLong.format(fromISODate(iso));
}

/** "29/08" */
export function formatDayShort(iso: ISODate): string {
  return dayShort.format(fromISODate(iso));
}

/** "sáb" */
export function formatWeekdayShort(iso: ISODate): string {
  return weekdayShort.format(fromISODate(iso)).replace('.', '');
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'seg',
  2: 'ter',
  3: 'qua',
  4: 'qui',
  5: 'sex',
  6: 'sáb',
  7: 'dom',
};
