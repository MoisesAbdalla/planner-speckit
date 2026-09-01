import { useState } from 'react';
import { Button } from '../../../design/components/Button';
import { Input } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import { centsToInputValue, formatCents, parseAmountToCents } from '../../../shared/money';
import { formatMonthLong, type ISOMonth } from '../../../shared/dates';
import { resolveGoal, hasMonthOverride, sumCategoryGoals } from '../lib/goals';
import {
  clearMonthOverride,
  removeGoal,
  setDefaultGoal,
  setMonthOverride,
} from '../lib/goalWrites';
import type { BudgetGoal, Category } from '../types';

interface BudgetGoalsManagerProps {
  open: boolean;
  uid: string;
  month: ISOMonth;
  categories: Category[];
  goals: BudgetGoal[];
  onClose: () => void;
}

interface GoalRowProps {
  uid: string;
  month: ISOMonth;
  label: string;
  categoryId: string | null;
  goal: BudgetGoal | undefined;
}

/**
 * Uma linha de meta: o valor padrão e, separado dele, o ajuste deste mês.
 *
 * Os dois campos ficam separados de propósito. "Mudei meu orçamento" e "este
 * mês é atípico" são intenções diferentes, e um campo só obrigaria a pessoa a
 * escolher entre reescrever o padrão ou não poder ajustar nada.
 */
function GoalRow({ uid, month, label, categoryId, goal }: GoalRowProps) {
  const padrao = goal?.versions?.at(-1)?.amountCents ?? null;
  const ajustado = hasMonthOverride(goal, month);
  const vigente = resolveGoal(goal, month);

  const [valor, setValor] = useState(padrao === null ? '' : centsToInputValue(padrao));
  const [ajuste, setAjuste] = useState(
    ajustado && vigente !== null ? centsToInputValue(vigente) : '',
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [abrirAjuste, setAbrirAjuste] = useState(ajustado);

  const gravar = async (acao: () => Promise<void>) => {
    setSalvando(true);
    setErro(null);
    try {
      await acao();
    } catch (cause) {
      console.error(cause);
      setErro(
        cause instanceof Error && cause.message.includes('maior que zero')
          ? cause.message
          : 'Não foi possível salvar. O que você digitou continua aqui.',
      );
    } finally {
      setSalvando(false);
    }
  };

  const salvarPadrao = () => {
    const cents = parseAmountToCents(valor);
    if (valor.trim() === '') return gravar(() => removeGoal(uid, categoryId));
    if (cents === null || cents < 0) {
      setErro('Informe um valor igual ou maior que zero.');
      return;
    }
    // Vale a partir deste mês: os anteriores continuam com o valor da época.
    return gravar(() => setDefaultGoal(uid, categoryId, month, cents));
  };

  const salvarAjuste = () => {
    const cents = parseAmountToCents(ajuste);
    if (cents === null || cents < 0) {
      setErro('Informe um valor igual ou maior que zero.');
      return;
    }
    return gravar(() => setMonthOverride(uid, categoryId, month, cents));
  };

  return (
    <li className="py-3 ledger-rule">
      <div className="flex items-end gap-2">
        <Input
          label={label}
          inputMode="decimal"
          placeholder="Sem limite"
          figures
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setErro(null);
          }}
          onBlur={salvarPadrao}
          hint={padrao !== null ? 'Vale de agora em diante' : undefined}
          error={erro ?? undefined}
          className="flex-1"
        />
      </div>

      {padrao !== null && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
          {ajustado ? (
            <>
              <span className="text-atencao">
                Este mês:{' '}
                <span className="figures">{formatCents(vigente ?? 0)}</span> (ajuste)
              </span>
              <button
                type="button"
                onClick={() => gravar(() => clearMonthOverride(uid, categoryId, month))}
                className="text-acao hover:underline"
                disabled={salvando}
              >
                Voltar ao padrão
              </button>
            </>
          ) : abrirAjuste ? (
            <span className="flex w-full items-end gap-2">
              <Input
                label={`Só em ${formatMonthLong(month)}`}
                inputMode="decimal"
                placeholder="0,00"
                figures
                value={ajuste}
                onChange={(e) => setAjuste(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={salvarAjuste} disabled={salvando}>
                Aplicar
              </Button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setAbrirAjuste(true)}
              className="text-ink-soft hover:text-ink hover:underline"
            >
              Ajustar só este mês
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * Modal de metas.
 *
 * Editar mora num modal, como categorias e recorrências — acontece raramente.
 * O **acompanhamento** é que fica dentro do resumo e das barras, onde a
 * pessoa já olha.
 */
export function BudgetGoalsManager({
  open,
  uid,
  month,
  categories,
  goals,
  onClose,
}: BudgetGoalsManagerProps) {
  if (!open) return null;

  const byTarget = new Map(goals.map((g) => [g.id, g]));
  const ativas = categories.filter((c) => !c.archived && c.kind !== 'income');
  const ativasIds = new Set(ativas.map((c) => c.id));

  const teto = resolveGoal(byTarget.get('overall'), month);
  const somaCategorias = sumCategoryGoals(goals, month, (id) => ativasIds.has(id));
  const excede = teto !== null && somaCategorias > teto;

  return (
    <Modal open title="Metas do mês" onClose={onClose}>
      <p className="mb-3 text-sm text-ink-soft">
        Deixe em branco para não ter limite. O valor vale de agora em diante — os meses
        passados mantêm o que valia na época.
      </p>

      <ul className="flex flex-col">
        <GoalRow
          key="overall"
          uid={uid}
          month={month}
          label="Teto do mês"
          categoryId={null}
          goal={byTarget.get('overall')}
        />

        {ativas.map((category) => (
          <GoalRow
            key={category.id}
            uid={uid}
            month={month}
            label={category.name}
            categoryId={category.id}
            goal={byTarget.get(category.id)}
          />
        ))}
      </ul>

      {/* Avisa, mas não impede: o teto pode ser uma meta mais apertada de
          propósito, e a decisão é da pessoa (FR-009). */}
      {excede && (
        <p role="status" className="mt-3 rounded-sm bg-atencao-wash px-3 py-2 text-xs text-atencao">
          As metas por categoria somam{' '}
          <span className="figures">{formatCents(somaCategorias)}</span>, acima do teto de{' '}
          <span className="figures">{formatCents(teto)}</span>. Dá para salvar assim — só
          fique sabendo.
        </p>
      )}
    </Modal>
  );
}
