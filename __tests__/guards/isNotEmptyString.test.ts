import { isNotEmptyString } from '../../src/guards/isNotEmptyString';

describe('isNotEmptyString', () => {
  describe('returns false for non-strings', () => {
    it('should return false for null', () => {
      expect(isNotEmptyString(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotEmptyString(undefined)).toBe(false);
    });
  });

  describe('returns false for empty or whitespace strings', () => {
    it('should return false for empty string', () => {
      expect(isNotEmptyString('')).toBe(false);
    });

    it('should return false for single space', () => {
      expect(isNotEmptyString(' ')).toBe(false);
    });

    it('should return false for multiple spaces', () => {
      expect(isNotEmptyString('   ')).toBe(false);
    });

    it('should return false for tab character', () => {
      expect(isNotEmptyString('\t')).toBe(false);
    });

    it('should return false for newline character', () => {
      expect(isNotEmptyString('\n')).toBe(false);
    });

    it('should return false for mixed whitespace', () => {
      expect(isNotEmptyString(' \t\n ')).toBe(false);
    });
  });

  describe('returns true for non-empty strings', () => {
    it('should return true for single character', () => {
      expect(isNotEmptyString('a')).toBe(true);
    });

    it('should return true for word', () => {
      expect(isNotEmptyString('hello')).toBe(true);
    });

    it('should return true for string with leading/trailing spaces', () => {
      expect(isNotEmptyString('  hello  ')).toBe(true);
    });

    it('should return true for string with numbers', () => {
      expect(isNotEmptyString('123')).toBe(true);
    });

    it('should return true for string with special characters', () => {
      expect(isNotEmptyString('!@#$%')).toBe(true);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type to string', () => {
      const value: string | undefined = 'test';
      if (isNotEmptyString(value)) {
        const length: number = value.length;
        expect(length).toBe(4);
      }
    });
  });
});
