import {
  addDays,
  addMonths,
  endOfWeek,
  formatDayLong,
  formatDayShort,
  formatMonthLong,
  startOfWeek,
  todayISO,
  type ISODate,
} from '../../../shared/dates';

export type PlannerView = 'dia' | 'semana' | 'mes';

interface PeriodNavigatorProps {
  view: PlannerView;
  anchor: ISODate;
  onChange: (anchor: ISODate) => void;
}

/** Rótulo do período visível, escrito como a pessoa falaria. */
export function periodLabel(view: PlannerView, anchor: ISODate): string {
  if (view === 'dia') return formatDayLong(anchor);
  if (view === 'semana') {
    return `${formatDayShort(startOfWeek(anchor))} – ${formatDayShort(endOfWeek(anchor))}`;
  }
  return formatMonthLong(anchor.slice(0, 7));
}

function shift(view: PlannerView, anchor: ISODate, direction: -1 | 1): ISODate {
  if (view === 'dia') return addDays(anchor, direction);
  if (view === 'semana') return addDays(anchor, direction * 7);
  const nextMonth = addMonths(anchor.slice(0, 7), direction);
  return `${nextMonth}-01`;
}

export function PeriodNavigator({ view, anchor, onChange }: PeriodNavigatorProps) {
  const today = todayISO();
  const showToday =
    view === 'dia'
      ? anchor !== today
      : view === 'semana'
        ? startOfWeek(anchor) !== startOfWeek(today)
        : anchor.slice(0, 7) !== today.slice(0, 7);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(shift(view, anchor, -1))}
        aria-label={`${view === 'dia' ? 'Dia' : view === 'semana' ? 'Semana' : 'Mês'} anterior`}
        className="rounded-sm px-2 py-1 text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        ‹
      </button>

      <h1 className="min-w-0 flex-1 truncate text-xl capitalize sm:text-2xl">
        {periodLabel(view, anchor)}
      </h1>

      {showToday && (
        <button
          type="button"
          onClick={() => onChange(today)}
          className="rounded-sm px-2 py-1 text-xs font-medium text-acao transition-colors hover:bg-acao-wash"
        >
          Hoje
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(shift(view, anchor, 1))}
        aria-label={`Próximo ${view === 'dia' ? 'dia' : view === 'semana' ? 'semana' : 'mês'}`}
        className="rounded-sm px-2 py-1 text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        ›
      </button>
    </div>
  );
}
