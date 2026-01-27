import { isValueDefined } from '../../src/guards/isValueDefined';

describe('isValueDefined', () => {
  describe('returns false for nullish values', () => {
    it('should return false for null', () => {
      expect(isValueDefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValueDefined(undefined)).toBe(false);
    });
  });

  describe('returns true for falsy but defined values', () => {
    it('should return true for zero', () => {
      expect(isValueDefined(0)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isValueDefined('')).toBe(true);
    });

    it('should return true for false', () => {
      expect(isValueDefined(false)).toBe(true);
    });

    it('should return true for NaN', () => {
      expect(isValueDefined(NaN)).toBe(true);
    });
  });

  describe('returns true for truthy values', () => {
    it('should return true for non-empty string', () => {
      expect(isValueDefined('hello')).toBe(true);
    });

    it('should return true for positive number', () => {
      expect(isValueDefined(42)).toBe(true);
    });

    it('should return true for object', () => {
      expect(isValueDefined({})).toBe(true);
    });

    it('should return true for array', () => {
      expect(isValueDefined([])).toBe(true);
    });

    it('should return true for function', () => {
      expect(isValueDefined(() => {})).toBe(true);
    });
  });

  describe('type narrowing', () => {
    it('should narrow type correctly', () => {
      const value: string | null | undefined = 'test';
      if (isValueDefined(value)) {
        // TypeScript should narrow this to string
        const length: number = value.length;
        expect(length).toBe(4);
      }
    });
  });
});
