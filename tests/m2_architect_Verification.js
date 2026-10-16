/**
 * Stage 3 / M2: Comprehensive Architectural Verification Suite
 * Verifies route topology, security middleware, Mongoose compound indexes,
 * circuit breaker registry, polyglot sandbox, and sovereign AI defenses.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const assert = require('assert');

console.log('========================================================================');
console.log('🏛️  STAGE 3: M2 ARCHITECTURAL INTEGRITY & INVARIANTS VERIFICATION');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(desc, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✔ PASS [M2-${String(passedChecks).padStart(2, '0')}]: ${desc}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     ${err.message}`);
    process.exitCode = 1;
  }
}

// ----------------------------------------------------------------------------
// Section 1: Express App & Routing Architecture
// ----------------------------------------------------------------------------
console.log('● Section 1: Express App & Routing Architecture');

const appSource = fs.readFileSync(path.resolve(__dirname, '../server/bootstrap/app.js'), 'utf8');

check('app.js imports and mounts apiRateLimiter', () => {
  assert(appSource.includes('apiRateLimiter'), 'apiRateLimiter must be imported');
  assert(appSource.includes("app.use('/api', apiRateLimiter)"), 'apiRateLimiter mounted on /api');
});

check('app.js mounts 10MB payload limit on /api/coding-test and /api/interviews', () => {
  assert(appSource.includes("limit: '10mb'"), '10mb payload limit defined');
  assert(appSource.includes('/api/coding-test'), 'Scoped to /api/coding-test');
  assert(appSource.includes('/api/interviews'), 'Scoped to /api/interviews');
});

check('All 12 core route modules are mounted on canonical paths', () => {
  const routes = [
    '/api/auth',
    '/api/users',
    '/api/jobs',
    '/api/applications',
    '/api/interviews',
    '/api/coding-test',
    '/api/freelancers',
    '/api/organization',
    '/api/admin',
    '/api/payments',
    '/api/messages',
    '/api/recruiter',
  ];
  for (const r of routes) {
    assert(appSource.includes(`app.use('${r}'`), `Route ${r} must be mounted in app.js`);
  }
});

// ----------------------------------------------------------------------------
// Section 2: Zero-Trust IAM & Canonical Role Taxonomy
// ----------------------------------------------------------------------------
console.log('\n● Section 2: Zero-Trust IAM & Canonical Role Taxonomy');

const User = require('../server/models/User');
const Session = require('../server/models/Session');
const AuditLog = require('../server/models/AuditLog');
const roleUtils = require('../server/utils/roleUtils');

check('Canonical 5-role taxonomy is defined and normalized', () => {
  const validRoles = ['CANDIDATE', 'RECRUITER', 'INTERVIEWER', 'ORGANIZATION', 'ADMIN'];
  for (const role of validRoles) {
    assert.strictEqual(roleUtils.normalizeRole(role), role);
    assert.strictEqual(roleUtils.normalizeRole(role.toLowerCase()), role);
  }
  assert.strictEqual(roleUtils.normalizeRole('freelancer'), 'INTERVIEWER');
  assert.strictEqual(roleUtils.normalizeRole('organization'), 'ORGANIZATION');
  assert.strictEqual(roleUtils.normalizeRole('ORG_ADMIN'), 'ORGANIZATION');
});

check('Session schema defines required dual-token replay protection fields', () => {
  const paths = Session.schema.paths;
  assert(paths.userId, 'userId required in Session');
  assert(paths.refreshTokenHash, 'refreshTokenHash required in Session');
  assert(paths.familyId, 'familyId required in Session');
  assert(paths.isRevoked, 'isRevoked required in Session');
  assert(paths.expiresAt, 'expiresAt required in Session');
});

check('AuditLog schema defines actor, action, resource, details, and ip metadata', () => {
  const paths = AuditLog.schema.paths;
  assert(paths['actor.email'], 'actor.email required');
  assert(paths['actor.role'], 'actor.role required');
  assert(paths.action, 'action required');
  assert(paths['resource.type'], 'resource.type required');
  assert(paths.ip, 'ip required');
  assert(paths.timestamp, 'timestamp required');
});

// ----------------------------------------------------------------------------
// Section 3: Compound Indexing Architecture
// ----------------------------------------------------------------------------
console.log('\n● Section 3: Compound Indexing Architecture');

const Job = require('../server/models/Job');
const Application = require('../server/models/Application');
const Interview = require('../server/models/Interview');
const TestSession = require('../server/models/TestSession');
const CodingQuestion = require('../server/models/CodingQuestion');

check('Job indexes include { postedBy: 1, status: 1 } and delegation', () => {
  const indexes = Job.schema.indexes();
  const hasPostedBy = indexes.some(([fields]) => fields.postedBy === 1 && fields.status === 1);
  const hasDelegation = indexes.some(([fields]) => fields.delegatedFreelancerId === 1 && fields.delegationStatus === 1);
  assert(hasPostedBy, 'Job compound index { postedBy: 1, status: 1 } exists');
  assert(hasDelegation, 'Job compound index { delegatedFreelancerId: 1, delegationStatus: 1 } exists');
});

check('Application index enforces unique { job: 1, candidate: 1 }', () => {
  const indexes = Application.schema.indexes();
  const uniqueJobCandidate = indexes.some(([fields, opts]) => fields.job === 1 && fields.candidate === 1 && opts.unique === true);
  assert(uniqueJobCandidate, 'Unique compound index { job: 1, candidate: 1 } exists');
});

check('Interview indexes define descending scheduledTime and unique meetingId', () => {
  const indexes = Interview.schema.indexes();
  const hasMeetingId = indexes.some(([fields, opts]) => fields.meetingId === 1 && opts.unique === true);
  const hasCandidateTime = indexes.some(([fields]) => fields.candidateId === 1 && fields.scheduledTime === -1);
  const hasRecruiterTime = indexes.some(([fields]) => fields.recruiterId === 1 && fields.scheduledTime === -1);
  assert(hasMeetingId, 'Unique meetingId index exists');
  assert(hasCandidateTime, 'Descending scheduledTime index for candidate exists');
  assert(hasRecruiterTime, 'Descending scheduledTime index for recruiter exists');
});

check('TestSession indexes define { candidateId: 1, jobId: 1 } and { status: 1, startedAt: -1 }', () => {
  const indexes = TestSession.schema.indexes();
  const hasCandJob = indexes.some(([fields]) => fields.candidateId === 1 && fields.jobId === 1);
  const hasStatusStarted = indexes.some(([fields]) => fields.status === 1 && fields.startedAt === -1);
  assert(hasCandJob, 'TestSession { candidateId: 1, jobId: 1 } exists');
  assert(hasStatusStarted, 'TestSession { status: 1, startedAt: -1 } exists');
});

check('CodingQuestion index defines { difficulty: 1, category: 1 }', () => {
  const indexes = CodingQuestion.schema.indexes();
  const hasDiffCat = indexes.some(([fields]) => fields.difficulty === 1 && fields.category === 1);
  assert(hasDiffCat, 'CodingQuestion { difficulty: 1, category: 1 } exists');
});

// ----------------------------------------------------------------------------
// Section 4: Polyglot Execution Sandbox Security
// ----------------------------------------------------------------------------
console.log('\n● Section 4: Polyglot Execution Sandbox Security');

const codingController = require('../server/controllers/codingTestController');

check('getSafePythonEnv and getSafeNodeEnv strip credentials from child processes', () => {
  const pyEnv = codingController.getSafePythonEnv();
  const nodeEnv = codingController.getSafeNodeEnv();
  const sensitiveKeys = ['MONGO_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'GEMINI_API_KEY', 'OPENAI_API_KEY'];

  for (const k of sensitiveKeys) {
    assert.strictEqual(pyEnv[k], undefined, `Python env must not contain ${k}`);
    assert.strictEqual(nodeEnv[k], undefined, `Node env must not contain ${k}`);
  }
});

check('sanitizeErrorOutput scrubs host paths and maintains solution line numbers', () => {
  const dirtyTraceback = 'Traceback (most recent call last):\n  File "C:\\Users\\Host\\procruit\\tmp\\12345.py", line 12, in <module>\n    1 / 0\nZeroDivisionError: division by zero';
  const cleanTraceback = codingController.sanitizeErrorOutput(dirtyTraceback);
  assert(!cleanTraceback.includes('C:\\Users'), 'Host user path scrubbed');
  assert(cleanTraceback.includes('solution.py'), 'Normalized to solution.py');
  assert(cleanTraceback.includes('ZeroDivisionError: division by zero'), 'Preserves exception detail');
});

check('sanitizeQuestion deletes hiddenTestCases and generates multi-language starter templates', () => {
  const mockQ = {
    _id: 'q123',
    title: 'Two Sum',
    description: 'Find two indices',
    functionName: 'twoSum',
    difficulty: 'Easy',
    category: 'Arrays',
    hiddenTestCases: [{ input: '[3,2,4], 6', expectedOutput: '[1, 2]' }],
    testCases: [{ input: '[2,7,11,15], 9', expectedOutput: '[0, 1]', isHidden: false }],
  };

  const sanitized = codingController.sanitizeQuestion(mockQ);
  assert.strictEqual(sanitized.hiddenTestCases, undefined, 'Strips hiddenTestCases property');
  assert(sanitized.starterTemplates, 'Generates starter templates');
  assert(sanitized.starterTemplates.python.includes('def twoSum'), 'Python starter code generated');
  assert(sanitized.starterTemplates.javascript.includes('function twoSum'), 'JavaScript starter code generated');
  assert(sanitized.starterTemplates.typescript.includes('function twoSum'), 'TypeScript starter code generated');
  assert(sanitized.starterTemplates.java.includes('class Solution'), 'Java starter code generated');
  assert(sanitized.starterTemplates.cpp.includes('int main') || sanitized.starterTemplates.cpp.includes('iostream'), 'C++ starter code generated');
});

// ----------------------------------------------------------------------------
// Section 5: Real-Time & Inter-Service Circuit Breakers
// ----------------------------------------------------------------------------
console.log('\n● Section 5: Real-Time & Inter-Service Circuit Breakers');

const HttpClient = require('../server/utils/httpClient');
const socketServer = require('../server/realtime/socketServer');

check('HttpClient exports CircuitBreaker class and executeWithBreaker', () => {
  assert(HttpClient.CircuitBreaker, 'CircuitBreaker class exported');
  assert.strictEqual(typeof HttpClient.executeWithBreaker, 'function', 'executeWithBreaker function exported');
  assert.strictEqual(typeof HttpClient.getJson, 'function', 'getJson exported');
  assert.strictEqual(typeof HttpClient.postJson, 'function', 'postJson exported');
  assert.strictEqual(typeof HttpClient.postForm, 'function', 'postForm exported');
});

check('socketServer exports lifecycle hooks: initRedisAdapter and closeRedisAdapter', () => {
  assert.strictEqual(typeof socketServer.initRedisAdapter, 'function', 'initRedisAdapter exported');
  assert.strictEqual(typeof socketServer.closeRedisAdapter, 'function', 'closeRedisAdapter exported');
});

// ----------------------------------------------------------------------------
// Section 6: Sovereign AI Prompt Defense & Red-Flag Alignment
// ----------------------------------------------------------------------------
console.log('\n● Section 6: Sovereign AI Prompt Defense & Red-Flag Alignment');

const aiSource = fs.readFileSync(path.resolve(__dirname, '../ai-service/main.py'), 'utf8');

check('ai-service/main.py implements prompt injection detection and boundary escaping', () => {
  assert(aiSource.includes('INJECTION_PATTERNS'), 'INJECTION_PATTERNS defined');
  assert(aiSource.includes('_detect_prompt_injection'), '_detect_prompt_injection defined');
  assert(aiSource.includes('_sanitize_untrusted_input'), '_sanitize_untrusted_input defined');
  assert(aiSource.includes('<candidate_code>'), '<candidate_code> boundary tags used');
  assert(aiSource.includes('<interviewer_notes>'), '<interviewer_notes> boundary tags used');
});

check('ai-service/main.py implements OllamaEvaluationSchema and structured format', () => {
  assert(aiSource.includes('class OllamaEvaluationSchema'), 'OllamaEvaluationSchema defined');
  assert(aiSource.includes('OllamaEvaluationSchema.model_json_schema()'), 'Enforces JSON schema format');
  assert(aiSource.includes('Multiple faces detected'), 'multiple_faces red flag synchronized');
});

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`TOTAL ARCHITECTURAL CHECKS: ${totalChecks}`);
console.log(`PASSED: ${passedChecks}`);
console.log(`FAILED: ${totalChecks - passedChecks}`);
console.log('========================================================================\n');

if (passedChecks === totalChecks) {
  console.log('✅ ALL ARCHITECTURAL INTEGRITY CHECKS PASSED EMPIRICALLY.\n');
  process.exit(0);
} else {
  process.exit(1);
}
