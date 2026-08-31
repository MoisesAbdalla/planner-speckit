import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useUid } from '../features/auth/AuthContext';
import { Button } from '../design/components/Button';
import { ConfirmDialog } from '../design/components/ConfirmDialog';
import { PeriodNavigator, type PlannerView } from '../features/planner/components/PeriodNavigator';
import { DayView } from '../features/planner/components/DayView';
import { WeekView } from '../features/planner/components/WeekView';
import { MonthView } from '../features/planner/components/MonthView';
import { TaskForm } from '../features/planner/components/TaskForm';
import { ScopeDialog, type Scope } from '../features/planner/components/ScopeDialog';
import { useTasks, useTaskOverrides } from '../features/planner/hooks/useTasks';
import { usePlannedTransactions } from '../features/finance/hooks/useTransactions';
import { expandTasks, overdue } from '../features/planner/lib/expandTasks';
import {
  createTask,
  deleteOccurrence,
  deleteTaskSeries,
  setOccurrenceDone,
  updateTask,
} from '../features/planner/lib/taskWrites';
import { confirmTransaction } from '../features/finance/lib/transactionWrites';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  formatDayShort,
  startOfMonth,
  startOfWeek,
  todayISO,
  type ISODate,
} from '../shared/dates';
import type { Occurrence, Task, TaskDraft } from '../features/planner/types';

const VIEWS: { value: PlannerView; label: string }[] = [
  { value: 'dia', label: 'Dia' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

/** Intervalo carregado por visão — a expansão da série acontece em cima dele. */
function rangeFor(view: PlannerView, anchor: ISODate): [ISODate, ISODate] {
  if (view === 'dia') return [anchor, anchor];
  if (view === 'semana') return [startOfWeek(anchor), endOfWeek(anchor)];
  const month = anchor.slice(0, 7);
  return [startOfWeek(startOfMonth(month)), endOfWeek(endOfMonth(month))];
}

export function PlannerPage() {
  const uid = useUid();
  const navigate = useNavigate();
  const params = useParams<{ view: string }>();
  const view = (VIEWS.find((v) => v.value === params.view)?.value ?? 'dia') as PlannerView;

  const [anchor, setAnchor] = useState<ISODate>(todayISO());
  const [from, to] = rangeFor(view, anchor);

  // Na visão do dia, a busca começa antes para encontrar o que ficou atrasado.
  const lookbackFrom = view === 'dia' ? addDays(from, -30) : from;

  const { tasks, loading } = useTasks(uid);
  const overrides = useTaskOverrides(uid, lookbackFrom, to);
  const { planned } = usePlannedTransactions(uid, from, to);

  const occurrences = useMemo(
    () => expandTasks(tasks, overrides, from, to),
    [tasks, overrides, from, to],
  );

  const overdueItems = useMemo(() => {
    if (view !== 'dia' || anchor !== todayISO()) return [];
    return overdue(expandTasks(tasks, overrides, lookbackFrom, addDays(anchor, -1)), anchor);
  }, [view, anchor, tasks, overrides, lookbackFrom]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [scope, setScope] = useState<{
    action: 'edit' | 'delete';
    occurrence: Occurrence;
  } | null>(null);
  const [deletingSingle, setDeletingSingle] = useState<Occurrence | null>(null);

  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const handleSave = async (draft: TaskDraft, target: Task | null) => {
    if (target) await updateTask(uid, target.id, draft);
    else await createTask(uid, draft);
  };

  const toggle = (occurrence: Occurrence) => {
    setOccurrenceDone(uid, occurrence.taskId, occurrence.date, !occurrence.done).catch(
      console.error,
    );
  };

  const requestEdit = (occurrence: Occurrence) => {
    if (occurrence.recurring) {
      setScope({ action: 'edit', occurrence });
      return;
    }
    setEditingTask(taskById.get(occurrence.taskId) ?? null);
    setFormOpen(true);
  };

  const requestDelete = (occurrence: Occurrence) => {
    if (occurrence.recurring) {
      setScope({ action: 'delete', occurrence });
      return;
    }
    setDeletingSingle(occurrence);
  };

  const applyScope = async (chosen: Scope) => {
    if (!scope) return;
    const { action, occurrence } = scope;
    setScope(null);

    if (action === 'delete') {
      if (chosen === 'occurrence') {
        await deleteOccurrence(uid, occurrence.taskId, occurrence.date).catch(console.error);
      } else {
        await deleteTaskSeries(uid, occurrence.taskId).catch(console.error);
      }
      return;
    }

    if (chosen === 'series') {
      setEditingTask(taskById.get(occurrence.taskId) ?? null);
      setFormOpen(true);
    } else {
      // Editar só um dia: abre o formulário como item avulso naquela data.
      setEditingTask(null);
      setFormOpen(true);
    }
  };

  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-3xl">
      <header className="flex flex-col gap-3">
        <PeriodNavigator view={view} anchor={anchor} onChange={setAnchor} />

        <div className="flex items-center gap-2">
          <div className="flex flex-1 gap-1 rounded-sm bg-paper-sunken p-1">
            {VIEWS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => navigate(`/planner/${option.value}`)}
                aria-current={view === option.value ? 'page' : undefined}
                className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === option.value
                    ? 'bg-paper-raised text-ink shadow-raised'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
          >
            Novo item
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col gap-3 py-6" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-sm bg-paper-sunken" />
          ))}
        </div>
      ) : view === 'dia' ? (
        <DayView
          date={anchor}
          occurrences={occurrences}
          overdueItems={overdueItems}
          planned={planned}
          onToggle={toggle}
          onEdit={requestEdit}
          onDelete={requestDelete}
          onConfirmPlanned={(tx) => confirmTransaction(uid, tx).catch(console.error)}
        />
      ) : view === 'semana' ? (
        <WeekView
          anchor={anchor}
          occurrences={occurrences}
          planned={planned}
          onToggle={toggle}
          onEdit={requestEdit}
          onDelete={requestDelete}
          onConfirmPlanned={(tx) => confirmTransaction(uid, tx).catch(console.error)}
          onPickDay={(day) => {
            setAnchor(day);
            navigate('/planner/dia');
          }}
        />
      ) : (
        <MonthView
          anchor={anchor}
          occurrences={occurrences}
          planned={planned}
          onToggle={toggle}
          onPickDay={(day) => {
            setAnchor(day);
            navigate('/planner/dia');
          }}
        />
      )}

      <TaskForm
        open={formOpen}
        editing={editingTask}
        defaultDate={anchor}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ScopeDialog
        open={scope !== null}
        action={scope?.action ?? 'edit'}
        title={scope?.occurrence.title ?? ''}
        date={scope ? formatDayShort(scope.occurrence.date) : ''}
        onChoose={applyScope}
        onCancel={() => setScope(null)}
      />

      <ConfirmDialog
        open={deletingSingle !== null}
        title="Excluir item"
        message={deletingSingle ? `"${deletingSingle.title}" sai da sua rotina.` : ''}
        onConfirm={() => {
          if (deletingSingle) deleteTaskSeries(uid, deletingSingle.taskId).catch(console.error);
          setDeletingSingle(null);
        }}
        onCancel={() => setDeletingSingle(null)}
      />
    </div>
  );
}
