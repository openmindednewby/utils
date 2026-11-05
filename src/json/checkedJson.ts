import { isValueDefined } from '../guards/isValueDefined';

/** Parses JSON and checks its shape; anything else gives null. */
export function parseChecked<T>(text: string | null, isShape: (value: unknown) => value is T): T | null {
  if (!isValueDefined(text)) {return null;}
  try {
    const value: unknown = JSON.parse(text);
    return isShape(value) ? value : null;
  } catch {
    return null;
  }
}

/** Whether a value is an object holding these string fields. */
export function hasStringFields(value: unknown, fields: readonly string[]): boolean {
  if (typeof value !== 'object' || !isValueDefined(value)) {return false;}
  return fields.every((field) => typeof Reflect.get(value, field) === 'string');
}

/** Whether an object's field holds an array. */
export function hasArrayField(value: unknown, field: string): boolean {
  return typeof value === 'object' && isValueDefined(value) && Array.isArray(Reflect.get(value, field));
}

/** Turns data into two-space JSON text ending in a newline. */
export function toFileJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
