/**
 * Phase 2 Empirical Security, Dual-Token Session Architecture,
 * Canonical Role Migration, and Audit Logging Test Suite
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Session = require('../server/models/Session');
const AuditLog = require('../server/models/AuditLog');
const { logAuditEvent } = require('../server/utils/auditLogger');
const { matchesRole, normalizeRole, CanonicalRoles } = require('../server/utils/roleUtils');
const migrateRoles = require('../server/bootstrap/migrateRoles');
const { getJwtSecret } = require('../server/config/jwt');

// Test runner helper
let passedCount = 0;
let totalCount = 0;

function it(name, fn) {
  totalCount++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res.then(() => {
        passedCount++;
        console.log(`  ✔ PASS: ${name}`);
      }).catch((err) => {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     ${err.message}`);
        throw err;
      });
    }
    passedCount++;
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}`);
    throw err;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('  PHASE 2 EMPIRICAL SECURITY, IAM & DUAL-TOKEN AUDIT TEST HARNESS       ');
  console.log('========================================================================\n');

  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.\n');

    const authController = require('../server/controllers/authController');

    // ------------------------------------------------------------------------
    // Group 1: Role Normalization & Migration Invariants
    // ------------------------------------------------------------------------
    console.log('● Suite 1: Canonical Role Migration & Backward Compatibility');

    await it('Normalizes legacy role strings to canonical taxonomy', () => {
      assert.strictEqual(normalizeRole('freelancer'), 'INTERVIEWER');
      assert.strictEqual(normalizeRole('Freelancer'), 'INTERVIEWER');
      assert.strictEqual(normalizeRole('FREELANCER'), 'INTERVIEWER');
      assert.strictEqual(normalizeRole('organization'), 'ORGANIZATION');
      assert.strictEqual(normalizeRole('ORG_ADMIN'), 'ORGANIZATION');
      assert.strictEqual(normalizeRole('candidate'), 'CANDIDATE');
      assert.strictEqual(normalizeRole('recruiter'), 'RECRUITER');
      assert.strictEqual(normalizeRole('admin'), 'ADMIN');
    });

    await it('Backwards-compatible matchesRole matches both legacy and canonical roles', () => {
      assert.strictEqual(matchesRole('freelancer', 'INTERVIEWER'), true);
      assert.strictEqual(matchesRole('organization', 'ORGANIZATION'), true);
      assert.strictEqual(matchesRole('CANDIDATE', ['CANDIDATE']), true);
      assert.strictEqual(matchesRole('ADMIN', 'RECRUITER'), true); // Super admin passes
      assert.strictEqual(matchesRole('CANDIDATE', 'RECRUITER'), false);
    });

    await it('migrateRoles batch updates legacy MongoDB user documents to canonical schema', async () => {
      const rawDb = mongoose.connection.db;
      const usersCol = rawDb.collection('users');

      // Insert raw unmigrated legacy users
      await usersCol.insertMany([
        { name: 'Legacy Freelancer', email: 'free1@test.com', password: 'hash', role: 'freelancer' },
        { name: 'Legacy Org', email: 'org1@test.com', password: 'hash', role: 'organization' },
        { name: 'Legacy Candidate', email: 'cand1@test.com', password: 'hash', role: 'candidate' },
        { name: 'Canonical User', email: 'canon1@test.com', password: 'hash', role: 'INTERVIEWER' },
      ]);

      const result = await migrateRoles();
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.totalMigrated >= 3, true);

      const u1 = await usersCol.findOne({ email: 'free1@test.com' });
      assert.strictEqual(u1.role, 'INTERVIEWER');

      const u2 = await usersCol.findOne({ email: 'org1@test.com' });
      assert.strictEqual(u2.role, 'ORGANIZATION');

      const u3 = await usersCol.findOne({ email: 'cand1@test.com' });
      assert.strictEqual(u3.role, 'CANDIDATE');

      const u4 = await usersCol.findOne({ email: 'canon1@test.com' });
      assert.strictEqual(u4.role, 'INTERVIEWER');
    });

    // ------------------------------------------------------------------------
    // Group 2: Dual-Token Architecture & Rotation
    // ------------------------------------------------------------------------
    console.log('\n● Suite 2: Dual-Token Session Architecture & Refresh Token Rotation');

    let testUser;
    let initialRefreshToken;
    let initialAccessToken;
    let initialCookieHeader = '';
    let initialSession;

    await it('Login issues 15m Access Token + 7-Day Rotating Cookie and creates Session', async () => {
      // Create user
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('Password123!', 10);
      testUser = await User.create({
        name: 'Dual Token User',
        email: 'dualtoken@test.com',
        password: hash,
        role: 'CANDIDATE',
      });

      let cookieSet = '';
      let jsonResponse = null;
      const mockReq = {
        body: { email: 'dualtoken@test.com', password: 'Password123!' },
        headers: { 'user-agent': 'Jest-Agent/1.0' },
        ip: '127.0.0.1',
      };
      const mockRes = {
        cookie: (name, val, opts) => {
          cookieSet = `${name}=${val}; Path=${opts.path}; SameSite=${opts.sameSite}`;
        },
        json: (data) => { jsonResponse = data; },
        status: (code) => mockRes,
      };

      await authController.login(mockReq, mockRes);

      assert(jsonResponse !== null, 'Response returned');
      assert(jsonResponse.token, 'Access token returned as token');
      assert(jsonResponse.accessToken, 'Access token returned as accessToken');
      assert(jsonResponse.refreshToken, 'Refresh token returned for API clients');
      assert(cookieSet.includes('refreshToken='), 'HTTP-only refresh cookie set');

      initialAccessToken = jsonResponse.accessToken;
      initialRefreshToken = jsonResponse.refreshToken;
      initialCookieHeader = cookieSet;

      // Verify Access Token expiration is 15 minutes
      const decoded = jwt.verify(initialAccessToken, getJwtSecret());
      const tokenDurationSec = decoded.exp - decoded.iat;
      assert.strictEqual(tokenDurationSec, 15 * 60, 'Access token duration is 15 minutes');

      // Verify Session in DB
      const tokenHash = crypto.createHash('sha256').update(initialRefreshToken).digest('hex');
      initialSession = await Session.findOne({ refreshTokenHash: tokenHash });
      assert(initialSession !== null, 'Session persisted in DB');
      assert.strictEqual(initialSession.isRevoked, false);
      assert.strictEqual(initialSession.userId.toString(), testUser._id.toString());
      assert(initialSession.familyId, 'Session has familyId');
    });

    let rotatedAccessToken;
    let rotatedRefreshToken;

    await it('POST /api/auth/refresh rotates refresh token and keeps familyId', async () => {
      let jsonResponse = null;
      let newCookieSet = '';
      const mockReq = {
        cookies: { refreshToken: initialRefreshToken },
        body: {},
        headers: { 'user-agent': 'Jest-Agent/1.0' },
        ip: '127.0.0.1',
      };
      const mockRes = {
        cookie: (name, val, opts) => {
          newCookieSet = `${name}=${val}`;
        },
        json: (data) => { jsonResponse = data; },
        status: (code) => mockRes,
      };

      await authController.refresh(mockReq, mockRes);

      assert(jsonResponse !== null, 'Refresh returned data');
      assert(jsonResponse.accessToken, 'New access token issued');
      assert(jsonResponse.refreshToken, 'New refresh token issued');
      assert.notStrictEqual(jsonResponse.refreshToken, initialRefreshToken, 'Refresh token was rotated');

      rotatedAccessToken = jsonResponse.accessToken;
      rotatedRefreshToken = jsonResponse.refreshToken;

      // Check that OLD session is now revoked
      const oldSession = await Session.findById(initialSession._id);
      assert.strictEqual(oldSession.isRevoked, true, 'Old session is marked revoked');

      // Check that NEW session is created with SAME familyId
      const newHash = crypto.createHash('sha256').update(rotatedRefreshToken).digest('hex');
      const newSession = await Session.findOne({ refreshTokenHash: newHash });
      assert(newSession !== null, 'New session created');
      assert.strictEqual(newSession.isRevoked, false);
      assert.strictEqual(newSession.familyId, initialSession.familyId, 'Preserves session familyId');
    });

    await it('REUSE DETECTION: Reusing consumed refresh token revokes entire session family', async () => {
      let jsonResponse = null;
      let statusCode = 200;
      let cookieCleared = false;

      // Attacker or replay attempts to use the ALREADY-ROTATED initialRefreshToken!
      const mockReq = {
        cookies: { refreshToken: initialRefreshToken }, // STALE / CONSUMED TOKEN
        body: {},
        headers: { 'user-agent': 'Attacker-Browser' },
        ip: '192.168.1.100',
      };
      const mockRes = {
        status: (code) => { statusCode = code; return mockRes; },
        clearCookie: (name) => { cookieCleared = true; },
        json: (data) => { jsonResponse = data; },
      };

      await authController.refresh(mockReq, mockRes);

      assert.strictEqual(statusCode, 403, 'Returns 403 Forbidden on reuse');
      assert(jsonResponse.message.includes('Refresh token reuse'), 'Reports token reuse detected');
      assert.strictEqual(cookieCleared, true, 'Clears refresh cookie');

      // Assert that ALL sessions in the family were revoked!
      const familySessions = await Session.find({ familyId: initialSession.familyId });
      assert(familySessions.length >= 2, 'Family has at least 2 sessions');
      for (const sess of familySessions) {
        assert.strictEqual(sess.isRevoked, true, `Session ${sess._id} revoked in family`);
      }

      // Verify that even the newest token in that family now gets rejected on refresh
      let secondaryStatus = 200;
      const retryReq = {
        cookies: { refreshToken: rotatedRefreshToken },
        body: {},
        headers: {},
      };
      const retryRes = {
        status: (code) => { secondaryStatus = code; return retryRes; },
        clearCookie: () => {},
        json: () => {},
      };
      await authController.refresh(retryReq, retryRes);
      assert.strictEqual(secondaryStatus, 403, 'Newest token in compromised family also revoked');
    });

    await it('GET /api/auth/me returns current user identity with relations populated', async () => {
      let jsonResponse = null;
      const mockReq = {
        user: { id: testUser._id.toString() },
      };
      const mockRes = {
        json: (data) => { jsonResponse = data; },
        status: (code) => mockRes,
      };

      await authController.getMe(mockReq, mockRes);

      assert(jsonResponse !== null);
      assert.strictEqual(jsonResponse._id.toString(), testUser._id.toString());
      assert.strictEqual(jsonResponse.email, 'dualtoken@test.com');
      assert.strictEqual(jsonResponse.role, 'CANDIDATE');
    });

    await it('POST /api/auth/logout revokes session and clears cookie', async () => {
      // Create a fresh session
      const rawToken = crypto.randomBytes(40).toString('hex');
      const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const logoutSession = await Session.create({
        userId: testUser._id,
        refreshTokenHash: hash,
        familyId: 'family-logout-test',
        expiresAt: new Date(Date.now() + 100000),
      });

      let cookieCleared = false;
      let jsonResponse = null;
      const mockReq = {
        cookies: { refreshToken: rawToken },
        user: { id: testUser._id.toString() },
        headers: {},
      };
      const mockRes = {
        clearCookie: () => { cookieCleared = true; },
        json: (data) => { jsonResponse = data; },
        status: (code) => mockRes,
      };

      await authController.logout(mockReq, mockRes);

      assert.strictEqual(cookieCleared, true, 'Cookie cleared');
      assert.strictEqual(jsonResponse.message, 'Logged out successfully');

      const checked = await Session.findById(logoutSession._id);
      assert.strictEqual(checked.isRevoked, true, 'Session revoked');
    });

    // ------------------------------------------------------------------------
    // Group 3: Tamper-Evident Audit Logging
    // ------------------------------------------------------------------------
    console.log('\n● Suite 3: Tamper-Evident Audit Logging');

    await it('logAuditEvent logs actor, action, resource, details and IP metadata', async () => {
      const mockReq = {
        user: { _id: testUser._id, email: testUser.email, role: testUser.role },
        ip: '10.0.0.42',
        headers: { 'user-agent': 'Chrome-Audit-Test' },
      };

      const audit = await logAuditEvent({
        req: mockReq,
        action: 'TEST_SENSITIVE_ACTION',
        resource: { type: 'SETTINGS', id: 'config_1' },
        details: { field: '2FA', enabled: true },
      });

      assert(audit !== null, 'Audit log persisted');
      assert.strictEqual(audit.actor.email, 'dualtoken@test.com');
      assert.strictEqual(audit.actor.role, 'CANDIDATE');
      assert.strictEqual(audit.action, 'TEST_SENSITIVE_ACTION');
      assert.strictEqual(audit.resource.type, 'SETTINGS');
      assert.strictEqual(audit.resource.id, 'config_1');
      assert.strictEqual(audit.details.field, '2FA');
      assert.strictEqual(audit.ip, '10.0.0.42');
      assert.strictEqual(audit.userAgent, 'Chrome-Audit-Test');
      assert(audit.timestamp instanceof Date);
    });

    await it('adminController.getAuditLogs retrieves paginated audit logs', async () => {
      const adminController = require('../server/controllers/adminController');

      let jsonResponse = null;
      let statusCode = 200;
      const mockReq = {
        query: { limit: '10', page: '1' },
      };
      const mockRes = {
        status: (c) => { statusCode = c; return mockRes; },
        json: (data) => { jsonResponse = data; },
      };

      await adminController.getAuditLogs(mockReq, mockRes);

      assert.strictEqual(statusCode, 200);
      assert.strictEqual(jsonResponse.success, true);
      assert(jsonResponse.total >= 1);
      assert(Array.isArray(jsonResponse.logs));
      assert(jsonResponse.logs.some(l => l.action === 'TEST_SENSITIVE_ACTION'));
    });

    await it('adminController.deleteUser records USER_DELETE audit event', async () => {
      const adminController = require('../server/controllers/adminController');
      const victim = await User.create({
        name: 'Victim User',
        email: 'victim@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      const adminUser = await User.create({
        name: 'Super Admin',
        email: 'superadmin@test.com',
        password: 'hash',
        role: 'ADMIN',
      });

      const mockReq = {
        params: { id: victim._id.toString() },
        user: { id: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
        ip: '10.0.0.1',
      };
      const mockRes = {
        json: () => {},
        status: () => mockRes,
      };

      await adminController.deleteUser(mockReq, mockRes);

      const deleteAudit = await AuditLog.findOne({ action: 'USER_DELETE', 'resource.id': victim._id.toString() });
      assert(deleteAudit !== null, 'USER_DELETE audit event created');
      assert.strictEqual(deleteAudit.details.deletedEmail, 'victim@test.com');
    });

    await it('organizationController.updateOrganizationDetails records ORGANIZATION_UPDATE audit event', async () => {
      const organizationController = require('../server/controllers/organizationController');
      const Organization = require('../server/models/Organization');

      const orgAdmin = await User.create({
        name: 'Org Boss',
        email: 'orgboss@test.com',
        password: 'hash',
        role: 'ORGANIZATION',
      });
      const org = await Organization.create({
        name: 'Cyberdyne Systems',
        admin: orgAdmin._id,
      });
      orgAdmin.organization = org._id;
      await orgAdmin.save();

      const mockReq = {
        user: { id: orgAdmin._id.toString(), email: orgAdmin.email, role: 'ORGANIZATION' },
        body: { name: 'Cyberdyne Global', website: 'https://cyberdyne.ai' },
        ip: '10.0.0.2',
      };
      const mockRes = {
        json: () => {},
        status: () => mockRes,
      };

      await organizationController.updateOrganizationDetails(mockReq, mockRes);

      const orgAudit = await AuditLog.findOne({ action: 'ORGANIZATION_UPDATE', 'resource.id': org._id.toString() });
      assert(orgAudit !== null, 'ORGANIZATION_UPDATE audit event created');
      assert.strictEqual(orgAudit.details.name, 'Cyberdyne Global');
    });

    await it('organizationController.removeRecruiter records RECRUITER_REMOVE audit event', async () => {
      const organizationController = require('../server/controllers/organizationController');
      const Organization = require('../server/models/Organization');

      const orgAdmin = await User.create({
        name: 'Org Boss 2',
        email: 'orgboss2@test.com',
        password: 'hash',
        role: 'ORGANIZATION',
      });
      const org = await Organization.create({
        name: 'Wayne Enterprises',
        admin: orgAdmin._id,
      });
      orgAdmin.organization = org._id;
      await orgAdmin.save();

      const recruiter = await User.create({
        name: 'Recruiter To Remove',
        email: 'remove_rec@test.com',
        password: 'hash',
        role: 'RECRUITER',
        organization: org._id,
      });

      const mockReq = {
        params: { id: recruiter._id.toString() },
        user: { id: orgAdmin._id.toString(), email: orgAdmin.email, role: 'ORGANIZATION' },
        ip: '10.0.0.3',
      };
      const mockRes = {
        json: () => {},
        status: () => mockRes,
      };

      await organizationController.removeRecruiter(mockReq, mockRes);

      const removeAudit = await AuditLog.findOne({ action: 'RECRUITER_REMOVE', 'resource.id': recruiter._id.toString() });
      assert(removeAudit !== null, 'RECRUITER_REMOVE audit event created');
      assert.strictEqual(removeAudit.details.recruiterEmail, 'remove_rec@test.com');
    });

    await it('jobController.approveDelegatedHire records DELEGATED_HIRE_APPROVE audit event', async () => {
      const jobController = require('../server/controllers/jobController');
      const Job = require('../server/models/Job');
      const Application = require('../server/models/Application');

      const recruiter = await User.create({
        name: 'Hiring Recruiter',
        email: 'hiring_rec@test.com',
        password: 'hash',
        role: 'RECRUITER',
      });

      const candidate = await User.create({
        name: 'Selected Candidate',
        email: 'selected_cand@test.com',
        password: 'hash',
        role: 'CANDIDATE',
      });

      const job = await Job.create({
        title: 'Lead Architect',
        company: 'Axiocruit Enterprise',
        location: 'Remote',
        postedBy: recruiter._id,
        delegationStatus: 'reviewing',
        proposedCandidateId: candidate._id,
        description: 'Design robust systems',
        requirements: 'Architecture',
      });

      await Application.create({
        job: job._id,
        candidate: candidate._id,
        status: 'Applied',
      });

      const mockReq = {
        params: { jobId: job._id.toString() },
        user: { _id: recruiter._id, id: recruiter._id.toString(), email: recruiter.email, role: 'RECRUITER' },
        ip: '10.0.0.4',
      };
      const mockRes = {
        json: () => {},
        status: () => mockRes,
      };

      await jobController.approveDelegatedHire(mockReq, mockRes);

      const hireAudit = await AuditLog.findOne({ action: 'DELEGATED_HIRE_APPROVE', 'resource.id': job._id.toString() });
      assert(hireAudit !== null, 'DELEGATED_HIRE_APPROVE audit event created');
      assert.strictEqual(hireAudit.details.jobTitle, 'Lead Architect');
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 2 TESTS: ${totalCount}`);
    console.log(`PASSED: ${passedCount}`);
    console.log(`FAILED: ${totalCount - passedCount}`);
    console.log('========================================================================\n');

  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongod) {
      await mongod.stop();
    }
  }
}

runTests().catch((err) => {
  console.error('Test run failed fatal error:', err);
  process.exit(1);
});
