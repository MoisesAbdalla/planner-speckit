import { parseAmountToCents } from '../../../shared/money';
import type { MovementType } from '../types';
import type { ParseContext, ParsedPhrase } from '../assistantTypes';
import { matchCategory } from './categoryHints';
import { extractDate } from './phraseDates';
import { extractNumberWords } from './numberWords';
import { normalize } from './textNormalize';

/**
 * O interpretador de frases — puro, determinístico, sem Firebase e sem relógio.
 *
 * É a peça que erra de formas silenciosas: um centavo no lugar errado, um dia
 * a menos. Por isso ela é testável frase a frase, e por isso o SC-002 pode ser
 * um número em vez de uma impressão.
 *
 * **Nunca lança exceção**: frase vazia, emoji ou 500 caracteres de ruído
 * devolvem um `ParsedPhrase` com `understood: false`.
 */

/** Palavras que indicam saída de dinheiro. */
const PALAVRAS_GASTO = [
  'gastei', 'gasto', 'paguei', 'pagar', 'comprei', 'compra', 'despesa', 'saiu',
];

/** Palavras que indicam entrada. */
const PALAVRAS_RECEITA = [
  'recebi', 'receita', 'ganhei', 'ganho', 'salario', 'entrou', 'entrada',
  'rendimento', 'pagamento', 'freela', 'freelance', 'bonus',
];

/** Palavras de comando e conectivos que não descrevem nada. */
const RUIDO = new Set([
  'registre', 'registrar', 'registra', 'lance', 'lancar', 'lanca', 'anota',
  'anotar', 'adiciona', 'adicionar', 'coloca', 'colocar', 'de', 'do', 'da',
  'no', 'na', 'em', 'com', 'por', 'reais', 'real', 'r', 'um', 'uma', 'e',
  ...PALAVRAS_GASTO,
  ...PALAVRAS_RECEITA.filter((p) => p !== 'salario'),
]);

/**
 * Encontra o valor em dígitos e devolve o texto sem ele.
 *
 * A conversão para centavos é feita pelo `parseAmountToCents` que já existe:
 * um segundo conversor de dinheiro seria a segunda fonte de verdade do valor,
 * exatamente o que o Princípio IV proíbe para totais, pela mesma razão.
 */
function extrairValorEmDigitos(text: string): { cents: number; rest: string } | null {
  // Ponto separa milhar só quando seguido de exatamente 3 dígitos; fora disso
  // vale como vírgula, porque teclado de celular e transcrição produzem ponto.
  const padrao = /\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?/;
  const achado = padrao.exec(text);
  if (!achado) return null;

  const cents = parseAmountToCents(achado[0]);
  if (cents === null || cents <= 0) return null;

  const rest = `${text.slice(0, achado.index)} ${text.slice(achado.index + achado[0].length)}`
    .replace(/\s+/g, ' ')
    .trim();
  return { cents, rest };
}

function decidirTipo(text: string): { type: MovementType; fromPhrase: boolean } {
  const palavras = new Set(normalize(text).split(' '));
  if (PALAVRAS_RECEITA.some((p) => palavras.has(p))) {
    return { type: 'income', fromPhrase: true };
  }
  if (PALAVRAS_GASTO.some((p) => palavras.has(p))) {
    return { type: 'expense', fromPhrase: true };
  }
  // Padrão gasto: é a maioria dos lançamentos. Vem com `fromPhrase: false`
  // para a interface não apresentar o padrão como entendimento (FR-009).
  return { type: 'expense', fromPhrase: false };
}

/** Tira o ruído e devolve o que de fato descreve o lançamento. */
function limparDescricao(text: string): string {
  return normalize(text)
    .split(' ')
    .filter((p) => p && !RUIDO.has(p) && !/^\d+$/.test(p))
    .join(' ')
    .trim();
}

export function parsePhrase(phrase: string, context: ParseContext): ParsedPhrase {
  const vazio: ParsedPhrase = {
    amountCents: null,
    type: 'expense',
    typeFromPhrase: false,
    date: context.today,
    dateFromPhrase: false,
    description: '',
    categoryId: null,
    categorySource: null,
    understood: false,
  };

  if (!phrase || !phrase.trim()) return vazio;

  // 1. Data primeiro. Invertido, o "5" de "dia 5" viraria R$ 5,00 — e é um
  //    erro que passa despercebido porque a frase continua parecendo certa.
  const data = extractDate(phrase, context.today, context.viewMonth);
  const semData = data ? data.rest : normalize(phrase);

  // 2. Valor, sobre o texto já sem a data. Dígitos antes do extenso: quem
  //    escreveu "20" não quis dizer outra coisa.
  const emDigitos = extrairValorEmDigitos(semData);
  let amountCents: number | null = null;
  let semValor = semData;

  if (emDigitos) {
    amountCents = emDigitos.cents;
    semValor = emDigitos.rest;
  } else {
    const porExtenso = extractNumberWords(semData);
    if (porExtenso && porExtenso.value > 0) {
      amountCents = porExtenso.value * 100;
      semValor = porExtenso.rest;
    }
  }

  // 3. Tipo, pela frase inteira: "salário" pode ter virado descrição.
  const { type, fromPhrase: typeFromPhrase } = decidirTipo(phrase);

  // 4. Descrição, com o ruído fora.
  const description = limparDescricao(semValor);

  // 5. Categoria, sobre o que sobrou.
  const categoria = matchCategory(description || semValor, context.categories, context.history);

  return {
    amountCents,
    type,
    typeFromPhrase,
    date: data ? data.date : context.today,
    dateFromPhrase: data !== null,
    description,
    categoryId: categoria?.categoryId ?? null,
    categorySource: categoria?.source ?? null,
    // Entendimento é ter reconhecido **um campo do lançamento**: valor, data
    // ou categoria. Sobrar texto não conta — se contasse, "bom dia" abriria um
    // formulário vazio como se tivesse funcionado, em vez de disparar o
    // FR-013 e dizer que não entendeu.
    understood: amountCents !== null || data !== null || categoria !== null,
  };
}
