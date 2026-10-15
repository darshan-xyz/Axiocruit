/**
 * Axiocruit Phase 5 Integration Test Suite
 * Tests Adaptive Coding Engine V2, Complete Sandbox Isolation, Polyglot Runners,
 * and Sovereign LLM / Heuristic Fallbacks.
 */

const assert = require('assert');
const os = require('os');
const path = require('path');
const {
  getSafePythonEnv,
  getSafeNodeEnv,
  PYTHON_SECURITY_PRELUDE,
  NODE_SECURITY_PRELUDE,
  sanitizeErrorOutput,
  classifyError,
  smartCompare,
  normalizeOutput,
  executePython,
  executeJavaScript,
  executeTypeScript,
  executeJava,
  executeCpp,
  executePolyglot,
  executeCodeReal,
  runAllTestCases,
  analyzeCodeWithAI,
  sanitizeQuestion,
} = require('../server/controllers/codingTestController');
const { getNextTarget } = require('../server/utils/adaptiveEngine');

async function runPhase5Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 5: ADAPTIVE ENGINE V2 & POLYGLOT SANDBOX ISOLATION    ');
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

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Python Environment & Security Prelude Isolation
  // ───────────────────────────────────────────────────────────────────────────
  await test('Python safe env scrubs sensitive process.env keys', () => {
    process.env.TEST_JWT_SECRET = 'secret_jwt_key_123';
    process.env.TEST_MONGO_URI = 'mongodb://localhost:27017/secret';
    process.env.TEST_OPENAI_KEY = 'sk-secret-key';
    const env = getSafePythonEnv();
    assert.strictEqual(env.TEST_JWT_SECRET, undefined, 'Must scrub TEST_JWT_SECRET');
    assert.strictEqual(env.TEST_MONGO_URI, undefined, 'Must scrub TEST_MONGO_URI');
    assert.strictEqual(env.TEST_OPENAI_KEY, undefined, 'Must scrub TEST_OPENAI_KEY');
    assert.strictEqual(env.PYTHONIOENCODING, 'utf-8');
    assert.strictEqual(env.PYTHONUTF8, '1');
    delete process.env.TEST_JWT_SECRET;
    delete process.env.TEST_MONGO_URI;
    delete process.env.TEST_OPENAI_KEY;
  });

  await test('Python execution does not leak process secrets into child process', async () => {
    process.env.AXIOCRUIT_SUPER_SECRET = 'classified_secret_999';
    const code = `
import os
val = os.environ.get('AXIOCRUIT_SUPER_SECRET', 'CLEAN')
print(f"ENV_STATUS={val}")
`;
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, null);
    assert(res.stdout.includes('ENV_STATUS=CLEAN'), 'Child process must not see secret environment variable');
    delete process.env.AXIOCRUIT_SUPER_SECRET;
  });

  await test('Python security prelude blocks dangerous standard library modules', async () => {
    const code = `
try:
    import subprocess
    print("subprocess_imported")
except Exception as e:
    print(f"BLOCKED:{type(e).__name__}")
`;
    const res = await executePython(code, '');
    assert(!res.stdout.includes('subprocess_imported'), 'Dangerous module subprocess must be blocked');
  });

  await test('Python output is strictly capped at MAX_OUTPUT_BYTES', async () => {
    const code = 'print("Z" * 150000)';
    const res = await executePython(code, '');
    assert.strictEqual(res.errorType, null);
    assert.strictEqual(res.stdout.trim().length, 64 * 1024, 'Output must be capped to 64KB');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. JavaScript / Node.js Sandbox Isolation
  // ───────────────────────────────────────────────────────────────────────────
  await test('Node safe env scrubs sensitive process.env keys', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_secret';
    process.env.MONGO_URI = 'mongodb://root:pass@host/db';
    const env = getSafeNodeEnv();
    assert.strictEqual(env.STRIPE_SECRET_KEY, undefined);
    assert.strictEqual(env.MONGO_URI, undefined);
    assert.strictEqual(env.NODE_ENV, 'production');
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.MONGO_URI;
  });

  await test('executeJavaScript runs valid code and captures stdin/stdout', async () => {
    const code = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log('Result: ' + (parseInt(input, 10) * 2));
`;
    const res = await executeJavaScript(code, '21');
    assert.strictEqual(res.errorType, null);
    assert.strictEqual(res.stdout.trim(), 'Result: 42');
  });

  await test('executeJavaScript blocks restricted modules via NODE_SECURITY_PRELUDE', async () => {
    const code = `
try {
  const cp = require('child_process');
  console.log('cp_loaded');
} catch (err) {
  console.log('MODULE_BLOCKED: ' + err.message);
}
`;
    const res = await executeJavaScript(code, '');
    assert(!res.stdout.includes('cp_loaded'), 'child_process require must be blocked');
    assert(res.stdout.includes('restricted in this sandbox'), 'Error must report restriction');
  });

  await test('executeJavaScript handles SyntaxError and sanitizes temp file paths', async () => {
    const code = 'function broken( { return 42; }';
    const res = await executeJavaScript(code, '');
    assert.strictEqual(res.errorType, 'SyntaxError');
    assert(!res.stderr.includes('axiocruit_exec_'), 'Must scrub internal temp filename');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. TypeScript Sandbox Execution
  // ───────────────────────────────────────────────────────────────────────────
  await test('executeTypeScript transpiles typed code and executes seamlessly', async () => {
    const tsCode = `
interface MathOp {
  compute(a: number, b: number): number;
}
const multiplier: MathOp = {
  compute: (x: number, y: number): number => x * y
};
console.log('TS_OUTPUT: ' + multiplier.compute(6, 7));
`;
    const res = await executeTypeScript(tsCode, '');
    assert.strictEqual(res.errorType, null);
    assert(res.stdout.includes('TS_OUTPUT: 42'), 'TypeScript execution must compute correctly');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Java Sandbox Execution
  // ───────────────────────────────────────────────────────────────────────────
  await test('executeJava compiles and executes Solution class with stdin', async () => {
    const javaCode = `
import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int val = sc.nextInt();
            System.out.println("JAVA_DOUBLED: " + (val * 2));
        } else {
            System.out.println("JAVA_NO_INPUT");
        }
    }
}
`;
    const res = await executeJava(javaCode, '25');
    assert.strictEqual(res.errorType, null);
    assert(res.stdout.includes('JAVA_DOUBLED: 50'), 'Java solution must process stdin and stdout correctly');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Polyglot Dispatcher & executeCodeReal
  // ───────────────────────────────────────────────────────────────────────────
  await test('executePolyglot and executeCodeReal route across languages', async () => {
    const pyRes = await executeCodeReal('print("Python works")', '', 'python');
    assert.strictEqual(pyRes.errorType, null);
    assert(pyRes.stdout.includes('Python works'));

    const jsRes = await executeCodeReal('console.log("JS works")', '', 'javascript');
    assert.strictEqual(jsRes.errorType, null);
    assert(jsRes.stdout.includes('JS works'));

    const tsRes = await executeCodeReal('const msg: string = "TS works"; console.log(msg);', '', 'typescript');
    assert.strictEqual(tsRes.errorType, null);
    assert(tsRes.stdout.includes('TS works'));
  });

  await test('runAllTestCases runs polyglot JavaScript test cases with smart comparison', async () => {
    const jsCode = `
const fs = require('fs');
const raw = fs.readFileSync(0, 'utf-8').trim();
if (raw) {
  const [a, b] = raw.split('\\n').map(Number);
  console.log(a + b);
}
`;
    const cases = [
      { input: '10\n20\n', expectedOutput: '30' },
      { input: '15\n25\n', expectedOutput: '40' },
    ];
    const results = await runAllTestCases(jsCode, cases, 'javascript');
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].passed, true);
    assert.strictEqual(results[1].passed, true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Adaptive Progression Engine & Question Sanitization
  // ───────────────────────────────────────────────────────────────────────────
  await test('getNextTarget implements complete adaptive difficulty ladder', () => {
    // Promotion transitions
    assert.deepStrictEqual(getNextTarget('very_easy', true), { difficulty: 'easy', category: null });
    assert.deepStrictEqual(getNextTarget('easy', true), { difficulty: 'medium', category: 'oop' });
    assert.deepStrictEqual(getNextTarget('medium', true), { difficulty: 'hard', category: 'dsa' });
    assert.deepStrictEqual(getNextTarget('hard', true), { difficulty: 'hard', category: 'dsa' }); // ceiling

    // Demotion transitions
    assert.deepStrictEqual(getNextTarget('hard', false), { difficulty: 'medium', category: 'oop' });
    assert.deepStrictEqual(getNextTarget('medium', false), { difficulty: 'easy', category: null });
    assert.deepStrictEqual(getNextTarget('easy', false), { difficulty: 'very_easy', category: null });
    assert.deepStrictEqual(getNextTarget('very_easy', false), { difficulty: 'very_easy', category: null }); // floor
  });

  await test('sanitizeQuestion strips hidden cases and auto-populates polyglot templates', () => {
    const rawQuestion = {
      _id: '507f1f77bcf86cd799439011',
      title: 'Reverse Words in String',
      description: 'Reverse the sequence of words.',
      functionName: 'reverseWords',
      difficulty: 'medium',
      category: 'dsa',
      visibleTestCases: [{ input: 'hello world', expectedOutput: 'world hello' }],
      hiddenTestCases: [{ input: 'secret test', expectedOutput: 'test secret' }],
      starterCode: 'def reverseWords(s):\n    pass\n',
    };
    const sanitized = sanitizeQuestion(rawQuestion);
    assert.strictEqual(sanitized.hiddenTestCases, undefined, 'hiddenTestCases must be stripped');
    assert.strictEqual(sanitized.visibleTestCases.length, 1, 'visibleTestCases must be preserved');
    assert(sanitized.starterTemplates, 'starterTemplates object must exist');
    assert(sanitized.starterTemplates.python.includes('reverseWords'), 'Python template must include function');
    assert(sanitized.starterTemplates.javascript.includes('function reverseWords'), 'JavaScript template must include function');
    assert(sanitized.starterTemplates.typescript.includes('function reverseWords'), 'TypeScript template must include function');
    assert(sanitized.starterTemplates.java.includes('public class Solution'), 'Java template must include Solution class');
    assert(sanitized.starterTemplates.cpp.includes('#include <iostream>'), 'C++ template must include standard headers');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. AI Logic Analysis & Sovereign Fallback
  // ───────────────────────────────────────────────────────────────────────────
  await test('analyzeCodeWithAI provides sovereign LLM / deterministic fallback without API keys', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const testCode = 'def solution(): return 42';
    const analysis = await analyzeCodeWithAI(testCode, 85, { timeoutMs: 1500 });
    assert(typeof analysis.logicScore === 'number', 'Must return numeric logicScore');
    assert(analysis.accuracyFeedback, 'Must return accuracy feedback');
    assert(analysis.efficiencyFeedback, 'Must return efficiency feedback');
  });

  console.log('\n========================================================================');
  console.log(`TOTAL PHASE 5 INTEGRATION TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase5Tests().catch((err) => {
  console.error('Fatal Phase 5 test error:', err);
  process.exit(1);
});
