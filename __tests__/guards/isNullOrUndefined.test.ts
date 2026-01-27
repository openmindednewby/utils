import { isNullOrUndefined } from '../../src/guards/isNullOrUndefined';

describe('isNullOrUndefined', () => {
  describe('returns true for nullish values', () => {
    it('should return true for null', () => {
      expect(isNullOrUndefined(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNullOrUndefined(undefined)).toBe(true);
    });
  });

  describe('returns false for falsy but defined values', () => {
    it('should return false for zero', () => {
      expect(isNullOrUndefined(0)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isNullOrUndefined('')).toBe(false);
    });

    it('should return false for false', () => {
      expect(isNullOrUndefined(false)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isNullOrUndefined(NaN)).toBe(false);
    });
  });

  describe('returns false for truthy values', () => {
    it('should return false for non-empty string', () => {
      expect(isNullOrUndefined('hello')).toBe(false);
    });

    it('should return false for positive number', () => {
      expect(isNullOrUndefined(42)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isNullOrUndefined({})).toBe(false);
    });

    it('should return false for array', () => {
      expect(isNullOrUndefined([])).toBe(false);
    });

    it('should return false for function', () => {
      expect(isNullOrUndefined(() => {})).toBe(false);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type to null | undefined', () => {
      const value: string | null | undefined = null;
      if (isNullOrUndefined(value)) {
        // TypeScript should narrow this to null | undefined
        expect(value).toBeNull();
      }
    });
  });
});
