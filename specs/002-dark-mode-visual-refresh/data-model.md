# Data Model: Modo Escuro e Refinamento Visual

**Date**: 2026-08-29 | **Plan**: [plan.md](./plan.md)

Esta feature **não altera o Firestore**. Nada novo é gravado, nenhuma regra
muda. O que existe aqui é uma preferência local e duas visões derivadas.

## Preferência de tema — `localStorage`

| Chave | Valores | Significado |
|-------|---------|-------------|
| `planner:theme` | `"light"` \| `"dark"` \| ausente | ausente = seguir o sistema |

Regras:

1. Valor ausente ou desconhecido é tratado como "seguir o sistema" — nunca
   como erro.
2. Leitura e escrita ficam dentro de `try/catch`: aba anônima ou
   armazenamento bloqueado não podem quebrar o app (FR-007).
3. A preferência vale só no aparelho (FR-005). Não vai para a conta.

**Transições**: `sistema → claro → escuro → sistema`, em ciclo pelo controle
de tema. Escolher "sistema" remove a chave.

## Tema resolvido — derivado, nunca guardado

```text
preferência (light | dark | ausente)
        +
tema do sistema (prefers-color-scheme)
        ↓
tema efetivo (light | dark)  →  atributo data-theme no <html>
```

Enquanto a preferência estiver ausente, mudanças do tema do sistema com o app
aberto reaplicam o tema efetivo na hora (FR-006).

## Série de comparação mensal — derivada

Calculada a partir dos `monthStats` que o app já lê para o saldo acumulado.
Nada é gravado.

**Só efetivado.** Os `monthStats` somam apenas movimentações confirmadas, então
a comparação entre meses mostra o que de fato aconteceu. Isso é deliberado:
misturar previsto de meses futuros com realizado de meses passados tornaria a
série incomparável consigo mesma. O previsto do mês em foco aparece no
medidor, que é onde ele importa para a decisão (FR-012).

| Campo | Tipo | Regra |
|-------|------|-------|
| month | `YYYY-MM` | um por mês do horizonte |
| incomeCents | int | entradas efetivadas do mês |
| expenseCents | int | saídas efetivadas do mês |
| balanceCents | int | `income − expense` |
| isCurrent | bool | marca o mês em foco (recebe a ênfase) |

Regras:

1. Horizonte de até **6 meses**, terminando no mês visualizado.
2. Meses sem registro entram com zeros, para o eixo não ter buracos.
3. A escala das colunas usa o maior valor absoluto da série; com a série toda
   zerada, nenhuma coluna é desenhada e o estado vazio assume (FR-014).

## Distribuição por categoria — derivada, com dobra

Vem de `summarizeMonth`, que já existe e já é testada.

**Só efetivado**, pela mesma razão da série mensal: "para onde meu dinheiro
foi" é uma pergunta sobre o passado. O previsto ainda não tem categoria
realizada — ele é uma intenção, e entra no medidor, não aqui (FR-012).

| Campo | Tipo | Regra |
|-------|------|-------|
| categoryId | string | `"__outros__"` na fatia agregada |
| name | string | nome da categoria, ou "Outros" |
| cents | int | soma das saídas efetivadas |
| share | 0–1 | fração do total de saídas |
| colorSlot | 0–7 | derivado de `sortOrder % 8` da categoria — estável por entidade |

Regras:

1. Ordenação decrescente por valor — a dominante sempre primeiro (SC-004).
2. No máximo **6 categorias nominais**; o restante soma em "Outros", que usa
   um cinza neutro e nunca um matiz gerado (research R3).
3. **A cor segue a categoria, nunca a posição dela no ranking.** O slot é
   derivado do `sortOrder` que a categoria já tem, então gastar mais em
   Transporte num mês não repinta as outras. Atribuir cor por posição na
   ordenação violaria a regra "color follows the entity, never its rank" e
   faria a leitura mudar de significado a cada mês.
4. Slots nunca são ciclados além do oitavo: a cauda dobra em "Outros".
5. Total das fatias, incluindo "Outros", é igual ao total de saídas — sem
   sobra de arredondamento.

## Proporção do mês — derivada

| Campo | Regra |
|-------|-------|
| incomeCents | entradas efetivadas |
| expenseCents | saídas efetivadas |
| plannedExpenseCents | saídas previstas, ainda não confirmadas |
| ratio | `expense / income`, limitado a 1 para o preenchimento |
| overspent | `expense > income` — muda a leitura do medidor |

Com `income = 0` e alguma saída, o medidor mostra estado de excesso em vez de
dividir por zero.
