# Implementation Plan: Recorrências Semanais e Anuais

**Branch**: `004-weekly-yearly-recurrences` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-weekly-yearly-recurrences/spec.md`

## Summary

A recorrência ganha um campo de frequência — semanal, mensal ou anual — que
é **opcional no dado gravado**: sua ausência significa mensal, e é isso que
faz as recorrências já em produção continuarem funcionando sem migração e sem
ação do usuário. A geração dos lançamentos passa a ter horizonte assimétrico
(curto para semanal e mensal, um ano para anual) e a chave de idempotência
passa a depender da frequência, para que um mês com cinco ocorrências
semanais não colapse num documento só.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19 — sem mudança

**Primary Dependencies**: nenhuma nova

**Storage**: Cloud Firestore, coleção `users/{uid}/recurrences` já existente,
com campos novos opcionais. Security Rules atualizadas para validar por
frequência

**Testing**: Vitest para as regras de recorrência (geração de datas,
idempotência, horizonte, casos de calendário — Princípio IV); testes de
regras no emulador para o formato novo; **teste de regressão explícito** para
as recorrências mensais já gravadas

**Target Platform**: navegadores modernos, desktop e mobile — sem mudança

**Project Type**: web application (SPA) — sem mudança

**Performance Goals**: o horizonte anual não pode multiplicar leituras — só
os meses que de fato recebem lançamento anual são consultados; um usuário sem
recorrência anual paga exatamente o custo de hoje

**Constraints**: nenhuma migração de dados (FR-016); nenhuma duplicação entre
aparelhos em nenhuma frequência (FR-011); cadastrar não pode ganhar
interações (SC-003)

**Scale/Scope**: uso pessoal; ~10 recorrências por usuário; 1 formulário e 1
lista alterados, nenhuma tela nova

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. Experiência Intuitiva em Primeiro Lugar | Nenhuma tela nova: o formulário existente ganha um seletor de frequência e mostra só os campos que se aplicam (FR-005). A lista passa a dizer a frequência em palavras | ✅ PASS |
| II. Firebase como Backend Único | Coleção existente, campos novos opcionais, regras atualizadas. Nenhum servidor, nenhuma Cloud Function | ✅ PASS |
| III. Multi-Dispositivo por Padrão | A idempotência por id determinístico é estendida às frequências novas — é a garantia que impede duplicata entre PC e celular. Verificação visual nos dois temas e larguras | ✅ PASS |
| IV. Integridade dos Dados Financeiros | Centavos inteiros; a geração de datas e a idempotência são funções puras testadas; nenhum total novo. O teste de regressão das mensais protege dinheiro já registrado | ✅ PASS |
| V. Simplicidade e Entrega Incremental | Zero dependências novas; três frequências e não seis, com a justificativa registrada. Entrega P1 (anual) → P2 (semanal) → P3 (lista) | ✅ PASS |

**Pós-Phase 1 (re-check)**: sem violações. A decisão de maior peso — a
frequência ausente significar mensal — é o que sustenta o FR-016 e está
justificada em [research.md](./research.md) (R1).

## Project Structure

### Documentation (this feature)

```text
specs/004-weekly-yearly-recurrences/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── firestore-recurrences.md   # Formato, regras e invariantes
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/features/finance/
├── types.ts                        # ALTERADO: frequência e campos por frequência
├── lib/
│   ├── recurrenceRules.ts          # ALTERADO: datas por frequência, id, horizonte
│   └── materializeRecurrences.ts   # ALTERADO: horizonte assimétrico
└── components/
    ├── RecurrenceForm.tsx          # ALTERADO: seletor de frequência
    └── RecurrenceList.tsx          # ALTERADO: frequência e próxima data

src/shared/dates.ts                 # ALTERADO: ocorrências de um dia da semana no mês

firestore.rules                     # ALTERADO: validação por frequência

tests/
├── unit/recurrenceRules.test.ts    # ALTERADO: as três frequências + regressão
└── rules/validation.test.ts        # ALTERADO: formato novo e o antigo
```

**Structure Decision**: nada de arquivo novo. A frequência é uma variação
dentro das regras que já existem, e criar um módulo por frequência espalharia
a decisão em três lugares — a lógica de qual data gerar continua num ponto só.

## Complexity Tracking

Sem violações da constituição — tabela não aplicável.
