# Data Model: Recorrências Semanais e Anuais

**Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md) | **Contrato**: [contracts/firestore-recurrences.md](./contracts/firestore-recurrences.md)

Nenhuma coleção nova. A recorrência ganha campos **opcionais**, e é a
opcionalidade que dispensa migração.

## Recurrence — `users/{uid}/recurrences/{id}` (alterada)

| Campo | Tipo | Regras |
|-------|------|--------|
| type | `"expense" \| "income"` | inalterado |
| amountCents | int | > 0, inalterado |
| description | string | 1–120 chars, inalterado |
| categoryId | string | inalterado |
| **frequency** | `"weekly" \| "monthly" \| "yearly"` \| ausente | **ausente = mensal** |
| dayOfMonth | int 1–31 | exigido em mensal e anual; ignorado em semanal |
| **weekday** | `Weekday` (1–7, ISO: 1 = segunda) | exigido em semanal; reusa o tipo de `shared/dates.ts` |
| **monthOfYear** | int 1–12 | exigido em anual |
| startMonth | `YYYY-MM` | inalterado |
| endMonth | `YYYY-MM` \| null | inalterado |
| **skips** | string[] | chaves de ocorrência descartadas; pode ser vazio |

Regras:

1. A ausência de `frequency` é lida como `"monthly"` — é o que faz todo
   documento já gravado continuar válido, sem tocá-lo.
2. Cada frequência usa só o campo de repetição que lhe cabe. Os demais podem
   existir (sobra de uma edição anterior) e são ignorados.
3. `weekday` reusa o tipo `Weekday` de `shared/dates.ts`, no padrão ISO já
   usado nas tarefas do planner: 1 é segunda, 7 é domingo. O app não pode ter
   duas convenções de dia da semana.
4. `skips` guarda as chaves de ocorrência que a pessoa excluiu. A geração as
   ignora, e é isso que impede um previsto excluído de voltar.

## Datas geradas — derivadas

| Frequência | Ocorrências num mês | Data |
|------------|---------------------|------|
| semanal | 4 ou 5 | toda data do mês cujo dia da semana é `weekday` |
| mensal | 1 | `dayOfMonth`, com clamp para o último dia |
| anual | 1, e só no mês `monthOfYear` | `dayOfMonth`, com clamp |

O clamp é o mesmo já usado hoje: dia 31 em mês de 30 vira 30; dia 29 de
fevereiro vira 28 em ano não bissexto.

## Chave de idempotência — derivada

```text
semanal          → rec_{recorrência}_{AAAA-MM-DD}
mensal e anual   → rec_{recorrência}_{AAAA-MM}
```

A chave identifica **o que torna a ocorrência única naquela frequência**.
Mensal e anual geram no máximo uma por mês, então o mês basta — e manter essa
chave é o que preserva os lançamentos já gravados. Semanal precisa da data,
senão as quatro ou cinco ocorrências do mês colapsariam num documento só.

## Horizonte — derivado, assimétrico

| Frequência | Alcance | Meses consultados |
|------------|---------|-------------------|
| semanal, mensal | 3 meses | os 3 seguidos |
| anual | 12 meses | **apenas** o mês que contém a data |

A assimetria é deliberada (FR-009). Consultar os 12 meses para todas as
frequências quadruplicaria a leitura de quem só tem recorrência mensal, sem
retorno. Quem não tem recorrência anual paga exatamente o custo de hoje.

## Descarte de uma ocorrência

Excluir um lançamento previsto de recorrência grava a chave daquela ocorrência
em `skips`, **na mesma escrita** que apaga o lançamento. A geração passa a
ignorá-la.

Mora na própria recorrência porque ela já está carregada em memória quando a
materialização roda: não custa leitura nova, não pede coleção nem regra nova,
e cresce devagar — descartar é exceção.

Sem isso, excluir o aluguel previsto o traria de volta na próxima
materialização — defeito que existe desde a feature 001 e que a frequência
semanal tornaria frequente.

## Consulta da lista — sem `orderBy`

A coleção é lida inteira, sem ordenação no servidor, e ordenada em memória
pela próxima ocorrência.

O motivo é duro: o Firestore **exclui do resultado todo documento que não tem
o campo ordenado**. Ordenar por `dayOfMonth` faria a recorrência semanal —
que não tem esse campo — sumir da lista, das ativas e da geração, sem erro
nenhum. Com no máximo uma dezena de documentos, ordenar no servidor não compra
nada.

## Lançamento previsto — inalterado

Nasce previsto, é confirmado com um toque, editável isoladamente e vinculado
à recorrência que o gerou. Nada muda no formato nem no comportamento.

## O que acontece ao trocar a frequência

Os lançamentos previstos já criados **permanecem**. É a mesma regra que já
vale para qualquer edição de recorrência: mudar o valor não altera o que já
foi materializado. A pessoa exclui os que não quiser — nada é apagado por
efeito colateral de uma edição.
