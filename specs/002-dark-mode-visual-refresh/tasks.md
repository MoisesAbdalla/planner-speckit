---

description: "Task list for 002-dark-mode-visual-refresh"
---

# Tasks: Modo Escuro e Refinamento Visual

**Input**: Design documents from `/specs/002-dark-mode-visual-refresh/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/design-tokens.md](./contracts/design-tokens.md)

**Tests**: incluídos onde a constituição exige — a série mensal é agregação de
dinheiro derivada (Princípio IV) — e na lógica de tema, que tem casos-limite
reais (armazenamento bloqueado, preferência ausente). A aparência em si é
verificada visualmente e pelo validador de paleta.

**Organization**: agrupadas por user story, na ordem de prioridade da spec.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US1, US2, US3 conforme spec.md
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único de frontend (SPA) na raiz: `src/`, `tests/` — mesma estrutura da
feature 001, conforme **Structure Decision** em [plan.md](./plan.md).

---

## Phase 1: Setup

**Purpose**: tornar repetível a verificação que sustenta a paleta

- [X] T001 Adicionar o script `validate:palette` em package.json, rodando o validador da skill `dataviz` nas duas paletas (claro sobre `#FBF9F5` e escuro sobre `#16211D`), para que a revalidação exigida pelo contrato seja um comando só

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: a camada de tokens nos dois temas — tudo depende dela

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase terminar

- [X] T002 Reescrever src/design/tokens.css com os tokens nomeados por papel e os dois temas — `:root` para o claro e `:root[data-theme="dark"]` para o escuro — usando exatamente os valores de contracts/design-tokens.md, e declarar `color-scheme` em cada tema
- [X] T003 [P] Criar a paleta validada de categorias em src/design/palette.ts: 8 slots com valor claro e escuro, o cinza de "Outros", e a função que devolve o slot estável de uma categoria a partir do `sortOrder` (nunca da posição no ranking — data-model.md, regra 3)
- [X] T004 Expor os slots da paleta como custom properties nos dois temas em src/design/tokens.css, para que o SVG dos gráficos troque de tema sem JavaScript
- [X] T005 Fazer **todo** o app derivar a cor da categoria do slot validado, não do campo `color` gravado — src/features/finance/lib/summary.ts (ponto central de derivação), src/features/finance/types.ts, src/features/auth/lib/bootstrapUser.ts, src/features/finance/components/TransactionList.tsx (ponto da lista) e src/features/finance/components/CategoryManager.tsx (amostra e criação de categoria nova). Deixar uma categoria com cor no gráfico e outra na lista quebraria o FR-016 e manteria vivo o defeito de daltonismo. O campo `color` permanece gravado e passa a ser ignorado — sem migração de dados
- [X] T006 Verificar por cálculo o contraste dos tokens de texto nos dois temas (ink ≥ 7:1, ink-soft e ink-faint ≥ 4,5:1 sobre `paper` e sobre `paper-raised`) e ajustar os valores em src/design/tokens.css até passarem (SC-005)

**Checkpoint**: tokens prontos nos dois temas — user stories podem começar

---

## Phase 3: User Story 1 - Usar o app à noite sem ofuscar (Priority: P1) 🎯 MVP

**Goal**: tema escuro completo, seguindo o sistema por padrão, com botão para
forçar claro/escuro/sistema e a escolha lembrada no aparelho.

**Independent Test**: colocar o sistema no escuro e abrir o app (abre escuro);
trocar pelo botão (muda na hora); recarregar (lembra a escolha); percorrer
todas as telas sem encontrar área com cor vazada do tema claro.

- [X] T007 [P] [US1] Implementar a lógica pura de tema em src/design/theme.ts: leitura e escrita da preferência em `localStorage` dentro de `try/catch`, resolução de `preferência + tema do sistema → tema efetivo`, e o ciclo sistema → claro → escuro
- [X] T008 [P] [US1] Escrever testes da lógica de tema em tests/unit/theme.test.ts (preferência ausente segue o sistema; valor desconhecido não quebra; armazenamento indisponível não lança; o ciclo percorre os três estados)
- [X] T009 [US1] Adicionar o script síncrono anti-piscada em index.html, antes do bundle, escrevendo `data-theme` no `<html>` a partir da preferência e do `prefers-color-scheme` (FR-008)
- [X] T010 [US1] Implementar src/design/ThemeProvider.tsx: aplica o tema no `<html>`, escuta mudanças do sistema enquanto a preferência for "seguir o sistema" (FR-006) e expõe o estado e o alternador
- [X] T011 [US1] Sincronizar a meta `theme-color` com o tema em uso em src/design/ThemeProvider.tsx, para a barra do navegador e o app instalado acompanharem (FR-021)
- [X] T012 [US1] Implementar o controle de tema em src/design/components/ThemeToggle.tsx com os três estados nomeados (Claro, Escuro, Sistema) e rótulo acessível dizendo o estado atual
- [X] T013 [US1] Montar o ThemeProvider em src/main.tsx e posicionar o ThemeToggle no trilho lateral e no cabeçalho móvel em src/design/components/AppShell.tsx, sem acrescentar passos a nenhuma tarefa existente (FR-018)
- [X] T014 [US1] Substituir por tokens toda cor fixa remanescente nos componentes de src/design/components/ (Button, Card, Field, Modal, ConfirmDialog, SetupBanner, AppShell), incluindo os SVG da marca, que hoje têm `#FBF9F5` embutido
- [X] T015 [US1] Substituir por tokens toda cor fixa remanescente nas telas em src/features/finance/components/, src/features/planner/components/, src/features/auth/components/ e src/routes/
- [ ] T016 [US1] Percorrer no tema escuro as telas de src/routes/ e src/features/auth/components/ — login, finanças, planner nas três visões, todos os diálogos e os estados vazio, carregando e erro — corrigindo qualquer área com cor vazada do tema claro
- [ ] T017 [US1] Verificar a ausência de piscada recarregando com cache desabilitado nos dois temas (script de index.html) e conferir que a preferência sobrevive a fechar e reabrir o navegador (SC-001, SC-003)

**Checkpoint**: US1 entregável — o app já pode ser publicado só com o tema escuro

---

## Phase 4: User Story 2 - Entender o mês de relance (Priority: P2)

**Goal**: quatro leituras visuais do mês — proporção entrou/saiu, categorias,
comparação com meses anteriores e a distinção previsto/efetivado.

**Independent Test**: abrir um mês com entradas, saídas em várias categorias e
ao menos um previsto, e conferir que a leitura visual corresponde aos valores;
identificar a categoria dominante em até 3 segundos sem ler números.

- [ ] T018 [P] [US2] Implementar a série mensal pura em src/features/finance/lib/monthSeries.ts: até 6 meses terminando no mês visualizado, meses sem registro com zeros, e a escala a partir do maior valor absoluto (data-model.md)
- [ ] T019 [P] [US2] Escrever testes da série mensal em tests/unit/monthSeries.test.ts (horizonte de 6 meses, virada de ano, meses ausentes preenchidos com zero, série toda zerada, saldo negativo)
- [ ] T020 [P] [US2] Implementar a dobra da distribuição por categoria em src/features/finance/lib/categoryBreakdown.ts: no máximo 6 nominais, o restante somado em "Outros", slot de cor estável por categoria, e a soma das fatias igual ao total de saídas
- [ ] T021 [P] [US2] Escrever testes da dobra em tests/unit/categoryBreakdown.test.ts (7 ou mais categorias dobram corretamente; a soma fecha com o total; reordenar por valor não troca as cores; categoria única com 100%)
- [ ] T022 [P] [US2] Implementar o medidor em src/design/components/charts/Meter.tsx: proporção do que saiu sobre o que entrou, extensão do previsto em peso leve, estado de excesso quando a saída supera a entrada, divisão por zero tratada, e rótulo textual acessível declarando a proporção em palavras (FR-013)
- [ ] T023 [P] [US2] Implementar a barra horizontal em src/design/components/charts/BarRow.tsx com rótulo direto, ponta arredondada de 4px ancorada na linha de base e vão de 2px na cor da superfície (contracts/design-tokens.md)
- [ ] T024 [P] [US2] Implementar as colunas mensais em src/design/components/charts/MonthColumns.tsx usando ênfase — o mês em foco na cor de ação e os anteriores recessivos (research R2), sem eixo duplo
- [ ] T025 [US2] Compor a distribuição por categoria em src/features/finance/components/CategoryBreakdown.tsx, ordenada da maior para a menor, com rótulo direto e lista textual equivalente (FR-013)
- [ ] T026 [US2] Compor a comparação entre meses em src/features/finance/components/MonthTrend.tsx a partir dos `monthStats` já lidos, sem nenhuma leitura nova do Firestore, com equivalente textual dos valores de cada mês (FR-013)
- [ ] T027 [US2] Reorganizar src/features/finance/components/MonthSummary.tsx para liderar pela leitura visual, mantendo os valores em figuras tabulares e o saldo acumulado como número secundário
- [ ] T028 [US2] Implementar o estado vazio de cada visualização (mês sem movimentação, histórico insuficiente para comparar) em src/features/finance/components/, sem gráfico quebrado nem área em branco (FR-014)
- [ ] T029 [US2] Conferir em ~375px os casos-limite das visualizações de src/features/finance/components/: categoria única com 100%, um gasto muito maior que os demais, e conteúdo largo rolando dentro da própria área

**Checkpoint**: US1 e US2 funcionam de forma independente

---

## Phase 5: User Story 3 - Reconhecer o app como algo próprio (Priority: P3)

**Goal**: identidade coerente e com personalidade nos dois temas, sem que
nenhuma tarefa fique mais trabalhosa.

**Independent Test**: comparar as telas entre si e os dois temas entre si; a
linguagem visual é a mesma e o escuro não parece uma versão apagada do claro.

- [ ] T030 [US3] Revisar hierarquia tipográfica e espaçamento nas telas principais (src/routes/, src/features/finance/components/, src/features/planner/components/), aprofundando a metáfora da caderneta em vez de substituí-la
- [ ] T031 [US3] Uniformizar a linguagem dos fios e das figuras tabulares entre src/features/finance/components/TransactionList.tsx, MonthSummary.tsx e src/design/components/charts/, para que a coluna de valores alinhe do mesmo jeito em toda parte
- [ ] T032 [P] [US3] Garantir que todo movimento respeite `prefers-reduced-motion` em src/design/tokens.css e nos componentes que animam (FR-020)
- [ ] T033 [US3] Verificar o foco de teclado visível em todos os controles nos dois temas, incluindo o novo controle de tema
- [ ] T034 [US3] Simular deuteranopia e protanopia no DevTools sobre a distribuição por categoria e confirmar que categorias vizinhas continuam distinguíveis
- [ ] T035 [US3] Conferir que nenhuma tarefa existente ganhou passos: registrar um gasto continua em no máximo 3 interações a partir da tela inicial (SC-006)

**Checkpoint**: todas as user stories funcionais

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T036 [P] Rodar `npm run validate:palette` e confirmar `ALL CHECKS PASS` nos dois modos
- [ ] T037 [P] Atualizar README.md com a seção de temas e a regra de revalidar a paleta ao mexer em cor de categoria
- [ ] T038 Rodar a suíte completa (`npm test`, `npm run test:rules`, `npm run test:integration`), o lint e o build
- [ ] T038a Percorrer todas as telas nas quatro combinações — tema claro e escuro × ~375px e ~1280px — conferindo legibilidade e ausência de corte, em src/routes/ e src/features/ (SC-007)
- [ ] T039 Executar os três blocos de validação manual de quickstart.md nos dois temas e nas duas larguras
- [ ] T040 Publicar e conferir no celular real com o tema escuro do sistema — o caso de uso que originou a feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 — BLOQUEIA todas as stories
- **US1 (Phase 3)**: depende da Phase 2
- **US2 (Phase 4)**: depende da Phase 2. É independente de US1 na lógica, mas
  os gráficos só podem ser conferidos no escuro depois de T002
- **US3 (Phase 5)**: depende de US1 e US2 — é a passada de coerência sobre o
  que as duas produziram
- **Polish (Phase 6)**: depende das stories desejadas

### Within Each User Story

- Lógica pura (+ testes) → primitivos de gráfico → composição → estados vazio
- Verificação visual nos dois temas fecha cada story

### Parallel Opportunities

- Foundational: T003 em paralelo a T002
- US1: T007 e T008 em paralelo; T014 e T015 tocam arquivos diferentes e podem
  ser divididos
- US2: T018 a T024 em paralelo (lógica pura e primitivos são arquivos
  distintos); T025 a T027 dependem deles
- US3: T032 em paralelo às demais
- Polish: T036 e T037 em paralelo

---

## Parallel Example: User Story 2

```bash
# As bases de US2 sao arquivos distintos e podem ser lancadas juntas:
Task: "Serie mensal pura em src/features/finance/lib/monthSeries.ts"
Task: "Dobra por categoria em src/features/finance/lib/categoryBreakdown.ts"
Task: "Medidor em src/design/components/charts/Meter.tsx"
Task: "Barra horizontal em src/design/components/charts/BarRow.tsx"
Task: "Colunas mensais em src/design/components/charts/MonthColumns.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational)
2. Phase 3 (US1) completa
3. **PARE E VALIDE**: abrir no celular à noite, com o sistema no escuro
4. Já resolve o desconforto que originou o pedido — pode publicar

### Incremental Delivery

1. Setup + Foundational → tokens dos dois temas prontos
2. + US1 → modo escuro completo (**MVP**)
3. + US2 → o mês compreensível de relance
4. + US3 → identidade coerente e acessível
5. Phase 6 → validação final e publicação

---

## Notes

- Cor de categoria **nunca** é escolhida a olho: qualquer mudança passa por
  `npm run validate:palette` antes de publicar. Foi assim que a paleta
  anterior chegou a ΔE 1,9 entre duas categorias sem ninguém perceber
- Utilitários condicionais de tema (`dark:`) são proibidos nos componentes —
  a decisão de tema vive só na camada de tokens (contracts/design-tokens.md)
- Commit atômico por tarefa ou grupo lógico, como na feature 001
- Nenhuma escrita nova no Firestore: esta feature é de apresentação
