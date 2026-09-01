import { describe, it, expect } from 'vitest';
import {
  resolveGoal,
  hasMonthOverride,
  goalState,
  goalConsumption,
  sumCategoryGoals,
  NEAR_THRESHOLD,
} from '../../src/features/finance/lib/goals';
import type { BudgetGoal } from '../../src/features/finance/types';

function goal(partial: Partial<BudgetGoal> = {}): BudgetGoal {
  return {
    id: 'overall',
    target: 'overall',
    categoryId: null,
    versions: [{ from: '2026-01', amountCents: 400000 }],
    overrides: {},
    ...partial,
  };
}

describe('resolveGoal — a regra temporal', () => {
  it('devolve o valor da versão vigente no mês', () => {
    expect(resolveGoal(goal(), '2026-03')).toBe(400000);
  });

  it('não vale antes do mês de início', () => {
    expect(resolveGoal(goal(), '2025-12')).toBeNull();
  });

  it('vale a partir do mês de início, inclusive', () => {
    expect(resolveGoal(goal(), '2026-01')).toBe(400000);
  });

  /**
   * O TESTE CENTRAL DA FEATURE.
   *
   * Se este falhar, mudar a meta hoje reescreve como um mês passado foi
   * avaliado — meses que fecharam dentro do orçamento passariam a aparecer
   * estourados retroativamente.
   */
  it('acrescentar uma versão nova NÃO altera meses anteriores (FR-008, SC-006)', () => {
    const antes = goal();
    expect(resolveGoal(antes, '2026-03')).toBe(400000);

    const depois = goal({
      versions: [
        { from: '2026-01', amountCents: 400000 },
        { from: '2026-09', amountCents: 500000 },
      ],
    });

    expect(resolveGoal(depois, '2026-03')).toBe(400000); // passado intacto
    expect(resolveGoal(depois, '2026-08')).toBe(400000); // véspera da mudança
    expect(resolveGoal(depois, '2026-09')).toBe(500000); // mês da mudança
    expect(resolveGoal(depois, '2027-02')).toBe(500000); // dali em diante
  });

  it('com várias versões, vale sempre a mais recente já em vigor', () => {
    const g = goal({
      versions: [
        { from: '2026-01', amountCents: 100 },
        { from: '2026-05', amountCents: 200 },
        { from: '2026-09', amountCents: 300 },
      ],
    });
    expect(resolveGoal(g, '2026-04')).toBe(100);
    expect(resolveGoal(g, '2026-05')).toBe(200);
    expect(resolveGoal(g, '2026-08')).toBe(200);
    expect(resolveGoal(g, '2026-12')).toBe(300);
  });

  it('a exceção do mês ganha do padrão (FR-004)', () => {
    const g = goal({ overrides: { '2026-12': 900000 } });
    expect(resolveGoal(g, '2026-12')).toBe(900000);
    expect(resolveGoal(g, '2026-11')).toBe(400000);
    expect(resolveGoal(g, '2027-01')).toBe(400000);
  });

  it('a exceção pertence ao mês, mesmo que criada com antecedência', () => {
    const g = goal({ overrides: { '2027-07': 800000 } });
    expect(resolveGoal(g, '2027-07')).toBe(800000);
  });

  it('desfazer a exceção devolve o mês ao padrão (FR-005)', () => {
    const ajustado = goal({ overrides: { '2026-12': 900000 } });
    const desfeito = goal({ overrides: {} });
    expect(resolveGoal(ajustado, '2026-12')).toBe(900000);
    expect(resolveGoal(desfeito, '2026-12')).toBe(400000);
  });

  it('exceção de valor zero é respeitada — zero não é ausência', () => {
    const g = goal({ overrides: { '2026-12': 0 } });
    expect(resolveGoal(g, '2026-12')).toBe(0);
  });

  it('sem meta alguma devolve null, que é diferente de meta zero', () => {
    expect(resolveGoal(undefined, '2026-03')).toBeNull();
    expect(resolveGoal(goal({ versions: [] }), '2026-03')).toBeNull();
    expect(resolveGoal(goal({ versions: [{ from: '2026-01', amountCents: 0 }] }), '2026-03')).toBe(0);
  });
});

describe('hasMonthOverride', () => {
  it('reconhece o mês ajustado, para a interface poder dizer que é excepcional', () => {
    const g = goal({ overrides: { '2026-12': 900000 } });
    expect(hasMonthOverride(g, '2026-12')).toBe(true);
    expect(hasMonthOverride(g, '2026-11')).toBe(false);
    expect(hasMonthOverride(undefined, '2026-12')).toBe(false);
  });
});

describe('goalState — as três faixas', () => {
  it('abaixo de 80% está dentro', () => {
    expect(goalState(79_99, 100_00)).toBe('within');
    expect(goalState(0, 100_00)).toBe('within');
  });

  it('80% exato já avisa — o aviso é sobre o consumo, não sobre o calendário', () => {
    expect(goalState(80_00, 100_00)).toBe('near');
    expect(NEAR_THRESHOLD).toBe(0.8);
  });

  it('100% exato ainda é aproximação, não excesso', () => {
    expect(goalState(100_00, 100_00)).toBe('near');
  });

  it('acima de 100% é excesso', () => {
    expect(goalState(100_01, 100_00)).toBe('over');
  });

  it('meta zero: qualquer gasto é excesso, nada gasto está dentro', () => {
    expect(goalState(1, 0)).toBe('over');
    expect(goalState(0, 0)).toBe('within');
  });
});

describe('goalConsumption', () => {
  it('calcula o restante descontando também o previsto', () => {
    const c = goalConsumption({ goalCents: 100_000, usedCents: 40_000, plannedCents: 30_000 });
    expect(c.remainingCents).toBe(30_000);
  });

  it('o estado olha só o efetivado — previsto ainda pode ser cancelado', () => {
    const c = goalConsumption({ goalCents: 100_000, usedCents: 10_000, plannedCents: 200_000 });
    expect(c.state).toBe('within');
    expect(c.remainingCents).toBe(-110_000);
  });

  it('restante negativo quando estourou', () => {
    const c = goalConsumption({ goalCents: 100_000, usedCents: 130_000 });
    expect(c.remainingCents).toBe(-30_000);
    expect(c.state).toBe('over');
  });

  it('a entrada vira marca na escala da meta', () => {
    const c = goalConsumption({ goalCents: 200_000, usedCents: 0, incomeCents: 100_000 });
    expect(c.incomeMark).toBeCloseTo(0.5, 10);
  });

  it('marca acima de 1 é legítima: a meta é maior que a renda', () => {
    const c = goalConsumption({ goalCents: 100_000, usedCents: 0, incomeCents: 300_000 });
    expect(c.incomeMark).toBeCloseTo(3, 10);
  });

  it('sem entrada informada não há marca — é o caso da meta por categoria', () => {
    expect(goalConsumption({ goalCents: 100_000, usedCents: 0 }).incomeMark).toBeNull();
  });

  it('meta zero não divide por zero', () => {
    const semGasto = goalConsumption({ goalCents: 0, usedCents: 0, incomeCents: 500_000 });
    expect(Number.isFinite(semGasto.ratio)).toBe(true);
    expect(semGasto.ratio).toBe(0);
    expect(semGasto.incomeMark).toBeNull();

    const comGasto = goalConsumption({ goalCents: 0, usedCents: 100 });
    expect(comGasto.state).toBe('over');
    expect(comGasto.remainingCents).toBe(-100);
  });

  it('considera o mês inteiro, mesmo que a meta tenha sido criada depois dos gastos (FR-017)', () => {
    // A função recebe o total do mês; não existe recorte por data de criação.
    const c = goalConsumption({ goalCents: 100_000, usedCents: 90_000 });
    expect(c.usedCents).toBe(90_000);
    expect(c.state).toBe('near');
  });
});

describe('sumCategoryGoals', () => {
  const ativas = () => true;

  it('soma as metas de categoria vigentes no mês', () => {
    const metas = [
      goal({ id: 'c1', target: 'category', categoryId: 'c1', versions: [{ from: '2026-01', amountCents: 50_000 }] }),
      goal({ id: 'c2', target: 'category', categoryId: 'c2', versions: [{ from: '2026-01', amountCents: 30_000 }] }),
      goal({ id: 'overall', target: 'overall', categoryId: null }),
    ];
    expect(sumCategoryGoals(metas, '2026-03', ativas)).toBe(80_000);
  });

  it('ignora categoria arquivada (FR-021)', () => {
    const metas = [
      goal({ id: 'c1', target: 'category', categoryId: 'c1', versions: [{ from: '2026-01', amountCents: 50_000 }] }),
      goal({ id: 'c2', target: 'category', categoryId: 'c2', versions: [{ from: '2026-01', amountCents: 30_000 }] }),
    ];
    expect(sumCategoryGoals(metas, '2026-03', (id) => id !== 'c2')).toBe(50_000);
  });

  it('ignora meta que ainda não começou naquele mês', () => {
    const metas = [
      goal({ id: 'c1', target: 'category', categoryId: 'c1', versions: [{ from: '2026-09', amountCents: 50_000 }] }),
    ];
    expect(sumCategoryGoals(metas, '2026-03', ativas)).toBe(0);
  });

  it('sem metas de categoria, soma zero', () => {
    expect(sumCategoryGoals([], '2026-03', ativas)).toBe(0);
  });
});
