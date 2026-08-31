import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Button } from '../../../design/components/Button';
import { Input, Select } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { centsToInputValue, isValidAmount, parseAmountToCents } from '../../../shared/money';
import { currentMonth } from '../../../shared/dates';
import type { Category, MovementType, Recurrence } from '../types';

interface RecurrenceFormProps {
  open: boolean;
  uid: string;
  categories: Category[];
  editing?: Recurrence | null;
  onClose: () => void;
}

function Body({ uid, categories, editing, onClose }: RecurrenceFormProps) {
  const [type, setType] = useState<MovementType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? centsToInputValue(editing.amountCents) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [chosenCategory, setChosenCategory] = useState(editing?.categoryId ?? '');
  const [dayOfMonth, setDayOfMonth] = useState(String(editing?.dayOfMonth ?? 5));
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((c) => !c.archived && (c.kind === type || c.kind === 'both'));
  const categoryId = options.some((c) => c.id === chosenCategory)
    ? chosenCategory
    : (options[0]?.id ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cents = parseAmountToCents(amount);
    if (!isValidAmount(cents)) {
      setError('Informe um valor maior que zero. Exemplo: 1.200,00');
      return;
    }
    const day = Number(dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      setSaveError('O dia precisa estar entre 1 e 31.');
      return;
    }
    if (!categoryId) {
      setSaveError('Escolha uma categoria.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        type,
        amountCents: cents,
        description: description.trim() || (type === 'expense' ? 'Conta mensal' : 'Receita mensal'),
        categoryId,
        dayOfMonth: day,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, 'users', uid, 'recurrences', editing.id), payload);
      } else {
        await addDoc(collection(db, 'users', uid, 'recurrences'), {
          ...payload,
          startMonth: currentMonth(),
          endMonth: null,
          createdAt: serverTimestamp(),
        });
      }
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
      title={editing ? 'Editar recorrência' : 'Nova conta que se repete'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="recurrence-form" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id="recurrence-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-soft">
          Lançamos todo mês como previsto. Você confirma quando pagar ou receber.
        </p>

        <div
          role="radiogroup"
          aria-label="Tipo da recorrência"
          className="grid grid-cols-2 gap-2 rounded-sm bg-paper-sunken p-1"
        >
          {(
            [
              { value: 'expense', label: 'Conta a pagar' },
              { value: 'income', label: 'Receita' },
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
          figures
          required
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />

        <Input
          label="Descrição"
          placeholder="Aluguel, internet, salário…"
          maxLength={120}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Select
          label="Categoria"
          value={categoryId}
          onChange={(e) => setChosenCategory(e.target.value)}
        >
          {options.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Input
          label="Dia do mês"
          type="number"
          min={1}
          max={31}
          figures
          required
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value)}
          hint="Em meses mais curtos, cai no último dia."
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

export function RecurrenceForm(props: RecurrenceFormProps) {
  if (!props.open) return null;
  return <Body key={props.editing?.id ?? 'nova'} {...props} />;
}
