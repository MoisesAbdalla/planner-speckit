# Implementation Plan: Assistente de Frase e Voz no Planner

**Branch**: `006-planner-assistant` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-planner-assistant/spec.md`

## Summary

O assistente passa a produzir **duas leituras** de cada frase — lançamento e
tarefa — e a dizer, embaixo do campo e enquanto a pessoa escreve, qual delas
escolheu. Confirmar abre o formulário correspondente, já preenchido: o de
lançamento, como hoje, ou o de tarefa, que agora também recebe rascunho.

A decisão que organiza o resto: **`parsePhrase` não muda.** A leitura nova
envolve a que existe em vez de alterá-la, e por isso "o financeiro continua
igual" deixa de ser um teste que a gente torce para passar e vira uma
propriedade da estrutura — o caminho financeiro chama literalmente a mesma
função de antes.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), React 19

**Primary Dependencies**: nenhuma nova

**Storage**: Firestore, sem coleção nova, sem campo novo, sem regra nova. As
tarefas são gravadas pelo caminho que já existe

**Testing**: Vitest — projeto `unit` para as leituras (puras, sem Firebase)

**Target Platform**: web responsiva; voz onde o navegador oferece

**Project Type**: aplicação web de página única

**Performance Goals**: interpretação a cada tecla, sem espera perceptível —
é aritmética sobre uma frase de até 140 caracteres

**Constraints**: nenhum serviço externo; o caminho financeiro do assistente
não pode mudar em nada; os formulários abertos à mão não podem mudar em nada

**Scale/Scope**: frases de até ~140 caracteres; duas leituras por frase

## Constitution Check

*GATE: avaliado antes da Phase 0 e reavaliado após a Phase 1.*

| Princípio | Situação | Como é atendido |
|---|---|---|
| **I. Experiência intuitiva** | ✅ Passa | A leitura ao vivo e a troca são desenhadas com a skill `frontend-design` **antes** de implementadas. Continuam 3 interações de qualquer tela |
| **II. Firebase como backend único** | ✅ Passa | Nenhum backend, coleção, campo ou regra novos. A tarefa é gravada pelo caminho existente |
| **III. Multi-dispositivo** | ✅ Passa | A leitura ao vivo ocupa uma linha; precisa caber em ~375px sem empurrar o campo. Verificação obrigatória nas duas larguras e nos dois temas |
| **IV. Integridade financeira** | ✅ Passa | `parsePhrase` intocada; o conjunto de 45 frases roda sem alteração; nenhum valor é inventado |
| **V. Simplicidade** | ✅ Passa | Zero dependências; os dois formulários são reaproveitados; a ponte do assistente já existe e só ganha um segundo tipo de rascunho |

## Project Structure

### Documentation (this feature)

```text
specs/006-planner-assistant/
├── plan.md
├── research.md          # R1 a R8
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── phrase-reading.md    # As duas leituras e a decisão
│   └── task-handoff.md      # Assistente → formulário de tarefa
├── checklists/requirements.md
└── tasks.md             # Criado pelo /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── finance/
│   │   ├── assistantTypes.ts          # ALTERADO: acrescenta PhraseReading e ParsedTask
│   │   ├── AssistantContext.tsx       # ALTERADO: o rascunho pendente ganha dois tipos
│   │   ├── components/
│   │   │   └── AssistantPanel.tsx     # ALTERADO: leitura ao vivo, troca, rota do rascunho
│   │   └── lib/
│   │       ├── phraseParser.ts        # **INTOCADO** — é isso que protege o SC-005
│   │       ├── phraseReading.ts       # NOVO — decide o lado e envolve as duas leituras
│   │       ├── taskParser.ts          # NOVO — título, data e hora da tarefa
│   │       ├── phraseTime.ts          # NOVO — hora do dia, com marca obrigatória
│   │       └── reminderWords.ts       # NOVO — as marcas de lembrete
│   └── planner/
│       └── components/TaskForm.tsx    # ALTERADO: prop de rascunho, como o TransactionForm
└── routes/
    ├── Finance.tsx                    # ALTERADO: consome só o rascunho de lançamento
    └── Planner.tsx                    # ALTERADO: consome o de tarefa, move o dia ao salvar

tests/unit/
├── fixtures/
│   ├── phrases.ts                     # **INTOCADO** — as 45 frases do financeiro
│   ├── tasks.ts                       # NOVO — 30+ frases de tarefa (SC-002)
│   └── readings.ts                    # NOVO — 20+ frases rotuladas (SC-003)
├── phraseTime.test.ts                 # NOVO
├── taskParser.test.ts                 # NOVO
├── phraseReading.test.ts              # NOVO
├── phraseReading.regression.test.ts   # NOVO — as 45 frases, lado a lado com parsePhrase
└── taskForm.regression.test.tsx       # NOVO — o formulário de tarefa aberto à mão
```

**Structure Decision**: os módulos novos ficam em `features/finance/lib/`
junto do interpretador que eles envolvem, e não em `features/planner/`, porque
a decisão entre os dois lados é **uma coisa só** — parti-la entre duas pastas
faria a regra do R2 morar em duas casas. O `taskParser` produz um rascunho que
o planner consome, o que é a mesma direção em que `plannedDraft` já produz
lançamentos para o financeiro.

## Fases de entrega

1. **Hora e tarefa (US1 + US3, núcleo)** — `phraseTime`, `taskParser`,
   `reminderWords` e as fixtures, com testes. Nenhuma UI.
2. **A decisão (US1 + US2, núcleo)** — `phraseReading`, o conjunto rotulado, e
   **o teste de regressão das 45 frases**, que é a rede de segurança das
   outras fases.
3. **O caminho até o formulário de tarefa (US1, UI)** — rascunho de dois
   tipos no contexto, `TaskForm` recebendo rascunho, `Planner.tsx` consumindo
   e movendo o dia.
4. **A leitura ao vivo e a troca (US2, UI)** — a linha embaixo do campo, a
   distinção entre confiante e ambígua, e a troca.
5. **Regressão e acabamento** — provar que os dois formulários abertos à mão
   não mudaram, verificar nos dois temas e nas duas larguras, README.

**A ordem interna importa**: a fase 2 termina com o teste de regressão, e ele
precisa estar verde **antes** de qualquer pixel da fase 3. É ele que responde
se o assistente que você já usa continua o mesmo.

## Complexity Tracking

> Preenchido apenas se o Constitution Check tiver violações.

Nenhuma violação. A peça que poderia parecer excesso foi medida:

| Peça | Por que não é excesso |
|---|---|
| `PhraseReading` envolvendo `ParsedPhrase` em vez de estendê-lo | Estender mexeria no tipo que o financeiro em produção usa. Envolver custa um tipo a mais e transforma a garantia de não-regressão em propriedade estrutural, em vez de deixá-la dependendo da cobertura dos testes |
