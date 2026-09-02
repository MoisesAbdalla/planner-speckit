import type { Category } from '../../../src/features/finance/types';

/**
 * O conjunto de frases que torna o SC-002 e o SC-003 verificáveis.
 *
 * Sem ele, "acerta 90%" é opinião. As frases **sem valor** não são
 * ilustrativas: são elas que provam o SC-003, o único critério absoluto da
 * feature — o assistente jamais preenche um valor que a pessoa não disse.
 */

export interface PhraseCase {
  /** O que se escreve ou fala. */
  phrase: string;
  /** `null` significa: a frase não tinha valor, e o campo precisa ficar vazio. */
  amountCents: number | null;
  type: 'expense' | 'income';
  /** Data esperada; `undefined` quando o esperado é o padrão (hoje). */
  date?: string;
  /** Nome da categoria esperada; `null` quando nenhuma deve ser reconhecida. */
  category?: string | null;
}

/** As categorias padrão do app, como uma conta recém-criada as tem. */
export const CATEGORIAS: Category[] = [
  { id: 'cat-alimentacao', name: 'Alimentação', kind: 'expense', archived: false, isDefault: true, sortOrder: 0 },
  { id: 'cat-moradia', name: 'Moradia', kind: 'expense', archived: false, isDefault: true, sortOrder: 1 },
  { id: 'cat-transporte', name: 'Transporte', kind: 'expense', archived: false, isDefault: true, sortOrder: 2 },
  { id: 'cat-saude', name: 'Saúde', kind: 'expense', archived: false, isDefault: true, sortOrder: 3 },
  { id: 'cat-lazer', name: 'Lazer', kind: 'expense', archived: false, isDefault: true, sortOrder: 4 },
  { id: 'cat-outros', name: 'Outros', kind: 'expense', archived: false, isDefault: true, sortOrder: 5 },
  { id: 'cat-salario', name: 'Salário', kind: 'income', archived: false, isDefault: true, sortOrder: 6 },
  { id: 'cat-extra', name: 'Extra', kind: 'income', archived: false, isDefault: true, sortOrder: 7 },
];

/**
 * Data de referência de todos os casos: **terça, 1º de setembro de 2026**.
 *
 * Fixa e injetada, para que nenhum teste quebre sozinho quando o dia virar.
 * Escolhida de propósito num dia 1º: é a data em que "ontem" cai no mês
 * anterior, que é o caso que o SC-009 existe para resolver.
 */
export const HOJE = '2026-09-01';
export const MES_EM_EXIBICAO = '2026-09';

export const CASOS: PhraseCase[] = [
  // — Formatos de dinheiro (FR-001) —
  { phrase: '20 no mercado', amountCents: 2000, type: 'expense', category: 'Alimentação' },
  { phrase: 'registre gasto de 20 reais mercado', amountCents: 2000, type: 'expense', category: 'Alimentação' },
  { phrase: 'gastei 47,90 no posto', amountCents: 4790, type: 'expense', category: 'Transporte' },
  { phrase: 'R$ 47,90 farmácia', amountCents: 4790, type: 'expense', category: 'Saúde' },
  { phrase: 'r$ 1.200,00 aluguel', amountCents: 120000, type: 'expense', category: 'Moradia' },
  { phrase: '1.200 de aluguel', amountCents: 120000, type: 'expense', category: 'Moradia' },
  { phrase: 'paguei 3200 de aluguel', amountCents: 320000, type: 'expense', category: 'Moradia' },
  { phrase: 'lanche 20,5', amountCents: 2050, type: 'expense', category: 'Alimentação' },
  { phrase: 'uber 20.50', amountCents: 2050, type: 'expense', category: 'Transporte' },
  { phrase: 'cinema 35', amountCents: 3500, type: 'expense', category: 'Lazer' },

  // — Números por extenso, o formato natural da fala (FR-002) —
  { phrase: 'vinte reais no mercado', amountCents: 2000, type: 'expense', category: 'Alimentação' },
  { phrase: 'gastei quarenta reais na farmácia', amountCents: 4000, type: 'expense', category: 'Saúde' },
  { phrase: 'quarenta e cinco reais no posto', amountCents: 4500, type: 'expense', category: 'Transporte' },
  { phrase: 'cem reais de mercado', amountCents: 10000, type: 'expense', category: 'Alimentação' },
  { phrase: 'cento e vinte reais de luz', amountCents: 12000, type: 'expense', category: 'Moradia' },
  { phrase: 'mil e duzentos de aluguel', amountCents: 120000, type: 'expense', category: 'Moradia' },
  { phrase: 'três mil e duzentos de salário', amountCents: 320000, type: 'income', category: 'Salário' },
  { phrase: 'quinze reais no lanche', amountCents: 1500, type: 'expense', category: 'Alimentação' },

  // — Receita (FR-003) —
  { phrase: 'salário 3200', amountCents: 320000, type: 'income', category: 'Salário' },
  { phrase: 'recebi 500 de freela', amountCents: 50000, type: 'income', category: 'Extra' },
  { phrase: 'ganhei 100', amountCents: 10000, type: 'income' },
  { phrase: 'entrou 250 extra', amountCents: 25000, type: 'income', category: 'Extra' },

  // — Datas em linguagem comum (FR-004) —
  { phrase: 'paguei 47,90 no posto ontem', amountCents: 4790, type: 'expense', date: '2026-08-31', category: 'Transporte' },
  { phrase: 'gastei 30 no mercado anteontem', amountCents: 3000, type: 'expense', date: '2026-08-30', category: 'Alimentação' },
  { phrase: '25 de lanche hoje', amountCents: 2500, type: 'expense', date: '2026-09-01', category: 'Alimentação' },
  { phrase: 'cinema 40 amanhã', amountCents: 4000, type: 'expense', date: '2026-09-02', category: 'Lazer' },
  { phrase: 'farmácia 60 depois de amanhã', amountCents: 6000, type: 'expense', date: '2026-09-03', category: 'Saúde' },
  { phrase: 'gastei 20 dia 5', amountCents: 2000, type: 'expense', date: '2026-09-05' },
  { phrase: 'mercado 80 dia 15', amountCents: 8000, type: 'expense', date: '2026-09-15', category: 'Alimentação' },
  { phrase: 'posto 150 em 28/08', amountCents: 15000, type: 'expense', date: '2026-08-28', category: 'Transporte' },
  { phrase: 'padaria 12 sexta', amountCents: 1200, type: 'expense', date: '2026-08-28', category: 'Alimentação' },
  { phrase: 'uber 30 segunda', amountCents: 3000, type: 'expense', date: '2026-08-31', category: 'Transporte' },

  // — Categoria pelo nome dito na frase (FR-005) —
  { phrase: '90 em lazer', amountCents: 9000, type: 'expense', category: 'Lazer' },
  { phrase: 'transporte 45', amountCents: 4500, type: 'expense', category: 'Transporte' },
  { phrase: 'saúde 200', amountCents: 20000, type: 'expense', category: 'Saúde' },

  // — Categoria que não deve ser reconhecida (FR-008a) —
  { phrase: 'presente para a Ana 80', amountCents: 8000, type: 'expense', category: null },
  { phrase: '35 no petshop', amountCents: 3500, type: 'expense', category: null },
  { phrase: 'gastei 60 com a bicicleta', amountCents: 6000, type: 'expense', category: null },

  // — SEM VALOR: as frases que provam o SC-003 —
  { phrase: 'no mercado', amountCents: null, type: 'expense', category: 'Alimentação' },
  { phrase: 'almoço com a Ana', amountCents: null, type: 'expense', category: 'Alimentação' },
  { phrase: 'gastei na farmácia ontem', amountCents: null, type: 'expense', date: '2026-08-31', category: 'Saúde' },
  { phrase: 'paguei o aluguel', amountCents: null, type: 'expense', category: 'Moradia' },
  { phrase: 'uber', amountCents: null, type: 'expense', category: 'Transporte' },
  { phrase: 'bom dia', amountCents: null, type: 'expense' },
  { phrase: '', amountCents: null, type: 'expense' },
];

/** Só as frases sem valor — o SC-003 é medido sobre elas, sem tolerância. */
export const CASOS_SEM_VALOR = CASOS.filter((c) => c.amountCents === null);
