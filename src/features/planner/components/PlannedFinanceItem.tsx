import { formatCents } from '../../../shared/money';
import type { Transaction } from '../../finance/types';

interface PlannedFinanceItemProps {
  transaction: Transaction;
  onConfirm: (transaction: Transaction) => void;
  compact?: boolean;
}

/**
 * Lançamento previsto dentro do planner (FR-018a).
 *
 * Ele se distingue das tarefas pelo mesmo recurso que distingue previsto de
 * efetivado no financeiro: o fio interrompido. Nenhum emblema novo, nenhuma
 * cor extra — é a mesma gramática da lista de dinheiro, trazida para cá.
 */
export function PlannedFinanceItem({
  transaction,
  onConfirm,
  compact = false,
}: PlannedFinanceItemProps) {
  const sign = transaction.type === 'income' ? '+' : '−';

  if (compact) {
    return (
      <div className="flex items-center gap-1 truncate rounded-sm border-b border-dashed border-rule-strong px-1 py-0.5 text-xs text-ink-faint">
        <span className="truncate">{transaction.description}</span>
        <span className="figures ml-auto shrink-0">
          {sign}
          {formatCents(transaction.amountCents)}
        </span>
      </div>
    );
  }

  return (
    <li className="flex items-center gap-3 py-3 ledger-rule-planned">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-dashed border-rule-strong text-ink-faint"
      >
        <span className="text-[10px] leading-none">R$</span>
      </span>

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink-soft">{transaction.description}</span>
        <span className="text-xs text-ink-faint">previsto</span>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(transaction)}
        className="shrink-0 rounded-sm border border-acao/30 px-2 py-1 text-xs font-medium text-acao transition-colors hover:bg-acao-wash"
      >
        Confirmar
      </button>

      <span className="figures shrink-0 text-sm text-ink-faint">
        {sign}
        {formatCents(transaction.amountCents)}
      </span>
    </li>
  );
}
