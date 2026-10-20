/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 14: Enterprise Single Sign-On (SSO) & IdP Federation
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Organization = require('../server/models/Organization');
const Session = require('../server/models/Session');
const AuditLog = require('../server/models/AuditLog');

const ssoController = require('../server/controllers/ssoController');
const authController = require('../server/controllers/authController');

let totalTests = 0;

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

const describe = async (name, fn) => {
  console.log(`\n● Suite: ${name}`);
  await fn();
};

const createMockRes = () => {
  const res = {
    statusCode: 200,
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    cookie(k, v, opts) {
      this.cookies[k] = { value: v, opts };
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function runPhase14Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 14: ENTERPRISE SSO & IDP FEDERATION TEST HARNESS      ');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // Seed test Admin & Organizations
    const platformAdmin = await User.create({
      name: 'Platform Admin',
      email: 'admin@axiocruit.com',
      password: 'AdminPassword123!',
      role: 'ADMIN',
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('BatmanPassword123!', salt);

    const orgAdmin = await User.create({
      name: 'Wayne Enterprises Admin',
      email: 'bruce@wayneenterprises.com',
      password: hashedPassword,
      role: 'ORGANIZATION',
    });

    const wayneOrg = await Organization.create({
      name: 'Wayne Enterprises',
      admin: orgAdmin._id,
      description: 'Global Defense & Tech Conglomerate',
      ssoConfig: {
        enabled: true,
        enforceSso: false,
        provider: 'okta',
        domains: ['wayneenterprises.com'],
        issuer: 'https://wayne.okta.com',
        clientId: 'wayne-client-id-123',
        clientSecret: 'super-secret-okta-token',
        authorizationUrl: 'https://wayne.okta.com/oauth2/v1/authorize',
        defaultRole: 'RECRUITER',
        jitProvisioning: true,
      },
    });

    orgAdmin.organization = wayneOrg._id;
    await orgAdmin.save();

    await describe('Suite 1: Corporate Domain Lookup & Multi-Tenant Isolation', async () => {
      await it('Resolves SSO provider info for registered corporate domain', async () => {
        totalTests++;
        const req = { query: { email: 'lucius.fox@wayneenterprises.com' } };
        const res = createMockRes();
        await ssoController.lookupSsoDomain(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.ssoAvailable, true);
        assert.strictEqual(res.body.organizationName, 'Wayne Enterprises');
        assert.strictEqual(res.body.provider, 'okta');
      });

      await it('Returns ssoAvailable=false for unregistered public domains', async () => {
        totalTests++;
        const req = { query: { email: 'john.doe@gmail.com' } };
        const res = createMockRes();
        await ssoController.lookupSsoDomain(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.ssoAvailable, false);
      });

      await it('Prevents cross-organization domain hijacking (409 Conflict)', async () => {
        totalTests++;
        // Create second org
        const starkAdmin = await User.create({
          name: 'Stark Admin',
          email: 'tony@starkindustries.com',
          password: 'IronPassword123!',
          role: 'ORGANIZATION',
        });
        const starkOrg = await Organization.create({
          name: 'Stark Industries',
          admin: starkAdmin._id,
          ssoConfig: { enabled: true, domains: ['starkindustries.com'] },
        });

        // Stark tries to register Wayne's domain
        const req = {
          user: { _id: starkAdmin._id, id: String(starkAdmin._id), role: 'ORGANIZATION', organization: starkOrg._id },
          body: { domains: ['wayneenterprises.com', 'starkindustries.com'] },
        };
        const res = createMockRes();
        await ssoController.updateOrgSsoSettings(req, res);

        assert.strictEqual(res.statusCode, 409);
        assert(res.body.message.includes('already registered'));
      });
    });

    await describe('Suite 2: State Signing, Nonce Generation & Replay Protection', async () => {
      let validState;

      await it('Initiates SSO flow with cryptographically signed state token', async () => {
        totalTests++;
        const req = {
          body: {
            domain: 'wayneenterprises.com',
            redirectUri: 'https://axiocruit.com/auth/sso/callback',
          },
        };
        const res = createMockRes();
        await ssoController.initiateSso(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert(res.body.authorizationUrl.startsWith('https://wayne.okta.com/oauth2/v1/authorize'));
        assert(res.body.state, 'State token generated');

        validState = res.body.state;
      });

      await it('Verifies valid HMAC-signed state and decodes payload', async () => {
        totalTests++;
        const result = ssoController.verifySsoState(validState);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.payload.domain, 'wayneenterprises.com');
      });

      await it('Rejects tampered state parameter with HMAC validation failure', async () => {
        totalTests++;
        const tamperedState = validState.slice(0, -6) + 'xxxxxx';
        const result = ssoController.verifySsoState(tamperedState);
        assert.strictEqual(result.valid, false);
      });
    });

    await describe('Suite 3: JIT User Provisioning & Dual-Token Session Issuance', async () => {
      await it('Provisions new employee on callback and issues Dual-Token session', async () => {
        totalTests++;
        const statePayload = {
          orgId: String(wayneOrg._id),
          domain: 'wayneenterprises.com',
          nonce: 'test-nonce-123',
          timestamp: Date.now(),
        };
        const state = ssoController.signSsoState(statePayload);

        const req = {
          body: {
            state,
            verifiedIdentity: {
              email: 'alfred.pennyworth@wayneenterprises.com',
              name: 'Alfred Pennyworth',
              sub: 'okta-alfred-999',
            },
          },
          headers: { 'user-agent': 'Chrome Headless Test' },
          ip: '127.0.0.1',
        };
        const res = createMockRes();
        await ssoController.handleSsoCallback(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.isNewUser, true);
        assert(res.body.token, '15-minute access token returned');
        assert(res.cookies.refreshToken, 'Rotating refresh cookie set');

        // Verify User record in DB
        const newUser = await User.findOne({ email: 'alfred.pennyworth@wayneenterprises.com' });
        assert(newUser, 'New employee JIT-provisioned in MongoDB');
        assert.strictEqual(newUser.role, 'RECRUITER');
        assert.strictEqual(String(newUser.organization), String(wayneOrg._id));

        // Verify active Dual-Token session in MongoDB
        const session = await Session.findOne({ userId: newUser._id });
        assert(session, 'Session document created in MongoDB');
        assert.strictEqual(session.isRevoked, false);

        // Verify Audit Log recorded
        const audit = await AuditLog.findOne({
          action: 'SSO_USER_JIT_PROVISIONED',
          'resource.id': String(newUser._id),
        });
        assert(audit, 'AuditLog recorded for JIT provisioning');
      });
    });

    await describe('Suite 4: Enterprise SSO Policy Enforcement on Password Login', async () => {
      await it('Enforces corporate SSO: blocks standard password login when enforceSso=true (403 Forbidden)', async () => {
        totalTests++;
        // Enable enforceSso on Wayne Enterprises
        wayneOrg.ssoConfig.enforceSso = true;
        await wayneOrg.save();

        const req = {
          body: {
            email: 'bruce@wayneenterprises.com',
            password: 'BatmanPassword123!',
          },
        };
        const res = createMockRes();
        await authController.loginUser(req, res);

        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.ssoEnforced, true);
        assert(res.body.message.includes('Corporate Single Sign-On (SSO) is enforced'));
      });

      await it('Allows password login when enforceSso=false', async () => {
        totalTests++;
        wayneOrg.ssoConfig.enforceSso = false;
        await wayneOrg.save();

        const req = {
          body: {
            email: 'bruce@wayneenterprises.com',
            password: 'BatmanPassword123!',
          },
        };
        const res = createMockRes();
        await authController.loginUser(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.token, 'User logged in successfully with password when SSO not strictly enforced');
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 14 INTEGRATION TESTS: ${totalTests}`);
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

runPhase14Tests().catch((err) => {
  console.error('Fatal error running Phase 14 tests:', err);
  process.exit(1);
});
