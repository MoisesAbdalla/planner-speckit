import { describe, it, expect } from 'vitest';
import {
  buildMonthSeries,
  seriesScale,
  hasSeriesData,
  monthsWithData,
  SERIES_LENGTH,
} from '../../src/features/finance/lib/monthSeries';

const stats = {
  '2026-06': { incomeCents: 500000, expenseCents: 450000 },
  '2026-07': { incomeCents: 500000, expenseCents: 520000 },
  '2026-08': { incomeCents: 500000, expenseCents: 300000 },
};

describe('buildMonthSeries', () => {
  it('devolve o horizonte completo terminando no mês em foco', () => {
    const série = buildMonthSeries(stats, '2026-08');
    expect(série).toHaveLength(SERIES_LENGTH);
    expect(série.map((p) => p.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
  });

  it('marca como atual apenas o mês em foco', () => {
    const série = buildMonthSeries(stats, '2026-08');
    expect(série.filter((p) => p.isCurrent).map((p) => p.month)).toEqual(['2026-08']);
    expect(série.at(-1)!.isCurrent).toBe(true);
  });

  it('preenche com zeros os meses sem registro, sem deixar buraco', () => {
    const série = buildMonthSeries(stats, '2026-08');
    const março = série[0]!;
    expect(março.month).toBe('2026-03');
    expect(março.incomeCents).toBe(0);
    expect(março.expenseCents).toBe(0);
    expect(março.balanceCents).toBe(0);
  });

  it('calcula o saldo de cada mês', () => {
    const série = buildMonthSeries(stats, '2026-08');
    const porMês = Object.fromEntries(série.map((p) => [p.month, p.balanceCents]));
    expect(porMês['2026-06']).toBe(50000);
    expect(porMês['2026-08']).toBe(200000);
  });

  it('aceita saldo negativo — o mês pode fechar no vermelho', () => {
    const série = buildMonthSeries(stats, '2026-08');
    expect(série.find((p) => p.month === '2026-07')!.balanceCents).toBe(-20000);
  });

  it('vira o ano para trás corretamente', () => {
    const série = buildMonthSeries({}, '2027-01', 3);
    expect(série.map((p) => p.month)).toEqual(['2026-11', '2026-12', '2027-01']);
  });

  it('ignora meses posteriores ao mês em foco', () => {
    const comFuturo = { ...stats, '2026-12': { incomeCents: 999999, expenseCents: 0 } };
    const série = buildMonthSeries(comFuturo, '2026-08');
    expect(série.some((p) => p.month === '2026-12')).toBe(false);
  });

  it('sem histórico algum, devolve a série toda zerada', () => {
    const série = buildMonthSeries({}, '2026-08');
    expect(série).toHaveLength(SERIES_LENGTH);
    expect(série.every((p) => p.balanceCents === 0)).toBe(true);
  });

  it('respeita um horizonte customizado', () => {
    expect(buildMonthSeries(stats, '2026-08', 2).map((p) => p.month)).toEqual([
      '2026-07',
      '2026-08',
    ]);
  });
});

describe('seriesScale', () => {
  it('usa o maior valor absoluto, incluindo saldo negativo', () => {
    expect(seriesScale(buildMonthSeries(stats, '2026-08'))).toBe(200000);
  });

  it('um mês muito negativo domina a escala', () => {
    const pesado = { '2026-08': { incomeCents: 0, expenseCents: 900000 } };
    expect(seriesScale(buildMonthSeries(pesado, '2026-08'))).toBe(900000);
  });

  it('série zerada tem escala zero', () => {
    expect(seriesScale(buildMonthSeries({}, '2026-08'))).toBe(0);
  });
});

describe('hasSeriesData e monthsWithData', () => {
  it('reconhece quando não há nada a mostrar (FR-014)', () => {
    expect(hasSeriesData(buildMonthSeries({}, '2026-08'))).toBe(false);
    expect(monthsWithData(buildMonthSeries({}, '2026-08'))).toBe(0);
  });

  it('conta só os meses com registro', () => {
    expect(hasSeriesData(buildMonthSeries(stats, '2026-08'))).toBe(true);
    expect(monthsWithData(buildMonthSeries(stats, '2026-08'))).toBe(3);
  });

  it('um mês que entrou e saiu o mesmo valor ainda conta como registro', () => {
    const empatado = { '2026-08': { incomeCents: 1000, expenseCents: 1000 } };
    const série = buildMonthSeries(empatado, '2026-08');
    expect(série.at(-1)!.balanceCents).toBe(0);
    expect(monthsWithData(série)).toBe(1);
  });
});
