# Data Model: Metas de Orçamento

**Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md) | **Contrato**: [contracts/firestore-goals.md](./contracts/firestore-goals.md)

Uma subcoleção nova. Nada do que já existe muda de formato.

## BudgetGoal — `users/{uid}/budgetGoals/{alvo}`

`alvo` é `overall` (teto do mês) ou o id de uma categoria. Id determinístico:
dois aparelhos definindo a mesma meta convergem para um documento só.

| Campo | Tipo | Regras |
|-------|------|--------|
| target | `"overall" \| "category"` | tipo do alvo |
| categoryId | string \| null | preenchido quando `target = "category"` |
| versions | Version[] | ao menos 1; ordenada por `from` crescente |
| overrides | Record<`YYYY-MM`, int> | exceções por mês; pode ser vazio |
| createdAt / updatedAt | timestamp | servidor |

**Version**: `{ from: 'YYYY-MM', amountCents: int }` — o valor passa a valer
a partir daquele mês, inclusive.

Regras:

1. `amountCents` é inteiro ≥ 0 em toda versão e em toda exceção. Zero é
   válido e significa "nenhum gasto previsto aqui"; negativo é rejeitado
   (FR-007).
2. `versions` nunca fica vazia — remover a meta apaga o documento (FR-006).
3. Não existem duas versões com o mesmo `from`: definir de novo no mesmo mês
   substitui a versão daquele mês.
4. Uma exceção sempre pertence ao mês que a chave nomeia, e não ao momento em
   que foi criada — por isso um ajuste feito hoje para dezembro continua
   valendo quando dezembro chegar.

## Meta vigente — derivada

```text
mês pedido
   ↓
overrides[mês] existe?  ──sim──→  esse valor  (ajuste do mês, FR-004)
   │ não
   ↓
última version com from ≤ mês  ──existe──→  amountCents  (padrão da época)
   │ não existe
   ↓
sem meta  (nenhum limite; a categoria aparece normal, FR-016)
```

É esta busca que sustenta o FR-008: alterar o padrão hoje acrescenta uma
versão a partir do mês corrente, e meses anteriores continuam encontrando a
versão antiga. **Sem limite** e **meta zero** são estados diferentes e nunca
podem ser confundidos.

## Consumo — derivado, nunca armazenado

Calculado a partir das movimentações do mês que a tela já carregou.

| Campo | Regra |
|-------|-------|
| goalCents | meta vigente do mês |
| usedCents | gastos efetivados do alvo no mês |
| plannedCents | gastos previstos do alvo, ainda não confirmados |
| remainingCents | `goal − used − planned`; pode ser negativo |
| ratio | `used / goal`; sem teto — passar de 1 é o próprio sinal de excesso |
| incomeMark | posição da entrada do mês na escala da meta, só no alvo `overall` |
| state | `within` \| `near` \| `over` |

**Estados**:

- `within` — abaixo de 80% da meta
- `near` — de 80% (inclusive) até 100%
- `over` — acima de 100%

Casos que a regra precisa cobrir:

1. Meta zero com qualquer gasto → `over`. Sem divisão por zero.
2. Meta zero sem gasto → `within`.
3. **Toda** meta conta o previsto, distinguido do efetivado (FR-015) — teto
   geral e categoria usam a mesma base, para que os números fechem entre si.
4. Categoria arquivada deixa de ser cobrada; o documento da meta permanece,
   preservando o histórico (FR-021).

## Relacionamentos

```text
UserProfile 1 ── 0..1 BudgetGoal (overall)
UserProfile 1 ── 0..N BudgetGoal (category) ──→ Category (categoryId)
BudgetGoal   1 ── 1..N Version
BudgetGoal   1 ── 0..N Override (por mês)
```

A meta referencia a categoria, nunca o contrário: apagar a categoria não é
possível no app (só arquivar), então não há referência órfã a tratar.
