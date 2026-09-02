# Contrato: do assistente até a tarefa gravada

```text
  botão (qualquer tela)
        │
        ▼
  AssistantPanel ── texto ou voz ──► readPhrase()
        │                                  │
        │                          PhraseReading
        │                     (as DUAS leituras, sempre)
        ▼
  linha ao vivo: "Entendi como tarefa"  ·  [trocar]
        │
        ▼  Continuar
  setPending({ reading, kind, phrase })
        │
        ├── kind 'transaction' ──► /financas ──► TransactionForm  (já existe)
        └── kind 'task' ─────────► /planner/dia ─► TaskForm       (novo)
                                                        │
                                                        ▼
                                        a pessoa confere e salva
                                                        │
                                                        ▼
                                          createTask()  (o caminho de sempre)
                                                        │
                                                        ▼
                              o dia em exibição vai até o dia da tarefa
```

---

## A fronteira, de novo

**O assistente não chama `createTask` nem `createTransaction`.** Produz
rascunho e para. A regra vale igual para o lado novo: se uma tarefa parecer
simples demais para passar pelo formulário, isso é o FR-013 sendo contornado,
não uma simplificação.

---

## `AssistantContext` — o que muda

| Membro | Antes | Agora |
|---|---|---|
| `pending` | rascunho de lançamento | rascunho **com `kind`** |
| `viewMonth` | mês do financeiro | igual |
| `viewDate` | — | **novo**: o dia em exibição no planner |

`viewDate` existe pela mesma razão que `viewMonth`: "dia 5" precisa do
período que a pessoa está olhando, e o painel vive fora das duas páginas.

### Qual período manda

Os dois coexistem, e `extractDate` só aceita um mês. A regra:

| Onde o assistente foi aberto | Mês usado |
|---|---|
| `/planner/*` | `monthOf(viewDate)` |
| qualquer outra tela | `viewMonth` |

Sem essa regra, "dia 5" escrito no planner em agosto viraria 5 de setembro se
o financeiro estivesse em setembro — num campo que a pessoa provavelmente não
confere, e sem nenhum sinal de que algo foi decidido por ela.

**Cada página só reage ao seu lado.** `Finance.tsx` ignora `kind: 'task'` e
`Planner.tsx` ignora `kind: 'transaction'`. Sem isso, chegar ao financeiro com
um rascunho de tarefa pendente abriria o formulário errado, preenchido com
dados que não são dele.

---

## `TaskForm` — o que muda e o que não muda

**Muda**: ganha uma prop opcional.

| Prop | Efeito |
|---|---|
| `prefill?: ParsedTask` | Nasce com título, data e hora preenchidos pelo que foi entendido |

O formulário também exibe **o que foi entendido e o que é padrão**, como o
`TransactionForm` já faz: sem essa linha, `dateFromPhrase` seria um campo
criado e lido por ninguém, e a data de hoje apareceria como se tivesse sido
entendida da frase (FR-016).

A `key` do corpo precisa incluir a identidade do rascunho, senão duas tarefas
seguidas pelo assistente reaproveitam o corpo montado e a segunda aparece com
os campos da primeira — o mesmo cuidado que o `TransactionForm` já tem.

**Não muda**: sem a prop, o comportamento é o de hoje, byte a byte. O
formulário aberto pelo botão de sempre não sabe que o assistente existe, e há
um teste de regressão para provar isso.

**Nenhuma validação nova**: `TaskForm` já recusa salvar sem título
(`if (!title.trim())`). Título vazio no rascunho apenas não preenche.

---

## A troca de lado

Acontece **no painel**, ao lado da leitura ao vivo, antes de qualquer
formulário abrir.

- Custa **um toque** e não reinterpreta nada: as duas leituras já existem.
- Está disponível **sempre**, não só nas frases ambíguas — o assistente também
  erra com convicção.
- Nas ambíguas, ela é **destacada**, e o texto muda de "Entendi como X" para
  "Pode ser tarefa ou lançamento".
