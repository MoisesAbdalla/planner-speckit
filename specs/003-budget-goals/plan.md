# Implementation Plan: Metas de Orçamento

**Branch**: `003-budget-goals` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-budget-goals/spec.md`

## Summary

Metas de gasto para o mês inteiro e por categoria, guardadas na conta. Cada
meta é uma linha do tempo de valores com data de vigência, mais exceções por
mês — é o que permite mudar o padrão sem reescrever como um mês passado foi
avaliado. O acompanhamento é derivado dos gastos que o app já lê e aparece
dentro do medidor e das barras que já existem, sem tela nova e sem
acrescentar passos ao registro de gasto.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19 — sem mudança

**Primary Dependencies**: nenhuma nova

**Storage**: Cloud Firestore, nova subcoleção `users/{uid}/budgetGoals/{alvo}`
com id determinístico (`overall` ou o id da categoria). Novas Security Rules

**Testing**: Vitest para a resolução da meta vigente e o cálculo de consumo
(agregação de dinheiro derivada — Princípio IV); testes de regras no emulador
para a nova subcoleção; verificação visual nos dois temas

**Target Platform**: navegadores modernos, desktop e mobile — sem mudança

**Project Type**: web application (SPA) — sem mudança

**Performance Goals**: a coleção de metas tem no máximo uma entrada por
categoria mais o teto geral — uma leitura em tempo real, sem custo
perceptível; nenhuma leitura nova de movimentações

**Constraints**: valores em centavos inteiros; sinais de aproximação e
excesso não podem depender só de cor (FR-014); registrar um gasto não pode
ganhar passos (FR-019); o app sem metas precisa ficar idêntico ao de hoje
(FR-020)

**Scale/Scope**: uso pessoal; ~10 metas por usuário; 1 modal de edição e 2
pontos de exibição já existentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. Experiência Intuitiva em Primeiro Lugar | Nenhuma linguagem visual nova: os sinais reaproveitam a gramática da caderneta (marca no fio, rótulo em texto). Edição num modal, como já acontece com categorias e recorrências. SC-003 limita a 3 interações | ✅ PASS |
| II. Firebase como Backend Único | Uma subcoleção nova sob `users/{uid}/`, com regras próprias validando formato. Nenhum servidor, nenhuma Cloud Function | ✅ PASS |
| III. Multi-Dispositivo por Padrão | Metas vivem na conta e chegam por `onSnapshot`, como o resto. Exibição verificada em ~375px e ~1280px, nos dois temas | ✅ PASS |
| IV. Integridade dos Dados Financeiros | Centavos inteiros; a meta vigente e o consumo são funções puras testadas; consumo nunca é armazenado, sempre derivado dos gastos do mês | ✅ PASS |
| V. Simplicidade e Entrega Incremental | Zero dependências novas; entrega em P1 (teto geral) → P2 (por categoria) → P3 (ajuste mensal). O teto geral sozinho já é utilizável | ✅ PASS |

**Pós-Phase 1 (re-check)**: sem violações. A decisão de maior peso — guardar
a meta como linha do tempo em vez de valor único — está justificada em
[research.md](./research.md) (R1) e é o que sustenta o FR-008.

## Project Structure

### Documentation (this feature)

```text
specs/003-budget-goals/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── firestore-goals.md   # Caminhos, regras, invariantes e contrato de exibição
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/features/finance/
├── types.ts                       # ALTERADO: tipos BudgetGoal e consumo
├── lib/summary.ts                 # ALTERADO: previsto por categoria (research R9)
├── lib/
│   ├── goals.ts                   # NOVO: meta vigente, consumo, faixas (puro)
│   └── goalWrites.ts              # NOVO: definir padrão, ajustar mês, remover
├── hooks/
│   └── useBudgetGoals.ts          # NOVO: leitura em tempo real das metas
└── components/
    ├── BudgetGoalsManager.tsx     # NOVO: modal de edição (padrão e mês)
    ├── MonthSummary.tsx           # ALTERADO: teto geral no medidor
    └── CategoryBreakdown.tsx      # ALTERADO: meta por categoria nas barras

src/design/components/charts/
├── Meter.tsx                      # ALTERADO: marca de limite e faixas
└── BarRow.tsx                     # ALTERADO: marca de limite opcional

src/routes/Finance.tsx             # ALTERADO: entrada para o modal de metas

firestore.rules                    # ALTERADO: regras da subcoleção nova

tests/
├── unit/goals.test.ts             # NOVO: meta vigente, consumo, faixas
└── rules/budgetGoals.test.ts      # NOVO: isolamento e validação de formato
```

**Structure Decision**: segue a divisão que já vale no projeto — `lib/` puro
e testável, `hooks/` para leitura em tempo real, `components/` para
apresentação. Os primitivos de gráfico ganham uma marca de limite opcional em
vez de componentes novos: a meta é uma anotação sobre a mesma barra, não
outra forma.

## Complexity Tracking

Sem violações da constituição — tabela não aplicável.
