import { BarRow } from '../../../design/components/charts/BarRow';
import { ColumnLabel } from '../../../design/components/Card';
import { foldCategories } from '../lib/categoryBreakdown';
import { formatCents } from '../../../shared/money';
import type { CategorySlice } from '../lib/summary';

interface CategoryBreakdownProps {
  slices: CategorySlice[];
  expenseCents: number;
}

/**
 * Para onde o dinheiro foi, da maior fatia para a menor.
 *
 * Ordenado por valor para a categoria dominante aparecer primeiro e ser
 * identificável sem ler número algum (SC-004). Só efetivado: "para onde meu
 * dinheiro foi" é uma pergunta sobre o passado — o previsto é intenção, e
 * mora no medidor.
 */
export function CategoryBreakdown({ slices, expenseCents }: CategoryBreakdownProps) {
  if (slices.length === 0 || expenseCents === 0) {
    return (
      <div className="border-t border-rule px-4 py-4">
        <ColumnLabel>Para onde foi</ColumnLabel>
        <p className="mt-1 text-sm text-ink-soft">
          Nenhum gasto efetivado ainda neste mês.
        </p>
      </div>
    );
  }

  const dobradas = foldCategories(slices);
  const maior = dobradas[0]?.cents ?? 1;

  return (
    <div className="border-t border-rule px-4 py-4">
      <div className="flex items-baseline justify-between gap-2">
        <ColumnLabel>Para onde foi</ColumnLabel>
        {dobradas.length > 1 && (
          <span className="text-xs text-ink-faint">
            {dobradas[0]!.name} lidera com {Math.round(dobradas[0]!.share * 100)}%
          </span>
        )}
      </div>

      <ul className="mt-2 flex flex-col">
        {dobradas.map((slice) => (
          <BarRow
            key={slice.categoryId}
            // A barra é proporcional à maior da lista, não ao total: assim a
            // diferença entre as categorias fica legível mesmo quando uma
            // domina o mês.
            fill={slice.cents / maior}
            color={slice.color}
            label={slice.count > 1 ? `Outros (${slice.count} categorias)` : slice.name}
            value={formatCents(slice.cents)}
            hint={`${Math.round(slice.share * 100)}%`}
          />
        ))}
      </ul>
    </div>
  );
}
