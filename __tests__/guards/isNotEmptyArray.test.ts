import { isNotEmptyArray } from '../../src/guards/isNotEmptyArray';

describe('isNotEmptyArray', () => {
  describe('returns false for non-arrays', () => {
    it('should return false for null', () => {
      expect(isNotEmptyArray(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNotEmptyArray(undefined)).toBe(false);
    });
  });

  describe('returns false for empty arrays', () => {
    it('should return false for empty array', () => {
      expect(isNotEmptyArray([])).toBe(false);
    });
  });

  describe('returns true for non-empty arrays', () => {
    it('should return true for array with one element', () => {
      expect(isNotEmptyArray([1])).toBe(true);
    });

    it('should return true for array with multiple elements', () => {
      expect(isNotEmptyArray([1, 2, 3])).toBe(true);
    });

    it('should return true for array with mixed types', () => {
      expect(isNotEmptyArray([1, 'two', { three: 3 }])).toBe(true);
    });

    it('should return true for array with null values', () => {
      expect(isNotEmptyArray([null, null])).toBe(true);
    });

    it('should return true for array with undefined values', () => {
      expect(isNotEmptyArray([undefined])).toBe(true);
    });
  });

  describe('works with readonly arrays', () => {
    it('should work with readonly arrays', () => {
      const readonlyArray: readonly string[] = ['a', 'b'];
      expect(isNotEmptyArray(readonlyArray)).toBe(true);
    });
  });

  describe('type narrowing', () => {
    it('should allow safe array access after check', () => {
      const items: string[] | undefined = ['first', 'second'];
      if (isNotEmptyArray(items)) {
        // Array is guaranteed to have at least one element
        expect(items.length).toBeGreaterThan(0);
        expect(items[0]).toBe('first');
      }
    });
  });
});
