import { isEmptyArray } from '../../src/guards/isEmptyArray';

describe('isEmptyArray', () => {
  describe('returns false for non-arrays', () => {
    it('should return false for null', () => {
      expect(isEmptyArray(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEmptyArray(undefined)).toBe(false);
    });
  });

  describe('returns true for empty arrays', () => {
    it('should return true for empty array', () => {
      expect(isEmptyArray([])).toBe(true);
    });
  });

  describe('returns false for non-empty arrays', () => {
    it('should return false for array with one element', () => {
      expect(isEmptyArray([1])).toBe(false);
    });

    it('should return false for array with multiple elements', () => {
      expect(isEmptyArray([1, 2, 3])).toBe(false);
    });

    it('should return false for array with null values', () => {
      expect(isEmptyArray([null])).toBe(false);
    });

    it('should return false for array with undefined values', () => {
      expect(isEmptyArray([undefined])).toBe(false);
    });
  });

  describe('works with readonly arrays', () => {
    it('should work with readonly empty arrays', () => {
      const readonlyArray: readonly string[] = [];
      expect(isEmptyArray(readonlyArray)).toBe(true);
    });

    it('should work with readonly non-empty arrays', () => {
      const readonlyArray: readonly string[] = ['a'];
      expect(isEmptyArray(readonlyArray)).toBe(false);
    });
  });
});
