# Quickstart: Validação da feature 005 — Assistente por Frase e por Voz

## Pré-requisitos

- `npm install` feito e `.env.local` no lugar
- `npm run dev` rodando
- Ao menos um mês com lançamentos já feitos, para a US3 ter o que aprender

## Testes automatizados

```bash
npm test                  # interpretador, números, datas, fixtures
npx tsc -b                # tipos
npm run lint
npm run build
```

O `npm test` é quem responde pelo SC-002 e pelo SC-003. Ele falha se o acerto
de valor, tipo e data cair abaixo de 90%, e falha na **primeira** ocorrência de
valor preenchido numa frase sem número.

## Validação manual

### 1. A regressão — faça este primeiro

Antes de tocar no assistente, prove que o caminho manual não mudou:

1. Abrir o formulário pelo botão de sempre.
2. Conferir que a **primeira categoria já vem selecionada**, como sempre veio.
3. Lançar um gasto normalmente → aparece na lista e no saldo.
4. Lançar um gasto com data de **outro mês** → a tela **não** navega, como
   sempre foi.
5. Editar e excluir um lançamento → tudo como antes.

Qualquer diferença aqui é violação do FR-021: pare, é regressão.

### 2. Frase escrita (US1)

1. Tocar no botão do assistente **na página financeira** e escrever
   `20 no mercado` → o formulário abre com R$ 20,00, gasto, categoria de
   alimentação, hoje.
2. Salvar → aparece na lista e no saldo.
3. Escrever `salário 3200` → tipo **receita**, R$ 3.200,00.
4. Escrever `paguei 47,90 no posto ontem` → data de **ontem**.
5. Escrever `R$ 1.200,00 aluguel` → R$ 1.200,00, não R$ 1,20.
6. Escrever `no mercado`, sem número → o valor chega **vazio** e com foco.
   Nenhum valor inventado. Este é o teste do SC-003 na mão.
7. Escrever `bom dia` → o assistente diz que não entendeu e oferece o
   formulário com o texto na descrição.
8. Escrever `20 mercado`, e **trocar a categoria** no formulário antes de
   salvar → valor, data e descrição continuam preenchidos; nada é redigitado
   (SC-006).
9. Cancelar o formulário → nada gravado.

### 3. O botão em qualquer tela (FR-024, FR-025, FR-026)

1. Ir para o **planner**, tocar no assistente e escrever `30 farmácia`.
2. O app leva ao financeiro com o formulário preenchido; salvar → o
   lançamento está **visível na lista**.
3. Voltar ao planner, abrir e **fechar** o assistente sem escrever nada → a
   tela do planner continua exatamente como estava (dia, rolagem).

### 4. O mês certo (R9, SC-009)

1. Navegar para um mês **anterior** no financeiro.
2. Lançar pelo assistente uma frase com `hoje`.
3. Depois de salvar, a tela vai para o mês de hoje, com o lançamento à vista.
   Nada de "sumiu" — este é o passo que impede o lançamento em dobro.

### 5. Voz (US2)

Em Chrome, Edge ou Safari:

1. Tocar no microfone e falar `gastei quarenta reais na farmácia` → a
   transcrição aparece e vira R$ 40,00, gasto, saúde.
2. Falar e olhar a tela: está claro que o app está ouvindo, e dá para parar.
3. Corrigir o texto transcrito à mão → o rascunho é refeito.
4. Negar a permissão do microfone → mensagem explicando, e o campo de texto
   segue funcionando.
5. Falar e ficar em silêncio → mensagem de que nada foi ouvido, sem travar.

**Em Firefox** (sem Web Speech API): o botão de microfone **não aparece** —
não aparece cinza, não aparece quebrado. Todo o resto funciona.

### 6. Categoria pelo histórico (US3)

1. Lançar `padaria` escolhendo Alimentação à mão.
2. Recarregar a página (para o histórico ser lido de novo).
3. Escrever `padaria 12` → a categoria vem **preenchida**.
4. Escrever uma descrição inédita e fora do dicionário → a categoria chega
   **vazia**, com "Escolha uma categoria", e o salvar espera a escolha. Ela
   **não** cai na primeira da lista.

### 7. Nos dois temas e nas duas larguras

Repetir os passos 2 e 5 em ~375px e ~1280px, no tema claro e no escuro
(Princípio III). O botão não pode cobrir conteúdo nem o rodapé de navegação.

## Publicar

```bash
npm run build
firebase deploy --only hosting
```

Sem `firestore:rules` desta vez: **esta feature não altera nenhuma regra**.
Ela só lê o que o app já podia ler.
