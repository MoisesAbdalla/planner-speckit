# Implementation Plan: Planner de Rotina com Gestor Financeiro

**Branch**: `001-routine-finance-planner` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-routine-finance-planner/spec.md`

## Summary

Aplicação web responsiva (SPA/PWA) de uso pessoal que combina um planner de
rotina (visões dia/semana/mês, tarefas recorrentes) com um gestor financeiro
(gastos/ganhos, recorrências com lançamentos "previstos" confirmáveis,
resumo mensal com saldo real/previsto/acumulado). Backend 100% Firebase:
Cloud Firestore com listeners em tempo real para sincronização
multi-dispositivo e Firebase Authentication (e-mail/senha + Google).
Frontend em React + TypeScript (Vite), estilização com Tailwind CSS guiada
pela skill `frontend-design`. Sem servidor próprio: recorrências são
materializadas no cliente com IDs determinísticos para evitar duplicação
entre dispositivos.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 24 LTS para tooling

**Primary Dependencies**: React 19, Vite 7, react-router 7, Firebase JS SDK
v12 (modular: `firebase/app`, `firebase/auth`, `firebase/firestore`),
Tailwind CSS 4, date-fns 4 (locale pt-BR)

**Storage**: Cloud Firestore (dados por usuário sob `users/{uid}/…`),
Firebase Authentication (e-mail/senha + Google). Sem outro banco (Princípio
II da constituição)

**Testing**: Vitest + @testing-library/react para lógica e componentes;
`@firebase/rules-unit-testing` + Firestore Emulator para Security Rules;
cálculos financeiros e expansão de recorrência como funções puras com
testes unitários obrigatórios (Princípio IV)

**Target Platform**: Navegadores modernos (Chrome/Edge/Firefox/Safari) em
desktop e mobile; PWA instalável (manifest + ícones; sem service worker de
cache offline na v1)

**Project Type**: Web application — SPA única servindo PC e celular (uma
base de código, sem backend próprio)

**Performance Goals**: atualização de resumo percebida como instantânea
(<100ms após escrita local, latency compensation do Firestore); propagação
entre dispositivos ≤5s (SC-003); primeiro carregamento interativo <3s em 4G

**Constraints**: valores monetários como inteiros em centavos; interface
pt-BR (R$, datas); dados isolados por UID via Security Rules; indicador de
offline sem perda de dados digitados; mobile-first responsivo (~375px a
~1280px)

**Scale/Scope**: uso pessoal (dezenas de usuários, centenas de
movimentações/tarefas por mês por usuário); ~8 telas principais (login,
dashboard, financeiro mensal, formulários de movimentação/recorrência,
planner dia/semana/mês, categorias/configurações)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. Experiência Intuitiva em Primeiro Lugar | Sistema de design definido na fase de setup (tokens: tipografia, cores, espaçamento) via skill `frontend-design` antes das telas; fluxo de registro de gasto em ≤3 interações é requisito (SC-001) | ✅ PASS |
| II. Firebase como Backend Único | Firestore + Firebase Auth apenas; sem servidor próprio, sem outro banco; Security Rules isolam dados por UID; dados sob `users/{uid}/…` | ✅ PASS |
| III. Multi-Dispositivo por Padrão | Listeners `onSnapshot` em tempo real (sem sync manual); layout mobile-first; verificação em ~375px e ~1280px antes de concluir cada tela | ✅ PASS |
| IV. Integridade dos Dados Financeiros | Centavos como inteiros; totais sempre derivados das movimentações (funções puras testadas); exclusão com confirmação; testes unitários dos cálculos antes do merge | ✅ PASS |
| V. Simplicidade e Entrega Incremental | SPA sem SSR/servidor (nada a manter); sem Redux/estado global pesado (Context + hooks); entrega por fatias verticais na ordem P1→P4 das user stories | ✅ PASS |

**Pós-Phase 1 (re-check)**: design mantém os cinco princípios — nenhuma
violação introduzida; sem itens em Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-routine-finance-planner/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── firestore-schema.md
│   └── firestore.rules
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx                  # bootstrap React + router
├── App.tsx                   # shell: rotas, guarda de auth, layout responsivo
├── firebase.ts               # init do Firebase (config via variáveis de ambiente)
├── design/                   # sistema de design (Princípio I)
│   ├── tokens.css            # tipografia, cores, espaçamento (Tailwind theme)
│   └── components/           # primitivos reutilizáveis (Button, Card, Modal, Input…)
├── features/
│   ├── auth/                 # login, cadastro, recuperação de senha, logout
│   ├── finance/
│   │   ├── components/       # lista do mês, resumo, formulários, categorias
│   │   ├── hooks/            # useTransactions(month), useRecurrences, useSummary
│   │   └── lib/              # funções puras: totais, saldo acumulado,
│   │                         #   materialização de recorrências (testadas)
│   └── planner/
│       ├── components/       # visões dia/semana/mês, item de tarefa, item financeiro
│       ├── hooks/            # useTasks(range), useOccurrences
│       └── lib/              # funções puras: expansão de recorrência de tarefas
├── shared/
│   ├── money.ts              # centavos ↔ exibição R$ (Intl pt-BR)
│   ├── dates.ts              # helpers date-fns locale pt-BR
│   └── connection.ts         # indicador online/offline
└── routes/                   # páginas: /login, /, /financas, /planner/:view

tests/
├── unit/                     # money, totais, recorrências (finance/planner lib)
├── components/               # componentes críticos (formulários, resumo)
└── rules/                    # Security Rules via Firestore Emulator

firestore.rules               # cópia deployável do contrato de segurança
firestore.indexes.json        # índices compostos necessários
firebase.json                 # config de emuladores/hosting
public/                       # manifest PWA, ícones, favicon
```

**Structure Decision**: projeto único de frontend (SPA) — não há backend
próprio a estruturar (Firebase é consumido direto do cliente, padrão
recomendado para apps pessoais com Security Rules). Organização por
feature (`auth`, `finance`, `planner`) com lógica de cálculo isolada em
`lib/` como funções puras para cumprir a exigência de testes do Princípio
IV sem depender do emulador.

## Complexity Tracking

Sem violações da constituição — tabela não aplicável.
