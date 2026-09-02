# Phase 1 — Modelo de dados

**Nada nesta feature é gravado de forma nova.** Nenhuma coleção, nenhum campo,
nenhuma regra de segurança. As tarefas continuam sendo gravadas pelo caminho
que já existe; as estruturas abaixo vivem em memória, da frase até a
confirmação.

---

## `ParsedTask` — a leitura de tarefa

| Campo | Tipo | Significado |
|---|---|---|
| `title` | `string` | O que sobrou da frase, sem data, hora, marcas de lembrete e comandos |
| `date` | `ISODate` | Data da tarefa; hoje quando a frase não disser |
| `dateFromPhrase` | `boolean` | `false` quando `date` é o padrão de hoje |
| `time` | `string \| null` | `"HH:mm"`. **`null` quando a frase não tinha marca de hora** — nunca inventada (FR-010) |
| `understood` | `boolean` | `false` quando nada de útil foi extraído |

**Invariante que a suíte trava**: `time` é `null` sempre que a frase não
contém marca de hora (`h`, `:`, `às`, `meio-dia`, `meia-noite`). Um número
solto nunca produz hora. É a regra que impede "paguei 15 no lanche" de virar
compromisso das 15h.

`title` **pode ser vazio** (`lembrar de sexta`). O formulário abre com o campo
em branco e o foco nele; o guarda que recusa tarefa sem nome já existe em
`TaskForm`.

---

## `PhraseReading` — as duas leituras e a escolha

| Campo | Tipo | Significado |
|---|---|---|
| `kind` | `'transaction' \| 'task'` | O lado escolhido |
| `ambiguous` | `boolean` | Os dois lados tinham sinal (R2) |
| `transaction` | `ParsedPhrase` | **Exatamente** o que `parsePhrase` devolve hoje |
| `task` | `ParsedTask` | A leitura nova |

**As duas leituras são sempre calculadas**, mesmo quando só uma será usada. É
o que faz a troca ser instantânea e sem perda (SC-007): não há o que
reinterpretar quando a pessoa muda de ideia.

**`transaction` não é uma cópia adaptada**: é o retorno de `parsePhrase`, sem
alteração. Se algum dia alguém precisar "ajustar" esse campo, a mudança está
alterando o comportamento financeiro que está em produção — e o teste de
regressão das 45 frases vai dizer isso na hora.

### A tabela de decisão

| Tem valor? | Tem marca de lembrete? | `kind` | `ambiguous` |
|---|---|---|---|
| não | sim | `task` | `false` |
| sim | não | `transaction` | `false` |
| sim | sim | `transaction` | **`true`** |
| não | não | `transaction` | `false` |

A última linha é a que protege quem já usa o app: `mercado` sozinho continua
sendo lançamento, como é hoje.

---

## `PendingDraft` — o rascunho a caminho de um dos formulários

Passa a carregar a leitura inteira e o lado escolhido pela pessoa, que pode
diferir do lado que o assistente escolheu (ela trocou).

| Campo | Tipo | Papel |
|---|---|---|
| `reading` | `PhraseReading` | As duas leituras |
| `kind` | `'transaction' \| 'task'` | O lado **final**, depois de eventual troca |
| `phrase` | `string` | A frase original |

**Quem consome o quê**: `routes/Finance.tsx` só reage a `kind === 'transaction'`
e `routes/Planner.tsx` só a `kind === 'task'`. As duas páginas ignoram o
rascunho da outra em vez de disputá-lo — sem isso, entrar no financeiro com um
rascunho de tarefa pendente abriria o formulário errado.

**Ciclo de vida**: criado quando a pessoa toca em Continuar; consumido pela
página correspondente ao abrir o formulário; apagado logo depois. Não
sobrevive a um recarregamento, e não deve: nada foi confirmado.

---

## `TaskDraft` — o que o formulário grava

Inalterado. O rascunho de tarefa vira exatamente o `TaskDraft` que o formulário
já produzia:

- `title`, `date`, `time` vindos de `ParsedTask`
- `notes: null`, `recurrence: null`, `startDate = date`, `endDate: null`

**A tarefa nasce sem repetição** (assumption da spec): "academia toda segunda"
cria uma tarefa única, e a repetição continua sendo escolhida no formulário.

---

## O que **não** muda

- **`ParsedPhrase` e `parsePhrase`**: intocados. É a base do SC-005.
- **`Task`, `TaskDraft`, `TaskOverride`**: intocados.
- **`firestore.rules`**: nenhuma regra nova.
- **As 45 frases de `tests/unit/fixtures/phrases.ts`**: nenhuma expectativa
  alterada. Se uma quebrar, o código novo é que está errado.
