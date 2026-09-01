# Research: Recorrências Semanais e Anuais

**Date**: 2026-09-01 | **Plan**: [plan.md](./plan.md)

Nenhum NEEDS CLARIFICATION restou. Esta é a primeira feature do projeto que
**altera** uma capacidade em produção, então as decisões abaixo são
dominadas por não quebrar o que já roda com dinheiro real.

## R1. Frequência ausente significa mensal

- **Decision**: o campo `frequency` é **opcional** no documento gravado. Um
  documento sem ele é lido como mensal.

- **Rationale**: as recorrências que já existem no Firestore não têm esse
  campo. Torná-lo obrigatório exigiria reescrever todos os documentos — uma
  migração de dados financeiros, com janela de inconsistência, num app sem
  nenhum mecanismo de migração. Com o campo opcional, **zero documentos são
  tocados** e a atualização é invisível para quem já usa (FR-016, SC-005).

  O custo é uma leitura defensiva num ponto (`frequency ?? 'monthly'`), que
  fica isolada na função que resolve a frequência.

- **Alternatives considered**:
  - *Campo obrigatório com migração na entrada*: reescrever documentos no
    primeiro acesso é a receita para corromper dado de dinheiro quando a
    escrita falha no meio.
  - *Migração manual pelo usuário*: uma tela de "converta suas recorrências"
    é exatamente o que o FR-016 proíbe.

## R2. A chave de idempotência depende da frequência

Esta é a decisão que mais podia dar errado em silêncio.

- **Decision**:
  - **mensal** e **anual** continuam com `rec_{recorrência}_{AAAA-MM}`
  - **semanal** passa a usar `rec_{recorrência}_{AAAA-MM-DD}`

- **Rationale**: o id determinístico é o que impede duplicata quando o app
  abre no PC e no celular ao mesmo tempo. Ele funciona porque identifica
  unicamente uma ocorrência.

  Para mensal e anual, o mês **é** único — cada uma gera no máximo um
  lançamento por mês. A chave atual já serve, e mantê-la é o que preserva os
  documentos já gravados: mudar a chave faria o app não reconhecer os
  lançamentos existentes e **criar duplicatas de tudo**.

  Para semanal, um mês tem quatro ou cinco ocorrências. A chave por mês
  colapsaria todas num documento só — a primeira venceria e as demais
  sumiriam. A data resolve, e como não existe recorrência semanal gravada,
  não há compatibilidade a preservar.

  Não são dois esquemas: é uma regra só — **a chave identifica o que torna a
  ocorrência única naquela frequência**.

- **Alternatives considered**: *data para todas as frequências* — mais
  uniforme, mas invalidaria a chave de todos os lançamentos mensais já
  criados e duplicaria cada um deles. Uniformidade não vale corromper o
  histórico.

## R3. Horizonte assimétrico, sem multiplicar leituras

- **Decision**: semanal e mensal seguem com horizonte de 3 meses. A anual
  alcança 12 meses — mas **só os meses que de fato recebem lançamento anual
  são consultados**, calculados a partir do dia e mês da recorrência.

- **Rationale**: o FR-009 exige um ano à frente para a anual, e a forma
  ingênua (rodar o horizonte de 12 meses para tudo) quadruplicaria as
  leituras de quem só tem recorrência mensal, sem nenhum ganho.

  Como a anual acerta exatamente um mês por ano, dá para calcular qual é e
  preparar só ele. O custo extra vira **uma leitura por recorrência anual por
  ano** — e quem não tem nenhuma paga exatamente o que paga hoje.

- **Alternatives considered**: *horizonte de 12 meses para todas* (custo sem
  retorno); *horizonte configurável* (uma alavanca a mais para o usuário
  entender, sem demanda).

## R4. Mudar a frequência não apaga o que já foi gerado

- **Decision**: trocar a frequência de uma recorrência existente é permitido,
  e os lançamentos previstos já criados **permanecem**.

- **Rationale**: é o comportamento que o app já tem para qualquer edição —
  mudar o valor de uma recorrência hoje não altera os previstos já
  materializados. Manter a mesma regra evita uma exceção difícil de explicar
  ("editar valor não mexe, mas editar frequência apaga").

  O efeito colateral é honesto e visível: depois de trocar mensal por semanal,
  o mês pode mostrar o previsto antigo mais os novos. São lançamentos comuns,
  e a pessoa exclui os que não quer — sem nada acontecendo escondido.

- **Alternatives considered**: *limpar os previstos não confirmados ao trocar*
  (apagar lançamento por efeito colateral de uma edição é o tipo de coisa que
  destrói confiança); *proibir a troca* (resolve por decreto um problema que
  o usuário sabe resolver sozinho).

## R5. As regras precisam aceitar os dois formatos

- **Decision**: as Security Rules validam por frequência, tratando a ausência
  do campo como mensal, e continuam exigindo `dayOfMonth` nesse caso.

- **Rationale**: as regras atuais exigem `dayOfMonth` entre 1 e 31 sempre.
  Uma recorrência semanal não tem dia do mês, então a regra atual a
  rejeitaria. Ao mesmo tempo, afrouxar a validação para todos deixaria passar
  documento mensal sem dia — que é o formato de tudo que já está gravado.

  A regra precisa ser condicional, e o teste precisa cobrir **os dois
  formatos**: o antigo (sem `frequency`) e o novo.

- **Alternatives considered**: *remover a validação de dia* (perde a proteção
  que já existe); *exigir `frequency` nas regras* (rejeitaria toda escrita
  sobre os documentos já gravados — encerrar uma recorrência antiga passaria a
  falhar).

## R6. Ocorrências de um dia da semana num mês

- **Decision**: uma função pura em `shared/dates.ts` devolve todas as datas de
  um dia da semana dentro de um mês, e a geração semanal itera sobre ela.

- **Rationale**: o módulo de datas já concentra a aritmética de calendário do
  projeto, com testes próprios — é onde o `clamp` do dia 31 mora. Espalhar
  cálculo de calendário pela lógica financeira é como aparecem erros de virada
  de mês.

- **Alternatives considered**: calcular dentro de `recurrenceRules` (mistura
  regra de negócio com aritmética de calendário e duplica o que já existe).

## R7. O descarte de uma ocorrência mora na própria recorrência

Decisão vinda da análise, que encontrou o requisito sem mecanismo — e o
defeito correspondente já em produção.

- **Decision**: quando um lançamento previsto de recorrência é excluído, a
  chave daquela ocorrência é gravada numa lista `skips` **no documento da
  recorrência**, na mesma escrita. A geração passa a ignorar as chaves
  descartadas.

- **Rationale**: hoje a geração decide o que criar comparando os candidatos
  com os lançamentos que **existem** no mês. Um documento excluído deixa de
  existir, o candidato volta a faltar, e ele é recriado — excluir o aluguel
  previsto o traz de volta na próxima materialização. É um defeito que já
  existe desde a feature 001; a semanal só o tornaria frequente, porque há
  quatro ou cinco ocorrências por mês para descartar.

  Guardar o descarte na própria recorrência é o caminho mais barato: as
  recorrências **já estão carregadas em memória** no momento de materializar,
  então não custa nenhuma leitura nova, não exige coleção nem bloco de regras
  novo, e cresce devagar — descartar uma ocorrência é exceção.

- **Alternatives considered**:
  - *Coleção de descartes* (como o `taskOverrides` do planner): coerente com
    um padrão que o projeto já usa, mas custa uma leitura por mês para
    resolver um caso raro.
  - *Marcar a transação em vez de excluir*: mudaria o conjunto de estados do
    lançamento e mexeria na lógica de resumo — muito mais superfície para um
    problema pequeno.
  - *Aceitar que volta*: foi o que a versão anterior da spec fazia sem
    perceber. Excluir algo e vê-lo reaparecer destrói a confiança no app mais
    do que qualquer funcionalidade ausente compensa.

## R8. A consulta de recorrências não pode ordenar por um campo opcional

Também vinda da análise.

- **Decision**: a consulta lê a coleção inteira **sem `orderBy`**, e a
  ordenação acontece em memória.

- **Rationale**: a consulta atual ordena por `dayOfMonth`, e o Firestore
  **exclui do resultado todo documento que não tem o campo ordenado**. Uma
  recorrência semanal não tem dia do mês: ela seria gravada com sucesso e
  depois simplesmente não existiria para o app — fora da lista, fora das
  ativas, nunca materializada, sem erro nenhum.

  A coleção tem no máximo uma dezena de documentos, então ordenar no servidor
  não compra nada. Em memória, dá para ordenar pelo que interessa de verdade
  — a próxima ocorrência — que é o que o FR-018 pede.

- **Alternatives considered**: *ordenar por `createdAt`* (funciona, mas mantém
  a armadilha para o próximo campo opcional que alguém acrescentar);
  *gravar um `dayOfMonth` fictício na semanal* (dado mentiroso no banco para
  contornar uma limitação de consulta).
