# Quickstart: Validação da feature 004 — Recorrências Semanais e Anuais

Guia de verificação. Modelo em [data-model.md](./data-model.md); contrato em
[contracts/firestore-recurrences.md](./contracts/firestore-recurrences.md).

## Pré-requisitos

Ambiente das features anteriores já resolvido. Publicar as regras atualizadas
antes de usar a versão nova:

```bash
npx firebase deploy --only firestore:rules
npm run dev
```

Sem isso, cadastrar uma recorrência semanal é recusado — ela não tem
`dayOfMonth`, que as regras antigas exigem.

## Testes automatizados

```bash
npm test                  # geração por frequência, idempotência, calendário
npm run test:rules        # formato novo E o antigo, lado a lado
npm run test:integration
```

**Esperado**: tudo verde. Entre eles está o teste que mais importa nesta
feature: uma recorrência **sem** o campo de frequência continua sendo tratada
como mensal e gerando exatamente os mesmos lançamentos de antes.

## Validação manual

### 1. A regressão — faça este primeiro

Antes de cadastrar qualquer coisa nova:

1. Abrir o mês corrente e os dois seguintes.
2. Conferir que **as recorrências mensais que você já tinha continuam
   gerando os mesmos previstos**, nos mesmos dias e valores.
3. Conferir que nenhum lançamento apareceu duplicado.
4. Encerrar e reativar nada — só olhar. Se algo mudou aqui, pare: é
   regressão, não feature nova.

### 2. Conta anual (US1)

1. Cadastrar "IPVA, R$ 2.400,00, todo dia 15 de janeiro".
2. Navegar até janeiro do ano que vem → o previsto está lá.
3. Navegar pelos meses intermediários → **não** aparece em nenhum deles.
4. Confirmar o lançamento com um toque → entra no saldo real daquele mês.
5. Editar só aquele lançamento → os outros anos não mudam.
6. Encerrar a recorrência → nada novo é gerado, o passado permanece.
7. Cadastrar uma com data em 29 de fevereiro → em ano não bissexto cai no 28.

### 3. Gasto semanal (US2)

1. Cadastrar "Feira, R$ 180,00, toda terça".
2. Conferir um previsto em **cada terça** do mês corrente.
3. Abrir um mês que tenha **cinco** terças → os cinco aparecem.
4. Confirmar um deles → só aquele muda; os outros seguem previstos.
5. Excluir um previsto individual → ele **não** volta ao reabrir o mês.

### 4. Lista e não-duplicação (US3, FR-011)

1. Com mensal, semanal e anual cadastradas, abrir a lista → cada uma diz a
   frequência em palavras e quando acontece de novo.
2. Abrir o mesmo mês no PC e no celular ao mesmo tempo → **zero duplicatas**,
   principalmente na semanal, que tem quatro ou cinco ocorrências por mês.
3. Trocar a frequência de uma recorrência → os previstos já criados
   permanecem, para você excluir ou confirmar. É o comportamento esperado,
   não um defeito.

## Publicar

```bash
npm run build
npx firebase deploy --only firestore:rules
npx firebase deploy --only hosting
```

Regras antes do hosting: a versão nova grava recorrências num formato que as
regras antigas recusam.
