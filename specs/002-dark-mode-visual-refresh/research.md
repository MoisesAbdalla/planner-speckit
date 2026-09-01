# Research: Modo Escuro e Refinamento Visual

**Date**: 2026-08-29 | **Plan**: [plan.md](./plan.md)

Nenhum NEEDS CLARIFICATION restou. Este documento registra as decisões e, no
caso das cores, o que a verificação por cálculo revelou.

## R1. A paleta de categorias atual está quebrada — descoberto por medição

- **Decision**: substituir as 8 cores de categoria por uma paleta validada,
  com versões próprias para claro e escuro.
- **Rationale**: a paleta em produção foi escolhida a olho e **falha em 4 das
  5 checagens** do validador da skill `dataviz`:

  | Checagem | Resultado atual |
  |----------|-----------------|
  | Banda de luminosidade | FALHA — `#2F4B7C` fora da banda |
  | Piso de croma | FALHA — 7 das 8 cores leem como cinza |
  | Separação para daltonismo | FALHA — `#31687A`↔`#6B4E71` ΔE **1,9** (deutan) |
  | Piso de visão normal | FALHA — o mesmo par, ΔE **10,1** (piso é 15) |
  | Contraste com a superfície | passa |

  Ou seja: hoje "Transporte" e "Lazer" são praticamente a mesma cor para quem
  tem daltonismo deuteranópico — e difíceis de separar mesmo com visão
  plena. Isso é um defeito de acessibilidade real, e nenhuma inspeção visual
  minha teria apontado ΔE 1,9.

- **Paleta escolhida** (ordem fixa de slots, nunca ciclada):

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

  Ambos passam nas cinco checagens (`--mode light --surface #FBF9F5` e
  `--mode dark --surface #16211D`): pior par adjacente com ΔE 8,9/9,3 para
  daltonismo e 17,5/16,2 para visão normal, e todas as cores acima de 3:1 de
  contraste.

- **Alternatives considered**:
  - *Manter a paleta atual*: descartada — falha em acessibilidade, e o FR-015
    exige o contrário.
  - *Usar a paleta de referência da skill*: passa em tudo, mas é clara e
    genérica (azul/laranja/amarelo de painel administrativo) — exatamente o
    "cara de template" que a feature existe para combater.
  - *Manter os tons terrosos e dessaturados da Caderneta*: reprovado no piso
    de croma — cor dessaturada demais lê como cinza e deixa de identificar.
    A saída foi separar os papéis: a moldura do app continua discreta
    (tinta, papel, fios) e a **cor saturada fica reservada aos dados**.

## R2. Formas escolhidas pelo trabalho que o dado precisa fazer

A skill `dataviz` manda escolher a forma **antes** da cor. Três escolhas
saíram diferentes do que eu faria por hábito:

- **Entrou × saiu → medidor, não gráfico de pizza.** O dado é "uma razão
  contra um limite" (quanto do que entrou já saiu). A tabela de formas marca
  explicitamente que uma pizza de duas fatias é o erro aqui. O medidor ainda
  permite estender a barra com o previsto, que é o que a pessoa precisa saber
  para não gastar o que ainda vai sair.
- **Categorias → barras horizontais ordenadas, não rosca.** Nomes longos
  ("Alimentação", "Transporte") pedem barra horizontal, e a ordenação
  decrescente entrega a dominante de relance (SC-004) sem ler número. A rosca
  obrigaria comparar ângulos.
- **Comparação entre meses → ênfase, não série categórica.** O mês atual é o
  assunto; os anteriores são contexto. A skill chama ênfase de "a forma mais
  subutilizada": o mês atual na cor de ação, os demais em cinza. Pintar cada
  mês de uma cor enterraria justamente o dado que importa.

- **Alternatives considered**: pizza/rosca para categorias (descartada pelas
  razões acima); linha para a série mensal (com ~6 meses discretos, colunas
  comparam melhor do que uma linha, e o mês é um balde, não um contínuo).

## R3. Teto de séries: 6 categorias + "Outros"

- **Decision**: mostrar no máximo 6 categorias nominais e agregar o restante
  em "Outros".
- **Rationale**: a escada de séries da skill trata 7–8 como teto do token e
  proíbe gerar um nono matiz — uma cor gerada é indistinguível de outra sob
  daltonismo. Como o usuário pode criar categorias à vontade, o app precisa
  de uma regra própria de dobra. Seis mantém folga e cabe em 375px.
- **Alternatives considered**: usar as 8 e cortar na nona (frágil: o usuário
  chega a 9 rápido); rolagem infinita de categorias (enterra a dominante).

## R4. Gráficos em SVG e CSS, sem biblioteca

- **Decision**: construir medidor, barras e colunas com SVG inline e CSS,
  sem Recharts, Chart.js ou D3.
- **Rationale**: são três formas simples, estáticas, sem eixos complexos nem
  escalas temporais. Uma biblioteca custaria de 50 a 150 kB comprimidos e um
  segundo sistema de temas para manter em sincronia com os tokens — contra o
  Princípio V (nada de camadas sem necessidade demonstrada). Em SVG, os
  gráficos herdam as custom properties e trocam de tema junto com o resto,
  de graça.
- **Alternatives considered**: *Recharts* (o padrão em React; rejeitado pelo
  peso e por trazer o próprio conceito de tema); *biblioteca só quando
  precisar de interação rica* — se um dia entrar zoom ou séries longas, a
  decisão pode ser revista com necessidade real.

## R5. Tema aplicado antes da primeira pintura

- **Decision**: um script curto e síncrono no `index.html`, antes do bundle,
  lê a preferência e escreve `data-theme` no `<html>`. O React assume depois.
- **Rationale**: o FR-008 proíbe piscada de tema errado. Qualquer decisão
  tomada dentro do React acontece depois da primeira pintura — o usuário veria
  um quadro branco antes do escuro. É a razão pela qual todo app com tema
  escuro usa esse script; não é otimização prematura, é o único ponto em que
  a decisão cabe.
- **Alternatives considered**: decidir só no React (produz a piscada);
  `color-scheme` do CSS sozinho (não cobre a escolha manual persistida).

## R6. Preferência de tema por aparelho

- **Decision**: `localStorage`, com três valores — `light`, `dark` e ausência
  de valor significando "seguir o sistema".
- **Rationale**: é o que a pessoa espera (claro no PC de dia, escuro no
  celular à noite) e não gasta escrita no Firestore para um dado de
  apresentação. Leitura e escrita protegidas por `try/catch`: aba anônima e
  armazenamento bloqueado não podem quebrar o app (FR-007).
- **Alternatives considered**: gravar na conta e sincronizar — cria conflito
  entre aparelhos e transforma uma preferência local em dado de negócio.

## R7. Os dois temas saem dos mesmos conceitos

- **Decision**: os tokens são nomeados por papel (`--color-ink`,
  `--color-paper`, `--color-rule`, `--color-entrada`, …) e cada tema fornece
  seu próprio valor para o mesmo papel. Nenhum componente conhece "claro" ou
  "escuro".
- **Rationale**: o FR-017 exige que uma cor nova apareça certa nos dois temas.
  Com tokens por papel, um componente escrito hoje continua correto quando o
  tema escuro for ajustado amanhã. É também o que a skill `dataviz` chama de
  tema escuro *escolhido*, e não um espelho automático do claro — as cores do
  escuro foram medidas contra a superfície escura, não invertidas.
- **Alternatives considered**: classes utilitárias `dark:` espalhadas pelos
  componentes (dobra a decisão em cada arquivo e garante esquecimentos);
  filtro de inversão (destrói as semânticas de entrada e saída).
