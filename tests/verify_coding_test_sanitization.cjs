const path = require('path');
const assert = require('assert');
const {
  sanitizeErrorOutput,
  executePython,
  runAllTestCases,
  smartCompare,
  normalizeOutput,
  classifyError,
} = require('../server/controllers/codingTestController.js');

async function runTests() {
  console.log('--- 1. Testing sanitizeErrorOutput ---');

  // Test null / undefined
  assert.strictEqual(sanitizeErrorOutput(null), '', 'null should return empty string');
  assert.strictEqual(sanitizeErrorOutput(undefined), '', 'undefined should return empty string');
  assert.strictEqual(sanitizeErrorOutput(''), '', 'empty string should return empty string');

  // Test Windows file path traceback
  const winTraceback = 'Traceback (most recent call last):\n  File "C:\\Users\\KV\\AppData\\Local\\Temp\\axiocruit_exec_123.py", line 1, in <module>\nZeroDivisionError: division by zero';
  const sanitizedWin = sanitizeErrorOutput(winTraceback);
  assert(!sanitizedWin.includes('C:\\Users\\KV'), 'Should not contain Windows user directory');
  assert(sanitizedWin.includes('File "solution.py", line 1'), 'Should sanitize to File "solution.py"');

  // Test Linux/Unix path traceback with single quotes
  const unixTraceback = "  File '/tmp/axiocruit_test.py', line 5, in <module>";
  const sanitizedUnix = sanitizeErrorOutput(unixTraceback);
  assert(!sanitizedUnix.includes('/tmp/axiocruit'), 'Should not contain Unix temp path');
  assert(sanitizedUnix.includes('File "solution.py"'), 'Should sanitize to File "solution.py"');

  // Test Error object
  const errObj = new Error('File "D:\\test\\foo.py", line 10: SyntaxError');
  const sanitizedErr = sanitizeErrorOutput(errObj);
  assert(!sanitizedErr.includes('D:\\test'), 'Should sanitize Error object message');
  assert(sanitizedErr.includes('File "solution.py"'), 'Should replace with solution.py');

  // Test Error object with stderr property
  const errWithStderr = {
    message: 'Process failed',
    stderr: 'File "/var/log/app.py", line 42, error',
  };
  const sanitizedStderr = sanitizeErrorOutput(errWithStderr);
  assert(sanitizedStderr.includes('File "solution.py", line 42'), 'Should prioritize stderr over message');

  console.log('✔ sanitizeErrorOutput passed all assertion tests');

  console.log('--- 2. Testing executePython with valid code ---');
  const validExec = await executePython('print("Hello Axiocruit")', '');
  assert.strictEqual(validExec.errorType, null, 'Valid code should have errorType: null');
  assert.strictEqual(validExec.stdout.trim(), 'Hello Axiocruit', 'Output should match stdout');

  console.log('--- 3. Testing executePython with runtime error (ZeroDivisionError) ---');
  const errorExec = await executePython('print(1 / 0)', '');
  assert.strictEqual(errorExec.errorType, 'RuntimeError', 'Should classify as RuntimeError');
  assert(!errorExec.stderr.includes('axiocruit_exec_'), 'Error stderr must NOT contain temp file path');
  assert(errorExec.stderr.includes('File "solution.py"'), 'Error stderr must reference File "solution.py"');
  assert(errorExec.stderr.includes('ZeroDivisionError'), 'Error stderr must contain ZeroDivisionError');

  console.log('--- 4. Testing executePython with syntax error ---');
  const syntaxExec = await executePython('def foo(:\n  pass', '');
  assert.strictEqual(syntaxExec.errorType, 'SyntaxError', 'Should classify as SyntaxError');
  assert(!syntaxExec.stderr.includes('axiocruit_exec_'), 'Error stderr must NOT contain temp file path');
  assert(syntaxExec.stderr.includes('File "solution.py"'), 'Error stderr must reference File "solution.py"');

  console.log('--- 5. Testing runAllTestCases ---');
  const cases = [
    { input: '2\n3\n', expectedOutput: '5' },
    { input: '10\n20\n', expectedOutput: '30' },
  ];
  const solutionCode = 'import sys\nlines = sys.stdin.read().split()\nif lines:\n    print(int(lines[0]) + int(lines[1]))\n';
  const testResults = await runAllTestCases(solutionCode, cases);
  assert.strictEqual(testResults.length, 2, 'Should run both test cases');
  assert.strictEqual(testResults[0].passed, true, 'Test case 0 should pass');
  assert.strictEqual(testResults[1].passed, true, 'Test case 1 should pass');

  console.log('--- 6. Testing runAllTestCases with Syntax Error (Fast-fail) ---');
  const brokenCode = 'def invalid_syntax(\n';
  const syntaxResults = await runAllTestCases(brokenCode, cases);
  assert.strictEqual(syntaxResults.length, 2, 'Should return results for all cases');
  assert.strictEqual(syntaxResults[0].passed, false, 'Should fail');
  assert.strictEqual(syntaxResults[0].errorType, 'SyntaxError', 'Should have SyntaxError errorType');
  assert(!syntaxResults[0].actualOutput.includes('axiocruit_'), 'Fast fail should sanitize file path');
  assert(syntaxResults[0].actualOutput.includes('File "solution.py"'), 'Fast fail should reference solution.py');

  console.log('--- 7. Testing runAllTestCases with Runtime Error (ZeroDivisionError) ---');
  const runtimeFailResults = await runAllTestCases('print(1 / 0)', cases);
  assert.strictEqual(runtimeFailResults.length, 2, 'Should return results for all cases');
  assert.strictEqual(runtimeFailResults[0].passed, false, 'Runtime error case 0 should fail');
  assert.strictEqual(runtimeFailResults[0].errorType, 'RuntimeError', 'Should classify as RuntimeError');
  assert(!runtimeFailResults[0].actualOutput.includes('axiocruit_'), 'Runtime error actualOutput must not contain axiocruit temp filename');
  assert(runtimeFailResults[0].actualOutput.includes('File "solution.py"'), 'Runtime error actualOutput must reference File "solution.py"');
  assert(runtimeFailResults[0].actualOutput.includes('ZeroDivisionError'), 'Runtime error actualOutput must contain ZeroDivisionError');

  console.log('--- 8. Testing classifyError edge cases ---');
  assert.strictEqual(classifyError(null), 'RuntimeError', 'null should safely default to RuntimeError');
  assert.strictEqual(classifyError(undefined), 'RuntimeError', 'undefined should safely default to RuntimeError');
  assert.strictEqual(classifyError(new Error('SyntaxError: invalid syntax')), 'SyntaxError', 'Error object with SyntaxError');
  assert.strictEqual(classifyError('Execution Timed Out'), 'Timeout', 'Execution Timed Out should classify as Timeout');
  assert.strictEqual(classifyError('SIGTERM'), 'Timeout', 'SIGTERM should classify as Timeout');

  console.log('--- 9. Testing sanitizeErrorOutput with raw OS paths outside File directive ---');
  const os = require('os');
  const rawPathError = `Command failed: python -m py_compile ${path.join(os.tmpdir(), 'axiocruit_syntax_999.py')}`;
  const sanitizedRawPath = sanitizeErrorOutput(rawPathError);
  assert(!sanitizedRawPath.includes('axiocruit_syntax_999'), 'Should sanitize axiocruit temp filename even without File directive');
  assert(sanitizedRawPath.includes('solution.py'), 'Should replace temp filename with solution.py');
  if (os.tmpdir().length > 2) {
    assert(!sanitizedRawPath.includes(os.tmpdir()), 'Should not leak raw os.tmpdir()');
  }

  console.log('\n========================================');
  console.log('ALL CODING TEST SANITIZATION TESTS PASSED');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
