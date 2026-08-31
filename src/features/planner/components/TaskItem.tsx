import type { Occurrence } from '../types';

interface TaskItemProps {
  occurrence: Occurrence;
  isOverdue: boolean;
  onToggle: (occurrence: Occurrence) => void;
  onEdit: (occurrence: Occurrence) => void;
  onDelete: (occurrence: Occurrence) => void;
  compact?: boolean;
}

export function TaskItem({
  occurrence,
  isOverdue,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
}: TaskItemProps) {
  const { done, title, time, notes } = occurrence;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onToggle(occurrence)}
        className={`flex w-full items-center gap-1 truncate rounded-sm px-1 py-0.5 text-left text-xs transition-colors hover:bg-paper-sunken ${
          done ? 'text-ink-faint line-through' : isOverdue ? 'text-atencao' : 'text-ink-soft'
        }`}
      >
        {time && <span className="figures shrink-0 text-ink-faint">{time}</span>}
        <span className="truncate">{title}</span>
      </button>
    );
  }

  return (
    <li className="group flex items-start gap-3 py-3 ledger-rule">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        onClick={() => onToggle(occurrence)}
        aria-label={done ? `Desmarcar ${title}` : `Concluir ${title}`}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
          done
            ? 'border-entrada bg-entrada text-paper'
            : isOverdue
              ? 'border-atencao hover:bg-atencao-wash'
              : 'border-rule-strong hover:border-acao'
        }`}
      >
        {done && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden="true">
            <path
              d="M2 6.5L4.5 9L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <button type="button" onClick={() => onEdit(occurrence)} className="min-w-0 flex-1 text-left">
        <span
          className={`block text-sm ${done ? 'text-ink-faint line-through' : 'text-ink'}`}
        >
          {title}
        </span>
        <span className="flex items-center gap-2 text-xs">
          {time && <span className="figures text-ink-soft">{time}</span>}
          {isOverdue && !done && <span className="font-medium text-atencao">atrasado</span>}
          {notes && <span className="truncate text-ink-faint">{notes}</span>}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onDelete(occurrence)}
        aria-label={`Excluir ${title}`}
        className="shrink-0 rounded-sm px-1.5 py-1 text-ink-faint opacity-0 transition-opacity hover:bg-saida-wash hover:text-saida focus-visible:opacity-100 group-hover:opacity-100"
      >
        ✕
      </button>
    </li>
  );
}
