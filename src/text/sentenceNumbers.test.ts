import { hundredths, numbersIn, readNumber } from './sentenceNumbers';

describe('readNumber', () => {
  it('with a plain whole number, returns it', () => {
    const value = readNumber(' 1200 ');

    expect(value).toBe(1200);
  });

  it('with thousands dots and a decimal comma, returns the decimal value', () => {
    const value = readNumber('1.200,50');

    expect(value).toBe(1200.5);
  });

  it('with thousands commas and a decimal point, returns the decimal value', () => {
    const value = readNumber('1,200.50');

    expect(value).toBe(1200.5);
  });

  it('with a thousands dot only, reads it as a separator', () => {
    const value = readNumber('1.200');

    expect(value).toBe(1200);
  });

  it('with text that is not a number, returns null', () => {
    const value = readNumber('-12');

    expect(value).toBeNull();
  });

  it('with digits too many to be finite, returns null', () => {
    const value = readNumber('9'.repeat(400));

    expect(value).toBeNull();
  });
});

describe('hundredths', () => {
  it('with a decimal value, returns whole hundredths', () => {
    const value = hundredths(1200.5);

    expect(value).toBe(120050);
  });
});

describe('numbersIn', () => {
  it('with a sentence of two numbers, lists both in hundredths', () => {
    const values = numbersIn('bill 3 days at 1.200,50 each');

    expect([...values]).toEqual([300, 120050]);
  });

  it('with a sentence without numbers, returns an empty set', () => {
    const values = numbersIn('no numbers here');

    expect(values.size).toBe(0);
  });
});
