import type { ISODate, ISOMonth } from '../../shared/dates';
import type { Category, MovementType } from './types';

/**
 * O que o assistente produz a partir de uma frase.
 *
 * Nada aqui é gravado: o assistente entrega esta estrutura ao formulário de
 * lançamento, que é quem grava. Se algum dia alguém precisar "salvar direto
 * daqui", isso é violação do FR-010 e do FR-012, não otimização.
 */

/** Qual das tentativas de categoria acertou — para explicar e para depurar. */
export type CategorySource = 'nome' | 'histórico' | 'dicionário';

export interface ParsedPhrase {
  /**
   * **`null` quando a frase não tinha número.** Absoluto: o assistente nunca
   * inventa valor (FR-007, SC-003). É a única garantia da feature sem
   * tolerância percentual, porque um valor inventado corrompe o saldo em
   * silêncio, enquanto uma categoria errada custa um toque.
   */
  amountCents: number | null;
  type: MovementType;
  /** `false` quando `type` é o padrão (gasto) e não veio da frase (FR-003). */
  typeFromPhrase: boolean;
  date: ISODate;
  /** `false` quando `date` é o padrão de hoje. */
  dateFromPhrase: boolean;
  description: string;
  /** `null` quando nenhuma das três tentativas acertou (FR-005, FR-008a). */
  categoryId: string | null;
  categorySource: CategorySource | null;
  /** `false` quando nada de útil foi extraído — dispara o FR-013. */
  understood: boolean;
}

/**
 * Tudo que o interpretador precisa saber, injetado por quem chama.
 *
 * `today` entra como parâmetro em vez de ser lido do relógio: é isso que
 * impede um teste de quebrar sozinho quando o dia virar.
 */
export interface ParseContext {
  categories: Category[];
  history: DescriptionHistory;
  today: ISODate;
  /** Mês em exibição — base de "dia 5" (quem olha agosto e diz "dia 5" quer agosto). */
  viewMonth: ISOMonth;
}

/** Descrição normalizada → id da categoria mais usada com ela. */
export type DescriptionHistory = Record<string, string>;

/**
 * O rascunho a caminho de **um dos dois** formulários.
 *
 * `kind` é o lado **final**, depois de a pessoa eventualmente ter trocado — e
 * pode diferir do lado que o assistente escolheu. Cada página reage só ao seu:
 * sem isso, chegar ao financeiro com uma tarefa pendente abriria o formulário
 * errado, preenchido com dados que não são dele.
 */
export interface PendingDraft {
  reading: PhraseReading;
  kind: ReadingKind;
  /** A frase original, para o caminho do FR-013. */
  phrase: string;
}

/**
 * A leitura de tarefa de uma frase.
 *
 * `time` é `null` sempre que a frase não trouxe **marca** de hora (`h`, `:`,
 * `às`, `meio-dia`, `meia-noite`). Número solto nunca vira hora — é a regra
 * que impede "paguei 15 no lanche" de virar compromisso das 15h.
 */
export interface ParsedTask {
  title: string;
  date: ISODate;
  /** `false` quando `date` é o padrão de hoje, e não veio da frase. */
  dateFromPhrase: boolean;
  /** **`null` quando a frase não tinha marca de hora.** Nunca inventada. */
  time: string | null;
  understood: boolean;
}

/** Os dois lados que uma frase pode ter. */
export type ReadingKind = 'transaction' | 'task';

/**
 * As duas leituras de uma frase, e qual delas foi escolhida.
 *
 * `transaction` é **exatamente** o que `parsePhrase` devolve — não uma cópia
 * adaptada. É isso que faz o assistente financeiro continuar idêntico: o
 * caminho dele chama literalmente a mesma função de antes.
 *
 * As duas são sempre calculadas, mesmo quando só uma será usada. É o que faz
 * a troca ser instantânea e sem perda: não há o que reinterpretar.
 */
export interface PhraseReading {
  kind: ReadingKind;
  /** Os dois lados tinham sinal: valor em dinheiro **e** marca de lembrete. */
  ambiguous: boolean;
  transaction: ParsedPhrase;
  task: ParsedTask;
}
