import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input, Select } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { centsToInputValue, isValidAmount, parseAmountToCents } from '../../../shared/money';
import { monthOf, todayISO } from '../../../shared/dates';
import type { Category, MovementType, Transaction, TransactionDraft } from '../types';
import type { ParsedPhrase } from '../assistantTypes';
import { resolveCategoryId } from '../lib/formCategory';

interface TransactionFormProps {
  open: boolean;
  categories: Category[];
  /** Preenchido = edição; vazio = novo lançamento. */
  editing?: Transaction | null;
  defaultDate?: string;
  /** O que o assistente entendeu da frase. Ausente = caminho manual. */
  prefill?: ParsedPhrase | null;
  /**
   * Não pré-selecionar a primeira categoria. **Só o assistente liga isto**:
   * no caminho manual a pré-seleção continua como sempre (FR-021).
   */
  requireExplicitCategory?: boolean;
  onClose: () => void;
  onSave: (draft: TransactionDraft, editing: Transaction | null) => Promise<void>;
}

/**
 * O que o assistente entendeu da frase — e o que é apenas o padrão.
 *
 * Sem esta linha, "gasto de hoje" e "não disse tipo nem data" chegariam
 * idênticos ao formulário, e a pessoa leria os padrões como se fossem
 * entendimento (FR-009). Quando nada foi entendido, é ela também que avisa,
 * em vez de abrir um formulário vazio como se tivesse funcionado (FR-013).
 */
function LeituraDaFrase({ parsed }: { parsed: ParsedPhrase }) {
  if (!parsed.understood) {
    return (
      <p className="rounded-sm bg-paper-sunken px-3 py-2 text-xs text-ink-soft">
        Não entendi essa frase. Deixei o texto na descrição — complete o resto.
      </p>
    );
  }

  const entendidos = [
    parsed.amountCents !== null && 'valor',
    parsed.typeFromPhrase && 'tipo',
    parsed.dateFromPhrase && 'data',
    parsed.categorySource !== null && 'categoria',
  ].filter(Boolean) as string[];

  const padroes = [
    !parsed.typeFromPhrase && 'tipo',
    !parsed.dateFromPhrase && 'data',
  ].filter(Boolean) as string[];

  return (
    <p className="rounded-sm bg-paper-sunken px-3 py-2 text-xs text-ink-soft">
      <span className="text-ink">Entendi {listar(entendidos)}.</span>
      {padroes.length > 0 && ` ${maiuscula(listar(padroes))} ${padroes.length > 1 ? 'são' : 'é'} o padrão — confira.`}
    </p>
  );
}

/** "valor, data e categoria" — a vírgula até o penúltimo, "e" antes do último. */
function listar(itens: string[]): string {
  if (itens.length === 0) return 'nada';
  if (itens.length === 1) return itens[0]!;
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

const maiuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * O corpo é remontado por `key` a cada abertura, então os campos nascem já
 * com os valores certos — sem efeito de sincronização e sem renderização
 * intermediária mostrando o lançamento anterior.
 */
function Body({
  categories,
  editing,
  defaultDate,
  prefill,
  requireExplicitCategory,
  onClose,
  onSave,
}: TransactionFormProps) {
  const [type, setType] = useState<MovementType>(editing?.type ?? prefill?.type ?? 'expense');
  const [amount, setAmount] = useState(
    editing
      ? centsToInputValue(editing.amountCents)
      : prefill?.amountCents != null
        ? centsToInputValue(prefill.amountCents)
        : '',
  );
  const [description, setDescription] = useState(editing?.description ?? prefill?.description ?? '');
  const [chosenCategory, setChosenCategory] = useState(
    editing?.categoryId ?? prefill?.categoryId ?? '',
  );
  const [date, setDate] = useState(editing?.date ?? prefill?.date ?? defaultDate ?? todayISO());
  const [amountError, setAmountError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = categories.filter((c) => !c.archived && (c.kind === type || c.kind === 'both'));

  const categoryId = resolveCategoryId(options, chosenCategory, requireExplicitCategory);

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
      title={editing ? 'Editar lançamento' : prefill ? 'Confira o lançamento' : 'Novo lançamento'}
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
        {prefill && <LeituraDaFrase parsed={prefill} />}

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
          {/* Só aparece quando o assistente não reconheceu a categoria. É o
              estado que impede o lançamento de cair na primeira da lista sem
              a pessoa ter escolhido nada (FR-008a); o `required` do campo e o
              guarda do handleSubmit fazem o resto. */}
          {requireExplicitCategory && categoryId === '' && options.length > 0 && (
            <option value="">Escolha uma categoria</option>
          )}
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

/**
 * A identidade do rascunho entra na `key`: sem ela, dois lançamentos seguidos
 * pelo assistente reaproveitariam o corpo montado e a segunda frase apareceria
 * com os campos da primeira.
 */
function chaveDoRascunho(prefill: ParsedPhrase): string {
  return [prefill.amountCents, prefill.date, prefill.description, prefill.categoryId].join('|');
}

export function TransactionForm(props: TransactionFormProps) {
  if (!props.open) return null;
  const identidade = props.prefill
    ? chaveDoRascunho(props.prefill)
    : (props.defaultDate ?? '');
  return <Body key={props.editing?.id ?? `novo:${identidade}`} {...props} />;
}
