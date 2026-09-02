# Phase 0 — Pesquisa: Assistente de Lançamento por Frase e por Voz

Decisões tomadas antes do desenho, com o motivo e o que foi descartado.

---

## R1 — Reconhecimento de voz sem dependência nem chave

**Decisão**: usar a **Web Speech API** do próprio navegador
(`SpeechRecognition` / `webkitSpeechRecognition`), com `lang = 'pt-BR'`,
`continuous = false` e `interimResults = true`.

**Rationale**: é a única forma de transcrever sem serviço externo e sem
credencial (FR-023), e não acrescenta nenhuma dependência ao projeto
(Princípio V). `continuous = false` porque a pessoa fala **uma frase** e para —
escuta contínua ficaria ligada esperando silêncio. `interimResults = true`
porque o texto aparecendo enquanto se fala é o que torna óbvio que o app está
ouvindo (FR-016), sem precisar inventar uma animação para dizer isso.

**Alternativas descartadas**: `MediaRecorder` + transcrição num serviço
(exige chave e conta paga, contraria a decisão do usuário); bibliotecas de
reconhecimento em WebAssembly (dezenas de MB de modelo, contra o Princípio V).

**Fatos que mudam o desenho**:

- **Disponibilidade**: Chrome (desktop e Android), Edge e Safari (macOS 14.1+,
  iOS 14.5+, sempre com o prefixo `webkit`). **Firefox não oferece.** Por isso
  FR-014 e FR-022 não são cortesia: são a diferença entre funcionar e quebrar
  para uma parte real dos navegadores.
- **Contexto seguro obrigatório**: só funciona em HTTPS ou `localhost` — os
  dois casos do projeto.
- **Erros a tratar por nome**: `not-allowed` (permissão negada),
  `no-speech` (nada foi dito), `audio-capture` (sem microfone), `network`,
  `aborted`, `service-not-allowed`. Cada um vira uma mensagem diferente
  (FR-017); um "erro ao ouvir" genérico não diz à pessoa o que fazer.
- **TypeScript não tem esses tipos.** `SpeechRecognition` não está em
  `lib.dom.d.ts`; é preciso um arquivo de declaração local. Isso é
  digitação, não dependência.
- **Privacidade, dita como é**: no Chrome o áudio é enviado aos servidores do
  Google para virar texto. O app não grava nem guarda áudio (FR-018), mas
  seria desonesto chamar essa feature de "100% local" — a spec já registra
  isso e a interface não deve prometer o contrário.

---

## R2 — Ler dinheiro escrito em português

**Decisão**: extrair o trecho numérico com expressão regular e converter os
centavos **pelo `parseAmountToCents` que já existe** em
`src/shared/money.ts`. O parser da frase não faz aritmética de dinheiro.

**Rationale**: o Princípio IV exige centavos inteiros e o projeto já tem uma
implementação testada disso. Um segundo conversor de dinheiro seria a segunda
fonte de verdade do valor — exatamente o que a constituição proíbe para
totais, pela mesma razão.

**Regra do ponto e da vírgula**: vírgula sempre separa centavos. Ponto separa
milhar **quando seguido de exatamente três dígitos** (`1.200` = mil e
duzentos); fora disso, é tratado como vírgula (`20.50` = R$ 20,50), porque
teclado de celular e transcrição produzem ponto com frequência e "vinte reais
e cinquenta" é a leitura óbvia.

**Alternativas descartadas**: `Intl.NumberFormat` reverso (não existe parse na
API); aceitar qualquer número solto na frase sem regra (produziria o erro que
o SC-003 proíbe em absoluto).

---

## R3 — Números por extenso

**Decisão**: tabela de unidades (0–19), dezenas, centenas e `mil`, compostas
por `e`, cobrindo até 999.999, mais o sufixo opcional `e N centavos`.

**Rationale**: FR-002 nasceu da fala, e a fala raramente dita dígitos —
"quarenta reais" é o formato natural. O teto em centenas de milhar cobre
salário e compras sem inventar um sistema para milhões que ninguém vai dizer.

**Alternativas descartadas**: biblioteca de extenso (dependência nova para
~60 linhas de tabela); só dígitos (deixaria a US2 quase inútil, já que a
transcrição do Chrome escreve por extenso com frequência em pt-BR).

---

## R4 — Datas ditas em linguagem comum

**Decisão**: reconhecer, nesta ordem, `anteontem`, `ontem`, `hoje`,
`amanhã`, `depois de amanhã`, dia da semana com `passada`/`passado`/`que vem`,
`dia N`, e `DD/MM` (ano corrente). Padrão: hoje.

**Rationale**: são as formas que aparecem em fala espontânea. A ordem importa:
`anteontem` precisa ser testado antes de `ontem`, senão a segunda casa dentro
da primeira e "anteontem" vira ontem — um erro de um dia que ninguém percebe.

**Regra do dia da semana**: sem qualificador, `sexta` significa a sexta-feira
**mais recente que já passou** (incluindo hoje) — quem lança um gasto está
quase sempre falando do passado. `sexta que vem` olha para frente.

**Regra de `dia N`**: dia N do **mês em exibição**, não do mês corrente — quem
está olhando agosto e escreve "dia 5" quer 5 de agosto.

**Alternativas descartadas**: biblioteca de datas naturais (todas em inglês,
e dependência nova); aceitar só `DD/MM` (transformaria a frase em formulário).

---

## R5 — Descobrir a categoria

**Decisão**: três tentativas em ordem, parando na primeira que acertar:

1. **Nome de categoria dito na frase** — comparação normalizada (minúsculas,
   sem acento) contra as categorias da própria pessoa.
2. **Histórico** — a categoria mais usada com aquela descrição nos últimos 3
   meses; empate resolvido pelo lançamento mais recente.
3. **Dicionário de palavras comuns** — `mercado`, `feira`, `padaria`,
   `posto`, `farmácia`, `uber`, `aluguel`… mapeadas para **nomes** canônicos
   de categoria, resolvidos contra as categorias existentes.

Nenhuma das três acertando, a categoria fica **nula** (FR-008, FR-008a).

**Rationale**: a ordem vai do mais específico ao mais genérico. O histórico
vem antes do dicionário de propósito: se a pessoa lança "academia" em Lazer, é
isso que vale para ela, mesmo que um dicionário genérico diga Saúde.

**O dicionário mapeia nomes, não ids**, e só sugere se aquela categoria
existir para a pessoa (FR-020). Categoria renomeada ou apagada simplesmente
não produz sugestão, em vez de produzir uma errada.

**Alternativas descartadas**: gravar um par "descrição → categoria" a cada
correção (coleção nova, regras novas, escritas novas — descartado na
clarificação); usar só o mês em exibição (esqueceria o mês passado).

---

## R6 — De onde vem o histórico

**Decisão**: uma leitura única por sessão, na primeira abertura do assistente:
`where('month', 'in', [mês, mês−1, mês−2])` sobre `transactions`, guardada em
memória.

**Rationale**: `in` com três valores é uma consulta só, atendida pelo índice
de campo único que o Firestore mantém sozinho — nenhum índice composto a
criar, nenhuma regra nova. Três meses é o mesmo horizonte que as recorrências
já usam, então o app passa a ter **uma** noção de "passado recente".

**Por que não `onSnapshot`**: o histórico só precisa estar certo no instante
em que a frase é interpretada. Um listener vivo custaria conexão permanente
para melhorar uma sugestão que a pessoa pode corrigir com um toque.

**Alternativas descartadas**: reaproveitar `useTransactions` do mês em
exibição (é um mês só); 12 meses (maior leitura do app, para ganho marginal).

---

## R7 — Onde o assistente vive e como fala com o formulário

Este é o ponto que o código atual **não** suporta como está.

**O problema**: o botão precisa existir em qualquer tela (FR-024), logo mora
em `AppShell`, que está **fora** das rotas. Mas o formulário de lançamento e o
estado do mês vivem dentro de `src/routes/Finance.tsx`. O botão não alcança
nenhum dos dois.

**Decisão**: um contexto pequeno — `AssistantProvider` — montado dentro de
`RequireAuth`, guardando **um rascunho pendente**. O painel do assistente
publica o rascunho ali; a página financeira o consome, abre o próprio
formulário já preenchido e limpa o pendente. Aberto de fora do financeiro, o
assistente navega para `/financas` e o rascunho está esperando quando a
página monta.

**Rationale**: é o menor mecanismo que resolve as três exigências (botão
global, formulário único, navegação entre telas) sem mover o estado do mês
para cima nem duplicar o formulário. O rascunho é dado efêmero de UI: não vai
para o Firestore, não sobrevive a um recarregamento — e não deve mesmo, já que
nada foi confirmado.

**Alternativas descartadas**: passar o rascunho pelo `state` da navegação do
react-router (some num F5 no meio do caminho e vira estado fantasma na
história do navegador); subir mês e formulário para um contexto global
(refatoração grande na página que a feature nem precisa mudar).

---

## R8 — Categoria vazia sem mexer no caminho manual

**Decisão**: uma prop opcional em `TransactionForm` — quando ligada, a
categoria começa **sem seleção** e o formulário não cai na primeira da lista.
Só o assistente a liga.

**Rationale**: hoje `TransactionForm` calcula
`categoryId = ... : (options[0]?.id ?? '')`, ou seja, **sempre** há uma
categoria escolhida. Reaproveitar o formulário sem essa prop faria o FR-008
virar mentira silenciosa. E a metade difícil já está pronta: o guarda
`if (!categoryId) setSaveError('Escolha uma categoria.')` **já existe** no
`handleSubmit` — a mudança é não preencher, não é criar bloqueio.

**Rationale da prop, e não de mudar o padrão**: FR-021 é explícito — nada
feito para o assistente pode aparecer no caminho manual.

**Alternativas descartadas**: aceitar a primeira categoria e marcá-la como
"palpite" (contraria FR-007/FR-008 no espírito: continua salvando o que a
pessoa não disse); cair em "Outros" (acumula lixo justamente na categoria que
deveria ser exceção).

---

## R9 — Voltar para o mês certo depois de salvar

**Decisão**: depois de um salvamento **originado do assistente**, a página
financeira ajusta o mês em exibição para o mês do lançamento, quando forem
diferentes.

**Rationale**: no dia 1º, "gastei 20 ontem" grava no mês anterior e some da
vista; o reflexo é lançar de novo. A duplicata nasceria da tela, não do app.

**Só no caminho do assistente**, de novo por causa do FR-021: hoje um
lançamento manual com data de outro mês não navega, e mudar isso seria mexer
no caminho manual. A página distingue os dois porque sabe se o formulário foi
aberto por um rascunho pendente.

---

## R10 — O conjunto de frases que torna o SC-002 verificável

**Decisão**: um arquivo de fixtures com **no mínimo 40 frases** e o resultado
esperado de cada uma, consumido pelos testes unitários.

**Composição obrigatória**: todos os formatos de dinheiro do FR-001; números
por extenso do FR-002 (US2); todas as formas de data do FR-004; frases de
receita e de gasto; ao menos **5 frases sem valor algum** e ao menos 3 sem
categoria reconhecível.

**Rationale**: sem esse conjunto, "acerta 90%" não é verificável e o SC-002
não é um critério, é uma opinião. As frases sem valor são as que provam o
SC-003 — o critério absoluto —, e por isso são obrigatórias, não ilustrativas.

**Métrica**: os testes contam acertos de valor, tipo e data e falham abaixo de
90%; qualquer valor preenchido numa frase sem número reprova a suíte, sem
tolerância percentual.
