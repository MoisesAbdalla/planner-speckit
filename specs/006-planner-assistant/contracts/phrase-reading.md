# Contrato: as duas leituras da frase

`src/features/finance/lib/phraseReading.ts`

```text
readPhrase(phrase: string, context: ParseContext) -> PhraseReading
```

Função **pura**, como `parsePhrase`. Não lê relógio, não importa Firebase.

---

## A garantia que sustenta a feature

```text
readPhrase(f, ctx).transaction  ===  parsePhrase(f, ctx)
```

Para **toda** frase. `readPhrase` chama `parsePhrase` e guarda o retorno sem
tocá-lo. Não é uma recomendação de estilo: é a razão de o assistente
financeiro continuar idêntico, e há um teste que a afirma frase a frase sobre
as 45 do conjunto que já existe.

---

## Ordem de extração

**Data → hora → valor → título.**

A hora entra entre a data e o valor, e a posição é o contrato:

- `gastei 20 dia 5` — a data sai antes, senão o `5` vira R$ 5,00 (já era assim)
- `reunião às 15h` — a hora sai antes do valor, senão `15` vira R$ 15,00
- `paguei 15 no lanche` — sem marca de hora, o `15` **é** dinheiro

Esse par de frases é obrigatório nos testes: é o único jeito de travar a regra
que separa hora de dinheiro.

---

## A decisão do lado

| Tem valor? | Tem sinal de tarefa? | `kind` | `ambiguous` |
|---|---|---|---|
| não | sim | `task` | `false` |
| sim | não | `transaction` | `false` |
| sim | sim | `transaction` | `true` |
| não | não | `transaction` | `false` |

**Sinal de tarefa** vem de duas fontes:

1. **Marca de lembrete**, em dois grupos com papéis diferentes:
   - *Só anunciam* (saem do título): `lembrar`, `lembrete`, `preciso`,
     `marcar`, `agendar`, `compromisso`.
   - *Descrevem a tarefa* (ficam no título): `reunião`, `consulta`,
     `aniversário`, `médico`, `dentista`, `prova`, `aula`, e os infinitivos de
     intenção `pagar`, `comprar`, `ligar`, `levar`, `buscar`, `entregar`,
     `renovar`.
   Sem essa separação, `marcar dentista` viraria uma tarefa sem nome.
   O infinitivo é intenção e o passado é fato consumado: `pagar o IPTU` é
   lembrete, `paguei 47,90 no posto` é gasto. Tokens diferentes, distinção de
   graça.
2. **Hora do dia**. `academia amanhã às 7h` não tem palavra de lembrete
   nenhuma, e mesmo assim é compromisso — quem diz a que horas não está
   registrando um gasto.

**A hora sai da frase antes da leitura financeira.** Sem isso, `reunião às 15h`
chega a `parsePhrase` com um `15` solto e vira R$ 15,00 — e aí a frase passa a
"ter valor", o que faz a decisão desandar em seguida. Quando não há marca de
hora, a frase original é passada intacta, e é por isso que as 45 frases
financeiras seguem pelo caminho literalmente idêntico ao de antes.

**Ambígua escolhe `transaction`** porque é o lado que tem valor, e refazer um
valor à mão custa mais do que refazer um título.

---

## Casos que o contrato fixa

| Frase | `kind` | `ambiguous` | Observação |
|---|---|---|---|
| `20 no mercado` | transaction | não | igual a hoje |
| `mercado` | transaction | não | sem sinal nenhum: o padrão de hoje |
| `salário 3200` | transaction | não | receita também é lançamento |
| `lembrar de pagar o IPTU sexta` | **task** | não | marca de lembrete, sem valor |
| `academia amanhã às 7h` | **task** | não | hora é marca de compromisso |
| `reunião com o contador` | **task** | não | `reunião` é marca |
| `pagar 200 do IPTU sexta` | transaction | **sim** | valor + marca |
| `lembrar de pagar 200 do IPTU` | transaction | **sim** | idem |
| `paguei 15 no lanche` | transaction | não | `15` é dinheiro |
| `reunião às 15h` | **task** | não | `15h` é hora |
| `bom dia` | transaction | não | `understood: false` dos dois lados |

---

## Módulos auxiliares

**`phraseTime.ts`** — `extractTime(texto) -> { time, rest } | null`.
Reconhece `às 7h`, `7h`, `7h30`, `às 7:30`, `07:30`, `meio-dia`,
`meia-noite`. Devolve o texto restante, como `extractDate` já faz. Hora fora
de 0–23 ou minuto fora de 0–59 devolve `null` — descartar, nunca ajustar.

**`reminderWords.ts`** — `hasReminderMark(texto) -> boolean` e a lista.

**`taskParser.ts`** — `parseTask(texto, context) -> ParsedTask`. Data pela
mesma `extractDate` do financeiro, hora por `extractTime`, título pelo resto.

---

## Como o contrato é verificado

- **`phraseReading.regression.test.ts`** — para cada uma das 45 frases do
  conjunto financeiro: `kind === 'transaction'` e `transaction` igual, campo a
  campo, ao retorno de `parsePhrase`. **Este é o teste mais importante da
  feature.**
- **`tasks.ts` + `taskParser.test.ts`** — 30+ frases, acerto de data e hora
  ≥ 90% (SC-002), e zero horas inventadas (SC-004, absoluto).
- **`readings.ts` + `phraseReading.test.ts`** — 20+ frases rotuladas, acerto
  do lado ≥ 85% (SC-003), com a ambígua contando como acerto quando é
  anunciada como ambígua.
