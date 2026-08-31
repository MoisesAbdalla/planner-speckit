import { addMonths, currentMonth, formatMonthLong, type ISOMonth } from '../../../shared/dates';

interface MonthNavigatorProps {
  month: ISOMonth;
  onChange: (month: ISOMonth) => void;
}

export function MonthNavigator({ month, onChange }: MonthNavigatorProps) {
  const label = formatMonthLong(month);
  const isCurrent = month === currentMonth();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="Mês anterior"
        className="rounded-sm px-2 py-1 text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        ‹
      </button>

      <h1 className="min-w-0 flex-1 text-xl capitalize sm:text-2xl">{label}</h1>

      {!isCurrent && (
        <button
          type="button"
          onClick={() => onChange(currentMonth())}
          className="rounded-sm px-2 py-1 text-xs font-medium text-acao transition-colors hover:bg-acao-wash"
        >
          Hoje
        </button>
      )}

      <button
        type="button"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="Próximo mês"
        className="rounded-sm px-2 py-1 text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        ›
      </button>
    </div>
  );
}
