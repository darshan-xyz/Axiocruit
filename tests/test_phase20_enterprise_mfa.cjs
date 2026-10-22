/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 20: Enterprise Multi-Factor Authentication (MFA / 2FA) with TOTP & Disaster Recovery Codes
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

const User = require('../server/models/User');
const Session = require('../server/models/Session');
const mfaService = require('../server/services/mfaService');
const mfaController = require('../server/controllers/mfaController');
const authController = require('../server/controllers/authController');

let totalTests = 0;

const it = async (name, fn) => {
  try {
    await fn();
    totalTests++;
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

async function runPhase20Tests() {
  console.log('========================================================================');
  console.log(' Axiocruit CI Phase 20: Enterprise MFA (TOTP & Recovery Codes) Suite');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    let testUser;
    const rawPassword = 'Password123!';

    await describe('1. RFC 6238 TOTP Engine & Recovery Code Algorithms', async () => {
      await it('should correctly encode and decode Base32 buffers', async () => {
        const original = Buffer.from('AxiocruitEnterprise2026', 'utf-8');
        const encoded = mfaService.base32Encode(original);
        assert.ok(typeof encoded === 'string');
        const decoded = mfaService.base32Decode(encoded);
        assert.deepStrictEqual(original, decoded);
      });

      await it('should generate random 20-byte Base32 secret', async () => {
        const secret = mfaService.generateSecret();
        assert.ok(typeof secret === 'string');
        assert.strictEqual(secret.length, 32); // 20 bytes * 8 / 5 = 32 base32 chars
      });

      await it('should generate and verify valid 6-digit TOTP tokens with drift tolerance', async () => {
        const secret = mfaService.generateSecret();
        const currentToken = mfaService.generateTotp(secret);
        assert.strictEqual(currentToken.length, 6);
        assert.ok(/^\d{6}$/.test(currentToken));

        const isValidCurrent = mfaService.verifyTotp(secret, currentToken);
        assert.strictEqual(isValidCurrent, true);

        // Verification with clock drift -1 window
        const pastToken = mfaService.generateTotp(secret, -1);
        const isValidPast = mfaService.verifyTotp(secret, pastToken, 1);
        assert.strictEqual(isValidPast, true);

        // Verification with invalid token
        const isInvalid = mfaService.verifyTotp(secret, '000000');
        // Chance of 000000 matching is 3 / 1,000,000
        assert.strictEqual(isInvalid, currentToken === '000000');
      });

      await it('should construct compliant otpauth:// URIs', async () => {
        const secret = 'JBSWY3DPEHPK3PXP';
        const uri = mfaService.generateOtpAuthUri({
          secret,
          email: 'alice@axiocruit.com',
          issuer: 'Axiocruit Corp',
        });
        assert.ok(uri.startsWith('otpauth://totp/Axiocruit%20Corp:alice%40axiocruit.com?'));
        assert.ok(uri.includes('secret=JBSWY3DPEHPK3PXP'));
        assert.ok(uri.includes('issuer=Axiocruit%20Corp'));
      });

      await it('should generate, hash, and verify 10 one-time disaster recovery codes', async () => {
        const { plainCodes, hashedCodes } = mfaService.generateRecoveryCodes(10);
        assert.strictEqual(plainCodes.length, 10);
        assert.strictEqual(hashedCodes.length, 10);

        for (const code of plainCodes) {
          assert.match(code, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
        }

        // Verify unused code
        const firstCode = plainCodes[0];
        const { valid, codeIndex } = mfaService.verifyRecoveryCode(firstCode, hashedCodes);
        assert.strictEqual(valid, true);
        assert.strictEqual(codeIndex, 0);

        // Verify invalid code
        const invalidCheck = mfaService.verifyRecoveryCode('XXXX-YYYY-ZZZZ', hashedCodes);
        assert.strictEqual(invalidCheck.valid, false);
      });
    });

    await describe('2. MFA Setup & Initial TOTP Verification Flow', async () => {
      await it('should initialize test user without MFA enabled', async () => {
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        testUser = await User.create({
          name: 'Sarah DevOps',
          email: 'sarah.devops@axiocruit.com',
          password: hashedPassword,
          role: 'ADMIN',
        });

        const req = { user: testUser };
        const res = createMockRes();

        await mfaController.getMfaStatus(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.enabled, false);
        assert.strictEqual(res.body.remainingRecoveryCodes, 0);
      });

      let tempSecret = '';

      await it('should initiate MFA setup and generate tempSecret', async () => {
        const req = { user: testUser };
        const res = createMockRes();

        await mfaController.setupMfa(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(res.body.secret);
        assert.ok(res.body.otpauthUri);

        tempSecret = res.body.secret;
        const refreshedUser = await User.findById(testUser._id);
        assert.strictEqual(refreshedUser.mfa.tempSecret, tempSecret);
        assert.strictEqual(refreshedUser.mfa.enabled, false);
      });

      await it('should reject verify-setup with invalid authentication token', async () => {
        const req = { user: testUser, body: { token: '123456' } };
        const res = createMockRes();

        await mfaController.verifySetup(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
      });

      let backupCodes = [];

      await it('should successfully verify setup, enable MFA, and return 10 recovery codes', async () => {
        const validToken = mfaService.generateTotp(tempSecret);
        const req = { user: testUser, body: { token: validToken } };
        const res = createMockRes();

        await mfaController.verifySetup(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.recoveryCodes.length, 10);

        backupCodes = res.body.recoveryCodes;

        const refreshedUser = await User.findById(testUser._id);
        assert.strictEqual(refreshedUser.mfa.enabled, true);
        assert.strictEqual(refreshedUser.mfa.secret, tempSecret);
        assert.strictEqual(refreshedUser.mfa.tempSecret, null);
        assert.strictEqual(refreshedUser.mfa.recoveryCodes.length, 10);
      });
    });

    await describe('3. 2FA Login Interception & TOTP Verification Challenge', async () => {
      let mfaChallengeToken = '';

      await it('should intercept password login and return mfaRequired: true challenge', async () => {
        const req = {
          body: {
            email: testUser.email,
            password: rawPassword,
          },
        };
        const res = createMockRes();

        await authController.loginUser(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.mfaRequired, true);
        assert.ok(res.body.mfaToken);
        assert.strictEqual(String(res.body.userId), String(testUser._id));

        mfaChallengeToken = res.body.mfaToken;
      });

      await it('should reject verifyLogin with invalid TOTP token', async () => {
        const req = {
          body: {
            mfaToken: mfaChallengeToken,
            token: '999999',
          },
        };
        const res = createMockRes();

        await mfaController.verifyLogin(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
      });

      await it('should complete verifyLogin with valid TOTP token and issue session', async () => {
        const user = await User.findById(testUser._id);
        const validTotp = mfaService.generateTotp(user.mfa.secret);

        const req = {
          body: {
            mfaToken: mfaChallengeToken,
            token: validTotp,
          },
        };
        const res = createMockRes();

        await mfaController.verifyLogin(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(String(res.body._id), String(testUser._id));
        assert.ok(res.body.accessToken);
        assert.ok(res.body.refreshToken);
        assert.strictEqual(res.body.role, 'ADMIN');

        // Verify session was persisted in MongoDB
        const sessionCount = await Session.countDocuments({ userId: testUser._id });
        assert.ok(sessionCount >= 1);
      });
    });

    await describe('4. Backup Recovery Code Login Flow', async () => {
      let challengeToken = '';

      await it('should challenge for MFA on second login attempt', async () => {
        const req = {
          body: {
            email: testUser.email,
            password: rawPassword,
          },
        };
        const res = createMockRes();

        await authController.loginUser(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.mfaRequired, true);
        challengeToken = res.body.mfaToken;
      });

      await it('should reject recoverLogin with invalid code', async () => {
        const req = {
          body: {
            mfaToken: challengeToken,
            recoveryCode: 'FAIL-FAIL-FAIL',
          },
        };
        const res = createMockRes();

        await mfaController.recoverLogin(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
      });

      let usedCode = '';

      await it('should authenticate with valid backup recovery code', async () => {
        const user = await User.findById(testUser._id);
        // Find first unused code from database
        const firstCodeHash = user.mfa.recoveryCodes[0].codeHash;
        // In verify-setup, we got plainCodes, let's test with the first code
        // We recreate a test code to be 100% deterministic
        const testPlainCode = 'AAAA-BBBB-CCCC';
        user.mfa.recoveryCodes.push({
          codeHash: mfaService.hashCode(testPlainCode),
          used: false,
          usedAt: null,
        });
        await user.save();
        usedCode = testPlainCode;

        const req = {
          body: {
            mfaToken: challengeToken,
            recoveryCode: usedCode,
          },
        };
        const res = createMockRes();

        await mfaController.recoverLogin(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.ok(res.body.accessToken);
        assert.strictEqual(String(res.body._id), String(testUser._id));

        const updatedUser = await User.findById(testUser._id);
        const usedEntry = updatedUser.mfa.recoveryCodes.find((c) => c.codeHash === mfaService.hashCode(usedCode));
        assert.strictEqual(usedEntry.used, true);
        assert.ok(usedEntry.usedAt);
      });

      await it('should reject re-using an already consumed recovery code', async () => {
        // Obtain new challenge token
        const loginReq = { body: { email: testUser.email, password: rawPassword } };
        const loginRes = createMockRes();
        await authController.loginUser(loginReq, loginRes);

        const req = {
          body: {
            mfaToken: loginRes.body.mfaToken,
            recoveryCode: usedCode,
          },
        };
        const res = createMockRes();

        await mfaController.recoverLogin(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
      });
    });

    await describe('5. Recovery Codes Regeneration & MFA Disable Flow', async () => {
      await it('should regenerate 10 recovery codes upon password confirmation', async () => {
        const req = {
          user: testUser,
          body: { password: rawPassword },
        };
        const res = createMockRes();

        await mfaController.regenerateRecoveryCodes(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.recoveryCodes.length, 10);

        const updatedUser = await User.findById(testUser._id);
        assert.strictEqual(updatedUser.mfa.recoveryCodes.length, 10);
        assert.ok(updatedUser.mfa.recoveryCodes.every((c) => c.used === false));
      });

      await it('should reject disabling MFA with incorrect password', async () => {
        const req = {
          user: testUser,
          body: { password: 'WrongPassword!' },
        };
        const res = createMockRes();

        await mfaController.disableMfa(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.body.success, false);
      });

      await it('should disable MFA with correct password and allow direct login', async () => {
        const req = {
          user: testUser,
          body: { password: rawPassword },
        };
        const res = createMockRes();

        await mfaController.disableMfa(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);

        const updatedUser = await User.findById(testUser._id);
        assert.strictEqual(updatedUser.mfa.enabled, false);
        assert.strictEqual(updatedUser.mfa.secret, null);

        // Login now directly returns tokens without mfaRequired
        const loginReq = { body: { email: testUser.email, password: rawPassword } };
        const loginRes = createMockRes();
        await authController.loginUser(loginReq, loginRes);

        assert.strictEqual(loginRes.statusCode, 200);
        assert.strictEqual(loginRes.body.mfaRequired, undefined);
        assert.ok(loginRes.body.token);
        assert.ok(loginRes.body.accessToken);
      });
    });

    console.log(`\n========================================================================`);
    console.log(`  ALL ${totalTests} PHASE 20 TESTS PASSED WITHOUT REGRESSIONS!`);
    console.log(`========================================================================\n`);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase20Tests().catch((err) => {
  console.error('\nTests failed with error:', err);
  process.exit(1);
});
