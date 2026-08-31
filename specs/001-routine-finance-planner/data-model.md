# Data Model: Planner de Rotina com Gestor Financeiro

**Date**: 2026-08-29 | **Plan**: [plan.md](./plan.md) | **Schema físico**: [contracts/firestore-schema.md](./contracts/firestore-schema.md)

Todos os dados vivem sob `users/{uid}/…` (isolamento por usuário — FR-002).
Datas de calendário são strings `YYYY-MM-DD`; meses são `YYYY-MM`; valores
monetários são inteiros em **centavos**.

## Entidades

### UserProfile — `users/{uid}`

| Campo | Tipo | Regras |
|-------|------|--------|
| displayName | string | 1–80 chars |
| email | string | espelho do Auth (informativo) |
| createdAt | timestamp | servidor |

Criado no primeiro login. As categorias padrão são semeadas junto.

### Transaction (Movimentação) — `users/{uid}/transactions/{id}`

| Campo | Tipo | Regras |
|-------|------|--------|
| type | `"expense" \| "income"` | obrigatório |
| amountCents | int | > 0 (FR-011) |
| description | string | 1–120 chars |
| categoryId | string | ref a Category existente |
| date | string `YYYY-MM-DD` | obrigatório |
| month | string `YYYY-MM` | = prefixo de `date` (denormalizado p/ query) |
| status | `"planned" \| "confirmed"` | manual nasce `confirmed`; de recorrência nasce `planned` (FR-010a) |
| source | `"manual" \| "recurrence"` | obrigatório |
| recurrenceId | string \| null | obrigatório quando `source = "recurrence"` |
| createdAt / updatedAt | timestamp | servidor |

**ID**: aleatório para manuais; determinístico `rec_{recurrenceId}_{YYYY-MM}`
para materializadas (idempotência multi-dispositivo — research R4).

**Transições de estado**: `planned → confirmed` (1 toque, FR-010a);
`confirmed → planned` permitido (desfazer confirmação). Exclusão sempre com
confirmação do usuário (FR-009).

### Recurrence (Recorrência financeira) — `users/{uid}/recurrences/{id}`

| Campo | Tipo | Regras |
|-------|------|--------|
| type | `"expense" \| "income"` | obrigatório |
| amountCents | int | > 0 |
| description | string | 1–120 chars |
| categoryId | string | ref a Category |
| dayOfMonth | int | 1–31; clamp p/ último dia em meses curtos |
| startMonth | string `YYYY-MM` | primeiro mês gerado |
| endMonth | string `YYYY-MM` \| null | null = ativa; encerrar seta o mês corrente (FR-010) |
| createdAt / updatedAt | timestamp | servidor |

**Derivação**: `active = (endMonth == null)`. Encerrar não afeta
transactions já materializadas (FR-010).

### Category — `users/{uid}/categories/{id}`

| Campo | Tipo | Regras |
|-------|------|--------|
| name | string | 1–40 chars, único (case-insensitive) entre não arquivadas |
| kind | `"expense" \| "income" \| "both"` | filtra sugestão no formulário |
| color | string | token da paleta do design system |
| isDefault | bool | semeada no primeiro login |
| archived | bool | arquivar preserva histórico (FR-006) |
| sortOrder | int | ordenação estável |

Padrões semeados: Alimentação, Moradia, Transporte, Lazer, Saúde, Outros
(expense); Salário, Extra (income).

### Task (Item de rotina) — `users/{uid}/tasks/{id}`

| Campo | Tipo | Regras |
|-------|------|--------|
| title | string | 1–120 chars |
| notes | string \| null | ≤ 2000 chars |
| time | string `HH:mm` \| null | horário opcional (FR-013) |
| recurrence | Recur \| null | null = avulsa (data única em `date`) |
| date | string `YYYY-MM-DD` \| null | obrigatório se avulsa |
| startDate | string `YYYY-MM-DD` | início da série (se recorrente) |
| endDate | string `YYYY-MM-DD` \| null | fim da série |
| createdAt / updatedAt | timestamp | servidor |

**Recur** (embedded): `{ freq: "daily" } | { freq: "weekly", weekdays: int[1..7] } | { freq: "monthly", dayOfMonth: 1..31 }` (FR-015).

### TaskOverride (Ocorrência de rotina) — `users/{uid}/taskOverrides/{taskId}_{YYYY-MM-DD}`

Documento de exceção criado só quando o usuário interage com uma ocorrência
(research R5). Ausência de override = ocorrência pendente e sem alterações.

| Campo | Tipo | Regras |
|-------|------|--------|
| taskId | string | ref a Task |
| date | string `YYYY-MM-DD` | data da ocorrência |
| done | bool | concluída/desmarcada (FR-016) |
| deleted | bool | exclusão de ocorrência única (FR-017) |
| titleOverride / timeOverride / notesOverride | opcionais | edição de ocorrência única |
| updatedAt | timestamp | servidor |

**ID determinístico** garante convergência entre dispositivos.

### MonthStats (cache de agregação) — `users/{uid}/monthStats/{YYYY-MM}`

| Campo | Tipo | Regras |
|-------|------|--------|
| incomeCents | int | soma de income `confirmed` do mês |
| expenseCents | int | soma de expense `confirmed` do mês |
| updatedAt | timestamp | servidor |

**Cache reconstruível, nunca fonte de verdade** (Princípio IV; research
R7). Atualizado na mesma batch/transaction de toda escrita em transaction
`confirmed`, sempre via `FieldValue.increment()` (seguro sob concorrência).
Usado apenas para o saldo acumulado (FR-007a); o resumo do mês visível é
derivado das transactions carregadas.

A reconstrução é o que sustenta a afirmação "cache, não fonte de verdade":
`rebuildMonthStats(uid)` varre as transactions do usuário e regrava todos os
agregados. Qualquer divergência — bug, escrita interrompida, migração — é
corrigível sem perda.

## Derivações (nunca armazenadas como verdade)

- **Resumo do mês M**: entradas = Σ income confirmed(M); saídas = Σ expense
  confirmed(M); saldo real = entradas − saídas; saldo previsto = idem
  incluindo `planned`; gastos por categoria = agrupamento das expenses.
- **Saldo acumulado até M**: Σ (incomeCents − expenseCents) dos monthStats
  de todos os meses ≤ M.
- **Ocorrências do planner no intervalo [a,b]**: expansão em memória de
  cada Task (avulsa ou recorrente) ∩ [a,b], aplicando TaskOverrides por ID.
- **Itens financeiros no planner**: transactions `planned` com `date` no
  intervalo visível (FR-018a).

## Relacionamentos

```text
UserProfile 1 ── * Transaction ── * Category (categoryId)
UserProfile 1 ── * Recurrence ──< materializa >── Transaction (recurrenceId, ID determinístico)
UserProfile 1 ── * Task ──< exceção >── TaskOverride (taskId + date)
UserProfile 1 ── * MonthStats (cache por mês)
```

Integridade referencial é responsabilidade do app (Firestore não tem FK):
categoria nunca é apagada, só arquivada — histórico permanece válido.
