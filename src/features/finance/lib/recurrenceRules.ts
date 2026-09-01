import {
  addMonths,
  dateForDayOfMonth,
  weekdayDatesInMonth,
  WEEKDAY_LABELS,
  type ISODate,
  type ISOMonth,
  type Weekday,
} from '../../../shared/dates';

const WEEKDAY_FULL: Record<Weekday, string> = {
  1: 'segunda',
  2: 'terça',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sábado',
  7: 'domingo',
};

/** "todo sábado" e "toda terça" — o artigo acompanha o gênero do dia. */
const WEEKDAY_PREFIX: Record<Weekday, string> = {
  1: 'toda',
  2: 'toda',
  3: 'toda',
  4: 'toda',
  5: 'toda',
  6: 'todo',
  7: 'todo',
};
import type { Recurrence, RecurrenceFrequency, TransactionDraft } from '../types';

/**
 * Regras das recorrências financeiras — puras, sem Firestore.
 *
 * A chave do lançamento é determinística, e é ela que impede duplicata quando
 * o app abre no PC e no celular ao mesmo tempo. Ela identifica **o que torna a
 * ocorrência única naquela frequência**: mensal e anual geram no máximo uma
 * por mês, então o mês basta; semanal tem quatro ou cinco no mesmo mês, então
 * precisa da data.
 *
 * Mudar a chave de mensal faria o app não reconhecer os lançamentos já
 * gravados e duplicar cada um deles.
 */

/** Quantos meses à frente são preparados para semanal e mensal. */
export const HORIZON_MONTHS = 3;

/** Alcance da anual: um ano. Ver saber cedo é o valor inteiro dela. */
export const YEARLY_HORIZON_MONTHS = 12;

/**
 * A frequência de uma recorrência.
 *
 * **Este é o único lugar do código que lê `frequency` cru.** A ausência do
 * campo significa mensal, e é o que mantém funcionando tudo que foi gravado
 * antes desta feature — espalhar essa leitura garante que um dos lugares vai
 * esquecer o padrão.
 */
export function resolveFrequency(recurrence: Recurrence): RecurrenceFrequency {
  return recurrence.frequency ?? 'monthly';
}

export function plannedTransactionId(recurrenceId: string, occurrenceKey: string): string {
  return `rec_${recurrenceId}_${occurrenceKey}`;
}

/** Uma recorrência vale para o mês se já começou e ainda não foi encerrada. */
export function appliesTo(recurrence: Recurrence, month: ISOMonth): boolean {
  if (month < recurrence.startMonth) return false;
  if (recurrence.endMonth !== null && month > recurrence.endMonth) return false;
  return true;
}

/**
 * As datas que uma recorrência gera dentro de um mês, com a chave de cada uma.
 *
 * A chave é o que vai no id do lançamento — por isso ela sai daqui junto da
 * data, para as duas nunca discordarem.
 */
export function occurrencesIn(
  recurrence: Recurrence,
  month: ISOMonth,
): { date: ISODate; key: string }[] {
  switch (resolveFrequency(recurrence)) {
    case 'weekly': {
      if (!recurrence.weekday) return [];
      // Quatro ou cinco por mês: a chave precisa da data, senão elas
      // colapsariam num documento só e só a primeira sobreviveria.
      return weekdayDatesInMonth(month, recurrence.weekday).map((date) => ({
        date,
        key: date,
      }));
    }

    case 'yearly': {
      // Só no mês escolhido. `monthOfYear` é 1–12; o mês da chave é o próprio.
      if (!recurrence.monthOfYear) return [];
      if (Number(month.slice(5, 7)) !== recurrence.monthOfYear) return [];
      return [{ date: dateForDayOfMonth(month, recurrence.dayOfMonth), key: month }];
    }

    case 'monthly':
    default:
      return [{ date: dateForDayOfMonth(month, recurrence.dayOfMonth), key: month }];
  }
}

/** O lançamento previsto de uma ocorrência. */
export function plannedDraft(
  recurrence: Recurrence,
  month: ISOMonth,
  date: ISODate,
): TransactionDraft {
  return {
    type: recurrence.type,
    amountCents: recurrence.amountCents,
    description: recurrence.description,
    categoryId: recurrence.categoryId,
    date,
    month,
    status: 'planned',
    source: 'recurrence',
    recurrenceId: recurrence.id,
  };
}

/**
 * Os meses que precisam ser preparados para uma recorrência.
 *
 * Assimétrico de propósito: semanal e mensal seguem com três meses, e a anual
 * alcança doze — mas devolve **só o mês em que ela cai**, não os doze. Rodar
 * um horizonte de doze meses para tudo quadruplicaria a leitura de quem só tem
 * recorrência mensal, sem nenhum retorno.
 */
export function monthsToPrepare(recurrence: Recurrence, fromMonth: ISOMonth): ISOMonth[] {
  const alcance =
    resolveFrequency(recurrence) === 'yearly' ? YEARLY_HORIZON_MONTHS : HORIZON_MONTHS;

  const meses: ISOMonth[] = [];
  for (let i = 0; i < alcance; i += 1) {
    const month = addMonths(fromMonth, i);
    if (appliesTo(recurrence, month) && occurrencesIn(recurrence, month).length > 0) {
      meses.push(month);
    }
  }
  return meses;
}

/** Todos os meses que qualquer recorrência da lista precisa, sem repetição. */
export function horizonFrom(recurrences: Recurrence[], fromMonth: ISOMonth): ISOMonth[] {
  const meses = new Set<ISOMonth>();
  recurrences.forEach((r) => monthsToPrepare(r, fromMonth).forEach((m) => meses.add(m)));
  return [...meses].sort();
}

export interface PendingMaterialization {
  id: string;
  draft: TransactionDraft;
}

/**
 * O que falta criar num mês, dado o que já existe.
 * É aqui que mora a garantia de idempotência.
 */
export function pendingFor(
  recurrences: Recurrence[],
  month: ISOMonth,
  existingIds: Iterable<string>,
): PendingMaterialization[] {
  const existing = new Set(existingIds);

  return recurrences
    .filter((recurrence) => appliesTo(recurrence, month))
    .flatMap((recurrence) => {
      // Ocorrências descartadas pela pessoa não voltam. Sem isto, excluir um
      // previsto o traria de volta na próxima materialização.
      const descartadas = new Set(recurrence.skips ?? []);

      return occurrencesIn(recurrence, month)
        .filter(({ key }) => !descartadas.has(key))
        .map(({ date, key }) => ({
          id: plannedTransactionId(recurrence.id, key),
          draft: plannedDraft(recurrence, month, date),
        }));
    })
    .filter((candidate) => !existing.has(candidate.id));
}

/** A chave de ocorrência de um lançamento já criado, para registrar o descarte. */
export function occurrenceKeyOf(recurrence: Recurrence, date: ISODate): string {
  return resolveFrequency(recurrence) === 'weekly' ? date : date.slice(0, 7);
}

const MESES_DO_ANO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * A repetição em palavras, do jeito que se fala.
 *
 * "toda terça" e "15 de janeiro, todo ano" dizem quando a conta cai sem
 * pedir que a pessoa traduza nada; "semanal" e "anual" obrigariam.
 */
export function describeFrequency(recurrence: Recurrence): string {
  switch (resolveFrequency(recurrence)) {
    case 'weekly': {
      if (!recurrence.weekday) return 'toda semana';
      return `${WEEKDAY_PREFIX[recurrence.weekday]} ${WEEKDAY_FULL[recurrence.weekday]}`;
    }
    case 'yearly': {
      if (!recurrence.monthOfYear) return 'uma vez por ano';
      const mes = MESES_DO_ANO[recurrence.monthOfYear - 1];
      return `${recurrence.dayOfMonth} de ${mes}, todo ano`;
    }
    case 'monthly':
    default:
      return `dia ${recurrence.dayOfMonth}, todo mês`;
  }
}

/** O rótulo curto da coluna da esquerda: o dia, ou o dia da semana. */
export function occurrenceBadge(recurrence: Recurrence): string {
  return resolveFrequency(recurrence) === 'weekly' && recurrence.weekday
    ? WEEKDAY_LABELS[recurrence.weekday]
    : String(recurrence.dayOfMonth).padStart(2, '0');
}

/** Próxima data em que a recorrência acontece, a partir de um mês. */
export function nextOccurrence(recurrence: Recurrence, fromMonth: ISOMonth): ISODate | null {
  const meses = monthsToPrepare(recurrence, fromMonth);
  for (const month of meses) {
    const ocorrencias = occurrencesIn(recurrence, month);
    if (ocorrencias.length > 0) return ocorrencias[0]!.date;
  }
  return null;
}
