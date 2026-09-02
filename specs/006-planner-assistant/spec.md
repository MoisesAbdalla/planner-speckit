# Feature Specification: Assistente de Frase e Voz no Planner

**Feature Branch**: `006-planner-assistant`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Assistente de frase e voz também no planner. Hoje o assistente só entende gastos. Quero escrever ou falar 'lembrar de pagar o IPTU sexta', 'academia amanhã às 7h', 'reunião com o contador dia 10 às 15h30' e isso virar uma tarefa no planner — com título, data e hora quando eu disser a hora. O mesmo campo e o mesmo botão de hoje, sem escolher antes o que estou lançando: o assistente decide se a frase é um gasto ou uma tarefa e me mostra o que entendeu antes de gravar, para eu corrigir quando ele errar. Ele nunca grava sozinho: entrega o rascunho para o formulário que já existe — o de lançamento se for gasto, o de tarefa se for tarefa — e eu confirmo. O que ele não entendeu fica em branco, e ele nunca inventa valor nem hora. Quando a frase deixar dúvida entre gasto e tarefa, ele precisa deixar isso visível e fácil de trocar, em vez de escolher calado. Tudo que o assistente já faz no financeiro precisa continuar funcionando igual, sem passo novo: '20 no mercado' continua abrindo o lançamento preenchido como abre hoje. A interpretação continua rodando no próprio app, sem serviço externo e sem chave de API."

## Clarifications

### Session 2026-09-02

- Q: Quando o assistente diz se leu a frase como lançamento ou como tarefa? →
  A: **Ao vivo**, embaixo do campo, atualizando enquanto a pessoa escreve, com
  a troca ao lado da resposta. Continuar abre direto o formulário certo, sem
  passo intermediário para ninguém.
- Q: A frase ambígua deve ser anunciada de forma diferente da frase clara? →
  A: Sim. Clara: "Entendi como tarefa". Ambígua: "Pode ser tarefa ou
  lançamento", com a troca destacada. A troca continua disponível nos dois
  casos.
- Q: Depois de confirmar uma tarefa criada de outra tela, para onde o app
  leva? → A: Para a **visão de dia** do planner, no dia da tarefa — a única
  em que ela aparece sem ser procurada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Uma frase vira tarefa (Priority: P1)

A pessoa lembra, no meio de outra coisa, que precisa pagar o IPTU na sexta.
Toca no assistente — o mesmo botão de sempre —, escreve `lembrar de pagar o
IPTU sexta` e vê o formulário de tarefa abrir com o título e a data prontos.
Confirma. A tarefa está na sexta, no planner.

Hoje essa mesma frase abriria o formulário de **lançamento financeiro**,
porque é o único que o assistente conhece. O resultado seria um gasto sem
valor, na categoria errada, num lugar onde não era para estar.

**Why this priority**: é a feature inteira. Sem ela, o assistente continua
sendo metade do que foi pedido, e a metade que falta é justamente a da rotina
— que era o pedido original do app.

**Independent Test**: escrever uma frase de lembrete e verificar que o
formulário de **tarefa** abre preenchido, que nada foi gravado antes da
confirmação, e que a tarefa salva é idêntica à que o formulário criaria à mão.

**Acceptance Scenarios**:

1. **Given** o assistente aberto, **When** escrevo `lembrar de pagar o IPTU
   sexta`, **Then** o formulário de tarefa abre com o título `pagar o IPTU` e
   a data da sexta — e nada foi gravado ainda.
2. **Given** o formulário de tarefa preenchido, **When** confirmo, **Then** a
   tarefa aparece no planner, no dia certo, igual a uma criada à mão.
3. **Given** o formulário de tarefa preenchido, **When** cancelo, **Then**
   nada foi gravado.
4. **Given** que estou na página financeira, **When** a frase vira tarefa e eu
   confirmo, **Then** o app me leva à **visão de dia** do planner, no dia da
   tarefa, com ela à vista — o mesmo princípio que hoje leva um lançamento até
   o mês dele.
5. **Given** a frase `reunião com o contador`, sem data, **When** o assistente
   a interpreta, **Then** a data é hoje, e isso fica dito como padrão, não
   como entendimento.
6. **Given** a frase `20 no mercado`, **When** o assistente a interpreta,
   **Then** ela continua abrindo o **lançamento financeiro** preenchido,
   exatamente como abre hoje.

---

### User Story 2 - Trocar quando ele erra o palpite (Priority: P2)

A pessoa escreve `pagar 200 do IPTU sexta`. Isso é um gasto de R$ 200 ou um
lembrete de pagar? As duas leituras são defensáveis, e quem sabe é ela. O
assistente escolhe uma, **diz qual escolheu**, e deixa a outra a um toque de
distância — sem redigitar a frase.

**Why this priority**: sem isto, todo erro de palpite custa recomeçar, e um
assistente que obriga a recomeçar é mais lento que o formulário. Mas depende
da US1: só há o que trocar depois que as duas leituras existem.

**Independent Test**: escrever uma frase ambígua, ver qual leitura o
assistente escolheu, trocar para a outra e verificar que o que ele já tinha
entendido — data, hora, valor, título — foi aproveitado, sem redigitar nada.

**Acceptance Scenarios**:

1. **Given** o assistente aberto, **When** escrevo `pagar 200 do IPTU sexta`,
   **Then** vejo, ainda enquanto escrevo, que a frase **pode ser as duas
   coisas**, com a troca destacada — antes de qualquer gravação.
2. **Given** a frase `academia amanhã às 7h`, sem valor, **When** o assistente
   a interpreta, **Then** ele diz "entendi como tarefa", sem anunciar dúvida
   que não existe.
3. **Given** que ele leu como lançamento e eu queria tarefa, **When** troco,
   **Then** o formulário de tarefa abre com o título e a data já preenchidos a
   partir da mesma frase.
4. **Given** que troquei de leitura, **When** olho os campos, **Then** a data
   e a hora entendidas continuam lá — trocar de leitura não recomeça a
   interpretação do zero.
5. **Given** uma frase sem nenhuma ambiguidade (`20 no mercado`), **When**
   toco em Continuar, **Then** o formulário de lançamento abre direto, sem
   pergunta e sem passo novo — igual a hoje.
6. **Given** que o assistente leu como lançamento com convicção e eu queria
   tarefa, **When** procuro a troca, **Then** ela está lá — não só nas frases
   que ele marcou como duvidosas.

---

### User Story 3 - A hora do compromisso (Priority: P3)

`academia amanhã às 7h` e `reunião com o contador dia 10 às 15h30` são
compromissos com hora. A tarefa nasce com a hora preenchida, e o que sobra da
frase vira o título.

**Why this priority**: melhora bastante os itens de agenda, mas a tarefa já
funciona sem hora — o campo é opcional no planner. É refinamento sobre uma
base que já entrega valor.

**Independent Test**: escrever uma frase com hora e verificar que ela chega ao
campo de hora do formulário, e que sai do título.

**Acceptance Scenarios**:

1. **Given** a frase `academia amanhã às 7h`, **When** o assistente a
   interpreta, **Then** a hora é 07:00, a data é amanhã e o título é
   `academia`.
2. **Given** a frase `reunião dia 10 às 15h30`, **When** o assistente a
   interpreta, **Then** a hora é 15:30.
3. **Given** uma frase sem hora, **When** o assistente a interpreta, **Then**
   o campo de hora fica **vazio** — nunca uma hora inventada.
4. **Given** a frase `almoço meio-dia`, **When** o assistente a interpreta,
   **Then** a hora é 12:00.

---

### Edge Cases

- **Frase com valor e verbo de lembrete** (`lembrar de pagar 200 do IPTU`):
  é a definição de ambígua (FR-005d). O assistente diz "pode ser tarefa ou
  lançamento", escolhe um lado para preencher e destaca a troca.
- **Frase sem valor e sem verbo de lembrete** (`mercado`): não há sinal de
  nenhum dos lados. Continua como lançamento, que é o comportamento de hoje —
  mudar isso seria regressão para quem já usa o assistente.
- **Hora ambígua** (`às 7`): sem indicação de manhã ou noite, vale 07:00. Fora
  de 0–23, a hora é descartada em vez de ajustada.
- **Hora que é na verdade um valor** (`paguei 15 no lanche`): `15` sozinho, sem
  `h` nem `às`, é dinheiro. A hora exige a marca (`às 15h`, `15h30`).
- **Título vazio depois de tirar data, hora e palavras de comando**
  (`lembrar de sexta`): o formulário de tarefa abre com o título em branco e o
  foco nele — o planner não aceita tarefa sem nome.
- **Frase que não é nem uma coisa nem outra** (`bom dia`): o assistente diz que
  não entendeu, como já faz hoje.
- **Data no passado para uma tarefa** (`reunião ontem`): aceita, como o
  formulário de tarefa aceita — serve para registrar o que já aconteceu.

## Requirements *(mandatory)*

### Functional Requirements

**Decidir entre lançamento e tarefa**

- **FR-001**: O sistema DEVE decidir, a partir da frase, se ela descreve um
  gasto/receita ou uma tarefa, sem exigir que a pessoa escolha antes de
  escrever.
- **FR-002**: O sistema DEVE tratar como **tarefa** a frase sem valor em
  dinheiro que tenha **marca de lembrete** (`lembrar`, `lembrete`, `preciso`,
  `marcar`, `agendar`, `reunião`, `consulta`, `aniversário`, e os infinitivos
  de intenção como `pagar`, `comprar`, `ligar`) **ou hora do dia**.
- **FR-002a**: A **hora do dia é sinal de tarefa por si só**. `academia amanhã
  às 7h` não contém nenhuma palavra de lembrete, e ainda assim é um
  compromisso: quem diz a que horas não está registrando um gasto.
- **FR-003**: O sistema DEVE tratar como **gasto ou receita** a frase com
  valor em dinheiro e sem marca de lembrete — o comportamento de hoje.
- **FR-004**: O sistema DEVE tratar como **hora** apenas o número acompanhado
  de marca (`às 7h`, `15h30`, `meio-dia`), e nunca um número solto, que
  continua sendo dinheiro.
- **FR-005**: O sistema DEVE exibir a leitura escolhida — **lançamento** ou
  **tarefa** — logo abaixo do campo, **enquanto a pessoa escreve**, e oferecer
  a troca ao lado dela.
- **FR-005a**: A troca DEVE estar disponível **sempre**, e não apenas quando a
  frase for ambígua: o assistente também erra com convicção, e sem a troca a
  correção custaria apagar tudo e reescrever.
- **FR-005c**: O sistema DEVE distinguir na escrita a leitura **confiante** da
  **ambígua**: "Entendi como tarefa" quando só um lado tem sinais, "Pode ser
  tarefa ou lançamento" quando os dois têm — neste caso destacando a troca.
  Dizer a mesma coisa nos dois casos desperdiçaria a única informação que faz
  a pessoa olhar antes de confirmar justamente quando olhar vale a pena.
- **FR-005d**: Uma frase é **ambígua** quando reúne valor em dinheiro **e**
  sinal de tarefa (marca de lembrete ou hora). Só um dos dois presente é
  leitura confiante.
- **FR-005b**: Confirmar NÃO DEVE ganhar passo intermediário: de "Continuar"
  o formulário certo abre direto, do mesmo jeito que abre hoje no financeiro
  (FR-018).
- **FR-006**: Trocar de leitura DEVE aproveitar o que já foi entendido —
  data, hora, valor, título — em vez de reinterpretar do zero.

**A tarefa que nasce da frase**

- **FR-007**: O sistema DEVE extrair o **título** do que sobra da frase depois
  de retirar data, hora e palavras de comando.
- **FR-008**: O sistema DEVE reconhecer a data da tarefa nas mesmas formas que
  já reconhece no financeiro (`hoje`, `ontem`, `amanhã`, dia da semana,
  `dia N`, `DD/MM`), usando **hoje** quando a frase não disser nada.
- **FR-009**: O sistema DEVE reconhecer a hora em `às 7h`, `7h`, `15h30`,
  `7:30`, `meio-dia` e `meia-noite`.
- **FR-010**: O sistema NÃO DEVE inventar hora: sem marca de hora na frase, o
  campo fica vazio.
- **FR-011**: O sistema NÃO DEVE inventar valor, como já não inventa hoje.
- **FR-012**: O sistema DEVE deixar vazio qualquer campo que não reconheceu,
  em vez de preencher com palpite.

**Confirmar antes de gravar**

- **FR-013**: O sistema NÃO DEVE gravar nada a partir da frase sem confirmação
  explícita — nem tarefa, nem lançamento.
- **FR-014**: O rascunho de tarefa DEVE ser entregue ao **formulário de tarefa
  já existente**, preenchido; a conferência, a edição e o salvamento acontecem
  nele.
- **FR-015**: O sistema NÃO DEVE ter um segundo caminho de gravação de
  tarefas: o assistente produz o rascunho e o formulário grava.
- **FR-016**: O sistema DEVE mostrar, antes da gravação, o que entendeu da
  frase e o que é apenas padrão — como já faz no lançamento financeiro.
- **FR-017**: Depois de confirmar, o sistema DEVE mostrar o item onde ele
  vive: a tarefa na **visão de dia** do planner, posicionada no dia dela; o
  lançamento no financeiro, no mês dele. Ver o item no lugar é a prova de que
  ele existe — um aviso de texto pede que a pessoa acredite.

**Não estragar o que existe**

- **FR-018**: Uma frase que hoje vira lançamento financeiro DEVE continuar
  virando exatamente o mesmo lançamento, com os mesmos campos — sem passo
  novo, sem pergunta nova.
- **FR-019**: Os formulários de lançamento e de tarefa DEVEM continuar
  funcionando exatamente como hoje quando abertos pelos botões de sempre.
- **FR-020**: A entrada por voz DEVE alimentar a interpretação de tarefa do
  mesmo jeito que alimenta a de lançamento, sem caminho separado.
- **FR-021**: A interpretação DEVE continuar acontecendo no próprio
  aplicativo, sem serviço externo e sem credencial de terceiros.

### Key Entities

- **Leitura da frase**: o resultado da interpretação, agora com **duas formas
  possíveis** — lançamento ou tarefa — e a informação de qual foi escolhida,
  se houve dúvida, e o que foi entendido de cada campo. Na interface as duas
  se chamam **"lançamento"** e **"tarefa"**: chamar a primeira de "gasto"
  estaria errado para `salário 3200`, que é receita e também é lançamento.
- **Rascunho de tarefa**: título, data, hora e a informação de quais campos
  vieram da frase. Não é gravado; é entregue ao formulário de tarefa.
- **Marcas de lembrete**: as palavras que puxam a leitura para o lado da
  tarefa. São dado da interpretação, não do usuário.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Registrar uma tarefa pela frase leva **três interações** — abrir
  o assistente, escrever ou falar, e confirmar — a partir de qualquer tela.
- **SC-002**: Num conjunto fixo de ao menos 30 frases de tarefa, o assistente
  acerta **data e hora em pelo menos 90%** delas.
- **SC-003**: Num conjunto fixo de ao menos 20 frases rotuladas — claramente
  de lançamento, claramente de tarefa e deliberadamente ambíguas —, o
  assistente acerta a decisão em pelo menos **85%**. Uma frase ambígua conta
  como acerto quando ele a **anuncia como ambígua**, qualquer que seja o lado
  escolhido; contar de outro jeito premiaria o palpite sortudo.
- **SC-004**: O assistente **nunca** preenche uma hora que não estava na
  frase, e **nunca** um valor que não estava — zero ocorrências, sem exceção.
- **SC-005**: **Todas** as frases do conjunto financeiro que existe hoje
  continuam produzindo exatamente o mesmo resultado de antes desta feature —
  mesmos valores, mesmas datas, mesmas categorias.
- **SC-006**: Nenhuma frase resulta em tarefa ou lançamento gravado sem
  confirmação — zero ocorrências.
- **SC-007**: Quando o assistente erra a leitura, trocar para a outra custa
  **um toque**, e nenhum campo já entendido precisa ser redigitado.
- **SC-008**: Todo item criado pelo assistente termina **visível** onde ele
  vive, sem que a pessoa precise procurá-lo nem trocar de visão — zero casos
  de item gravado fora do campo de visão.

## Assumptions

- **Uma frase, um item.** Frases que descrevem duas coisas produzem apenas a
  primeira, como já acontece no financeiro.
- **Sem sinal de nenhum dos lados, a leitura é lançamento.** É o comportamento de
  hoje, e mudá-lo seria regressão para quem já usa o assistente.
- **A tarefa nasce sem repetição.** "academia toda segunda" cria uma tarefa
  única; a repetição continua sendo escolhida no formulário. Interpretar
  repetição na frase é uma feature à parte.
- **A troca entre as leituras acontece no assistente**, ao lado da leitura
  exibida ao vivo: depois de o formulário abrir, trocar significaria fechar um
  formulário e abrir outro, que é mais passos do que o SC-007 admite.
- **A leitura ao vivo não custa espera** porque a interpretação é cálculo
  local sobre uma frase curta — a mesma que hoje responde instantaneamente no
  financeiro.
- **Hora sem período vale a hora cheia lida** (`às 7` = 07:00). Interpretar
  intenção de manhã ou noite acertaria menos do que erraria.
- **Só português (pt-BR)**, como o resto do app.
- **A voz continua sendo a do navegador**, com as mesmas limitações e a mesma
  ausência nos navegadores que não a oferecem.
