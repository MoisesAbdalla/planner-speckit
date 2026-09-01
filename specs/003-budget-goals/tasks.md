---

description: "Task list for 003-budget-goals"
---

# Tasks: Metas de Orçamento

**Input**: Design documents from `/specs/003-budget-goals/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/firestore-goals.md](./contracts/firestore-goals.md)

**Tests**: obrigatórios na resolução da meta vigente e no cálculo de consumo —
é agregação de dinheiro derivada (Princípio IV) — e nas Security Rules da
subcoleção nova (Princípio II). A regra temporal (alterar o padrão não muda
meses passados) é o coração da feature e precisa de teste próprio.

**Organization**: agrupadas por user story, na ordem de prioridade da spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2, US3 conforme spec.md
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único de frontend (SPA) na raiz: `src/`, `tests/` — mesma estrutura
das features anteriores, conforme **Structure Decision** em [plan.md](./plan.md).

---

## Phase 1: Setup

**Purpose**: liberar a escrita da subcoleção nova antes de qualquer código
que dependa dela

- [X] T001 Adicionar o bloco `match /budgetGoals/{alvo}` em firestore.rules, copiando o contrato de contracts/firestore-goals.md — valida tipo do alvo, coerência entre `target`/`categoryId` e o id do documento, e ao menos uma versão
- [X] T002 [P] Escrever os testes das regras novas em tests/rules/budgetGoals.test.ts (usuário A não lê nem escreve metas de B; `target` desconhecido rejeitado; `categoryId` diferente do id do documento rejeitado; `versions` vazia rejeitada; `overrides` que não é mapa rejeitado; meta bem formada aceita). **Não** testar valor negativo aqui: as regras não inspecionam valores dentro de listas, e essa garantia é do app — fica no T006, para o teste não prometer o que a camada não entrega

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a regra temporal e o cálculo de consumo — tudo depende deles

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase terminar

- [X] T003 Definir os tipos `BudgetGoal`, `GoalVersion` e `GoalConsumption` conforme data-model.md em src/features/finance/types.ts
- [X] T004 Implementar a resolução da meta vigente em src/features/finance/lib/goals.ts: exceção do mês tem prioridade; sem exceção, vale a última versão com início ≤ mês; sem versão aplicável, **sem meta** — que é estado diferente de meta zero
- [X] T005 Implementar o cálculo de consumo em src/features/finance/lib/goals.ts: usado, previsto, restante, proporção, marca da entrada e estado (`within` abaixo de 80%, `near` de 80% a 100%, `over` acima), com meta zero tratada sem divisão por zero e a mesma base para teto e categoria
- [X] T006 Escrever os testes de meta vigente e consumo em tests/unit/goals.test.ts — incluindo **o teste central da feature**: acrescentar uma versão nova não altera o valor vigente de um mês anterior (FR-008, SC-006); mais meta zero com e sem gasto, ausência de meta, exceção de mês futuro, consumo que considera o mês inteiro mesmo quando a meta foi criada depois dos gastos (FR-017) e limites exatos das faixas (79,9% / 80% / 100% / 100,1%)
- [X] T007 Implementar as escritas em src/features/finance/lib/goalWrites.ts: definir padrão (acrescenta versão a partir do mês corrente, substituindo a versão do mesmo mês se existir), ajustar um mês, desfazer o ajuste e remover a meta (apaga o documento) — id determinístico `overall` ou id da categoria
- [X] T008 Implementar o hook de leitura em tempo real em src/features/finance/hooks/useBudgetGoals.ts, sobre a coleção inteira (é pequena: uma entrada por categoria mais o teto)
- [X] T008b Devolver também o **previsto por categoria** em src/features/finance/lib/summary.ts, hoje limitado ao efetivado, para que teto e categoria usem a mesma base (research R9) — mexe na função de dinheiro mais usada do app
- [X] T008c Estender tests/unit/summary.test.ts com o previsto por categoria (previsto não entra no efetivado; as duas somas fecham; categoria só com previsto aparece)
- [X] T008a [P] Implementar o primitivo compartilhado de marca em src/design/components/charts/LimitMark.tsx — um fio posicional sobre a barra, usado tanto pelo medidor quanto pelas barras de categoria, para que a mesma anotação não seja escrita duas vezes

**Checkpoint**: regra temporal testada — user stories podem começar

---

## Phase 3: User Story 1 - Saber se ainda posso gastar (Priority: P1) 🎯 MVP

**Goal**: teto do mês com acompanhamento no medidor que já existe, avisando
antes de estourar e destacando o excesso.

**Independent Test**: definir um teto, registrar gastos até passar de 80% e
conferir o sinal de aproximação; passar de 100% e conferir o destaque de
excesso, com o quanto passou.

- [ ] T009 [P] [US1] Aplicar a marca e os estados de aproximação e excesso em src/design/components/charts/Meter.tsx, e **trocar a escala quando existe meta**: a barra passa a medir gasto ÷ meta e a entrada do mês vira marca sobre ela; sem meta, continua gasto ÷ entrada (research R8). Nada pode depender só de cor (FR-014)
- [ ] T010 [US1] Implementar o modal de metas em src/features/finance/components/BudgetGoalsManager.tsx com o campo do teto geral, aceitando valor zero e rejeitando negativo (FR-007)
- [ ] T011 [US1] Abrir o modal a partir da tela de finanças em src/routes/Finance.tsx, ao lado das entradas de categorias e recorrências, mantendo a definição da primeira meta em no máximo 3 interações (SC-003)
- [ ] T012 [US1] Exibir o consumo do teto no medidor em src/features/finance/components/MonthSummary.tsx, incluindo o previsto ainda não confirmado e distinguindo-o do efetivado (FR-015)
- [ ] T013 [US1] Escrever o rótulo textual dos três estados em src/features/finance/components/MonthSummary.tsx — quanto sobra, "perto do limite" e "passou em R$ X" — para que a leitura não dependa da cor
- [ ] T014 [US1] Garantir que sem teto definido o resumo renderize exatamente o que renderizava antes, sem espaço vazio nem convite, em src/features/finance/components/MonthSummary.tsx (FR-020, SC-008)

**Checkpoint**: US1 entregável — o teto do mês já muda comportamento sozinho

---

## Phase 4: User Story 2 - Descobrir onde estou estourando (Priority: P2)

**Goal**: metas por categoria visíveis nas barras que já existem, com a
categoria em risco identificável de relance.

**Independent Test**: definir metas em duas categorias, estourar uma e ficar
abaixo na outra, e conferir que a lista identifica qual estourou sem comparar
números.

- [ ] T015 [P] [US2] Aplicar o primitivo de marca em src/design/components/charts/BarRow.tsx, com a mesma gramática do medidor
- [ ] T016 [US2] Acrescentar os campos de meta por categoria ao modal em src/features/finance/components/BudgetGoalsManager.tsx, listando as categorias não arquivadas
- [ ] T017 [US2] Avisar quando as metas por categoria somarem mais que o teto geral em src/features/finance/components/BudgetGoalsManager.tsx, **sem impedir o salvamento** (FR-009)
- [ ] T018 [US2] Exibir o consumo de cada meta nas barras em src/features/finance/components/CategoryBreakdown.tsx, com rótulo textual do estado e o previsto distinguido do efetivado — mesma base do teto geral (FR-015)
- [ ] T019 [US2] Manter as categorias sem meta exatamente como estão hoje — sem alerta e sem aparência de pendência — em src/features/finance/components/CategoryBreakdown.tsx (FR-016)
- [ ] T020 [US2] Parar de cobrar a meta de categoria arquivada, preservando o documento e o histórico, em src/features/finance/lib/goals.ts e src/features/finance/components/CategoryBreakdown.tsx (FR-021)

**Checkpoint**: US1 e US2 funcionam de forma independente

---

## Phase 5: User Story 3 - Ajustar um mês atípico (Priority: P3)

**Goal**: elevar a meta só de um mês, com volta automática ao padrão e sem
tocar no passado.

**Independent Test**: definir uma meta padrão, ajustá-la só no mês corrente,
conferir que o mês seguinte volta ao padrão e que alterar o padrão não muda
nenhum mês passado.

- [ ] T021 [US3] Acrescentar o ajuste do mês visualizado ao modal em src/features/finance/components/BudgetGoalsManager.tsx, separado do campo do padrão para que as duas intenções não se confundam
- [ ] T022 [US3] Implementar o desfazer do ajuste em src/features/finance/components/BudgetGoalsManager.tsx, devolvendo o mês ao padrão sem tocar nas versões (FR-005)
- [ ] T023 [US3] Sinalizar na exibição que o valor daquele mês é excepcional, e não o padrão, em src/features/finance/components/MonthSummary.tsx e CategoryBreakdown.tsx
- [ ] T024 [US3] Conferir navegando entre meses que o ajuste pertence ao mês e que alterar o padrão não reescreve meses passados, conforme o cenário 5 do bloco 3 de quickstart.md (SC-005, SC-006)

**Checkpoint**: todas as user stories funcionais

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T025 [P] Verificar que registrar um gasto não passa por nenhum código de meta, em src/features/finance/components/TransactionForm.tsx e src/features/finance/lib/transactionWrites.ts (FR-019, SC-004)
- [ ] T026 [P] Atualizar README.md com a seção de metas e a regra temporal — alterar o padrão não muda meses passados
- [ ] T027 Rodar a suíte completa (`npm test`, `npm run test:rules`, `npm run test:integration`), o lint e o build
- [ ] T028 Verificar os três estados em escala de cinza e sob deuteranopia no DevTools, sobre src/features/finance/components/MonthSummary.tsx e CategoryBreakdown.tsx (SC-007)
- [ ] T029 Percorrer as telas nas quatro combinações — tema claro e escuro × ~375px e ~1280px — conferindo o modal de metas e os dois pontos de exibição
- [ ] T030 Executar os quatro blocos de validação manual de quickstart.md
- [ ] T031 Publicar as regras **antes** do hosting (`firebase deploy --only firestore:rules` e depois `--only hosting`), porque a versão nova do app escreve numa subcoleção que as regras antigas recusam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências. As regras precisam existir antes de
  qualquer escrita real
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2
- **US2 (Phase 4)**: depende da Phase 2; reaproveita o modal criado em US1
- **US3 (Phase 5)**: depende de US1 e US2 — o ajuste mensal é uma camada
  sobre metas que já existem
- **Polish (Phase 6)**: depende das stories desejadas

### Within Each User Story

- Primitivo de gráfico → modal de edição → exibição → estado sem meta
- A verificação de "não regrediu para quem não usa" fecha cada story

### Parallel Opportunities

- Setup: T002 em paralelo a T001 (arquivos diferentes)
- Foundational: T004 e T005 no mesmo arquivo, sequenciais; T003 antes de
  ambos
- US1: T009 em paralelo a T010
- US2: T015 em paralelo a T016
- Polish: T025 e T026 em paralelo

---

## Parallel Example: User Story 1

```bash
# Primitivo e modal sao arquivos distintos:
Task: "Marca de limite em src/design/components/charts/Meter.tsx"
Task: "Modal de metas em src/features/finance/components/BudgetGoalsManager.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational)
2. Phase 3 (US1) completa
3. **PARE E VALIDE**: definir um teto e gastar até passar de 80%
4. Um teto de gasto mensal já muda comportamento — pode publicar

### Incremental Delivery

1. Setup + Foundational → regra temporal testada
2. + US1 → teto do mês funcionando (**MVP**)
3. + US2 → saber onde cortar, não só que precisa cortar
4. + US3 → mês atípico sem estragar o padrão
5. Phase 6 → validação final e publicação

---

## Notes

- **A regra temporal é o coração da feature.** Se alterar o padrão mudar como
  um mês passado foi avaliado, a implementação está errada — mesmo que tudo
  o mais funcione. O T006 existe para travar isso
- **Sem meta** e **meta zero** são estados diferentes: o primeiro não tem
  limite, o segundo tem limite zero. Confundi-los faria toda categoria sem
  meta aparecer estourada
- Registrar um gasto não pode passar por nenhum código de meta (T025)
- Publicar as regras antes do hosting (T031): a ordem inversa deixa o app
  novo escrevendo contra regras que o recusam
- Commit atômico por tarefa ou grupo lógico, como nas features anteriores
