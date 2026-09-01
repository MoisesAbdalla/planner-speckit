interface BarRowProps {
  label: string;
  /** Fração de 0 a 1 — a barra é proporcional à maior da lista. */
  fill: number;
  color: string;
  /** Valor formatado, alinhado na coluna tabular. */
  value: string;
  /** Percentual, quando ajuda a leitura. */
  hint?: string;
}

/**
 * Barra horizontal com rótulo direto.
 *
 * Horizontal porque os nomes de categoria são longos ("Alimentação",
 * "Transporte") e caberiam mal num eixo vertical. O rótulo fica ao lado da
 * barra, não dentro: dentro ele sumiria nas fatias pequenas.
 *
 * O texto usa tokens de tinta, nunca a cor da série — a cor identifica a
 * categoria, o texto precisa ser legível nos dois temas.
 */
export function BarRow({ label, fill, color, value, hint }: BarRowProps) {
  // Toda barra tem uma sobra mínima visível: uma categoria com 0,3% do total
  // não pode desaparecer da lista.
  const width = Math.max(fill * 100, 1.5);

  return (
    <li className="flex items-center gap-2 py-1.5">
      <span className="min-w-0 flex-1">
        <span className="mb-1 flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
          {hint && <span className="figures shrink-0 text-xs text-ink-faint">{hint}</span>}
          <span className="figures shrink-0 text-sm text-ink">{value}</span>
        </span>

        <span className="block h-1.5 w-full overflow-hidden rounded-pill bg-paper-sunken">
          <span
            className="block h-full rounded-pill transition-[width] duration-300"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </span>
      </span>
    </li>
  );
}
