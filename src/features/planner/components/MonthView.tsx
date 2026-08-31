import { TaskItem } from './TaskItem';
import { PlannedFinanceItem } from './PlannedFinanceItem';
import { groupByDay } from '../lib/expandTasks';
import {
  eachDay,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayISO,
  WEEKDAY_LABELS,
  type ISODate,
} from '../../../shared/dates';
import type { Occurrence } from '../types';
import type { Transaction } from '../../finance/types';

interface MonthViewProps {
  anchor: ISODate;
  occurrences: Occurrence[];
  planned: Transaction[];
  onPickDay: (date: ISODate) => void;
  onToggle: (occurrence: Occurrence) => void;
}

/** Cabeçalho da grade: domingo a sábado, como o calendário de parede. */
const HEADER = [7, 1, 2, 3, 4, 5, 6] as const;

export function MonthView({ anchor, occurrences, planned, onPickDay, onToggle }: MonthViewProps) {
  const today = todayISO();
  const month = anchor.slice(0, 7);
  const grid = eachDay(startOfWeek(startOfMonth(month)), endOfWeek(endOfMonth(month)));
  const byDay = groupByDay(occurrences);

  const plannedByDay = planned.reduce<Map<ISODate, Transaction[]>>((acc, tx) => {
    const list = acc.get(tx.date) ?? [];
    list.push(tx);
    acc.set(tx.date, list);
    return acc;
  }, new Map());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[20rem]">
        <div className="grid grid-cols-7 border-b border-rule pb-1">
          {HEADER.map((weekday) => (
            <span
              key={weekday}
              className="text-center text-micro uppercase tracking-[0.08em] text-ink-faint"
            >
              {WEEKDAY_LABELS[weekday]}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const items = byDay.get(day) ?? [];
            const money = plannedByDay.get(day) ?? [];
            const inMonth = day.slice(0, 7) === month;
            const isToday = day === today;

            return (
              <div
                key={day}
                className={`min-h-20 border-b border-r border-rule p-1 ${
                  inMonth ? '' : 'bg-paper-sunken/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onPickDay(day)}
                  className={`figures mb-0.5 flex h-6 w-6 items-center justify-center rounded-pill text-xs transition-colors ${
                    isToday
                      ? 'bg-acao font-medium text-paper'
                      : inMonth
                        ? 'text-ink hover:bg-paper-sunken'
                        : 'text-ink-faint'
                  }`}
                  aria-label={`Ver ${day}`}
                >
                  {Number(day.slice(8, 10))}
                </button>

                <div className="flex flex-col gap-0.5">
                  {money.slice(0, 1).map((transaction) => (
                    <PlannedFinanceItem
                      key={transaction.id}
                      transaction={transaction}
                      onConfirm={() => onPickDay(day)}
                      compact
                    />
                  ))}
                  {items.slice(0, 2).map((occurrence) => (
                    <TaskItem
                      key={`${occurrence.taskId}-${occurrence.date}`}
                      occurrence={occurrence}
                      isOverdue={!occurrence.done && occurrence.date < today}
                      onToggle={onToggle}
                      onEdit={() => onPickDay(day)}
                      onDelete={() => onPickDay(day)}
                      compact
                    />
                  ))}
                  {items.length + money.length > 3 && (
                    <button
                      type="button"
                      onClick={() => onPickDay(day)}
                      className="px-1 text-left text-xs text-ink-faint hover:text-ink"
                    >
                      +{items.length + money.length - 3}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
