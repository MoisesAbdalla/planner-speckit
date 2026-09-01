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
    <ul
      className="flex flex-col rounded-md border px-4 pb-2"
      style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-card-border)' }}
    >
      {[...groups.entries()].map(([date, items]) => (
        <Fragment key={date}>
          <li className="sticky top-0 z-10 flex items-baseline gap-2 px-1 pb-1 pt-4 backdrop-blur" style={{ background: 'color-mix(in srgb, var(--surface-card) 95%, transparent)' }}>
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
                // A linha nova desce para o lugar dela; e ao confirmar, o fio
                // tracejado vira contínuo e a figura ganha peso. É a gramática
                // da caderneta acontecendo — o único movimento do app que
                // carrega significado em vez de enfeitar.
                className={`animate-ledger-in group flex items-center gap-3 px-1 py-3 transition-[border-color] duration-[--ease-settle] ease-[--ease-in-out] ${
                  planned ? 'ledger-rule-planned' : 'ledger-rule'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-6 w-1 shrink-0 rounded-pill transition-opacity duration-[--ease-settle]"
                  style={{
                    backgroundColor: category ? categoryColor(category.sortOrder) : OTHER_COLOR,
                    opacity: planned ? 0.4 : 1,
                  }}
                />

                <button
                  type="button"
                  onClick={() => onEdit(tx)}
                  className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
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
                    className="shrink-0 rounded-pill border border-acao/35 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-acao transition-[background-color,transform] duration-[--ease-snap] ease-[--ease-out] hover:bg-acao-wash active:scale-95"
                  >
                    Confirmar
                  </button>
                )}

                <span
                  key={tx.status}
                  className={`figures w-24 shrink-0 text-right text-sm tabular-nums transition-colors duration-[--ease-settle] ${
                    planned
                      ? 'font-normal text-ink-faint'
                      : `animate-settle font-medium ${
                          tx.type === 'income' ? 'text-entrada' : 'text-ink'
                        }`
                  }`}
                >
                  {tx.type === 'income' ? '+' : '−'}
                  {formatCents(tx.amountCents)}
                </span>

                <button
                  type="button"
                  onClick={() => onDelete(tx)}
                  aria-label={`Excluir ${tx.description}`}
                  className="shrink-0 rounded-sm px-1.5 py-1 text-ink-faint opacity-0 transition-[opacity,background-color,transform] duration-[--ease-snap] hover:bg-saida-wash hover:text-saida focus-visible:opacity-100 active:scale-90 group-hover:opacity-100"
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
