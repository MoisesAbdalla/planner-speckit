import { MAX_NAMED_CATEGORIES, OTHER_COLOR } from '../../../design/palette';
import type { CategorySlice } from './summary';

/**
 * Dobra da distribuição por categoria.
 *
 * A escada de séries de visualização de dados trata 7–8 como teto e proíbe
 * gerar um nono matiz: uma cor gerada é indistinguível das existentes sob
 * daltonismo. Como o usuário cria categorias à vontade, a cauda precisa
 * dobrar em algum ponto — e é aqui.
 */

export const OTHER_CATEGORY_ID = '__outros__';

export interface BreakdownSlice extends CategorySlice {
  /** Quantas categorias esta fatia representa. Maior que 1 só em "Outros". */
  count: number;
}

/**
 * Reduz a lista a no máximo `max` fatias.
 *
 * Quando é preciso dobrar, mantém as `max - 1` maiores e soma o resto em
 * "Outros" — assim o resultado nunca passa de `max` linhas e "Outros" sempre
 * agrega pelo menos duas categorias, em vez de virar um apelido para uma só.
 *
 * A entrada já vem ordenada da maior para a menor por `summarizeMonth`.
 */
export function foldCategories(
  slices: CategorySlice[],
  max: number = MAX_NAMED_CATEGORIES,
): BreakdownSlice[] {
  if (slices.length <= max) {
    return slices.map((slice) => ({ ...slice, count: 1 }));
  }

  const named = slices.slice(0, max - 1).map((slice) => ({ ...slice, count: 1 }));
  const tail = slices.slice(max - 1);

  const cents = tail.reduce((sum, slice) => sum + slice.cents, 0);
  const share = tail.reduce((sum, slice) => sum + slice.share, 0);

  return [
    ...named,
    {
      categoryId: OTHER_CATEGORY_ID,
      name: 'Outros',
      color: OTHER_COLOR,
      cents,
      share,
      count: tail.length,
    },
  ];
}

/** A soma das fatias precisa fechar com o total — sem sobra de arredondamento. */
export function breakdownTotal(slices: BreakdownSlice[]): number {
  return slices.reduce((sum, slice) => sum + slice.cents, 0);
}
