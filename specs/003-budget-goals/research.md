# Research: Metas de Orçamento

**Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md)

Nenhum NEEDS CLARIFICATION restou. Este documento registra as decisões e o
porquê das alternativas descartadas.

## R1. A meta é uma linha do tempo, não um número

Esta é a decisão que define a feature.

- **Decision**: cada meta guarda uma **lista de valores com mês de vigência**
  (`versions`), mais um mapa de **exceções por mês** (`overrides`). A meta
  vigente num mês é a versão mais recente cujo início é menor ou igual àquele
  mês, com a exceção daquele mês tendo prioridade quando existe.

- **Rationale**: o FR-008 exige que alterar o padrão não mude meses passados,
  e o SC-006 torna isso testável. Com um único campo `amountCents`, mudar a
  meta em setembro faria março passar a ser avaliado contra o valor novo — o
  app reescreveria o passado, e a pessoa veria meses que "estouraram"
  retroativamente por uma decisão tomada depois.

  Com versões, cada mês lê o valor que valia à época. E as exceções ficam
  separadas das versões de propósito: "mudei meu padrão" e "este mês é
  atípico" são intenções diferentes, e misturá-las tornaria impossível
  desfazer só o ajuste (FR-005).

- **Alternatives considered**:
  - *Um valor único por meta*: mais simples, mas viola o FR-008 direto.
  - *Materializar a meta em cada mês* (como as recorrências financeiras
    fazem): honra o FR-008 e teria a coerência de repetir um padrão já usado
    no projeto, mas gera uma escrita por mês por categoria e precisa de um
    gatilho de materialização. As recorrências precisam disso porque cada
    lançamento é editável individualmente; uma meta não é — ela é lida, não
    manipulada mês a mês. O custo não se paga.
  - *Guardar a meta junto da categoria*: acoplaria histórico de orçamento ao
    cadastro de categoria e complicaria o teto geral, que não é categoria.

- **Nota sobre crescimento**: as duas estruturas crescem com o uso, mas
  devagar — mudanças de orçamento acontecem algumas vezes por ano, e um mês
  atípico é exceção por definição. Milhares de entradas cabem no limite de um
  documento do Firestore.

## R2. Um documento por alvo, com id determinístico

- **Decision**: `users/{uid}/budgetGoals/{alvo}`, em que `alvo` é `overall`
  para o teto do mês ou o id da categoria.
- **Rationale**: o id determinístico impede duplicata quando dois aparelhos
  definem a mesma meta ao mesmo tempo — a mesma razão que já vale para as
  recorrências e para as exceções de tarefa. A coleção é pequena (uma entrada
  por categoria mais o teto), então um `onSnapshot` sobre ela inteira é
  barato e dispensa consulta por mês.
- **Alternatives considered**: documento único com todas as metas dentro
  (escrita concorrente em campos diferentes vira conflito no mesmo doc);
  documento por mês (multiplicaria escritas sem necessidade).

## R3. Consumo é derivado, nunca guardado

- **Decision**: quanto foi usado de cada meta é calculado a partir das
  movimentações do mês que o app já lê, por função pura, no momento de
  exibir.
- **Rationale**: Princípio IV. Guardar "quanto já usei" criaria um segundo
  número de dinheiro para manter em sincronia com os lançamentos — e a
  primeira feature já mostrou o custo disso com o `monthStats`, que só é
  aceitável porque tem rotina de reconstrução. Aqui não há motivo: o dado da
  origem já está carregado na tela.
- **Alternatives considered**: agregado por meta no Firestore (mesma classe
  de risco do `monthStats`, sem o benefício de evitar leitura).

## R4. Os sinais não podem depender de cor

- **Decision**: três estados — dentro, perto do limite (a partir de 80%) e
  ultrapassada — expressos por **três meios ao mesmo tempo**: uma marca de
  limite sobre a barra (posição), um rótulo em texto ("perto do limite",
  "passou em R$ 32,00") e a cor semântica de atenção ou de saída.
- **Rationale**: FR-014 e SC-007. A marca de limite é o recurso mais forte
  porque é posicional — funciona em escala de cinza, sob qualquer daltonismo
  e em impressão. E se encaixa na identidade: é mais um fio atravessando a
  coluna, como o resto da caderneta.
- **Alternatives considered**: só cor (reprovado pelo requisito); ícone de
  alerta (mais ruído visual, e um ícone por linha compete com o dado);
  textura hachurada (a skill de visualização a reserva para acessibilidade
  plena e impressão, não como recurso primário).

## R5. O previsto conta no teto geral

- **Decision**: o acompanhamento do teto do mês mostra o efetivado e estende
  a barra com o previsto ainda não confirmado, como o medidor já faz.
- **Rationale**: FR-015. Um aluguel de R$ 1.200 que vence dia 30 já está
  comprometido — ignorá-lo faria o app dizer "pode gastar" para dinheiro que
  não existe mais. O medidor construído na feature 002 já tem exatamente essa
  capacidade, então é reaproveitamento, não construção.
- **Alternatives considered**: contar só o efetivado (surpreende a pessoa no
  vencimento); somar previsto ao efetivado sem distinguir (esconde o que
  ainda dá para cancelar).

## R6. Onde a meta é definida

- **Decision**: um modal de metas, alcançável em um toque a partir da tela de
  finanças, listando o teto geral e as categorias. A **exibição** fica dentro
  do resumo e das barras que já existem.
- **Rationale**: o FR-018 proíbe uma área separada para *acompanhar* metas —
  o acompanhamento tem que estar onde a pessoa já olha. Editar é outra coisa:
  acontece raramente e já tem um padrão no app (categorias e recorrências
  moram em modais). Seguir esse padrão mantém a coerência e cumpre o SC-003
  (três interações: abrir, digitar, salvar).
- **Alternatives considered**: editar direto no resumo (poluiria a tela mais
  vista do app com campos usados uma vez por semestre); página própria de
  orçamento (é exatamente o que o FR-018 evita).

## R7. Nada muda para quem não usa metas

- **Decision**: cada ponto de exibição verifica a existência de meta antes de
  renderizar qualquer coisa; sem meta, o componente devolve exatamente o que
  devolvia antes.
- **Rationale**: FR-020 e SC-008. Uma feature opcional que deixa espaço vazio
  ou aviso de "configure suas metas" pune quem não a quer. O único vestígio
  permitido é a entrada para o modal, ao lado das que já existem.
- **Alternatives considered**: estado vazio convidativo em cada barra
  (transformaria a tela principal num anúncio da feature).

## R8. Com meta, o medidor mede contra a meta — não contra a entrada

Decisão tomada depois da análise de consistência, que apontou a ambiguidade.

- **Decision**: quando existe teto do mês, a barra do medidor passa a medir
  **gasto ÷ meta**, e a entrada do mês vira uma marca posicional sobre ela.
  Sem meta, tudo permanece exatamente como está hoje: gasto ÷ entrada.

- **Rationale**: definir um teto muda a pergunta que a pessoa faz. Sem meta,
  ela pergunta "quanto da minha renda já gastei"; com meta, pergunta "quanto
  do que eu me permiti já foi". O denominador precisa acompanhar a pergunta,
  senão o número em destaque responde a outra coisa.

  A alternativa que as tarefas sugeriam — manter a entrada como escala e pôr
  a meta como marca — quebra em dois casos comuns: meta maior que a entrada
  (a marca cai fora da barra) e mês que ainda não teve receita (a escala é
  degenerada). Além disso, misturar duas referências no mesmo desenho é o
  erro de eixo duplo que a skill de visualização proíbe.

  Invertendo, a entrada como marca funciona nos dois casos: se ela cai fora,
  é porque a meta é maior que a renda — e isso é exatamente o que a pessoa
  precisa ver.

- **Alternatives considered**: *dois medidores empilhados* (dobra a altura da
  seção mais vista do app e obriga a comparar); *manter sempre a entrada como
  base* (o número em destaque deixaria de responder à pergunta que a meta
  cria).

## R9. Todas as metas contam o previsto

Também vinda da análise, que encontrou a assimetria.

- **Decision**: o consumo de qualquer meta — teto geral e categoria — inclui
  os lançamentos previstos, distinguidos do efetivado.
- **Rationale**: a versão anterior contava previsto só no teto geral, porque
  a distribuição por categoria que já existe usa apenas efetivado. O efeito
  seria o teto dizer "perto do limite" enquanto Moradia diz "dentro", sem
  explicação visível — dois números que não fecham custam mais confiança do
  que a precisão que a base diferente ganharia.
- **Consequência**: `summarizeMonth` hoje só acumula efetivado por categoria.
  Alinhar exige devolver também o previsto por categoria — mudança pequena,
  mas na função de dinheiro mais usada do app, então entra na fase
  fundacional e com teste próprio.
- **Alternatives considered**: manter a assimetria e explicá-la na interface
  (gasta espaço para justificar uma inconsistência que dá para não ter).
