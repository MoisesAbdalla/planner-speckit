import { useMemo, useState } from 'react';
import { useUid } from '../features/auth/AuthContext';
import { Button } from '../design/components/Button';
import { ConfirmDialog } from '../design/components/ConfirmDialog';
import { MonthNavigator } from '../features/finance/components/MonthNavigator';
import { MonthSummary } from '../features/finance/components/MonthSummary';
import { TransactionList } from '../features/finance/components/TransactionList';
import { TransactionForm } from '../features/finance/components/TransactionForm';
import { CategoryManager } from '../features/finance/components/CategoryManager';
import { RecurrenceList } from '../features/finance/components/RecurrenceList';
import { RecurrenceForm } from '../features/finance/components/RecurrenceForm';
import { useTransactions } from '../features/finance/hooks/useTransactions';
import { useCategories } from '../features/finance/hooks/useCategories';
import { useAccumulated } from '../features/finance/hooks/useAccumulated';
import { useRecurrences } from '../features/finance/hooks/useRecurrences';
import { useMaterialization } from '../features/finance/hooks/useMaterialization';
import { summarizeMonth } from '../features/finance/lib/summary';
import {
  confirmTransaction,
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from '../features/finance/lib/transactionWrites';
import { currentMonth, formatMonthLong, type ISOMonth } from '../shared/dates';
import { formatCents } from '../shared/money';
import type { Recurrence, Transaction, TransactionDraft } from '../features/finance/types';

export function FinancePage() {
  const uid = useUid();
  const [month, setMonth] = useState<ISOMonth>(currentMonth());

  const { transactions, loading, error } = useTransactions(uid, month);
  const { categories, loading: loadingCategories } = useCategories(uid);
  const { accumulatedCents, stats, hasHistory } = useAccumulated(uid, month);
  const { recurrences, active: activeRecurrences } = useRecurrences(uid);

  useMaterialization(uid, activeRecurrences, month, !loadingCategories);

  const summary = useMemo(
    () => summarizeMonth(transactions, categories),
    [transactions, categories],
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [recurrencesOpen, setRecurrencesOpen] = useState(false);
  const [recurrenceForm, setRecurrenceForm] = useState<{ open: boolean; editing: Recurrence | null }>(
    { open: false, editing: null },
  );

  const handleSave = async (draft: TransactionDraft, target: Transaction | null) => {
    // Editar um lançamento de recorrência muda só aquele mês: o documento é
    // daquele mês, e a recorrência em si não é tocada (FR-010).
    if (target) await updateTransaction(uid, target, draft);
    else await createTransaction(uid, draft);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-3xl">
      <header className="flex flex-col gap-3">
        <MonthNavigator month={month} onChange={setMonth} />

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={openNew} size="sm">
            Novo lançamento
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setRecurrencesOpen(true)}>
            Contas que se repetem
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCategoriesOpen(true)}>
            Categorias
          </Button>
        </div>
      </header>

      <MonthSummary
        summary={summary}
        accumulatedCents={accumulatedCents}
        hasHistory={hasHistory}
        stats={stats}
        month={month}
      />

      <section>
        {summary.plannedCount > 0 && (
          <p className="mb-1 text-xs text-ink-soft">
            {summary.plannedCount === 1
              ? 'Há 1 lançamento previsto esperando confirmação'
              : `Há ${summary.plannedCount} lançamentos previstos esperando confirmação`}
            {' · '}
            <span className="figures">
              {formatCents(summary.plannedExpenseCents + summary.plannedIncomeCents)}
            </span>
          </p>
        )}

        {error ? (
          <div className="rounded-md border border-saida/30 bg-saida-wash px-4 py-6 text-center">
            <p className="text-sm text-saida">{error}</p>
            <p className="mt-1 text-xs text-ink-soft">
              Verifique sua conexão. Assim que voltar, os dados aparecem sozinhos.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-3 py-6" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-sm bg-paper-sunken" />
            ))}
            <span className="sr-only">Carregando movimentações…</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-md border border-dashed border-rule-strong px-4 py-10 text-center">
            <p className="text-base text-ink">Nenhum lançamento em {formatMonthLong(month)}.</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink-soft">
              Registre o primeiro gasto ou ganho para ver para onde seu dinheiro está indo.
            </p>
            <Button className="mt-4" onClick={openNew} size="sm">
              Registrar agora
            </Button>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onEdit={openEdit}
            onDelete={setDeleting}
            onConfirm={(tx) => confirmTransaction(uid, tx).catch(console.error)}
          />
        )}
      </section>

      <TransactionForm
        open={formOpen}
        categories={categories}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir lançamento"
        message={
          deleting
            ? `"${deleting.description}" (${formatCents(deleting.amountCents)}) sai da lista e dos totais deste mês.`
            : ''
        }
        onConfirm={() => {
          if (deleting) deleteTransaction(uid, deleting).catch(console.error);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />

      <CategoryManager
        open={categoriesOpen}
        uid={uid}
        categories={categories}
        onClose={() => setCategoriesOpen(false)}
      />

      <RecurrenceList
        open={recurrencesOpen}
        uid={uid}
        recurrences={recurrences}
        categories={categories}
        onClose={() => setRecurrencesOpen(false)}
        onCreate={() => {
          setRecurrencesOpen(false);
          setRecurrenceForm({ open: true, editing: null });
        }}
        onEdit={(recurrence) => {
          setRecurrencesOpen(false);
          setRecurrenceForm({ open: true, editing: recurrence });
        }}
      />

      <RecurrenceForm
        open={recurrenceForm.open}
        uid={uid}
        categories={categories}
        editing={recurrenceForm.editing}
        onClose={() => setRecurrenceForm({ open: false, editing: null })}
      />
    </div>
  );
}
