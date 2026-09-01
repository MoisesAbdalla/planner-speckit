# Contract: Recorrências no Firestore (revisão da feature 004)

**Feature**: 004-weekly-yearly-recurrences | **Data model**: [../data-model.md](../data-model.md)

Revisa o contrato da feature 001. O caminho e os campos existentes não mudam.

## Caminho

```text
users/{uid}/recurrences/{id}
```

## Formato

```json
{
  "type": "expense",
  "amountCents": 240000,
  "description": "IPVA",
  "categoryId": "cat-transporte",
  "frequency": "yearly",
  "dayOfMonth": 15,
  "monthOfYear": 1,
  "startMonth": "2026-09",
  "endMonth": null,
  "skips": []
}
```

`frequency` **ausente significa mensal** — é assim que todo documento gravado
antes desta feature continua válido.

## Invariantes de escrita

1. `frequency`, quando presente, é `weekly`, `monthly` ou `yearly`.
2. Mensal e anual exigem `dayOfMonth` entre 1 e 31; anual exige também
   `monthOfYear` entre 1 e 12.
3. Semanal exige `weekday` entre 1 e 7 (ISO: 1 = segunda), a mesma convenção
   já usada nas tarefas do planner.
4. Campos de outras frequências podem sobrar de uma edição anterior e são
   ignorados na leitura — nunca são motivo para rejeitar a escrita.
5. A chave do lançamento gerado é `rec_{recorrência}_{AAAA-MM}` para mensal e
   anual, e `rec_{recorrência}_{AAAA-MM-DD}` para semanal. **Mudar a chave de
   mensal quebraria o reconhecimento de tudo que já está gravado e duplicaria
   cada lançamento.**

## Security Rules

Substituir o bloco `match /recurrences/{recId}` por:

```
match /recurrences/{recId} {
  allow read, delete: if signedInAs(uid);
  allow create, update: if signedInAs(uid)
    && request.resource.data.type in ['expense', 'income']
    && validAmount(request.resource.data.amountCents)
    && request.resource.data.description is string
    && request.resource.data.description.size() >= 1
    && request.resource.data.description.size() <= 120
    && isMonth(request.resource.data.startMonth)
    && (request.resource.data.endMonth == null
        || isMonth(request.resource.data.endMonth))
    && (!('frequency' in request.resource.data)
        || request.resource.data.frequency in ['weekly', 'monthly', 'yearly'])
    // Semanal: exige o dia da semana.
    && (request.resource.data.get('frequency', 'monthly') != 'weekly'
        || (request.resource.data.weekday is int
            && request.resource.data.weekday >= 1
            && request.resource.data.weekday <= 7))
    // Mensal e anual: exigem o dia do mês, como já era.
    && (request.resource.data.get('frequency', 'monthly') == 'weekly'
        || (request.resource.data.dayOfMonth is int
            && request.resource.data.dayOfMonth >= 1
            && request.resource.data.dayOfMonth <= 31))
    // Anual: exige também o mês.
    && (request.resource.data.get('frequency', 'monthly') != 'yearly'
        || (request.resource.data.monthOfYear is int
            && request.resource.data.monthOfYear >= 1
            && request.resource.data.monthOfYear <= 12))
    // Descartes: lista, presente ou não, com teto.
    && (!('skips' in request.resource.data)
        || (request.resource.data.skips is list
            && request.resource.data.skips.size() <= 500));
}
```

O `get('frequency', 'monthly')` é o que mantém a validação antiga valendo para
os documentos sem o campo: sem ele, encerrar uma recorrência antiga passaria a
ser recusado.

## Contrato de comportamento

| Regra | Motivo |
|-------|--------|
| Documento sem `frequency` é mensal | FR-016 — nada de migração |
| Semanal gera uma ocorrência por semana, inclusive em meses com cinco | FR-007 |
| Anual gera só no mês escolhido, com um ano de antecedência | FR-008, FR-009 |
| Data inexistente cai no último dia válido | FR-010 — mesma regra de hoje |
| Abrir em dois aparelhos não duplica, em nenhuma frequência | FR-011 |
| Trocar a frequência não apaga previstos já criados | mesma regra de qualquer edição |
| Excluir um previsto registra o descarte e ele não volta | FR-012 — corrige defeito que já existe |
| A consulta da lista não ordena por campo opcional | o Firestore excluiria a semanal do resultado |
| Só os meses que recebem lançamento anual são consultados | custo de leitura não pode crescer para quem não usa |
