# Contract: Firestore Schema & Queries

**Feature**: 001-routine-finance-planner | **Data model**: [../data-model.md](../data-model.md)

Este contrato define os caminhos, queries e invariantes que o app e as
Security Rules ([firestore.rules](./firestore.rules)) devem honrar. Mudar
qualquer item aqui exige atualizar rules, índices e hooks juntos.

## Caminhos

```text
users/{uid}                                  # perfil
users/{uid}/transactions/{txId}              # movimentações
users/{uid}/recurrences/{recId}              # recorrências financeiras
users/{uid}/categories/{catId}               # categorias
users/{uid}/tasks/{taskId}                   # itens de rotina
users/{uid}/taskOverrides/{taskId}_{date}    # exceções de ocorrência
users/{uid}/monthStats/{YYYY-MM}             # cache de agregação mensal
```

## Queries canônicas (e índices)

| Uso | Query | Índice |
|-----|-------|--------|
| Lista do mês (financeiro) | `transactions where month == 'YYYY-MM' orderBy date, createdAt` | composto: month ASC, date ASC, createdAt ASC |
| Previstos no planner | `transactions where status == 'planned' and date >= a and date <= b` | composto: status ASC, date ASC |
| Recorrências ativas | `recurrences where endMonth == null` | single-field (automático) |
| Categorias visíveis | `categories where archived == false orderBy sortOrder` | composto: archived ASC, sortOrder ASC |
| Tarefas candidatas ao intervalo | `tasks` (coleção inteira do usuário; expansão client-side) | — |
| Overrides do intervalo | `taskOverrides where date >= a and date <= b` | single-field (automático) |
| Saldo acumulado | `monthStats` (coleção inteira, ≤ 1 doc/mês) | — |

Listeners (`onSnapshot`) são usados nas quatro primeiras queries; as demais
podem ser `getDocs` sob demanda.

## Invariantes de escrita (o app garante; rules validam shape)

1. `amountCents` é inteiro > 0 em transactions e recurrences.
2. `month` de uma transaction é sempre `date.slice(0, 7)`.
3. Transaction com `source == "recurrence"` tem `recurrenceId` preenchido e
   ID no formato `rec_{recurrenceId}_{YYYY-MM}`; materialização usa
   create-if-missing (nunca sobrescreve doc existente).
4. Toda escrita que cria/edita/exclui/confirma uma transaction `confirmed`
   atualiza `monthStats/{month}` na mesma batch, aplicando os deltas com
   **`FieldValue.increment()`** — nunca ler-somar-gravar. Só o incremento
   atômico sobrevive a duas confirmações simultâneas em dispositivos
   diferentes (edge case de edição concorrente da spec).
4a. `monthStats` é cache derivado: deve existir uma rotina de reconstrução
   que o recalcule a partir das transactions (`rebuildMonthStats`), de modo
   que uma divergência seja sempre recuperável e o cache nunca vire a única
   fonte de verdade (Princípio IV da constituição).
5. Confirmar = update `status: "planned" → "confirmed"` (campo único +
   updatedAt + delta em monthStats).
6. Categoria nunca é deletada — `archived: true`.
7. TaskOverride usa ID `{taskId}_{YYYY-MM-DD}`; marcar concluída cria/edita
   o override com `done: true`.
8. Exclusão de série de task recorrente: delete do doc Task + deleção em
   batch dos seus taskOverrides (best-effort; órfãos são ignorados na
   leitura por não haver Task correspondente).

## Autenticação (Firebase Auth)

| Operação | Método |
|----------|--------|
| Cadastro | `createUserWithEmailAndPassword` |
| Login | `signInWithEmailAndPassword` |
| Login Google | `signInWithPopup` (desktop) / `signInWithRedirect` (mobile) |
| Recuperar senha | `sendPasswordResetEmail` (FR-004) |
| Logout | `signOut` (FR-003) |

Primeiro login (qualquer método): criar `users/{uid}` + semear categorias
padrão em uma batch idempotente (só se o perfil não existir).

## Variáveis de ambiente (config do app)

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
`VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — em `.env.local`
(não commitado); `.env.example` documenta as chaves sem valores.
