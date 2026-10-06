/**
 * Empirical Live Server Code Submission Test
 * Starts `server/index.js` on port 5099, registers/authenticates a candidate,
 * creates a coding test session, and submits:
 * 1) code with a runtime exception (e.g. 1/0)
 * 2) code with a syntax error
 * 3) valid code passing test cases
 * Confirms that `sanitizeErrorOutput` executes properly without uncaught exceptions or server crash.
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const assert = require('assert');

const TEST_PORT = 5099;

function request(method, pathName, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: pathName,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...headers,
      },
    }, (res) => {
      let chunks = '';
      res.on('data', (d) => { chunks += d.toString(); });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(chunks);
        } catch (_) {
          parsed = chunks;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log(`[Test] Starting server child process on PORT=${TEST_PORT}...`);
  const serverProcess = spawn('node', ['server/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(TEST_PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  let serverFatalCrashed = false;
  let questionsSeeded = false;

  serverProcess.stdout.on('data', (d) => {
    const text = d.toString();
    serverOutput += text;
    process.stdout.write(`[Server stdout] ${text}`);
    if (text.includes('Coding questions seeded successfully') || text.includes('Demo accounts ready')) {
      questionsSeeded = true;
    }
  });

  serverProcess.stderr.on('data', (d) => {
    const text = d.toString();
    serverOutput += text;
    process.stderr.write(`[Server stderr] ${text}`);
    if (text.includes('[Axiocruit Server Fatal] Uncaught Exception') || text.includes('ReferenceError: sanitizeErrorOutput')) {
      serverFatalCrashed = true;
    }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`[Test] Server process exited with code ${code}, signal ${signal}`);
  });

  try {
    // Wait for server to be ready
    console.log('[Test] Polling server readiness on /api/health...');
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(1000);
      try {
        const res = await request('GET', '/api/health');
        if (res.status === 200 || res.status === 404) {
          ready = true;
          break;
        }
      } catch (err) {
        // Retry
      }
    }

    assert(ready, 'Server failed to start within 40 seconds');
    console.log('[Test] Server is UP and responding!');

    // Wait until seed data is finished
    for (let i = 0; i < 20; i++) {
      if (questionsSeeded || serverOutput.includes('Coding questions seeded successfully')) break;
      await sleep(1000);
    }

    // Register a distinct test candidate
    const testCandidateEmail = `test_cand_${Date.now()}@example.com`;
    console.log(`[Test] Registering candidate: ${testCandidateEmail}...`);
    const regRes = await request('POST', '/api/auth/register-candidate', {}, {
      name: 'Test Candidate',
      email: testCandidateEmail,
      password: 'Password123!',
    });

    assert.strictEqual(regRes.status, 201, `Candidate registration failed: ${JSON.stringify(regRes.data)}`);
    const token = regRes.data.token;
    assert(token, 'Token must be present in registration response');
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Start a coding test session
    console.log('[Test] Starting coding test session via POST /api/coding-test/start...');
    const startRes = await request('POST', '/api/coding-test/start', authHeaders, {});
    assert(startRes.status === 200 || startRes.status === 201, `Start test failed: ${JSON.stringify(startRes.data)}`);
    const { sessionId, question } = startRes.data;
    assert(sessionId, 'Session ID must be returned');
    assert(question && question._id, 'Question must be returned');
    console.log(`[Test] Session started: ${sessionId}, Question: "${question.title}" (ID: ${question._id})`);

    // 1. Submit code that causes a Python runtime error (ZeroDivisionError)
    // Previously: crashed the server with `ReferenceError: sanitizeErrorOutput is not defined`!
    console.log('[Test 1] Submitting code that triggers runtime error (1/0)...');
    const errorSubmission = await request('POST', `/api/coding-test/${sessionId}/submit`, authHeaders, {
      questionId: question._id,
      submittedCode: 'def find_items(weights, target):\n    return 1 / 0\n',
    });

    console.log('[Test 1] Error submission response status:', errorSubmission.status);
    assert.strictEqual(errorSubmission.status, 200, `Submission failed: ${JSON.stringify(errorSubmission.data)}`);
    assert.strictEqual(errorSubmission.data.passed, false, 'Error code should not pass');
    assert(!serverFatalCrashed, 'Server MUST NOT have fatal uncaught exception crash');

    const visibleResults = errorSubmission.data.visibleTestResults || [];
    assert(visibleResults.length > 0, 'Must return visible test results');
    for (const vr of visibleResults) {
      assert(!vr.actualOutput.includes('C:\\Users'), 'Output must not leak host paths');
      assert(!vr.actualOutput.includes('AppData'), 'Output must not leak host paths');
      assert(!vr.actualOutput.includes('axiocruit_exec_'), 'Output must not leak temp file names');
    }
    console.log('[Test 1] Passed! Runtime error handled safely without crashing server.');

    // 2. Fetch next question for this session
    console.log('[Test 2] Fetching next question for session...');
    const nextQRes = await request('GET', `/api/coding-test/${sessionId}/next`, authHeaders);
    console.log('[Test 2] Next question response status:', nextQRes.status);
    assert.strictEqual(nextQRes.status, 200, 'Next question should be returned');
    const nextQuestion = nextQRes.data.question;
    if (nextQuestion) {
      // 3. Submit code that causes preflight SyntaxError
      console.log(`[Test 3] Submitting syntax error for question "${nextQuestion.title}"...`);
      const syntaxSubmission = await request('POST', `/api/coding-test/${sessionId}/submit`, authHeaders, {
        questionId: nextQuestion._id,
        submittedCode: 'def bad_syntax(:\n    pass\n',
      });

      console.log('[Test 3] Syntax submission status:', syntaxSubmission.status);
      assert.strictEqual(syntaxSubmission.status, 200, 'Syntax submission should return 200 with error info');
      assert.strictEqual(syntaxSubmission.data.passed, false, 'Syntax error should not pass');
      assert(!serverFatalCrashed, 'Server MUST NOT crash on syntax error preflight');
      console.log('[Test 3] Passed! Preflight syntax error handled safely without crashing server.');
    }

    // 4. Test a completely successful submission with valid code on a new candidate session
    console.log('[Test 4] Starting new session for valid code execution...');
    const validCandidateEmail = `test_cand_valid_${Date.now()}@example.com`;
    const regValid = await request('POST', '/api/auth/register-candidate', {}, {
      name: 'Valid Candidate',
      email: validCandidateEmail,
      password: 'Password123!',
    });
    const validToken = regValid.data.token;
    const validHeaders = { Authorization: `Bearer ${validToken}` };

    const startValid = await request('POST', '/api/coding-test/start', validHeaders, {});
    const validSessionId = startValid.data.sessionId;
    const validQ = startValid.data.question;

    const validSolution = [
      'def find_items(weights, target):',
      '    seen = {}',
      '    for i, w in enumerate(weights):',
      '        diff = target - w',
      '        if diff in seen:',
      '            return [seen[diff], i]',
      '        seen[w] = i',
      '    return []',
    ].join('\n');

    console.log('[Test 4] Submitting valid code for Warehouse Inventory Match...');
    const validSubmission = await request('POST', `/api/coding-test/${validSessionId}/submit`, validHeaders, {
      questionId: validQ._id,
      submittedCode: validSolution,
    });

    console.log('[Test 4] Valid submission status:', validSubmission.status);
    assert.strictEqual(validSubmission.status, 200, 'Valid submission should succeed with 200');
    assert.strictEqual(validSubmission.data.passed, true, 'Valid solution should pass all test cases');
    assert.strictEqual(validSubmission.data.score > 0, true, 'Score should be positive');
    console.log(`[Test 4] Passed! Valid code executed cleanly with score: ${validSubmission.data.score}%`);

    // 5. Verify server is still alive and responsive
    console.log('[Test 5] Verifying server health after multiple submissions...');
    const healthCheck = await request('GET', '/api/health');
    assert(healthCheck.status === 200 || healthCheck.status === 404, 'Server must remain healthy');
    console.log('[Test 5] Server health verified intact!');

    console.log('\n================================================================');
    console.log('SUCCESS: LIVE SERVER CODING TEST SUBMISSION FULLY VERIFIED!');
    console.log('================================================================\n');
  } finally {
    console.log('[Test] Terminating server child process...');
    serverProcess.kill('SIGTERM');
    await sleep(1500);
  }
}

run().catch((err) => {
  console.error('[Test FATAL]', err);
  process.exit(1);
});
