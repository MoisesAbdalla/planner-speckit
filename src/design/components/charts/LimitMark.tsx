interface LimitMarkProps {
  /** Posição na escala da barra, de 0 a 1. Acima de 1 fica fora — de propósito. */
  at: number;
  label: string;
  tone?: 'neutral' | 'atencao';
}

/**
 * Marca de limite sobre uma barra.
 *
 * É o recurso que faz os estados de meta não dependerem de cor: a posição
 * comunica sozinha, e continua legível em escala de cinza, sob qualquer
 * daltonismo e impressa.
 *
 * E encaixa na identidade — é mais um fio atravessando a coluna, como o resto
 * da caderneta.
 *
 * Marca fora da barra é resultado legítimo: significa que o valor marcado
 * passa da escala (por exemplo, meta maior que a renda do mês), e é
 * exatamente isso que a pessoa precisa ver.
 */
export function LimitMark({ at, label, tone = 'neutral' }: LimitMarkProps) {
  if (!Number.isFinite(at) || at < 0) return null;

  const foraDaEscala = at > 1;
  const posicao = Math.min(at, 1);

  return (
    <span
      className="pointer-events-none absolute inset-y-0"
      style={{ left: `${posicao * 100}%` }}
      aria-hidden="true"
      title={label}
    >
      <span
        className={`block h-full w-px ${
          tone === 'atencao' ? 'bg-atencao' : 'bg-ink'
        } ${foraDaEscala ? 'opacity-40' : ''}`}
      />
    </span>
  );
}
