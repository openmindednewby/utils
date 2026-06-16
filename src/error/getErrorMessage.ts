import { isValueDefined } from '../guards/isValueDefined';

interface ErrorWithMessage {
  message?: unknown;
}

function isErrorWithMessage(value: unknown): value is ErrorWithMessage {
  return typeof value === 'object' && isValueDefined(value) && 'message' in value;
}

/**
 * Extracts a human-readable error message from various error shapes
 * (Error, string, or an object with a `message` property).
 *
 * @param value - The error value.
 * @param fallback - Returned when no message can be extracted (default: 'Unknown error').
 */
export function getErrorMessage(value: unknown, fallback = 'Unknown error'): string {
  if (value instanceof Error) {return value.message;}
  if (typeof value === 'string') {return value;}
  if (isErrorWithMessage(value)) {
    const message = value.message;
    if (typeof message === 'string' && message.length > 0) {return message;}
  }
  return fallback;
}
