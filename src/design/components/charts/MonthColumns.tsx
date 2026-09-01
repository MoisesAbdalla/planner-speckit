interface Column {
  key: string;
  label: string;
  /** Valor com sinal — negativo desce abaixo da linha de base. */
  value: number;
  emphasized: boolean;
}

interface MonthColumnsProps {
  columns: Column[];
  /** Maior valor absoluto da série; define a altura máxima. */
  scale: number;
  /** Descrição textual completa, para leitor de tela (FR-013). */
  summary: string;
  formatValue: (value: number) => string;
}

/**
 * Colunas por período, com ênfase no atual.
 *
 * O mês em foco é o assunto; os anteriores são contexto. Por isso ênfase —
 * um destacado, o resto recessivo — e não uma cor por mês: pintar cada coluna
 * de um matiz diferente enterraria justamente o dado que importa.
 *
 * Um eixo só. Saldo positivo sobe da linha de base, negativo desce.
 */
export function MonthColumns({ columns, scale, summary, formatValue }: MonthColumnsProps) {
  const temNegativo = columns.some((c) => c.value < 0);
  const alturaMax = 44;

  return (
    <div>
      <p className="sr-only">{summary}</p>

      <div className="overflow-x-auto" role="img" aria-label={summary}>
        <ul className="flex min-w-full items-end justify-between gap-1.5">
          {columns.map((column) => {
            const proporção = scale === 0 ? 0 : Math.abs(column.value) / scale;
            // Coluna de valor não nulo nunca some: 3px é o mínimo visível.
            const altura = column.value === 0 ? 2 : Math.max(proporção * alturaMax, 3);
            const negativo = column.value < 0;

            return (
              <li key={column.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className="flex w-full flex-col items-center justify-end"
                  style={{ height: alturaMax }}
                >
                  {!negativo && (
                    <span
                      className={`w-full max-w-8 rounded-t-sm ${
                        column.emphasized ? 'bg-acao' : 'bg-rule-strong'
                      }`}
                      style={{ height: altura }}
                    />
                  )}
                </span>

                {/* A linha de base é o fio do razão, atravessando a série. */}
                <span className="h-px w-full bg-rule" aria-hidden="true" />

                {temNegativo && (
                  <span
                    className="flex w-full flex-col items-center"
                    style={{ height: alturaMax / 2 }}
                  >
                    {negativo && (
                      <span
                        className={`w-full max-w-8 rounded-b-sm ${
                          column.emphasized ? 'bg-saida' : 'bg-saida/40'
                        }`}
                        style={{ height: Math.min(altura, alturaMax / 2) }}
                      />
                    )}
                  </span>
                )}

                <span
                  className={`text-micro uppercase tracking-[0.06em] ${
                    column.emphasized ? 'font-medium text-ink' : 'text-ink-faint'
                  }`}
                >
                  {column.label}
                </span>

                {/* Rótulo direto só no mês em foco: um número por coluna
                    viraria ruído e brigaria por espaço em 375px. */}
                {column.emphasized && (
                  <span className="figures text-xs font-medium text-ink">
                    {formatValue(column.value)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
