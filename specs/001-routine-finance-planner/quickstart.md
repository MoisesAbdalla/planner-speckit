# Quickstart: Validação da feature 001-routine-finance-planner

Guia de execução e validação ponta a ponta. Detalhes de dados em
[data-model.md](./data-model.md); contratos em [contracts/](./contracts/).

## Pré-requisitos

- Node.js 24 LTS e npm
- Projeto Firebase criado no console (<https://console.firebase.google.com>)
  com **Authentication** (provedores E-mail/senha e Google habilitados) e
  **Cloud Firestore** ativados
- Firebase CLI (`npm i -g firebase-tools`) para emuladores e deploy de rules
- `.env.local` preenchido a partir de `.env.example` com a config do projeto

## Setup

```bash
npm install
firebase login                      # uma vez
firebase use <project-id>           # vincula o projeto
```

## Rodar em desenvolvimento

```bash
npm run dev                         # Vite em http://localhost:5173
# opcional, para desenvolver sem tocar produção:
firebase emulators:start            # Auth + Firestore emulados
```

**Esperado**: tela de login; criar conta e-mail/senha entra no app com
dados vazios e categorias padrão semeadas.

## Testes automatizados

```bash
npm test                            # Vitest: money, totais, recorrências (unit)
npm run test:rules                  # Security Rules no Firestore Emulator
```

**Esperado**: 100% verde. Os testes de rules provam: usuário A não lê/escreve
dados de B; `amountCents <= 0` rejeitado; `month != date[0:7]` rejeitado;
delete de categoria rejeitado.

## Validação manual (cenários da spec)

Executar em dois viewports (DevTools: ~375px e ~1280px) — Princípio III.

1. **US1 — Financeiro (P1)**: registrar gasto de R$ 50,00 em Alimentação →
   aparece na lista e resumo atualiza sem reload; registrar ganho; excluir
   um item (pede confirmação); navegar para o mês anterior (dados isolados
   por mês).
2. **US4 — Recorrência (P4)**: criar "Aluguel, R$ 1.200,00, dia 5" →
   lançamento *previsto* no mês atual e nos 2 seguintes; confirmar com 1
   toque → saldo real atualiza; editar só o lançamento de um mês → demais
   meses intactos; encerrar recorrência → futuros não são mais gerados.
3. **US2 — Planner (P2)**: criar tarefa avulsa hoje 19h e recorrente
   seg/qua/sex → aparecem nas visões dia/semana/mês corretas; concluir a de
   hoje → só a ocorrência de hoje marca; item atrasado destacado na visão
   do dia; lançamento previsto do dia aparece no planner com visual
   distinto e é confirmável dali (FR-018a).
4. **US3 — Multi-dispositivo (P3)**: mesma conta em duas janelas (uma em
   modo anônimo) → gasto criado numa aparece na outra em ≤5s; logout limpa
   acesso; segunda conta não vê dados da primeira.
5. **Offline (FR-021)**: DevTools → Network offline → banner de
   sem-conexão; texto digitado no formulário não é perdido; ao reconectar,
   escrita pendente sincroniza.
6. **Edge cases**: recorrência dia 31 → em fevereiro cai no último dia;
   valor R$ 0,00 rejeitado com mensagem; mês vazio mostra estado vazio
   amigável.

## Deploy

```bash
npm run build                       # bundle de produção em dist/
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only hosting      # (ou hosting da preferência do usuário)
```

**Esperado**: app acessível pela URL de hosting, funcionando igual em PC e
celular com a mesma conta.
