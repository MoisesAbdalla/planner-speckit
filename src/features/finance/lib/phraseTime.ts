import { normalize } from './textNormalize';

/**
 * A hora do dia — e a regra que a separa de dinheiro.
 *
 * **A hora exige marca.** `às`, `h`, `:`, `meio-dia` ou `meia-noite`. Um
 * número solto nunca é hora, e é isso que impede "paguei 15 no lanche" de
 * virar um compromisso das 15h. Os dois textos contêm `15`; só a marca separa.
 *
 * Sem essa regra, todo gasto entre R$ 0 e R$ 23 viraria candidato a hora, e o
 * erro seria frequente e silencioso — um compromisso falso na agenda de quem
 * só queria registrar um lanche.
 */

export interface TimeMatch {
  /** Sempre "HH:mm". */
  time: string;
  /** O texto sem a expressão de hora — para o valor ser procurado depois. */
  rest: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function remover(texto: string, trecho: string): string {
  return texto.replace(trecho, ' ').replace(/\s+/g, ' ').trim();
}

/** Hora e minuto válidos? Fora da faixa, descartamos — nunca ajustamos. */
function valida(hora: number, minuto: number): boolean {
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

/**
 * Converte "7:30" em "7h30".
 *
 * `normalize` descarta os dois pontos, e ela é compartilhada com o caminho
 * financeiro — mexer nela arriscaria o que está em produção. Como a extração
 * de data roda antes da de hora e já normaliza, esta conversão precisa
 * acontecer na **frase crua**, antes de qualquer coisa. Por isso é exportada.
 */
export function marcarHoras(text: string): string {
  return text.replace(/(\d):(\d)/g, '$1h$2');
}

export function extractTime(text: string): TimeMatch | null {
  const t = normalize(marcarHoras(text));

  if (/\bmeio[ -]?dia\b/.test(t)) {
    const achado = /\bmeio[ -]?dia\b/.exec(t)!;
    return { time: '12:00', rest: remover(t, achado[0]) };
  }
  if (/\bmeia[ -]?noite\b/.test(t)) {
    const achado = /\bmeia[ -]?noite\b/.exec(t)!;
    return { time: '00:00', rest: remover(t, achado[0]) };
  }

  // "7h30", "às 7h30", "15h", "às 15 h" e "7:30" — o "h" é a marca.
  const comH = /\b(?:as\s+)?(\d{1,2})\s*h(?:\s*(\d{2}))?\b/.exec(t);
  if (comH) {
    const hora = Number(comH[1]);
    const minuto = comH[2] ? Number(comH[2]) : 0;
    if (valida(hora, minuto)) {
      return { time: `${pad(hora)}:${pad(minuto)}`, rest: remover(t, comH[0]) };
    }
    return null;
  }

  // "7:30", "às 07:30" — os dois pontos são a marca.
  const comDoisPontos = /\b(?:as\s+)?(\d{1,2}):(\d{2})\b/.exec(t);
  if (comDoisPontos) {
    const hora = Number(comDoisPontos[1]);
    const minuto = Number(comDoisPontos[2]);
    if (valida(hora, minuto)) {
      return { time: `${pad(hora)}:${pad(minuto)}`, rest: remover(t, comDoisPontos[0]) };
    }
    return null;
  }

  // Nenhuma marca: não há hora nenhuma nesta frase. Um número solto é dinheiro.
  return null;
}
