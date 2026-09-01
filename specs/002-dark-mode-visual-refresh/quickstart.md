# Quickstart: Validação da feature 002 — Modo Escuro e Refinamento Visual

Guia de verificação. Tokens em [contracts/design-tokens.md](./contracts/design-tokens.md);
decisões em [research.md](./research.md).

## Pré-requisitos

O ambiente da feature 001 já resolvido: `npm install` feito e `.env.local`
preenchido. Esta feature não exige nada novo.

## Rodar

```bash
npm run dev          # http://localhost:5173
npm test             # inclui os testes novos de tema e série mensal
npm run build
```

## Verificação automática da paleta

Sempre que uma cor de categoria mudar, revalidar as duas versões. É o passo
que pegou o defeito da paleta anterior (ΔE 1,9 entre duas categorias).

```bash
SKILL=<caminho da skill dataviz>

python3 $SKILL/scripts/validate_palette.py \
  "#2C5FA8,#C4562A,#1B8A6B,#B07C0A,#A8477E,#4F7A1F,#5B46B5,#C93F42" \
  --mode light --surface "#FBF9F5"

python3 $SKILL/scripts/validate_palette.py \
  "#5B8FD9,#CF6A3E,#239B78,#B08618,#CE6EA3,#6C9636,#8E7BE0,#D65B5D" \
  --mode dark --surface "#16211D"
```

**Esperado**: `ALL CHECKS PASS` nas duas execuções.

## Validação manual

Percorrer **nos dois temas** e nas duas larguras (~375px e ~1280px).

### 1. Tema (US1)

1. Sistema no escuro, sem escolha prévia → o app abre escuro.
2. Recarregar várias vezes → **nenhuma piscada clara** antes do escuro
   (FR-008). Recarregue com o cache desabilitado para ver o pior caso.
3. Botão de tema → claro → escuro → sistema: a tela muda na hora, sem
   recarregar.
4. Escolher escuro, fechar o navegador, reabrir → continua escuro, mesmo com
   o sistema no claro.
5. Voltar para "sistema" e trocar o tema do aparelho com o app aberto → o app
   acompanha na hora.
6. Aba anônima → o app funciona e segue o sistema, sem erro.
7. Percorrer todas as telas no escuro: login, finanças, planner nas três
   visões, todos os diálogos, estados vazio e de erro. **Nenhuma área com
   cor vazada do tema claro.**

### 2. Visualizações (US2)

1. Mês com entradas e saídas → o medidor mostra a proporção; com saída maior
   que entrada, muda para o estado de excesso.
2. Mês com várias categorias → a dominante é identificável **em até 3
   segundos, sem ler números** (SC-004).
3. Mais de 6 categorias no mês → as excedentes aparecem agregadas em
   "Outros", em cinza.
4. Com 3 meses ou mais de histórico → a comparação aparece, e o mês atual se
   destaca dos anteriores.
5. Mês com previstos → o previsto é distinguível do efetivado sem depender só
   de cor.
6. Mês vazio → estado vazio convidativo, sem gráfico quebrado.
7. Mês com uma única categoria (100%) → a barra continua legível, com rótulo
   visível.
8. Um gasto muito maior que os demais → os pequenos continuam visíveis.

### 3. Acessibilidade e identidade (US3)

1. Simular daltonismo (DevTools → Rendering → Emulate vision deficiencies) em
   deuteranopia e protanopia → categorias vizinhas continuam distinguíveis.
2. Navegar só pelo teclado → o foco é visível em todos os controles, nos dois
   temas, inclusive no botão de tema.
3. `prefers-reduced-motion` ativado → nenhuma animação longa.
4. Conferir que **nenhuma tarefa ganhou passos**: registrar um gasto continua
   em no máximo 3 interações a partir da tela inicial (SC-006).
5. Comparar as telas entre si e os dois temas entre si: a identidade é a
   mesma, e o escuro não parece uma versão apagada do claro.

## Publicar

```bash
npm run build
npx firebase deploy --only hosting
```

Conferir no celular real, no tema escuro do sistema — é o caso de uso que
originou a feature.
