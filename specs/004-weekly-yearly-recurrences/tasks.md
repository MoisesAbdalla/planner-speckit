---

description: "Task list for 004-weekly-yearly-recurrences"
---

# Tasks: Recorrências Semanais e Anuais

**Input**: Design documents from `/specs/004-weekly-yearly-recurrences/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/firestore-recurrences.md](./contracts/firestore-recurrences.md)

**Tests**: obrigatórios na geração de datas e na idempotência (agregação de
dinheiro derivada — Princípio IV) e nas Security Rules (Princípio II). Esta é
a primeira feature que **altera** algo em produção, então há uma categoria a
mais: **testes de regressão**, que provam que as recorrências mensais já
gravadas continuam gerando exatamente os mesmos lançamentos.

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

**Purpose**: liberar a escrita do formato novo sem recusar o antigo

- [X] T001 Substituir o bloco `match /recurrences/{recId}` em firestore.rules pela versão de contracts/firestore-recurrences.md — validação por frequência, usando `get('frequency', 'monthly')` para que documento sem o campo continue aceito
- [X] T002 [P] Estender tests/rules/validation.test.ts com **os dois formatos lado a lado**: recorrência antiga (sem `frequency`, com `dayOfMonth`) continua aceita; semanal sem `dayOfMonth` mas com `weekday` aceita; semanal sem `weekday` recusada; anual sem `monthOfYear` recusada; `frequency` desconhecida recusada

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a aritmética de calendário e o modelo — tudo depende deles

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase terminar

- [X] T003 [P] Implementar em src/shared/dates.ts a função que devolve todas as datas de um dia da semana dentro de um mês, na convenção ISO já usada (1 = segunda)
- [X] T004 [P] Estender tests/unit/dates.test.ts com essa função (mês com 4 ocorrências; mês com 5; mês que começa no próprio dia da semana; virada de ano)
- [X] T005 Acrescentar `frequency`, `weekday` e `monthOfYear` como campos **opcionais** ao tipo `Recurrence` em src/features/finance/types.ts, com a ausência de `frequency` documentada como mensal e `weekday` reusando o tipo `Weekday` de src/shared/dates.ts — o app não pode ter duas convenções de dia da semana
- [X] T006 Implementar a resolução de frequência em src/features/finance/lib/recurrenceRules.ts (`frequency ?? 'monthly'`), num ponto único — nenhum outro lugar do código pode ler o campo cru
- [X] T006a Remover o `orderBy('dayOfMonth')` da consulta em src/features/finance/hooks/useRecurrences.ts e ordenar em memória — o Firestore **exclui do resultado todo documento sem o campo ordenado**, e a recorrência semanal não tem dia do mês: ela seria gravada com sucesso e depois sumiria da lista, das ativas e da geração, sem erro nenhum (research R8)
- [X] T006b [P] Escrever o teste que trava isso em tests/unit/recurrenceRules.test.ts ou em tests/integration/: uma recorrência sem `dayOfMonth` aparece entre as ativas e é considerada na geração
- [X] T006c Acrescentar `skips` (lista de chaves de ocorrência descartadas) ao tipo em src/features/finance/types.ts e fazer `pendingFor` ignorá-las em src/features/finance/lib/recurrenceRules.ts (research R7)
- [X] T006d Gravar o descarte ao excluir um lançamento de recorrência em src/features/finance/lib/transactionWrites.ts, na **mesma batch** que apaga o lançamento — sem isso, excluir o previsto o traz de volta na materialização seguinte (FR-012)
- [X] T006e [P] Escrever os testes do descarte em tests/unit/materializeRecurrences.test.ts (ocorrência descartada não é recriada; descartar uma não afeta as outras; a chave descartada é a mesma que a geração produziria)

**Checkpoint**: calendário e modelo prontos — user stories podem começar

---

## Phase 3: User Story 1 - Conta anual com antecedência (Priority: P1) 🎯 MVP

**Goal**: cadastrar IPVA, seguro e IPTU uma vez e enxergá-los previstos em
qualquer mês do próximo ano.

**Independent Test**: cadastrar uma anual com data daqui a oito meses,
navegar até aquele mês e conferir o previsto lá — e ausente nos meses
intermediários.

- [X] T007 [US1] Gerar a data da ocorrência anual em src/features/finance/lib/recurrenceRules.ts: só no mês `monthOfYear`, no `dayOfMonth`, com o mesmo clamp já usado (dia 31 em mês de 30; 29 de fevereiro em ano não bissexto)
- [X] T008 [US1] Manter a chave `rec_{recorrência}_{AAAA-MM}` para a anual em src/features/finance/lib/recurrenceRules.ts — ela gera no máximo uma por mês, e a chave por data seria mudança sem motivo
- [X] T009 [US1] Implementar o horizonte assimétrico em src/features/finance/lib/recurrenceRules.ts: 3 meses para semanal e mensal, e para a anual **apenas os meses que de fato recebem lançamento** dentro de 12 (research R3)
- [X] T010 [US1] Escrever os testes da anual em tests/unit/materializeRecurrences.test.ts (gera só no mês certo; ausente nos demais; 29 de fevereiro cai no 28; encerrada não gera; horizonte alcança 12 meses)
- [X] T010a [US1] Incluir os campos de repetição na assinatura que decide re-materializar, em src/features/finance/hooks/useMaterialization.ts — hoje ela é só `id:endMonth`, então editar frequência ou dia não geraria as ocorrências novas até recarregar a página
- [X] T011 [US1] Ajustar src/features/finance/lib/materializeRecurrences.ts para consultar só os meses que o horizonte indicar, **sem consultar 12 meses quando não há recorrência anual** — quem não usa paga o custo de hoje
- [X] T012 [US1] Acrescentar a frequência anual ao formulário em src/features/finance/components/RecurrenceForm.tsx, com dia e mês, mostrando só os campos que se aplicam e **trocando os campos ao trocar a frequência**, sem deixar visível o que não vale mais (FR-005)

**Checkpoint**: US1 entregável — a conta grande do ano já deixa de surpreender

---

## Phase 4: User Story 2 - Gasto semanal (Priority: P2)

**Goal**: cadastrar por dia da semana e ver os previstos em todas as
ocorrências do mês.

**Independent Test**: cadastrar uma despesa toda terça e conferir que aparece
em todas as terças do mês corrente e do seguinte, inclusive num mês com cinco.

- [X] T013 [US2] Gerar as datas da ocorrência semanal em src/features/finance/lib/recurrenceRules.ts, uma por ocorrência do dia da semana no mês
- [X] T014 [US2] Usar a chave `rec_{recorrência}_{AAAA-MM-DD}` **apenas na semanal** em src/features/finance/lib/recurrenceRules.ts — a chave por mês colapsaria as quatro ou cinco ocorrências num documento só (research R2)
- [X] T015 [US2] Escrever os testes da semanal em tests/unit/materializeRecurrences.test.ts (4 e 5 ocorrências no mês; idempotência com todas já criadas; criar só as que faltam; encerrada não gera; excluir uma não a faz voltar)
- [X] T016 [US2] Acrescentar a frequência semanal ao formulário em src/features/finance/components/RecurrenceForm.tsx, com o seletor de dia da semana reaproveitando os rótulos já usados no planner

**Checkpoint**: US1 e US2 funcionam de forma independente

---

## Phase 5: User Story 3 - Entender a lista (Priority: P3)

**Goal**: saber a frequência e a próxima data de cada recorrência sem abrir
nenhuma.

**Independent Test**: com uma de cada frequência cadastrada, a lista deixa
claro qual é qual e quando cada uma acontece de novo.

- [X] T017 [US3] Exibir a frequência em linguagem comum na lista em src/features/finance/components/RecurrenceList.tsx ("toda terça", "todo dia 5", "todo 15 de janeiro")
- [X] T018 [US3] Exibir a próxima data de cada recorrência em src/features/finance/components/RecurrenceList.tsx, calculada pelas regras de src/features/finance/lib/recurrenceRules.ts
- [X] T019 [US3] Permitir editar a data de repetição de qualquer frequência em src/features/finance/components/RecurrenceForm.tsx, preenchendo os campos com o que já está gravado (FR-019)

**Checkpoint**: todas as user stories funcionais

---

## Phase 6: Regressão e Polish

**Purpose**: provar que o que já estava em produção não mudou

- [X] T020 Escrever o **teste de regressão** em tests/unit/materializeRecurrences.test.ts: uma recorrência **sem** o campo `frequency` gera exatamente os mesmos lançamentos, com as mesmas chaves e datas, que gerava antes desta feature (FR-016, SC-005)
- [X] T021 [P] Conferir que nenhum lugar fora de src/features/finance/lib/recurrenceRules.ts lê `frequency` diretamente, para que a leitura defensiva viva num ponto só
- [X] T022 Rodar a suíte completa (`npm test`, `npm run test:rules`, `npm run test:integration`), o lint e o build
- [ ] T023 Executar o bloco 1 de quickstart.md — a verificação de regressão nas recorrências mensais reais — **antes** de cadastrar qualquer coisa nova
- [ ] T024 Executar os blocos 2 a 4 de quickstart.md, nos dois temas e nas duas larguras
- [X] T025 [P] Atualizar README.md com as três frequências e a regra de que ausência de frequência significa mensal
- [X] T026 Publicar as regras **antes** do hosting (`firebase deploy --only firestore:rules` e depois `--only hosting`), porque a versão nova grava recorrências num formato que as regras antigas recusam

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências. As regras precisam aceitar o formato
  novo antes de qualquer escrita real
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2
- **US2 (Phase 4)**: depende da Phase 2; T013 e T014 tocam o mesmo arquivo que
  T007–T009, então vêm depois
- **US3 (Phase 5)**: depende de US1 e US2 — a lista descreve o que elas criam
- **Regressão e Polish (Phase 6)**: T020 pode ser escrito assim que a Phase 2
  terminar, e quanto antes melhor: ele é a rede de segurança das demais

### Within Each User Story

- Geração de datas → chave de idempotência → horizonte → testes → formulário
- Cada story fecha com a verificação de que nada existente mudou

### Parallel Opportunities

- Setup: T002 em paralelo a T001
- Foundational: T003 e T004 em paralelo; T005 em paralelo a ambos
- US1: T007 a T009 no mesmo arquivo, sequenciais; T012 em paralelo a eles
- US2: T016 em paralelo a T013–T015
- Polish: T021 e T025 em paralelo

---

## Parallel Example: Foundational

```bash
# Calendario e modelo sao arquivos distintos:
Task: "Ocorrencias do dia da semana em src/shared/dates.ts"
Task: "Testes dessas ocorrencias em tests/unit/dates.test.ts"
Task: "Campos opcionais em src/features/finance/types.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational) → **T020 antes das demais**
2. Phase 3 (US1) completa
3. **PARE E VALIDE**: cadastrar o IPVA e navegar até o mês dele
4. A conta grande do ano já deixa de surpreender — pode publicar

### Incremental Delivery

1. Setup + Foundational → calendário e modelo prontos
2. + US1 → conta anual com um ano de antecedência (**MVP**)
3. + US2 → gasto semanal
4. + US3 → a lista fica legível com frequências misturadas
5. Phase 6 → regressão comprovada, validação e publicação

---

## Notes

- **Esta feature altera algo em produção.** O T020 não é burocracia: sem ele,
  uma quebra nas recorrências mensais só apareceria quando o aluguel do mês
  que vem não fosse lançado — ou fosse lançado duas vezes
- **A chave de idempotência da mensal não pode mudar.** Trocá-la faria o app
  não reconhecer os lançamentos já gravados e duplicar cada um deles
- **Ausência de `frequency` significa mensal**, e essa leitura vive num ponto
  só (T006, T021). Espalhá-la garante que um dos lugares vai esquecer
- **A consulta não pode ordenar por campo opcional** (T006a). É a falha mais
  silenciosa desta feature: a recorrência semanal seria gravada, a interface
  diria que deu certo, e ela nunca apareceria em lugar nenhum
- **Excluir um previsto precisa registrar o descarte** (T006c–T006e), senão
  ele volta. É defeito que já existe desde a feature 001
- Publicar as regras antes do hosting (T026)
- Commit atômico por tarefa ou grupo lógico, como nas features anteriores
