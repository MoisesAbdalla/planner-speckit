# Research: Planner de Rotina com Gestor Financeiro

**Date**: 2026-08-29 | **Plan**: [plan.md](./plan.md)

Nenhum NEEDS CLARIFICATION restou no Technical Context; este documento
registra as decisões tomadas e alternativas consideradas.

## R1. Framework e build: React + Vite (SPA) — sem SSR

- **Decision**: React 19 + TypeScript com Vite 7, SPA pura com
  react-router 7 (modo declarativo).
- **Rationale**: todo o dado vem do Firestore via SDK no cliente com
  listeners em tempo real; SSR não agrega nada (conteúdo é privado e
  por usuário, sem SEO). SPA elimina servidor a manter (Princípios II e V).
  Vite dá DX rápida e build simples para hosting estático.
- **Alternatives considered**:
  - *Next.js (App Router)*: excelente para SSR/SEO, mas aqui adicionaria
    camada de servidor sem benefício — dados são privados e em tempo real.
  - *Flutter/React Native*: apps de loja ficaram fora do escopo da v1
    (assumption da spec); web responsiva cobre PC + celular.

## R2. Firebase: SDK modular v12, Firestore + Auth

- **Decision**: Firebase JS SDK v12 (imports modulares para tree-shaking).
  Auth com `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`,
  `sendPasswordResetEmail` e `signInWithPopup(GoogleAuthProvider)` com
  fallback `signInWithRedirect` em mobile. Persistência de sessão padrão
  (`browserLocalPersistence`) atende FR-003.
- **Rationale**: exigência da constituição; SDK modular reduz bundle; popup
  funciona bem em desktop e redirect é mais confiável em navegadores mobile.
- **Alternatives considered**: *Auth via biblioteca de terceiros (Clerk
  etc.)* — vetado pela constituição (Firebase como backend único).

## R3. Sincronização em tempo real e estado

- **Decision**: hooks próprios finos sobre `onSnapshot` (ex.:
  `useTransactions(month)`, `useTasks(range)`), com estado local React
  (Context apenas para auth/usuário corrente). Escritas usam a latency
  compensation nativa do Firestore (a UI reflete imediatamente, antes do
  ack do servidor) — cumpre SC-002 e FR-019.
- **Rationale**: o Firestore já é um "store" reativo; adicionar
  Redux/Zustand/TanStack Query duplicaria cache e violaria YAGNI
  (Princípio V).
- **Alternatives considered**: *TanStack Query + polling* (perde tempo
  real); *Zustand espelhando Firestore* (duas fontes de verdade, mais
  código).

## R4. Materialização de recorrências financeiras sem servidor

- **Decision**: lançamentos previstos são materializados **no cliente,
  on-demand**: ao abrir um mês M (e automaticamente para o mês corrente no
  login), o app garante que cada recorrência ativa tenha sua movimentação
  em M, criando documentos com **ID determinístico**
  `rec_{recurrenceId}_{YYYY-MM}` via `setDoc` sem overwrite de campos
  editados (create-if-missing). Horizonte: mês corrente + 2 meses à frente,
  mais qualquer mês futuro que o usuário visitar.
- **Rationale**: sem Cloud Functions (mantém o projeto no plano gratuito e
  simples — Princípio V). ID determinístico torna a operação idempotente:
  dois dispositivos materializando o mesmo mês convergem para um único
  documento, sem duplicatas (edge case da spec). Dia 29/30/31 em meses
  curtos: clamp para o último dia do mês (regra da spec).
- **Alternatives considered**:
  - *Cloud Functions agendadas*: exige plano Blaze e infraestrutura extra;
    adia-se até haver necessidade (ex.: notificações).
  - *Expansão 100% virtual (nunca gravar previstos)*: quebraria edição de
    ocorrência única ("aluguel veio mais caro") e confirmação — que
    precisam de documento próprio.

## R5. Recorrência de tarefas do planner: expansão virtual + exceções

- **Decision**: tarefas recorrentes são **expandidas em memória** para o
  intervalo visível (dia/semana/mês); nada é pré-gravado. Conclusões e
  edições/exclusões de ocorrência única viram documentos de exceção
  (`taskOverrides`) keyed por `{taskId}_{YYYY-MM-DD}`.
- **Rationale**: diferente das finanças, uma ocorrência de tarefa não tem
  efeito agregado (não soma em saldo) — só precisa de estado quando o
  usuário interage com ela. Expansão virtual evita escrever milhares de
  docs para recorrências diárias.
- **Alternatives considered**: *materializar todas as ocorrências* (explode
  em recorrência diária de longo prazo; custo de leitura/escrita).

## R6. Dinheiro e datas

- **Decision**: valores em **centavos (integer)** no Firestore; conversão e
  formatação centralizadas em `shared/money.ts` usando
  `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`. Datas
  de negócio como string `YYYY-MM-DD` (e `month: 'YYYY-MM'` denormalizado
  para query) — sem timezone/Timestamp para datas de calendário.
- **Rationale**: exigência da constituição (Princípio IV); strings de data
  eliminam bugs de fuso (um gasto do "dia 5" é dia 5 em qualquer aparelho).
  `month` denormalizado permite query simples por mês sem range em campo
  string.
- **Alternatives considered**: *Timestamp do Firestore* (introduz fuso
  horário em datas puramente de calendário); *float para valores* (vetado
  pela constituição).

## R7. Saldo acumulado sem ler o histórico inteiro

- **Decision**: manter documentos leves de agregação por mês
  (`users/{uid}/monthStats/{YYYY-MM}` com somas de efetivadas), atualizados
  transacionalmente na escrita de movimentações **OU** — escolha da v1 —
  calcular o acumulado lendo apenas os `monthStats`. Detalhe: os
  `monthStats` são cache reconstruível, nunca fonte de verdade (Princípio
  IV); o resumo do mês visível continua derivado das movimentações lidas.
- **Rationale**: acumulado "desde o primeiro registro" (FR-007a) não pode
  exigir baixar todos os meses; um doc por mês mantém a leitura O(meses).
  Divergência é recuperável recalculando a partir das movimentações.
- **Alternatives considered**: *ler todas as movimentações da conta* (não
  escala e custa leituras); *doc único de saldo corrente* (conflita em
  edição concorrente e vira fonte de verdade implícita).

## R8. Offline e indicador de conexão

- **Decision**: v1 sem service worker de cache; usar o buffer offline
  nativo do SDK do Firestore (escritas pendentes reenviam ao reconectar) +
  banner de estado de conexão (navigator.onLine + eventos). Formulários não
  são limpos em falha (FR-021).
- **Rationale**: cobre "não perder silenciosamente o dado digitado" sem o
  custo de um modo offline completo (fora do escopo declarado na spec).
- **Alternatives considered**: *PWA offline-first com persistência IndexedDB
  do Firestore* — candidata a versão futura; adia complexidade.

## R9. Estilo e sistema de design

- **Decision**: Tailwind CSS 4 com tokens do sistema de design definidos em
  `@theme` (`design/tokens.css`): escala tipográfica, paleta própria
  (light como padrão da v1), espaçamentos e raios. Componentes primitivos
  próprios em `design/components/` (Button, Card, Modal, Input, Tabs).
  Direção visual conduzida pela skill `frontend-design` na primeira fase de
  implementação, antes das telas de feature.
- **Rationale**: Princípio I exige sistema único definido no início; tokens
  em um arquivo mantêm coesão e facilitam o design elegante pedido pelo
  usuário sem depender de kit de terceiros com cara de template.
- **Alternatives considered**: *shadcn/ui* (acelera, mas visual genérico
  contraria "bem bonito e distinto"; pode ser adotado pontualmente para
  primitivos de acessibilidade se necessário); *CSS Modules puro* (mais
  lento para iterar responsivo).

## R10. Testes

- **Decision**: Vitest para funções puras (money, totais, materialização e
  expansão de recorrências — cobertura obrigatória, Princípio IV) e
  @testing-library/react para formulários e resumo.
  `@firebase/rules-unit-testing` com Firestore Emulator para as Security
  Rules (isolamento por UID, validação de shape).
- **Rationale**: a lógica de risco (dinheiro, datas, recorrência) vive em
  funções puras — testável sem mock de Firestore; rules testadas no
  emulador são o gate de segurança do Princípio II.
- **Alternatives considered**: *E2E com Playwright* — adiado; a verificação
  visual manual em 2 viewports (constituição) cobre a v1.
