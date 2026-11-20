import { isMonth, lastDayOfPeriod, monthName, periodOf, quarterOf, todayIso } from './isoDates';

describe('todayIso', () => {
  it('with a local late-evening time, returns the local calendar day', () => {
    const now = new Date(2030, 2, 5, 23, 30);

    const day = todayIso(now);

    expect(day).toBe('2030-03-05');
  });

  it('with no date given, returns a YYYY-MM-DD day', () => {
    const day = todayIso();

    expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('periodOf', () => {
  it('with a full date, returns its YYYY-MM', () => {
    const period = periodOf('2030-03-05');

    expect(period).toBe('2030-03');
  });
});

describe('lastDayOfPeriod', () => {
  it('with February of a leap year, returns the 29th', () => {
    const day = lastDayOfPeriod('2028-02');

    expect(day).toBe('2028-02-29');
  });

  it('with December, returns the 31st of that year', () => {
    const day = lastDayOfPeriod('2030-12');

    expect(day).toBe('2030-12-31');
  });
});

describe('monthName', () => {
  it('with Greek as the language, names the month in Greek', () => {
    const name = monthName('2030-03', 'el');

    expect(name.toLowerCase()).toContain('μαρτ');
  });

  it('with the short style, names the month short', () => {
    const name = monthName('2030-03', 'en', 'short');

    expect(name).toBe('Mar');
  });
});

describe('quarterOf', () => {
  it('with an August date, returns quarter 3', () => {
    const quarter = quarterOf('2030-08-14');

    expect(quarter).toBe(3);
  });
});

describe('isMonth', () => {
  it('with a real YYYY-MM month, returns true', () => {
    const result = isMonth('2030-12');

    expect(result).toBe(true);
  });

  it('with month 13, returns false', () => {
    const result = isMonth('2030-13');

    expect(result).toBe(false);
  });
});
