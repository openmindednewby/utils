import { assertDefined } from '../../src/assertions/assertDefined';

describe('assertDefined', () => {
  describe('throws for nullish values', () => {
    it('should throw for null with default message', () => {
      expect(() => assertDefined(null)).toThrow('Value must be defined');
    });

    it('should throw for undefined with default message', () => {
      expect(() => assertDefined(undefined)).toThrow('Value must be defined');
    });

    it('should throw for null with custom message', () => {
      expect(() => assertDefined(null, 'Custom error')).toThrow('Custom error');
    });

    it('should throw for undefined with custom message', () => {
      expect(() => assertDefined(undefined, 'Custom error')).toThrow('Custom error');
    });
  });

  describe('does not throw for defined values', () => {
    it('should not throw for zero', () => {
      expect(() => assertDefined(0)).not.toThrow();
    });

    it('should not throw for empty string', () => {
      expect(() => assertDefined('')).not.toThrow();
    });

    it('should not throw for false', () => {
      expect(() => assertDefined(false)).not.toThrow();
    });

    it('should not throw for NaN', () => {
      expect(() => assertDefined(NaN)).not.toThrow();
    });

    it('should not throw for non-empty string', () => {
      expect(() => assertDefined('hello')).not.toThrow();
    });

    it('should not throw for positive number', () => {
      expect(() => assertDefined(42)).not.toThrow();
    });

    it('should not throw for object', () => {
      expect(() => assertDefined({})).not.toThrow();
    });

    it('should not throw for array', () => {
      expect(() => assertDefined([])).not.toThrow();
    });

    it('should not throw for function', () => {
      expect(() => assertDefined(() => {})).not.toThrow();
    });
  });

  describe('type narrowing', () => {
    it('should narrow type after assertion', () => {
      const value: string | null = 'test';
      assertDefined(value);
      // TypeScript should narrow this to string
      const length: number = value.length;
      expect(length).toBe(4);
    });

    it('should allow accessing properties after assertion', () => {
      interface User {
        name: string;
      }
      const user: User | undefined = { name: 'John' };
      assertDefined(user, 'User must exist');
      expect(user.name).toBe('John');
    });
  });
});
