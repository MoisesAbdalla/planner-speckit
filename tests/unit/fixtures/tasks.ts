/**
 * Frases de tarefa, com a data e a hora esperadas.
 *
 * As frases **sem hora** não são enfeite: são elas que provam o SC-004, o
 * critério absoluto — o assistente jamais preenche uma hora que a pessoa não
 * disse. Uma hora inventada coloca um compromisso falso na agenda.
 */

export interface TaskCase {
  phrase: string;
  /** Título esperado; `undefined` quando não vale a pena travar. */
  title?: string;
  /** Data esperada; `undefined` quando o esperado é hoje. */
  date?: string;
  /** `null` significa: a frase não tinha marca de hora, e o campo fica vazio. */
  time: string | null;
}

/** Terça, 1º de setembro de 2026 — a mesma referência do conjunto financeiro. */
export const HOJE = '2026-09-01';
export const MES_EM_EXIBICAO = '2026-09';

export const CASOS_TAREFA: TaskCase[] = [
  // — Com hora, em todas as formas (FR-009) —
  { phrase: 'academia amanhã às 7h', title: 'academia', date: '2026-09-02', time: '07:00' },
  { phrase: 'reunião com o contador dia 10 às 15h30', date: '2026-09-10', time: '15:30' },
  { phrase: 'dentista sexta às 9h', date: '2026-08-28', time: '09:00' },
  { phrase: 'consulta amanhã 14h', date: '2026-09-02', time: '14:00' },
  { phrase: 'aula hoje às 19h', date: '2026-09-01', time: '19:00' },
  { phrase: 'prova dia 20 às 8h30', date: '2026-09-20', time: '08:30' },
  { phrase: 'reunião às 7:30', time: '07:30' },
  { phrase: 'lembrar da consulta 07:30', time: '07:30' },
  { phrase: 'almoço meio-dia', time: '12:00' },
  { phrase: 'plantão meia-noite', time: '00:00' },
  { phrase: 'lembrar de ligar às 18h', time: '18:00' },
  { phrase: 'academia segunda às 6h', date: '2026-08-31', time: '06:00' },
  { phrase: 'reunião 15h', time: '15:00' },
  { phrase: 'compromisso às 23h', time: '23:00' },
  { phrase: 'aniversário da Ana dia 12 às 20h', date: '2026-09-12', time: '20:00' },

  // — SEM hora: as frases que provam o SC-004 —
  { phrase: 'lembrar de pagar o IPTU sexta', title: 'pagar iptu', date: '2026-08-28', time: null },
  { phrase: 'reunião com o contador', time: null },
  { phrase: 'lembrar de comprar pão amanhã', date: '2026-09-02', time: null },
  { phrase: 'preciso ligar para o médico', time: null },
  { phrase: 'marcar dentista', time: null },
  { phrase: 'agendar revisão do carro dia 15', date: '2026-09-15', time: null },
  { phrase: 'prova de matemática ontem', date: '2026-08-31', time: null },
  { phrase: 'lembrar de renovar o seguro em 28/10', date: '2026-10-28', time: null },
  { phrase: 'aula de inglês quinta', date: '2026-08-27', time: null },
  { phrase: 'consulta anteontem', date: '2026-08-30', time: null },
  { phrase: 'lembrete: levar o cachorro no veterinário', time: null },
  { phrase: 'preciso pagar a fatura', time: null },
  { phrase: 'aniversário do meu pai dia 3', date: '2026-09-03', time: null },
  { phrase: 'marcar reunião depois de amanhã', date: '2026-09-03', time: null },
  { phrase: 'lembrar de sexta', title: '', date: '2026-08-28', time: null },

  // — Números que NÃO são hora (a regra do R3) —
  { phrase: 'lembrar de comprar 3 pães', time: null },
  { phrase: 'preciso separar 20 folhas', time: null },
];

/** Só as frases sem hora — o SC-004 é medido sobre elas, sem tolerância. */
export const CASOS_SEM_HORA = CASOS_TAREFA.filter((c) => c.time === null);
