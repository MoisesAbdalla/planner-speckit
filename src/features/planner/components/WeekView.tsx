import { TaskItem } from './TaskItem';
import { PlannedFinanceItem } from './PlannedFinanceItem';
import { groupByDay } from '../lib/expandTasks';
import {
  eachDay,
  endOfWeek,
  formatDayShort,
  formatWeekdayShort,
  startOfWeek,
  todayISO,
  type ISODate,
} from '../../../shared/dates';
import type { Occurrence } from '../types';
import type { Transaction } from '../../finance/types';

interface WeekViewProps {
  anchor: ISODate;
  occurrences: Occurrence[];
  planned: Transaction[];
  onToggle: (occurrence: Occurrence) => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  onConfirmPlanned: (transaction: Transaction) => void;
  onPickDay: (date: ISODate) => void;
}

export function WeekView({
  anchor,
  occurrences,
  planned,
  onToggle,
  onEdit,
  onDelete,
  onConfirmPlanned,
  onPickDay,
}: WeekViewProps) {
  const today = todayISO();
  const days = eachDay(startOfWeek(anchor), endOfWeek(anchor));
  const byDay = groupByDay(occurrences);

  const plannedByDay = planned.reduce<Map<ISODate, Transaction[]>>((acc, tx) => {
    const list = acc.get(tx.date) ?? [];
    list.push(tx);
    acc.set(tx.date, list);
    return acc;
  }, new Map());

  return (
    <div className="flex flex-col gap-1">
      {days.map((day) => {
        const items = byDay.get(day) ?? [];
        const money = plannedByDay.get(day) ?? [];
        const isToday = day === today;

        return (
          <section
            key={day}
            className={`rounded-sm px-3 py-2 ${isToday ? 'bg-acao-wash' : ''}`}
          >
            <button
              type="button"
              onClick={() => onPickDay(day)}
              className="flex w-full items-baseline gap-2 text-left"
            >
              <span
                className={`figures text-sm font-medium ${isToday ? 'text-acao' : 'text-ink'}`}
              >
                {formatDayShort(day)}
              </span>
              <span className="text-micro uppercase tracking-[0.08em] text-ink-faint">
                {formatWeekdayShort(day)}
              </span>
              {items.length === 0 && money.length === 0 && (
                <span className="ml-auto text-xs text-ink-faint">livre</span>
              )}
            </button>

            {(items.length > 0 || money.length > 0) && (
              <ul className="mt-1 flex flex-col">
                {money.map((transaction) => (
                  <PlannedFinanceItem
                    key={transaction.id}
                    transaction={transaction}
                    onConfirm={onConfirmPlanned}
                  />
                ))}
                {items.map((occurrence) => (
                  <TaskItem
                    key={`${occurrence.taskId}-${occurrence.date}`}
                    occurrence={occurrence}
                    isOverdue={!occurrence.done && occurrence.date < today}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
