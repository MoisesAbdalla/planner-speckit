# Contract: Metas de Orçamento no Firestore

**Feature**: 003-budget-goals | **Data model**: [../data-model.md](../data-model.md)

## Caminho

```text
users/{uid}/budgetGoals/{alvo}     # alvo = "overall" ou o id da categoria
```

Id determinístico, como nas recorrências: dois aparelhos definindo a mesma
meta ao mesmo tempo convergem para um documento, em vez de criarem dois.

## Formato

```json
{
  "target": "category",
  "categoryId": "abc123",
  "versions": [
    { "from": "2026-01", "amountCents": 80000 },
    { "from": "2026-09", "amountCents": 100000 }
  ],
  "overrides": { "2026-12": 150000 },
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

## Consultas

| Uso | Consulta | Índice |
|-----|----------|--------|
| Todas as metas do usuário | coleção inteira, com `onSnapshot` | nenhum |

A coleção tem no máximo uma entrada por categoria mais o teto geral. Não há
consulta por mês: a resolução da meta vigente acontece em memória.

## Invariantes de escrita

1. `amountCents` é **inteiro ≥ 0** em toda versão e em toda exceção. Zero
   significa "nenhum gasto previsto"; negativo é rejeitado.
2. `versions` tem ao menos um elemento e nunca duas entradas com o mesmo
   `from`. Definir de novo no mesmo mês substitui.
3. Definir um novo valor padrão **acrescenta** uma versão a partir do mês
   corrente — nunca edita as anteriores. É o que impede o app de reescrever
   como um mês passado foi avaliado.
4. Ajustar um mês grava em `overrides[mês]`; desfazer remove aquela chave e
   não toca em `versions`.
5. Remover a meta apaga o documento inteiro. Um documento com `versions`
   vazia é inválido.
6. `target` e `categoryId` são coerentes entre si: `overall` tem
   `categoryId` nulo; `category` exige o id preenchido e igual ao id do
   documento.

## Security Rules

Somar ao `firestore.rules` da raiz, dentro de `match /users/{uid}`:

```
match /budgetGoals/{alvo} {
  allow read, delete: if signedInAs(uid);
  allow create, update: if signedInAs(uid)
    && request.resource.data.target in ['overall', 'category']
    && (request.resource.data.target != 'category'
        || (request.resource.data.categoryId is string
            && request.resource.data.categoryId == alvo))
    && (request.resource.data.target != 'overall' || alvo == 'overall')
    && request.resource.data.versions is list
    && request.resource.data.versions.size() >= 1
    && request.resource.data.versions.size() <= 240
    && request.resource.data.overrides is map
    && request.resource.data.overrides.size() <= 240;
}
```

As regras validam o que é verificável sem percorrer a lista: tipo do alvo,
coerência com o id do documento, e que existe ao menos uma versão. O formato
de cada versão e o valor não negativo são garantidos pelo app e cobertos por
teste unitário — as regras do Firestore não iteram listas, e forçar isso
exigiria achatar a estrutura e perder o histórico.

## Contrato de exibição

| Regra | Motivo |
|-------|--------|
| Sem meta, o componente renderiza exatamente o que renderizava antes | FR-020 — a feature não pode punir quem não a usa |
| Os três estados aparecem por posição (marca de limite), texto e cor — nunca só cor | FR-014, SC-007 |
| A marca de limite é um fio sobre a barra, não um ícone | mantém a gramática da caderneta |
| Com meta definida, a barra mede **gasto ÷ meta**; a entrada do mês vira marca sobre ela. Sem meta, permanece gasto ÷ entrada | research R8 — definir um teto muda a pergunta, e o denominador acompanha |
| Uma escala só por desenho. A entrada nunca vira segundo eixo | eixo duplo é proibido pela skill de visualização |
| Marca fora da barra é resultado legítimo: significa meta acima da renda | é o que a pessoa precisa ver |
| Toda meta inclui o previsto, distinguido do efetivado — teto e categoria na mesma base | FR-015, research R9 |
| O consumo é sempre derivado no momento de exibir | Princípio IV |
| Registrar um gasto não consulta nem depende de meta | FR-019 — nada pode entrar nesse caminho |
