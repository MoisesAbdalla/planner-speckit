import type { Category } from '../types';

/**
 * Qual categoria o formulário mostra como escolhida.
 *
 * Está numa função pura, fora do componente, porque é aqui que mora uma
 * garantia que ninguém percebe quebrar: o formulário aberto **à mão** sempre
 * pré-seleciona a primeira categoria da lista, como sempre fez (FR-021). O
 * assistente é o único que pede o contrário.
 */
export function resolveCategoryId(
  options: Category[],
  chosen: string,
  requireExplicit = false,
): string {
  if (options.some((c) => c.id === chosen)) return chosen;

  /**
   * Aberto pelo assistente sem categoria reconhecida: fica **vazio**.
   *
   * Cair na primeira da lista aqui faria o "nunca chuta" (FR-008) virar
   * mentira silenciosa justamente no campo que decide onde o dinheiro aparece
   * nos gráficos — a pessoa salvaria "Alimentação" sem ter dito isso.
   */
  if (requireExplicit) return '';

  // Trocar de gasto para ganho muda a lista: cai na primeira que serve.
  return options[0]?.id ?? '';
}
