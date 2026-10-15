/**
 * Coding Test Controller
 * Handles the adaptive Python coding test lifecycle.
 */

const fs            = require('fs');
const os            = require('os');
const path          = require('path');
const { spawn, exec, execFile } = require('child_process');

const TestSession    = require('../models/TestSession');
const CodingQuestion = require('../models/CodingQuestion');
const { getNextTarget, pickQuestion } = require('../utils/adaptiveEngine');

// Roles that can conduct/manage an interview session (mirrors codingTestRoutes.js)
const HOST_ROLES = ['RECRUITER', 'ADMIN', 'ORGANIZATION', 'INTERVIEWER'];

// ── Configuration ─────────────────────────────────────────────────────────────
// No fixed question limit — the test continues until the recruiter ends it.
const MAX_QUESTIONS    = 999; // Practically infinite
const EXEC_TIMEOUT_MS  = 5000; // Python execution timeout (ms)
const PYTHON_BIN        = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
const MAX_OUTPUT_BYTES  = parseInt(process.env.MAX_OUTPUT_BYTES, 10) || (64 * 1024);

const PYTHON_SECURITY_PRELUDE = `import sys, os; os.system = None; os.popen = None; os.remove = None; os.unlink = None; os.rmdir = None; os.rename = None; os.replace = None\nfor _m in ['subprocess','socket','shutil','ctypes','multiprocessing','urllib','http','ftplib','smtplib','asyncio']: sys.modules[_m] = None\n`;

const getSafePythonEnv = () => {
  const safeEnv = { ...process.env };
  const sensitiveKeys = [
    'MONGO_URI',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'GEMINI_API_KEY',
    'OPENAI_API_KEY',
  ];
  for (const key of Object.keys(safeEnv)) {
    const kUpper = key.toUpperCase();
    if (
      sensitiveKeys.includes(key) ||
      kUpper.includes('SECRET') ||
      kUpper.includes('KEY') ||
      kUpper.includes('TOKEN') ||
      kUpper.includes('PASSWORD') ||
      kUpper.includes('MONGO') ||
      kUpper.includes('URI') ||
      kUpper.includes('URL') ||
      kUpper.includes('CREDENTIAL') ||
      kUpper.includes('AUTH') ||
      kUpper.includes('PASS') ||
      kUpper.includes('PRIVATE')
    ) {
      delete safeEnv[key];
    }
  }
  safeEnv.PYTHONIOENCODING = 'utf-8';
  safeEnv.PYTHONUTF8 = '1';
  return safeEnv;
};


// ─────────────────────────────────────────────────────────────────────────────
// Output Normalization & Smart Comparison
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes an output string for reliable comparison:
 *   1. Remove carriage returns (\r)
 *   2. Trim leading/trailing whitespace
 *   3. Collapse trailing newlines to nothing
 *   4. Normalize internal multiple-blank-lines to single newline
 */
const normalizeOutput = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/\r\n/g, '\n')   // CRLF → LF
    .replace(/\r/g, '\n')     // stray CR → LF
    .trim()                   // leading/trailing whitespace
    .replace(/\n{2,}/g, '\n');// collapse empty lines
};

/**
 * Smart comparison with type coercion:
 *   - If both parse as finite numbers, compare numerically
 *   - If both are boolean-like ("true"/"false"), compare as booleans
 *   - If both parse as JSON arrays/objects, compare structurally
 *   - Otherwise, compare normalized strings
 */
const smartCompare = (actual, expected) => {
  const a = normalizeOutput(actual);
  const e = normalizeOutput(expected);

  // 1. Exact string match (fast path)
  if (a === e) return true;

  // 2. Numeric coercion: "5" vs 5, "3.14" vs 3.14, "6.0" vs "6"
  const numA = Number(a);
  const numE = Number(e);
  if (a !== '' && e !== '' && isFinite(numA) && isFinite(numE)) {
    // For floats, allow tiny epsilon for rounding (e.g., 78.53981... vs 78.54)
    if (numA === numE) return true;
    if (Math.abs(numA - numE) < 0.01) return true;
  }

  // 3. Boolean coercion: Python "True"/"False" vs JS "true"/"false" (case-insensitive)
  const boolMap = { 'true': true, 'false': false };
  const boolA = boolMap[a.toLowerCase()];
  const boolE = boolMap[e.toLowerCase()];
  if (boolA !== undefined && boolE !== undefined && boolA === boolE) {
    return true;
  }

  // 4. Python None equivalence: "None" matches "null", "None", "none"
  if (a.toLowerCase() === 'none' && e.toLowerCase() === 'none') return true;
  if ((a.toLowerCase() === 'none' && e.toLowerCase() === 'null') ||
      (a.toLowerCase() === 'null' && e.toLowerCase() === 'none')) return true;

  // 5. Python collection normalization → JSON structural comparison
  //    Handles: (1,2,3) → [1,2,3], {1,2,3} → [1,2,3], [1, 2, 3] vs [1,2,3]
  //    Also handles Python True/False/None inside collections
  try {
    const pythonToJson = (s) => {
      return s
        .replace(/\(/g, '[').replace(/\)/g, ']')   // tuples → arrays
        .replace(/'/g, '"')                          // single quotes → double quotes
        .replace(/\bTrue\b/g, 'true')               // Python True → JSON true
        .replace(/\bFalse\b/g, 'false')             // Python False → JSON false
        .replace(/\bNone\b/g, 'null');               // Python None → JSON null
    };
    const jsonA = JSON.parse(pythonToJson(a));
    const jsonE = JSON.parse(pythonToJson(e));
    if (JSON.stringify(jsonA) === JSON.stringify(jsonE)) return true;
  } catch (_) { /* not parseable — skip */ }

  // 6. Multi-line: compare line-by-line, smart-comparing each line pair
  //    This handles mixed output like "True\n5\n[1,2]"
  if (a.includes('\n') || e.includes('\n')) {
    const linesA = a.split('\n').map(l => l.trimEnd());
    const linesE = e.split('\n').map(l => l.trimEnd());
    if (linesA.length === linesE.length) {
      const allMatch = linesA.every((lineA, i) => {
        const lineE = linesE[i];
        if (lineA === lineE) return true;
        // Recurse smart comparison on each line (without the multi-line check)
        // — handles "6.0" vs "6" on one line, "True" vs "true" on another
        const nA = Number(lineA);
        const nE = Number(lineE);
        if (lineA !== '' && lineE !== '' && isFinite(nA) && isFinite(nE)) {
          if (nA === nE || Math.abs(nA - nE) < 0.01) return true;
        }
        const bA = boolMap[lineA.toLowerCase()];
        const bE = boolMap[lineE.toLowerCase()];
        if (bA !== undefined && bE !== undefined && bA === bE) return true;
        return false;
      });
      if (allMatch) return true;
    }
  }

  return false;
};

/**
 * Diff-log helper: makes invisible characters visible for terminal debugging.
 * Wraps output in angle-brackets and escapes \n, \r, \t.
 */
const makeVisible = (str) => {
  return String(str)
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
};

const diffLog = (caseLabel, expected, actual, isMatch) => {
  if (isMatch) {
    console.log(`[CodingTest]   [${caseLabel}] ✅ PASS`);
  } else {
    console.log(`[CodingTest]   ┌─ [${caseLabel}] ❌ FAIL`);
    console.log(`[CodingTest]   │ Expected: <"${makeVisible(expected)}">`);
    console.log(`[CodingTest]   │ Actual  : <"${makeVisible(actual)}">`);
    // Show character-level length difference
    const eTrimmed = normalizeOutput(expected);
    const aTrimmed = normalizeOutput(actual);
    if (eTrimmed.length !== aTrimmed.length) {
      console.log(`[CodingTest]   │ Length  : expected ${eTrimmed.length} chars, got ${aTrimmed.length} chars`);
    }
    // Find first differing character position
    for (let i = 0; i < Math.max(eTrimmed.length, aTrimmed.length); i++) {
      if (eTrimmed[i] !== aTrimmed[i]) {
        console.log(`[CodingTest]   │ Diff @${i}: expected char ${eTrimmed.charCodeAt(i) || 'EOF'} got ${aTrimmed.charCodeAt(i) || 'EOF'}`);
        break;
      }
    }
    console.log(`[CodingTest]   └─────────────────────────────────────`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Sandbox Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classifies a raw stderr/message string into a user-friendly error type.
 * @param {string} errText
 * @returns {'SyntaxError'|'Timeout'|'RuntimeError'}
 */
const classifyError = (errText = '') => {
  const text = String(errText || '');
  if (text.includes('SyntaxError'))      return 'SyntaxError';
  if (text.includes('ETIMEDOUT') ||
      text.includes('spawnSync') ||
      text.includes('SIGTERM') ||
      text.includes('TimeLimitExceeded') ||
      text.includes('Execution Timed Out')) return 'Timeout';
  return 'RuntimeError';
};

/**
 * Strips host machine paths and internal temp filenames from Python error tracebacks
 * for security and clean display.
 * @param {any} errText
 * @returns {string}
 */
const sanitizeErrorOutput = (errText) => {
  if (!errText) return '';
  const raw = typeof errText === 'string'
    ? errText
    : (errText.stderr || errText.message || String(errText));

  let sanitized = String(raw);

  // 1. Scrub File "..." pattern and adjust line numbers for temp execution files with prelude
  sanitized = sanitized.replace(/File\s+["']([^"']*axiocruit_[^"']*\.py)["'],\s*line\s*(\d+)/gi, (match, filePath, lineNum) => {
    const adjusted = Math.max(1, parseInt(lineNum, 10) - 2);
    return `File "solution.py", line ${adjusted}`;
  });

  // 2. Scrub any remaining File "..." pattern (standard Python tracebacks)
  sanitized = sanitized.replace(/File\s+["'].*?\.py["']/gi, 'File "solution.py"');

  // 3. Scrub any direct references to temp axiocruit python files
  sanitized = sanitized.replace(/[^\s"'`()<>]+axiocruit_[^\s"'`()<>]+\.py/gi, 'solution.py');
  sanitized = sanitized.replace(/axiocruit_[^\s"'`()<>]+\.py/gi, 'solution.py');

  // 3. Scrub host temp directory and user home directory if present
  try {
    const tmpDir = os.tmpdir();
    if (tmpDir && tmpDir.length > 2) {
      const escapedTmp = tmpDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escapedTmp, 'gi'), '/tmp');
      const fwdTmp = tmpDir.replace(/\\/g, '/');
      const escapedFwdTmp = fwdTmp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escapedFwdTmp, 'gi'), '/tmp');
    }

    const homeDir = os.homedir();
    if (homeDir && homeDir.length > 2) {
      const escapedHome = homeDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escapedHome, 'gi'), '~');
      const fwdHome = homeDir.replace(/\\/g, '/');
      const escapedFwdHome = fwdHome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      sanitized = sanitized.replace(new RegExp(escapedFwdHome, 'gi'), '~');
    }
  } catch (_) {}

  return sanitized.trim();
};

/**
 * Runs a single already-written python script against ONE set of stdin/stdout.
 * The file must already exist at `tmpFile`.
 *
 * @param {string} tmpFile       — absolute path to the already-written .py file
 * @param {string} input         — stdin string to feed
 * @param {string} expectedOutput— expected stdout (trimmed comparison)
 * @returns {{ passed: boolean, actualOutput: string, errorType: string|null }}
 */
const runOneCase = (tmpFile, input, expectedOutput) => {
  return new Promise((resolve) => {
    let completed = false;
    const finish = (result) => {
      if (completed) return;
      completed = true;
      resolve(result);
    };

    const child = spawn(PYTHON_BIN, ['-I', '-B', '-X', 'utf8', tmpFile], {
      timeout: EXEC_TIMEOUT_MS,
      cwd: os.tmpdir(),
      env: getSafePythonEnv(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let stdoutBytes = 0;
    let stderrBytes = 0;

    child.stdin.on('error', () => {});

    if (input) {
      try {
        child.stdin.write(input);
        child.stdin.end();
      } catch (_) {}
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (d) => {
      if (stdoutBytes < MAX_OUTPUT_BYTES) {
        const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
        stdout += d.toString('utf8').slice(0, remaining);
        stdoutBytes += d.length;
      }
    });
    child.stderr.on('data', (d) => {
      if (stderrBytes < MAX_OUTPUT_BYTES) {
        const remaining = MAX_OUTPUT_BYTES - stderrBytes;
        stderr += d.toString('utf8').slice(0, remaining);
        stderrBytes += d.length;
      }
    });

    child.on('error', (err) => {
      const errText = stderr + (err.message || '');
      finish({
        passed: false,
        actualOutput: sanitizeErrorOutput(errText || 'Execution process error'),
        errorType: classifyError(errText),
      });
    });

    child.on('close', (code, signal) => {
      const isTimeout = signal === 'SIGTERM' || child.killed;
      if (isTimeout) {
        return finish({
          passed: false,
          actualOutput: 'Execution Timed Out',
          errorType: 'TimeLimitExceeded',
        });
      }

      // If the process crashed with non-zero exit code or generated error output
      if (code !== 0 || stderr) {
        const errText = (stderr || '').trimEnd() || `Process exited with code ${code}`;
        return finish({
          passed: false,
          actualOutput: sanitizeErrorOutput(errText),
          errorType: classifyError(errText),
        });
      }

      const actualOutput = normalizeOutput(stdout);
      const isMatch = smartCompare(actualOutput, expectedOutput);
      finish({
        passed: isMatch,
        actualOutput,
        errorType: null,
      });
    });
  });
};

/**
 * Writes `code` to a unique temp file, executes it against every test case asynchronously,
 * then deletes the file. Returns per-case result objects.
 *
 * @param {string} code
 * @param {{ input: string, expectedOutput: string }[]} testCases
 * @returns {Promise<{ passed: boolean, actualOutput: string, errorType: string|null }[]>}
 */
const runAllTestCases = async (code, testCases) => {
  const tmpFile = path.join(
    os.tmpdir(),
    `axiocruit_${Date.now()}_${Math.random().toString(36).slice(2)}.py`,
  );

  try {
    await fs.promises.writeFile(tmpFile, PYTHON_SECURITY_PRELUDE + code, 'utf8');

    // Fast-fail on SyntaxError: check compile asynchronously
    let syntaxErrorText = null;
    try {
      await new Promise((resolve, reject) => {
        execFile(PYTHON_BIN, ['-I', '-B', '-X', 'utf8', '-m', 'py_compile', tmpFile], { timeout: 3000, cwd: os.tmpdir(), env: getSafePythonEnv() }, (err, stdout, stderr) => {
          if (err) reject(stderr || err.message);
          else resolve();
        });
      });
    } catch (syntaxErr) {
      syntaxErrorText = sanitizeErrorOutput(syntaxErr);
    }

    if (syntaxErrorText) {
      return testCases.map(() => ({
        passed: false,
        actualOutput: syntaxErrorText,
        errorType: 'SyntaxError',
      }));
    }

    // Run test cases sequentially
    const results = [];
    let timeoutCount = 0;
    for (const tc of testCases) {
      if (timeoutCount >= 2) {
        results.push({
          passed: false,
          actualOutput: 'Execution Timed Out',
          errorType: 'TimeLimitExceeded',
        });
        continue;
      }
      const res = await runOneCase(tmpFile, tc.input, tc.expectedOutput);
      if (res.errorType === 'TimeLimitExceeded' || res.errorType === 'Timeout') {
        timeoutCount++;
      }
      results.push(res);
    }
    return results;
  } finally {
    try { await fs.promises.unlink(tmpFile); } catch (_) {}
  }
};

/**
 * Asynchronous non-blocking wrapper to execute Python code for a single input.
 * Returns { stdout, stderr, errorType } for rich error reporting.
 */
const executePython = (code, input) => {
  return new Promise((resolve) => {
    const tmpFile = path.join(
      os.tmpdir(),
      `axiocruit_exec_${Date.now()}_${Math.random().toString(36).slice(2)}.py`
    );

    let completed = false;
    const finish = (result) => {
      if (completed) return;
      completed = true;
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      resolve(result);
    };

    fs.writeFile(tmpFile, PYTHON_SECURITY_PRELUDE + code, 'utf8', (writeErr) => {
      if (writeErr) {
        return finish({
          stdout: '',
          stderr: sanitizeErrorOutput('Failed to write execution script: ' + writeErr.message),
          errorType: 'SystemError',
        });
      }

      const child = spawn(PYTHON_BIN, ['-I', '-B', '-X', 'utf8', tmpFile], {
        timeout: EXEC_TIMEOUT_MS,
        cwd: os.tmpdir(),
        env: getSafePythonEnv(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let stdoutBytes = 0;
      let stderrBytes = 0;

      child.stdin.on('error', () => {});

      if (input) {
        try {
          child.stdin.write(input);
          child.stdin.end();
        } catch (_) {}
      } else {
        child.stdin.end();
      }

      child.stdout.on('data', (d) => {
        if (stdoutBytes < MAX_OUTPUT_BYTES) {
          const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
          stdout += d.toString('utf8').slice(0, remaining);
          stdoutBytes += d.length;
        }
      });
      child.stderr.on('data', (d) => {
        if (stderrBytes < MAX_OUTPUT_BYTES) {
          const remaining = MAX_OUTPUT_BYTES - stderrBytes;
          stderr += d.toString('utf8').slice(0, remaining);
          stderrBytes += d.length;
        }
      });

      child.on('error', (err) => {
        finish({
          stdout,
          stderr: sanitizeErrorOutput(err.message || 'Execution error'),
          errorType: classifyError(err.message || ''),
        });
      });

      child.on('close', (code, signal) => {
        const isTimeout = signal === 'SIGTERM' || child.killed;
        const errText = (stderr || '').trimEnd();
        const hasError = isTimeout || code !== 0 || errText.length > 0;
        const errDescription = isTimeout
          ? 'Execution Timed Out'
          : errText || (code !== 0 ? `Process exited with code ${code}` : '');

        finish({
          stdout,
          stderr: sanitizeErrorOutput(errDescription),
          errorType: isTimeout
            ? 'TimeLimitExceeded'
            : (hasError ? classifyError(errDescription) : null),
        });
      });
    });
  });
};

/**
 * Hardened real Python code execution helper
 * Protects against secret leakage by applying getSafePythonEnv() and PYTHON_SECURITY_PRELUDE
 */
const executeCodeReal = (code, input) => {
  return executePython(code, input);
};

// ─────────────────────────────────────────────────────────────────────────────
// AI Logic Analyzer
// ─────────────────────────────────────────────────────────────────────────────
const analyzeCodeWithAI = async (code, testScore) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn("[CodingTest] No AI API Key found. Returning default AI score.");
      return { 
        logicScore: testScore, 
        accuracyFeedback: 'AI analysis unavailable (Missing API Key)', 
        efficiencyFeedback: 'AI analysis unavailable' 
      };
    }

    const prompt = `Analyze this Python code. The candidate scored ${testScore}% on the basic test cases. Evaluate the code's time complexity, logic accuracy, and readability. Provide a JSON response with: 'logicScore' (0-100), 'accuracyFeedback', and 'efficiencyFeedback'.\n\nCode:\n${code}`;

    const fetchFn = global.fetch || require('node-fetch');

    if (apiKey.startsWith('AIza') || process.env.GEMINI_API_KEY) {
      // Gemini
      const response = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await response.json();
      if (!data.candidates || !data.candidates[0]) throw new Error("Invalid Gemini response");
      const resultText = data.candidates[0].content.parts[0].text;
      return JSON.parse(resultText);
    } else {
      // OpenAI
      const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: "json_object" },
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await response.json();
      if (!data.choices || !data.choices[0]) throw new Error("Invalid OpenAI response");
      return JSON.parse(data.choices[0].message.content);
    }
  } catch (err) {
    console.error("[CodingTest] AI Analysis error:", err);
    return { 
      logicScore: testScore, 
      accuracyFeedback: 'Error during AI analysis', 
      efficiencyFeedback: 'Error during AI analysis' 
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: strip hidden test cases before sending question to client
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeQuestion = (q) => {
  const obj = q.toObject ? q.toObject() : { ...q };
  delete obj.hiddenTestCases;
  return obj;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coding-test/start
// Body: { jobId }
// Auth: CANDIDATE only
// ─────────────────────────────────────────────────────────────────────────────
const startSession = async (req, res) => {
  try {
    const { jobId, candidateId: bodyCandidateId } = req.body;
    let candidateId = req.user._id;

    // Allow recruiters to start tests on behalf of a candidate
    if (req.user.role !== 'CANDIDATE' && req.user.role !== 'candidate' && bodyCandidateId) {
      candidateId = bodyCandidateId;
    }

    const sessionQuery = { candidateId, status: 'in_progress' };
    if (jobId) {
      sessionQuery.jobId = jobId;
    }

    // Prevent duplicate in-progress sessions for the same candidate + job
    const existing = await TestSession.findOne(sessionQuery);
    if (existing) {
      // Rather than erroring, seamlessly resume the test
      const lastQuestionId = existing.questionsAsked[existing.questionsAsked.length - 1];
      const currentQuestion = await CodingQuestion.findById(lastQuestionId);
      
      return res.status(200).json({
        sessionId: existing._id,
        questionNumber: existing.questionsAsked.length,
        totalQuestions: MAX_QUESTIONS,
        currentDifficulty: existing.currentDifficulty,
        question: currentQuestion ? sanitizeQuestion(currentQuestion) : null,
      });
    }

    // Pick the first question at default difficulty (easy)
    const firstQuestion = await pickQuestion('easy', null, []);
    if (!firstQuestion) {
      return res.status(503).json({ message: 'No questions available. Please contact support.' });
    }

    const sessionData = {
      candidateId,
      currentDifficulty: 'easy',
      questionsAsked: [firstQuestion._id],
      responses: [],
      status: 'in_progress',
    };
    if (jobId) {
      sessionData.jobId = jobId;
    }

    const session = await TestSession.create(sessionData);

    return res.status(201).json({
      sessionId: session._id,
      questionNumber: 1,
      totalQuestions: MAX_QUESTIONS,
      currentDifficulty: session.currentDifficulty,
      question: sanitizeQuestion(firstQuestion),
    });
  } catch (err) {
    console.error('[CodingTest] startSession error:', err);
    return res.status(500).json({ message: 'Failed to start test session' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coding-test/next-question?jobId=...
// Auth: CANDIDATE 
// Auto-creates a session if one doesn't exist for the candidate and job.
// ─────────────────────────────────────────────────────────────────────────────
const getNextQuestionAuto = async (req, res) => {
  try {
    const { jobId } = req.query;
    const candidateId = req.user._id;

    const sessionQuery = { candidateId, status: 'in_progress' };
    if (jobId) {
      sessionQuery.jobId = jobId;
    }

    let session = await TestSession.findOne(sessionQuery);

    if (!session) {
      // Auto-create
      const firstQuestion = await pickQuestion('easy', null, []);
      if (!firstQuestion) {
        return res.status(503).json({ message: 'No questions available.' });
      }
      const newSessionData = {
        candidateId,
        currentDifficulty: 'easy',
        questionsAsked: [firstQuestion._id],
        responses: [],
        status: 'in_progress',
      };
      if (jobId) {
        newSessionData.jobId = jobId;
      }
      session = await TestSession.create(newSessionData);
      return res.json({
        sessionId: session._id,
        questionNumber: 1,
        currentDifficulty: 'easy',
        currentCategory: null,
        question: sanitizeQuestion(firstQuestion),
      });
    }

    // Session exists. Process next question logic.
    if (session.responses.length === 0) {
      const q = await CodingQuestion.findById(session.questionsAsked[0]);
      return res.json({
        sessionId: session._id,
        questionNumber: 1,
        currentDifficulty: session.currentDifficulty,
        currentCategory: session.currentCategory,
        question: sanitizeQuestion(q),
      });
    }

    let targetDifficulty = session.currentDifficulty;
    let targetCategory   = session.currentCategory || null;

    const lastResponse = session.responses[session.responses.length - 1];
    const target = getNextTarget(session.currentDifficulty, lastResponse.passed);
    targetDifficulty = target.difficulty;
    targetCategory   = target.category;

    session.currentDifficulty = targetDifficulty;
    session.currentCategory   = targetCategory;

    if (session.jobId && session.responses.length >= 5) {
      const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
      session.finalScore  = session.responses.length > 0
        ? Math.round(totalScore / session.responses.length)
        : 0;
      session.status      = 'completed';
      session.completedAt = new Date();
      await session.save();
      return res.json({ done: true, finalScore: session.finalScore, sessionId: session._id });
    }

    const question = await pickQuestion(targetDifficulty, targetCategory, session.questionsAsked);

    if (!question) {
      const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
      session.finalScore  = session.responses.length > 0
        ? Math.round(totalScore / session.responses.length)
        : 0;
      session.status      = 'completed';
      session.completedAt = new Date();
      await session.save();
      return res.json({ done: true, finalScore: session.finalScore, sessionId: session._id });
    }

    session.questionsAsked.push(question._id);
    await session.save();

    return res.json({
      sessionId: session._id,
      questionNumber: session.responses.length + 1,
      currentDifficulty: targetDifficulty,
      currentCategory: targetCategory,
      question: sanitizeQuestion(question),
    });
  } catch (err) {
    console.error('[CodingTest] getNextQuestionAuto error:', err);
    return res.status(500).json({ message: 'Failed to fetch next question' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coding-test/:sessionId/next
// Auth: CANDIDATE (must own session)
//
// Adaptive progression logic:
//   • Q1 is always served by startSession (easy / any).
//   • Subsequent calls read the last response to determine
//     the next {difficulty, category} target via getNextTarget.
// ─────────────────────────────────────────────────────────────────────────────
const getNextQuestion = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.sessionId);

    if (!session) return res.status(404).json({ message: 'Session not found' });
    const isCandidate = (req.user.role === 'CANDIDATE' || req.user.role === 'candidate');
    if (isCandidate && session.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your session' });
    }
    if (session.status === 'completed') {
      return res.json({ done: true, sessionId: session._id, finalScore: session.finalScore });
    }

    // ── Guard: session already completed or reached question limit ───
    if (session.jobId && session.responses.length >= 5) {
      const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
      session.finalScore  = session.responses.length > 0
        ? Math.round(totalScore / session.responses.length)
        : 0;
      session.status      = 'completed';
      session.completedAt = new Date();
      await session.save();
      return res.json({ done: true, finalScore: session.finalScore, sessionId: session._id });
    }

    // ── Determine the adaptive target ────────────────────────────────────────
    // If no answers yet, Q1 was already served by startSession — this
    // call is asking for Q2+, so base the target on the last response.
    let targetDifficulty = session.currentDifficulty;
    let targetCategory   = session.currentCategory || null;

    if (session.responses.length > 0) {
      const lastResponse = session.responses[session.responses.length - 1];
      const target = getNextTarget(session.currentDifficulty, lastResponse.passed);
      targetDifficulty = target.difficulty;
      targetCategory   = target.category;

      // Persist the updated target on the session for submitAnswer to reference
      session.currentDifficulty = targetDifficulty;
      session.currentCategory   = targetCategory;
    }

    console.log(
      `[Adaptive] Q${session.responses.length + 1}: ` +
      `last=${session.currentDifficulty} → next=${targetDifficulty}/${targetCategory ?? 'any'}`
    );

    // ── Fetch random unseen question for this target ─────────────────────────
    const question = await pickQuestion(
      targetDifficulty,
      targetCategory,
      session.questionsAsked
    );

    if (!question) {
      // Bank exhausted for this candidate — finalise session gracefully
      const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
      session.finalScore  = session.responses.length > 0
        ? Math.round(totalScore / session.responses.length)
        : 0;
      session.status      = 'completed';
      session.completedAt = new Date();
      await session.save();
      return res.json({ done: true, finalScore: session.finalScore, sessionId: session._id });
    }

    // Track this question so it is never repeated
    session.questionsAsked.push(question._id);
    await session.save();

    return res.json({
      questionNumber:    session.responses.length + 1,
      currentDifficulty: targetDifficulty,
      currentCategory:   targetCategory,
      question:          sanitizeQuestion(question),
    });
  } catch (err) {
    console.error('[CodingTest] getNextQuestion error:', err);
    return res.status(500).json({ message: 'Failed to fetch next question' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coding-test/:sessionId/submit
// Body: { questionId, submittedCode }
// Auth: CANDIDATE (must own session)
//
// Execution model (dual-pass):
//   Pass 1 — run against visibleTestCases (results returned to client).
//   Pass 2 — run against hiddenTestCases  (results used for scoring only;
//             actual outputs NEVER leave the server).
//
// Scoring: score = (hiddenPassed / hiddenTotal) * 100
// Pass:    all hidden test cases must pass (score === 100)
// ─────────────────────────────────────────────────────────────────────────────
const submitAnswer = async (req, res) => {
  try {
    const { questionId, submittedCode } = req.body;

    // ── Input validation ─────────────────────────────────────────────────
    if (!questionId || typeof submittedCode !== 'string' || submittedCode.trim() === '') {
      return res.status(400).json({ message: 'questionId and non-empty submittedCode are required' });
    }

    // ── Session guards ──────────────────────────────────────────────────
    const session = await TestSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    const isCandidate = (req.user.role === 'CANDIDATE' || req.user.role === 'candidate');
    if (isCandidate && session.candidateId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your session' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Session is already completed' });
    }

    // Verify question belongs to this session
    const questionBelongs = session.questionsAsked.some(id => id.toString() === questionId);
    if (!questionBelongs) {
      return res.status(400).json({ message: 'This question is not part of your session' });
    }

    // Prevent double-submission
    const alreadySubmitted = session.responses.some(r => r.questionId.toString() === questionId);
    if (alreadySubmitted) {
      return res.status(400).json({ message: 'You have already submitted an answer for this question' });
    }

    // ── Fetch question (server-side, with hidden cases) ───────────────────
    const question = await CodingQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    console.log(`[CodingTest] Running submission for question "${question.title}" ` +
      `(${question.difficulty}/${question.category}) — ` +
      `${question.visibleTestCases.length} visible, ${question.hiddenTestCases.length} hidden`);

    // ── Pre-flight syntax validation via py_compile ─────────────────────────
    const tmpSyntaxFile = path.join(
      os.tmpdir(),
      `axiocruit_syntax_${Date.now()}_${Math.random().toString(36).slice(2)}.py`,
    );
    let syntaxErrorText = null;
    try {
      await fs.promises.writeFile(tmpSyntaxFile, PYTHON_SECURITY_PRELUDE + submittedCode, 'utf8');
      await new Promise((resolve, reject) => {
        execFile(PYTHON_BIN, ['-I', '-B', '-X', 'utf8', '-m', 'py_compile', tmpSyntaxFile], { timeout: 3000, cwd: os.tmpdir(), env: getSafePythonEnv() }, (err, stdout, stderr) => {
          if (err) reject(stderr || err.message);
          else resolve();
        });
      });
    } catch (syntaxErr) {
      syntaxErrorText = sanitizeErrorOutput(syntaxErr);
    } finally {
      try { await fs.promises.unlink(tmpSyntaxFile); } catch (_) {}
    }

    if (syntaxErrorText) {
      console.log(`[CodingTest] Pre-flight syntax error detected: ${syntaxErrorText}`);
      const visibleResultsForClient = (question.visibleTestCases || []).map((tc, idx) => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: idx === 0 ? syntaxErrorText : 'Syntax error in submitted code',
        passed: false,
        errorType: 'SyntaxError',
      }));
      const hiddenSummaryForClient = {
        total: (question.hiddenTestCases || []).length,
        passed: 0,
        failed: (question.hiddenTestCases || []).length,
      };

      session.responses.push({
        questionId,
        submittedCode,
        passed: false,
        score: 0,
        aiAnalysis: {
          logicScore: 0,
          accuracyFeedback: 'Code contains syntax errors and could not be executed.',
          efficiencyFeedback: 'SyntaxError',
        },
      });

      const nextTarget = getNextTarget(session.currentDifficulty, false);
      session.currentDifficulty = nextTarget.difficulty;
      session.currentCategory   = nextTarget.category;

      let finalScore = null;
      if (session.jobId && session.responses.length >= 5) {
        const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
        session.finalScore = Math.round(totalScore / session.responses.length);
        session.status = 'completed';
        session.completedAt = new Date();
        finalScore = session.finalScore;
      }
      await session.save();

      return res.json({
        passed: false,
        score: 0,
        aiAnalysis: {
          logicScore: 0,
          accuracyFeedback: 'Code contains syntax errors and could not be executed.',
          efficiencyFeedback: 'SyntaxError',
        },
        visibleTestResults: visibleResultsForClient,
        hiddenTestSummary: hiddenSummaryForClient,
        nextDifficulty:  nextTarget.difficulty,
        nextCategory:    nextTarget.category,
        questionNumber:  session.responses.length,
        sessionComplete: session.status === 'completed',
        ...(finalScore !== null ? { finalScore } : {}),
      });
    }

    // ── Determine execution mode ──────────────────────────────────────
    //   MODE A (function-call): Question has a functionName → append print(fn(input))
    //   MODE B (stdin):         No functionName → pipe tc.input as stdin
    const useFunctionMode = question.functionName && question.functionName.trim() !== '';
    console.log(`[CodingTest] ═══════════════════════════════════════════════════`);
    console.log(`[CodingTest] Execution mode: ${useFunctionMode ? 'FUNCTION-CALL' : 'STDIN'}`);
    console.log(`[CodingTest]   functionName: "${question.functionName || '(none)'}"`);
    console.log(`[CodingTest]   Submitted code length: ${submittedCode.length} chars`);

    // ── PASS 1 & 2: All test cases combined (scoring) ─────────────────────────
    const allTestCases = [...question.visibleTestCases, ...question.hiddenTestCases];
    let passedCases = 0;
    const totalCases = allTestCases.length;
    
    const visibleResultsForClient = [];
    const hiddenTotal = question.hiddenTestCases.length;
    let hiddenPassed = 0;
    let currentIndex = 0;
    let consecutiveTimeouts = 0;

    console.log(`[CodingTest]   Total test cases: ${totalCases} (${question.visibleTestCases.length} visible, ${hiddenTotal} hidden)`);

    // Loop through all cases
    for (const tc of allTestCases) {
        const isVisible = currentIndex < question.visibleTestCases.length;
        const caseLabel = isVisible ? `visible[${currentIndex}]` : `hidden[${currentIndex - question.visibleTestCases.length}]`;

        let execResult;

        if (consecutiveTimeouts >= 2) {
            execResult = {
                stdout: '',
                stderr: 'Execution Timed Out',
                errorType: 'TimeLimitExceeded',
            };
        } else if (useFunctionMode) {
            // MODE A: Function-call — safely unpack arguments from stdin via ast.literal_eval
            const runnerCode = [
              submittedCode,
              '',
              'import sys, ast',
              'try:',
              '    _raw_stdin = sys.stdin.read().strip()',
              '    if _raw_stdin:',
              '        try:',
              `            _args = ast.literal_eval(f"({_raw_stdin},)")`,
              `            print(${question.functionName}(*_args))`,
              '        except (ValueError, SyntaxError):',
              `            print(${question.functionName}(_raw_stdin))`,
              '    else:',
              `        print(${question.functionName}())`,
              'except Exception as _e:',
              '    raise',
            ].join('\n');
            console.log(`[CodingTest]   [${caseLabel}] MODE-A: Running ${question.functionName} via stdin unpack → "${(tc.input || '').substring(0, 80)}"`);
            execResult = await executePython(runnerCode, tc.input || '');
        } else {
            // MODE B: Stdin — run the submitted code as-is, providing tc.input via stdin
            console.log(`[CodingTest]   [${caseLabel}] MODE-B: Running with stdin → "${(tc.input || '').substring(0, 80)}"`);
            execResult = await executePython(submittedCode, tc.input || '');
        }

        if (execResult.errorType === 'TimeLimitExceeded' || execResult.errorType === 'Timeout') {
            consecutiveTimeouts++;
        }

        // Normalize both sides with the robust normalizer
        const actualNorm = normalizeOutput(execResult.stdout);
        const expectedNorm = normalizeOutput(tc.expectedOutput);

        // Use smart comparison (handles type coercion, whitespace, JSON, etc.)
        const isMatch = execResult.errorType
            ? false  // If there was an execution error, it's an automatic fail
            : smartCompare(actualNorm, expectedNorm);

        // Detailed diff log to terminal (makes invisible chars visible)
        diffLog(caseLabel, tc.expectedOutput, execResult.errorType ? execResult.stderr : execResult.stdout, isMatch);

        if (isMatch) {
            passedCases++;
            if (!isVisible) hiddenPassed++;
        }

        if (isVisible) {
             visibleResultsForClient.push({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                actualOutput: execResult.errorType ? execResult.stderr : actualNorm,
                passed: isMatch,
                errorType: execResult.errorType,
            });
        }
        currentIndex++;
    }

    const testCaseScore = totalCases > 0 ? (passedCases / totalCases) * 100 : 0; // Exact percentage

    // Score = percentage of all test cases passed for dynamic grading
    const testScore = Math.round(testCaseScore);
    // "Pass" logic is up to interpretation, traditionally 100%
    const passed = passedCases === totalCases && totalCases > 0;

    // Hidden summary (counts only, no actual output)
    const hiddenSummaryForClient = {
      total:  hiddenTotal,
      passed: hiddenPassed,
      failed: hiddenTotal - hiddenPassed,
    };

    console.log(`[CodingTest] ───────────────────────────────────────────────────`);
    console.log(`[CodingTest] RESULT: ${passedCases}/${totalCases} passed (${testScore}%) — ${passed ? 'PASSED' : 'FAILED'}`);

    // AI Logic Analysis
    const aiAnalysis = await analyzeCodeWithAI(submittedCode, testScore);
    const logicScore = Number(aiAnalysis.logicScore) || testScore;
    
    // Final Blended Score (70% automated, 30% AI)
    const finalScoreMix = Math.round((testScore * 0.7) + (logicScore * 0.3));

    console.log('[CodingTest] Original Test Score: ' + testScore + '%, AI Logic Score: ' + logicScore + '%, Final Blended Score: ' + finalScoreMix + '%');
    console.log(`[CodingTest] ═══════════════════════════════════════════════════`);

    // ── Persist response & update adaptive state ───────────────────────────
    session.responses.push({ 
      questionId, 
      submittedCode, 
      passed, 
      score: finalScoreMix, 
      aiAnalysis 
    });

    // Feed pass/fail into the adaptive engine to prepare the next target
    const nextTarget = getNextTarget(session.currentDifficulty, passed);
    session.currentDifficulty = nextTarget.difficulty;
    session.currentCategory   = nextTarget.category;

    // Auto-complete if job-specific assessment has reached 5 questions
    let finalScore = null;
    if (session.jobId && session.responses.length >= 5) {
      const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
      session.finalScore = Math.round(totalScore / session.responses.length);
      session.status = 'completed';
      session.completedAt = new Date();
      finalScore = session.finalScore;
    }

    await session.save();

    // ── Build response ───────────────────────────────────────────────────
    return res.json({
      // Overall verdict
      passed,
      score: finalScoreMix,
      aiAnalysis,

      // Visible test case results — full detail for the candidate
      visibleTestResults: visibleResultsForClient,

      // Hidden test case summary — counts only, never actual outputs
      hiddenTestSummary: hiddenSummaryForClient,

      // Adaptive engine output
      nextDifficulty:  nextTarget.difficulty,
      nextCategory:    nextTarget.category,

      // Progress metadata
      questionNumber:  session.responses.length,
      sessionComplete: session.status === 'completed',
      ...(finalScore !== null ? { finalScore } : {}),
    });
  } catch (err) {
    console.error('[CodingTest] submitAnswer error:', err);
    return res.status(500).json({ message: 'Failed to submit answer' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coding-test/:sessionId/result
// Auth: CANDIDATE (own session) or RECRUITER / ADMIN
// ─────────────────────────────────────────────────────────────────────────────
const getResult = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.sessionId)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .populate('questionsAsked', 'title difficulty category');

    if (!session) return res.status(404).json({ message: 'Session not found' });

    const userId = req.user._id.toString();
    const role   = req.user.role;

    const isOwner      = session.candidateId?._id?.toString() === userId;
    const isPrivileged = HOST_ROLES.includes(role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to view this result' });
    }

    return res.json(session);
  } catch (err) {
    console.error('[CodingTest] getResult error:', err);
    return res.status(500).json({ message: 'Failed to retrieve result' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/coding-test/job/:jobId/candidate/:candidateId
// Auth: RECRUITER / ADMIN / organization
// ─────────────────────────────────────────────────────────────────────────────
const getSessionByCandidateAndJob = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const session = await TestSession.findOne({ jobId, candidateId })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title company')
      .populate('questionsAsked', 'title difficulty category');

    if (!session) return res.status(404).json({ message: 'No test session found for this candidate' });

    // Validate role: Allow host roles or candidate viewing their own session
    const role = req.user.role;
    const isPrivileged = HOST_ROLES.includes(role);
    const isOwnerCandidate = session.candidateId?._id?.toString() === req.user._id?.toString() ||
                             session.candidateId?.toString() === req.user._id?.toString();
    if (!isPrivileged && !isOwnerCandidate) return res.status(403).json({ message: 'Not authorized' });

    return res.json(session);
  } catch (err) {
    console.error('[CodingTest] getSession error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/coding-test/:sessionId/end
// Auth: RECRUITER / ADMIN / organization (only host can end the test)
//
// Manually ends a coding test session. Computes the final score from all
// responses submitted so far and marks the session as completed.
// ─────────────────────────────────────────────────────────────────────────────
const endSession = async (req, res) => {
  try {
    const session = await TestSession.findById(req.params.sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Only host roles can end a session (recruiter, org admin, or assigned interviewer/freelancer)
    const role = req.user.role;
    const isPrivileged = HOST_ROLES.includes(role);
    if (!isPrivileged) {
      return res.status(403).json({ message: 'Only a host (recruiter, admin, or assigned interviewer) can end a test session' });
    }

    if (session.status === 'completed') {
      return res.json({
        message: 'Session is already completed',
        sessionId: session._id,
        finalScore: session.finalScore,
        totalAnswered: session.responses.length,
      });
    }

    // Compute final score from all submitted responses
    const totalScore = session.responses.reduce((sum, r) => sum + (r.score || 0), 0);
    session.finalScore  = session.responses.length > 0
      ? Math.round(totalScore / session.responses.length)
      : 0;
    session.status      = 'completed';
    session.completedAt = new Date();
    await session.save();

    console.log(`[CodingTest] Session ${session._id} ended by ${role}. ` +
      `Final score: ${session.finalScore}% (${session.responses.length} questions answered)`);

    return res.json({
      message: 'Test session ended successfully',
      sessionId: session._id,
      finalScore: session.finalScore,
      totalAnswered: session.responses.length,
    });
  } catch (err) {
    console.error('[CodingTest] endSession error:', err);
    return res.status(500).json({ message: 'Failed to end session' });
  }
};

module.exports = {
  startSession,
  getNextQuestion,
  getNextQuestionAuto,
  submitAnswer,
  getResult,
  getSessionByCandidateAndJob,
  endSession,
  executePython,
  runAllTestCases,
  smartCompare,
  normalizeOutput,
  classifyError,
  sanitizeErrorOutput,
  executeCodeReal,
  getSafePythonEnv,
  PYTHON_SECURITY_PRELUDE,
};
