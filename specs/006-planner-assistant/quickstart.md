# Quickstart: Validação da feature 006 — Assistente no Planner

## Pré-requisitos

- `npm run dev` rodando
- Pelo menos um lançamento e uma tarefa já existentes, para comparar

## Testes automatizados

```bash
npm test        # inclui a regressão das 45 frases financeiras
npx tsc -b
npm run lint
npm run build
```

O `npm test` responde pelos três critérios: acerto de data e hora (SC-002),
acerto do lado (SC-003) e **as 45 frases financeiras inalteradas** (SC-005).

## Validação manual

### 1. A regressão — faça este primeiro

Antes de escrever qualquer frase de tarefa:

1. Abrir o assistente e escrever `20 no mercado` → o **lançamento** abre
   preenchido, com R$ 20,00, hoje, categoria de alimentação. Nenhum passo
   novo, nenhuma pergunta.
2. Escrever `salário 3200` → receita, R$ 3.200,00.
3. Escrever `paguei 47,90 no posto ontem` → data de ontem.
4. Abrir o formulário de lançamento pelo botão de sempre → a primeira
   categoria continua pré-selecionada.
5. Abrir o formulário de tarefa pelo botão de sempre → tudo como era.

Qualquer diferença aqui é regressão: pare.

### 2. Uma frase vira tarefa (US1)

1. Escrever `lembrar de pagar o IPTU sexta` → embaixo do campo aparece
   **"Entendi como tarefa"**; Continuar abre o **formulário de tarefa** com
   título `pagar o IPTU` e a data da sexta.
2. Salvar → o app vai para a **visão de dia** do planner, na sexta, com a
   tarefa à vista.
3. Cancelar em vez de salvar → nada gravado.
4. Escrever `reunião com o contador`, sem data → data de hoje, e a linha diz
   que a data é padrão, não entendimento.

### 3. Hora (US3)

1. `academia amanhã às 7h` → hora 07:00, data de amanhã, título `academia`.
2. `reunião dia 10 às 15h30` → hora 15:30.
3. `almoço meio-dia` → hora 12:00.
4. `dentista sexta` → o campo de hora chega **vazio**. Nenhuma hora inventada.
5. **O par que separa hora de dinheiro**: `paguei 15 no lanche` vira
   lançamento de R$ 15,00; `reunião às 15h` vira tarefa às 15:00.

### 4. A troca (US2)

1. Escrever `pagar 200 do IPTU sexta` → a linha diz **"pode ser tarefa ou
   lançamento"**, com a troca destacada.
2. Tocar na troca → a leitura vira tarefa; Continuar abre o formulário de
   tarefa com título e data preenchidos, sem redigitar nada.
3. Escrever `20 no mercado` → a linha diz "entendi como lançamento", **sem**
   anunciar dúvida que não existe. A troca continua disponível.
4. Escrever `academia amanhã às 7h`, trocar para lançamento → o formulário de
   lançamento abre com a descrição preenchida e o **valor vazio**, porque a
   frase não tinha valor.

### 5. De uma tela para a outra (FR-017)

1. No **planner**, escrever `30 farmácia` → o app leva ao financeiro com o
   lançamento preenchido.
2. No **financeiro**, escrever `dentista terça às 9h` → o app leva à visão de
   dia do planner, na terça, com a tarefa à vista.
3. Abrir e fechar o assistente sem escrever → a tela por baixo não muda.

### 6. Voz (FR-020)

1. Falar `lembrar de comprar pão amanhã` → a transcrição alimenta a mesma
   leitura, e a linha ao vivo acompanha o texto transcrito.

### 7. Nos dois temas e nas duas larguras

Repetir os passos 2 e 4 em ~375px e ~1280px, nos dois temas. A linha de
leitura não pode empurrar o campo nem quebrar em duas no celular.

## Publicar

```bash
npm run build
firebase deploy --only hosting
```

Sem `firestore:rules`: esta feature não altera nenhuma regra.
