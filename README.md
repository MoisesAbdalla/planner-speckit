# Planner

Planner de rotina com gestor financeiro embutido. Registre gastos e ganhos,
veja para onde o dinheiro está indo no mês e organize a rotina em visões de
dia, semana e mês — no computador e no celular, com a mesma conta.

- Especificação: [specs/001-routine-finance-planner/spec.md](specs/001-routine-finance-planner/spec.md)
- Plano técnico: [specs/001-routine-finance-planner/plan.md](specs/001-routine-finance-planner/plan.md)
- Princípios do projeto: [.specify/memory/constitution.md](.specify/memory/constitution.md)

## Como rodar

Requisitos: Node.js 24 e uma conta no [Firebase](https://console.firebase.google.com).
Para os testes de regras, também Java 21 (o emulador do Firestore usa a JVM).

### 1. Criar o projeto no Firebase

No console do Firebase:

1. Crie um projeto.
2. Em **Authentication → Sign-in method**, habilite **E-mail/senha** e **Google**.
3. Em **Firestore Database**, crie o banco (modo de produção — as regras deste
   repositório cuidam do acesso).
4. Em **Configurações do projeto → Seus apps**, registre um app **Web** e copie
   a configuração do SDK.

### 2. Configurar as chaves

Crie um arquivo `.env.local` na raiz com os valores copiados. Ele não vai para
o Git.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Opcional: "true" usa os emuladores locais em vez do projeto real.
VITE_USE_FIREBASE_EMULATORS=false
```

Se alguma chave faltar, o app abre uma tela dizendo exatamente quais.

### 3. Instalar e subir

```bash
npm install
npm run dev          # http://localhost:5173
```

Para desenvolver sem tocar nos dados de produção:

```bash
npm run emulators    # Auth + Firestore locais
# e VITE_USE_FIREBASE_EMULATORS=true no .env.local
```

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Verificação de tipos + build de produção em `dist/` |
| `npm test` | Testes unitários (dinheiro, totais, recorrências) |
| `npm run test:rules` | Testes das Security Rules — sobe o emulador sozinho |
| `npm run test:all` | Os dois acima |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run emulators` | Emuladores do Firebase |

## Publicar

```bash
npm run build
npx firebase deploy --only firestore:rules,firestore:indexes
npx firebase deploy --only hosting
```

Publique as regras e os índices **antes** do primeiro acesso real: sem eles, o
Firestore recusa as consultas do app.

## Como o código está organizado

```text
src/
├── design/          # tokens e primitivos do sistema de design
├── features/
│   ├── auth/        # login, cadastro, sessão
│   ├── finance/     # movimentações, categorias, recorrências, resumo
│   └── planner/     # tarefas, recorrência de rotina, visões
├── routes/          # páginas
└── shared/          # dinheiro, datas, conexão, consultas em tempo real
```

Cada feature separa `lib/` (funções puras, testadas), `hooks/` (leitura em
tempo real do Firestore) e `components/` (interface).

## Temas

O app tem tema claro e escuro. Por padrão segue o tema do aparelho; o botão no
trilho lateral (ou no cabeçalho, no celular) percorre Sistema → Claro →
Escuro, e a escolha fica lembrada naquele aparelho.

Ao mexer em qualquer cor de categoria, **revalide antes de publicar**:

```bash
npm run validate:palette
```

Precisa sair `ALL CHECKS PASS` nos dois modos. A paleta original deste projeto
foi escolhida a olho e tinha ΔE 1,9 entre duas categorias — praticamente a
mesma cor para quem tem deuteranopia. Não dá para avaliar isso no olho.

Duas armadilhas registradas em
[contracts/design-tokens.md](specs/002-dark-mode-visual-refresh/contracts/design-tokens.md):
as cores de categoria ficam fora do bloco `@theme` (senão o Tailwind as
descarta), e utilitários condicionais de tema (`dark:`) são proibidos nos
componentes — a decisão de tema vive só na camada de tokens.

## Metas de orçamento

Defina um teto para o mês e metas por categoria pelo botão **Metas**, na tela
de finanças. O app avisa a partir de 80% do limite e destaca quando passa.

**A meta é uma linha do tempo, não um número.** Ela guarda o histórico dos
valores com o mês em que cada um passou a valer, mais exceções de meses
atípicos. Por isso mudar a meta hoje **não** altera como um mês passado foi
avaliado — cada mês encontra o valor que valia à época. Se você mexer nessa
lógica, o teste em `tests/unit/goals.test.ts` marcado como *o teste central da
feature* é o que impede a regressão.

Dois estados que nunca podem se confundir: **sem meta** (não há limite) e
**meta zero** (o limite é zero, e qualquer gasto já passa).

O valor não negativo é validado pelo app, não pelas regras do Firestore — elas
não iteram listas, e achatar a estrutura para permitir isso custaria o
histórico por mês.

## Decisões que valem saber

**Dinheiro é inteiro em centavos.** Nenhum valor passa por ponto flutuante:
a conversão do que a pessoa digita é feita sobre a string, dígito a dígito
(`src/shared/money.ts`).

**Datas de calendário são strings `YYYY-MM-DD`.** Um gasto do "dia 5" precisa
ser dia 5 em qualquer fuso; `Timestamp` traria bugs de virada de dia.

**Totais são sempre derivados das movimentações.** `monthStats` existe só como
cache do saldo acumulado e pode ser refeito a qualquer momento com
`rebuildMonthStats` — por isso ele nunca é a única fonte de verdade.

**Recorrências financeiras viram lançamentos previstos com id determinístico.**
Dois aparelhos abrindo o mesmo mês convergem para um documento só, em vez de
duplicarem o aluguel. Não há Cloud Functions.

A chave do id identifica o que torna a ocorrência única naquela frequência:

| Frequência | Cadastro | Chave do lançamento | Alcance |
| --- | --- | --- | --- |
| Semanal | dia da semana | `rec_{id}_{AAAA-MM-DD}` | 3 meses |
| Mensal | dia do mês | `rec_{id}_{AAAA-MM}` | 3 meses |
| Anual | dia e mês | `rec_{id}_{AAAA-MM}` | 12 meses |

A semanal precisa da data porque tem quatro ou cinco ocorrências no mesmo mês;
a chave por mês colapsaria todas num documento só. A anual alcança um ano
porque saber cedo de uma despesa grande é o valor inteiro dela — mas prepara
**apenas o mês em que cai**, não os doze.

**Ausência de `frequency` significa mensal.** Toda recorrência gravada antes
dessa distinção existir continua valendo, com as mesmas datas e as mesmas
chaves. Um único ponto do código lê o campo (`resolveFrequency`, em
`lib/recurrenceRules.ts`); espalhar essa leitura garantiria que um dos lugares
esqueceria o padrão e duplicaria o que já está gravado.

**A consulta de recorrências não usa `orderBy`.** O Firestore omite do
resultado todo documento que não tem o campo ordenado — ordenar por
`dayOfMonth` tornava a recorrência semanal invisível, cadastrada com sucesso e
nunca exibida. A ordenação é feita em memória.

**Excluir um previsto registra o descarte na recorrência** (campo `skips`).
Sem isso, a geração não encontraria o documento apagado e o recriaria na
próxima vez que o mês fosse preparado.

**Recorrências de rotina não são gravadas dia a dia.** A série é expandida em
memória e só vira documento quando você mexe naquele dia (concluir, editar,
excluir) — do contrário, um hábito diário criaria milhares de registros.

**Os agregados usam `increment()` do Firestore.** Ler-somar-gravar perderia uma
confirmação quando dois aparelhos gravam ao mesmo tempo.
