/**
 * Phase 4 Comprehensive Integration & Empirical Test Harness:
 * 1. Resilient Inter-Service HTTP Client & Circuit Breaker State Machine
 * 2. Controller Circuit Breaker Wiring & Deterministic Heuristic Fallbacks
 * 3. Production Compound Indexing & Database Query Invariants
 * 4. ATS Pipeline V2 Hardening & Non-blocking Concurrency
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const HttpClient = require('../server/utils/httpClient');
const CircuitBreaker = HttpClient.CircuitBreaker;

const Job = require('../server/models/Job');
const Application = require('../server/models/Application');
const Interview = require('../server/models/Interview');
const TestSession = require('../server/models/TestSession');
const CodingQuestion = require('../server/models/CodingQuestion');
const User = require('../server/models/User');
const Profile = require('../server/models/Profile');

const applicationController = require('../server/controllers/applicationController');
const interviewController = require('../server/controllers/interviewController');
const codingTestController = require('../server/controllers/codingTestController');

let passedCount = 0;
let totalCount = 0;

async function it(name, fn) {
  totalCount++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
    passedCount++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.stack || err.message}`);
    throw err;
  }
}

async function runPhase4Tests() {
  console.log('========================================================================');
  console.log('  PHASE 4: CIRCUIT BREAKER, COMPOUND INDEXING & ATS V2 TEST HARNESS      ');
  console.log('========================================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.\n');

    // ------------------------------------------------------------------------
    // Suite 1: Resilient HttpClient & Circuit Breaker State Machine
    // ------------------------------------------------------------------------
    console.log('● Suite 1: Resilient HttpClient & Circuit Breaker State Machine');

    await it('CircuitBreaker starts in CLOSED state with configured thresholds', () => {
      const breaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        resetTimeoutMs: 200,
      });
      assert.strictEqual(breaker.getState(), 'CLOSED');
      assert.strictEqual(breaker.isOpen(), false);
      assert.strictEqual(breaker.failureCount, 0);
      assert.strictEqual(breaker.failureThreshold, 3);
      assert.strictEqual(breaker.resetTimeoutMs, 200);
    });

    await it('CircuitBreaker passes through successful executions and resets failure count', async () => {
      const breaker = new CircuitBreaker('test-success', { failureThreshold: 3 });
      breaker.failureCount = 2; // simulated transient prior failure

      const result = await breaker.execute(async () => {
        return 'success_payload';
      });

      assert.strictEqual(result, 'success_payload');
      assert.strictEqual(breaker.failureCount, 0);
      assert.strictEqual(breaker.getState(), 'CLOSED');
    });

    await it('CircuitBreaker trips to OPEN after reaching failureThreshold', async () => {
      const breaker = new CircuitBreaker('test-fail', {
        failureThreshold: 3,
        resetTimeoutMs: 300,
      });

      let attempts = 0;
      const failingFn = async () => {
        attempts++;
        throw new Error(`Downstream 500 error attempt ${attempts}`);
      };

      // Attempt 1
      try { await breaker.execute(failingFn); } catch (_) {}
      assert.strictEqual(breaker.getState(), 'CLOSED');
      assert.strictEqual(breaker.failureCount, 1);

      // Attempt 2
      try { await breaker.execute(failingFn); } catch (_) {}
      assert.strictEqual(breaker.getState(), 'CLOSED');
      assert.strictEqual(breaker.failureCount, 2);

      // Attempt 3 -> trips to OPEN
      try { await breaker.execute(failingFn); } catch (_) {}
      assert.strictEqual(breaker.getState(), 'OPEN');
      assert.strictEqual(breaker.isOpen(), true);
      assert.strictEqual(breaker.failureCount, 3);
    });

    await it('CircuitBreaker fails fast when OPEN and invokes fallback if provided', async () => {
      const breaker = new CircuitBreaker('test-fast-fail', {
        failureThreshold: 2,
        resetTimeoutMs: 500,
      });

      breaker.trip();
      assert.strictEqual(breaker.isOpen(), true);

      // 1. Without fallback -> throws CIRCUIT_BREAKER_OPEN
      let errorThrown = null;
      let executedAction = false;
      try {
        await breaker.execute(async () => {
          executedAction = true;
          return 'should_not_run';
        });
      } catch (err) {
        errorThrown = err;
      }
      assert.strictEqual(executedAction, false, 'Action must not be called when circuit is OPEN');
      assert(errorThrown, 'Should throw an error');
      assert.strictEqual(errorThrown.code, 'CIRCUIT_BREAKER_OPEN');

      // 2. With fallback -> returns fallback seamlessly
      const fallbackResult = await breaker.execute(
        async () => {
          throw new Error('Downstream should not be reached');
        },
        async (err) => {
          return { fallbackApplied: true, reason: err.code };
        }
      );
      assert.deepStrictEqual(fallbackResult, { fallbackApplied: true, reason: 'CIRCUIT_BREAKER_OPEN' });
    });

    await it('CircuitBreaker transitions to HALF_OPEN after cooldown and resets on probe success', async () => {
      const breaker = new CircuitBreaker('test-cooldown', {
        failureThreshold: 2,
        resetTimeoutMs: 80, // 80ms cooldown for fast test
      });

      breaker.trip();
      assert.strictEqual(breaker.getState(), 'OPEN');

      // Wait 100ms for cooldown window to elapse
      await new Promise((r) => setTimeout(r, 100));

      assert.strictEqual(breaker.getState(), 'HALF_OPEN');

      // Half-open trial request succeeds -> circuit should reset to CLOSED
      const probeResult = await breaker.execute(async () => 'probe_healthy');
      assert.strictEqual(probeResult, 'probe_healthy');
      assert.strictEqual(breaker.getState(), 'CLOSED');
      assert.strictEqual(breaker.failureCount, 0);
    });

    await it('CircuitBreaker transitions to HALF_OPEN and re-trips to OPEN on probe failure', async () => {
      const breaker = new CircuitBreaker('test-probe-fail', {
        failureThreshold: 2,
        resetTimeoutMs: 80,
      });

      breaker.trip();
      assert.strictEqual(breaker.getState(), 'OPEN');

      // Wait 100ms for cooldown
      await new Promise((r) => setTimeout(r, 100));
      assert.strictEqual(breaker.getState(), 'HALF_OPEN');

      // Half-open trial request fails -> circuit should immediately trip back to OPEN
      try {
        await breaker.execute(async () => {
          throw new Error('Trial probe still 503');
        });
      } catch (_) {}

      assert.strictEqual(breaker.getState(), 'OPEN');
      assert.strictEqual(breaker.isOpen(), true);
    });

    await it('HttpClient.executeWithBreaker coordinates named breakers and handles fallbacks', async () => {
      HttpClient.resetAllBreakers();

      const result = await HttpClient.executeWithBreaker(
        'ai-service',
        async () => {
          throw new Error('AI microservice connection timed out');
        },
        async (err) => {
          return { heuristic: true, error: err.message };
        },
        { failureThreshold: 3 }
      );

      assert.strictEqual(result.heuristic, true);
      assert.strictEqual(result.error, 'AI microservice connection timed out');

      const registeredBreaker = HttpClient.getBreaker('ai-service');
      assert.strictEqual(registeredBreaker.failureCount, 1);
    });

    await it('CircuitBreaker does not trip on 4xx client errors (400 Bad Request / 422)', async () => {
      const breaker = new CircuitBreaker('test-4xx-immunity', { failureThreshold: 3 });

      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(async () => {
            const err = new Error('HTTP 400 from downstream: Invalid PDF document');
            err.status = 400;
            throw err;
          });
        } catch (_) {}
      }

      assert.strictEqual(breaker.getState(), 'CLOSED', 'Circuit remains CLOSED despite 5 consecutive 400 errors');
      assert.strictEqual(breaker.failureCount, 0, 'Failure count is 0 because 4xx errors are client errors');
    });

    await it('CircuitBreaker prevents thundering herd in HALF_OPEN via halfOpenTrialInProgress', async () => {
      const breaker = new CircuitBreaker('test-thundering-herd', {
        failureThreshold: 2,
        resetTimeoutMs: 60,
      });

      breaker.trip();
      await new Promise((r) => setTimeout(r, 70));
      assert.strictEqual(breaker.getState(), 'HALF_OPEN');

      // Dispatch trial probe that takes 50ms
      const trialPromise = breaker.execute(async () => {
        await new Promise((r) => setTimeout(r, 50));
        return 'probe_done';
      });

      // Concurrent request dispatched while trial is in flight -> must fast fail
      let concurrentErr = null;
      try {
        await breaker.execute(async () => 'concurrent_should_not_run');
      } catch (err) {
        concurrentErr = err;
      }

      assert(concurrentErr, 'Concurrent request during half-open trial must be guarded');
      assert.strictEqual(concurrentErr.code, 'CIRCUIT_BREAKER_HALF_OPEN_PROBE');

      const trialResult = await trialPromise;
      assert.strictEqual(trialResult, 'probe_done');
      assert.strictEqual(breaker.getState(), 'CLOSED', 'Probe completed successfully and closed circuit');
    });

    await it('HttpClient.postJson and postForm support { breaker, fallback } seamlessly without crash', async () => {
      const breaker = HttpClient.getBreaker('test-post-fallback', { failureThreshold: 1 });
      breaker.trip();

      // Test postJson with breaker option and fallback
      const jsonResult = await HttpClient.postJson(
        'http://localhost:59999/dummy',
        { test: 1 },
        { breaker: 'test-post-fallback', fallback: () => ({ handled: true, mode: 'postJson' }) }
      );
      assert.deepStrictEqual(jsonResult, { handled: true, mode: 'postJson' });

      // Test postForm with breaker option and fallback
      const formResult = await HttpClient.postForm(
        'http://localhost:59999/dummy',
        {},
        { breaker: 'test-post-fallback', fallback: () => ({ handled: true, mode: 'postForm' }) }
      );
      assert.deepStrictEqual(formResult, { handled: true, mode: 'postForm' });
    });

    // ------------------------------------------------------------------------
    // Suite 2: Controller Circuit Breaker Wiring & Heuristic Fallbacks
    // ------------------------------------------------------------------------
    console.log('\n● Suite 2: Controller Circuit Breaker Wiring & Heuristic Fallbacks');

    await it('applicationController.parseCVWithAI returns deterministic heuristic fallback on outage', async () => {
      HttpClient.resetAllBreakers();

      const dummyCv = Buffer.from('%PDF-1.4 sample resume content for testing fullstack developer skills');
      const jd = 'Looking for a Senior Python and React developer with PostgreSQL experience';

      // Downstream AI service is offline at port 8002 in unit environment -> should trigger heuristic fallback
      const parsed = await applicationController.parseCVWithAI(dummyCv, 'test_cv.pdf', jd, { timeoutMs: 500, maxRetries: 0 });

      assert(parsed, 'Parsed object must be returned');
      assert(typeof parsed.suitability_score === 'number', 'Contains numeric suitability_score');
      assert(Array.isArray(parsed.matched_keywords), 'Contains matched_keywords array');
      assert(Array.isArray(parsed.missing_keywords), 'Contains missing_keywords array');
      assert.strictEqual(parsed.isFallback, true, 'Flags as fallback evaluation');
      assert(parsed.suitability_score >= 0 && parsed.suitability_score <= 100, 'Score is clamped 0-100');
    });

    await it('applicationController.heuristicParseFallback produces consistent structure', () => {
      const fallback = applicationController.heuristicParseFallback(
        Buffer.from('test'),
        'candidate_cv.pdf',
        'Requirements: Python React TypeScript Docker GraphQL'
      );
      assert.strictEqual(fallback.suitability_score, 50.0);
      assert.strictEqual(fallback.isFallback, true);
      assert(fallback.matched_keywords.length > 0, 'Extracts sample matched keywords from JD');
      assert(Array.isArray(fallback.skills), 'Provides default skills list');
    });

    await it('interviewController.evaluateInterviewWithAI handles microservice outage with heuristic fallback', async () => {
      HttpClient.resetAllBreakers();

      const aiPayload = {
        interviewId: new mongoose.Types.ObjectId().toString(),
        candidateCode: 'def solution(): return True',
        codingScore: 85,
        codingTestConducted: true,
        proctorEvents: [],
        interviewerNotes: 'Great candidate',
      };

      const result = await interviewController.evaluateInterviewWithAI(aiPayload, { timeoutMs: 500, maxRetries: 0 });

      assert(result, 'Evaluation result returned');
      assert.strictEqual(result.isFallback, true, 'Tagged as fallback');
      assert.strictEqual(result.suitabilityScore, 85, 'Falls back to codingScore when conducted');
      assert(Array.isArray(result.strengths), 'Provides strengths');
      assert(Array.isArray(result.weaknesses), 'Provides weaknesses');
      assert(Array.isArray(result.redFlags), 'Provides redFlags');
    });

    await it('codingTestController.analyzeCodeWithAI returns heuristic analysis when AI service is down', async () => {
      HttpClient.resetAllBreakers();

      const result = await codingTestController.analyzeCodeWithAI(
        'def add(a, b): return a + b',
        100,
        { timeoutMs: 500, maxRetries: 0 }
      );

      assert(result, 'Analysis result returned');
      assert.strictEqual(result.logicScore, 100);
      assert(result.accuracyFeedback.length > 0);
      assert(result.efficiencyFeedback.length > 0);
    });

    await it('saveResumeFile supports .docx and saves with .docx extension, while sanitizing untrusted extensions', async () => {
      // 1. DOCX buffer with zip magic bytes
      const docxBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      const savedDocxUrl = await applicationController.saveResumeFile(docxBuffer, 'candidate_resume.docx');
      assert(savedDocxUrl.startsWith('/uploads/resumes/'), 'Saved to /uploads/resumes/');
      assert(savedDocxUrl.endsWith('.docx'), `Saves with .docx extension: got ${savedDocxUrl}`);

      // 2. Untrusted extension (e.g. .bat / .sh) with generic content
      const dummyBuffer = Buffer.from('%PDF-1.4 sample content');
      const savedSanitizedUrl = await applicationController.saveResumeFile(dummyBuffer, 'malicious_script.bat');
      assert(savedSanitizedUrl.endsWith('.pdf'), `Forces .pdf extension for untrusted file types: got ${savedSanitizedUrl}`);

      // Cleanup
      try {
        fs.unlinkSync(path.join(__dirname, '../server/public', savedDocxUrl.replace(/^\//, '')));
        fs.unlinkSync(path.join(__dirname, '../server/public', savedSanitizedUrl.replace(/^\//, '')));
      } catch (_) {}
    });

    await it('userController.uploadResume resiliently delegates to circuit-breaker-protected parseCVWithAI', async () => {
      const user = await User.create({
        name: 'Resume Uploader',
        email: `uploader-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'CANDIDATE',
      });

      const profile = await Profile.create({
        user: user._id,
        skills: ['Git'],
      });
      user.profile = profile._id;
      await user.save();

      // Create a temporary resume file on disk
      const tempResumePath = path.join(__dirname, `temp_resume_${Date.now()}.docx`);
      fs.writeFileSync(tempResumePath, Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x00, 0x00]));

      let statusSent = null;
      let jsonSent = null;

      const req = {
        user: { id: user._id.toString() },
        file: {
          path: tempResumePath,
          filename: path.basename(tempResumePath),
          originalname: 'my_resume.docx',
        },
        protocol: 'http',
        get: () => 'localhost:5000',
      };

      const res = {
        status: (code) => { statusSent = code; return res; },
        json: (data) => { jsonSent = data; return res; },
      };

      const userController = require('../server/controllers/userController');
      await userController.uploadResume(req, res);

      // Clean up temp file
      try { fs.unlinkSync(tempResumePath); } catch (_) {}

      assert.strictEqual(Boolean(jsonSent?.resumeUrl), true);
      assert(jsonSent?.user, 'User object returned in payload');

      // Verify user document has resumeUrl set
      const updatedUser = await User.findById(user._id);
      assert(updatedUser.resumeUrl, 'User has resumeUrl populated');
    });

    // ------------------------------------------------------------------------
    // Suite 3: Production Compound Indexing & Database Query Invariants
    // ------------------------------------------------------------------------
    console.log('\n● Suite 3: Production Compound Indexing & Database Query Invariants');

    await it('Job model defines and builds required compound and organization indexes', async () => {
      const indexes = Job.schema.indexes();
      // indexes is an array of [indexObj, options]
      const hasPostedByStatus = indexes.some(([spec]) => spec.postedBy === 1 && spec.status === 1);
      const hasDelegation = indexes.some(([spec]) => spec.delegatedFreelancerId === 1 && spec.delegationStatus === 1);
      const hasOrg = indexes.some(([spec]) => spec.organization === 1);
      const hasStatus = indexes.some(([spec]) => spec.status === 1);

      assert(hasPostedByStatus, 'Job schema has compound index { postedBy: 1, status: 1 }');
      assert(hasDelegation, 'Job schema has compound index { delegatedFreelancerId: 1, delegationStatus: 1 }');
      assert(hasOrg, 'Job schema has index on { organization: 1 }');
      assert(hasStatus, 'Job schema has index on { status: 1 }');

      // Synchronize indexes in MongoDB
      await Job.syncIndexes();
      const dbIndexes = await Job.collection.indexes();
      assert(dbIndexes.some(idx => idx.key.postedBy === 1 && idx.key.status === 1), 'DB has postedBy_1_status_1 index');
      assert(dbIndexes.some(idx => idx.key.delegatedFreelancerId === 1 && idx.key.delegationStatus === 1), 'DB has delegatedFreelancerId_1_delegationStatus_1 index');
      assert(dbIndexes.some(idx => idx.key.organization === 1), 'DB has organization_1 index');
    });

    await it('Application model defines compound indexes and enforces unique { job, candidate }', async () => {
      const indexes = Application.schema.indexes();
      const hasJobCandidateUnique = indexes.some(([spec, opts]) => spec.job === 1 && spec.candidate === 1 && opts?.unique === true);
      const hasJobStatus = indexes.some(([spec]) => spec.job === 1 && spec.status === 1);
      const hasCandidateAppliedAt = indexes.some(([spec]) => spec.candidate === 1 && spec.appliedAt === -1);

      assert(hasJobCandidateUnique, 'Application schema has unique compound index { job: 1, candidate: 1 }');
      assert(hasJobStatus, 'Application schema has compound index { job: 1, status: 1 }');
      assert(hasCandidateAppliedAt, 'Application schema has compound index { candidate: 1, appliedAt: -1 }');

      await Application.syncIndexes();

      // Test duplicate prevention via compound unique index
      const testJobId = new mongoose.Types.ObjectId();
      const testCandId = new mongoose.Types.ObjectId();

      const app1 = new Application({
        job: testJobId,
        candidate: testCandId,
        status: 'Applied',
      });
      await app1.save();

      let duplicateError = null;
      try {
        const app2 = new Application({
          job: testJobId,
          candidate: testCandId,
          status: 'Applied',
        });
        await app2.save();
      } catch (err) {
        duplicateError = err;
      }

      assert(duplicateError, 'Duplicate application must fail');
      assert.strictEqual(duplicateError.code, 11000, 'Throws E11000 duplicate key error');
    });

    await it('Interview model defines descending scheduledTime compound indexes and unique meetingId', async () => {
      const indexes = Interview.schema.indexes();
      const hasCandidateSched = indexes.some(([spec]) => spec.candidateId === 1 && spec.scheduledTime === -1);
      const hasRecruiterSched = indexes.some(([spec]) => spec.recruiterId === 1 && spec.scheduledTime === -1);
      const hasInterviewerSched = indexes.some(([spec]) => spec.interviewerId === 1 && spec.scheduledTime === -1);
      const hasMeetingIdUnique = indexes.some(([spec, opts]) => spec.meetingId === 1 && opts?.unique === true);

      assert(hasCandidateSched, 'Interview schema has compound index { candidateId: 1, scheduledTime: -1 }');
      assert(hasRecruiterSched, 'Interview schema has compound index { recruiterId: 1, scheduledTime: -1 }');
      assert(hasInterviewerSched, 'Interview schema has compound index { interviewerId: 1, scheduledTime: -1 }');
      assert(hasMeetingIdUnique, 'Interview schema has unique index { meetingId: 1 }');

      await Interview.syncIndexes();

      // Verify unique meetingId enforcement
      const candId = new mongoose.Types.ObjectId();
      const recId = new mongoose.Types.ObjectId();

      const inv1 = new Interview({
        candidateId: candId,
        recruiterId: recId,
        scheduledTime: new Date(),
        meetingId: 'meet-unique-123',
      });
      await inv1.save();

      let meetingError = null;
      try {
        const inv2 = new Interview({
          candidateId: candId,
          recruiterId: recId,
          scheduledTime: new Date(),
          meetingId: 'meet-unique-123',
        });
        await inv2.save();
      } catch (err) {
        meetingError = err;
      }

      assert(meetingError, 'Duplicate meetingId must fail');
      assert.strictEqual(meetingError.code, 11000, 'Throws E11000 duplicate key error');
    });

    await it('TestSession model defines compound indexes on { candidateId, jobId } and { status, startedAt: -1 }', async () => {
      const indexes = TestSession.schema.indexes();
      const hasCandidateJob = indexes.some(([spec]) => spec.candidateId === 1 && spec.jobId === 1);
      const hasStatusStarted = indexes.some(([spec]) => spec.status === 1 && spec.startedAt === -1);

      assert(hasCandidateJob, 'TestSession schema has compound index { candidateId: 1, jobId: 1 }');
      assert(hasStatusStarted, 'TestSession schema has compound index { status: 1, startedAt: -1 }');

      await TestSession.syncIndexes();
      const dbIndexes = await TestSession.collection.indexes();
      assert(dbIndexes.some(idx => idx.key.candidateId === 1 && idx.key.jobId === 1), 'DB has candidateId_1_jobId_1 index');
      assert(dbIndexes.some(idx => idx.key.status === 1 && idx.key.startedAt === -1), 'DB has status_1_startedAt_-1 index');
    });

    await it('CodingQuestion model defines compound index on { difficulty: 1, category: 1 }', async () => {
      const indexes = CodingQuestion.schema.indexes();
      const hasDiffCat = indexes.some(([spec]) => spec.difficulty === 1 && spec.category === 1);

      assert(hasDiffCat, 'CodingQuestion schema has compound index { difficulty: 1, category: 1 }');

      await CodingQuestion.syncIndexes();
      const dbIndexes = await CodingQuestion.collection.indexes();
      assert(dbIndexes.some(idx => idx.key.difficulty === 1 && idx.key.category === 1), 'DB has difficulty_1_category_1 index');
    });

    // ------------------------------------------------------------------------
    // Suite 4: ATS Pipeline V2 Hardening & Non-blocking Concurrency
    // ------------------------------------------------------------------------
    console.log('\n● Suite 4: ATS Pipeline V2 Hardening & Non-blocking Concurrency');

    await it('applyWithCV in default mode returns HTTP 201 immediately with aiProcessing: true', async () => {
      const recruiter = await User.create({
        name: 'Tech Recruiter',
        email: `recruiter-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'RECRUITER',
      });

      const candidate = await User.create({
        name: 'Jane Doe',
        email: `candidate-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'CANDIDATE',
        resumeUrl: '/uploads/resumes/sample.pdf',
      });

      const job = await Job.create({
        title: 'Backend Engineer',
        description: 'Design and develop scalable APIs with Node and MongoDB',
        requirements: 'Node, Express, MongoDB, Docker',
        company: 'Axiocruit Technologies',
        location: 'Remote',
        postedBy: recruiter._id,
      });

      let statusSent = null;
      let jsonSent = null;

      const req = {
        params: { jobId: job._id.toString() },
        user: { id: candidate._id.toString(), role: 'CANDIDATE' },
        query: {},
        body: {},
        headers: {},
      };

      const res = {
        status: (code) => { statusSent = code; return res; },
        json: (data) => { jsonSent = data; return res; },
      };

      await applicationController.applyWithCV(req, res);

      assert.strictEqual(statusSent, 201, 'Returns HTTP 201 Created');
      assert.strictEqual(jsonSent.aiProcessing, true, 'Marks aiProcessing as true');
      assert.strictEqual(jsonSent.aiAnalyzed, false, 'Does not block on synchronous analysis');
      assert.strictEqual(jsonSent.application.status, 'Pending AI');
      assert.strictEqual(jsonSent.application.aiScore, null);

      // Verify application was recorded in MongoDB
      const savedApp = await Application.findById(jsonSent.application._id);
      assert(savedApp, 'Application saved in MongoDB');
      assert.strictEqual(savedApp.status, 'Pending AI');
    });

    await it('applyWithCV supports synchronous scoring mode when requested via ?sync=true', async () => {
      const recruiter = await User.create({
        name: 'Sync Recruiter',
        email: `recruiter-sync-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'RECRUITER',
      });

      const candidate = await User.create({
        name: 'John Sync',
        email: `candidate-sync-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'CANDIDATE',
        resumeUrl: '/uploads/resumes/sample.pdf',
      });

      const job = await Job.create({
        title: 'Sync Engineer',
        description: 'TypeScript, React, Node.js',
        company: 'Axiocruit Sync Inc',
        location: 'Remote',
        postedBy: recruiter._id,
      });

      let statusSent = null;
      let jsonSent = null;

      const req = {
        params: { jobId: job._id.toString() },
        user: { id: candidate._id.toString(), role: 'CANDIDATE' },
        query: { sync: 'true' }, // Synchronous scoring requested
        body: {},
        headers: {},
      };

      const res = {
        status: (code) => { statusSent = code; return res; },
        json: (data) => { jsonSent = data; return res; },
      };

      await applicationController.applyWithCV(req, res);

      assert.strictEqual(statusSent, 201);
      assert.strictEqual(jsonSent.aiProcessing, false, 'aiProcessing is false for synchronous mode');
      assert.strictEqual(jsonSent.application.status, 'Applied', 'Status is Applied');
      assert(typeof jsonSent.application.aiScore === 'number', 'aiScore is populated');
    });

    await it('ATS Pipeline handles 10 concurrent candidate uploads without event loop blocking', async () => {
      const recruiter = await User.create({
        name: 'Concurrent Recruiter',
        email: `recruiter-conc-${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'RECRUITER',
      });

      // Create 10 distinct jobs and candidates
      const candidates = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
          User.create({
            name: `Candidate ${i}`,
            email: `cand-conc-${i}-${Date.now()}@example.com`,
            password: 'Password123!',
            role: 'CANDIDATE',
            resumeUrl: `/uploads/resumes/cand-${i}.pdf`,
          })
        )
      );

      const job = await Job.create({
        title: 'Concurrent Load Test Job',
        description: 'High throughput pipeline test',
        company: 'Axiocruit Scale',
        location: 'Remote',
        postedBy: recruiter._id,
      });

      const startTime = Date.now();

      // Fire 10 simultaneous application uploads
      const results = await Promise.all(
        candidates.map(async (cand) => {
          let code = null;
          let body = null;
          const req = {
            params: { jobId: job._id.toString() },
            user: { id: cand._id.toString(), role: 'CANDIDATE' },
            query: {},
            body: {},
            headers: {},
          };
          const res = {
            status: (c) => { code = c; return res; },
            json: (b) => { body = b; return res; },
          };
          await applicationController.applyWithCV(req, res);
          return { code, body };
        })
      );

      const durationMs = Date.now() - startTime;
      console.log(`     [Concurrency] Dispatched 10 applications in ${durationMs}ms`);

      assert(durationMs < 1500, `Concurrent dispatch must complete promptly (<1500ms, took ${durationMs}ms)`);
      assert.strictEqual(results.length, 10);
      for (const r of results) {
        assert.strictEqual(r.code, 201);
        assert.strictEqual(r.body.aiProcessing, true);
        assert.strictEqual(r.body.application.status, 'Pending AI');
      }

      // Verify all 10 applications exist in database
      const appCount = await Application.countDocuments({ job: job._id });
      assert.strictEqual(appCount, 10, 'All 10 applications persisted in MongoDB');

      // Wait briefly for background tasks to settle
      await new Promise((r) => setTimeout(r, 600));
    });

    await it('ai-service/main.py implements CPU_SEMAPHORE, asyncio.to_thread, and .docx support', () => {
      const pythonSource = fs.readFileSync(path.join(__dirname, '../ai-service/main.py'), 'utf-8');

      assert(pythonSource.includes('CPU_SEMAPHORE = asyncio.Semaphore'), 'Instantiates CPU_SEMAPHORE');
      assert(pythonSource.includes('extract_text_from_docx'), 'Defines extract_text_from_docx function');
      assert(pythonSource.includes('is_docx'), 'Checks for .docx extension in parse_cv');
      assert(pythonSource.includes('await asyncio.to_thread(extract_text_from_docx'), 'Offloads docx extraction to thread');
      assert(pythonSource.includes('await asyncio.to_thread(extract_text_from_pdf'), 'Offloads pdf extraction to thread');
      assert(pythonSource.includes('await asyncio.to_thread(compute_semantic_score'), 'Offloads SentenceTransformer semantic scoring to thread');
      assert(pythonSource.includes('await asyncio.to_thread(extract_keywords'), 'Offloads spaCy NLP keyword extraction to thread');
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 4 TESTS: ${totalCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${totalCount - passedCount}`);
    console.log('========================================================================\n');

  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runPhase4Tests().catch((err) => {
  console.error('[Phase4 Harness Error]:', err);
  process.exit(1);
});
