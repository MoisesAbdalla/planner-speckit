# Implementation Plan: Modo Escuro e Refinamento Visual

**Branch**: `002-dark-mode-visual-refresh` | **Date**: 2026-08-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-dark-mode-visual-refresh/spec.md`

## Summary

Duas versões de tema completas (clara e escura) derivadas dos mesmos tokens
semânticos, com preferência por aparelho (sistema, claro ou escuro) aplicada
antes da primeira pintura para não piscar. Quatro visualizações novas no
resumo financeiro — medidor de quanto do que entrou já saiu, barras por
categoria, comparação com meses anteriores por ênfase, e a distinção
previsto/efetivado — construídas em SVG e CSS puros, sem biblioteca de
gráficos. A identidade "Caderneta" é aprofundada: os fios e as figuras
tabulares passam a valer também dentro dos gráficos.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19 — sem mudança

**Primary Dependencies**: nenhuma nova. Gráficos em SVG inline + CSS; tema em
custom properties do CSS (Tailwind 4 `@theme`)

**Storage**: `localStorage` para a preferência de tema (por aparelho, fora da
conta — FR-005). Firestore inalterado: esta feature não grava nada novo

**Testing**: Vitest para a lógica pura de tema e de agregação para gráficos;
`validate_palette.py` da skill `dataviz` como verificação de paleta;
verificação visual nos dois temas e nas duas larguras

**Target Platform**: navegadores modernos, desktop e mobile — sem mudança

**Project Type**: web application (SPA) — sem mudança

**Performance Goals**: troca de tema refletida em <1s (SC-002), sem
recarregar; nenhuma piscada de tema errado no carregamento (FR-008);
bundle não deve crescer de forma perceptível

**Constraints**: contraste ≥4,5:1 para texto e ≥3:1 para elemento gráfico
informativo, nos dois temas (SC-005); paleta de categorias precisa passar nas
seis checagens da skill `dataviz`; nenhuma tarefa existente pode ganhar
interações (FR-018/SC-006)

**Scale/Scope**: ~8 telas existentes revisadas nos dois temas; 4 visualizações
novas; nenhum dado novo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|-----------|-----------|--------|
| I. Experiência Intuitiva em Primeiro Lugar | Direção visual conduzida pela skill `frontend-design`; formas dos gráficos escolhidas pela skill `dataviz` antes de qualquer cor; sistema de design único estendido, não substituído; FR-018 proíbe aumentar o número de interações | ✅ PASS |
| II. Firebase como Backend Único | Feature puramente de apresentação: nada gravado, nenhuma regra alterada. A preferência de tema fica no aparelho | ✅ PASS |
| III. Multi-Dispositivo por Padrão | Ambos os temas verificados em ~375px e ~1280px; a preferência é por aparelho, o que é o comportamento correto para multi-dispositivo | ✅ PASS |
| IV. Integridade dos Dados Financeiros | Gráficos derivam das mesmas funções puras já testadas (`summarizeMonth`); nenhum total novo é calculado nem armazenado; a agregação para comparação mensal é derivada e testada | ✅ PASS |
| V. Simplicidade e Entrega Incremental | Zero dependências novas — quatro formas simples não justificam uma biblioteca de gráficos; entrega em fatias P1 (tema) → P2 (gráficos) → P3 (identidade) | ✅ PASS |

**Pós-Phase 1 (re-check)**: sem violações. A ausência de biblioteca de
gráficos é a decisão que mais preserva o Princípio V e está justificada em
[research.md](./research.md) (R4).

## Project Structure

### Documentation (this feature)

```text
specs/002-dark-mode-visual-refresh/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── design-tokens.md # Contrato dos tokens nos dois temas
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── design/
│   ├── tokens.css                 # ALTERADO: tokens semânticos nos 2 temas
│   ├── theme.ts                   # NOVO: resolução e persistência da preferência
│   ├── ThemeProvider.tsx          # NOVO: contexto + aplicação no <html>
│   └── components/
│       ├── ThemeToggle.tsx        # NOVO: claro / escuro / sistema
│       └── charts/                # NOVO: primitivos de gráfico em SVG
│           ├── Meter.tsx          #   medidor de proporção (entrou x saiu)
│           ├── BarRow.tsx         #   barra horizontal com rótulo direto
│           └── MonthColumns.tsx   #   colunas por mês, com ênfase no atual
├── features/finance/
│   ├── lib/
│   │   └── monthSeries.ts         # NOVO: série dos últimos meses (pura)
│   └── components/
│       ├── MonthSummary.tsx       # ALTERADO: passa a liderar pelo visual
│       ├── CategoryBreakdown.tsx  # NOVO: barras por categoria
│       └── MonthTrend.tsx         # NOVO: comparação com meses anteriores
└── index.html                     # ALTERADO: script anti-piscada antes da pintura

tests/unit/
├── theme.test.ts                  # NOVO: resolução de tema e persistência
└── monthSeries.test.ts            # NOVO: série mensal e casos-limite
```

**Structure Decision**: os gráficos entram em `design/components/charts/`
como primitivos genéricos (recebem números, não conhecem finanças), e a
composição financeira fica em `features/finance/components/`. Isso mantém a
regra que já vale no projeto: `lib/` puro e testável, `components/` de
apresentação.

## Complexity Tracking

Sem violações da constituição — tabela não aplicável.
