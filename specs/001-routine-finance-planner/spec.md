# Feature Specification: Planner de Rotina com Gestor Financeiro

**Feature Branch**: `001-routine-finance-planner`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "quero criar um planner para minha rotina tanto quanto diaria, semanal e mensal com um gestor financeiro embutido junto onde posso registrar gastos rotineiros, gastos avulsos do mes e afins, todos os tipos, registrar faturamentos tambem para conseguir manter um melhor controle financeiro do que entra e o que sai, quero usar o firebase como banco de dados e autenticador pois quero utilizar o mesmo app em multiplataformas e quero que use o frontend-design para fazer um app bem bonito e intuitivo que seja elegante e relativamente simples de usar"

## Clarifications

### Session 2026-08-29

- Q: Lançamentos gerados por recorrência entram efetivados ou como
  "previstos" a confirmar? → A: Previstos + confirmação com 1 toque; só
  contam no saldo real após confirmação; o resumo mostra saldo real e saldo
  previsto.
- Q: O saldo do mês é independente ou acumulado entre meses? → A: Os dois —
  destaque para o resultado do próprio mês (entradas − saídas), com o saldo
  acumulado desde o início de uso exibido como número secundário.
- Q: Contas financeiras aparecem dentro do planner ou em área separada? →
  A: Integrado na visão — lançamentos financeiros previstos do dia aparecem
  nas visões do planner com visual distinto de tarefas e podem ser
  confirmados dali; movimentações já efetivadas não aparecem no planner.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar e acompanhar gastos e ganhos do mês (Priority: P1)

Como usuário, quero registrar rapidamente qualquer movimentação financeira —
um gasto rotineiro (aluguel, mercado, assinatura), um gasto avulso (um
presente, um conserto) ou um faturamento (salário, freela, venda) — com
valor, categoria, descrição e data, e ver imediatamente o resumo do meu mês:
quanto entrou, quanto saiu, o saldo, e para onde o dinheiro está indo por
categoria.

**Why this priority**: é o coração do pedido do usuário — "manter um melhor
controle financeiro do que entra e o que sai". Sozinho já entrega valor real
e utilizável todos os dias.

**Independent Test**: pode ser testado de forma independente criando uma
conta, registrando 3 gastos e 1 ganho, e verificando que o resumo mensal
mostra totais e distribuição por categoria corretos.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado no mês atual, **When** ele registra um
   gasto de R$ 50,00 na categoria "Alimentação" com data de hoje, **Then** o
   gasto aparece na lista do mês e o total de saídas e o saldo do mês são
   atualizados imediatamente.
2. **Given** um usuário com gastos e ganhos registrados no mês, **When** ele
   abre o resumo mensal, **Then** vê total de entradas, total de saídas,
   saldo (entradas − saídas) e a distribuição de gastos por categoria.
3. **Given** um gasto registrado por engano, **When** o usuário pede para
   excluí-lo, **Then** o sistema pede confirmação e, após confirmar, o gasto
   some da lista e os totais são recalculados.
4. **Given** um usuário visualizando o mês atual, **When** ele navega para um
   mês anterior, **Then** vê as movimentações e o resumo daquele mês, sem
   misturar com outros meses.

---

### User Story 2 - Planejar a rotina diária, semanal e mensal (Priority: P2)

Como usuário, quero criar itens de rotina (tarefas e compromissos) e vê-los
organizados em três visões — dia, semana e mês — podendo marcar cada item
como concluído. Itens recorrentes (ex.: "academia toda segunda, quarta e
sexta", "pagar aluguel todo dia 5") aparecem automaticamente nos dias certos
sem eu precisar recriá-los.

**Why this priority**: é a segunda metade do produto ("planner para minha
rotina diária, semanal e mensal"). Vem depois do financeiro porque o usuário
enfatizou o controle financeiro como motivação principal.

**Independent Test**: pode ser testado criando uma tarefa avulsa para hoje e
uma tarefa recorrente semanal, verificando que ambas aparecem nas visões de
dia/semana/mês corretas e que marcar como concluída atualiza só a ocorrência
daquele dia.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele cria a tarefa "Estudar
   inglês" para hoje às 19h, **Then** a tarefa aparece na visão do dia, na
   semana atual e no mês atual.
2. **Given** uma tarefa recorrente "Academia" toda segunda/quarta/sexta,
   **When** o usuário abre a visão da semana, **Then** a tarefa aparece nos
   três dias corretos daquela semana.
3. **Given** uma tarefa de hoje pendente, **When** o usuário a marca como
   concluída, **Then** ela aparece como concluída apenas na data de hoje, e
   as próximas ocorrências continuam pendentes.
4. **Given** tarefas pendentes de dias anteriores, **When** o usuário abre a
   visão do dia atual, **Then** consegue identificar visualmente o que ficou
   atrasado.

---

### User Story 3 - Usar a mesma conta no PC e no celular (Priority: P3)

Como usuário, quero entrar com a minha conta em qualquer dispositivo (PC ou
celular) e encontrar exatamente os mesmos dados — tarefas e finanças — com
alterações feitas em um aparelho aparecendo no outro sem ação manual.

**Why this priority**: é o motivo declarado da escolha do backend
("utilizar o mesmo app em multiplataformas"). Depende de existir conteúdo
(US1/US2) para sincronizar, por isso vem depois.

**Independent Test**: pode ser testado entrando com a mesma conta em duas
janelas/dispositivos, registrando um gasto em um e verificando que ele
aparece no outro em poucos segundos.

**Acceptance Scenarios**:

1. **Given** um visitante sem conta, **When** ele se cadastra com e-mail e
   senha (ou entra com conta Google), **Then** ganha acesso ao app com seus
   dados vazios e isolados de outros usuários.
2. **Given** um usuário logado no PC e no celular, **When** registra um gasto
   no celular, **Then** o gasto aparece no PC em poucos segundos, sem
   recarregar manualmente.
3. **Given** um usuário logado, **When** ele sai da conta (logout), **Then**
   nenhum dado pessoal fica acessível no dispositivo sem novo login.
4. **Given** dois usuários diferentes, **When** cada um acessa sua conta,
   **Then** nenhum deles vê tarefas ou finanças do outro.

---

### User Story 4 - Gastos e ganhos recorrentes automáticos (Priority: P4)

Como usuário, quero cadastrar movimentações recorrentes (aluguel todo dia 5,
salário todo dia 1, assinatura mensal) uma única vez, para que elas sejam
lançadas automaticamente todos os meses, podendo editar ou encerrar a
recorrência quando quiser.

**Why this priority**: cobre os "gastos rotineiros" citados pelo usuário com
o mínimo de fricção, mas o registro manual (US1) já permite operar sem isso.

**Independent Test**: pode ser testado cadastrando um gasto recorrente
mensal e verificando que ele aparece no mês atual e no seguinte, e que
encerrar a recorrência impede lançamentos futuros sem apagar os passados.

**Acceptance Scenarios**:

1. **Given** um usuário, **When** cadastra "Aluguel, R$ 1.200,00, todo dia
   5", **Then** o lançamento aparece como **previsto** no mês atual e nos
   meses seguintes na data correta, sem contar no saldo real até ser
   confirmado.
2. **Given** um lançamento previsto na data de hoje, **When** o usuário o
   confirma com um toque, **Then** ele passa a efetivado e o saldo real do
   mês é atualizado.
3. **Given** uma recorrência ativa, **When** o usuário a encerra, **Then**
   nenhum lançamento futuro é criado e os lançamentos passados permanecem
   intactos.
4. **Given** um lançamento gerado por recorrência em um mês específico,
   **When** o usuário edita só aquele lançamento (ex.: aluguel veio mais
   caro), **Then** apenas aquele mês reflete a mudança.
5. **Given** um lançamento previsto "Aluguel" no dia 5, **When** o usuário
   abre a visão do dia 5 no planner, **Then** vê o lançamento com visual
   distinto das tarefas e pode confirmá-lo dali, atualizando o financeiro.

---

### Edge Cases

- O que acontece quando o usuário fica sem internet no meio de um registro?
  O app deve informar o estado de conexão e não perder silenciosamente o
  dado digitado.
- Como o sistema trata um mês sem nenhuma movimentação? O resumo mostra
  zeros e um estado vazio amigável, não erro.
- O que acontece com uma tarefa recorrente quando o usuário exclui a série
  inteira vs. só uma ocorrência? A exclusão deve perguntar qual das duas o
  usuário quer.
- Como tratar valores extremos (R$ 0,00 ou valores muito altos)? Valor zero
  ou negativo deve ser rejeitado com mensagem clara; valores altos são
  aceitos e formatados corretamente.
- O que acontece em meses sem o dia da recorrência (ex.: recorrência no dia
  31 em fevereiro)? O lançamento cai no último dia do mês.
- Registro com data futura (agendar um gasto) deve contar apenas no mês da
  data informada, não no mês do registro.
- Dois dispositivos editando o mesmo item quase ao mesmo tempo: a última
  alteração vale, sem corromper o dado nem duplicá-lo.

## Requirements *(mandatory)*

### Functional Requirements

**Conta e acesso**

- **FR-001**: O sistema MUST permitir criar conta e entrar com e-mail/senha
  e com conta Google.
- **FR-002**: O sistema MUST isolar completamente os dados de cada usuário:
  um usuário nunca acessa dados de outro.
- **FR-003**: O sistema MUST manter a sessão do usuário entre visitas no
  mesmo dispositivo até logout explícito, e MUST oferecer logout.
- **FR-004**: O sistema MUST permitir recuperação de senha por e-mail.

**Gestor financeiro**

- **FR-005**: O usuário MUST poder registrar movimentações dos tipos gasto e
  ganho, com valor (em reais), descrição, categoria e data.
- **FR-006**: O sistema MUST oferecer um conjunto de categorias padrão
  (ex.: Alimentação, Moradia, Transporte, Lazer, Saúde, Salário, Extra) e
  MUST permitir que o usuário crie, renomeie e arquive categorias próprias.
- **FR-007**: O sistema MUST exibir um resumo mensal com: total de entradas,
  total de saídas, saldo real do mês (apenas movimentações efetivadas),
  saldo previsto (incluindo lançamentos previstos ainda não confirmados) e
  distribuição de gastos por categoria. O destaque principal é o resultado
  do próprio mês.
- **FR-007a**: O resumo MUST exibir também, como número secundário, o saldo
  acumulado: a soma dos resultados de todos os meses (apenas movimentações
  efetivadas) desde o primeiro registro até o mês visualizado.
- **FR-008**: O usuário MUST poder navegar entre meses (anteriores e
  futuros) para ver e registrar movimentações de qualquer mês.
- **FR-009**: O usuário MUST poder editar e excluir movimentações; exclusão
  MUST exigir confirmação.
- **FR-010**: O usuário MUST poder cadastrar movimentações recorrentes
  mensais (gasto ou ganho) com dia do mês definido, podendo editar ou
  encerrar a recorrência; encerrar não afeta lançamentos passados.
- **FR-010a**: Lançamentos gerados por recorrência MUST entrar com estado
  "previsto" na data programada e MUST poder ser confirmados
  (previsto → efetivado) com uma única interação; apenas movimentações
  efetivadas contam no saldo real. Movimentações registradas manualmente
  nascem efetivadas por padrão.
- **FR-011**: O sistema MUST rejeitar movimentações com valor menor ou igual
  a zero, exibindo mensagem clara.
- **FR-012**: Todos os valores monetários MUST ser exibidos em formato
  brasileiro (R$ 1.234,56).

**Planner de rotina**

- **FR-013**: O usuário MUST poder criar itens de rotina com título, data e
  horário opcional, e notas opcionais.
- **FR-014**: O sistema MUST oferecer três visões do planner: dia, semana e
  mês, com navegação entre períodos.
- **FR-015**: O usuário MUST poder criar itens recorrentes com padrões:
  diário, dias específicos da semana e dia fixo do mês.
- **FR-016**: O usuário MUST poder marcar/desmarcar uma ocorrência como
  concluída, afetando apenas a data daquela ocorrência.
- **FR-017**: O usuário MUST poder editar e excluir itens; para itens
  recorrentes, o sistema MUST perguntar se a ação vale para uma ocorrência
  ou para a série inteira.
- **FR-018**: A visão do dia MUST destacar itens atrasados (pendentes de
  datas passadas).
- **FR-018a**: As visões do planner (dia/semana/mês) MUST exibir também os
  lançamentos financeiros previstos da data correspondente, com visual
  claramente distinto das tarefas, e MUST permitir confirmá-los dali
  (mesmo efeito de confirmar na área financeira). Movimentações já
  efetivadas não aparecem no planner.

**Multi-dispositivo e dados**

- **FR-019**: Alterações feitas em um dispositivo MUST aparecer nos demais
  dispositivos logados na mesma conta em poucos segundos, sem ação manual.
- **FR-020**: O app MUST funcionar em tela de celular e de desktop com a
  mesma funcionalidade completa.
- **FR-021**: O sistema MUST informar visualmente quando estiver sem conexão
  e MUST evitar perda silenciosa de dados digitados.

### Key Entities

- **Usuário**: pessoa autenticada dona dos dados; possui identificador
  único, e-mail e nome de exibição.
- **Movimentação**: registro financeiro; atributos: tipo (gasto|ganho),
  valor, descrição, categoria, data, estado (previsto|efetivado), origem
  (manual|recorrência) e vínculo opcional com a recorrência que a gerou.
  Pertence a um usuário.
- **Recorrência financeira**: modelo de lançamento automático mensal; possui
  tipo, valor, categoria, descrição, dia do mês, estado (ativa|encerrada) e
  data de início/fim. Gera Movimentações.
- **Categoria**: rótulo de classificação de movimentações; padrão do sistema
  ou criada pelo usuário; pode ser arquivada sem apagar histórico.
- **Item de rotina**: tarefa/compromisso do planner; possui título, data,
  horário opcional, notas e padrão de recorrência opcional (diário, dias da
  semana, dia do mês).
- **Ocorrência de rotina**: materialização de um item em uma data
  específica, com estado (pendente|concluída).
- **Resumo mensal**: visão derivada (calculada) das movimentações de um mês:
  entradas, saídas, saldo real (efetivadas), saldo previsto (incluindo
  previstas), saldo acumulado até o mês visualizado e gastos por categoria —
  nunca armazenado como fonte de verdade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A partir da tela inicial, o usuário registra um gasto completo
  (valor, categoria, data) em no máximo 3 interações e menos de 30 segundos.
- **SC-002**: O resumo do mês (entradas, saídas, saldo, categorias) reflete
  qualquer novo registro imediatamente (percepção de tempo real, sem
  recarregar a página).
- **SC-003**: Um registro feito em um dispositivo aparece em outro
  dispositivo logado na mesma conta em até 5 segundos com conexão normal.
- **SC-004**: Os totais mensais batem centavo a centavo com a soma manual
  das movimentações em 100% dos casos testados.
- **SC-005**: Um usuário novo, sem instruções, consegue criar conta,
  registrar um gasto e criar uma tarefa em menos de 5 minutos no primeiro
  uso.
- **SC-006**: Todas as telas principais são utilizáveis e legíveis tanto em
  tela de celular (~375px) quanto em desktop (~1280px), verificadas
  visualmente antes da entrega.
- **SC-007**: Tarefas recorrentes aparecem nos dias corretos em 100% dos
  padrões suportados (diário, dias da semana, dia do mês — incluindo meses
  curtos).

## Assumptions

- O app será uma aplicação web responsiva acessada pelo navegador no PC e no
  celular (uma única base de código), conforme a constituição do projeto;
  apps nativos de loja ficam fora do escopo desta versão.
- Idioma único: português (pt-BR); moeda única: real brasileiro (R$). Não há
  suporte a múltiplas moedas nesta versão.
- Uso pessoal e individual: não há compartilhamento de planner ou finanças
  entre usuários, nem contas conjuntas, nesta versão.
- Métodos de login: e-mail/senha e Google — cobrem PC e celular sem fricção;
  outros provedores ficam fora do escopo.
- Recorrências financeiras são mensais (dia fixo do mês), o padrão dominante
  de contas domésticas; recorrências financeiras semanais/anuais ficam para
  versão futura. Recorrências de rotina suportam diário/semanal/mensal.
- Notificações/lembretes (push, e-mail) ficam fora do escopo desta versão; o
  destaque de itens atrasados dentro do app cobre a necessidade inicial.
- Relatórios avançados (gráficos históricos de vários meses, exportação)
  ficam fora do escopo; o resumo mensal por categoria atende ao objetivo
  declarado de "saber para onde está indo o dinheiro".
- Sem metas de orçamento por categoria nesta versão (candidata natural a
  próxima feature).
- O usuário tem conexão de internet na maior parte do uso; o comportamento
  offline limita-se a avisar e preservar o que foi digitado (sem modo
  offline completo).

