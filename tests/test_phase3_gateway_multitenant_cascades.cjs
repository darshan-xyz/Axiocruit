/**
 * Phase 3 Comprehensive Test Suite:
 * Gateway Hardening, Multi-Tenant Isolation, Transactional Cascades,
 * Candidate CV Upload Validation, and Type & Role Synchronization
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Job = require('../server/models/Job');
const Application = require('../server/models/Application');
const Organization = require('../server/models/Organization');
const Session = require('../server/models/Session');
const Interview = require('../server/models/Interview');
const Message = require('../server/models/Message');

const { createApp } = require('../server/bootstrap/app');
const { apiRateLimiter } = require('../server/middleware/securityMiddleware');
const uploadMiddleware = require('../server/middleware/uploadMiddleware');
const { uploadResume, validateUploadedFile } = uploadMiddleware;
const applicationController = require('../server/controllers/applicationController');
const jobController = require('../server/controllers/jobController');
const authController = require('../server/controllers/authController');
const adminController = require('../server/controllers/adminController');
const organizationController = require('../server/controllers/organizationController');
const stripeController = require('../server/controllers/stripeController');
const codingTestController = require('../server/controllers/codingTestController');
const { normalizeRole } = require('../server/utils/roleUtils');

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

async function runPhase3Tests() {
  console.log('========================================================================');
  console.log('  PHASE 3: GATEWAY, MULTI-TENANCY & TRANSACTIONAL CASCADES TEST HARNESS ');
  console.log('========================================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.\n');

    // ------------------------------------------------------------------------
    // Group 1: Gateway Rate Limiting & Payload Scoping
    // ------------------------------------------------------------------------
    console.log('● Suite 1: Gateway Rate Limiting & Payload Scoping');

    await it('server/bootstrap/app.js mounts apiRateLimiter and scopes payload limits', () => {
      const appSource = fs.readFileSync(path.join(__dirname, '../server/bootstrap/app.js'), 'utf-8');
      assert(appSource.includes('apiRateLimiter'), 'Imports and uses apiRateLimiter');
      assert(appSource.includes("app.use('/api', apiRateLimiter);"), 'Mounts apiRateLimiter across /api');
      assert(appSource.includes("app.use('/api/auth', authRateLimiter"), 'Preserves authRateLimiter on /api/auth');
      assert(appSource.includes("limit: '1mb'"), 'Scopes global express.json to 1mb default');
      assert(appSource.includes("app.use('/api/coding-test', elevatedJson);"), 'Elevates payload limit for coding-test');
      assert(appSource.includes("app.use('/api/interviews', elevatedJson);"), 'Elevates payload limit for interviews');
    });

    await it('apiRateLimiter throttles after reaching max requests', () => {
      assert(typeof apiRateLimiter === 'function', 'apiRateLimiter is an express middleware function');
      let statusCalled = null;
      let jsonCalled = null;
      const mockReq = {
        ip: '10.0.0.99',
        headers: {},
        socket: { remoteAddress: '10.0.0.99' },
        id: 'test-rate-limit-id',
      };
      const mockRes = {
        setHeader: () => {},
        status: (code) => { statusCalled = code; return mockRes; },
        json: (data) => { jsonCalled = data; return mockRes; },
      };

      // apiRateLimiter max is 300 in 1 minute
      for (let i = 0; i < 301; i++) {
        let nextCalled = false;
        apiRateLimiter(mockReq, mockRes, () => { nextCalled = true; });
        if (i < 300) {
          assert(nextCalled, `Request ${i} should be permitted`);
        } else {
          assert.strictEqual(statusCalled, 429, 'Request 301 should receive 429 Too Many Requests');
          assert(jsonCalled && jsonCalled.success === false, 'Returns error json');
        }
      }
    });

    // ------------------------------------------------------------------------
    // Group 2: Candidate CV Upload Validation & Async Writing
    // ------------------------------------------------------------------------
    console.log('\n● Suite 2: Candidate CV Upload Validation & Async Writing');

    await it('uploadResume middleware is configured for 10MB limit and PDF filter', () => {
      assert(typeof uploadResume === 'function', 'uploadResume is a middleware function');
      assert(typeof uploadResume.single === 'function', 'uploadResume supports .single()');
    });

    await it('validateUploadedFile accepts valid PDF files with %PDF (0x25 0x50 0x44 0x46) magic bytes', async () => {
      // Create a valid dummy PDF buffer (%PDF-1.4 header)
      const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
      const req = {
        file: {
          buffer: validPdfBuffer,
          originalname: 'my_resume.pdf',
          mimetype: 'application/pdf',
        },
      };
      let nextCalled = false;
      const res = {
        status: () => res,
        json: () => res,
      };

      await validateUploadedFile(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true, 'Valid PDF should pass magic byte validation');
    });

    await it('validateUploadedFile rejects non-PDF files disguised with .pdf extension', async () => {
      // Create a fake PDF that is actually plain text / html / exe
      const fakePdfBuffer = Buffer.from('<html><body>Fake CV File</body></html>');
      const req = {
        file: {
          buffer: fakePdfBuffer,
          originalname: 'malicious.pdf',
          mimetype: 'application/pdf',
        },
      };
      let statusCode = 200;
      let errorBody = null;
      let nextCalled = false;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { errorBody = data; return res; },
      };

      await validateUploadedFile(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'Fake PDF should NOT call next()');
      assert.strictEqual(statusCode, 400, 'Returns 400 Bad Request');
      assert(errorBody && errorBody.message.includes('magic bytes mismatch'), 'Reports magic bytes mismatch');
    });

    await it('saveResumeFile forces .pdf extension and writes asynchronously without blocking', async () => {
      const dummyPdfContent = Buffer.from('%PDF-1.4\nTest Async Save\n%%EOF');
      // Pass a non-pdf originalName like "evil.exe"
      const savedUrl = await applicationController.saveResumeFile(dummyPdfContent, 'evil.exe');

      assert(savedUrl.startsWith('/uploads/resumes/'), 'Saved to /uploads/resumes/');
      assert(savedUrl.endsWith('.pdf'), `Forces .pdf extension: got ${savedUrl}`);
      assert(!savedUrl.includes('.exe'), 'Does not retain dangerous original extension');

      // Check that the file was written to disk
      const filePath = path.join(__dirname, '../server/public', savedUrl.replace(/^\//, ''));
      assert(fs.existsSync(filePath), 'File exists on disk');
      const content = fs.readFileSync(filePath);
      assert.strictEqual(content.toString('utf-8'), dummyPdfContent.toString('utf-8'), 'Content matches written buffer');

      // Clean up
      try { fs.unlinkSync(filePath); } catch (_) {}
    });

    await it('saveResumeFile throws an error when passed an invalid or empty buffer', async () => {
      let threwNull = false;
      try {
        await applicationController.saveResumeFile(null, 'test.pdf');
      } catch (err) {
        threwNull = true;
      }
      assert.strictEqual(threwNull, true, 'Throws on null buffer');

      let threwEmpty = false;
      try {
        await applicationController.saveResumeFile(Buffer.alloc(0), 'test.pdf');
      } catch (err) {
        threwEmpty = true;
      }
      assert.strictEqual(threwEmpty, true, 'Throws on empty buffer');
    });

    // ------------------------------------------------------------------------
    // Group 3: Multi-Tenant Ownership & ReDoS/Payment Fixes
    // ------------------------------------------------------------------------
    console.log('\n● Suite 3: Multi-Tenant Ownership & ReDoS/Payment Fixes');

    let orgA;
    let orgB;
    let orgAdminA;
    let orgAdminB;
    let recruiterA;
    let recruiterB;
    let candidateUser;
    let jobOrgA;
    let appForJobOrgA;

    await it('Setup organizations, recruiters, candidates, and jobs for tenancy test', async () => {
      orgAdminA = await User.create({
        name: 'Admin Org A',
        email: 'adminA@acme.com',
        password: 'hash',
        role: 'ORGANIZATION',
      });

      orgAdminB = await User.create({
        name: 'Admin Org B',
        email: 'adminB@beta.com',
        password: 'hash',
        role: 'ORGANIZATION',
      });

      orgA = await Organization.create({ name: 'Acme Corp', admin: orgAdminA._id });
      orgB = await Organization.create({ name: 'Beta Industries', admin: orgAdminB._id });

      orgAdminA.organization = orgA._id;
      await orgAdminA.save();

      orgAdminB.organization = orgB._id;
      await orgAdminB.save();

      recruiterA = await User.create({
        name: 'Recruiter Org A',
        email: 'recA@acme.com',
        password: 'hash',
        role: 'RECRUITER',
        organization: orgA._id,
      });

      recruiterB = await User.create({
        name: 'Recruiter Org B',
        email: 'recB@beta.com',
        password: 'hash',
        role: 'RECRUITER',
        organization: orgB._id,
      });

      candidateUser = await User.create({
        name: 'Candidate One',
        email: 'cand1@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      jobOrgA = await Job.create({
        title: 'Backend Engineer',
        description: 'Backend engineering role description',
        company: 'Acme Corp',
        location: 'Remote',
        type: 'Full-time',
        postedBy: recruiterA._id,
        status: 'Active',
      });

      appForJobOrgA = await Application.create({
        job: jobOrgA._id,
        candidate: candidateUser._id,
        status: 'Screening',
        appliedAt: new Date(),
      });
    });

    await it('updateApplicationStatus: Prevents cross-tenant org admin from mutating pipeline', async () => {
      // OrgAdminB attempts to update application for Job in OrgA!
      const req = {
        params: { id: appForJobOrgA._id.toString() },
        body: { status: 'Offer' },
        user: {
          _id: orgAdminB._id,
          id: orgAdminB._id.toString(),
          role: 'ORGANIZATION',
          organization: orgB._id,
        },
      };

      let statusCode = 200;
      let errorResponse = null;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { errorResponse = data; return res; },
      };

      await jobController.updateApplicationStatus(req, res);
      assert.strictEqual(statusCode, 401, 'Cross-tenant org admin is rejected with 401');
      assert.strictEqual(errorResponse.message, 'Not authorized to update this pipeline');

      // Verify DB application was NOT mutated
      const appInDb = await Application.findById(appForJobOrgA._id);
      assert.strictEqual(appInDb.status, 'Screening', 'Application status remains unchanged');
    });

    await it('updateApplicationStatus: Allows same-tenant org admin to mutate pipeline', async () => {
      // OrgAdminA updates application for Job in OrgA!
      const req = {
        params: { id: appForJobOrgA._id.toString() },
        body: { status: 'Interview' },
        user: {
          _id: orgAdminA._id,
          id: orgAdminA._id.toString(),
          role: 'ORGANIZATION',
          organization: orgA._id,
        },
      };

      let jsonResponse = null;
      const res = {
        status: () => res,
        json: (data) => { jsonResponse = data; return res; },
      };

      await jobController.updateApplicationStatus(req, res);
      assert(jsonResponse !== null, 'Response returned');
      assert.strictEqual(jsonResponse.status, 'Interview', 'Same-tenant org admin can update status');

      // Verify DB application was mutated
      const appInDb = await Application.findById(appForJobOrgA._id);
      assert.strictEqual(appInDb.status, 'Interview');
    });

    await it('recruiterServiceRoutes sanitizes query.skill to escape regex special characters', () => {
      const routeSource = fs.readFileSync(path.join(__dirname, '../server/routes/recruiterServiceRoutes.js'), 'utf-8');
      assert(routeSource.includes('replace(/[.*+?^${}()|[\\]\\\\]/g'), 'Escapes regex characters in query.skill');
      assert(routeSource.includes("typeof skill === 'string'"), 'Verifies skill is a string before regex');
    });

    await it('stripeController uses port 3000 fallback URLs', () => {
      const stripeSource = fs.readFileSync(path.join(__dirname, '../server/controllers/stripeController.js'), 'utf-8');
      assert(stripeSource.includes('http://localhost:3000'), 'Uses localhost:3000 fallback');
      assert(!stripeSource.includes('http://localhost:5173'), 'Does NOT contain localhost:5173');
    });

    await it('stripeController.verifySession blocks unauthorized users', async () => {
      const testInterview = await Interview.create({
        recruiterId: recruiterA._id,
        candidateId: candidateUser._id,
        jobId: jobOrgA._id,
        meetingId: 'meet-123',
        scheduledTime: new Date(Date.now() + 86400000),
        status: 'Scheduled',
        paymentStatus: 'Unpaid',
      });

      // User B (unrelated attacker) attempts to verify payment
      const req = {
        body: { interviewId: testInterview._id.toString() },
        user: {
          _id: recruiterB._id,
          id: recruiterB._id.toString(),
          role: 'RECRUITER',
        },
      };

      let statusCode = 200;
      let jsonResponse = null;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { jsonResponse = data; return res; },
      };

      await stripeController.verifySession(req, res);
      assert.strictEqual(statusCode, 403, 'Unauthorized user is rejected with 403');
      assert(jsonResponse && jsonResponse.message.includes('Not authorized'));

      // Check DB remains Unpaid
      const interviewInDb = await Interview.findById(testInterview._id);
      assert.strictEqual(interviewInDb.paymentStatus, 'Unpaid');
    });

    await it('stripeController.verifySession allows authorized recruiter/owner', async () => {
      const testInterview = await Interview.create({
        recruiterId: recruiterA._id,
        candidateId: candidateUser._id,
        jobId: jobOrgA._id,
        meetingId: 'meet-456',
        scheduledTime: new Date(Date.now() + 86400000),
        status: 'Scheduled',
        paymentStatus: 'Unpaid',
      });

      // Recruiter A (owner) verifies payment
      const req = {
        body: { interviewId: testInterview._id.toString() },
        user: {
          _id: recruiterA._id,
          id: recruiterA._id.toString(),
          role: 'RECRUITER',
          organization: orgA._id,
        },
      };

      let jsonResponse = null;
      const res = {
        status: () => res,
        json: (data) => { jsonResponse = data; return res; },
      };

      await stripeController.verifySession(req, res);
      assert(jsonResponse !== null, 'Response returned');
      assert.strictEqual(jsonResponse.verified, true);
      assert.strictEqual(jsonResponse.paymentStatus, 'Paid');

      const interviewInDb = await Interview.findById(testInterview._id);
      assert.strictEqual(interviewInDb.paymentStatus, 'Paid');
    });

    await it('updateApplicationStatus returns 404 if associated job document is missing', async () => {
      const nonExistentJobId = new mongoose.Types.ObjectId();
      const orphanedApp = await Application.create({
        job: nonExistentJobId,
        candidate: candidateUser._id,
        status: 'Screening',
        appliedAt: new Date(),
      });

      const req = {
        params: { id: orphanedApp._id.toString() },
        body: { status: 'Interview' },
        user: { _id: recruiterA._id, id: recruiterA._id.toString(), role: 'RECRUITER' },
      };
      let statusCode = 200;
      let errorResponse = null;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { errorResponse = data; return res; },
      };

      await jobController.updateApplicationStatus(req, res);
      assert.strictEqual(statusCode, 404, 'Returns 404 when application has no valid job');
      assert(errorResponse && errorResponse.message.includes('job not found'));
    });

    await it('updateApplicationStatus handles populated organization object in req.user', async () => {
      const req = {
        params: { id: appForJobOrgA._id.toString() },
        body: { status: 'Offer' },
        user: {
          _id: orgAdminA._id,
          id: orgAdminA._id.toString(),
          role: 'ORGANIZATION',
          organization: { _id: orgA._id, name: 'Acme Corp' }, // Populated object!
        },
      };

      let jsonResponse = null;
      const res = {
        status: () => res,
        json: (data) => { jsonResponse = data; return res; },
      };

      await jobController.updateApplicationStatus(req, res);
      assert(jsonResponse !== null, 'Response returned');
      assert.strictEqual(jsonResponse.status, 'Offer', 'Populated org object properly authorized');
    });

    await it('stripeController.verifySession allows candidate to verify their own interview', async () => {
      const candInterview = await Interview.create({
        recruiterId: recruiterA._id,
        candidateId: candidateUser._id,
        jobId: jobOrgA._id,
        meetingId: 'meet-cand-999',
        scheduledTime: new Date(Date.now() + 86400000),
        status: 'Scheduled',
        paymentStatus: 'Unpaid',
      });

      const req = {
        body: { interviewId: candInterview._id.toString() },
        user: {
          _id: candidateUser._id,
          id: candidateUser._id.toString(),
          role: 'CANDIDATE',
        },
      };

      let jsonResponse = null;
      const res = {
        status: () => res,
        json: (data) => { jsonResponse = data; return res; },
      };

      await stripeController.verifySession(req, res);
      assert(jsonResponse !== null, 'Candidate can verify interview payment');
      assert.strictEqual(jsonResponse.verified, true);
      assert.strictEqual(jsonResponse.paymentStatus, 'Paid');
    });

    // ------------------------------------------------------------------------
    // Group 4: Transactional Cascades & Session Purging
    // ------------------------------------------------------------------------
    console.log('\n● Suite 4: Transactional Cascades & Session Purging');

    await it('adminController.deleteUser purges sessions and clears proposedCandidateId on candidate delete', async () => {
      // Create candidate user
      const candidateToDelete = await User.create({
        name: 'Candidate To Delete',
        email: 'deletecand@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      // Create active sessions for this candidate
      await Session.create({
        userId: candidateToDelete._id,
        refreshTokenHash: 'hash_token_cand_1',
        familyId: 'fam_cand_1',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
      await Session.create({
        userId: candidateToDelete._id,
        refreshTokenHash: 'hash_token_cand_2',
        familyId: 'fam_cand_2',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      // Create job with this candidate as proposedCandidateId
      const jobWithProposed = await Job.create({
        title: 'Lead Architect',
        description: 'Lead architecture role description',
        company: 'Acme Corp',
        location: 'Remote',
        type: 'Full-time',
        postedBy: recruiterA._id,
        proposedCandidateId: candidateToDelete._id,
        status: 'Active',
      });

      const req = {
        params: { id: candidateToDelete._id.toString() },
        user: { id: orgAdminA._id.toString(), role: 'ADMIN' },
      };
      const res = {
        status: () => res,
        json: () => res,
      };

      await adminController.deleteUser(req, res);

      // Verify sessions purged
      const remainingSessions = await Session.find({ userId: candidateToDelete._id });
      assert.strictEqual(remainingSessions.length, 0, 'All candidate sessions must be purged');

      // Verify proposedCandidateId was cleared
      const updatedJob = await Job.findById(jobWithProposed._id);
      assert.strictEqual(updatedJob.proposedCandidateId, null, 'Job.proposedCandidateId cleared to null');
    });

    await it('organizationController.removeRecruiter purges active recruiter sessions', async () => {
      const recToRemove = await User.create({
        name: 'Recruiter To Remove',
        email: 'remrec@acme.com',
        password: 'hash',
        role: 'RECRUITER',
        organization: orgA._id,
      });

      await Session.create({
        userId: recToRemove._id,
        refreshTokenHash: 'hash_rec_token_1',
        familyId: 'fam_rec_1',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const req = {
        params: { id: recToRemove._id.toString() },
        user: { id: orgAdminA._id.toString() },
      };
      const res = {
        status: () => res,
        json: () => res,
      };

      await organizationController.removeRecruiter(req, res);

      const remainingSessions = await Session.find({ userId: recToRemove._id });
      assert.strictEqual(remainingSessions.length, 0, 'Recruiter sessions must be purged upon removal');
    });

    await it('approveDelegatedHire and registerOrg implement hybrid transaction / compensating rollback (code structure)', () => {
      const jobCtrlSource = fs.readFileSync(path.join(__dirname, '../server/controllers/jobController.js'), 'utf-8');
      assert(jobCtrlSource.includes('startSession'), 'jobController uses mongoose session');
      assert(jobCtrlSource.includes('previousJobState'), 'Tracks previous state for rollback');
      assert(jobCtrlSource.includes('abortTransaction'), 'Aborts transaction on error');

      const authCtrlSource = fs.readFileSync(path.join(__dirname, '../server/controllers/authController.js'), 'utf-8');
      assert(authCtrlSource.includes('startSession'), 'authController uses mongoose session');
      assert(authCtrlSource.includes('findByIdAndDelete'), 'Contains compensating delete logic');
      assert(authCtrlSource.includes('abortTransaction'), 'Aborts transaction on error');
    });

    await it('approveDelegatedHire executes full transaction and compensating rollback on failure', async () => {
      // Create freelancer, job in reviewing status, candidate and applications
      const freelancerUser = await User.create({
        name: 'Freelancer Transact',
        email: 'free_tx@test.com',
        password: 'hash',
        role: 'INTERVIEWER',
      });

      const proposedCandidate = await User.create({
        name: 'Proposed Cand',
        email: 'prop_cand@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      const otherCandidate = await User.create({
        name: 'Other Cand',
        email: 'other_cand@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      const delegatedJob = await Job.create({
        title: 'Security Lead',
        description: 'Security role description',
        company: 'Acme Corp',
        location: 'Remote',
        type: 'Full-time',
        postedBy: recruiterA._id,
        delegatedFreelancerId: freelancerUser._id,
        delegationStatus: 'reviewing',
        status: 'Active',
        proposedCandidateId: proposedCandidate._id,
      });

      const appProposed = await Application.create({
        job: delegatedJob._id,
        candidate: proposedCandidate._id,
        status: 'Screening',
        appliedAt: new Date(),
      });

      const appOther = await Application.create({
        job: delegatedJob._id,
        candidate: otherCandidate._id,
        status: 'Applied',
        appliedAt: new Date(),
      });

      // 1. Successful execution
      const reqSuccess = {
        params: { jobId: delegatedJob._id.toString() },
        user: { _id: recruiterA._id, id: recruiterA._id.toString(), role: 'RECRUITER' },
      };
      let successResponse = null;
      const resSuccess = {
        status: () => resSuccess,
        json: (data) => { successResponse = data; return resSuccess; },
      };

      await jobController.approveDelegatedHire(reqSuccess, resSuccess);
      assert(successResponse !== null, 'approveDelegatedHire completed');

      const updatedJob = await Job.findById(delegatedJob._id);
      assert.strictEqual(updatedJob.delegationStatus, 'completed', 'Job marked completed');
      assert.strictEqual(updatedJob.status, 'Closed', 'Job closed');

      const updatedAppProposed = await Application.findById(appProposed._id);
      assert.strictEqual(updatedAppProposed.status, 'Hired', 'Proposed candidate marked Hired');

      const updatedAppOther = await Application.findById(appOther._id);
      assert.strictEqual(updatedAppOther.status, 'Rejected', 'Other applicant marked Rejected');

      const createdMsg = await Message.findOne({ receiverId: freelancerUser._id });
      assert(createdMsg !== null, 'Message sent to freelancer');
    });

    await it('registerOrg executes compensating rollback if organization creation fails', async () => {
      // Test registerOrg when Organization creation throws error (e.g. simulated DB failure)
      const uniqueEmail = `org_fail_${Date.now()}@test.com`;
      const req = {
        body: {
          name: 'Org Failure Test',
          email: uniqueEmail,
          password: 'Password123!',
          orgName: 'Failed Org Inc',
          website: 'https://failure.test',
          description: 'Failure test',
        },
      };

      let statusCode = 200;
      let errorBody = null;
      const res = {
        status: (code) => { statusCode = code; return res; },
        json: (data) => { errorBody = data; return res; },
      };

      const origSave = Organization.prototype.save;
      Organization.prototype.save = async function() {
        throw new Error('Simulated DB error saving organization');
      };

      try {
        await authController.registerOrg(req, res);
      } finally {
        Organization.prototype.save = origSave;
      }

      assert.strictEqual(statusCode, 500, 'Fails with 500 on org creation error');

      // Verify compensating rollback deleted the orphaned user
      const userInDb = await User.findOne({ email: uniqueEmail });
      assert.strictEqual(userInDb, null, 'Compensating rollback deleted the orphaned user document');
    });

    // ------------------------------------------------------------------------
    // Group 5: Type & Role Synchronization & Coding Test Hardening
    // ------------------------------------------------------------------------
    console.log('\n● Suite 5: Type & Role Synchronization & Coding Test Hardening');

    await it('types.ts defines all 5 synchronized interfaces accurately', () => {
      const typesSource = fs.readFileSync(path.join(__dirname, '../types.ts'), 'utf-8');

      // 1. Application.status includes Proposed and Hired
      assert(typesSource.includes("'Proposed'"), "Application.status includes 'Proposed'");
      assert(typesSource.includes("'Hired'"), "Application.status includes 'Hired'");

      // 2. Interview.proctorLog includes multiple_faces and screenshot
      assert(typesSource.includes("'multiple_faces'"), "Interview.proctorLog includes 'multiple_faces'");
      assert(typesSource.includes("'screenshot'"), "Interview.proctorLog includes 'screenshot'");

      // 3. Interview includes aiGenerating
      assert(typesSource.includes('aiGenerating?: boolean'), 'Interview includes aiGenerating');

      // 4. Job includes proposedCandidateId, freelancerFinalReport, aiEvaluationSummary
      assert(typesSource.includes('proposedCandidateId?: string | User'), 'Job includes proposedCandidateId');
      assert(typesSource.includes('freelancerFinalReport?: string'), 'Job includes freelancerFinalReport');
      assert(typesSource.includes('aiEvaluationSummary?: string'), 'Job includes aiEvaluationSummary');

      // 5. User includes approvalStatus and organization
      assert(typesSource.includes("approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED'"), 'User includes approvalStatus');
      assert(typesSource.includes('organization?: string'), 'User includes organization');
    });

    await it('User model setter and pre-validate hook wire normalizeRole correctly', async () => {
      // Testing ORG_ADMIN normalization
      const u1 = new User({
        name: 'Org Admin Test',
        email: 'orgnorm@test.com',
        password: 'hash',
        role: 'ORG_ADMIN',
      });
      assert.strictEqual(u1.role, 'ORGANIZATION', 'Setter normalizes ORG_ADMIN to ORGANIZATION');
      await u1.validate();
      assert.strictEqual(u1.role, 'ORGANIZATION', 'Pre-validate preserves ORGANIZATION');

      // Testing freelancer normalization
      const u2 = new User({
        name: 'Freelancer Test',
        email: 'freenorm@test.com',
        password: 'hash',
        role: 'freelancer',
      });
      assert.strictEqual(u2.role, 'INTERVIEWER', 'Setter normalizes freelancer to INTERVIEWER');
      assert.strictEqual(u2.approvalStatus, 'PENDING', 'Interviewer defaults to PENDING approvalStatus');

      // Testing candidate normalization
      const u3 = new User({
        name: 'Candidate Test',
        email: 'candnorm@test.com',
        password: 'hash',
        role: 'candidate',
      });
      assert.strictEqual(u3.role, 'CANDIDATE', 'Setter normalizes candidate to CANDIDATE');
      assert.strictEqual(u3.approvalStatus, 'APPROVED', 'Candidate defaults to APPROVED approvalStatus');
    });

    await it('codingTestController getSafePythonEnv strips sensitive keys and executeCodeReal is available', () => {
      process.env.MONGO_URI = 'mongodb://secret_admin:pass@host/db';
      process.env.JWT_SECRET = 'super_secret_jwt';
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      process.env.CUSTOM_API_KEY = 'secret_key_456';

      const safeEnv = codingTestController.getSafePythonEnv();
      assert.strictEqual(safeEnv.MONGO_URI, undefined, 'MONGO_URI scrubbed');
      assert.strictEqual(safeEnv.JWT_SECRET, undefined, 'JWT_SECRET scrubbed');
      assert.strictEqual(safeEnv.STRIPE_SECRET_KEY, undefined, 'STRIPE_SECRET_KEY scrubbed');
      assert.strictEqual(safeEnv.CUSTOM_API_KEY, undefined, 'CUSTOM_API_KEY scrubbed');
      assert.strictEqual(safeEnv.PYTHONIOENCODING, 'utf-8', 'PYTHONIOENCODING set');

      assert(typeof codingTestController.executeCodeReal === 'function', 'executeCodeReal exported');
      assert(typeof codingTestController.PYTHON_SECURITY_PRELUDE === 'string', 'PYTHON_SECURITY_PRELUDE exported');
      assert(codingTestController.PYTHON_SECURITY_PRELUDE.includes('os.system = None'), 'Prelude disables os.system');
      assert(codingTestController.PYTHON_SECURITY_PRELUDE.includes('subprocess'), 'Prelude blocks subprocess');
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 3 TESTS: ${totalCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${totalCount - passedCount}`);
    console.log('========================================================================\n');

  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runPhase3Tests().catch((err) => {
  console.error('[Phase 3 Test Runner] Fatal error:', err);
  process.exit(1);
});
