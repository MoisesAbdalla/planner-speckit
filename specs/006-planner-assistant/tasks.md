# Tasks: Assistente de Frase e Voz no Planner

**Feature**: `006-planner-assistant` | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Format: `[ID] [P?] [Story] Description`

`[P]` = pode rodar em paralelo (arquivo diferente, sem dependência pendente).
`[US1] [US2] [US3]` = a user story a que a tarefa pertence.

## Path Conventions

Estrutura existente do projeto: `src/` para o código, `tests/unit/` para os
testes puros. Caminhos completos em cada tarefa.

**Testes são obrigatórios**: o Princípio IV exige teste para cálculo
financeiro, e esta feature mexe na porta de entrada dele.

---

## Phase 1: Setup

- [X] T001 Acrescentar `ParsedTask`, `PhraseReading` e o `PendingDraft` com `kind` a src/features/finance/assistantTypes.ts conforme data-model.md, **sem alterar `ParsedPhrase`** — é a base do SC-005
- [X] T002 [P] Criar src/features/finance/lib/reminderWords.ts com a lista de marcas de lembrete (`lembrar`, `lembrete`, `preciso`, `marcar`, `agendar`, `reunião`, `consulta`, `aniversário`, `médico`, `dentista`, `prova`, `aula`) e `hasReminderMark`, comparando contra o texto normalizado

**Checkpoint**: os tipos existem e `ParsedPhrase` continua intocado

---

## Phase 2: Foundational (bloqueia todas as stories)

- [X] T003 Criar tests/unit/fixtures/tasks.ts com o tipo do caso e **30+ frases de tarefa**: todas as formas de hora do R3, as datas que a feature 005 já entende, frases sem hora e frases sem data
- [X] T004 Criar tests/unit/fixtures/readings.ts com **20+ frases rotuladas** em três grupos — claramente lançamento, claramente tarefa e deliberadamente ambíguas — incluindo **obrigatoriamente** o par `paguei 15 no lanche` e `reunião às 15h`
- [X] T005 Escrever tests/unit/phraseReading.regression.test.ts: para cada uma das **45 frases** de tests/unit/fixtures/phrases.ts, `readPhrase` devolve `kind: 'transaction'` e um `transaction` **idêntico campo a campo** ao retorno de `parsePhrase` (SC-005). Falha até T012 — é o alvo, escrito antes

**Checkpoint**: os três critérios existem como código executável antes do código que eles medem

---

## Phase 3: User Story 1 - Uma frase vira tarefa (Priority: P1) 🎯 MVP

**Goal**: `lembrar de pagar o IPTU sexta` abre o formulário de tarefa preenchido, de qualquer tela.

**Independent Test**: escrever uma frase de lembrete, ver o formulário de tarefa preenchido, salvar e encontrar a tarefa no dia certo — sem tocar em troca de lado nem em hora.

### Interpretador de tarefa

- [X] T006 [P] [US1] Implementar src/features/finance/lib/phraseTime.ts (`extractTime`) devolvendo `{ time, rest }`: `às 7h`, `7h`, `7h30`, `às 7:30`, `07:30`, `meio-dia`, `meia-noite`. **Número solto nunca é hora.** Hora fora de 0–23 ou minuto fora de 0–59 devolve `null` — descartar, nunca ajustar
- [X] T007 [P] [US1] Escrever tests/unit/phraseTime.test.ts com o par que separa hora de dinheiro: `reunião às 15h` devolve hora; `paguei 15 no lanche` devolve `null`. Mais as formas do R3 e as faixas inválidas
- [X] T008 [US1] Implementar src/features/finance/lib/taskParser.ts (`parseTask`) na ordem do contrato — **data, depois hora, depois título** — reusando `extractDate` do financeiro e estendendo a limpeza de ruído com as marcas de lembrete (elas são sinal para a decisão **e** ruído para o título)
- [X] T009 [US1] Escrever tests/unit/taskParser.test.ts: título de `lembrar de pagar o IPTU sexta` é `pagar o IPTU`; data padrão é hoje com `dateFromPhrase: false`; **hora ausente é `null`, nunca inventada**; título pode ser vazio (`lembrar de sexta`)
- [X] T010 [US1] Escrever tests/unit/taskParser.metrics.test.ts sobre tests/unit/fixtures/tasks.ts: reprova abaixo de **90%** de acerto em data e hora (SC-002) e reprova na **primeira** hora preenchida numa frase sem marca de hora (SC-004, sem tolerância)

### A decisão entre os dois lados

- [X] T011 [US1] Implementar `readPhrase` em src/features/finance/lib/phraseReading.ts chamando **`parsePhrase` sem alterar o retorno** e `parseTask`, e aplicando a tabela de decisão do R2 (sem sinal nenhum → `transaction`, que é o comportamento de hoje)
- [X] T012 [US1] Escrever tests/unit/phraseReading.test.ts com os casos nomeados do contrato, incluindo `mercado` → `transaction` e `reunião com o contador` → `task`

**Checkpoint do núcleo**: T005 passa. O assistente financeiro está provado idêntico, e só então a UI começa.

### Caminho até o formulário de tarefa

- [X] T013 [US1] Fazer o `PendingDraft` carregar `reading` e `kind` em src/features/finance/AssistantContext.tsx, e acrescentar `viewDate` (o dia em exibição no planner) ao lado do `viewMonth` que já existe
- [X] T014 [US1] Acrescentar a prop `prefill?: ParsedTask` a src/features/planner/components/TaskForm.tsx, preenchendo título, data e hora, e incluir a identidade do rascunho na `key` do corpo — senão a segunda tarefa seguida aparece com os campos da primeira
- [X] T014a [US1] Exibir no formulário de tarefa **o que foi entendido da frase** e o que é padrão, consumindo `dateFromPhrase` e a presença de hora de `ParsedTask` (FR-016), em src/features/planner/components/TaskForm.tsx — o `TransactionForm` já tem essa linha, e sem ela `dateFromPhrase` seria um campo que ninguém lê
- [X] T015 [US1] **Desenhar** a linha de leitura ao vivo e a troca com a skill `frontend-design` **antes** de implementá-las (Princípio I), garantindo que a linha caiba em ~375px sem empurrar o campo
- [X] T016 [US1] Fazer src/features/finance/components/AssistantPanel.tsx usar `readPhrase` e publicar o rascunho com o `kind` escolhido, navegando para `/planner/dia` quando o lado for tarefa e para `/financas` quando for lançamento
- [X] T016a [US1] Definir em src/features/finance/components/AssistantPanel.tsx **qual período alimenta a interpretação**: `extractDate` exige um mês, e o contexto passa a ter `viewMonth` (financeiro) e `viewDate` (planner). No planner, o mês vem de `monthOf(viewDate)`; fora dele, de `viewMonth`. Sem essa regra, "dia 5" escrito no planner em agosto viraria 5 de setembro se o financeiro estivesse em setembro — e o erro sairia calado
- [X] T017 [US1] Fazer src/routes/Planner.tsx consumir o rascunho pendente **apenas quando `kind === 'task'`**, abrindo o `TaskForm` com `prefill` — derivado do contexto, sem efeito que chama `setState`
- [X] T018 [US1] Fazer src/routes/Finance.tsx ignorar o rascunho quando `kind === 'task'`: sem isso, chegar ao financeiro com uma tarefa pendente abriria o formulário errado, preenchido com dados que não são dele
- [X] T019 [US1] Implementar em src/routes/Planner.tsx o ajuste do dia após salvar **originado do assistente**: se a data da tarefa difere do dia em exibição, ir até ela (FR-017, SC-008). O salvamento manual **não** navega
- [X] T020 [US1] Publicar o dia em exibição no contexto a partir de src/routes/Planner.tsx, para "dia 5" usar o período que a pessoa está olhando — como o financeiro já faz com o mês

**Checkpoint**: uma frase vira tarefa de ponta a ponta, de qualquer tela. **Este é o MVP.**

---

## Phase 4: User Story 2 - Trocar quando ele erra o palpite (Priority: P2)

**Goal**: ver qual leitura ele escolheu enquanto escreve, e trocar com um toque.

**Independent Test**: escrever uma frase ambígua, ver o aviso de dúvida, trocar e confirmar que os campos entendidos foram aproveitados.

- [X] T021 [US2] Exibir a leitura **ao vivo** embaixo do campo em src/features/finance/components/AssistantPanel.tsx, recalculando a cada tecla, sem _debounce_ — é aritmética sobre 140 caracteres, e o atraso só criaria um intervalo em que a linha discorda do texto na tela
- [X] T022 [US2] Escrever textos distintos para leitura confiante e ambígua em src/features/finance/components/AssistantPanel.tsx: "Entendi como tarefa" contra "Pode ser tarefa ou lançamento" (FR-005c). Dizer a mesma coisa nos dois casos desperdiça a única informação que faz a pessoa olhar quando olhar vale a pena
- [X] T023 [US2] Implementar a troca em src/features/finance/components/AssistantPanel.tsx, **sempre disponível** e destacada quando ambígua (FR-005a), trocando apenas o `kind` — as duas leituras já existem, então nada é reinterpretado
- [X] T024 [US2] Escrever tests/unit/phraseReading.metrics.test.ts sobre tests/unit/fixtures/readings.ts: reprova abaixo de **85%** de acerto do lado (SC-003), contando a ambígua como acerto **apenas quando `ambiguous` é verdadeiro**, qualquer que seja o lado escolhido

**Checkpoint**: o erro de palpite custa um toque, não um recomeço

---

## Phase 5: User Story 3 - A hora do compromisso (Priority: P3) — verificação e ampliação

**Goal**: `academia amanhã às 7h` chega com a hora preenchida.

**Nota honesta sobre esta fase**: a implementação da hora já foi entregue por
T006 e T008, dentro da US1 — o interpretador precisa da hora para **decidir o
lado**, então ela não podia esperar. O que sobra aqui é verificação de ponta a
ponta e ampliação do conjunto de frases. A fase não some porque a US3 continua
sendo testável de forma independente; ela só não tem código novo.

**Independent Test**: escrever frases com hora e verificar que ela chega ao campo do formulário e sai do título.

- [X] T025 [US3] Confirmar que a hora entendida chega ao campo de hora do formulário em src/features/planner/components/TaskForm.tsx e **sai do título**
- [X] T026 [US3] Estender tests/unit/fixtures/tasks.ts com `meio-dia`, `meia-noite`, `7h30`, `às 7:30` e ao menos 3 frases **sem hora**, que são as que provam o SC-004
- [X] T027 [US3] Verificar em tests/unit/phraseTime.test.ts que a hora sai da frase **antes** do valor: `reunião às 15h` não pode produzir lançamento de R$ 15,00 em nenhum caminho

**Checkpoint**: as três user stories funcionais

---

## Phase 6: Regressão e Polish

- [X] T028 Escrever tests/unit/taskForm.regression.test.tsx: aberto **sem** a prop `prefill`, o formulário de tarefa se comporta exatamente como hoje — campos vazios, data padrão, sem linha de leitura (FR-019)
- [X] T029 [P] Conferir que src/features/finance/lib/phraseParser.ts **não foi alterado** (`git diff` limpo nesse arquivo) e que tests/unit/fixtures/phrases.ts continua com as 45 expectativas originais — se uma quebrou, o código novo é que está errado
- [X] T030 [P] Conferir que nenhum arquivo do assistente chama `createTask`, `createTransaction` ou qualquer escrita: a fronteira do FR-013 vale igual para o lado novo
- [X] T030a [P] Conferir que a voz **não tem caminho separado** (FR-020): a transcrição cai no mesmo campo e passa pelo mesmo `readPhrase`, sem ramo próprio para tarefa
- [X] T031 Rodar a suíte completa (`npm test`, `npm run test:rules`, `npm run test:integration`), o lint, o `tsc -b` e o build
- [X] T032 Executar o bloco 1 de quickstart.md — a regressão do assistente financeiro — **antes** de escrever a primeira frase de tarefa
- [X] T033 Executar os blocos 2 a 7 de quickstart.md, nos dois temas e nas duas larguras
- [X] T034 [P] Atualizar README.md com as duas leituras, a regra de que número solto nunca é hora, e o fato de `parsePhrase` seguir intocada
- [X] T035 Publicar apenas o hosting (`firebase deploy --only hosting`) — esta feature **não** altera regras do Firestore

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2. O núcleo (T006–T012) precisa estar de pé antes da UI (T013–T020)
- **US2 (Phase 4)**: depende da US1 — só há o que trocar depois que as duas leituras existem
- **US3 (Phase 5)**: em grande parte já entregue por T006/T007 dentro da US1; esta fase fecha a ponta da UI e amplia as fixtures
- **Polish (Phase 6)**: T028 pode ser escrito assim que T014 terminar

### Ordem que não pode ser trocada

- **T005 antes de T013**: o teste de regressão das 45 frases precisa estar **verde** antes de qualquer pixel. É ele que responde se o assistente que já está em produção continua o mesmo
- **T006 antes de T008 e T011**: a hora precisa sair da frase antes do valor, senão `reunião às 15h` vira R$ 15,00
- **T011 chama `parsePhrase` sem tocá-la**: qualquer tarefa que proponha "ajustar" `ParsedPhrase` está alterando o comportamento financeiro em produção
- **T015 antes de T016 e T021**: a interface é desenhada antes de ser construída (Princípio I)

### Parallel Opportunities

- **T006/T007** — `phraseTime` e seu teste são arquivo próprio e não dependem de T008
- **T002** pode ser feito junto com toda a Phase 1
- **T029, T030 e T034** não tocam em nada que as outras tarefas mexem

---

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3.** Ao fim da US1, uma frase vira tarefa de
qualquer tela, com o formulário de sempre gravando. A troca é conforto; a hora
já vem junto porque o interpretador precisa dela para decidir o lado.

**A ordem interna da US1 é deliberada**: o interpretador inteiro, com testes,
**antes** de qualquer pixel — e, dentro dele, o teste de regressão das 45
frases antes de tudo. Esta feature mexe na porta de entrada de um assistente
que já está em produção e que você já usa; a única forma honesta de saber que
ele continua igual é perguntar a ele, frase a frase, antes de construir por
cima.

**A fronteira que nenhuma tarefa pode cruzar**: o assistente não grava. Nem
lançamento, nem tarefa. Se uma tarefa parecer pedir isso, ela está errada.
