# Phase 0 — Pesquisa: Assistente no Planner

---

## R1 — Onde as duas leituras vivem, sem tocar na que já funciona

**Decisão**: **não alterar `ParsedPhrase` nem `parsePhrase`.** Criar um tipo
novo, `PhraseReading`, que **contém** o resultado financeiro atual e acrescenta
o de tarefa:

```text
PhraseReading {
  kind: 'transaction' | 'task'   // o lado escolhido
  ambiguous: boolean             // os dois lados tinham sinal
  transaction: ParsedPhrase      // exatamente o que existe hoje
  task: ParsedTask               // o novo
}
```

**Rationale**: o SC-005 exige que as 45 frases financeiras produzam o mesmo
resultado de antes. Se `parsePhrase` mudasse de forma ou de comportamento,
essa garantia dependeria de os testes cobrirem tudo. Envolvendo em vez de
alterar, ela deixa de ser esperança: a função que o financeiro usa é
**literalmente a mesma**, com os mesmos testes rodando sem uma linha alterada.

**Consequência boa**: as duas leituras são calculadas sempre, o que torna a
troca instantânea e sem perda (SC-007) — não há o que reinterpretar.

**Alternativas descartadas**: acrescentar campos de tarefa a `ParsedPhrase`
(mistura duas coisas num tipo só e mexe no que está em produção); calcular a
segunda leitura só quando a pessoa troca (a troca deixaria de ser instantânea
e o código teria dois caminhos de interpretação para manter iguais).

---

## R2 — Como o lado é decidido

**Decisão**: duas perguntas independentes, e a combinação delas decide.

| Tem valor? | Tem marca de lembrete? | Leitura | Ambígua |
|---|---|---|---|
| não | **sim** | tarefa | não |
| **sim** | não | lançamento | não |
| **sim** | **sim** | lançamento | **sim** |
| não | não | lançamento | não |

**Rationale**: a última linha é a que protege quem já usa o app. "mercado"
sozinho não tem sinal de nenhum lado e hoje vira lançamento; mudar isso seria
regressão silenciosa para o uso de todo dia (FR-018).

**A ambígua escolhe lançamento** porque é o lado que tem valor em dinheiro, e
um valor preenchido é mais trabalhoso de reproduzir à mão do que um título.
A pessoa vê o aviso e troca com um toque quando for o caso.

**Marcas de lembrete**: `lembrar`, `lembrete`, `preciso`, `marcar`, `agendar`,
`reunião`, `consulta`, `aniversário`, `médico`, `dentista`, `prova`, `aula`.
Palavras, não frases — a lista é lida contra o texto normalizado que a feature
005 já produz.

**Alternativas descartadas**: pontuação ponderada com limiar (mais difícil de
explicar quando erra, e impossível de testar caso a caso); perguntar sempre
(acrescenta toque nas frases mais comuns, contra o FR-005b).

---

## R3 — Hora do dia, e o conflito dela com dinheiro

**Decisão**: a hora **exige marca**. São reconhecidos `às 7h`, `7h`, `7h30`,
`às 7:30`, `07:30`, `meio-dia`, `meia-noite`. Um número solto **nunca** é
hora.

**Rationale**: é a regra que impede "paguei 15 no lanche" de virar um
compromisso das 15h. Os dois textos contêm `15`; só a marca separa. Sem essa
regra, todo gasto entre R$ 0 e R$ 23 viraria candidato a hora, e o erro seria
frequente e silencioso.

**A hora sai da frase antes do valor**, pela mesma razão que a data já sai
antes: `15h` precisa deixar de ser um número antes de alguém procurar dinheiro
ali. A ordem passa a ser **data → hora → valor**.

**Fora de 0–23 ou minuto fora de 0–59**: a hora é descartada, não ajustada.
Ajustar inventaria um horário que a pessoa não disse (FR-010).

**Alternativas descartadas**: aceitar `às 15` sem `h` (ambíguo demais em
frases como "às 15 reais"); inferir manhã ou noite pelo contexto (acertaria
menos do que erraria, e erraria em silêncio).

---

## R4 — O título da tarefa

**Decisão**: o título é o que sobra depois de retirar data, hora, marcas de
lembrete e palavras de comando — reaproveitando a mesma limpeza que a
descrição financeira já usa, com a lista de ruído estendida.

**Rationale**: `lembrar de pagar o IPTU sexta` precisa virar `pagar o IPTU`,
não `lembrar de pagar o IPTU sexta`. As marcas de lembrete são sinal para a
decisão **e** ruído para o título — servem duas vezes.

**Título vazio é permitido no rascunho**, e o formulário abre com o campo em
branco e o foco nele. O planner não aceita tarefa sem nome, e o guarda disso
já existe em `TaskForm` (`if (!title.trim())`) — não é preciso criar validação
nova, só não preencher.

---

## R5 — Interpretar a cada tecla

**Decisão**: interpretar a frase inteira a cada mudança do campo, sem
_debounce_.

**Rationale**: é aritmética sobre uma frase de até 140 caracteres, com listas
de dezenas de palavras — na ordem de microssegundos. Um _debounce_ existiria
para economizar um custo que não existe, e criaria um intervalo em que a
leitura exibida discorda do texto na tela, que é pior do que o problema que
resolveria.

**Alternativas descartadas**: interpretar só no "Continuar" (a leitura ao vivo
foi a decisão da clarificação); `useMemo` sobre a frase (a interpretação já é
barata; memoizar acrescentaria código sem ganho mensurável).

---

## R6 — A entrega ao formulário de tarefa

**Decisão**: repetir exatamente a estrutura da feature 005. O
`AssistantContext` passa a guardar um rascunho que é **de um dos dois tipos**;
`routes/Planner.tsx` consome o de tarefa como `routes/Finance.tsx` já consome
o de lançamento — derivado do contexto, sem efeito que chama `setState`.

**Rationale**: o `TaskForm` tem a mesma forma do `TransactionForm` — `open`,
`editing`, `defaultDate`, `onClose`, `onSave`, corpo remontado por `key`. A
ponte que já existe serve sem invenção nenhuma.

**Navegação**: quando o lado é tarefa e a pessoa não está no planner, o painel
navega para **`/planner/dia`** (FR-017). Depois de salvar, `Planner.tsx`
move o dia em exibição para o dia da tarefa, como `Finance.tsx` move o mês.

**A fronteira continua**: o assistente não chama `createTask` nem
`createTransaction`. Produz rascunho e para.

---

## R7 — O que protege o financeiro

**Decisão**: três camadas, nesta ordem de confiança.

1. **Estrutural** — `parsePhrase` não muda. O caminho financeiro chama a mesma
   função de hoje.
2. **O conjunto de 45 frases roda sem alteração.** Nenhuma expectativa dele
   pode ser ajustada por causa desta feature; se uma quebrar, a resposta é
   corrigir o código novo, nunca o teste antigo.
3. **Um teste novo** afirma que, para cada uma das 45, `readPhrase` devolve
   `kind: 'transaction'` e um `transaction` **idêntico** ao que `parsePhrase`
   devolve sozinho.

**Rationale**: a camada 3 é a que pega o erro que as outras duas não pegam —
alguém decidir, mais tarde, que "mercado" deveria ser tarefa.

---

## R8 — Os conjuntos de frases

**Decisão**: dois arquivos de fixtures, com propósitos distintos.

**`tasks.ts`** — 30+ frases de tarefa com data e hora esperadas. Cobre todas
as formas de hora do R3, as datas que a feature 005 já entende, frases sem
hora e frases sem data. Alimenta o SC-002.

**`readings.ts`** — 20+ frases **rotuladas** com o lado esperado, em três
grupos: claramente lançamento, claramente tarefa e deliberadamente ambíguas.
Alimenta o SC-003, onde a ambígua conta como acerto quando é **anunciada**
como ambígua.

**Obrigatório em `readings.ts`**: o par `paguei 15 no lanche` e
`reunião às 15h`. É o caso do R3, e é o único jeito de travar por teste a
regra que separa dinheiro de hora.
