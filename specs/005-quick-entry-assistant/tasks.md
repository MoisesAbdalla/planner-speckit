# Tasks: Assistente de Lançamento por Frase e por Voz

**Feature**: `005-quick-entry-assistant` | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

## Format: `[ID] [P?] [Story] Description`

`[P]` = pode rodar em paralelo (arquivo diferente, sem dependência pendente).
`[US1] [US2] [US3]` = a user story a que a tarefa pertence.

## Path Conventions

Aplicação web de página única, estrutura existente do projeto: `src/` para o
código, `tests/unit/` para os testes puros. Caminhos completos em cada tarefa.

**Testes são obrigatórios nesta feature**, não opcionais: o Princípio IV exige
teste para cálculo financeiro, e ler o valor de uma frase é exatamente isso.

---

## Phase 1: Setup

- [X] T001 Criar src/features/finance/assistantTypes.ts com `ParsedPhrase`, `ParseContext`, `DescriptionHistory` e `PendingDraft` exatamente como em data-model.md, incluindo os campos `typeFromPhrase`, `dateFromPhrase`, `categorySource` e `understood`
- [X] T002 [P] Criar src/features/finance/lib/textNormalize.ts com a normalização **única** da feature (minúsculas, sem acentos via NFD, espaços colapsados, pontuação das pontas removida) e tests/unit/textNormalize.test.ts cobrindo acento, caixa e espaço duplo

**Checkpoint**: os tipos e a normalização existem; nada mais depende de decisão

---

## Phase 2: Foundational (bloqueia todas as stories)

- [X] T003 Criar tests/unit/fixtures/phrases.ts com o **tipo do caso de teste** (frase + esperado de valor, tipo, data e categoria) e as categorias de exemplo usadas por todos os testes
- [X] T004 Escrever tests/unit/phraseParser.metrics.test.ts: o teste que lê as fixtures e **reprova abaixo de 90%** de acerto em valor, tipo e data (SC-002) e reprova na **primeira** ocorrência de valor preenchido em frase sem número (SC-003, sem tolerância). Ele falha até T012 — é o alvo, escrito antes

**Checkpoint**: o critério de sucesso existe como código executável, não como texto

---

## Phase 3: User Story 1 - Lançar escrevendo uma frase (Priority: P1) 🎯 MVP

**Goal**: escrever `20 no mercado` e ter o formulário abrindo preenchido, de qualquer tela.

**Independent Test**: escrever uma frase, ver o formulário preenchido, salvar e encontrar o lançamento na lista — sem tocar em voz nem em histórico.

### Interpretador (núcleo puro)

- [X] T005 [P] [US1] Implementar src/features/finance/lib/numberWords.ts (`wordsToNumber`): unidades 0–19, dezenas, centenas e `mil` compostos por `e`, até 999.999
- [X] T006 [P] [US1] Escrever tests/unit/numberWords.test.ts: `vinte`, `quarenta e cinco`, `cem`, `cento e vinte`, `mil e duzentos`, `três mil e duzentos`, e o retorno `null` para texto que não é número
- [X] T007 [P] [US1] Implementar src/features/finance/lib/phraseDates.ts (`extractDate`) devolvendo `{ date, rest }`: `anteontem` **antes** de `ontem` (senão a segunda casa dentro da primeira), `hoje`, `amanhã`, `depois de amanhã`, dia da semana com `passada`/`que vem`, `dia N` sobre o mês em exibição, e `DD/MM`
- [X] T008 [P] [US1] Escrever tests/unit/phraseDates.test.ts com `today` **injetado**, cobrindo a ordem anteontem/ontem, a regra do dia da semana sem qualificador (o mais recente que já passou), `dia N` no mês em exibição e o texto restante devolvido sem a expressão de data
- [X] T009 [US1] Implementar src/features/finance/lib/categoryHints.ts com o dicionário palavra → **nome canônico** de categoria e `matchCategory` resolvendo contra as categorias da pessoa por nome normalizado; devolve `null` quando a categoria não existe (FR-020)
- [X] T010 [US1] Escrever tests/unit/categoryHints.test.ts: nome de categoria dito na frase vence o dicionário; palavra do dicionário cuja categoria foi renomeada ou apagada devolve `null`; categoria arquivada nunca é sugerida
- [X] T011 [US1] Implementar a leitura do valor em src/features/finance/lib/phraseParser.ts usando **`parseAmountToCents` de src/shared/money.ts** para os centavos, com a regra do ponto (milhar só quando seguido de exatamente 3 dígitos) e a busca por extenso via `wordsToNumber`
- [X] T012 [US1] Implementar `parsePhrase` completo em src/features/finance/lib/phraseParser.ts na ordem do contrato — **data primeiro, valor depois** (senão o `5` de "dia 5" vira R$ 5,00), tipo, categoria, descrição — sem importar Firebase e sem ler o relógio
- [X] T013 [US1] Preencher tests/unit/fixtures/phrases.ts com **no mínimo 40 frases**: todos os formatos de dinheiro do FR-001, os por extenso do FR-002, todas as formas de data do FR-004, frases de receita e de gasto, **ao menos 5 sem valor algum** e ao menos 3 sem categoria reconhecível
- [X] T014 [US1] Escrever tests/unit/phraseParser.test.ts com os casos nomeados da tabela do contrato, incluindo as garantias que valem para toda entrada: nunca lança exceção, `categoryId` sempre nulo ou de uma categoria existente, `date` sempre válida, descrição sem o valor nem a data

**Checkpoint do núcleo**: T004 passa. O SC-002 e o SC-003 deixam de ser promessa.

### Caminho até o formulário

- [X] T015 [US1] Criar src/features/finance/AssistantContext.tsx com `pending`, `setPending` e `consume()` — `consume` **devolve e limpa**, para que voltar ao financeiro não reabra um rascunho velho e gere lançamento em dobro
- [X] T015a [US1] Carregar as categorias do usuário **dentro do `AssistantProvider`** em src/features/finance/AssistantContext.tsx: `useCategories` só é chamado hoje em Finance.tsx, e sem isso o assistente aberto do planner ficaria sem categorias e devolveria `categoryId` nulo sempre — FR-005 e US3 morreriam em silêncio justamente na tela que o FR-024 promete atender
- [X] T016 [US1] Montar o `AssistantProvider` dentro de `RequireAuth` em src/App.tsx, para que o contexto exista em toda tela autenticada e em nenhuma outra
- [X] T017 [US1] Extrair de src/features/finance/components/TransactionForm.tsx a escolha de categoria para uma função pura `resolveCategoryId(options, chosen, requireExplicit)` em src/features/finance/lib/formCategory.ts, preservando o comportamento atual quando `requireExplicit` é falso
- [X] T018 [US1] Escrever tests/unit/formCategory.test.ts provando os dois lados: sem `requireExplicit`, cai na primeira categoria como sempre; com ele, devolve vazio até haver escolha
- [X] T019 [US1] Acrescentar as props `prefill` e `requireExplicitCategory` a src/features/finance/components/TransactionForm.tsx, preenchendo os campos a partir de `ParsedPhrase` e deixando a categoria vazia quando não reconhecida (FR-008a). O guarda `if (!categoryId)` do `handleSubmit` **já existe** e não deve ser reescrito
- [X] T019a [US1] **Desenhar** o botão e o painel com a skill `frontend-design` **antes** de implementá-los (Princípio I: a interface é desenhada antes de ser construída), resolvendo a convivência com o trilho lateral do desktop e a navegação inferior do celular
- [X] T019b [US1] Exibir no formulário aberto pelo assistente **o que foi entendido da frase** e o que é padrão, consumindo `typeFromPhrase`, `dateFromPhrase` e `categorySource` de `ParsedPhrase` (FR-009) em src/features/finance/components/TransactionForm.tsx
- [X] T020 [US1] Criar src/features/finance/components/AssistantPanel.tsx: campo de texto, interpretação da frase, entrega do rascunho ao contexto e o caminho do FR-013 (não entendi → formulário com o texto na descrição). Sem microfone ainda
- [X] T021 [US1] Criar src/features/finance/components/AssistantButton.tsx e hospedá-lo em src/design/components/AppShell.tsx, presente em toda tela autenticada (FR-024), **sem cobrir a navegação inferior do celular**
- [X] T022 [US1] Fazer src/routes/Finance.tsx consumir o rascunho pendente ao montar e a cada mudança, abrindo o `TransactionForm` com `prefill` e `requireExplicitCategory`
- [X] T023 [US1] Implementar em src/routes/Finance.tsx o ajuste de mês após salvar **originado do assistente**: se o mês do lançamento difere do exibido, ir até ele (R9, SC-009). O salvamento manual **não** navega — a página distingue os dois pela origem do formulário
- [X] T024 [US1] Fazer o painel navegar para `/financas` quando aberto de outra tela, deixando o rascunho pendente para a página consumir ao montar (FR-026)
- [X] T025 [US1] Garantir que abrir e fechar o assistente não altera a tela por baixo — mês, rolagem e formulário aberto seguem como estavam (FR-025)

**Checkpoint**: lançar por frase escrita funciona de ponta a ponta, de qualquer tela. **Este é o MVP.**

---

## Phase 4: User Story 2 - Lançar falando (Priority: P2)

**Goal**: o microfone produz o mesmo texto que os dedos produziriam.

**Independent Test**: falar uma frase e ver o mesmo rascunho da US1; e, num navegador sem reconhecimento, ver o campo de texto funcionando por inteiro.

- [X] T026 [P] [US2] Criar src/types/speech-recognition.d.ts com as declarações que o TypeScript não traz (`SpeechRecognition`, `SpeechRecognitionEvent`, `SpeechRecognitionErrorEvent`) e o acesso via `window.SpeechRecognition ?? window.webkitSpeechRecognition`
- [X] T027 [US2] Implementar src/shared/useSpeechRecognition.ts expondo `supported`, `listening`, `transcript`, `error`, `start` e `stop`, com `lang = 'pt-BR'`, `continuous = false` e `interimResults = true`
- [X] T028 [US2] Mapear os erros por nome em src/shared/useSpeechRecognition.ts — `not-allowed`, `no-speech`, `audio-capture`, `network`, `aborted` — cada um com sua mensagem (FR-017). "Erro ao ouvir" não diz a ninguém o que fazer
- [X] T029 [US2] Acrescentar o microfone a src/features/finance/components/AssistantPanel.tsx, com estado de escuta visível e interrompível (FR-016), e a transcrição caindo no campo de texto **editável antes de virar rascunho** (FR-015)
- [X] T030 [US2] Fazer o microfone **desaparecer** quando `supported` é falso (FR-014) — não ficar cinza: um botão inerte parece defeito do app
- [X] T031 [US2] Confirmar que nenhum áudio é retido em src/shared/useSpeechRecognition.ts: o hook trabalha só com o texto devolvido pela API (FR-018)

**Checkpoint**: falar funciona onde há suporte; onde não há, nada na tela sugere recurso quebrado

---

## Phase 5: User Story 3 - Categoria pelo histórico (Priority: P3)

**Goal**: a segunda vez que você escrever "padaria", a categoria já vem.

**Independent Test**: lançar uma descrição incomum à mão, recarregar, escrever a mesma descrição e ver a categoria preenchida.

- [X] T032 [US3] Implementar src/features/finance/hooks/useDescriptionHistory.ts com **uma** leitura por sessão — `where('month', 'in', [mês, mês−1, mês−2])` em `users/{uid}/transactions` — na primeira abertura do assistente, mantida em memória (R6)
- [X] T033 [US3] Construir o mapa descrição normalizada → categoria mais usada, com empate resolvido pelo lançamento mais recente, em src/features/finance/hooks/useDescriptionHistory.ts
- [X] T034 [US3] Ligar o histórico como **segunda** tentativa em src/features/finance/lib/categoryHints.ts, antes do dicionário: o que a pessoa faz vale mais que a palavra genérica
- [X] T035 [US3] Escrever tests/unit/categoryHistory.test.ts: histórico vence dicionário; descrição inédita devolve `null`; empate vai para a mais recente; descrições que só diferem em acento ou caixa contam como a mesma

**Checkpoint**: as três user stories funcionais

---

## Phase 6: Regressão e Polish

**Purpose**: provar que o caminho manual não mudou, e terminar bonito

- [X] T036 Escrever tests/unit/transactionForm.regression.test.tsx — o **primeiro teste de componente do projeto**, com o `@testing-library/react` e o jsdom que já estão instalados: aberto sem as props novas, o formulário pré-seleciona a primeira categoria exatamente como hoje (FR-021)
- [X] T038 [P] Conferir que src/features/finance/lib/phraseParser.ts e seus auxiliares **não importam Firebase** nem leem o relógio, e que **nenhum arquivo do assistente** (`AssistantPanel.tsx`, `AssistantContext.tsx`, `AssistantButton.tsx`) chama `createTransaction` ou qualquer escrita — a fronteira do FR-012 vale para o assistente inteiro, não só para o parser
- [X] T039 Rodar a suíte completa (`npm test`, `npm run test:rules`, `npm run test:integration`), o lint, o `tsc -b` e o build
- [X] T040 Executar o bloco 1 de quickstart.md — a regressão do caminho manual — **antes** de usar o assistente pela primeira vez
- [X] T041 Executar os blocos 2 a 7 de quickstart.md, nos dois temas e nas duas larguras, incluindo a verificação em Firefox de que o microfone não aparece
- [X] T042 [P] Atualizar README.md com o assistente, a fronteira "ele nunca grava" e o fato de que, no Chrome, o áudio passa pelos servidores do Google para virar texto
- [ ] T043 Publicar apenas o hosting (`firebase deploy --only hosting`) — esta feature **não** altera regras do Firestore

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2. O núcleo (T005–T014) precisa estar de pé antes da UI (T015–T025)
- **US2 (Phase 4)**: depende da US1 — a voz só produz texto; quem o entende é a US1
- **US3 (Phase 5)**: depende da US1 (T009 existe) e é independente da US2
- **Polish (Phase 6)**: T036 pode ser escrito assim que T017 terminar, e **quanto antes melhor**: é ele que prova que o caminho manual não mudou

### Ordem que não pode ser trocada

- **T007 antes de T011**: a data sai da frase antes da busca por valor. Invertido, `gastei 20 dia 5` vira R$ 5,00 e ninguém percebe
- **T017 antes de T019**: extrair a escolha de categoria para função pura antes de acrescentar a prop, senão a regressão do FR-021 fica sem teste
- **T004 antes de T012**: o critério existe antes da implementação que ele mede

### Parallel Opportunities

- **T005/T006, T007/T008** — `numberWords` e `phraseDates` são arquivos independentes e podem ser feitos ao mesmo tempo
- **T026** pode ser escrito em paralelo com toda a Phase 3: é só declaração de tipo
- **T038 e T042** não tocam em nada que as outras tarefas mexem

---

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3.** Ao fim da US1, lançar por frase escrita
funciona de qualquer tela, com o formulário de sempre gravando. É entregável
sozinho: a voz é conforto, e o histórico é refinamento.

**A ordem interna da US1 é deliberada**: o interpretador inteiro, com testes,
**antes** de qualquer pixel. Ele é a parte que erra de formas silenciosas —
um centavo no lugar errado, um dia a menos — e é a única que pode ser provada
sem abrir o navegador. A UI depois dele é montagem.

**A fronteira que nenhuma tarefa pode cruzar**: o assistente não chama
`createTransaction` nem qualquer escrita. Se uma tarefa parecer pedir isso,
ela está errada — é o FR-010 e o FR-012 de uma vez só.
