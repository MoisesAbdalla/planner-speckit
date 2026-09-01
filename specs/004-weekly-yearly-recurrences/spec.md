# Feature Specification: Recorrências Semanais e Anuais

**Feature Branch**: `004-weekly-yearly-recurrences`

**Created**: 2026-09-01

**Status**: Draft

**Input**: User description: "Recorrências financeiras semanais e anuais. Hoje só existem recorrências mensais com dia fixo. Quero também poder cadastrar uma conta que se repete toda semana (feira, aula) escolhendo o dia da semana, e uma que se repete uma vez por ano (IPVA, seguro, IPTU, anuidade) escolhendo dia e mês. Para a anual, quero enxergar o lançamento previsto no ano inteiro à frente. Tudo o que já existe nas recorrências mensais precisa continuar valendo."

## Clarifications

### Session 2026-09-01

- Q: Quais frequências além da mensal? → A: Semanal e anual. Cobrem o
  essencial (feira toda semana; IPVA e seguro uma vez por ano) sem encher o
  formulário de opções que viram caso-limite de calendário.
- Q: Com quanta antecedência a conta anual deve aparecer? → A: O ano inteiro à
  frente. Com uma despesa grande e distante, saber cedo é o valor inteiro da
  feature — se ela só aparecer perto do vencimento, vira surpresa do mesmo
  jeito.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a conta grande do ano com antecedência (Priority: P1)

Como usuário que paga IPVA, seguro e IPTU uma vez por ano, quero cadastrar
essas contas uma única vez e enxergá-las já lançadas como previstas em
qualquer mês futuro que eu abrir, para não ser pego de surpresa quando o mês
chegar.

**Why this priority**: é a razão da feature existir. Uma despesa anual grande
só ajuda quem a vê chegando; se aparecesse apenas às vésperas, o app
continuaria surpreendendo do mesmo jeito.

**Independent Test**: cadastrar uma conta anual com data daqui a oito meses,
navegar até aquele mês e conferir que o lançamento previsto já está lá, sem
ter aparecido nos meses intermediários.

**Acceptance Scenarios**:

1. **Given** um usuário sem recorrência anual, **When** ele cadastra "IPVA,
   R$ 2.400,00, todo dia 15 de janeiro", **Then** o lançamento previsto
   aparece em janeiro do próximo ano, e em nenhum outro mês.
2. **Given** uma recorrência anual cadastrada, **When** o usuário navega para
   qualquer mês dentro do próximo ano, **Then** o mês que contém a data mostra
   o previsto e os demais não.
3. **Given** um lançamento anual previsto, **When** o usuário o confirma com
   um toque, **Then** ele passa a efetivado e entra no saldo real daquele mês.
4. **Given** uma recorrência anual, **When** o usuário edita apenas o
   lançamento de um ano (o seguro subiu), **Then** só aquele ano muda.
5. **Given** uma recorrência anual ativa, **When** o usuário a encerra,
   **Then** nenhum lançamento futuro é criado e os passados permanecem.
6. **Given** uma recorrência anual no dia 29 de fevereiro, **When** o ano não
   é bissexto, **Then** o lançamento cai no dia 28.

---

### User Story 2 - Registrar o gasto que se repete toda semana (Priority: P2)

Como usuário com despesas semanais fixas (feira, aula, transporte), quero
cadastrar uma vez escolhendo o dia da semana, e ver os lançamentos previstos
nos dias certos de cada mês, sem recriá-los.

**Why this priority**: resolve um incômodo real e recorrente, mas de valor
unitário menor que a conta anual — e o registro manual já permite operar sem
isso.

**Independent Test**: cadastrar uma despesa toda terça-feira e conferir que
ela aparece em todas as terças do mês corrente e do seguinte.

**Acceptance Scenarios**:

1. **Given** um usuário, **When** cadastra "Feira, R$ 180,00, toda terça",
   **Then** o mês corrente mostra um previsto em cada terça-feira.
2. **Given** uma recorrência semanal, **When** o usuário abre um mês com cinco
   ocorrências do dia escolhido, **Then** os cinco previstos aparecem.
3. **Given** lançamentos semanais previstos, **When** o usuário confirma um
   deles, **Then** só aquele muda de estado; os demais seguem previstos.
4. **Given** uma recorrência semanal, **When** o usuário edita o lançamento de
   uma semana específica, **Then** as outras semanas não mudam.
5. **Given** uma recorrência semanal, **When** o usuário a encerra, **Then**
   nenhuma ocorrência futura é criada e as passadas permanecem.

---

### User Story 3 - Entender e manter as recorrências que tenho (Priority: P3)

Como usuário com recorrências de frequências diferentes, quero ver na lista
qual é qual sem precisar abrir cada uma, e poder editá-las com a mesma
facilidade de hoje.

**Why this priority**: qualidade de manutenção. Sem isso a lista fica ambígua
assim que houver mais de um tipo, mas nada deixa de funcionar.

**Independent Test**: cadastrar uma mensal, uma semanal e uma anual, e
conferir que a lista deixa claro a frequência e a próxima data de cada uma.

**Acceptance Scenarios**:

1. **Given** recorrências de frequências diferentes, **When** o usuário abre a
   lista, **Then** cada uma informa sua frequência em palavras.
2. **Given** a lista de recorrências, **When** o usuário a percorre, **Then**
   consegue identificar quando cada uma acontece de novo.
3. **Given** uma recorrência existente de qualquer frequência, **When** o
   usuário a edita, **Then** consegue alterar valor, categoria, descrição e a
   data da repetição.
4. **Given** as recorrências mensais que já existiam antes desta feature,
   **When** o usuário abre o app, **Then** elas continuam funcionando
   exatamente como antes, sem exigir nenhuma ação dele.

---

### Edge Cases

- Uma recorrência anual no dia 31 de um mês de 30 dias cai no último dia
  daquele mês, como já acontece nas mensais.
- Uma recorrência anual em 29 de fevereiro cai em 28 nos anos não bissextos.
- Um mês pode ter quatro ou cinco ocorrências do mesmo dia da semana; todas
  aparecem.
- O que acontece quando a pessoa abre o app no PC e no celular ao mesmo tempo?
  Nenhum lançamento é duplicado, em qualquer frequência.
- Uma recorrência semanal cadastrada numa terça já passada no mês corrente
  gera lançamento naquela terça? Sim — o mês inteiro é preparado, e a pessoa
  decide confirmar ou excluir.
- Encerrar uma recorrência no meio de um mês deixa as ocorrências já criadas
  daquele mês onde estão.
- Uma recorrência anual cujo próximo vencimento passa do horizonte de um ano
  não aparece ainda; ela entra quando o horizonte alcançá-la.
- Uma recorrência que não usa dia do mês (a semanal) precisa aparecer na lista
  e ser considerada na geração como qualquer outra — nenhuma frequência pode
  ficar invisível por causa de um campo que ela não tem.
- Excluir um lançamento previsto individual não faz a recorrência recriá-lo no
  mesmo lugar — o descarte fica registrado. Encerrar a recorrência continua
  sendo o caminho para parar de gerar tudo dali em diante.

## Requirements *(mandatory)*

### Functional Requirements

**Cadastrar**

- **FR-001**: O usuário MUST poder escolher a frequência de uma recorrência
  entre semanal, mensal e anual.
- **FR-002**: Numa recorrência semanal, o usuário MUST escolher o dia da
  semana em que ela acontece.
- **FR-003**: Numa recorrência anual, o usuário MUST escolher o dia e o mês em
  que ela acontece.
- **FR-004**: A recorrência mensal MUST continuar funcionando como hoje, com
  dia fixo do mês.
- **FR-005**: O formulário MUST mostrar apenas os campos da frequência
  escolhida, sem pedir dados que não se aplicam.
- **FR-006**: O sistema MUST rejeitar dia inválido para a frequência
  escolhida, com mensagem clara.

**Gerar os lançamentos**

- **FR-007**: Uma recorrência semanal MUST gerar um lançamento previsto em
  cada ocorrência do dia escolhido dentro do mês, inclusive quando o mês tem
  cinco.
- **FR-008**: Uma recorrência anual MUST gerar um lançamento previsto no mês e
  dia escolhidos, e em nenhum outro mês.
- **FR-009**: Lançamentos de recorrência anual MUST estar disponíveis para
  todos os meses do próximo ano, não apenas para os meses próximos.
- **FR-010**: Datas que não existem no período MUST cair no último dia válido
  — dia 31 em mês de 30, e 29 de fevereiro em ano não bissexto.
- **FR-011**: Abrir o mesmo mês em mais de um aparelho MUST NOT duplicar
  lançamentos, em nenhuma frequência.
- **FR-012**: Excluir um lançamento previsto individual MUST registrar aquele
  descarte, de modo que a recorrência não o recrie depois. Hoje o lançamento
  volta na materialização seguinte — este requisito corrige um defeito que já
  existe, e que a frequência semanal tornaria frequente.

**Manter o que já vale**

- **FR-013**: Todo lançamento gerado MUST nascer previsto e poder ser
  confirmado com uma única interação, como hoje.
- **FR-014**: Editar um lançamento gerado MUST alterar apenas aquela
  ocorrência.
- **FR-015**: Encerrar uma recorrência MUST impedir lançamentos futuros e
  preservar os já criados.
- **FR-016**: As recorrências mensais que já existem MUST continuar
  funcionando sem nenhuma ação do usuário e sem perda de histórico.

**Entender a lista**

- **FR-017**: A lista de recorrências MUST informar a frequência de cada uma
  em linguagem comum.
- **FR-018**: A lista MUST informar quando cada recorrência acontece de novo.
- **FR-019**: O usuário MUST poder editar valor, categoria, descrição e a data
  da repetição de qualquer recorrência.

### Key Entities

- **Recorrência financeira**: modelo de lançamento automático; ganha uma
  **frequência** (semanal, mensal ou anual), o dado de repetição
  correspondente — dia da semana, dia do mês, ou dia e mês — e a lista de
  ocorrências descartadas. O dia da semana usa a mesma convenção já adotada
  nas tarefas do planner, para o app não ter duas. Os demais
  atributos (tipo, valor, categoria, descrição, início, encerramento)
  permanecem como hoje.
- **Lançamento previsto**: inalterado. Continua nascendo previsto,
  confirmável com um toque, editável isoladamente e vinculado à recorrência
  que o gerou.
- **Horizonte de geração**: quanto do futuro já está preparado. Deixa de ser
  um valor único: recorrências semanais e mensais continuam com horizonte
  curto, e as anuais alcançam o próximo ano inteiro.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma conta anual cadastrada hoje aparece como prevista no mês do
  seu vencimento, em qualquer mês do próximo ano que o usuário abrir.
- **SC-002**: Uma recorrência semanal gera exatamente uma ocorrência por
  semana no mês, incluindo meses com cinco ocorrências do dia escolhido.
- **SC-003**: Cadastrar uma recorrência mensal continua exigindo exatamente o
  mesmo número de interações de hoje — a mensal é o padrão do formulário.
  Escolher outra frequência custa no máximo uma interação a mais.
- **SC-004**: Abrir o mesmo mês em dois aparelhos ao mesmo tempo resulta em
  zero lançamentos duplicados, em 100% das tentativas.
- **SC-005**: 100% das recorrências mensais existentes continuam gerando os
  mesmos lançamentos após a atualização, sem ação do usuário.
- **SC-006**: Datas inexistentes caem no último dia válido em 100% dos casos
  testados, incluindo 29 de fevereiro e dia 31 em meses de 30.
- **SC-007**: Na lista de recorrências, o usuário identifica a frequência e a
  próxima data de cada uma sem abrir nenhuma delas.

## Assumptions

- As frequências ficam em três: semanal, mensal e anual. Quinzenal,
  trimestral e semestral cobrem casos reais, mas cada uma acrescenta um caso
  de calendário para acertar e uma opção a mais no formulário — entram depois
  se o uso pedir.
- A recorrência semanal acontece toda semana, sem intervalo configurável
  ("a cada 2 semanas" fica de fora). Um único dia da semana por recorrência;
  quem precisa de dois dias cadastra duas.
- O horizonte da recorrência anual é de um ano à frente. Mais do que isso
  encheria o app de lançamentos distantes que a pessoa não consegue planejar,
  e menos anularia o propósito da feature.
- As recorrências mensais existentes são tratadas como mensais sem que o
  usuário precise fazer nada — nenhuma migração manual, nenhuma tela de
  conversão.
- A antecedência não vira aviso ativo: a conta anual aparece quando a pessoa
  navega até o mês. Um alerta de "conta grande chegando" no resumo é uma boa
  ideia, mas é outra feature.
- Não há provisionamento (reservar um valor por mês para a conta anual). É o
  passo natural depois desta, e depende de metas — fica para depois.
- Continua valendo o que as features anteriores assumiram: interface em
  pt-BR, moeda única (R$), uso pessoal e individual.
