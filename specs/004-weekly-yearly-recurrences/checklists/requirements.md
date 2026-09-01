# Specification Quality Checklist: Recorrências Semanais e Anuais

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-01
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

- As duas respostas de clarificação (semanal + anual; horizonte de um ano)
  entraram antes da redação, então nenhum marcador restou.
- **O maior risco desta spec é a regressão.** Esta é a primeira feature que
  mexe numa capacidade que já está em produção e em uso: as recorrências
  mensais. FR-016 e SC-005 tornam isso explícito e testável — as mensais
  existentes têm de continuar gerando os mesmos lançamentos, sem ação do
  usuário e sem perda de histórico.
- **Segundo risco: duplicação.** A garantia de não duplicar entre aparelhos
  hoje vale para uma ocorrência por mês. Com a semanal, um mês passa a ter
  quatro ou cinco ocorrências da mesma recorrência, o que multiplica as
  chances de a garantia falhar. FR-011 e SC-004 cobrem todas as frequências,
  não só a nova.
- **Terceiro risco: o horizonte deixa de ser um número só.** FR-009 exige um
  ano para a anual enquanto as demais seguem curtas. É uma assimetria
  deliberada, e está declarada como entidade para não parecer descuido.
- O caso de 29 de fevereiro aparece tanto em Edge Cases quanto em FR-010 e
  SC-006 de propósito: é o caso-limite mais fácil de esquecer e o mais fácil
  de testar.
- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`
