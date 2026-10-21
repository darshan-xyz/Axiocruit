/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 17: Enterprise SIEM & Real-Time Audit Stream Exporter
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const http = require('http');
const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const AuditLog = require('../server/models/AuditLog');
const siemService = require('../server/services/siemService');
const siemController = require('../server/controllers/siemController');

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

async function runPhase17Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 17: ENTERPRISE SIEM & AUDIT STREAM EXPORTER HARNESS    ');
  console.log('========================================================================');

  let mongoServer;
  let mockSiemServer;
  let mockSiemPort;
  let receivedSiemEvents = [];

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // Start a local HTTP mock server to simulate SIEM ingestion (e.g. Splunk HEC / Datadog)
    await new Promise((resolve) => {
      mockSiemServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          receivedSiemEvents.push({
            headers: req.headers,
            body,
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'delivered', events: 1 }));
        });
      });

      mockSiemServer.listen(0, '127.0.0.1', () => {
        mockSiemPort = mockSiemServer.address().port;
        console.log(`[Setup] Mock SIEM endpoint listening on http://127.0.0.1:${mockSiemPort}`);
        resolve();
      });
    });

    // Seed test Admin
    const adminUser = await User.create({
      name: 'Security Admin',
      email: 'secops@axiocruit.com',
      password: 'HashedPassword123!',
      role: 'ADMIN',
    });

    await describe('Suite 1: SIEM Serialization Formats (ECS & CEF)', async () => {
      const sampleEntry = {
        _id: '65f49ab12cd890ef12345678',
        action: 'SSO_LOGIN_SUCCESS',
        actor: { id: 'user-123', email: 'ada@lovelace.com', role: 'RECRUITER' },
        resource: { type: 'User', id: 'user-123' },
        details: { organizationId: 'org-456', isNewUser: true },
        ip: '192.168.1.50',
        userAgent: 'Mozilla/5.0 Enterprise',
        timestamp: new Date('2026-10-21T10:00:00.000Z'),
      };

      await it('Serializes audit log into Elastic Common Schema (ECS)', async () => {
        totalTests++;
        const ecs = siemService.formatEcs(sampleEntry);
        assert.strictEqual(ecs['@timestamp'], '2026-10-21T10:00:00.000Z');
        assert.strictEqual(ecs.event.action, 'SSO_LOGIN_SUCCESS');
        assert(ecs.event.category.includes('authentication'), 'Classified as authentication category');
        assert.strictEqual(ecs.user.email, 'ada@lovelace.com');
        assert.strictEqual(ecs.client.ip, '192.168.1.50');
      });

      await it('Serializes audit log into ArcSight/Splunk Common Event Format (CEF)', async () => {
        totalTests++;
        const cef = siemService.formatCef(sampleEntry);
        assert(cef.startsWith('CEF:0|Axiocruit|Axiocruit-Platform|2.0|SSO_LOGIN_SUCCESS|'));
        assert(cef.includes('suser=ada@lovelace.com'));
        assert(cef.includes('src=192.168.1.50'));
      });
    });

    await describe('Suite 2: Real-time Ingestion & HTTP Stream Delivery', async () => {
      await it('Configures SIEM HTTP streaming destination', async () => {
        totalTests++;
        siemService.updateConfig({
          enabled: true,
          transport: 'http',
          format: 'ecs',
          endpointUrl: `http://127.0.0.1:${mockSiemPort}/services/collector`,
          authToken: 'splunk-hec-secret-token',
          batchSize: 1,
        });

        const cfg = siemService.getConfig();
        assert.strictEqual(cfg.enabled, true);
        assert.strictEqual(cfg.transport, 'http');
        assert.strictEqual(cfg.authToken, '••••••••oken');
      });

      await it('Streams security audit events to mock SIEM endpoint over HTTP', async () => {
        totalTests++;
        receivedSiemEvents = [];

        const testAudit = {
          action: 'DSR_EXPORT_EXECUTED',
          actor: { email: 'candidate@test.com', role: 'CANDIDATE' },
          resource: { type: 'User', id: 'user-dsr-1' },
          details: { recordCount: 15 },
          ip: '10.0.0.1',
          userAgent: 'Chrome 128',
          timestamp: new Date(),
        };

        siemService.dispatch(testAudit);
        await siemService.flushQueue();

        assert.strictEqual(receivedSiemEvents.length, 1);
        const received = receivedSiemEvents[0];
        assert.strictEqual(received.headers['authorization'], 'Bearer splunk-hec-secret-token');

        const parsed = JSON.parse(received.body);
        assert.strictEqual(parsed[0].event.action, 'DSR_EXPORT_EXECUTED');
        assert(parsed[0].event.category.includes('compliance'));
      });
    });

    await describe('Suite 3: Platform Admin SIEM Management & Probe Diagnostics', async () => {
      await it('Sends diagnostic security probe event to verify handshake (200 OK)', async () => {
        totalTests++;
        const req = {
          user: adminUser,
          body: {
            endpointUrl: `http://127.0.0.1:${mockSiemPort}/services/collector`,
            authToken: 'test-hec-token',
            format: 'ecs',
          },
        };
        const res = createMockRes();
        await siemController.testSiemConnection(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.statusCode, 200);
      });

      await it('Retrieves sanitized SIEM configuration via Admin API', async () => {
        totalTests++;
        const req = { user: adminUser };
        const res = createMockRes();
        siemController.getSiemConfig(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert.strictEqual(res.body.config.enabled, true);
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 17 INTEGRATION TESTS: ${totalTests}`);
    console.log(`PASSED: ${totalTests}`);
    console.log(`FAILED: 0`);
    console.log('========================================================================\n');
  } finally {
    if (mockSiemServer) {
      mockSiemServer.close();
    }
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase17Tests().catch((err) => {
  console.error('Fatal error running Phase 17 tests:', err);
  process.exit(1);
});
