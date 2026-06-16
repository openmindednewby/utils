/**
 * Locale-aware date formatting (pure — the caller supplies the locale, e.g. from i18n).
 * Returns '' for null/undefined; falls back to the ISO date if Intl formatting throws.
 *
 * @example formatDate(new Date(), 'en')                              // "6/15/2024"
 * @example formatDate(new Date(), 'en', { year: 'numeric', month: 'long' }) // "June 2024"
 * @example formatDate(null, 'en')                                    // ""
 */
export function formatDate(
  date: Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (date === null || date === undefined) {return '';}

  const resolvedLocale = locale !== '' ? locale : 'en';

  try {
    return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
  } catch {
    // Fallback to ISO date if formatting fails (invalid locale/options).
    return date.toISOString().split('T')[0] ?? '';
  }
}
