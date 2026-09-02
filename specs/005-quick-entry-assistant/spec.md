# Feature Specification: Assistente de Lançamento por Frase e por Voz

**Feature Branch**: `005-quick-entry-assistant`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Assistente de lançamento por frase e por voz no financeiro. Quero registrar um gasto escrevendo uma frase curta — 'registre gasto de 20 reais mercado', 'salário 3200', 'paguei 47,90 no posto ontem' — ou falando a mesma coisa por áudio, que o app transcreve. O assistente entende a frase e preenche o lançamento: valor, se é gasto ou receita, categoria e data. Ele nunca grava sozinho: mostra o rascunho preenchido e eu confirmo com um toque, do mesmo jeito que confirmo um previsto hoje. O que ele não conseguiu entender fica em branco para eu completar, e ele nunca inventa um valor. A interpretação roda no próprio app, sem serviço externo e sem chave de API: a transcrição usa o reconhecimento de voz do navegador e a leitura da frase é feita no código do app. Onde não houver reconhecimento de voz, o campo de texto precisa continuar funcionando normalmente. Tudo que já existe no lançamento manual continua valendo — o formulário atual não pode ficar mais trabalhoso, e o assistente é um caminho a mais, não um substituto."

## Clarifications

### Session 2026-09-01

- Q: Onde deve ficar o campo em que a frase é escrita ou falada? → A: Botão
  flutuante presente em todas as telas, inclusive no planner, abrindo o
  assistente por cima da tela atual.
- Q: Onde a pessoa confere e confirma o lançamento interpretado? → A: O
  assistente abre o **formulário de lançamento já existente**, preenchido com
  o que entendeu; a conferência e o salvamento acontecem nele.
- Q: Quanto histórico alimenta a sugestão de categoria? → A: Os últimos 3
  meses de lançamentos, lidos uma vez na primeira abertura do assistente e
  mantidos em memória durante a sessão — o mesmo horizonte que as
  recorrências já usam.
- Q: O que o formulário mostra quando a categoria não foi reconhecida? → A:
  Campo vazio, com "Escolha uma categoria", e o salvar aguardando a escolha —
  estado que **só** existe quando o assistente abre o formulário; abri-lo
  manualmente continua exatamente como hoje.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Lançar escrevendo uma frase (Priority: P1)

A pessoa acabou de sair do mercado. Toca no botão do assistente — que está em
qualquer tela do app —, escreve `20 no mercado` num campo único e vê o
lançamento montado na hora: R$ 20,00, gasto, Alimentação, hoje. Confere com o
olho e confirma. Três gestos, ainda na fila do caixa.

Hoje isso custa abrir o formulário, escolher o tipo, digitar o valor, escrever
a descrição, escolher a categoria e conferir a data. O assistente não faz nada
que o formulário não faça — ele chega ao mesmo lugar em menos passos, e mostra
o resultado antes de gravar.

**Why this priority**: é a feature inteira em uma frase. Se só isto existir, o
lançamento diário já ficou mais rápido, e a voz (US2) é a mesma coisa com
outra entrada. Sem isto, não há nada para a voz alimentar.

**Independent Test**: escrever uma frase no campo do assistente e verificar
que o rascunho aparece com valor, tipo, categoria e data preenchidos; que nada
foi gravado antes da confirmação; e que o lançamento confirmado é idêntico ao
que o formulário manual produziria.

**Acceptance Scenarios**:

1. **Given** o campo do assistente vazio, **When** escrevo `20 no mercado`,
   **Then** o formulário de lançamento abre preenchido com R$ 20,00, tipo
   gasto, a categoria correspondente a mercado e a data de hoje — e nada foi
   gravado ainda.
2. **Given** o formulário preenchido pelo assistente, **When** salvo, **Then**
   o lançamento aparece na lista do mês e no saldo, exatamente como um
   lançamento manual.
3. **Given** o formulário preenchido pelo assistente, **When** cancelo,
   **Then** nada foi gravado e o mês continua como estava.
4. **Given** a frase `salário 3200`, **When** o assistente a interpreta,
   **Then** o tipo é receita, o valor é R$ 3.200,00 e a categoria é a de
   receita correspondente.
5. **Given** a frase `paguei 47,90 no posto ontem`, **When** o assistente a
   interpreta, **Then** a data é a de ontem, não a de hoje.
6. **Given** a frase `no mercado`, sem número algum, **When** o assistente a
   interpreta, **Then** o valor fica **vazio**, o foco vai para ele, e nenhum
   valor é chutado.
7. **Given** o formulário preenchido com a categoria errada, **When** eu a
   troco ali mesmo, **Then** os campos que já estavam certos permanecem e eu
   não redigito nada.

---

### User Story 2 - Lançar falando (Priority: P2)

A pessoa está dirigindo, cozinhando, carregando sacola. Toca no microfone,
fala `gastei quarenta reais na farmácia`, e vê a frase transcrita virar o
mesmo rascunho da US1, para conferir e confirmar.

**Why this priority**: é o pedido original e o que torna o recurso realmente
cômodo, mas depende inteiramente da US1 — a voz só produz texto; quem entende
o texto é a US1. Além disso, nem todo navegador oferece reconhecimento de voz,
então esta história **precisa** ser opcional por construção.

**Independent Test**: com o microfone permitido, falar uma frase e verificar
que a transcrição aparece no campo, editável, e produz o mesmo rascunho que a
frase escrita produziria. Com o reconhecimento indisponível ou negado,
verificar que o campo de texto continua funcionando por inteiro.

**Acceptance Scenarios**:

1. **Given** um navegador com reconhecimento de voz, **When** toco no
   microfone e falo `gastei quarenta reais na farmácia`, **Then** a frase
   transcrita aparece no campo e o rascunho traz R$ 40,00, gasto e a categoria
   de saúde.
2. **Given** que estou falando, **When** olho a tela, **Then** vejo claramente
   que o app está ouvindo e consigo parar a qualquer momento.
3. **Given** que a transcrição saiu errada, **When** corrijo o texto, **Then**
   o rascunho é refeito a partir do texto corrigido.
4. **Given** um navegador **sem** reconhecimento de voz, **When** abro o
   assistente, **Then** não há botão de microfone quebrado ou inerte, e o
   campo de texto funciona normalmente.
5. **Given** que neguei a permissão do microfone, **When** toco no microfone,
   **Then** recebo uma explicação clara do que aconteceu e o campo de texto
   continua utilizável.
6. **Given** a fala `vinte reais no mercado`, **When** o assistente a
   interpreta, **Then** o valor é R$ 20,00 — número por extenso é o formato
   natural da fala.

---

### User Story 3 - Acertar a categoria pelo que já foi lançado (Priority: P3)

A pessoa lança `mercado` toda semana, sempre na mesma categoria. Da segunda
vez em diante o assistente já chega com aquela categoria — não porque alguém
programou a palavra "mercado", mas porque é o que essa pessoa faz.

**Why this priority**: melhora a taxa de acerto sem mudar nada do fluxo, e é o
que faz o assistente parecer que aprendeu. Mas é refinamento: sem ela, o
dicionário de palavras comuns e a escolha manual já resolvem.

**Independent Test**: lançar uma descrição incomum com uma categoria escolhida
à mão, escrever a mesma descrição de novo e verificar que a categoria vem
preenchida.

**Acceptance Scenarios**:

1. **Given** que já lancei `padaria` em Alimentação, **When** escrevo
   `padaria 12`, **Then** a categoria vem preenchida com Alimentação.
2. **Given** que lancei `academia` em Saúde e depois passei a lançar em Lazer,
   **When** escrevo `academia 90`, **Then** a categoria sugerida é a que uso
   com mais frequência hoje.
3. **Given** uma descrição que nunca usei e que não está no dicionário,
   **When** o assistente a interpreta, **Then** a categoria fica **vazia**, e
   não uma escolha qualquer.

---

### Edge Cases

- **Frase sem número nenhum** (`almoço com a Ana`): valor vazio, o resto
  preenchido, foco no valor. Nunca um valor inventado.
- **Dois números na frase** (`gastei 20 dia 5`): o que vem depois de "dia" é
  data, o outro é valor. Quando os dois papéis forem ambíguos (`47 20`), o
  valor recebe o primeiro — mas a tela precisa deixar visível o que foi
  entendido como o quê, para o erro ser percebido antes de gravar.
- **Formatos de dinheiro**: `20`, `20 reais`, `R$ 47,90`, `47,90`, `1.200,00`,
  `3200`, `20,5`. O ponto separa milhar e a vírgula separa centavos, como se
  escreve em português.
- **Número por extenso**, comum na fala: `vinte`, `quarenta e cinco`, `cem`,
  `mil e duzentos`.
- **Categoria dita que não existe** (a pessoa apagou ou renomeou): campo
  vazio, com "Escolha uma categoria", sem criar categoria nova por conta
  própria e sem cair na primeira da lista.
- **Frase que não é um lançamento** (`bom dia`): o assistente diz que não
  entendeu e oferece o formulário com o texto na descrição — nunca falha em
  silêncio nem grava nada.
- **Transcrição ruim ou vazia** (ruído, fala cortada): o texto que veio fica
  no campo para ser corrigido; nada é interpretado às cegas.
- **Frase com várias compras** (`47,90 no posto e 20 no almoço`): monta o
  primeiro lançamento e deixa claro que só um foi montado.
- **Data futura na frase** (`sexta que vem`): aceita, como o formulário manual
  aceita uma data futura — e, se cair no mês seguinte, é para lá que a tela
  vai depois de salvar.
- **Data de outro mês** (`gastei 20 ontem`, no dia 1º): o lançamento pertence
  ao mês anterior. Sem levar a pessoa até lá, ele desaparece da vista e o
  reflexo é lançar de novo — a duplicata nasce da tela, não do app.
- **Mesma frase enviada duas vezes** (toque duplo, aparelho lento): duas
  confirmações explícitas geram dois lançamentos; uma confirmação nunca gera
  dois.

## Requirements *(mandatory)*

### Functional Requirements

**Interpretar a frase**

- **FR-001**: O sistema DEVE reconhecer o valor em reais nos formatos usados
  em português: `20`, `20 reais`, `R$ 47,90`, `47,90`, `1.200,00`, `3200`,
  `20,5`.
- **FR-002**: O sistema DEVE reconhecer números por extenso comuns na fala
  (`vinte`, `quarenta e cinco`, `cem`, `mil e duzentos`).
- **FR-003**: O sistema DEVE decidir entre gasto e receita pelas palavras da
  frase (`gastei`, `paguei`, `comprei` para gasto; `recebi`, `salário`,
  `ganhei`, `entrou` para receita) e, na ausência de indício, assumir
  **gasto**, deixando a escolha visível e trocável no rascunho.
- **FR-004**: O sistema DEVE reconhecer datas ditas em linguagem comum:
  `hoje`, `ontem`, `anteontem`, dia da semana (`sexta`, `sexta passada`),
  `dia 5`, `05/09` — e usar **hoje** quando a frase não disser nada.
- **FR-005**: O sistema DEVE reconhecer a categoria por três caminhos, nesta
  ordem: o nome de uma categoria existente dito na frase; o histórico de
  lançamentos da própria pessoa (FR-019); um dicionário de palavras comuns
  (`mercado`, `feira`, `posto`, `farmácia`) mapeadas para categorias.
- **FR-006**: O sistema DEVE usar como descrição o que sobrou da frase depois
  de retirar valor, data e palavras de comando, preservando o que a pessoa
  escreveu (`20 no mercado` vira `mercado`).
- **FR-007**: O sistema NÃO DEVE inventar valor em nenhuma circunstância: sem
  número reconhecível, o campo fica vazio e recebe o foco.
- **FR-008**: O sistema DEVE deixar vazio **qualquer** campo que não conseguiu
  reconhecer, em vez de preencher com um palpite.
- **FR-008a**: Quando a categoria não for reconhecida, o formulário aberto
  pelo assistente DEVE exibir o campo **sem categoria escolhida** e só
  permitir salvar depois da escolha. Hoje o formulário seleciona a primeira
  categoria da lista automaticamente; esse comportamento DEVE permanecer
  intacto quando ele é aberto manualmente, e o estado vazio DEVE existir
  apenas no caminho do assistente.
- Q: E se a data entendida cair fora do mês em exibição? → A: Depois de
  salvar, o app navega até o mês onde o lançamento caiu, com ele visível na
  lista.
- **FR-009**: O sistema DEVE deixar visível, no rascunho, o que entendeu de
  cada campo, para que um erro seja percebido antes da confirmação.

**Confirmar antes de gravar**

- **FR-010**: O sistema NÃO DEVE gravar nada a partir da frase sem uma
  confirmação explícita da pessoa.
- **FR-011**: O rascunho DEVE ser entregue ao **formulário de lançamento já
  existente**, preenchido; a conferência, a edição de qualquer campo e o
  salvamento acontecem nele, com o mesmo comportamento de sempre.
- **FR-012**: O sistema NÃO DEVE ter um segundo caminho de gravação: o
  assistente produz o rascunho e o formulário grava, de modo que "grava igual
  ao manual" seja verdade por construção, e não algo a manter em dia.
- **FR-013**: Quando o sistema não conseguir interpretar a frase de forma
  alguma, DEVE dizer isso e oferecer o formulário com o texto na descrição.

**Falar em vez de escrever**

- **FR-014**: O sistema DEVE oferecer entrada por voz **quando o navegador a
  suportar**, e omitir o recurso quando não — sem botão inerte nem erro.
- **FR-015**: A transcrição DEVE aparecer no campo de texto, editável, antes
  de virar rascunho.
- **FR-016**: O sistema DEVE indicar de forma inequívoca quando está ouvindo,
  e permitir interromper a qualquer momento.
- **FR-017**: Permissão negada, falha ou transcrição vazia DEVEM produzir uma
  mensagem clara, com o campo de texto seguindo utilizável.
- **FR-018**: O sistema NÃO DEVE gravar nem armazenar áudio.

**Aprender com o histórico**

- **FR-019**: O sistema DEVE sugerir, para uma descrição, a categoria que a
  própria pessoa mais usou com aquela descrição nos **últimos 3 meses**.
- **FR-019a**: Esse histórico DEVE ser lido **uma vez** por sessão, na
  primeira abertura do assistente, e mantido em memória — abrir o assistente
  pela segunda vez não custa leitura nova.
- **FR-020**: O sistema NÃO DEVE criar categorias por conta própria; só
  seleciona categorias que já existem.

**Não estragar o que existe**

- **FR-021**: O formulário manual DEVE continuar funcionando exatamente como
  hoje, com o mesmo número de passos e a mesma pré-seleção de categoria — o
  assistente é um caminho a mais, e nenhuma mudança feita para ele pode
  aparecer no caminho manual.
- **FR-022**: O sistema DEVE funcionar por inteiro, menos a voz, em navegador
  sem reconhecimento de fala.
- **FR-023**: A interpretação DEVE acontecer no próprio aplicativo, sem
  serviço externo e sem credencial de terceiros.
- **FR-024**: O assistente DEVE ser alcançável a partir de **qualquer tela**
  do app, inclusive do planner, por um botão sempre presente.
- **FR-025**: Abrir e fechar o assistente NÃO DEVE alterar nem perder o que
  estava na tela por baixo — mês em exibição, rolagem, formulário aberto.
- **FR-026**: Depois de salvar, o sistema DEVE mostrar o lançamento gravado
  na lista do mês a que ele pertence — navegando até esse mês quando a data
  entendida cair fora do mês em exibição, e saindo do planner para o
  financeiro quando o assistente tiver sido aberto de lá. Ver o lançamento no
  lugar é a prova de que ele existe; um aviso de texto pede que a pessoa
  acredite.

### Key Entities

- **Frase**: o texto escrito ou transcrito. Não é armazenada depois de virar
  rascunho.
- **Rascunho interpretado**: valor, tipo, categoria, data e descrição, mais a
  informação de **quais campos vieram da frase e quais faltam**. É o que o
  assistente entrega ao formulário — ele não grava nada por conta própria.
- **Dicionário de palavras**: palavra comum para categoria. Só produz sugestão
  quando aquela categoria existe para essa pessoa.
- **Memória de descrições**: descrição já lançada para a categoria mais usada
  com ela, derivada dos lançamentos dos últimos 3 meses. É leitura do que já
  existe — nenhum dado novo é gravado para sustentá-la.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar um gasto pela frase leva **três interações** — abrir o
  assistente, escrever ou falar, e confirmar — contra as seis do formulário
  manual, **a partir de qualquer tela do app**, sem navegar antes.
- **SC-002**: Num conjunto fixo de ao menos 40 frases representativas, o
  assistente acerta **valor, tipo e data em pelo menos 90%** delas.
- **SC-003**: Nesse mesmo conjunto, o assistente **nunca** preenche um valor
  que não estava na frase — zero ocorrências, sem exceção.
- **SC-004**: Nenhuma frase resulta em lançamento gravado sem confirmação —
  zero ocorrências.
- **SC-005**: O rascunho aparece sem espera perceptível depois da frase.
- **SC-006**: Quando o assistente erra um campo, a pessoa corrige no próprio
  formulário que já está aberto, sem voltar ao assistente e sem redigitar
  nenhum campo que já estava certo.
- **SC-007**: O lançamento manual continua produzindo exatamente os mesmos
  resultados de antes desta feature.
- **SC-008**: Em navegador sem reconhecimento de voz, todo o restante do
  assistente funciona, e nada na tela sugere um recurso quebrado.
- **SC-009**: Todo lançamento feito pelo assistente termina **visível na
  lista** do mês a que pertence, sem que a pessoa precise procurá-lo — zero
  casos de lançamento gravado fora do campo de visão.

## Assumptions

- **Uma frase, um lançamento.** Frases com várias compras montam apenas a
  primeira nesta versão, e a pessoa é avisada disso.
- **O lançamento nasce confirmado**, com data de hoje quando a frase não
  disser outra. Lançamento previsto continua vindo das recorrências.
- **Gasto é o padrão** quando a frase não indica o tipo: é a maioria dos
  lançamentos, e o campo fica visível para troca.
- **Só português (pt-BR)**, como o resto do app.
- **O reconhecimento de voz é o do navegador.** Em alguns navegadores o áudio
  é processado nos servidores do fabricante do navegador para virar texto —
  isso é do navegador, não do app; o app não grava nem guarda áudio. Onde o
  recurso não existir, o assistente segue funcionando por escrito.
- **As categorias são as da própria pessoa**, inclusive renomeadas ou criadas
  por ela. O dicionário de palavras só sugere categoria que exista.
- **O planner (tarefas) fica para depois.** Esta feature é só do financeiro; a
  decisão entre "isto é um gasto" e "isto é uma tarefa" é mais um ponto de
  erro e merece a sua própria feature.
- **O histórico usado para sugerir categoria são os últimos 3 meses de
  lançamentos**, lidos uma vez por sessão. Nenhum dado novo é gravado por
  causa disso, e nenhuma coleção nova é criada.
