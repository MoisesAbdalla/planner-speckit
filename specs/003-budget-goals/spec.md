# Feature Specification: Metas de Orçamento

**Feature Branch**: `003-budget-goals`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Metas de orçamento por categoria. Quero definir quanto pretendo gastar em cada categoria no mês (Alimentação, Transporte etc.) e também um teto geral do mês. O app deve me avisar quando eu estiver chegando perto do limite, não só quando eu já tiver estourado — avisar depois chega tarde para eu mudar o comportamento. A meta vale para todo mês por padrão, mas preciso poder ajustar só um mês atípico (viagem, festa) sem mexer no padrão. Deve usar o resumo e os gráficos que já existem, sem tornar o registro de gasto mais trabalhoso."

## Clarifications

### Session 2026-09-01

- Q: A meta é só por categoria ou também um teto geral do mês? → A: Os dois.
  O teto geral responde "posso gastar?" e o por categoria responde "no quê?".
- Q: O que o app faz quando uma meta é ultrapassada? → A: Avisa antes de
  chegar ao limite e destaca ao passar. Avisar só depois de estourar chega
  tarde para mudar o comportamento.
- Q: A meta vale igual todo mês ou muda? → A: Vale todo mês por padrão, com
  ajuste pontual para um mês atípico sem alterar o padrão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Saber se ainda posso gastar (Priority: P1)

Como usuário no meio do mês, quero abrir o app e descobrir em segundos se
ainda posso gastar: quanto do meu teto do mês já foi, quanto sobra e se esse
ritmo me leva a estourar antes do dia 30.

**Why this priority**: é a pergunta que motiva a feature inteira. Um teto
geral já muda o comportamento, mesmo sem detalhamento por categoria, e pode
ser entregue sozinho.

**Independent Test**: definir um teto mensal, registrar gastos até passar de
80% e conferir que o app sinaliza a aproximação; passar de 100% e conferir o
destaque de excesso.

**Acceptance Scenarios**:

1. **Given** um teto mensal definido e nenhum gasto, **When** o usuário abre o
   resumo, **Then** vê quanto pode gastar no mês e que nada foi usado ainda.
2. **Given** um teto mensal e gastos somando menos de 80% dele, **When** o
   usuário abre o resumo, **Then** vê o quanto já foi e o quanto sobra, sem
   nenhum alerta.
3. **Given** gastos entre 80% e 100% do teto, **When** o usuário abre o
   resumo, **Then** vê um aviso de que está chegando perto do limite.
4. **Given** gastos acima do teto, **When** o usuário abre o resumo, **Then**
   vê destacado que passou, e em quanto passou.
5. **Given** nenhum teto definido, **When** o usuário abre o resumo, **Then**
   o app funciona exatamente como antes, sem espaço vazio nem cobrança.
6. **Given** lançamentos previstos ainda não confirmados no mês, **When** o
   usuário olha o teto, **Then** consegue distinguir o que já foi gasto do
   que ainda vai sair.

---

### User Story 2 - Descobrir onde estou estourando (Priority: P2)

Como usuário, quero definir quanto pretendo gastar em cada categoria e ver,
sem procurar, quais delas estão perto do limite ou já passaram — para saber
onde cortar, e não só que preciso cortar.

**Why this priority**: é o detalhamento que torna a meta acionável. Depende
de existir o hábito do teto geral (US1), mas entrega valor próprio.

**Independent Test**: definir metas em duas categorias, gastar acima em uma e
abaixo em outra, e conferir que a lista identifica de relance qual estourou.

**Acceptance Scenarios**:

1. **Given** metas definidas em algumas categorias, **When** o usuário abre a
   distribuição de gastos, **Then** vê, para cada categoria com meta, quanto
   foi usado dela.
2. **Given** uma categoria acima de 80% da meta, **When** o usuário abre o
   resumo, **Then** identifica essa categoria sem precisar comparar números.
3. **Given** uma categoria que passou da meta, **When** o usuário abre o
   resumo, **Then** ela aparece destacada, com o quanto passou.
4. **Given** categorias sem meta definida, **When** o usuário abre o resumo,
   **Then** elas continuam aparecendo normalmente, sem alerta e sem parecer
   erro.
5. **Given** metas por categoria que somam mais que o teto geral, **When** o
   usuário termina de defini-las, **Then** o app avisa da inconsistência sem
   impedir que ele salve.

---

### User Story 3 - Ajustar um mês atípico sem perder o padrão (Priority: P3)

Como usuário em um mês fora do normal — viagem, festa, uma compra grande —
quero elevar a meta só daquele mês, sem alterar o valor que vale para os
demais, e voltar ao padrão sozinho no mês seguinte.

**Why this priority**: sem isso, um mês atípico faz o app mentir e a pessoa
abandona as metas. Mas só faz sentido depois de existirem metas (US1/US2).

**Independent Test**: definir uma meta padrão, ajustá-la só no mês corrente,
conferir que o mês seguinte volta ao padrão e que os meses passados não
mudaram.

**Acceptance Scenarios**:

1. **Given** uma meta padrão definida, **When** o usuário a ajusta no mês
   corrente, **Then** o novo valor vale só naquele mês.
2. **Given** um mês com meta ajustada, **When** o usuário navega para o mês
   seguinte, **Then** vê o valor padrão de volta.
3. **Given** um mês com meta ajustada, **When** o usuário olha aquele mês,
   **Then** percebe que o valor ali é excepcional, e não o padrão.
4. **Given** um mês ajustado, **When** o usuário desfaz o ajuste, **Then** o
   mês volta a seguir o padrão.
5. **Given** uma alteração no valor padrão, **When** o usuário olha meses
   passados, **Then** eles mantêm o valor que valia à época — o histórico não
   é reescrito.

---

### Edge Cases

- O que acontece quando o usuário arquiva uma categoria que tinha meta? A
  meta para de ser cobrada, e o histórico dos meses passados continua íntegro.
- Como o app se comporta quando a meta é definida no meio do mês, com gastos
  já registrados? O consumo considera o mês inteiro, não só a partir da
  definição.
- O que aparece quando a meta é zero? É tratado como "não quero gastar nada
  aqui": qualquer gasto já é excesso.
- Como fica um mês em que a pessoa não gastou nada numa categoria com meta?
  Sem alerta, e sem parecer falha.
- O que acontece quando existem lançamentos previstos que ainda vão sair? O
  aviso considera o previsto, tanto no teto geral quanto na categoria, senão
  a pessoa é surpreendida no dia do vencimento — e o teto e a categoria
  passariam a discordar entre si.
- Uma meta ajustada num mês futuro continua valendo quando aquele mês chegar?
  Sim — o ajuste pertence ao mês, não ao momento em que foi feito.
- Como o aviso de aproximação se comporta no primeiro dia do mês, quando um
  único gasto grande já passa de 80%? Avisa igual: o alerta é sobre o
  consumo, não sobre o calendário.

## Requirements *(mandatory)*

### Functional Requirements

**Definir metas**

- **FR-001**: O usuário MUST poder definir um teto de gasto mensal para o mês
  inteiro.
- **FR-002**: O usuário MUST poder definir uma meta de gasto por categoria,
  para quantas categorias quiser, sem obrigação de cobrir todas.
- **FR-003**: Metas MUST valer para todos os meses por padrão, sem exigir
  redefinição a cada mês.
- **FR-004**: O usuário MUST poder ajustar qualquer meta apenas para um mês
  específico, sem alterar o valor padrão.
- **FR-005**: O usuário MUST poder desfazer o ajuste de um mês, voltando o mês
  ao valor padrão.
- **FR-006**: O usuário MUST poder remover uma meta, deixando a categoria (ou
  o mês) sem limite.
- **FR-007**: O aplicativo MUST rejeitar meta negativa antes de gravar, com
  mensagem clara; meta igual a zero é válida e significa "nenhum gasto
  previsto aqui". Esta validação é garantida pelo aplicativo e coberta por
  teste automatizado — a camada de armazenamento não consegue inspecionar
  valores aninhados numa lista, e achatar a estrutura para permitir isso
  custaria o histórico por mês que esta feature existe para preservar.
- **FR-008**: Alterar o valor padrão de uma meta MUST NOT alterar meses
  passados, que preservam o valor vigente à época.
- **FR-009**: O sistema MUST avisar quando as metas por categoria somarem mais
  que o teto geral, sem impedir o usuário de salvar.

**Acompanhar o consumo**

- **FR-010**: O sistema MUST exibir, para o teto do mês, quanto já foi usado,
  quanto sobra e a proporção entre eles.
- **FR-011**: O sistema MUST exibir, para cada categoria com meta, quanto foi
  usado dela.
- **FR-012**: O sistema MUST sinalizar visualmente quando o consumo atinge a
  faixa de aproximação do limite, antes de ultrapassá-lo.
- **FR-013**: O sistema MUST destacar de forma distinta o consumo que
  ultrapassou a meta, informando em quanto passou.
- **FR-014**: Os sinais de aproximação e de excesso MUST NOT depender apenas
  de cor.
- **FR-015**: O acompanhamento de **toda** meta — o teto geral e cada
  categoria — MUST considerar os lançamentos previstos ainda não
  confirmados, distinguindo-os do que já foi gasto. Todas as metas usam a
  mesma base: dois números que não fecham entre si custam mais confiança do
  que a precisão que uma base diferente ganharia.
- **FR-016**: Categorias sem meta MUST continuar aparecendo normalmente, sem
  alerta e sem aparência de pendência.
- **FR-017**: O consumo de um mês MUST considerar todos os gastos daquele mês,
  independentemente de quando a meta foi definida.

**Integração com o que já existe**

- **FR-018**: As metas MUST aparecer no resumo mensal e na distribuição por
  categoria que já existem, sem criar uma área separada só para elas.
- **FR-019**: Registrar um gasto MUST NOT ganhar nenhum passo por causa desta
  feature.
- **FR-020**: O app sem nenhuma meta definida MUST se comportar como antes,
  sem espaço vazio nem convite insistente.
- **FR-021**: Arquivar uma categoria MUST interromper a cobrança da meta dela,
  preservando o histórico dos meses anteriores.
- **FR-022**: As metas MUST valer para a conta do usuário, aparecendo em
  qualquer aparelho em que ele entrar.

### Key Entities

- **Meta padrão**: intenção de gasto que vale para todos os meses; tem um
  alvo (o mês inteiro ou uma categoria específica) e um valor. Ausência de
  meta significa "sem limite", nunca zero.
- **Ajuste mensal de meta**: exceção que substitui o valor padrão em um mês
  específico; pertence ao mês, não ao momento em que foi criado. Remover o
  ajuste devolve o mês ao padrão.
- **Consumo da meta**: visão derivada, calculada a partir dos gastos do mês e
  da meta vigente — nunca armazenada. Expressa quanto foi usado, quanto
  sobra, a proporção e o estado (dentro, perto do limite, ultrapassada).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Com um teto definido, o usuário responde "ainda posso gastar
  este mês?" em até 3 segundos após abrir o app, sem fazer contas.
- **SC-002**: Com metas por categoria definidas, o usuário identifica qual
  categoria está perto do limite ou passou dela em até 3 segundos, sem
  comparar números.
- **SC-003**: Definir a primeira meta leva no máximo 3 interações a partir da
  tela de finanças.
- **SC-004**: Registrar um gasto continua exigindo o mesmo número de
  interações de antes desta feature.
- **SC-005**: Ajustar a meta de um mês atípico e voltar ao padrão no mês
  seguinte funciona em 100% das tentativas, sem alterar o valor padrão.
- **SC-006**: Alterar o valor padrão não muda nenhum mês passado em 100% dos
  casos testados.
- **SC-007**: Os estados de aproximação e de excesso são distinguíveis também
  em escala de cinza e sob as formas comuns de daltonismo.
- **SC-008**: O app sem metas definidas apresenta exatamente as mesmas telas
  de antes desta feature.

## Assumptions

- A faixa de aproximação começa em 80% do valor da meta. É o ponto em que
  ainda dá para mudar o comportamento no mês corrente; avisar antes disso
  viraria ruído, e depois chegaria tarde. Valor fixo nesta versão, não
  configurável.
- Metas cobrem apenas gastos. Meta de receita ("quero ganhar X") é outro
  problema — depende de metas de médio prazo e de acompanhamento diferente —
  e fica fora do escopo.
- As metas vivem na conta, não no aparelho: são uma decisão financeira, e
  devem aparecer no celular e no PC igualmente. Difere da preferência de tema,
  que é local por natureza.
- Meses passados usam o valor de meta vigente à época, e não o padrão atual —
  do contrário, mudar a meta hoje reescreveria a avaliação do passado.
- O acompanhamento continua sendo mensal, alinhado ao resto do app. Metas
  semanais ou por período livre ficam fora do escopo.
- Nenhuma notificação fora do app (push, e-mail) entra aqui. Os avisos vivem
  na interface, como o destaque de item atrasado do planner. Notificação
  segue sendo candidata a feature futura.
- Não há sugestão automática de meta a partir da média dos meses anteriores
  nesta versão. É uma boa ideia, mas depende de histórico e vale ser decidida
  com dados de uso reais.
- Continua valendo o que as features anteriores assumiram: interface em
  pt-BR, moeda única (R$), uso pessoal e individual.
