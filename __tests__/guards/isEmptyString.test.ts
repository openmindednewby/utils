import { isEmptyString } from '../../src/guards/isEmptyString';

describe('isEmptyString', () => {
  describe('returns false for non-strings', () => {
    it('should return false for null', () => {
      expect(isEmptyString(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEmptyString(undefined)).toBe(false);
    });
  });

  describe('returns true for empty or whitespace strings', () => {
    it('should return true for empty string', () => {
      expect(isEmptyString('')).toBe(true);
    });

    it('should return true for single space', () => {
      expect(isEmptyString(' ')).toBe(true);
    });

    it('should return true for multiple spaces', () => {
      expect(isEmptyString('   ')).toBe(true);
    });

    it('should return true for tab character', () => {
      expect(isEmptyString('\t')).toBe(true);
    });

    it('should return true for newline character', () => {
      expect(isEmptyString('\n')).toBe(true);
    });

    it('should return true for mixed whitespace', () => {
      expect(isEmptyString(' \t\n ')).toBe(true);
    });
  });

  describe('returns false for non-empty strings', () => {
    it('should return false for single character', () => {
      expect(isEmptyString('a')).toBe(false);
    });

    it('should return false for word', () => {
      expect(isEmptyString('hello')).toBe(false);
    });

    it('should return false for string with leading/trailing spaces', () => {
      expect(isEmptyString('  hello  ')).toBe(false);
    });

    it('should return false for string with numbers', () => {
      expect(isEmptyString('123')).toBe(false);
    });
  });
});
