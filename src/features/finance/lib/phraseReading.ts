import type { ParseContext, PhraseReading } from '../assistantTypes';
import { parsePhrase } from './phraseParser';
import { parseTask } from './taskParser';
import { hasReminderMark } from './reminderWords';
import { extractTime } from './phraseTime';

/**
 * As duas leituras de uma frase, e a escolha entre elas.
 *
 * **`parsePhrase` é chamada sem alteração e o retorno dela é guardado como
 * veio.** Não é preferência de estilo: é a razão de o assistente financeiro
 * continuar idêntico ao que está em produção. Se algum dia alguém precisar
 * "ajustar" o campo `transaction`, essa mudança está alterando comportamento
 * financeiro — e o teste de regressão das 45 frases dirá isso na hora.
 *
 * As duas leituras são sempre calculadas, mesmo quando só uma será usada: é o
 * que faz a troca ser instantânea e sem perda. Não há o que reinterpretar
 * quando a pessoa muda de ideia.
 */
export function readPhrase(phrase: string, context: ParseContext): PhraseReading {
  /**
   * A hora sai da frase **antes** da leitura financeira.
   *
   * Sem isto, "reunião às 15h" chega a `parsePhrase` com um `15` solto e vira
   * um gasto de R$ 15,00 — e aí a frase tem "valor", o que faz a decisão do
   * lado desandar em seguida.
   *
   * Quando a frase **não** tem marca de hora, a frase original é passada
   * intacta. É por isso que as 45 frases financeiras seguem pelo caminho
   * literalmente idêntico ao de antes: para elas, isto aqui é um `if` que não
   * faz nada.
   */
  const hora = extractTime(phrase);
  const transaction = parsePhrase(hora ? hora.rest : phrase, context);
  const task = parseTask(phrase, context);

  const temValor = transaction.amountCents !== null;

  /**
   * O sinal de tarefa tem duas fontes, e a segunda é a hora.
   *
   * "academia amanhã às 7h" não tem nenhuma palavra de lembrete — nem
   * "academia" nem "amanhã" são marcas —, mas uma frase que diz **a que horas**
   * é um compromisso, não um gasto. Sem esta segunda fonte, a frase cairia no
   * padrão e viraria lançamento, contrariando o exemplo da própria spec.
   */
  const temLembrete = hasReminderMark(phrase) || task.time !== null;

  /**
   * A tabela de decisão.
   *
   * A última linha — sem sinal de nenhum dos lados — é a que protege quem já
   * usa o app: "mercado" sozinho continua sendo lançamento, como é hoje.
   *
   * A ambígua escolhe lançamento porque é o lado que tem o valor, e refazer um
   * valor à mão custa mais do que refazer um título.
   */
  const kind = temLembrete && !temValor ? 'task' : 'transaction';
  const ambiguous = temValor && temLembrete;

  return { kind, ambiguous, transaction, task };
}
