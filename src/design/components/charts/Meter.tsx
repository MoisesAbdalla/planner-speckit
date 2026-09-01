import { formatCents } from '../../../shared/money';
import { LimitMark } from './LimitMark';
import type { GoalConsumption } from '../../../features/finance/types';

interface MeterProps {
  /** O que entrou no mês. */
  incomeCents: number;
  /** O que já saiu, efetivado. */
  expenseCents: number;
  /** O que ainda deve sair, previsto e não confirmado. */
  plannedExpenseCents?: number;
  /** Teto do mês, quando definido. Muda a escala da barra. */
  goal?: GoalConsumption | null;
}

/**
 * Medidor: quanto do limite do mês já foi usado.
 *
 * **A escala depende de haver meta.** Sem teto, a barra mede gasto ÷ entrada,
 * e a pergunta é "quanto da minha renda já gastei". Com teto, ela mede
 * gasto ÷ meta, e a pergunta passa a ser "quanto do que eu me permiti já
 * foi" — a entrada vira uma marca sobre a barra.
 *
 * O denominador acompanha a pergunta porque, do contrário, o número em
 * destaque responderia a outra coisa. E é uma escala só: duas referências no
 * mesmo desenho seria eixo duplo.
 *
 * O dado é uma razão contra um limite, não partes de um todo — por isso um
 * medidor, e não uma pizza de duas fatias.
 */
export function Meter({
  incomeCents,
  expenseCents,
  plannedExpenseCents = 0,
  goal = null,
}: MeterProps) {
  const comMeta = goal !== null;
  const overspent = comMeta ? goal.state === 'over' : expenseCents > incomeCents;
  const semBase = comMeta ? goal.goalCents === 0 : incomeCents === 0;

  const base = comMeta
    ? goal.goalCents || Math.max(expenseCents + plannedExpenseCents, 1)
    : semBase
      ? Math.max(expenseCents + plannedExpenseCents, 1)
      : incomeCents;

  const usado = Math.min(expenseCents / base, 1);
  const previsto = Math.min(plannedExpenseCents / base, Math.max(0, 1 - usado));
  const percentual = semBase ? 100 : Math.round((expenseCents / base) * 100);

  const sobra = comMeta
    ? goal.remainingCents
    : incomeCents - expenseCents - plannedExpenseCents;

  const resumo = comMeta
    ? semBase && expenseCents === 0
      ? 'Meta de nenhum gasto, e nada gasto ainda.'
      : goal.state === 'over'
        ? `Passou da meta em ${formatCents(Math.abs(goal.remainingCents + plannedExpenseCents))}. Meta de ${formatCents(goal.goalCents)}, gasto de ${formatCents(expenseCents)}.`
        : `Gasto de ${formatCents(expenseCents)} de uma meta de ${formatCents(goal.goalCents)}, ${percentual}%.` +
          (plannedExpenseCents > 0 ? ` Ainda previsto: ${formatCents(plannedExpenseCents)}.` : '')
    : semBase && expenseCents === 0
      ? 'Nenhuma movimentação neste mês.'
      : overspent || semBase
        ? `Saiu ${formatCents(expenseCents)} contra ${formatCents(incomeCents)} que entrou — ${percentual}% do que entrou.`
        : `Saiu ${formatCents(expenseCents)} de ${formatCents(incomeCents)} que entrou, ${percentual}%.` +
          (plannedExpenseCents > 0 ? ` Ainda previsto: ${formatCents(plannedExpenseCents)}.` : '');

  const trilho =
    comMeta && goal.state === 'over'
      ? 'bg-saida-wash'
      : comMeta && goal.state === 'near'
        ? 'bg-atencao-wash'
        : overspent
          ? 'bg-saida-wash'
          : 'bg-paper-sunken';

  return (
    <div>
      {/* O dado também existe em texto, para leitor de tela e para quem não
          distingue as cores (FR-013, FR-014). */}
      <p className="sr-only">{resumo}</p>

      <div
        className={`relative flex h-2.5 w-full overflow-hidden rounded-pill ${trilho}`}
        role="img"
        aria-label={resumo}
      >
        <span
          className="h-full bg-saida transition-[width] duration-300"
          style={{ width: `${usado * 100}%` }}
        />
        {previsto > 0 && (
          <>
            {/* Vão de 2px na cor da superfície: separa sem precisar de borda. */}
            <span className="h-full w-0.5 shrink-0 bg-paper-raised" aria-hidden="true" />
            <span
              className="h-full bg-saida/35 transition-[width] duration-300"
              style={{ width: `${previsto * 100}%` }}
            />
          </>
        )}

        {/* Com meta, a entrada do mês vira referência sobre a barra. */}
        {comMeta && goal.incomeMark !== null && (
          <LimitMark at={goal.incomeMark} label={`Entrou ${formatCents(incomeCents)}`} />
        )}
      </div>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-soft">
        {comMeta ? (
          goal.state === 'over' ? (
            <span className="font-medium text-saida">
              Passou da meta
              {' · '}
              <span className="figures">{formatCents(expenseCents - goal.goalCents)}</span> a mais
            </span>
          ) : (
            <>
              <span className={goal.state === 'near' ? 'font-medium text-atencao' : undefined}>
                <span className="figures">{percentual}%</span> da meta
                {goal.state === 'near' && ' · perto do limite'}
              </span>
              {sobra !== 0 && (
                <span className="text-ink-faint">
                  sobra <span className="figures">{formatCents(sobra)}</span>
                  {plannedExpenseCents > 0 && ' após o previsto'}
                </span>
              )}
            </>
          )
        ) : overspent || semBase ? (
          <span className="font-medium text-saida">
            Saiu mais do que entrou
            {incomeCents > 0 && (
              <>
                {' · '}
                <span className="figures">{formatCents(expenseCents - incomeCents)}</span> a mais
              </>
            )}
          </span>
        ) : (
          <>
            <span>
              <span className="figures text-ink">{percentual}%</span> do que entrou já saiu
            </span>
            {sobra !== 0 && (
              <span className="text-ink-faint">
                sobra <span className="figures">{formatCents(sobra)}</span>
                {plannedExpenseCents > 0 && ' após o previsto'}
              </span>
            )}
          </>
        )}
      </p>
    </div>
  );
}
