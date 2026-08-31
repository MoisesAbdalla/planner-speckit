---

description: "Task list for 001-routine-finance-planner"
---

# Tasks: Planner de Rotina com Gestor Financeiro

**Input**: Design documents from `/specs/001-routine-finance-planner/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: incluídos apenas onde a constituição exige — cálculos financeiros
e expansão de recorrências (Princípio IV) e Security Rules (Princípio II).
Não é TDD completo em toda a UI.

**Organization**: tarefas agrupadas por user story para permitir
implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2, US3, US4 conforme spec.md
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único de frontend (SPA) na raiz do repositório: `src/`, `tests/`,
mais arquivos de configuração do Firebase na raiz — conforme
**Structure Decision** em [plan.md](./plan.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialização do projeto e ferramental

- [X] T001 Inicializar projeto Vite + React 19 + TypeScript strict na raiz (package.json, tsconfig.json, vite.config.ts, index.html, src/main.tsx)
- [X] T002 Instalar dependências do plano (firebase, react-router, date-fns, tailwindcss v4 + @tailwindcss/vite) e registrar o plugin Tailwind em vite.config.ts
- [X] T003 [P] Configurar ESLint + Prettier em eslint.config.js e .prettierrc
- [X] T004 [P] Configurar Vitest + @testing-library/react em vitest.config.ts e tests/setup.ts
- [ ] T005 [P] Criar .env.example com as 6 chaves VITE_FIREBASE_* de contracts/firestore-schema.md e adicionar .env.local ao .gitignore
  - BLOQUEADA: o ambiente do usuário tem uma regra de permissão que impede criar arquivos `.env*`. As seis chaves estão documentadas no README.md, e o app exibe uma tela listando as que faltarem.
- [X] T006 [P] Criar firebase.json (hosting + emuladores auth/firestore) e firestore.indexes.json com os índices compostos de contracts/firestore-schema.md
- [X] T007 [P] Criar public/manifest.webmanifest e ícones PWA em public/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestrutura que TODAS as user stories precisam — sistema de
design, helpers de dinheiro/data, Firebase, autenticação básica e shell.

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase terminar

> **Nota sobre autenticação**: login básico (e-mail/senha) fica aqui porque
> US1/US2 exigem "usuário autenticado" para serem testáveis. A US3 cobre o
> que resta do escopo dela: Google, recuperação de senha, logout e a
> validação de sincronização/isolamento multi-dispositivo.

- [X] T008 Definir o sistema de design (invocar a skill `frontend-design`) e escrever os tokens em src/design/tokens.css — tipografia, paleta, espaçamento, raios (Princípio I)
- [X] T009 [P] Implementar primitivos Button, Card, Input, Select e Modal em src/design/components/
- [X] T010 [P] Implementar conversão e formatação de moeda (centavos ↔ R$ pt-BR, parse de input) em src/shared/money.ts
- [X] T011 [P] Escrever testes unitários de moeda em tests/unit/money.test.ts (arredondamento, parse "1.234,56", valores ≤ 0)
- [X] T012 [P] Implementar helpers de data (YYYY-MM-DD, month, clamp de dia do mês, locale pt-BR) em src/shared/dates.ts
- [X] T013 [P] Escrever testes unitários de data em tests/unit/dates.test.ts (dia 31 em fevereiro → último dia; limites de semana/mês)
- [X] T014 Inicializar o Firebase (app, auth, firestore) lendo variáveis de ambiente em src/firebase.ts
- [X] T015 Implementar AuthContext e hook useAuth (login e cadastro e-mail/senha, sessão persistente) em src/features/auth/AuthContext.tsx
- [X] T016 Configurar rotas e guarda de autenticação (/login, /, /financas, /planner/:view) em src/App.tsx e src/routes/
- [X] T017 Implementar seed idempotente de perfil e categorias padrão no primeiro login em src/features/auth/lib/bootstrapUser.ts
- [X] T018 Implementar o shell responsivo com navegação mobile-first em src/design/components/AppShell.tsx
- [X] T019 [P] Implementar detecção de conexão e banner de offline em src/shared/connection.ts (FR-021)
- [X] T019a [P] Implementar retenção de rascunho em falha de escrita (nada é limpo; a mensagem distingue offline de erro) nos três formulários: src/features/finance/components/TransactionForm.tsx, RecurrenceForm.tsx e src/features/planner/components/TaskForm.tsx (FR-021, segunda metade)
- [X] T020 Copiar o contrato de segurança para firestore.rules na raiz e publicá-lo no emulador e no projeto
- [X] T021 Montar o harness de testes de Security Rules (@firebase/rules-unit-testing + emulador) em tests/rules/setup.ts

**Checkpoint**: fundação pronta — user stories podem começar

---

## Phase 3: User Story 1 - Registrar e acompanhar gastos e ganhos do mês (Priority: P1) 🎯 MVP

**Goal**: registrar gastos/ganhos com valor, categoria, descrição e data e
ver o resumo do mês (entradas, saídas, saldo real, acumulado, por categoria).

**Independent Test**: criar conta, registrar 3 gastos e 1 ganho e conferir
que os totais e a distribuição por categoria do mês estão corretos.

- [X] T022 [P] [US1] Definir tipos Transaction e Category conforme data-model.md em src/features/finance/types.ts
- [X] T023 [P] [US1] Implementar funções puras de resumo mensal (entradas, saídas, saldo real, saldo previsto, gastos por categoria) em src/features/finance/lib/summary.ts
- [X] T024 [P] [US1] Escrever testes unitários do resumo mensal em tests/unit/summary.test.ts (Princípio IV — totais batem centavo a centavo, mês vazio = zeros)
- [X] T025 [US1] Implementar hook useTransactions(month) com onSnapshot em src/features/finance/hooks/useTransactions.ts
- [X] T026 [US1] Implementar hook useCategories (não arquivadas, ordenadas) em src/features/finance/hooks/useCategories.ts
- [X] T027 [US1] Implementar escritas de movimentação (create/update/delete) atualizando monthStats na mesma batch com `FieldValue.increment()` — nunca read-then-write, para não perder escritas concorrentes — em src/features/finance/lib/transactionWrites.ts
- [X] T028 [US1] Escrever testes unitários dos deltas de monthStats em tests/unit/monthStats.test.ts (criar, editar valor, excluir, trocar de mês)
- [X] T029 [US1] Implementar formulário de movimentação (valor, tipo, categoria, data, descrição; rejeita valor ≤ 0 com mensagem) em src/features/finance/components/TransactionForm.tsx
- [X] T030 [US1] Implementar lista de movimentações do mês em src/features/finance/components/TransactionList.tsx
- [X] T031 [US1] Implementar card de resumo mensal (saldo do mês em destaque, acumulado como secundário, gastos por categoria) em src/features/finance/components/MonthSummary.tsx
- [X] T032 [US1] Implementar hook de saldo acumulado lendo monthStats em src/features/finance/hooks/useAccumulated.ts (FR-007a)
- [X] T032a [US1] Implementar reconstrução de monthStats a partir das transactions (varre os meses do usuário e regrava os agregados) em src/features/finance/lib/rebuildMonthStats.ts — garante que o cache nunca seja a única fonte de verdade (Princípio IV)
- [X] T032b [P] [US1] Escrever testes unitários da reconstrução em tests/unit/rebuildMonthStats.test.ts (cache divergente é corrigido; resultado igual à soma direta das movimentações efetivadas)
- [X] T033 [US1] Implementar navegação entre meses em src/features/finance/components/MonthNavigator.tsx
- [X] T034 [US1] Implementar diálogo de confirmação de exclusão em src/design/components/ConfirmDialog.tsx e ligá-lo à exclusão de movimentações (FR-009)
- [X] T035 [US1] Implementar gestão de categorias (criar, renomear, arquivar) em src/features/finance/components/CategoryManager.tsx (FR-006)
- [X] T036 [US1] Montar a página financeira integrando resumo, lista, formulário e navegação em src/routes/Finance.tsx
- [X] T037 [US1] Implementar estados vazio/carregando/erro da página financeira e verificar visualmente em ~375px e ~1280px (Princípio III)

**Checkpoint**: US1 funcional e testável de forma independente — MVP entregável

---

## Phase 4: User Story 2 - Planejar a rotina diária, semanal e mensal (Priority: P2)

**Goal**: criar tarefas (avulsas e recorrentes) e vê-las nas visões de dia,
semana e mês, marcando ocorrências como concluídas.

**Independent Test**: criar uma tarefa avulsa para hoje e uma recorrente
seg/qua/sex; conferir que aparecem nos dias certos nas três visões e que
concluir a de hoje não afeta as próximas ocorrências.

- [X] T038 [P] [US2] Definir tipos Task, Recur e TaskOverride conforme data-model.md em src/features/planner/types.ts
- [X] T039 [P] [US2] Implementar expansão virtual de recorrências (daily, weekly por dias da semana, monthly com clamp) aplicando overrides em src/features/planner/lib/expandTasks.ts
- [X] T040 [P] [US2] Escrever testes unitários da expansão em tests/unit/expandTasks.test.ts (os 3 padrões, meses curtos, override de conclusão e de exclusão)
- [X] T041 [US2] Implementar hooks useTasks(range) e useTaskOverrides(range) com onSnapshot em src/features/planner/hooks/useTasks.ts
- [X] T042 [US2] Implementar escritas de tarefa e override (concluir/desmarcar, editar e excluir ocorrência vs série) em src/features/planner/lib/taskWrites.ts
- [X] T043 [US2] Implementar formulário de tarefa (título, data, horário opcional, notas, recorrência) em src/features/planner/components/TaskForm.tsx
- [X] T044 [US2] Implementar item de tarefa com toggle de conclusão e destaque de atrasado em src/features/planner/components/TaskItem.tsx (FR-016, FR-018)
- [X] T045 [US2] Implementar visão do dia em src/features/planner/components/DayView.tsx
- [X] T046 [US2] Implementar visão da semana em src/features/planner/components/WeekView.tsx
- [X] T047 [US2] Implementar visão do mês em src/features/planner/components/MonthView.tsx
- [X] T047a [US2] Implementar navegação entre períodos (dia, semana e mês anterior/seguinte, com atalho "hoje") em src/features/planner/components/PeriodNavigator.tsx (FR-014)
- [X] T048 [US2] Implementar diálogo "esta ocorrência ou toda a série?" em src/features/planner/components/ScopeDialog.tsx (FR-017)
- [X] T049 [US2] Montar a página do planner com alternância entre as três visões e o navegador de períodos em src/routes/Planner.tsx e verificar visualmente em ~375px e ~1280px

**Checkpoint**: US1 e US2 funcionam de forma independente

---

## Phase 5: User Story 3 - Usar a mesma conta no PC e no celular (Priority: P3)

**Goal**: completar a autenticação (Google, recuperação de senha, logout) e
comprovar sincronização em tempo real e isolamento total entre usuários.

**Independent Test**: entrar com a mesma conta em duas janelas, registrar um
gasto em uma e vê-lo aparecer na outra em ≤5s; confirmar que outra conta não
enxerga esses dados.

- [X] T050 [P] [US3] Implementar login com Google (popup no desktop, redirect no mobile) em src/features/auth/lib/googleSignIn.ts (FR-001)
- [X] T051 [P] [US3] Implementar recuperação de senha por e-mail em src/features/auth/components/PasswordReset.tsx (FR-004)
- [X] T052 [US3] Finalizar as telas de login e cadastro com o sistema de design em src/features/auth/components/AuthForm.tsx
- [X] T053 [US3] Implementar logout com limpeza de estado local no shell em src/design/components/AppShell.tsx (FR-003)
- [X] T054 [US3] Escrever testes de isolamento por UID em tests/rules/isolation.test.ts (usuário A não lê nem escreve dados de B — FR-002)
- [X] T055 [US3] Escrever testes de validação de shape das rules em tests/rules/validation.test.ts (amountCents ≤ 0 rejeitado, month ≠ prefixo de date rejeitado, delete de categoria negado)
- [X] T056 [US3] Validar sincronização entre dois dispositivos/janelas em ≤5s conforme o cenário 4 de quickstart.md (SC-003)

**Checkpoint**: acesso multiplataforma comprovado, com dados isolados por conta

---

## Phase 6: User Story 4 - Gastos e ganhos recorrentes automáticos (Priority: P4)

**Goal**: cadastrar recorrências mensais que geram lançamentos *previstos*,
confirmáveis com um toque, inclusive de dentro do planner.

**Independent Test**: cadastrar "Aluguel dia 5"; conferir lançamento previsto
no mês atual e nos seguintes, confirmar um deles (saldo real atualiza),
editar só um mês e encerrar a recorrência sem afetar o passado.

- [X] T057 [P] [US4] Adicionar o tipo Recurrence conforme data-model.md em src/features/finance/types.ts
- [X] T058 [P] [US4] Implementar materialização de recorrências com ID determinístico `rec_{recurrenceId}_{YYYY-MM}`, clamp de dia e create-if-missing (horizonte mês atual + 2) em src/features/finance/lib/materializeRecurrences.ts
- [X] T059 [P] [US4] Escrever testes unitários da materialização em tests/unit/materializeRecurrences.test.ts (idempotência entre execuções, dia 31 em fevereiro, recorrência encerrada não gera)
- [X] T060 [US4] Implementar hook useRecurrences (ativas e encerradas) em src/features/finance/hooks/useRecurrences.ts
- [X] T061 [US4] Implementar formulário de recorrência (tipo, valor, categoria, dia do mês, encerrar) em src/features/finance/components/RecurrenceForm.tsx (FR-010)
- [X] T062 [US4] Implementar lista e gestão de recorrências em src/features/finance/components/RecurrenceList.tsx
- [X] T063 [US4] Implementar a ação de confirmar (planned → confirmed) com um toque, atualizando monthStats, em src/features/finance/lib/transactionWrites.ts (FR-010a)
- [X] T064 [US4] Disparar a materialização no login e ao navegar para um mês futuro em src/features/finance/hooks/useMaterialization.ts
- [X] T065 [US4] Aplicar distinção visual de lançamento previsto na lista e exibir saldo real vs previsto no resumo em src/features/finance/components/TransactionList.tsx e MonthSummary.tsx (FR-007)
- [X] T066 [US4] Exibir lançamentos previstos do dia nas três visões do planner, com visual distinto e confirmação no local, em src/features/planner/components/PlannedFinanceItem.tsx e nas views de US2 (FR-018a)
- [X] T067 [US4] Permitir editar apenas o lançamento de um mês sem afetar os demais em src/features/finance/components/TransactionForm.tsx

**Checkpoint**: todas as user stories funcionais

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T068 [P] Revisar acessibilidade dos primitivos (foco visível, labels, contraste) em src/design/components/
- [X] T069 [P] Escrever README.md com setup do Firebase, variáveis de ambiente e scripts
- [X] T070 [P] Publicar rules e índices com `firebase deploy --only firestore:rules,firestore:indexes`
- [X] T071 Verificar visualmente todas as telas em ~375px e ~1280px (Princípio III, SC-006)
- [X] T072 Executar os 6 blocos de validação manual de quickstart.md, incluindo offline e edge cases
- [X] T073 Gerar build de produção e publicar no hosting conforme quickstart.md
- [X] T074 Revisar conformidade com os 5 princípios de .specify/memory/constitution.md antes de encerrar a feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2
- **US2 (Phase 4)**: depende da Phase 2 — independente de US1
- **US3 (Phase 5)**: depende da Phase 2; os testes de rules ficam mais
  significativos após US1 existir (dados reais para isolar)
- **US4 (Phase 6)**: depende de US1 (reutiliza transactions, monthStats e
  resumo). A tarefa T066 também depende das views de US2
- **Polish (Phase 7)**: depende das stories desejadas estarem prontas

### Within Each User Story

- Tipos → funções puras (+ testes) → hooks → componentes → página
- Cálculo financeiro e expansão de recorrência têm testes **antes do merge**
  (Princípio IV), não necessariamente antes do código
- Cada story termina com verificação visual mobile + desktop

### Parallel Opportunities

- Setup: T003–T007 em paralelo
- Foundational: T009–T013, T019 e T019a em paralelo (após T008 definir os tokens)
- US1: T022, T023, T024 em paralelo; T032b em paralelo após T032a
- US2: T038, T039, T040 em paralelo
- US3: T050 e T051 em paralelo
- US4: T057, T058, T059 em paralelo
- US2 e US3 podem ser tocadas em paralelo a US1 por pessoas diferentes; US4
  espera US1

---

## Parallel Example: User Story 1

```bash
# Lançar juntas as bases de US1 (arquivos distintos):
Task: "Definir tipos Transaction e Category em src/features/finance/types.ts"
Task: "Implementar funções puras de resumo em src/features/finance/lib/summary.ts"
Task: "Escrever testes de resumo em tests/unit/summary.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational)
2. Phase 3 (US1) completa
3. **PARE E VALIDE**: registrar gastos/ganhos e conferir o resumo do mês
4. Já é utilizável no dia a dia — pode publicar

### Incremental Delivery

1. Setup + Foundational → base pronta
2. + US1 → controle financeiro do mês funcionando (**MVP**)
3. + US2 → planner de rotina completo
4. + US3 → uso comprovado em PC e celular, com isolamento testado
5. + US4 → recorrências automáticas e integração planner ↔ financeiro
6. Phase 7 → polimento, validação final e publicação

---

## Notes

- `[P]` = arquivos diferentes, sem dependência entre si
- IDs com sufixo (T019a, T032a, T047a) foram inseridos por `/speckit-analyze`
  sem renumerar as tarefas existentes — mesma convenção dos requisitos
  FR-007a/FR-010a/FR-018a da spec
- Commit atômico por tarefa ou grupo lógico (Fluxo de Desenvolvimento da
  constituição)
- Nenhuma tarefa de story quebra a anterior: cada checkpoint é entregável
- Valores sempre em centavos; datas sempre `YYYY-MM-DD` (sem timezone)
