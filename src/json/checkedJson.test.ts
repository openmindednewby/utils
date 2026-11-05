import { hasArrayField, hasStringFields, parseChecked, toFileJson } from './checkedJson';

const isNamed = (value: unknown): value is { name: string } => hasStringFields(value, ['name']);

describe('parseChecked', () => {
  it('with text of the right shape, returns the value', () => {
    const text = '{"name":"a"}';

    const value = parseChecked(text, isNamed);

    expect(value).toEqual({ name: 'a' });
  });

  it.each(['{broken', '{"name":1}', null])('with %s, returns null', (text) => {
    const value = parseChecked(text, isNamed);

    expect(value).toBeNull();
  });
});

describe('hasArrayField', () => {
  it('with a field that is not an array, returns false', () => {
    const value = { lines: 'x' };

    const result = hasArrayField(value, 'lines');

    expect(result).toBe(false);
  });
});

describe('toFileJson', () => {
  it('with an object, ends in a newline', () => {
    const value = { a: 1 };

    const text = toFileJson(value);

    expect(text).toBe('{\n  "a": 1\n}\n');
  });
});
