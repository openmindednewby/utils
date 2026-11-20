import { isValueDefined } from '../guards/isValueDefined';

const NUMBER_TOKEN = /\d[\d.,]*\d|\d/g;
const PLAIN_NUMBER = /^\d[\d.,]*$/;
const DECIMAL_TAIL = /[.,](\d{1,2})$/;
const SEPARATORS = /[.,]/g;
const CENTS = 100;

/** Reads 1200, 1.200, 1,200.50 or 1.200,50; a text that is not a plain positive number gives null. */
export function readNumber(text: string): number | null {
  const trimmed = text.trim();
  if (!PLAIN_NUMBER.test(trimmed)) {return null;}
  const tail = DECIMAL_TAIL.exec(trimmed);
  const whole = (!isValueDefined(tail) ? trimmed : trimmed.slice(0, tail.index)).replace(
    SEPARATORS,
    ''
  );
  const value = Number(!isValueDefined(tail) ? whole : `${whole}.${tail[1]}`);
  return Number.isFinite(value) ? value : null;
}

/** Turns a number into whole hundredths, so 1200.5 and 1.200,50 compare equal. */
export function hundredths(value: number): number {
  return Math.round(value * CENTS);
}

/** Lists every number a sentence says, in hundredths. */
export function numbersIn(sentence: string): Set<number> {
  const tokens = sentence.match(NUMBER_TOKEN) ?? [];
  const values = tokens.map(readNumber).filter((value): value is number => isValueDefined(value));
  return new Set(values.map(hundredths));
}
