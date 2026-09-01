# Feature Specification: Modo Escuro e Refinamento Visual

**Feature Branch**: `002-dark-mode-visual-refresh`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Modo escuro e refinamento visual do app. Quero (1) modo escuro que começa seguindo o tema do sistema e pode ser trocado por um botão, com a escolha lembrada no aparelho; (2) uma identidade visual mais forte e com personalidade própria, que não pareça template genérico — hoje o app parece simples demais; (3) mais riqueza visual nos dados financeiros: gráficos, barras e indicadores que deixem o dinheiro compreensível de relance, em vez de só texto e lista. Deve usar a skill frontend-design para a direção visual. Não quero perder nada do que já funciona."

## Clarifications

### Session 2026-08-29

- Q: O que mais incomoda visualmente hoje? → A: Duas coisas: o app parece
  simples demais, sem personalidade própria; e falta riqueza visual nos dados
  financeiros — hoje é quase só texto e lista.
- Q: Como o modo escuro deve ser escolhido? → A: Começa seguindo o tema do
  sistema, com botão para forçar claro ou escuro; a escolha fica lembrada no
  aparelho.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Usar o app à noite sem ofuscar (Priority: P1)

Como usuário que registra gastos no fim do dia, muitas vezes na cama, quero
que o app apareça em tons escuros quando meu aparelho está no tema escuro, e
quero poder forçar claro ou escuro por um botão quando preferir. A escolha
precisa ser lembrada, para eu não refazê-la toda vez que abrir.

**Why this priority**: é o pedido mais concreto e o de maior retorno
imediato — resolve desconforto real de uso noturno, que é justamente quando
se fecha as contas do dia. Sozinho já entrega valor.

**Independent Test**: pode ser testado colocando o sistema no tema escuro e
abrindo o app (deve abrir escuro), trocando pelo botão (deve mudar na hora) e
recarregando (deve lembrar a escolha).

**Acceptance Scenarios**:

1. **Given** um aparelho com tema escuro e um usuário que nunca escolheu tema,
   **When** ele abre o app, **Then** o app aparece na versão escura.
2. **Given** um aparelho com tema claro e um usuário que nunca escolheu tema,
   **When** ele abre o app, **Then** o app aparece na versão clara.
3. **Given** o app aberto em qualquer tema, **When** o usuário aciona o botão
   de tema e escolhe escuro, **Then** a interface muda imediatamente, sem
   recarregar a página.
4. **Given** um usuário que escolheu um tema manualmente, **When** ele fecha e
   reabre o app no mesmo aparelho, **Then** o app abre no tema escolhido,
   mesmo que o tema do sistema seja outro.
5. **Given** um usuário que escolheu um tema manualmente, **When** ele pede
   para voltar a seguir o sistema, **Then** o app volta a acompanhar o tema do
   aparelho.
6. **Given** o app no tema escuro, **When** o usuário percorre qualquer tela,
   **Then** todo texto permanece legível e nenhuma área aparece com cor
   "vazada" do tema claro.

---

### User Story 2 - Entender o mês de relance, sem ler números (Priority: P2)

Como usuário que abre o app rapidamente durante o dia, quero enxergar a
situação do mês pela forma antes de ler qualquer número: quanto do que entrou
já foi gasto, quais categorias dominam, como este mês se compara aos
anteriores e quanto ainda está previsto para sair.

**Why this priority**: é a segunda queixa declarada ("falta riqueza visual nos
dados"). Depende de dados que já existem, então não exige nada novo além de
representação.

**Independent Test**: pode ser testado com um mês que tenha entradas, saídas
em várias categorias e ao menos um previsto, verificando que a leitura visual
corresponde aos valores.

**Acceptance Scenarios**:

1. **Given** um mês com entradas e saídas, **When** o usuário abre o resumo,
   **Then** vê uma representação visual da proporção entre o que entrou e o
   que saiu, sem precisar comparar dois números.
2. **Given** um mês com gastos em várias categorias, **When** o usuário abre o
   resumo, **Then** identifica a categoria dominante em menos de 3 segundos.
3. **Given** um histórico de pelo menos 3 meses, **When** o usuário abre o
   resumo, **Then** vê como o mês atual se compara com os anteriores.
4. **Given** um mês com lançamentos previstos, **When** o usuário abre o
   resumo, **Then** distingue visualmente o que já aconteceu do que ainda vai
   acontecer.
5. **Given** um mês sem nenhuma movimentação, **When** o usuário abre o
   resumo, **Then** vê um estado vazio convidativo — nunca um gráfico
   quebrado ou área em branco.
6. **Given** qualquer representação visual, **When** o usuário não pode ou não
   quer interpretar cores, **Then** o mesmo dado continua acessível em texto.

---

### User Story 3 - Reconhecer o app como algo próprio (Priority: P3)

Como usuário, quero que o app tenha identidade visual própria — que ele não
pareça um modelo genérico de painel administrativo — mantendo a simplicidade
de uso que já existe hoje.

**Why this priority**: é uma qualidade transversal, percebida em toda tela.
Vem depois porque depende das decisões tomadas nas duas primeiras histórias
e porque não bloqueia nenhuma tarefa do usuário.

**Independent Test**: pode ser testado mostrando as telas principais a alguém
que não conhece o app e verificando se a identidade é percebida como
intencional e coerente entre telas.

**Acceptance Scenarios**:

1. **Given** as telas principais do app, **When** comparadas entre si,
   **Then** compartilham a mesma linguagem visual — tipografia, cor,
   espaçamento e forma — sem exceções pontuais.
2. **Given** qualquer tela, **When** o usuário executa as tarefas que já fazia
   antes, **Then** consegue completá-las com o mesmo número de interações ou
   menos.
3. **Given** as duas versões de tema, **When** comparadas, **Then** ambas
   expressam a mesma identidade, e não uma versão "apagada" da outra.

---

### Edge Cases

- O que acontece quando o aparelho troca de tema com o app aberto (por
  exemplo, o modo escuro automático do celular entra ao anoitecer)? Se o
  usuário não escolheu tema manualmente, o app acompanha na hora.
- Como o app se comporta quando o navegador impede guardar a preferência
  (aba anônima, armazenamento bloqueado)? Continua funcionando e segue o
  tema do sistema, sem erro visível.
- O que aparece nos gráficos quando o mês tem uma única categoria, ou uma
  categoria representa 100% do gasto? A representação continua legível, sem
  fatia invisível ou rótulo sobreposto.
- E quando um valor é extremo (um gasto muito maior que todos os outros)? A
  escala continua legível e os valores pequenos não desaparecem.
- Como fica a leitura de gráficos em tela de 375px? Nenhum elemento é cortado
  e o conteúdo largo rola na horizontal dentro da própria área.
- O que acontece com quem prefere menos animação no sistema? O app respeita
  essa preferência e reduz movimento.
- Um mês futuro, ainda sem nada efetivado, mostra o quê? Só o previsto,
  claramente marcado como tal.

## Requirements *(mandatory)*

### Functional Requirements

**Tema**

- **FR-001**: O sistema MUST oferecer duas versões visuais completas — clara e
  escura — cobrindo todas as telas, diálogos e estados.
- **FR-002**: Na ausência de escolha do usuário, o sistema MUST adotar o tema
  do sistema operacional do aparelho.
- **FR-003**: O usuário MUST poder escolher explicitamente entre claro,
  escuro e "seguir o sistema", por um controle acessível a partir de qualquer
  tela.
- **FR-004**: A troca de tema MUST ser aplicada imediatamente, sem recarregar
  a página.
- **FR-005**: A escolha do usuário MUST ser lembrada no mesmo aparelho entre
  sessões, e MUST valer apenas naquele aparelho (cada dispositivo pode ter a
  sua).
- **FR-006**: Enquanto a escolha for "seguir o sistema", o app MUST reagir a
  mudanças do tema do aparelho com o app aberto.
- **FR-007**: O sistema MUST continuar funcionando normalmente quando não for
  possível guardar a preferência, adotando o tema do sistema.
- **FR-008**: O app MUST evitar qualquer piscada de tema errado durante o
  carregamento inicial.

**Visualização dos dados**

- **FR-009**: O resumo do mês MUST apresentar visualmente a relação entre o
  que entrou e o que saiu, além dos valores numéricos.
- **FR-010**: O sistema MUST apresentar a distribuição de gastos por categoria
  de forma visual, ordenada da maior para a menor, permitindo identificar a
  categoria dominante sem leitura de números.
- **FR-011**: O sistema MUST apresentar uma comparação do mês atual com os
  meses anteriores, quando houver histórico.
- **FR-012**: As representações visuais MUST distinguir o que está efetivado
  do que está previsto.
- **FR-013**: Todo dado apresentado visualmente MUST permanecer disponível em
  forma textual, para quem usa leitor de tela ou não distingue as cores.
- **FR-014**: As representações visuais MUST ter estado vazio próprio quando
  não houver dados suficientes.
- **FR-015**: As cores usadas para distinguir categorias MUST ser
  distinguíveis também nas formas mais comuns de daltonismo, não dependendo
  apenas de matiz.

**Identidade e consistência**

- **FR-016**: Todas as telas MUST usar o mesmo sistema de design — tipografia,
  cores, espaçamento, forma e movimento — sem estilos criados caso a caso.
- **FR-017**: O sistema de design MUST definir os dois temas a partir dos
  mesmos conceitos, de modo que uma cor nova apareça corretamente nos dois.
- **FR-018**: Nenhuma tarefa que o usuário já realiza MUST passar a exigir
  mais interações do que exige hoje.
- **FR-019**: Todos os textos MUST manter contraste suficiente para leitura
  confortável nos dois temas.
- **FR-020**: O app MUST respeitar a preferência do usuário por menos
  animação.
- **FR-021**: A cor de identificação do app na barra do navegador MUST
  acompanhar o tema em uso. A cor declarada no manifesto do app instalado é
  fixa por natureza (não muda em tempo de execução) e MUST usar um valor
  neutro que funcione nos dois temas.

### Key Entities

- **Preferência de tema**: escolha do usuário entre claro, escuro e seguir o
  sistema; vive no aparelho, não na conta; ausência de valor significa seguir
  o sistema.
- **Tema visual**: conjunto completo de decisões de cor para uma das duas
  versões; ambos derivam dos mesmos conceitos (fundo, superfície, texto,
  traço, entrada, saída, ação, atenção).
- **Série de comparação mensal**: visão derivada dos resultados de meses
  anteriores, usada apenas para exibição — não é armazenada como verdade.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário com o aparelho em tema escuro abre o app e vê a
  versão escura, sem nenhum quadro na versão clara.
- **SC-002**: Trocar de tema pelo botão reflete na tela em menos de 1 segundo,
  sem recarregar a página.
- **SC-003**: A escolha de tema sobrevive a fechar e reabrir o app em 100% das
  tentativas em um aparelho que permita guardar preferências.
- **SC-004**: Um usuário identifica a categoria em que mais gastou no mês em
  até 3 segundos, sem ler valores.
- **SC-005**: Todo texto atinge contraste mínimo de 4,5:1 nos dois temas, e
  elementos gráficos informativos atingem 3:1 — verificado em todas as telas.
- **SC-006**: Nenhuma tarefa existente passa a exigir mais interações do que
  exigia antes desta feature.
- **SC-007**: Todas as telas permanecem utilizáveis e legíveis em ~375px e
  ~1280px, nos dois temas.
- **SC-008**: Um mês sem movimentação e um mês com uma única categoria
  aparecem corretamente, sem área quebrada ou rótulo ilegível.

## Assumptions

- A preferência de tema fica no aparelho, não na conta. Sincronizá-la entre
  dispositivos exigiria gravá-la na conta e traria conflito quando o usuário
  quer claro no PC e escuro no celular — o comportamento assumido é o padrão
  da web e o mais previsível.
- A identidade visual atual (a metáfora da caderneta, com valores alinhados
  sobre fios e o traço interrompido para o previsto) é a base a ser
  aprofundada, não substituída: ela codifica regras do produto e já foi
  validada em uso.
- As visualizações usam apenas dados que o app já possui. Nenhuma nova coleta
  ou cálculo de negócio é introduzido por esta feature.
- A comparação entre meses cobre um horizonte recente (os últimos meses com
  registro), não o histórico completo — o objetivo é contexto imediato, não
  relatório.
- Ilustrações, ícones autorais e animações elaboradas ficam fora do escopo; a
  personalidade vem de tipografia, cor, forma e composição.
- Continua valendo o que a feature anterior assumiu: interface em pt-BR, uso
  pessoal e individual, sem metas de orçamento (candidata a feature futura).
