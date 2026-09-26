/**
 * Axiocruit E2E Test Suite - Custom Assertion Engine
 * Opaque-box requirement verification with detailed error reporting
 */

class AssertionError extends Error {
  constructor(message, expected, actual) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
}

function formatValue(v) {
  if (typeof v === 'string') {
    if (v.length > 120) {
      return `"${v.substring(0, 117)}..." (${v.length} chars)`;
    }
    return `"${v}"`;
  }
  if (typeof v === 'undefined') return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'object') {
    try {
      const s = JSON.stringify(v);
      return s.length > 120 ? `${s.substring(0, 117)}...` : s;
    } catch {
      return String(v);
    }
  }
  return String(v);
}

export function expect(actual) {
  const matchers = (isNot = false) => ({
    toBe(expected) {
      const pass = Object.is(actual, expected);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to be' : 'to be'} ${formatValue(expected)}`,
          expected,
          actual
        );
      }
    },

    toEqual(expected) {
      const pass = deepEqual(actual, expected);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to equal' : 'to equal'} ${formatValue(expected)}`,
          expected,
          actual
        );
      }
    },

    toBeDefined() {
      const pass = typeof actual !== 'undefined';
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected value ${isNot ? 'NOT to be defined' : 'to be defined'}, but got ${formatValue(actual)}`,
          'defined',
          actual
        );
      }
    },

    toBeNull() {
      const pass = actual === null;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to be null' : 'to be null'}`,
          null,
          actual
        );
      }
    },

    toBeTruthy() {
      const pass = Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to be truthy' : 'to be truthy'}`,
          true,
          actual
        );
      }
    },

    toBeFalsy() {
      const pass = !Boolean(actual);
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to be falsy' : 'to be falsy'}`,
          false,
          actual
        );
      }
    },

    toContain(expectedItem) {
      let pass = false;
      if (typeof actual === 'string') {
        pass = actual.includes(expectedItem);
      } else if (Array.isArray(actual)) {
        pass = actual.some(item => deepEqual(item, expectedItem) || item === expectedItem);
      } else if (actual && typeof actual === 'object') {
        pass = Object.prototype.hasOwnProperty.call(actual, expectedItem);
      }
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to contain' : 'to contain'} ${formatValue(expectedItem)}`,
          expectedItem,
          actual
        );
      }
    },

    toMatch(pattern) {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      const pass = regex.test(String(actual));
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${formatValue(actual)} ${isNot ? 'NOT to match' : 'to match'} ${pattern}`,
          pattern,
          actual
        );
      }
    },

    toBeGreaterThan(expected) {
      const pass = actual > expected;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${actual} ${isNot ? 'NOT to be >' : 'to be >'} ${expected}`,
          expected,
          actual
        );
      }
    },

    toBeGreaterThanOrEqual(expected) {
      const pass = actual >= expected;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${actual} ${isNot ? 'NOT to be >=' : 'to be >='} ${expected}`,
          expected,
          actual
        );
      }
    },

    toBeLessThan(expected) {
      const pass = actual < expected;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${actual} ${isNot ? 'NOT to be <' : 'to be <'} ${expected}`,
          expected,
          actual
        );
      }
    },

    toBeLessThanOrEqual(expected) {
      const pass = actual <= expected;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected ${actual} ${isNot ? 'NOT to be <=' : 'to be <='} ${expected}`,
          expected,
          actual
        );
      }
    },

    toHaveLength(expectedLength) {
      const len = actual ? actual.length : undefined;
      const pass = len === expectedLength;
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected length ${isNot ? 'NOT to be' : 'to be'} ${expectedLength}, but got ${len}`,
          expectedLength,
          len
        );
      }
    },

    toHaveProperty(prop, value) {
      const hasProp = actual != null && Object.prototype.hasOwnProperty.call(actual, prop);
      const pass = hasProp && (arguments.length < 2 || deepEqual(actual[prop], value));
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected object ${isNot ? 'NOT to have property' : 'to have property'} "${prop}"${arguments.length >= 2 ? ` with value ${formatValue(value)}` : ''}`,
          value,
          actual ? actual[prop] : undefined
        );
      }
    },

    toThrow(expectedError) {
      if (typeof actual !== 'function') {
        throw new AssertionError('Expected a function to test toThrow', 'function', typeof actual);
      }
      let threw = false;
      let errorThrown = null;
      try {
        actual();
      } catch (err) {
        threw = true;
        errorThrown = err;
      }
      let pass = threw;
      if (threw && expectedError) {
        if (typeof expectedError === 'string') {
          pass = errorThrown.message.includes(expectedError);
        } else if (expectedError instanceof RegExp) {
          pass = expectedError.test(errorThrown.message);
        }
      }
      if (isNot ? pass : !pass) {
        throw new AssertionError(
          `Expected function ${isNot ? 'NOT to throw' : 'to throw'}${expectedError ? ` matching ${expectedError}` : ''}, but ${threw ? `threw "${errorThrown.message}"` : 'did not throw'}`,
          expectedError,
          errorThrown ? errorThrown.message : null
        );
      }
    }
  });

  const base = matchers(false);
  base.not = matchers(true);
  return base;
}

export { AssertionError };
