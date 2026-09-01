import { useState } from 'react';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Button } from '../../../design/components/Button';
import { Modal } from '../../../design/components/Modal';
import { ConfirmDialog } from '../../../design/components/ConfirmDialog';
import { formatCents } from '../../../shared/money';
import { addMonths, currentMonth, formatDayShort } from '../../../shared/dates';
import {
  describeFrequency,
  nextOccurrence,
  occurrenceBadge,
  resolveFrequency,
} from '../lib/recurrenceRules';
import type { Category, Recurrence } from '../types';

interface RecurrenceListProps {
  open: boolean;
  uid: string;
  recurrences: Recurrence[];
  categories: Category[];
  onClose: () => void;
  onCreate: () => void;
  onEdit: (recurrence: Recurrence) => void;
}

export function RecurrenceList({
  open,
  uid,
  recurrences,
  categories,
  onClose,
  onCreate,
  onEdit,
}: RecurrenceListProps) {
  const [ending, setEnding] = useState<Recurrence | null>(null);
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  /**
   * Encerrar marca o mês anterior como último: os lançamentos já criados
   * ficam intactos e nenhum novo é gerado (FR-010).
   */
  const endRecurrence = async (recurrence: Recurrence) => {
    try {
      await updateDoc(doc(db, 'users', uid, 'recurrences', recurrence.id), {
        endMonth: addMonths(currentMonth(), -1),
        updatedAt: serverTimestamp(),
      });
    } catch (cause) {
      console.error(cause);
    } finally {
      setEnding(null);
    }
  };

  // Só a anual ganha a linha da próxima data: nas outras ela é óbvia e viraria ruído.
  const proximaDe = (r: Recurrence) =>
    resolveFrequency(r) === 'yearly' ? nextOccurrence(r, currentMonth()) : null;

  const active = recurrences.filter((r) => r.endMonth === null);
  const ended = recurrences.filter((r) => r.endMonth !== null);

  return (
    <>
      <Modal
        open={open}
        title="Contas que se repetem"
        onClose={onClose}
        footer={<Button onClick={onCreate}>Nova recorrência</Button>}
      >
        {recurrences.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-ink-soft">
              Cadastre aluguel, assinaturas e salário uma vez só. Eles aparecem todo mês como
              previstos, esperando sua confirmação.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {active.map((recurrence) => (
              <li key={recurrence.id} className="flex items-center gap-3 py-3 ledger-rule">
                <span className="figures w-10 shrink-0 text-center text-sm text-ink-soft">
                  {occurrenceBadge(recurrence)}
                </span>

                <button
                  type="button"
                  onClick={() => onEdit(recurrence)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm text-ink">{recurrence.description}</span>
                  <span className="text-xs text-ink-faint">
                    {categoryById.get(recurrence.categoryId)?.name ?? 'Sem categoria'} ·{' '}
                    {describeFrequency(recurrence)}
                  </span>
                  {/* A próxima data importa mais na anual: é o que responde
                      "quando é que isso cai?" sem abrir o calendário. */}
                  {proximaDe(recurrence) && (
                    <span className="text-micro text-ink-faint">
                      próxima em {formatDayShort(proximaDe(recurrence)!)}
                    </span>
                  )}
                </button>

                <span
                  className={`figures shrink-0 text-sm font-medium ${
                    recurrence.type === 'income' ? 'text-entrada' : 'text-ink'
                  }`}
                >
                  {recurrence.type === 'income' ? '+' : '−'}
                  {formatCents(recurrence.amountCents)}
                </span>

                <button
                  type="button"
                  onClick={() => setEnding(recurrence)}
                  className="shrink-0 rounded-sm px-2 py-1 text-xs text-ink-soft hover:bg-paper-sunken hover:text-ink"
                >
                  Encerrar
                </button>
              </li>
            ))}

            {ended.length > 0 && (
              <li className="pt-4">
                <p className="text-micro uppercase tracking-[0.08em] text-ink-faint">Encerradas</p>
                <ul className="mt-1">
                  {ended.map((recurrence) => (
                    <li
                      key={recurrence.id}
                      className="flex items-center gap-3 py-2 text-sm text-ink-faint"
                    >
                      <span className="figures w-10 shrink-0 text-center">
                        {occurrenceBadge(recurrence)}
                      </span>
                      <span className="min-w-0 flex-1 truncate line-through">
                        {recurrence.description}
                      </span>
                      <span className="figures shrink-0">{formatCents(recurrence.amountCents)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
        )}
      </Modal>

      <ConfirmDialog
        open={ending !== null}
        title="Encerrar recorrência"
        message={
          ending
            ? `"${ending.description}" para de gerar lançamentos a partir do próximo mês. Os lançamentos já criados continuam onde estão.`
            : ''
        }
        confirmLabel="Encerrar"
        destructive={false}
        onConfirm={() => ending && endRecurrence(ending)}
        onCancel={() => setEnding(null)}
      />
    </>
  );
}
