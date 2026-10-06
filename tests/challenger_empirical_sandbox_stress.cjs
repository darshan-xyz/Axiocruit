const assert = require('assert');
const os = require('os');
const {
  sanitizeErrorOutput,
  executePython,
  runAllTestCases,
  smartCompare,
  normalizeOutput,
  classifyError,
} = require('../server/controllers/codingTestController.js');

async function runAdversarialStress() {
  console.log('========================================================================');
  console.log('  CHALLENGER 7.1: EMPIRICAL ADVERSARIAL SANDBOX STRESS HARNESS          ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Deep Recursion & Traceback Frame Sanitization
  await test('Traceback sanitization on deep recursion (RecursionError)', async () => {
    const code = `
def recurse(n):
    return recurse(n + 1)
recurse(0)
`;
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, 'RuntimeError');
    assert(res.stderr.includes('RecursionError'), 'Must detect RecursionError');
    assert(res.stderr.includes('File "solution.py"'), 'Must rewrite frames to File "solution.py"');
    assert(!res.stderr.includes('axiocruit_exec_'), 'Must not leak temp file name');
    assert(!res.stderr.includes('\\Temp\\') && !res.stderr.includes('/tmp/axiocruit'), 'Must not leak OS temp path');
  });

  // 2. Chained Exceptions Traceback
  await test('Traceback sanitization on chained exception (raise X from Y)', async () => {
    const code = `
try:
    1 / 0
except Exception as e:
    raise ValueError("Chained error occurred") from e
`;
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, 'RuntimeError');
    assert(res.stderr.includes('ZeroDivisionError'), 'Must include original cause');
    assert(res.stderr.includes('ValueError: Chained error occurred'), 'Must include chained exception');
    const matches = res.stderr.match(/File\s+["'].*?\.py["']/gi) || [];
    assert(matches.length >= 1, 'Should find at least 1 File directive');
    matches.forEach(m => {
      assert.strictEqual(m, 'File "solution.py"', `All File directives must be File "solution.py", got: ${m}`);
    });
  });

  // 3. IO Sleep Timeout vs CPU Infinite Loop
  await test('Timeout enforcement on I/O Sleep (time.sleep(10))', async () => {
    const start = Date.now();
    const res = await executePython('import time\ntime.sleep(10)\nprint("done")', '');
    const elapsed = Date.now() - start;
    assert.strictEqual(res.errorType, 'TimeLimitExceeded');
    assert(elapsed >= 4800 && elapsed <= 7500, `Elapsed time must be ~5s (got ${elapsed}ms)`);
    assert.strictEqual(res.stderr, 'Execution Timed Out');
  });

  // 4. Consecutive Timeout Circuit Breaker in runAllTestCases
  await test('Consecutive timeout circuit breaker short-circuits subsequent tests', async () => {
    const testCases = [
      { input: '', expectedOutput: '1' },
      { input: '', expectedOutput: '2' },
      { input: '', expectedOutput: '3' },
      { input: '', expectedOutput: '4' },
      { input: '', expectedOutput: '5' },
    ];
    // Each case runs infinite loop
    const code = 'while True: pass';
    const start = Date.now();
    const results = await runAllTestCases(code, testCases);
    const elapsed = Date.now() - start;

    assert.strictEqual(results.length, 5, 'Must return results for all 5 cases');
    // After 2 timeouts, the remaining 3 should immediately short-circuit without waiting another 5s each
    // Total time should be ~10s (2 * 5s), NOT 25s!
    assert(elapsed < 14000, `Circuit breaker should trip after 2 timeouts (elapsed: ${elapsed}ms, expected < 14s)`);
    for (let i = 0; i < 5; i++) {
      assert.strictEqual(results[i].passed, false);
      assert.strictEqual(results[i].errorType, 'TimeLimitExceeded');
      assert.strictEqual(results[i].actualOutput, 'Execution Timed Out');
    }
  });

  // 5. Massive Stdout Output (100,000 characters)
  await test('Massive stdout output handling without buffer hang or truncation crash', async () => {
    const code = 'print("A" * 100000)';
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, null);
    assert.strictEqual(res.stdout.trim().length, 100000);
  });

  // 6. Non-zero exit code with and without stderr
  await test('Process exit code non-zero (sys.exit(42)) without stderr', async () => {
    const code = 'import sys\nsys.exit(42)';
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, 'RuntimeError');
    assert(res.stderr.includes('Process exited with code 42') || res.stderr.includes('SystemExit'));
  });

  // 7. Unicode and Stdout Encoding Handling
  await test('Standard text and Unicode sanitization without host path leaks', async () => {
    const code = 'import sys\nline = sys.stdin.read().strip()\nprint(f"Echo: {line}")';
    const res = await executePython(code, 'Standard ASCII Input');
    assert.strictEqual(res.errorType, null);
    assert.strictEqual(res.stdout.trim(), 'Echo: Standard ASCII Input');

    // Test emoji output behavior and verify traceback sanitization on UnicodeEncodeError
    const emojiCode = 'print("Emoji test: 🚀")';
    const emojiRes = await executePython(emojiCode, '');
    if (emojiRes.errorType === 'RuntimeError') {
      // On Windows default codepages, cp1252 fails on emoji without PYTHONIOENCODING=utf-8
      // Verify that the resulting UnicodeEncodeError traceback is fully sanitized!
      assert(emojiRes.stderr.includes('File "solution.py"'), 'Must sanitize traceback file path even in encoding error');
      assert(!emojiRes.stderr.includes('C:\\Python') && !emojiRes.stderr.includes('AppData'), 'Must not leak host Python installation directory');
    } else {
      assert.strictEqual(emojiRes.errorType, null);
      assert(emojiRes.stdout.includes('Emoji test: 🚀'));
    }
  });

  // 8. smartCompare robustness tests
  await test('smartCompare handles numeric, whitespace, and formatting variants', () => {
    // Exact match
    assert.strictEqual(smartCompare('42', '42'), true);
    // Trailing newline
    assert.strictEqual(smartCompare('42\n', '42'), true);
    // Integer vs Float representation
    assert.strictEqual(smartCompare('42.0', '42'), true);
    assert.strictEqual(smartCompare('3.1400', '3.14'), true);
    // Case insensitivity for booleans
    assert.strictEqual(smartCompare('true', 'True'), true);
    assert.strictEqual(smartCompare('False', 'false'), true);
    // Array string representations
    assert.strictEqual(smartCompare('[1, 2, 3]', '[1,2,3]'), true);
    // Tuple to array comparison (Python tuple mapped to JSON array)
    assert.strictEqual(smartCompare('(1, 2, 3)', '[1, 2, 3]'), true);
    // Python sets: "{1, 2, 3}" is not JSON-parseable so raw string comparison is used
    assert.strictEqual(smartCompare('{1, 2, 3}', '{1, 2, 3}'), true);
    assert.strictEqual(smartCompare('{1, 2, 3}', '[1, 2, 3]'), false);
    // Distinct outputs fail
    assert.strictEqual(smartCompare('42', '43'), false);
    assert.strictEqual(smartCompare('hello', 'world'), false);
  });

  // 9. Host filesystem path scrubbing when error message contains custom paths
  await test('sanitizeErrorOutput scrubs arbitrary Windows and Unix path injected into error', () => {
    const fakeError = `Exception: Cannot open ${os.tmpdir()}\\secret_file.txt at ${os.homedir()}\\projects\\private.key`;
    const sanitized = sanitizeErrorOutput(fakeError);
    assert(!sanitized.includes(os.tmpdir()), 'Must scrub os.tmpdir()');
    assert(!sanitized.includes(os.homedir()), 'Must scrub os.homedir()');
    assert(sanitized.includes('/tmp') || sanitized.includes('~'), 'Must replace with /tmp or ~');
  });

  console.log('\n========================================================================');
  console.log(`TOTAL ADVERSARIAL STRESS TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdversarialStress().catch(err => {
  console.error('Stress test harness failure:', err);
  process.exit(1);
});
