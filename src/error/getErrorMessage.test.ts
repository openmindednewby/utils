import { getErrorMessage } from './getErrorMessage';

describe('getErrorMessage', () => {
  it('returns the message from an Error', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a string value as-is', () => {
    expect(getErrorMessage('plain')).toBe('plain');
  });

  it('returns the message from an object with a string message', () => {
    expect(getErrorMessage({ message: 'object error' })).toBe('object error');
  });

  it('falls back when message is empty or non-string', () => {
    expect(getErrorMessage({ message: '' })).toBe('Unknown error');
    expect(getErrorMessage({ message: 123 })).toBe('Unknown error');
  });

  it('uses the provided fallback for unrecognised values', () => {
    expect(getErrorMessage(null, 'nope')).toBe('nope');
    expect(getErrorMessage(undefined, 'nope')).toBe('nope');
  });
});
