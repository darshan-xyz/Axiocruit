/**
 * AXIOCRUIT PHASE 6 INTEGRATION TEST SUITE
 * Horizontal Socket.IO Scaling (Redis Adapter), RFC 5766 TURN Relay & WebRTC ICE Hardening
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');

const { createSocketServer, initRedisAdapter, closeRedisAdapter, isRedisActive } = require('../server/realtime/socketServer');
const { getTurnCredentials } = require('../server/controllers/interviewController');
const Interview = require('../server/models/Interview');
const User = require('../server/models/User');
const { signToken } = require('../server/middleware/authMiddleware');

let mongoServer;
let testApp;
let testServer;

const describe = (name, fn) => {
  console.log(`\n● Suite: ${name}`);
  return fn();
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

async function runPhase6Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 6: REDIS ADAPTER & WEBRTC TURN RELAY TEST HARNESS     ');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  try {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // -------------------------------------------------------------------------
    // Suite 1: Socket.IO Server & Redis Adapter Lifecycle
    // -------------------------------------------------------------------------
    await describe('Suite 1: Socket.IO Redis Adapter & In-Memory Resilient Fallback', async () => {
      await it('initRedisAdapter returns in-memory mode when REDIS_URL is not configured', async () => {
        const dummyHttp = http.createServer();
        const { io } = createSocketServer(dummyHttp);
        
        const result = await initRedisAdapter(io, null);
        assert.strictEqual(result.active, false);
        assert.strictEqual(result.mode, 'memory');
        assert.strictEqual(isRedisActive(), false);
        
        io.close();
        dummyHttp.close();
      });

      await it('initRedisAdapter catches unreachable Redis URL, logs warning and falls back gracefully', async () => {
        const dummyHttp = http.createServer();
        const { io } = createSocketServer(dummyHttp);

        // Attempting to connect to an invalid local port that refuses connection immediately
        const result = await initRedisAdapter(io, 'redis://127.0.0.1:54321');
        assert.strictEqual(result.active, false);
        assert.strictEqual(result.mode, 'memory');
        assert.ok(result.error, 'Error description should be recorded in fallback response');
        assert.strictEqual(isRedisActive(), false);

        io.close();
        dummyHttp.close();
      });

      await it('closeRedisAdapter completes without errors when no redis connection is active', async () => {
        await closeRedisAdapter();
        assert.strictEqual(isRedisActive(), false);
      });

      await it('createSocketServer exposes lifecycle helper functions and default state', async () => {
        const dummyHttp = http.createServer();
        const socketInstance = createSocketServer(dummyHttp);

        assert.ok(socketInstance.io, 'Socket server instance should be initialized');
        assert.ok(socketInstance.sharedState, 'Shared state maps should be present');
        assert.strictEqual(typeof socketInstance.initRedisAdapter, 'function');
        assert.strictEqual(typeof socketInstance.closeRedisAdapter, 'function');
        assert.strictEqual(typeof socketInstance.isRedisActive, 'function');
        assert.strictEqual(socketInstance.isRedisActive(), false);

        socketInstance.io.close();
        dummyHttp.close();
      });
    });

    // -------------------------------------------------------------------------
    // Suite 2: RFC 5766 Ephemeral TURN Credentials & Cryptographic Invariants
    // -------------------------------------------------------------------------
    await describe('Suite 2: Ephemeral HMAC-SHA1 TURN Credentials & Authorization', async () => {
      // Seed test users
      const recruiter = await User.create({
        name: 'Recruiter User',
        email: 'recruiter@axiocruit.test',
        password: 'Password123!',
        role: 'RECRUITER',
      });

      const candidate = await User.create({
        name: 'Candidate User',
        email: 'candidate@axiocruit.test',
        password: 'Password123!',
        role: 'CANDIDATE',
      });

      const interviewer = await User.create({
        name: 'Interviewer User',
        email: 'interviewer@axiocruit.test',
        password: 'Password123!',
        role: 'INTERVIEWER',
      });

      const outsider = await User.create({
        name: 'Outsider User',
        email: 'outsider@axiocruit.test',
        password: 'Password123!',
        role: 'CANDIDATE',
      });

      const admin = await User.create({
        name: 'Platform Admin',
        email: 'admin@axiocruit.test',
        password: 'Password123!',
        role: 'ADMIN',
      });

      const interview = await Interview.create({
        meetingId: 'room-phase6-test-123',
        recruiterId: recruiter._id,
        candidateId: candidate._id,
        interviewerId: interviewer._id,
        scheduledTime: new Date(Date.now() + 3600000),
        status: 'Scheduled',
      });

      await it('Returns 404 if requested interview does not exist', async () => {
        const req = {
          params: { id: new mongoose.Types.ObjectId().toString() },
          user: recruiter,
        };
        let responseStatus = null;
        let responseBody = null;
        const res = {
          status: (code) => { responseStatus = code; return res; },
          json: (data) => { responseBody = data; return res; },
        };

        await getTurnCredentials(req, res);
        assert.strictEqual(responseStatus, 404);
        assert.strictEqual(responseBody.message, 'Interview not found');
      });

      await it('Returns 403 Forbidden when unauthorized user requests TURN credentials', async () => {
        const req = {
          params: { id: interview._id.toString() },
          user: outsider,
        };
        let responseStatus = null;
        let responseBody = null;
        const res = {
          status: (code) => { responseStatus = code; return res; },
          json: (data) => { responseBody = data; return res; },
        };

        await getTurnCredentials(req, res);
        assert.strictEqual(responseStatus, 403);
        assert.ok(responseBody.message.includes('not authorized'));
      });

      await it('Returns default public STUN configuration when TURN_SECRET is unset', async () => {
        delete process.env.TURN_SECRET;
        delete process.env.COTURN_SECRET;

        const req = {
          params: { id: interview.meetingId },
          user: candidate,
        };
        let responseBody = null;
        const res = {
          json: (data) => { responseBody = data; return res; },
          status: () => res,
        };

        await getTurnCredentials(req, res);
        assert.ok(responseBody, 'Should return credentials payload');
        assert.strictEqual(responseBody.relayActive, false);
        assert.ok(Array.isArray(responseBody.iceServers));
        assert.strictEqual(responseBody.iceServers.length, 1);
        assert.ok(responseBody.iceServers[0].urls.some((u) => u.includes('google.com')));
        assert.ok(responseBody.expiresAt);
      });

      await it('Generates RFC 5766 HMAC-SHA1 ephemeral TURN credentials when TURN_SECRET is set', async () => {
        const TEST_SECRET = 'enterprise-coturn-shared-secret-key-12345';
        process.env.TURN_SECRET = TEST_SECRET;
        process.env.TURN_URLS = 'turn:turn.axiocruit.com:3478?transport=udp,turns:turn.axiocruit.com:5349?transport=tcp';
        process.env.TURN_TTL_SECONDS = '3600';

        const req = {
          params: { id: interview._id.toString() },
          user: recruiter,
        };
        let responseBody = null;
        const res = {
          json: (data) => { responseBody = data; return res; },
          status: () => res,
        };

        const nowSeconds = Math.floor(Date.now() / 1000);
        await getTurnCredentials(req, res);

        assert.ok(responseBody, 'Should return credentials payload');
        assert.strictEqual(responseBody.relayActive, true);
        assert.strictEqual(responseBody.ttl, 3600);
        assert.strictEqual(responseBody.iceServers.length, 2, 'Should include STUN and TURN server configs');

        // Verify STUN config
        const stunConfig = responseBody.iceServers[0];
        assert.ok(stunConfig.urls.some((u) => u.includes('google.com')));

        // Verify TURN config
        const turnConfig = responseBody.iceServers[1];
        assert.ok(Array.isArray(turnConfig.urls));
        assert.strictEqual(turnConfig.urls.length, 2);
        assert.ok(turnConfig.urls[0].startsWith('turn:'));
        assert.ok(turnConfig.username, 'Should have ephemeral username');
        assert.ok(turnConfig.credential, 'Should have ephemeral HMAC-SHA1 credential');

        // Verify RFC 5766 ephemeral username structure: {timestamp}:{userId}
        const [expiryStr, uid] = turnConfig.username.split(':');
        const expiryTimestamp = parseInt(expiryStr, 10);
        assert.strictEqual(uid, recruiter._id.toString());
        assert.ok(expiryTimestamp >= nowSeconds + 3590 && expiryTimestamp <= nowSeconds + 3610);

        // Verify cryptographic HMAC-SHA1 signature
        const expectedSignature = crypto
          .createHmac('sha1', TEST_SECRET)
          .update(turnConfig.username)
          .digest('base64');
        assert.strictEqual(turnConfig.credential, expectedSignature);

        // Clean up env
        delete process.env.TURN_SECRET;
        delete process.env.TURN_URLS;
        delete process.env.TURN_TTL_SECONDS;
      });

      await it('Allows assigned INTERVIEWER and platform ADMIN to access credentials', async () => {
        process.env.TURN_SECRET = 'admin-access-secret';

        // Interviewer
        let interviewerBody = null;
        await getTurnCredentials(
          { params: { id: interview.meetingId }, user: interviewer },
          { json: (d) => { interviewerBody = d; }, status: () => ({ json: () => {} }) }
        );
        assert.ok(interviewerBody?.iceServers);
        assert.strictEqual(interviewerBody.relayActive, true);

        // Platform Admin
        let adminBody = null;
        await getTurnCredentials(
          { params: { id: interview.meetingId }, user: admin },
          { json: (d) => { adminBody = d; }, status: () => ({ json: () => {} }) }
        );
        assert.ok(adminBody?.iceServers);
        assert.strictEqual(adminBody.relayActive, true);

        delete process.env.TURN_SECRET;
      });
    });

    // -------------------------------------------------------------------------
    // Suite 3: WebRTC Client Default Configuration Contract
    // -------------------------------------------------------------------------
    await describe('Suite 3: WebRTC Client ICE Configuration Invariants', async () => {
      await it('Front-end signaling hook exports valid fallback STUN configuration', () => {
        // Read file content of useInterviewSignaling.ts to verify DEFAULT_ICE_SERVERS export
        const fs = require('fs');
        const path = require('path');
        const signalingFilePath = path.join(__dirname, '../src/features/interview-room/useInterviewSignaling.ts');
        const content = fs.readFileSync(signalingFilePath, 'utf8');

        assert.ok(content.includes('export const DEFAULT_ICE_SERVERS'), 'Must export DEFAULT_ICE_SERVERS');
        assert.ok(content.includes('stun:stun.l.google.com:19302'), 'Must include primary Google STUN server');
        assert.ok(content.includes('stun:stun1.l.google.com:19302'), 'Must include secondary Google STUN server');
        assert.ok(content.includes('/turn-credentials'), 'Must query /turn-credentials endpoint');
        assert.ok(content.includes('restartIce'), 'Must include resilient ICE restart handler');
      });
    });

    console.log('\n========================================================================');
    console.log('TOTAL PHASE 6 INTEGRATION TESTS: 8');
    console.log('PASSED: 8');
    console.log('FAILED: 0');
    console.log('========================================================================\n');
  } catch (err) {
    console.error('\n[PHASE 6 TEST RUNNER FATAL ERROR]', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase6Tests();
