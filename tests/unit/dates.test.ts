import { describe, it, expect } from 'vitest';
import {
  toISODate,
  fromISODate,
  monthOf,
  daysInMonth,
  clampDayToMonth,
  dateForDayOfMonth,
  addMonths,
  addDays,
  weekdayOf,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDay,
  isWithin,
  formatMonthLong,
  weekdayDatesInMonth,
} from '../../src/shared/dates';

describe('conversão sem deslocamento de fuso', () => {
  it('não perde nem ganha um dia no ida e volta', () => {
    expect(toISODate(fromISODate('2026-08-29'))).toBe('2026-08-29');
    expect(toISODate(fromISODate('2026-01-01'))).toBe('2026-01-01');
    expect(toISODate(fromISODate('2026-12-31'))).toBe('2026-12-31');
  });

  it('monta o Date no fuso local, no dia certo', () => {
    const d = fromISODate('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(15);
  });
});

describe('mês', () => {
  it('extrai o mês da data', () => {
    expect(monthOf('2026-08-29')).toBe('2026-08');
  });

  it('conta os dias de cada mês, inclusive bissexto', () => {
    expect(daysInMonth('2026-01')).toBe(31);
    expect(daysInMonth('2026-02')).toBe(28);
    expect(daysInMonth('2024-02')).toBe(29);
    expect(daysInMonth('2026-04')).toBe(30);
  });

  it('avança e retrocede meses virando o ano', () => {
    expect(addMonths('2026-08', 1)).toBe('2026-09');
    expect(addMonths('2026-12', 1)).toBe('2027-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-08', 12)).toBe('2027-08');
  });

  it('dá o primeiro e o último dia do mês', () => {
    expect(startOfMonth('2026-02')).toBe('2026-02-01');
    expect(endOfMonth('2026-02')).toBe('2026-02-28');
    expect(endOfMonth('2024-02')).toBe('2024-02-29');
  });
});

describe('clamp de dia do mês (recorrências)', () => {
  it('mantém o dia quando ele existe no mês', () => {
    expect(clampDayToMonth('2026-08', 5)).toBe(5);
    expect(dateForDayOfMonth('2026-08', 5)).toBe('2026-08-05');
  });

  it('joga o dia 31 para o último dia de fevereiro', () => {
    expect(clampDayToMonth('2026-02', 31)).toBe(28);
    expect(dateForDayOfMonth('2026-02', 31)).toBe('2026-02-28');
    expect(dateForDayOfMonth('2024-02', 31)).toBe('2024-02-29');
  });

  it('joga o dia 31 para o dia 30 em meses de 30 dias', () => {
    expect(dateForDayOfMonth('2026-04', 31)).toBe('2026-04-30');
    expect(dateForDayOfMonth('2026-06', 31)).toBe('2026-06-30');
  });

  it('preenche o dia com zero à esquerda', () => {
    expect(dateForDayOfMonth('2026-08', 1)).toBe('2026-08-01');
  });
});

describe('dias e semanas', () => {
  it('soma e subtrai dias atravessando o mês', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('numera os dias da semana no padrão ISO (1 = segunda)', () => {
    expect(weekdayOf('2026-08-31')).toBe(1); // segunda
    expect(weekdayOf('2026-08-29')).toBe(6); // sábado
    expect(weekdayOf('2026-08-30')).toBe(7); // domingo
  });

  it('abre a semana no domingo e fecha no sábado', () => {
    expect(startOfWeek('2026-08-29')).toBe('2026-08-23');
    expect(endOfWeek('2026-08-29')).toBe('2026-08-29');
    expect(startOfWeek('2026-08-30')).toBe('2026-08-30');
  });

  it('lista o intervalo incluindo as duas pontas', () => {
    expect(eachDay('2026-08-29', '2026-09-01')).toEqual([
      '2026-08-29',
      '2026-08-30',
      '2026-08-31',
      '2026-09-01',
    ]);
    expect(eachDay('2026-08-29', '2026-08-29')).toEqual(['2026-08-29']);
  });

  it('testa pertencimento a um intervalo', () => {
    expect(isWithin('2026-08-29', '2026-08-01', '2026-08-31')).toBe(true);
    expect(isWithin('2026-09-01', '2026-08-01', '2026-08-31')).toBe(false);
  });
});

describe('exibição em pt-BR', () => {
  it('escreve o mês por extenso', () => {
    expect(formatMonthLong('2026-08')).toContain('agosto');
    expect(formatMonthLong('2026-08')).toContain('2026');
  });
});

describe('weekdayDatesInMonth', () => {
  it('devolve as cinco quando o mês tem cinco', () => {
    // Setembro de 2026 começa numa terça: 1, 8, 15, 22 e 29.
    expect(weekdayDatesInMonth('2026-09', 2)).toEqual([
      '2026-09-01',
      '2026-09-08',
      '2026-09-15',
      '2026-09-22',
      '2026-09-29',
    ]);
  });

  it('devolve quatro quando o mês tem quatro', () => {
    expect(weekdayDatesInMonth('2027-02', 2)).toHaveLength(4);
  });

  it('inclui o dia 1 quando o mês começa naquele dia da semana', () => {
    expect(weekdayDatesInMonth('2026-09', 2)[0]).toBe('2026-09-01');
  });

  it('inclui o último dia quando o mês termina naquele dia da semana', () => {
    // 31 de agosto de 2026 é uma segunda.
    const segundas = weekdayDatesInMonth('2026-08', 1);
    expect(segundas[segundas.length - 1]).toBe('2026-08-31');
  });

  it('atravessa a virada do ano sem se perder', () => {
    expect(weekdayDatesInMonth('2026-12', 5)).toEqual([
      '2026-12-04',
      '2026-12-11',
      '2026-12-18',
      '2026-12-25',
    ]);
    expect(weekdayDatesInMonth('2027-01', 5)[0]).toBe('2027-01-01');
  });

  it('fevereiro bissexto de 29 dias com o dia certo', () => {
    // 2028 é bissexto; 29/02/2028 é uma terça.
    expect(weekdayDatesInMonth('2028-02', 2)).toContain('2028-02-29');
  });

  it('todo dia do mês pertence a exatamente um dia da semana', () => {
    const total = ([1, 2, 3, 4, 5, 6, 7] as const).reduce(
      (soma, dia) => soma + weekdayDatesInMonth('2026-09', dia).length,
      0,
    );
    expect(total).toBe(30);
  });
});
