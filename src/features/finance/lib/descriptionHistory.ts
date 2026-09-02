import { normalize } from './textNormalize';
import type { DescriptionHistory } from '../assistantTypes';
import type { Transaction } from '../types';

/**
 * Descrição normalizada → a categoria mais usada com ela.
 *
 * Empate vai para o lançamento mais recente: quando alguém muda de hábito, o
 * hábito novo é o que vale.
 */
export function construirHistorico(transactions: Transaction[]): DescriptionHistory {
  const contagem = new Map<string, Map<string, { vezes: number; ultima: string }>>();

  for (const t of transactions) {
    const chave = normalize(t.description);
    if (!chave || !t.categoryId) continue;

    const porCategoria = contagem.get(chave) ?? new Map();
    const atual = porCategoria.get(t.categoryId) ?? { vezes: 0, ultima: '' };
    porCategoria.set(t.categoryId, {
      vezes: atual.vezes + 1,
      ultima: t.date > atual.ultima ? t.date : atual.ultima,
    });
    contagem.set(chave, porCategoria);
  }

  const historico: DescriptionHistory = {};
  for (const [descricao, porCategoria] of contagem) {
    let melhor: { id: string; vezes: number; ultima: string } | null = null;
    for (const [id, { vezes, ultima }] of porCategoria) {
      const ganha =
        !melhor || vezes > melhor.vezes || (vezes === melhor.vezes && ultima > melhor.ultima);
      if (ganha) melhor = { id, vezes, ultima };
    }
    if (melhor) historico[descricao] = melhor.id;
  }

  return historico;
}
