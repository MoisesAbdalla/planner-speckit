# Quickstart: Validação da feature 003 — Metas de Orçamento

Guia de verificação. Modelo em [data-model.md](./data-model.md); contrato em
[contracts/firestore-goals.md](./contracts/firestore-goals.md).

## Pré-requisitos

Ambiente das features anteriores já resolvido. Esta feature não exige nada
novo além de publicar as regras atualizadas.

```bash
npm install
npm run dev
npx firebase deploy --only firestore:rules   # a subcoleção nova precisa disso
```

Sem publicar as regras, o Firestore recusa toda escrita de meta.

## Testes automatizados

```bash
npm test                  # inclui meta vigente, consumo e faixas
npm run test:rules        # inclui isolamento e formato da nova subcoleção
npm run test:integration
```

**Esperado**: tudo verde. Os testes de meta provam o ponto central da
feature: **alterar o padrão não muda meses passados**.

## Validação manual

Percorrer nos dois temas e nas duas larguras (~375px e ~1280px).

### 1. Teto do mês (US1)

1. Sem nenhuma meta → o resumo fica **idêntico ao de antes**, sem espaço
   vazio nem convite (SC-008).
2. Definir um teto a partir da tela de finanças em no máximo 3 interações
   (SC-003).
3. Gastar menos de 80% → vê quanto foi e quanto sobra, sem alerta.
4. Passar de 80% → sinal de aproximação, com texto dizendo isso.
5. Passar de 100% → destaque de excesso, informando **em quanto** passou.
6. Com lançamentos previstos no mês → dá para distinguir o que já saiu do que
   ainda vai sair (FR-015).

### 2. Metas por categoria (US2)

1. Definir meta em duas categorias, deixando outras sem.
2. As categorias sem meta continuam normais, **sem alerta e sem aparência de
   pendência** (FR-016).
3. Estourar uma delas → identificável de relance, sem comparar números
   (SC-002).
4. Somar metas acima do teto geral → o app avisa, mas **deixa salvar**
   (FR-009).
5. Arquivar uma categoria com meta → para de ser cobrada; o histórico
   continua íntegro (FR-021).

### 3. Mês atípico (US3)

1. Definir uma meta padrão e ajustá-la só no mês corrente.
2. Navegar para o mês seguinte → **valor padrão de volta** (SC-005).
3. No mês ajustado, perceber que aquele valor é excepcional.
4. Desfazer o ajuste → o mês volta ao padrão.
5. **O teste que importa**: alterar o valor padrão e navegar para um mês
   passado → ele mantém o valor que valia à época (SC-006, FR-008). Se um mês
   passado mudar de avaliação, a feature está errada.

### 4. Não regredir o que existe

1. Registrar um gasto continua com o mesmo número de interações (SC-004).
2. Simular deuteranopia no DevTools → os três estados continuam
   distinguíveis, porque a marca de limite é posicional (SC-007).
3. Ver em escala de cinza → mesma conclusão.

## Publicar

```bash
npm run build
npx firebase deploy --only firestore:rules
npx firebase deploy --only hosting
```

Publique as regras **antes** do hosting: a versão nova do app escreve numa
subcoleção que as regras antigas recusam.
