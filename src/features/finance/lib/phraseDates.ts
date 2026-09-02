import { addDays, monthOf, weekdayOf, type ISODate, type ISOMonth, type Weekday } from '../../../shared/dates';
import { normalize } from './textNormalize';

/**
 * Datas ditas em linguagem comum.
 *
 * Devolve **o texto restante** junto com a data, e é isso que permite ao valor
 * ser procurado depois sem a data no caminho: em "gastei 20 dia 5", procurar o
 * valor primeiro faria o `5` virar R$ 5,00. A ordem está fixada no contrato
 * por causa desse caso.
 */

export interface DateMatch {
  date: ISODate;
  rest: string;
}

const DIAS_DA_SEMANA: Record<string, Weekday> = {
  segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 7,
};

const pad = (n: number) => String(n).padStart(2, '0');

function removeTrecho(texto: string, trecho: string): string {
  return normalize(texto).replace(trecho, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * O dia da semana mais recente que já passou, incluindo hoje.
 * Quem lança um gasto está quase sempre falando do passado.
 */
function ultimoDiaDaSemana(today: ISODate, alvo: Weekday): ISODate {
  const atual = weekdayOf(today);
  const recuo = (atual - alvo + 7) % 7;
  return addDays(today, -recuo);
}

function proximoDiaDaSemana(today: ISODate, alvo: Weekday): ISODate {
  const atual = weekdayOf(today);
  const avanco = ((alvo - atual + 7) % 7) || 7;
  return addDays(today, avanco);
}

/**
 * Extrai a data da frase. `null` quando a frase não fala de data.
 *
 * A ordem dos testes importa: `anteontem` é verificado antes de `ontem`,
 * senão a segunda casa dentro da primeira e "anteontem" vira ontem — um erro
 * de um dia que ninguém percebe conferindo.
 */
export function extractDate(text: string, today: ISODate, viewMonth: ISOMonth): DateMatch | null {
  const t = normalize(text);

  if (t.includes('depois de amanha')) {
    return { date: addDays(today, 2), rest: removeTrecho(t, 'depois de amanha') };
  }
  if (t.includes('anteontem')) {
    return { date: addDays(today, -2), rest: removeTrecho(t, 'anteontem') };
  }
  if (/\bontem\b/.test(t)) {
    return { date: addDays(today, -1), rest: removeTrecho(t, 'ontem') };
  }
  if (/\bhoje\b/.test(t)) {
    return { date: today, rest: removeTrecho(t, 'hoje') };
  }
  if (/\bamanha\b/.test(t)) {
    return { date: addDays(today, 1), rest: removeTrecho(t, 'amanha') };
  }

  // Dia da semana, com ou sem qualificador: "sexta", "sexta passada", "sexta que vem".
  for (const [nome, weekday] of Object.entries(DIAS_DA_SEMANA)) {
    // String.raw porque `\b` num template literal comum é o caractere
    // backspace, não a fronteira de palavra — o regex casaria com nada.
    const comQualificador = new RegExp(String.raw`\b${nome}(-feira)?\s+(passada|passado|que vem)\b`);
    const achado = comQualificador.exec(t);
    if (achado) {
      const futuro = achado[2] === 'que vem';
      const date = futuro
        ? proximoDiaDaSemana(today, weekday)
        : addDays(ultimoDiaDaSemana(today, weekday), weekdayOf(today) === weekday ? -7 : 0);
      return { date, rest: removeTrecho(t, achado[0]) };
    }

    const sozinho = new RegExp(String.raw`\b${nome}(-feira)?\b`);
    const simples = sozinho.exec(t);
    if (simples) {
      return { date: ultimoDiaDaSemana(today, weekday), rest: removeTrecho(t, simples[0]) };
    }
  }

  // "dia 5" — do mês em exibição, não do mês corrente (R4).
  const diaN = /\bdia\s+(\d{1,2})\b/.exec(t);
  if (diaN) {
    const dia = Number(diaN[1]);
    if (dia >= 1 && dia <= 31) {
      return { date: `${viewMonth}-${pad(dia)}`, rest: removeTrecho(t, diaN[0]) };
    }
  }

  // "05/09" ou "5/9" — dia e mês, ano corrente.
  const ddmm = /\b(\d{1,2})\/(\d{1,2})\b/.exec(t);
  if (ddmm) {
    const dia = Number(ddmm[1]);
    const mes = Number(ddmm[2]);
    if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
      const ano = monthOf(today).slice(0, 4);
      return { date: `${ano}-${pad(mes)}-${pad(dia)}`, rest: removeTrecho(t, ddmm[0]) };
    }
  }

  return null;
}
