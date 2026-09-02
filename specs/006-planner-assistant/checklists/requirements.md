# Specification Quality Checklist: Assistente de Frase e Voz no Planner

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-02
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Três metas com forças diferentes, de propósito.** SC-002 (data e hora)
  pede 90%; SC-003 (gasto ou tarefa) pede 85%, porque a decisão é
  genuinamente ambígua em parte das frases e o SC-007 dá à pessoa a correção
  em um toque; SC-004 (nunca inventa hora nem valor) é **absoluto**. Errar a
  leitura custa um toque; inventar uma hora coloca um compromisso falso na
  agenda, e inventar um valor corrompe o saldo.

- **SC-005 é o critério de regressão e o mais importante desta feature.** O
  assistente financeiro está em produção e funciona; o conjunto de 45 frases
  que já existe é a prova de que ele continua igual. Ele deve ser executado
  sem alteração — mudar uma expectativa dele para acomodar o planner seria
  esconder a regressão em vez de detectá-la.

- **SC-003 precisa de um conjunto rotulado que ainda não existe**, com frases
  claramente de gasto, claramente de tarefa e deliberadamente ambíguas. Sem as
  ambíguas, a meta mede o caso fácil e não diz nada sobre o comportamento que
  o FR-005 exige.

- **A regra do FR-004 é a que separa as duas leituras na prática.** "paguei 15
  no lanche" e "reunião às 15h" contêm o mesmo número; é a marca de hora que
  decide. Qualquer teste de aceitação precisa conter esse par.
