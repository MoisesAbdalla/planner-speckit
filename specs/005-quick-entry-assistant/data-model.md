# Phase 1 — Modelo de dados

**Nada nesta feature é gravado.** Não há coleção nova, campo novo nem regra de
segurança nova: o Firestore só é **lido**, e a gravação continua sendo a do
formulário. As estruturas abaixo vivem em memória, do momento da frase até a
confirmação.

---

## `ParsedPhrase` — o resultado da interpretação

Produzido por `phraseParser.ts`. É o centro da feature.

| Campo | Tipo | Significado |
|---|---|---|
| `amountCents` | `number \| null` | Valor em centavos. **`null` quando a frase não tinha número** — nunca um palpite (FR-007) |
| `type` | `'expense' \| 'income'` | Gasto ou receita |
| `typeFromPhrase` | `boolean` | `false` quando `type` é o padrão (gasto) e não veio da frase (FR-003) |
| `date` | `ISODate` | Data do lançamento; hoje quando a frase não disse (FR-004) |
| `dateFromPhrase` | `boolean` | `false` quando `date` é o padrão de hoje |
| `description` | `string` | O que sobrou da frase, limpo (FR-006) |
| `categoryId` | `string \| null` | **`null` quando nenhuma das três tentativas acertou** (FR-005, FR-008a) |
| `categorySource` | `'nome' \| 'histórico' \| 'dicionário' \| null` | Qual tentativa acertou — para explicar e para depurar |
| `understood` | `boolean` | `false` quando nada de útil foi extraído; dispara o FR-013 |

**Por que os campos `...FromPhrase` existem**: sem eles, "gasto de hoje" e
"gasto sem tipo nem data ditos" chegariam ao formulário idênticos. São eles que
permitem ao FR-009 mostrar o que foi entendido de verdade, em vez de mostrar
os padrões como se fossem entendimento.

**Invariante que a suíte trava**: `amountCents` é `null` sempre que a frase não
contém número reconhecível — em dígitos ou por extenso. Nenhuma exceção,
nenhum percentual de tolerância (SC-003).

---

## `ParseContext` — o que o interpretador precisa saber

Entrada do parser, injetada por quem chama. Torna a função **determinística**,
que é o que a faz testável.

| Campo | Tipo | Papel |
|---|---|---|
| `categories` | `Category[]` | As categorias da própria pessoa. O parser nunca inventa nem cria (FR-020) |
| `history` | `DescriptionHistory` | Descrição normalizada → categoria mais usada |
| `today` | `ISODate` | Injetado, nunca lido do relógio dentro do parser |
| `viewMonth` | `ISOMonth` | Mês em exibição, base de `dia N` (R4) |

**`today` injetado** é o que impede um teste de quebrar sozinho quando o dia
virar — a mesma disciplina que `dates.ts` já segue no resto do projeto.

---

## `DescriptionHistory` — a memória das categorias

`Record<string, string>`: descrição normalizada → `categoryId`.

**Origem**: uma leitura de `users/{uid}/transactions` com
`where('month', 'in', [mês, mês−1, mês−2])`, feita **uma vez por sessão** na
primeira abertura do assistente (R6).

**Construção**: agrupa por descrição normalizada, escolhe a categoria mais
frequente; empate resolvido pelo lançamento mais recente.

**Normalização** (a mesma em toda a feature): minúsculas, sem acentos,
espaços colapsados, sem pontuação nas pontas. `Padaria` e `padaria ` são a
mesma chave; se não fossem, a memória se dividiria em variantes e pareceria
não funcionar.

**Não é dado do usuário**: é uma projeção do que já existe. Some ao recarregar
a página, e isso é correto — ela se reconstrói na próxima abertura.

---

## `CategoryHints` — o dicionário de palavras comuns

`Record<string, string>`: palavra normalizada → **nome canônico** de categoria
(`'mercado' → 'Alimentação'`).

**Mapeia nomes, não ids**, e só produz sugestão se existir uma categoria da
pessoa com aquele nome (comparação normalizada). Categoria renomeada ou
apagada simplesmente não gera sugestão — em vez de gerar uma errada, que é o
que aconteceria se o dicionário guardasse ids (FR-020).

---

## `PendingDraft` — o rascunho a caminho do formulário

O que o `AssistantContext` guarda entre o painel e a página financeira (R7).

| Campo | Tipo | Papel |
|---|---|---|
| `parsed` | `ParsedPhrase` | O que preencher no formulário |
| `phrase` | `string` | A frase original, para o caso de o FR-013 precisar dela |

**Ciclo de vida**: criado quando o painel interpreta; consumido pela página
financeira ao abrir o formulário; apagado imediatamente depois. Não sobrevive
a um recarregamento — e não deve: nada foi confirmado, então nada é devido.

---

## O que **não** muda

- `Transaction`, `TransactionDraft`, `Category`: intocados. O assistente
  produz exatamente o `TransactionDraft` que o formulário já produzia.
- `firestore.rules`: nenhuma regra nova. A feature só lê o que já podia ler.
- `monthStats`: atualizado pelo caminho de gravação existente, sem saber que o
  assistente existe.
