/**
 * Frases rotuladas com o lado esperado — lançamento ou tarefa.
 *
 * O grupo ambíguo existe porque a dúvida é real: `pagar 200 do IPTU` cabe nos
 * dois lados, e quem sabe é a pessoa. Nessas, o acerto não é escolher o lado
 * "certo" — é **anunciar a dúvida**. Contar de outro jeito premiaria o palpite
 * sortudo.
 */

export interface ReadingCase {
  phrase: string;
  /** `'ambigua'` = os dois lados têm sinal; espera-se `ambiguous: true`. */
  expected: 'transaction' | 'task' | 'ambigua';
}

export const CASOS_LEITURA: ReadingCase[] = [
  // — Claramente lançamento —
  { phrase: '20 no mercado', expected: 'transaction' },
  { phrase: 'gastei 47,90 no posto', expected: 'transaction' },
  { phrase: 'salário 3200', expected: 'transaction' },
  { phrase: 'R$ 1.200,00 aluguel', expected: 'transaction' },
  { phrase: 'recebi 500 de freela', expected: 'transaction' },
  { phrase: 'vinte reais no mercado', expected: 'transaction' },
  { phrase: 'cinema 35', expected: 'transaction' },

  // O par que separa hora de dinheiro (R3) — obrigatório neste conjunto.
  { phrase: 'paguei 15 no lanche', expected: 'transaction' },
  { phrase: 'reunião às 15h', expected: 'task' },

  // — Sem sinal de nenhum dos lados: continua lançamento, como hoje —
  { phrase: 'mercado', expected: 'transaction' },
  { phrase: 'uber', expected: 'transaction' },

  // — Claramente tarefa —
  { phrase: 'lembrar de pagar o IPTU sexta', expected: 'task' },
  { phrase: 'academia amanhã às 7h', expected: 'task' },
  { phrase: 'reunião com o contador dia 10 às 15h30', expected: 'task' },
  { phrase: 'marcar dentista', expected: 'task' },
  { phrase: 'preciso ligar para o médico', expected: 'task' },
  { phrase: 'aniversário da Ana dia 12', expected: 'task' },
  { phrase: 'prova de matemática quinta', expected: 'task' },
  { phrase: 'agendar revisão do carro', expected: 'task' },
  { phrase: 'aula de inglês às 19h', expected: 'task' },

  // — Ambíguas: valor E marca de lembrete —
  { phrase: 'pagar 200 do IPTU sexta', expected: 'ambigua' },
  { phrase: 'lembrar de pagar 200 do IPTU', expected: 'ambigua' },
  { phrase: 'preciso pagar 150 da consulta', expected: 'ambigua' },
  { phrase: 'marcar dentista, uns 300 reais', expected: 'ambigua' },
];
