import { formatCents } from '../../../shared/money';

interface MeterProps {
  /** O que entrou — o limite contra o qual a saída é lida. */
  incomeCents: number;
  /** O que já saiu, efetivado. */
  expenseCents: number;
  /** O que ainda deve sair, previsto e não confirmado. */
  plannedExpenseCents?: number;
}

/**
 * Medidor: quanto do que entrou já saiu.
 *
 * O dado é uma razão contra um limite, e não partes de um todo — por isso um
 * medidor, e não uma pizza de duas fatias. O previsto estende a barra em peso
 * leve, porque a pergunta que a pessoa faz aqui é "quanto ainda posso
 * gastar", e ela precisa contar com o que já está comprometido.
 */
export function Meter({ incomeCents, expenseCents, plannedExpenseCents = 0 }: MeterProps) {
  const overspent = expenseCents > incomeCents;
  const semEntrada = incomeCents === 0;

  // Sem entrada não há proporção a calcular: qualquer gasto já é excesso.
  const base = semEntrada ? Math.max(expenseCents + plannedExpenseCents, 1) : incomeCents;
  const usado = Math.min(expenseCents / base, 1);
  const previsto = Math.min(plannedExpenseCents / base, Math.max(0, 1 - usado));

  const percentual = semEntrada ? 100 : Math.round((expenseCents / incomeCents) * 100);
  const sobra = incomeCents - expenseCents - plannedExpenseCents;

  const resumo =
    semEntrada && expenseCents === 0
      ? 'Nenhuma movimentação neste mês.'
      : overspent || semEntrada
        ? `Saiu ${formatCents(expenseCents)} contra ${formatCents(incomeCents)} que entrou — ${percentual}% do que entrou.`
        : `Saiu ${formatCents(expenseCents)} de ${formatCents(incomeCents)} que entrou, ${percentual}%.` +
          (plannedExpenseCents > 0
            ? ` Ainda previsto: ${formatCents(plannedExpenseCents)}.`
            : '');

  return (
    <div>
      {/* O dado também existe em texto, para leitor de tela e para quem não
          distingue as cores (FR-013). */}
      <p className="sr-only">{resumo}</p>

      <div
        className={`flex h-2.5 w-full overflow-hidden rounded-pill ${
          overspent ? 'bg-saida-wash' : 'bg-paper-sunken'
        }`}
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
      </div>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-soft">
        {overspent || semEntrada ? (
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
