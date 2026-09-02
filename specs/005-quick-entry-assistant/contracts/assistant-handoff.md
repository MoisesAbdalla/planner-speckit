# Contrato: do assistente até a gravação

Quem faz o quê, e a fronteira que não pode ser cruzada.

```text
  botão (qualquer tela)
        │
        ▼
  AssistantPanel ── texto ou voz ──► parsePhrase()
        │                                  │
        │                            ParsedPhrase
        ▼                                  ▼
  AssistantContext.setPending({ parsed, phrase })
        │
        │  (se estiver fora do financeiro: navega para /financas)
        ▼
  FinancePage consome o pendente e abre TransactionForm preenchido
        │
        ▼
  a pessoa confere e salva  ──►  createTransaction()  (o caminho de sempre)
        │
        ▼
  se o mês do lançamento ≠ mês em exibição: a página vai até ele
```

---

## A fronteira

**O assistente nunca chama `createTransaction`, `writeBatch` ou qualquer
escrita.** Ele produz `ParsedPhrase` e para. Se alguma tarefa futura precisar
"salvar direto do assistente", isso é violação do FR-010 e do FR-012, não
otimização.

Consequência prática: o FR-012 ("grava igual ao manual") não é um
comportamento que alguém precise lembrar de manter — não existe segundo
caminho para divergir.

---

## `AssistantContext`

| Membro | Papel |
|---|---|
| `pending: PendingDraft \| null` | O rascunho esperando um formulário |
| `setPending(draft)` | Chamado pelo painel após interpretar |
| `consume(): PendingDraft \| null` | Devolve **e limpa** — leitura única |

`consume` limpa por definição: sem isso, voltar ao financeiro reabriria o
formulário com um rascunho velho, e a pessoa gravaria duas vezes o que já
gravou. É a mesma classe de erro que o R9 evita pela navegação.

---

## `TransactionForm` — o que muda e o que não muda

**Muda**: ganha props opcionais.

| Prop | Efeito |
|---|---|
| `prefill?: ParsedPhrase` | Nasce com os campos preenchidos pelo que foi entendido |
| `requireExplicitCategory?: boolean` | Não pré-seleciona a primeira categoria; o campo começa vazio |

**Não muda**: sem essas props, o comportamento é **byte a byte** o de hoje —
inclusive a pré-seleção da primeira categoria. FR-021 é isso, e o teste de
regressão da fase 5 existe para prová-lo.

**O bloqueio já existe**: `handleSubmit` já recusa salvar sem categoria
(`setSaveError('Escolha uma categoria.')`). `requireExplicitCategory` só deixa
de preencher; não cria validação nova.

---

## `useSpeechRecognition`

`src/shared/useSpeechRecognition.ts`

| Membro | Papel |
|---|---|
| `supported: boolean` | Decide se o microfone **existe** na interface (FR-014) |
| `listening: boolean` | Estado visível de escuta (FR-016) |
| `transcript: string` | Parcial enquanto fala, final ao terminar |
| `error: SpeechError \| null` | `'not-allowed' \| 'no-speech' \| 'audio-capture' \| 'network' \| 'aborted'` |
| `start() / stop()` | Controle explícito |

**`supported: false` esconde o microfone**, não o desabilita: um botão cinza
que não faz nada é pior do que a ausência dele — parece defeito do app.

**Cada erro tem sua frase.** `not-allowed` explica como reativar a permissão;
`no-speech` diz que não ouviu nada; `network` diz que a transcrição não pôde
ser feita agora. "Erro ao ouvir" não diz a ninguém o que fazer.

**Áudio nunca é guardado** (FR-018): o hook trabalha com o texto que a API
devolve e não retém o áudio.
