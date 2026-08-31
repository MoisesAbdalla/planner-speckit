import { TaskItem } from './TaskItem';
import { PlannedFinanceItem } from './PlannedFinanceItem';
import { formatDayShort, todayISO, type ISODate } from '../../../shared/dates';
import type { Occurrence } from '../types';
import type { Transaction } from '../../finance/types';

interface DayViewProps {
  date: ISODate;
  occurrences: Occurrence[];
  overdueItems: Occurrence[];
  planned: Transaction[];
  onToggle: (occurrence: Occurrence) => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  onConfirmPlanned: (transaction: Transaction) => void;
}

export function DayView({
  date,
  occurrences,
  overdueItems,
  planned,
  onToggle,
  onEdit,
  onDelete,
  onConfirmPlanned,
}: DayViewProps) {
  const today = todayISO();
  const empty = occurrences.length === 0 && planned.length === 0 && overdueItems.length === 0;

  if (empty) {
    return (
      <div className="rounded-md border border-dashed border-rule-strong px-4 py-10 text-center">
        <p className="text-base text-ink">Nada marcado para este dia.</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
          Adicione um item para organizar o que precisa acontecer.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {overdueItems.length > 0 && date === today && (
        <section>
          <h2 className="mb-1 text-micro uppercase tracking-[0.08em] text-atencao">
            Ficou para trás
          </h2>
          <ul className="flex flex-col">
            {overdueItems.map((occurrence) => (
              <TaskItem
                key={`${occurrence.taskId}-${occurrence.date}`}
                occurrence={{
                  ...occurrence,
                  title: `${occurrence.title} · ${formatDayShort(occurrence.date)}`,
                }}
                isOverdue
                onToggle={() => onToggle(occurrence)}
                onEdit={() => onEdit(occurrence)}
                onDelete={() => onDelete(occurrence)}
              />
            ))}
          </ul>
        </section>
      )}

      {planned.length > 0 && (
        <section>
          <h2 className="mb-1 text-micro uppercase tracking-[0.08em] text-ink-faint">
            Contas do dia
          </h2>
          <ul className="flex flex-col">
            {planned.map((transaction) => (
              <PlannedFinanceItem
                key={transaction.id}
                transaction={transaction}
                onConfirm={onConfirmPlanned}
              />
            ))}
          </ul>
        </section>
      )}

      {occurrences.length > 0 && (
        <section>
          {(planned.length > 0 || overdueItems.length > 0) && (
            <h2 className="mb-1 text-micro uppercase tracking-[0.08em] text-ink-faint">Rotina</h2>
          )}
          <ul className="flex flex-col">
            {occurrences.map((occurrence) => (
              <TaskItem
                key={`${occurrence.taskId}-${occurrence.date}`}
                occurrence={occurrence}
                isOverdue={false}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
