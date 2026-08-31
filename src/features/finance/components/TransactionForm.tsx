import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input, Select } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { centsToInputValue, isValidAmount, parseAmountToCents } from '../../../shared/money';
import { monthOf, todayISO } from '../../../shared/dates';
import type { Category, MovementType, Transaction, TransactionDraft } from '../types';

interface TransactionFormProps {
  open: boolean;
  categories: Category[];
  /** Preenchido = edição; vazio = novo lançamento. */
  editing?: Transaction | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (draft: TransactionDraft, editing: Transaction | null) => Promise<void>;
}

/**
 * O corpo é remontado por `key` a cada abertura, então os campos nascem já
 * com os valores certos — sem efeito de sincronização e sem renderização
 * intermediária mostrando o lançamento anterior.
 */
function Body({ categories, editing, defaultDate, onClose, onSave }: TransactionFormProps) {
  const [type, setType] = useState<MovementType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? centsToInputValue(editing.amountCents) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [chosenCategory, setChosenCategory] = useState(editing?.categoryId ?? '');
  const [date, setDate] = useState(editing?.date ?? defaultDate ?? todayISO());
  const [amountError, setAmountError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((c) => !c.archived && (c.kind === type || c.kind === 'both'));

  // Trocar de gasto para ganho muda a lista: cai na primeira que serve.
  const categoryId = options.some((c) => c.id === chosenCategory)
    ? chosenCategory
    : (options[0]?.id ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cents = parseAmountToCents(amount);
    if (!isValidAmount(cents)) {
      setAmountError('Informe um valor maior que zero. Exemplo: 49,90');
      return;
    }
    if (!categoryId) {
      setSaveError('Escolha uma categoria.');
      return;
    }

    const draft: TransactionDraft = {
      type,
      amountCents: cents,
      description: description.trim() || (type === 'expense' ? 'Gasto' : 'Ganho'),
      categoryId,
      date,
      month: monthOf(date),
      // Manual nasce efetivado; só recorrência gera previsto (FR-010a).
      status: editing ? editing.status : 'confirmed',
      source: editing ? editing.source : 'manual',
      recurrenceId: editing ? editing.recurrenceId : null,
    };

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(draft, editing ?? null);
      onClose();
    } catch (cause) {
      // Nada é limpo: o que foi digitado continua na tela (FR-021).
      console.error(cause);
      setSaveError(
        navigator.onLine
          ? 'Não foi possível salvar. Seus dados continuam aqui — tente de novo.'
          : 'Você está sem conexão. O lançamento sobe assim que a internet voltar.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={editing ? 'Editar lançamento' : 'Novo lançamento'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="transaction-form" disabled={saving}>
            {saving ? 'Salvando…' : editing ? 'Salvar' : 'Registrar'}
          </Button>
        </>
      }
    >
      <form id="transaction-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div
          role="radiogroup"
          aria-label="Tipo do lançamento"
          className="grid grid-cols-2 gap-2 rounded-sm bg-paper-sunken p-1"
        >
          {(
            [
              { value: 'expense', label: 'Gasto' },
              { value: 'income', label: 'Ganho' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={type === option.value}
              onClick={() => setType(option.value)}
              className={`rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                type === option.value
                  ? `bg-paper-raised shadow-raised ${
                      option.value === 'expense' ? 'text-saida' : 'text-entrada'
                    }`
                  : 'text-ink-soft'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Input
          label="Valor"
          inputMode="decimal"
          placeholder="0,00"
          autoFocus
          figures
          required
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setAmountError(null);
          }}
          error={amountError ?? undefined}
        />

        <Input
          label="Descrição"
          placeholder={type === 'expense' ? 'Mercado, farmácia…' : 'Salário, freela…'}
          maxLength={120}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setChosenCategory(e.target.value)}
          required
        >
          {options.length === 0 ? (
            <option value="">Nenhuma categoria de {type === 'expense' ? 'gasto' : 'ganho'}</option>
          ) : (
            options.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </Select>

        <Input
          label="Data"
          type="date"
          figures
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          hint="Um lançamento com data futura conta no mês da data, não no de hoje."
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

export function TransactionForm(props: TransactionFormProps) {
  if (!props.open) return null;
  return <Body key={props.editing?.id ?? `novo:${props.defaultDate ?? ''}`} {...props} />;
}
