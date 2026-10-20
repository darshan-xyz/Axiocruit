/**
 * AXIOCRUIT PHASE 11 INTEGRATION TEST SUITE
 * Enterprise Compliance, GDPR / CCPA Privacy Engine & Automated Data Retention
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Application = require('../server/models/Application');
const Job = require('../server/models/Job');
const Interview = require('../server/models/Interview');
const TestSession = require('../server/models/TestSession');
const Session = require('../server/models/Session');
const AuditLog = require('../server/models/AuditLog');
const complianceController = require('../server/controllers/complianceController');

let mongoServer;

const describe = async (name, fn) => {
  console.log(`\n● Suite: ${name}`);
  return await fn();
};

const it = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
};

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function runPhase11Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 11: GDPR / CCPA PRIVACY & COMPLIANCE TEST HARNESS    ');
  console.log('========================================================================');

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('[Setup] In-memory MongoDB connected successfully.');

  let totalTests = 0;
  let candidateUser, otherCandidate, adminUser, testJob;

  try {
    await describe('Suite 1: GDPR Data Subject Access Request (DSAR) Export', async () => {
      // Seed test users & records
      candidateUser = await User.create({
        name: 'Sarah Connor',
        email: 'sarah.connor@test.com',
        password: 'HashedPassword123!',
        role: 'CANDIDATE',
        skills: ['Cybersecurity', 'Python', 'DevOps'],
      });

      otherCandidate = await User.create({
        name: 'John Connor',
        email: 'john.connor@test.com',
        password: 'HashedPassword123!',
        role: 'CANDIDATE',
      });

      adminUser = await User.create({
        name: 'Platform Compliance Admin',
        email: 'compliance.admin@axiocruit.com',
        password: 'AdminPassword123!',
        role: 'ADMIN',
      });

      testJob = await Job.create({
        title: 'Senior Systems Architect',
        company: 'Axiocruit Enterprise Corp',
        location: 'Remote',
        description: 'Design distributed real-time recruitment infrastructure',
        postedBy: adminUser._id,
        status: 'Active',
      });

      await Application.create({
        candidate: candidateUser._id,
        job: testJob._id,
        candidateName: candidateUser.name,
        aiScore: 94,
        status: 'Interview',
      });

      await Interview.create({
        candidateId: candidateUser._id,
        recruiterId: adminUser._id,
        jobId: testJob._id,
        scheduledTime: new Date(Date.now() + 86400000),
        status: 'Scheduled',
        meetingId: 'meeting-gdpr-test-123',
        proctorLog: [{ type: 'gaze', timestamp: Date.now() }],
      });

      await it('Blocks unauthorized candidate from exporting another candidate data (403 Forbidden)', async () => {
        totalTests++;
        const req = {
          user: { _id: otherCandidate._id, id: String(otherCandidate._id), role: 'CANDIDATE' },
          body: { userId: candidateUser._id },
        };
        const res = createMockRes();
        await complianceController.exportUserData(req, res);
        assert.strictEqual(res.statusCode, 403);
      });

      await it('Allows candidate to export their own data package with SHA256 checksum', async () => {
        totalTests++;
        const req = {
          user: { _id: candidateUser._id, id: String(candidateUser._id), role: 'CANDIDATE' },
          body: { userId: candidateUser._id },
        };
        const res = createMockRes();
        await complianceController.exportUserData(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success, 'Success is true');
        assert(res.body.checksum, 'SHA-256 checksum generated');
        assert.strictEqual(res.body.data.user.email, 'sarah.connor@test.com');
        assert.strictEqual(res.body.data.applications.length, 1);
        assert.strictEqual(res.body.data.interviews.length, 1);
      });

      await it('Allows platform ADMIN to export candidate data and records DSR_EXPORT_EXECUTED in AuditLog', async () => {
        totalTests++;
        const req = {
          user: { _id: adminUser._id, id: String(adminUser._id), role: 'ADMIN' },
          body: { userId: candidateUser._id },
        };
        const res = createMockRes();
        await complianceController.exportUserData(req, res);
        assert.strictEqual(res.statusCode, 200);

        const audit = await AuditLog.findOne({ action: 'DSR_EXPORT_EXECUTED', 'resource.id': String(candidateUser._id) });
        assert(audit, 'Audit log recorded for DSR export');
      });
    });

    await describe('Suite 2: GDPR Art. 17 / CCPA "Right to be Forgotten" Anonymization', async () => {
      let candidateToAnonymize;

      await it('Blocks non-admin from requesting anonymization for another user', async () => {
        totalTests++;
        candidateToAnonymize = await User.create({
          name: 'Kyle Reese',
          email: 'kyle.reese@future.com',
          password: 'SecretPassword123!',
          role: 'CANDIDATE',
          skills: ['Tactical', 'Leadership'],
        });

        // Add active session
        await Session.create({
          userId: candidateToAnonymize._id,
          refreshTokenHash: 'hash123',
          familyId: 'fam-anon-1',
          expiresAt: new Date(Date.now() + 86400000),
        });

        // Add application
        await Application.create({
          candidate: candidateToAnonymize._id,
          job: testJob._id,
          candidateName: 'Kyle Reese',
          aiScore: 88,
          status: 'Applied',
        });

        // Add interview with proctor log
        await Interview.create({
          candidateId: candidateToAnonymize._id,
          recruiterId: adminUser._id,
          jobId: testJob._id,
          scheduledTime: new Date(),
          status: 'Completed',
          meetingId: 'meeting-anon-kyle-456',
          proctorLog: [{ type: 'gaze', timestamp: Date.now() }],
        });

        const req = {
          user: { _id: otherCandidate._id, id: String(otherCandidate._id), role: 'CANDIDATE' },
          body: { userId: candidateToAnonymize._id },
        };
        const res = createMockRes();
        await complianceController.anonymizeCandidate(req, res);
        assert.strictEqual(res.statusCode, 403);
      });

      await it('One-way pseudonymizes user identity and purges active Dual-Token sessions', async () => {
        totalTests++;
        const req = {
          user: { _id: candidateToAnonymize._id, id: String(candidateToAnonymize._id), role: 'CANDIDATE' },
          body: { userId: candidateToAnonymize._id },
        };
        const res = createMockRes();
        await complianceController.anonymizeCandidate(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);

        // Verify User record
        const updatedUser = await User.findById(candidateToAnonymize._id);
        assert(updatedUser.name.startsWith('Anonymous Candidate'), 'Name pseudonymized');
        assert(updatedUser.email.includes('@deleted.axiocruit.com'), 'Email scrubbed with unroutable domain');
        assert.strictEqual(updatedUser.skills.length, 0, 'Skills cleared');

        // Verify active sessions purged
        const remainingSessions = await Session.find({ userId: candidateToAnonymize._id });
        assert.strictEqual(remainingSessions.length, 0, 'Active sessions completely purged');

        // Verify Application preserved with anonymized candidate name
        const app = await Application.findOne({ candidate: candidateToAnonymize._id }).populate('candidate', 'name');
        assert(app.candidate.name.startsWith('Anonymous Candidate'), 'Application candidateName anonymized');
        assert.strictEqual(app.skills.length, 0, 'Application resume snapshots cleared');
        assert.strictEqual(app.aiScore, 88, 'Aggregate business metric aiScore preserved');

        // Verify Interview proctoring log scrubbed
        const inv = await Interview.findOne({ candidateId: candidateToAnonymize._id });
        assert.strictEqual(inv.proctorLog.length, 0, 'Detailed webcam proctoring log scrubbed');

        // Verify Audit Log recorded
        const audit = await AuditLog.findOne({ action: 'CANDIDATE_ANONYMIZED_GDPR', 'resource.id': String(candidateToAnonymize._id) });
        assert(audit, 'AuditLog recorded for GDPR candidate anonymization');
      });
    });

    await describe('Suite 3: Data Retention Policy & Automated Sweep Engine', async () => {
      await it('Returns current retention policies', async () => {
        totalTests++;
        const req = { user: { role: 'ADMIN' } };
        const res = createMockRes();
        await complianceController.getRetentionPolicies(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert(res.body.policies.proctoringRetentionDays >= 30);
      });

      await it('Blocks non-admin from modifying data retention policies', async () => {
        totalTests++;
        const req = { user: { role: 'CANDIDATE' }, body: { proctoringRetentionDays: 60 } };
        const res = createMockRes();
        await complianceController.updateRetentionPolicies(req, res);
        assert.strictEqual(res.statusCode, 403);
      });

      await it('Allows Admin to update retention SLA and execute retention purge sweep', async () => {
        totalTests++;
        // Update policy
        const updateReq = {
          user: { role: 'ADMIN', _id: adminUser._id },
          body: { proctoringRetentionDays: 60, testSessionRetentionDays: 14 },
        };
        const updateRes = createMockRes();
        await complianceController.updateRetentionPolicies(updateReq, updateRes);
        assert.strictEqual(updateRes.statusCode, 200);
        assert.strictEqual(updateRes.body.policies.proctoringRetentionDays, 60);

        // Seed old interview with proctor log that should be purged (>60 days old)
        const oldDate = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000);
        const oldInterview = await Interview.create({
          candidateId: otherCandidate._id,
          recruiterId: adminUser._id,
          jobId: testJob._id,
          scheduledTime: oldDate,
          status: 'Completed',
          meetingId: 'meeting-old-retention-test',
          proctorLog: [{ type: 'gaze', timestamp: oldDate.getTime() }],
        });

        // Execute purge
        const purgeReq = { user: { role: 'ADMIN', _id: adminUser._id } };
        const purgeRes = createMockRes();
        await complianceController.executeRetentionPurge(purgeReq, purgeRes);
        assert.strictEqual(purgeRes.statusCode, 200);
        assert(purgeRes.body.purged.interviewsScrubbed >= 1, 'Scrubbed old interview proctor logs');

        // Check old interview
        const checkOldInv = await Interview.findById(oldInterview._id);
        assert.strictEqual(checkOldInv.proctorLog.length, 0, 'Old proctor logs purged');

        // Check audit log
        const purgeAudit = await AuditLog.findOne({ action: 'RETENTION_PURGE_EXECUTED' });
        assert(purgeAudit, 'AuditLog recorded for retention purge');
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 11 INTEGRATION TESTS: ${totalTests}`);
    console.log(`PASSED: ${totalTests}`);
    console.log(`FAILED: 0`);
    console.log('========================================================================\n');
  } finally {
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase11Tests().catch((err) => {
  console.error('Fatal error running Phase 11 tests:', err);
  process.exit(1);
});
