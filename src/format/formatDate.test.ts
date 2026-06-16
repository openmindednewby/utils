import { formatDate } from './formatDate';

describe('formatDate', () => {
  const date = new Date('2024-06-15T00:00:00.000Z');

  it('returns empty string for null/undefined', () => {
    expect(formatDate(null, 'en')).toBe('');
    expect(formatDate(undefined, 'en')).toBe('');
  });

  it('formats a date for a locale', () => {
    const out = formatDate(date, 'en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' });
    expect(out).toContain('June');
    expect(out).toContain('2024');
  });

  it('falls back to en when locale is empty', () => {
    expect(formatDate(date, '', { year: 'numeric', timeZone: 'UTC' })).toContain('2024');
  });

  it('falls back to ISO date when Intl throws on a bad locale', () => {
    expect(formatDate(date, 'not a locale!!')).toBe('2024-06-15');
  });
});
