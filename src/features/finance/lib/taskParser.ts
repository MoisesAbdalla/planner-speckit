import type { ParseContext, ParsedTask } from '../assistantTypes';
import { extractDate } from './phraseDates';
import { extractTime, marcarHoras } from './phraseTime';
import { REMINDER_ONLY } from './reminderWords';
import { normalize } from './textNormalize';

/**
 * A leitura de tarefa de uma frase — pura, como a financeira.
 *
 * Ordem: **data, depois hora, depois título.** A data sai antes porque
 * "dia 10" precisa deixar de ser um número; a hora sai depois porque "15h"
 * precisa deixar de ser um número antes de sobrar como título.
 */

/**
 * Palavras que não descrevem a tarefa.
 *
 * Só as palavras que **anunciam** o lembrete entram aqui. Elas são sinal para decidir o lado
 * e ruído para o título: "lembrar de pagar o IPTU" vira "pagar o IPTU".
 *
 * As que **descrevem** a tarefa (`dentista`, `reunião`, `pagar`) ficam de fora de
 * propósito — eles **são** a tarefa. Removê-los faria "marcar dentista" virar
 * uma tarefa sem nome, que é o oposto de ajudar.
 */
const RUIDO = new Set([
  'de', 'do', 'da', 'no', 'na', 'em', 'a', 'o', 'as', 'os', 'para', 'pra',
  'com', 'que', 'as', 'e',
  ...REMINDER_ONLY,
]);

function limparTitulo(text: string): string {
  return normalize(text)
    .split(' ')
    // Números soltos são valor, não nome: "20 no mercado" tem título
    // "mercado", não "20 mercado".
    .filter((p) => p && !RUIDO.has(p) && !/^\d+([.,]\d+)?$/.test(p))
    .join(' ')
    .trim();
}

export function parseTask(phrase: string, context: ParseContext): ParsedTask {
  const vazio: ParsedTask = {
    title: '',
    date: context.today,
    dateFromPhrase: false,
    time: null,
    understood: false,
  };

  if (!phrase || !phrase.trim()) return vazio;

  // Os dois pontos viram "h" na frase crua: a extração de data normaliza, e a
  // normalização os descarta — depois dela, "7:30" já teria virado "7 30".
  const texto = marcarHoras(phrase);

  // 1. Data. "dia 10" precisa sair antes de virar candidato a outra coisa.
  const data = extractDate(texto, context.today, context.viewMonth);
  const semData = data ? data.rest : normalize(texto);

  // 2. Hora, sobre o texto já sem a data.
  const hora = extractTime(semData);
  const semHora = hora ? hora.rest : semData;

  // 3. O que sobrou é o título.
  const title = limparTitulo(semHora);

  return {
    title,
    date: data ? data.date : context.today,
    dateFromPhrase: data !== null,
    time: hora ? hora.time : null,
    // Uma tarefa é "entendida" quando sobrou nome, ou quando a frase marcou
    // quando ela acontece. Sem nada disso, não há tarefa nenhuma ali.
    understood: Boolean(title) || data !== null || hora !== null,
  };
}
