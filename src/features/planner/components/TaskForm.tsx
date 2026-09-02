import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { todayISO, WEEKDAY_LABELS, type Weekday } from '../../../shared/dates';
import type { Recur, Task, TaskDraft } from '../types';
import type { ParsedTask } from '../../finance/assistantTypes';

type Repeat = 'none' | 'daily' | 'weekly' | 'monthly';

interface TaskFormProps {
  open: boolean;
  editing?: Task | null;
  defaultDate?: string;
  /** O que o assistente entendeu da frase. Ausente = caminho manual. */
  prefill?: ParsedTask | null;
  onClose: () => void;
  onSave: (draft: TaskDraft, editing: Task | null) => Promise<void>;
}

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/**
 * O que o assistente entendeu da frase — e o que é apenas o padrão.
 *
 * Sem esta linha, a data de hoje apareceria como se tivesse sido entendida da
 * frase, e `dateFromPhrase` seria um campo criado e lido por ninguém (FR-016).
 * Quando nada foi entendido, é ela também que avisa, em vez de abrir um
 * formulário vazio como se tivesse funcionado.
 */
function LeituraDaFrase({ parsed }: { parsed: ParsedTask }) {
  if (!parsed.understood) {
    return (
      <p className="rounded-sm bg-paper-sunken px-3 py-2 text-xs text-ink-soft">
        Não entendi essa frase. Dê um nome ao item e confira a data.
      </p>
    );
  }

  const entendidos = [
    parsed.title && 'o nome',
    parsed.dateFromPhrase && 'a data',
    parsed.time !== null && 'a hora',
  ].filter(Boolean) as string[];

  return (
    <p className="rounded-sm bg-paper-sunken px-3 py-2 text-xs text-ink-soft">
      <span className="text-ink">
        Entendi {entendidos.length > 1
          ? `${entendidos.slice(0, -1).join(', ')} e ${entendidos[entendidos.length - 1]}`
          : (entendidos[0] ?? 'pouca coisa')}
        .
      </span>
      {!parsed.dateFromPhrase && ' A data é hoje, por padrão — confira.'}
    </p>
  );
}

function Body({ editing, defaultDate, prefill, onClose, onSave }: TaskFormProps) {
  const [title, setTitle] = useState(editing?.title ?? prefill?.title ?? '');
  const [date, setDate] = useState(
    editing?.date ?? editing?.startDate ?? prefill?.date ?? defaultDate ?? todayISO(),
  );
  const [time, setTime] = useState(editing?.time ?? prefill?.time ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [repeat, setRepeat] = useState<Repeat>(editing?.recurrence?.freq ?? 'none');
  const [weekdays, setWeekdays] = useState<Weekday[]>(
    editing?.recurrence?.freq === 'weekly' ? editing.recurrence.weekdays : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleWeekday = (day: Weekday) => {
    setWeekdays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    );
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('Dê um nome ao item.');
      return;
    }
    if (repeat === 'weekly' && weekdays.length === 0) {
      setSaveError('Escolha pelo menos um dia da semana.');
      return;
    }

    let recurrence: Recur | null = null;
    if (repeat === 'daily') recurrence = { freq: 'daily' };
    if (repeat === 'weekly') recurrence = { freq: 'weekly', weekdays };
    if (repeat === 'monthly') recurrence = { freq: 'monthly', dayOfMonth: Number(date.slice(8, 10)) };

    const draft: TaskDraft = {
      title: title.trim(),
      notes: notes.trim() || null,
      time: time || null,
      recurrence,
      date: recurrence ? null : date,
      startDate: date,
      endDate: null,
    };

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft, editing ?? null);
      onClose();
    } catch (cause) {
      console.error(cause);
      setSaveError('Não foi possível salvar. O que você digitou continua aqui.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={editing ? 'Editar item' : 'Novo item na rotina'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        {prefill && <LeituraDaFrase parsed={prefill} />}

        <Input
          label="O que você vai fazer"
          placeholder="Academia, estudar inglês, pagar aluguel…"
          autoFocus
          maxLength={120}
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={repeat === 'none' ? 'Data' : 'Começa em'}
            type="date"
            figures
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Horário"
            type="time"
            figures
            value={time}
            onChange={(e) => setTime(e.target.value)}
            hint="Opcional"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">Repetir</legend>
          <div className="grid grid-cols-4 gap-1 rounded-sm bg-paper-sunken p-1">
            {(
              [
                { value: 'none', label: 'Não' },
                { value: 'daily', label: 'Todo dia' },
                { value: 'weekly', label: 'Semana' },
                { value: 'monthly', label: 'Mês' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={repeat === option.value}
                onClick={() => setRepeat(option.value)}
                className={`rounded-sm px-2 py-2 text-xs font-medium transition-colors ${
                  repeat === option.value
                    ? 'bg-paper-raised text-ink shadow-raised'
                    : 'text-ink-soft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {repeat === 'weekly' && (
            <div className="mt-1 flex gap-1">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  role="checkbox"
                  aria-checked={weekdays.includes(day)}
                  onClick={() => toggleWeekday(day)}
                  className={`h-9 flex-1 rounded-sm border text-xs font-medium transition-colors ${
                    weekdays.includes(day)
                      ? 'border-acao bg-acao-wash text-acao'
                      : 'border-rule-strong text-ink-soft hover:bg-paper-sunken'
                  }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              ))}
            </div>
          )}

          {repeat === 'monthly' && (
            <p className="text-xs text-ink-soft">
              Repete todo dia {Number(date.slice(8, 10))}. Em meses mais curtos, cai no último dia.
            </p>
          )}
        </fieldset>

        <Input
          label="Anotação"
          placeholder="Opcional"
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {saveError && (
          <p role="alert" className="text-sm text-saida">
            {saveError}
          </p>
        )}
      </form>
    </Modal>
  );
}

export function TaskForm(props: TaskFormProps) {
  if (!props.open) return null;
  // A identidade do rascunho entra na `key`: sem ela, duas tarefas seguidas
  // pelo assistente reaproveitam o corpo montado e a segunda aparece com os
  // campos da primeira.
  const identidade = props.prefill
    ? [props.prefill.title, props.prefill.date, props.prefill.time].join('|')
    : (props.defaultDate ?? '');
  return <Body key={props.editing?.id ?? `novo:${identidade}`} {...props} />;
}
