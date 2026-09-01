# Contract: Tokens de Design nos Dois Temas

**Feature**: 002-dark-mode-visual-refresh | **Research**: [../research.md](../research.md)

Contrato entre o sistema de design e todo componente. Mudar um valor aqui
exige revalidar contraste e paleta antes de publicar.

## Regra que sustenta tudo

Todo token é nomeado pelo **papel** que exerce, nunca pela cor que tem. Cada
tema fornece seu próprio valor para o mesmo papel. Nenhum componente pode
perguntar "estou no escuro?" — ele pede `--color-ink` e recebe o certo.

Consequência prática: é **proibido** usar utilitários condicionais de tema
(`dark:bg-...`) nos componentes. A decisão vive num lugar só.

## Superfícies e texto

| Token | Papel | Claro | Escuro |
|-------|-------|-------|--------|
| `--color-paper` | fundo da página | `#FBF9F5` | `#121A18` |
| `--color-paper-raised` | cartão, diálogo | `#FFFFFF` | `#16211D` |
| `--color-paper-sunken` | trilho, campo, faixa | `#F3F0EA` | `#0E1614` |
| `--color-ink` | texto principal | `#16211D` | `#EDEAE3` |
| `--color-ink-soft` | texto secundário | `#5A6A64` | `#A8B3AD` |
| `--color-ink-faint` | rótulo de coluna | `#67736D` | `#8A968F` |
| `--color-rule` | fio de separação | `#DFDCD3` | `#293632` |
| `--color-rule-strong` | fio de previsto, borda de campo | `#C6C2B6` | `#3C4B46` |

Contraste exigido: `ink` ≥ 7:1, `ink-soft` e `ink-faint` ≥ 4,5:1 sobre
`paper` e sobre `paper-raised`, nos dois temas.

## Semânticas

| Token | Papel | Claro | Escuro |
|-------|-------|-------|--------|
| `--color-entrada` | dinheiro que entrou | `#1F6F5C` | `#4FA98F` |
| `--color-saida` | dinheiro que saiu | `#8C3B4A` | `#D98A97` |
| `--color-acao` | ação, foco, mês em ênfase | `#2F4B7C` | `#8FAEE0` |
| `--color-atencao` | atrasado, excedido | `#8A5F1C` | `#D9A85A` |

Cada uma tem um par `-wash` para fundo de aviso, sempre com contraste
suficiente para o texto que carrega.

**Regra**: a cor de ação nunca coincide com entrada ou saída — clicar não
pode parecer dinheiro.

## Paleta de categorias — validada, ordem fixa

| Slot | Matiz | Claro | Escuro |
|------|-------|-------|--------|
| 1 | azul-tinta | `#2C5FA8` | `#5B8FD9` |
| 2 | terracota | `#C4562A` | `#CF6A3E` |
| 3 | verde-jade | `#1B8A6B` | `#239B78` |
| 4 | ocre | `#B07C0A` | `#B08618` |
| 5 | ameixa | `#A8477E` | `#CE6EA3` |
| 6 | verde-oliva | `#4F7A1F` | `#6C9636` |
| 7 | violeta | `#5B46B5` | `#8E7BE0` |
| 8 | telha | `#C93F42` | `#D65B5D` |
| — | Outros | `--color-ink-faint` | `--color-ink-faint` |

Invariantes:

1. Slots são atribuídos **em ordem fixa e nunca ciclados**. Um nono matiz não
   é gerado — a cauda dobra em "Outros" (research R3).
2. Qualquer alteração nesta tabela **deve** ser revalidada antes de publicar:

   ```bash
   python3 <skill dataviz>/scripts/validate_palette.py \
     "#2C5FA8,#C4562A,#1B8A6B,#B07C0A,#A8477E,#4F7A1F,#5B46B5,#C93F42" \
     --mode light --surface "#FBF9F5"
   # e novamente com --mode dark --surface "#16211D" e os valores escuros
   ```

   As cinco checagens precisam passar. Cor escolhida a olho é como a paleta
   anterior chegou a ΔE 1,9 entre duas categorias.

   **Revalidar contra as duas superfícies de cada tema**, não só uma: o
   gráfico pode ficar sobre o fundo da página ou dentro de um cartão, que têm
   cores diferentes. A paleta atual já foi verificada nas quatro combinações
   (`#FBF9F5` e `#FFFFFF` no claro; `#121A18` e `#16211D` no escuro) e passa
   em todas.
3. Cor nunca é o único portador de identidade: toda fatia carrega rótulo
   direto ou entrada na lista textual (FR-013).

## Contrato dos gráficos

| Regra | Motivo |
|-------|--------|
| Nenhum eixo duplo | proibido pela skill `dataviz` — é o erro nº 1 de gráfico |
| Marcas finas, ponta arredondada em 4px ancorada na linha de base | especificação de marca da skill |
| Vão de 2px na cor da superfície entre segmentos vizinhos | separa sem borda |
| Grade e eixos recessivos, em `--color-rule` | o dado é o assunto |
| Texto sempre em tokens de tinta, nunca na cor da série | legibilidade nos dois temas |
| Previsto usa o mesmo matiz em peso leve + rótulo "previsto" | mantém a gramática do fio interrompido |
| Conteúdo largo rola dentro da própria área | não empurra a página em 375px |
| Movimento respeita `prefers-reduced-motion` | FR-020 |

## Tipografia e forma — inalteradas

Display Bricolage Grotesque, interface Archivo, valores IBM Plex Mono com
figuras tabulares. Raios: 4px controle, 8px cartão, 0 na linha de razão.
Esta feature não mexe nisso; a identidade se aprofunda pela cor, pelo peso e
pela composição.

## Atributo de tema

`<html data-theme="light|dark">`, escrito antes da primeira pintura por script
síncrono no `index.html` (research R5). Também alimenta `color-scheme`, para
que controles nativos e barras de rolagem acompanhem, e a meta `theme-color`
da barra do navegador (FR-021).
