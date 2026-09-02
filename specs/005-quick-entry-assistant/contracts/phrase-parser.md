# Contrato: o interpretador de frases

`src/features/finance/lib/phraseParser.ts`

```text
parsePhrase(phrase: string, context: ParseContext) -> ParsedPhrase
```

Função **pura**: mesma entrada, mesma saída, sempre. Não lê relógio, não
importa Firebase, não toca no DOM. É por isso que ela é testável frase a
frase, e é por isso que o SC-002 pode ser um número em vez de uma impressão.

---

## Garantias

Estas valem para **toda** entrada, inclusive texto sem sentido:

1. **Nunca lança exceção.** Frase vazia, emoji, 500 caracteres de ruído: o
   retorno é um `ParsedPhrase` com `understood: false`.
2. **`amountCents` é `null` quando não havia número.** Absoluto (SC-003).
3. **`categoryId` é sempre `null` ou o id de uma categoria de
   `context.categories`.** Nunca um id inventado, nunca de categoria
   arquivada (FR-020).
4. **`date` é sempre uma data de calendário válida** no formato `YYYY-MM-DD`.
5. **`description` nunca contém o valor nem a expressão de data** que já foram
   consumidos.
6. **Não há efeito colateral.** Nada é gravado, nada é enviado.

---

## Ordem de extração

A ordem não é estilo — trocá-la muda o resultado:

1. **Data primeiro.** `dia 5` precisa sair da frase antes da busca por valor,
   senão o `5` vira R$ 5,00.
2. **Valor depois**, sobre o texto já sem a data.
3. **Tipo**, pelas palavras da frase inteira.
4. **Categoria**, pelas três tentativas do R5, sobre o texto restante.
5. **Descrição**, o que sobrou, com as palavras de comando removidas
   (`registre`, `lançar`, `anota`, `gastei`, `paguei`, `no`, `na`, `de`).

---

## Casos que o contrato fixa

| Frase | `amountCents` | `type` | `date` | `description` |
|---|---|---|---|---|
| `20 no mercado` | `2000` | expense | hoje | `mercado` |
| `registre gasto de 20 reais mercado` | `2000` | expense | hoje | `mercado` |
| `salário 3200` | `320000` | **income** | hoje | `salário` |
| `paguei 47,90 no posto ontem` | `4790` | expense | **ontem** | `posto` |
| `R$ 1.200,00 aluguel` | `120000` | expense | hoje | `aluguel` |
| `vinte reais no mercado` | `2000` | expense | hoje | `mercado` |
| `gastei 20 dia 5` | `2000` | expense | **dia 5** | (vazia) |
| `no mercado` | **`null`** | expense | hoje | `mercado` |
| `bom dia` | **`null`** | expense | hoje | — (`understood: false`) |

`type: expense` nas linhas sem indício é o padrão do FR-003, e vem com
`typeFromPhrase: false` para que a interface não o apresente como
entendimento.

---

## Módulos auxiliares

Cada um é puro e testado sozinho, porque cada um erra de um jeito diferente:

**`numberWords.ts`** — `wordsToNumber(texto) -> number | null`. Unidades,
dezenas, centenas e `mil`, compostos por `e`, até 999.999.

**`phraseDates.ts`** — `extractDate(texto, hoje, mêsEmExibição) -> { date, rest } | null`.
Devolve **o texto restante** junto, e é isso que permite ao valor ser buscado
sem a data no caminho.

**`categoryHints.ts`** — `matchCategory(texto, categorias, histórico) -> { categoryId, source } | null`.
As três tentativas do R5, nesta ordem, parando na primeira.

---

## Como o contrato é verificado

`tests/unit/fixtures/phrases.ts` guarda 40+ frases com o resultado esperado.
Os testes medem:

- **acerto de valor, tipo e data ≥ 90%** (SC-002) — falha abaixo disso;
- **zero valores inventados** nas frases sem número (SC-003) — falha em uma
  única ocorrência, sem tolerância.

A diferença de rigor é deliberada: categoria errada custa um toque; valor
inventado corrompe o saldo em silêncio.
