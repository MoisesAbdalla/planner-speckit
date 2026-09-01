import type { CSSProperties } from 'react';
import { LimitMark } from './LimitMark';

interface BarRowProps {
  label: string;
  /** Fração de 0 a 1 — a barra é proporcional à maior da lista. */
  fill: number;
  color: string;
  /** Valor formatado, alinhado na coluna tabular. */
  value: string;
  /** Fração do total, de 0 a 1 — vira o percentual em corpo grande. */
  share?: number;
  /** Onde a meta cai na escala da barra, de 0 a 1. Ausente = sem meta. */
  limitAt?: number | null;
  /** Rótulo da marca, para quem passa o ponteiro. */
  limitLabel?: string;
  /** Texto do estado — a leitura não pode depender de cor (FR-014). */
  statusLabel?: string;
  statusTone?: 'atencao' | 'saida';
}

/**
 * Linha de categoria: percentual em destaque, nome, valor e barra.
 *
 * O percentual lidera em corpo grande porque é ele que responde "para onde
 * meu dinheiro está indo" sem exigir comparação nenhuma. O valor em reais vem
 * depois, para quem quer o número exato.
 *
 * Ele usa a cor da categoria, o que só é legítimo neste tamanho: a partir de
 * 24px em peso forte o piso de contraste cai para 3:1, e a paleta inteira
 * passa nesse piso nos dois temas. No corpo do texto a mesma cor seria
 * ilegível — por isso nome e valor continuam em tokens de tinta.
 *
 * Horizontal porque os nomes são longos ("Alimentação", "Transporte") e
 * caberiam mal num eixo vertical.
 */
export function BarRow({
  label,
  fill,
  color,
  value,
  share,
  limitAt = null,
  limitLabel = '',
  statusLabel,
  statusTone,
}: BarRowProps) {
  // Toda barra tem uma sobra mínima visível: uma categoria com 0,3% do total
  // não pode desaparecer da lista.
  const width = Math.max(fill * 100, 1.5);

  return (
    <li className="flex items-center gap-3 py-1.5">
      {share !== undefined && (
        <span
          className="figures w-14 shrink-0 font-display text-2xl font-bold leading-none tracking-[-0.04em]"
          style={{ color }}
        >
          {Math.round(share * 100)}
          <span className="text-sm">%</span>
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-sm text-ink">{label}</span>
          {/* Largura fixa: os valores formam uma coluna de verdade, alinhada
              como na lista de lançamentos. É a linha de razão da caderneta —
              se o número flutuar com o tamanho do rótulo, a coluna some. */}
          <span className="figures w-24 shrink-0 text-right text-sm text-ink">{value}</span>
        </span>

        <span className="relative block h-1.5 w-full overflow-hidden rounded-pill bg-[--surface-track]">
          <span
            className="cat-bar block h-full rounded-pill transition-[width] duration-[--ease-settle] ease-[--ease-out]"
            style={{ width: `${width}%`, '--cat': color } as CSSProperties}
          />
          {limitAt !== null && <LimitMark at={limitAt} label={limitLabel} tone="atencao" />}
        </span>

        {statusLabel && (
          <span
            className={`mt-1 block text-xs ${
              statusTone === 'saida' ? 'text-saida' : 'text-atencao'
            }`}
          >
            {statusLabel}
          </span>
        )}
      </span>
    </li>
  );
}
