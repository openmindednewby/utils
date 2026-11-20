import { isValueDefined } from '../guards/isValueDefined';

/** Finds the one name equal to or containing the given text, ignoring case; none or several give null. */
export function matchName(names: readonly string[], given: string): string | null {
  const needle = given.trim().toLowerCase();
  const exact = names.find((name) => name.toLowerCase() === needle);
  if (isValueDefined(exact)) {return exact;}
  const [only, ...others] = names.filter((name) => name.toLowerCase().includes(needle));
  return isValueDefined(only) && others.length === 0 ? only : null;
}
