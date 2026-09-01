import { Fragment } from 'react';
import { formatCents } from '../../../shared/money';
import { categoryColor, OTHER_COLOR } from '../../../design/palette';
import { formatDayShort, formatWeekdayShort, type ISODate } from '../../../shared/dates';
import type { Category, Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onConfirm: (transaction: Transaction) => void;
}

/**
 * A lista é a "linha de razão": valores alinhados numa coluna tabular sobre
 * fios finos. O que ainda não aconteceu tem o fio interrompido e a figura em
 * peso leve — o estado é a estrutura, não um emblema colado do lado.
 */
export function TransactionList({
  transactions,
  categories,
  onEdit,
  onDelete,
  onConfirm,
}: TransactionListProps) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const groups = transactions.reduce<Map<ISODate, Transaction[]>>((acc, tx) => {
    const list = acc.get(tx.date) ?? [];
    list.push(tx);
    acc.set(tx.date, list);
    return acc;
  }, new Map());

  return (
    <ul className="flex flex-col">
      {[...groups.entries()].map(([date, items]) => (
        <Fragment key={date}>
          <li className="sticky top-0 z-10 flex items-baseline gap-2 bg-paper/95 px-1 pb-1 pt-4 backdrop-blur">
            <span className="figures text-sm font-medium text-ink">{formatDayShort(date)}</span>
            <span className="text-micro uppercase tracking-[0.08em] text-ink-faint">
              {formatWeekdayShort(date)}
            </span>
          </li>

          {items.map((tx) => {
            const category = categoryById.get(tx.categoryId);
            const planned = tx.status === 'planned';

            return (
              <li
                key={tx.id}
                className={`group flex items-center gap-3 px-1 py-3 ${
                  planned ? 'ledger-rule-planned' : 'ledger-rule'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-1 shrink-0 rounded-pill"
                  style={{
                    backgroundColor: category ? categoryColor(category.sortOrder) : OTHER_COLOR,
                    opacity: planned ? 0.4 : 1,
                  }}
                />

                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="min-w-0 flex-1 text-left"
                  aria-label={`Editar ${tx.description}`}
                >
                  <span className={`block truncate text-sm ${planned ? 'text-ink-soft' : 'text-ink'}`}>
                    {tx.description}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {category?.name ?? 'Sem categoria'}
                    {planned && ' · previsto'}
                  </span>
                </button>

                {planned && (
                  <button
                    type="button"
                    onClick={() => onConfirm(tx)}
                    className="shrink-0 rounded-sm border border-acao/30 px-2 py-1 text-xs font-medium text-acao transition-colors hover:bg-acao-wash"
                  >
                    Confirmar
                  </button>
                )}

                <span
                  className={`figures shrink-0 text-sm tabular-nums ${
                    planned
                      ? 'font-normal text-ink-faint'
                      : tx.type === 'income'
                        ? 'font-medium text-entrada'
                        : 'font-medium text-ink'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '−'}
                  {formatCents(tx.amountCents)}
                </span>

                <button
                  type="button"
                  onClick={() => onDelete(tx)}
                  aria-label={`Excluir ${tx.description}`}
                  className="shrink-0 rounded-sm px-1.5 py-1 text-ink-faint opacity-0 transition-opacity hover:bg-saida-wash hover:text-saida focus-visible:opacity-100 group-hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </Fragment>
      ))}
    </ul>
  );
}
