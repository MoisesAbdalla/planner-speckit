# Implementation Plan: Assistente de Lançamento por Frase e por Voz

**Branch**: `005-quick-entry-assistant` | **Date**: 2026-09-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-quick-entry-assistant/spec.md`

## Summary

Um botão presente em todas as telas abre um painel com um campo de texto e,
onde o navegador permitir, um microfone. A frase escrita ou transcrita é lida
por um interpretador **puro**, dentro do próprio app, que produz um rascunho
de lançamento — valor, tipo, categoria, data e descrição — deixando **vazio**
tudo que não reconheceu. O rascunho é entregue ao formulário de lançamento que
já existe, onde a pessoa confere e salva.

A decisão que organiza o resto: **o assistente não grava nada**. Ele produz
dados; quem grava continua sendo o formulário. Com isso, "grava igual ao
manual" não é um comportamento a manter em dia, é o único caminho que existe.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19

**Primary Dependencies**: nenhuma nova. Web Speech API é do navegador;
`react-router` 7, Tailwind 4 e Firebase 12 já estão no projeto

**Storage**: Firestore, sem coleção nova e sem campo novo. O histórico usado
para sugerir categoria é **leitura** de `users/{uid}/transactions`

**Testing**: Vitest — projeto `unit` para o interpretador (puro, sem Firebase)

**Target Platform**: web responsiva; voz onde o navegador oferece
(Chrome, Edge, Safari 14.1+), texto em todos

**Project Type**: aplicação web de página única, código único para PC e celular

**Performance Goals**: interpretação perceptivelmente instantânea (é
computação local sobre uma frase); uma única leitura do Firestore por sessão
para o histórico

**Constraints**: nenhum serviço externo, nenhuma credencial de terceiros, HTTPS
(exigido pela Web Speech API e já em uso); o caminho manual não pode mudar

**Scale/Scope**: um usuário por conta; frases de até ~120 caracteres; histórico
de 3 meses em memória

## Constitution Check

*GATE: avaliado antes da Phase 0 e reavaliado após a Phase 1.*

| Princípio | Situação | Como é atendido |
|---|---|---|
| **I. Experiência intuitiva** | ✅ Passa | Botão e painel desenhados com a skill `frontend-design` antes de implementados. O caminho fica em 3 interações a partir de **qualquer** tela, dentro do limite do princípio |
| **II. Firebase como backend único** | ✅ Passa | Nenhum backend novo, nenhuma coleção nova, nenhuma credencial. Ver observação abaixo |
| **III. Multi-dispositivo** | ✅ Passa | A voz importa mais no celular e é lá que tem melhor suporte; onde não houver, o texto responde por tudo (FR-022). Verificação obrigatória em ~375px e ~1280px |
| **IV. Integridade financeira** | ✅ Passa | Centavos pelo `parseAmountToCents` existente; caminho de gravação único; interpretador coberto por testes, incluindo o critério absoluto do SC-003 |
| **V. Simplicidade** | ✅ Passa | Zero dependências novas; o formulário é reaproveitado em vez de duplicado; o contexto do rascunho é a menor peça que resolve o problema do R7 |

**Observação sobre o Princípio II, dita por escrito porque é fácil de
esconder**: o reconhecimento de voz é do navegador, e no Chrome o áudio
trafega até os servidores do Google para virar texto. Não é backend do
projeto, não guarda dado do usuário e não recebe nada do Firestore — mas
chamar a feature de "totalmente local" seria falso. A interface não deve
prometer isso, e a spec já registra o fato.

## Project Structure

### Documentation (this feature)

```text
specs/005-quick-entry-assistant/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — R1 a R10
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   ├── phrase-parser.md     # O contrato do interpretador
│   └── assistant-handoff.md # Assistente → formulário → gravação
├── checklists/
│   └── requirements.md
└── tasks.md             # Criado pelo /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── dates.ts                       # (existente) reuso de datas
├── design/components/
│   └── AppShell.tsx                   # ALTERADO: hospeda o botão do assistente
├── features/finance/
│   ├── assistantTypes.ts              # NOVO — ParsedPhrase, ParseContext, PendingDraft
│   ├── lib/
│   │   ├── textNormalize.ts           # NOVO — a normalização única da feature
│   │   ├── formCategory.ts            # NOVO — escolha de categoria, pura e testável
│   │   ├── phraseParser.ts            # NOVO — interpretador puro, sem Firebase
│   │   ├── numberWords.ts             # NOVO — números por extenso (pt-BR)
│   │   ├── phraseDates.ts             # NOVO — datas em linguagem comum
│   │   └── categoryHints.ts           # NOVO — dicionário e casamento de categoria
│   ├── hooks/
│   │   └── useDescriptionHistory.ts   # NOVO — leitura única dos 3 meses
│   ├── components/
│   │   ├── AssistantPanel.tsx         # NOVO — campo, microfone, estados
│   │   ├── AssistantButton.tsx        # NOVO — o botão presente em toda tela
│   │   └── TransactionForm.tsx        # ALTERADO: prop de categoria sem pré-seleção
│   └── AssistantContext.tsx           # NOVO — o rascunho pendente (R7)
├── shared/
│   └── useSpeechRecognition.ts        # NOVO — Web Speech API encapsulada
├── types/
│   └── speech-recognition.d.ts        # NOVO — tipos que o TypeScript não traz
├── routes/
│   └── Finance.tsx                    # ALTERADO: consome o rascunho, ajusta o mês
└── App.tsx                            # ALTERADO: monta o AssistantProvider

tests/unit/
├── fixtures/phrases.ts                # NOVO — as 40+ frases do SC-002/SC-003
├── phraseParser.metrics.test.ts       # NOVO — o portão do SC-002 e do SC-003
├── phraseParser.test.ts               # NOVO
├── numberWords.test.ts                # NOVO
├── phraseDates.test.ts                # NOVO
├── textNormalize.test.ts              # NOVO
├── formCategory.test.ts               # NOVO
├── categoryHints.test.ts              # NOVO
├── categoryHistory.test.ts            # NOVO
└── transactionForm.regression.test.tsx # NOVO — 1º teste de componente do projeto
```

**Structure Decision**: a estrutura existente do projeto é mantida. O
interpretador vive em `features/finance/lib/` porque é lógica de domínio
financeiro, e é **puro** — sem importar Firebase — pela mesma razão que
`recurrenceRules.ts` é: testes que importam Firebase quebram sem variáveis de
ambiente. `useSpeechRecognition` fica em `shared/` porque é capacidade do
navegador, não do financeiro, e o planner pode querer usá-la depois.

## Fases de entrega

Cada fase é uma fatia vertical utilizável, na ordem das prioridades da spec.

1. **Interpretador (US1, núcleo)** — `phraseParser` e seus três auxiliares,
   com as fixtures e os testes. Nenhuma UI. Ao fim desta fase, o SC-002 e o
   SC-003 já são mensuráveis.
2. **Caminho até o formulário (US1, UI)** — contexto do rascunho, painel,
   botão, a prop de categoria vazia e o ajuste de mês. Ao fim, lançar por
   frase escrita funciona de ponta a ponta.
3. **Voz (US2)** — `useSpeechRecognition`, microfone no painel, estados de
   escuta e as mensagens de erro por nome.
4. **Histórico (US3)** — `useDescriptionHistory` e a segunda tentativa de
   categoria.
5. **Regressão e acabamento** — provar que o caminho manual não mudou,
   verificar nos dois temas e nas duas larguras, README.

## Complexity Tracking

> Preenchido apenas se o Constitution Check tiver violações.

Nenhuma violação a justificar. As duas peças que poderiam parecer excesso
foram medidas contra a alternativa:

| Peça | Por que não é excesso |
|---|---|
| `AssistantContext` | O botão vive fora das rotas e o formulário dentro. Sem ele, ou o formulário é duplicado, ou mês e formulário sobem para um contexto global — as duas alternativas mexem em muito mais código |
| Prop de categoria sem pré-seleção | O formulário hoje sempre escolhe a primeira categoria. Sem a prop, o FR-008 ("nunca chuta") seria falso justamente no campo que decide onde o dinheiro aparece nos gráficos |
