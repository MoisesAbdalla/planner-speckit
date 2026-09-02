import type { Category } from '../types';
import type { CategorySource, DescriptionHistory } from '../assistantTypes';
import { normalize } from './textNormalize';

/**
 * Descobrir a categoria de uma frase, em três tentativas.
 *
 * A ordem vai do mais específico ao mais genérico, e o histórico vem **antes**
 * do dicionário de propósito: se a pessoa lança "academia" em Lazer, é isso
 * que vale para ela, mesmo que um dicionário genérico diga Saúde.
 *
 * Nenhuma das três acertando, o resultado é `null` — nunca um palpite
 * (FR-008a). Categoria errada é o campo que decide onde o dinheiro aparece
 * nos gráficos; preenchê-la no chute estraga o relatório em silêncio.
 */

/**
 * Palavra comum → **nome canônico** de categoria.
 *
 * Mapeia nomes, não ids, e por isso continua correto quando a pessoa tem
 * categorias próprias: se ela renomeou ou apagou "Alimentação", a palavra
 * simplesmente não produz sugestão, em vez de apontar para um id que não
 * existe mais (FR-020).
 */
export const CATEGORY_HINTS: Record<string, string> = {
  mercado: 'Alimentação',
  supermercado: 'Alimentação',
  feira: 'Alimentação',
  padaria: 'Alimentação',
  acougue: 'Alimentação',
  almoco: 'Alimentação',
  janta: 'Alimentação',
  jantar: 'Alimentação',
  lanche: 'Alimentação',
  restaurante: 'Alimentação',
  ifood: 'Alimentação',

  aluguel: 'Moradia',
  condominio: 'Moradia',
  luz: 'Moradia',
  agua: 'Moradia',
  internet: 'Moradia',
  gas: 'Moradia',

  posto: 'Transporte',
  gasolina: 'Transporte',
  combustivel: 'Transporte',
  uber: 'Transporte',
  onibus: 'Transporte',
  metro: 'Transporte',
  estacionamento: 'Transporte',
  ipva: 'Transporte',

  farmacia: 'Saúde',
  remedio: 'Saúde',
  medico: 'Saúde',
  dentista: 'Saúde',
  academia: 'Saúde',
  exame: 'Saúde',

  cinema: 'Lazer',
  bar: 'Lazer',
  netflix: 'Lazer',
  spotify: 'Lazer',
  viagem: 'Lazer',

  salario: 'Salário',
  pagamento: 'Salário',
  freela: 'Extra',
  freelance: 'Extra',
  bonus: 'Extra',
};

export interface CategoryMatch {
  categoryId: string;
  source: CategorySource;
}

/** Categorias utilizáveis: arquivada nunca é sugerida. */
function disponiveis(categories: Category[]): Category[] {
  return categories.filter((c) => !c.archived);
}

/** Acha a categoria da pessoa cujo nome bate com um nome canônico. */
function porNome(categories: Category[], nome: string): Category | undefined {
  const alvo = normalize(nome);
  return disponiveis(categories).find((c) => normalize(c.name) === alvo);
}

/**
 * As três tentativas, parando na primeira que acertar.
 *
 * `history` já vem construído por quem chama — o parser continua puro.
 */
export function matchCategory(
  text: string,
  categories: Category[],
  history: DescriptionHistory = {},
): CategoryMatch | null {
  const t = normalize(text);
  if (!t) return null;

  // 1. Nome de categoria dito na frase, inteiro.
  for (const categoria of disponiveis(categories)) {
    const nome = normalize(categoria.name);
    // String.raw: num template literal comum, `` vira backspace e o nome
    // da categoria nunca casaria — o dicionário responderia por tudo.
    if (nome && new RegExp(String.raw`\b${nome}\b`).test(t)) {
      return { categoryId: categoria.id, source: 'nome' };
    }
  }

  // 2. O que a própria pessoa costuma fazer com essa descrição.
  const doHistorico = history[t];
  if (doHistorico && disponiveis(categories).some((c) => c.id === doHistorico)) {
    return { categoryId: doHistorico, source: 'histórico' };
  }

  // 3. Dicionário de palavras comuns, palavra a palavra.
  for (const palavra of t.split(' ')) {
    const nomeCanonico = CATEGORY_HINTS[palavra];
    if (!nomeCanonico) continue;
    const categoria = porNome(categories, nomeCanonico);
    if (categoria) return { categoryId: categoria.id, source: 'dicionário' };
  }

  return null;
}
