import { useState } from 'react';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Button } from '../../../design/components/Button';
import { Input, Select } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { centsToInputValue, isValidAmount, parseAmountToCents } from '../../../shared/money';
import { currentMonth, WEEKDAY_LABELS, type Weekday } from '../../../shared/dates';
import type { Category, MovementType, Recurrence, RecurrenceFrequency } from '../types';
import { resolveFrequency } from '../lib/recurrenceRules';

const FREQUENCIAS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly', label: 'Toda semana' },
  { value: 'monthly', label: 'Todo mês' },
  { value: 'yearly', label: 'Uma vez por ano' },
];

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const DIAS_DA_SEMANA: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

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
  // Mensal é o padrão: quem só quer o que já existia não paga interação nenhuma.
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    editing ? resolveFrequency(editing) : 'monthly',
  );
  const [weekday, setWeekday] = useState<Weekday>(editing?.weekday ?? 2);
  const [monthOfYear, setMonthOfYear] = useState(String(editing?.monthOfYear ?? 1));
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
    if (frequency !== 'weekly' && (!Number.isInteger(day) || day < 1 || day > 31)) {
      setSaveError('O dia precisa estar entre 1 e 31.');
      return;
    }
    const mes = Number(monthOfYear);
    if (frequency === 'yearly' && (!Number.isInteger(mes) || mes < 1 || mes > 12)) {
      setSaveError('Escolha um mês válido.');
      return;
    }
    if (!categoryId) {
      setSaveError('Escolha uma categoria.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      // Só os campos da frequência escolhida são gravados. Os de outra
      // frequência podem sobrar de uma edição anterior e são ignorados na
      // leitura — nunca motivo para recusar a escrita.
      const payload = {
        type,
        amountCents: cents,
        description:
          description.trim() || (type === 'expense' ? 'Conta a pagar' : 'Receita'),
        categoryId,
        frequency,
        dayOfMonth: frequency === 'weekly' ? 1 : day,
        ...(frequency === 'weekly' ? { weekday } : {}),
        ...(frequency === 'yearly' ? { monthOfYear: mes } : {}),
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

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">Com que frequência</legend>
          <div className="grid grid-cols-3 gap-1 rounded-sm bg-paper-sunken p-1">
            {FREQUENCIAS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={frequency === option.value}
                onClick={() => setFrequency(option.value)}
                className={`rounded-sm px-2 py-2 text-xs font-medium transition-colors duration-[--ease-snap] ${
                  frequency === option.value
                    ? 'bg-paper-raised text-ink shadow-raised'
                    : 'text-ink-soft'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Só os campos da frequência escolhida aparecem — trocar a
            frequência troca os campos, sem deixar visível o que não vale. */}
        {frequency === 'weekly' && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-ink">Em qual dia</legend>
            <div className="flex gap-1">
              {DIAS_DA_SEMANA.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  role="radio"
                  aria-checked={weekday === dia}
                  onClick={() => setWeekday(dia)}
                  className={`h-9 flex-1 rounded-sm border text-xs font-medium transition-colors duration-[--ease-snap] ${
                    weekday === dia
                      ? 'border-acao bg-acao-wash text-acao'
                      : 'border-rule-strong text-ink-soft hover:bg-paper-sunken'
                  }`}
                >
                  {WEEKDAY_LABELS[dia]}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {frequency !== 'weekly' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Dia"
              type="number"
              min={1}
              max={31}
              figures
              required
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              hint={frequency === 'yearly' ? undefined : 'Meses curtos: último dia.'}
            />
            {frequency === 'yearly' && (
              <Select
                label="Mês"
                value={monthOfYear}
                onChange={(e) => setMonthOfYear(e.target.value)}
              >
                {MESES.map((nome, i) => (
                  <option key={nome} value={i + 1}>
                    {nome}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}

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
