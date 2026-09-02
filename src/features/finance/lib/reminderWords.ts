import { words } from './textNormalize';

/**
 * As palavras que puxam a frase para o lado da tarefa.
 *
 * São **dois grupos com papéis diferentes**, e a diferença não é gramatical —
 * é entre *anunciar* um lembrete e *descrever* o que precisa ser feito.
 * Confundir os dois custa o nome da tarefa.
 */

/**
 * Só anunciam. "Lembrar", "preciso", "marcar" avisam o app de que aquilo é um
 * compromisso, mas não dizem qual. Saem do título.
 */
export const REMINDER_ONLY = new Set([
  'lembrar',
  'lembrete',
  'lembra',
  'preciso',
  'marcar',
  'marcada',
  'agendar',
  'agendado',
  'compromisso',
]);

/**
 * Descrevem a tarefa — e por isso **ficam** no título.
 *
 * Os infinitivos estão aqui por um motivo específico do português: infinitivo
 * é intenção, passado é fato consumado. "pagar o IPTU sexta" é um lembrete;
 * "paguei 47,90 no posto" é um gasto que já aconteceu. São tokens diferentes,
 * então a distinção sai de graça — e é ela que faz a frase do FR-005d ser
 * reconhecida como ambígua.
 *
 * Sem este grupo, "marcar dentista" viraria uma tarefa sem nome nenhum.
 */
export const TASK_WORDS = new Set([
  'reuniao',
  'consulta',
  'aniversario',
  'medico',
  'dentista',
  'prova',
  'aula',
  'pagar',
  'comprar',
  'ligar',
  'levar',
  'buscar',
  'entregar',
  'renovar',
]);

/** Os dois grupos juntos decidem o lado da frase. */
export const REMINDER_MARKS = new Set([...REMINDER_ONLY, ...TASK_WORDS]);

/** A frase tem alguma marca de lembrete? Comparação sobre o texto normalizado. */
export function hasReminderMark(text: string): boolean {
  return words(text).some((palavra) => REMINDER_MARKS.has(palavra));
}
