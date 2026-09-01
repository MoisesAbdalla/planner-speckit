/**
 * Paleta de categorias — validada, não escolhida a olho.
 *
 * As oito cores passam nas seis checagens de visualização de dados nos dois
 * temas (`npm run validate:palette`). A paleta anterior foi escolhida no olho
 * e tinha ΔE 1,9 entre duas categorias: praticamente a mesma cor para quem
 * tem deuteranopia. Por isso aqui não há valor literal — os componentes usam
 * as custom properties, que trocam de tema sozinhas.
 */

export const CATEGORY_SLOT_COUNT = 8;

/** Quantas categorias aparecem com nome antes de a cauda virar "Outros". */
export const MAX_NAMED_CATEGORIES = 6;

/** Referência CSS do slot — resolve para a cor certa do tema em uso. */
export function slotColor(slot: number): string {
  return `var(--color-cat-${(slot % CATEGORY_SLOT_COUNT) + 1})`;
}

/** Cinza neutro da fatia agregada. Nunca um matiz gerado. */
export const OTHER_COLOR = 'var(--color-cat-other)';

/**
 * Slot de uma categoria.
 *
 * Deriva do `sortOrder`, que é estável por categoria — nunca da posição dela
 * no ranking do mês. Se a cor seguisse o ranking, gastar mais em Transporte
 * repintaria todas as outras, e a leitura mudaria de significado a cada mês.
 */
export function categorySlot(sortOrder: number): number {
  const normalized = Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0;
  return ((normalized % CATEGORY_SLOT_COUNT) + CATEGORY_SLOT_COUNT) % CATEGORY_SLOT_COUNT;
}

/** Cor de uma categoria, pronta para uso em `style`. */
export function categoryColor(sortOrder: number): string {
  return slotColor(categorySlot(sortOrder));
}
