import { words } from './textNormalize';

/**
 * Números por extenso em português.
 *
 * Existe porque a fala raramente dita dígitos: quem fala diz "quarenta reais",
 * não "quatro zero". Sem isto, a US2 (voz) entregaria valor vazio na maioria
 * das frases, e o recurso pareceria quebrado justamente onde ele é mais útil.
 *
 * Teto em 999.999: cobre salário e compra do dia a dia. Ninguém dita um gasto
 * em milhões, e inventar essa faixa seria construir para um caso que não existe.
 */

const UNIDADES: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13,
  catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19,
};

const DEZENAS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60,
  setenta: 70, oitenta: 80, noventa: 90,
};

const CENTENAS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300,
  trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500,
  quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700,
  setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900,
  novecentas: 900,
};

function valorDaPalavra(palavra: string): number | null {
  if (palavra in UNIDADES) return UNIDADES[palavra]!;
  if (palavra in DEZENAS) return DEZENAS[palavra]!;
  if (palavra in CENTENAS) return CENTENAS[palavra]!;
  return null;
}

/** A palavra participa de um número por extenso? */
export function isNumberWord(palavra: string): boolean {
  return palavra === 'mil' || palavra === 'e' || valorDaPalavra(palavra) !== null;
}

/**
 * Converte um texto por extenso em número. `null` quando não é número.
 *
 * `mil` multiplica o que veio antes e zera o acumulador, que é o que faz
 * "três mil e duzentos" dar 3200 em vez de 3 + 1000 + 200.
 */
export function wordsToNumber(text: string): number | null {
  const partes = words(text).filter((p) => p !== 'e');
  if (partes.length === 0) return null;

  let total = 0;
  let atual = 0;
  let viuAlgum = false;

  for (const parte of partes) {
    if (parte === 'mil') {
      // "mil" sozinho é 1000, não 0 × 1000.
      total += (atual === 0 ? 1 : atual) * 1000;
      atual = 0;
      viuAlgum = true;
      continue;
    }

    const valor = valorDaPalavra(parte);
    if (valor === null) return null;
    atual += valor;
    viuAlgum = true;
  }

  return viuAlgum ? total + atual : null;
}

/**
 * Encontra a maior sequência de palavras por extenso dentro de uma frase.
 *
 * Devolve o número e o texto sem ele — o restante é o que sobra para virar
 * descrição, como o `extractDate` faz com a data.
 */
export function extractNumberWords(text: string): { value: number; rest: string } | null {
  const partes = words(text);
  let melhor: { inicio: number; fim: number; valor: number } | null = null;

  for (let inicio = 0; inicio < partes.length; inicio += 1) {
    if (!isNumberWord(partes[inicio]!) || partes[inicio] === 'e') continue;

    for (let fim = partes.length; fim > inicio; fim -= 1) {
      const trecho = partes.slice(inicio, fim);
      // Um "e" pendurado na ponta pertence à frase, não ao número.
      if (trecho[trecho.length - 1] === 'e') continue;
      if (!trecho.every(isNumberWord)) continue;

      const valor = wordsToNumber(trecho.join(' '));
      if (valor === null) continue;
      if (!melhor || fim - inicio > melhor.fim - melhor.inicio) {
        melhor = { inicio, fim, valor };
      }
      break;
    }
  }

  if (!melhor) return null;
  const rest = [...partes.slice(0, melhor.inicio), ...partes.slice(melhor.fim)].join(' ');
  return { value: melhor.valor, rest };
}
