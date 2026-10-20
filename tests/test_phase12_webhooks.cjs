/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 12: Enterprise Outbound Webhooks & Event Dispatcher Subsystem
 */

const http = require('http');
const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));
const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Organization = require('../server/models/Organization');
const WebhookSubscription = require('../server/models/WebhookSubscription');
const WebhookDelivery = require('../server/models/WebhookDelivery');
const AuditLog = require('../server/models/AuditLog');

const webhookController = require('../server/controllers/webhookController');
const {
  computeHmacSignature,
  deliverSingleWebhook,
  dispatchWebhookEvent,
} = require('../server/utils/webhookDispatcher');

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

async function runPhase12Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 12: ENTERPRISE WEBHOOKS & EVENT DISPATCHER HARNESS    ');
  console.log('========================================================================');

  let mongoServer;
  let testServer;
  let testServerPort;
  let receivedWebhooks = [];

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // Start a local HTTP mock server to receive webhook dispatches
    await new Promise((resolve) => {
      testServer = http.createServer((req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          receivedWebhooks.push({
            url: req.url,
            method: req.method,
            headers: req.headers,
            body: body,
          });

          if (req.url.includes('/fail')) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true }));
          }
        });
      });

      testServer.listen(0, '127.0.0.1', () => {
        testServerPort = testServer.address().port;
        console.log(`[Setup] Local webhook receiver running on http://127.0.0.1:${testServerPort}`);
        resolve();
      });
    });

    // Seed test Organizations and Users
    const orgUser1 = await User.create({
      name: 'Acme Corp Admin',
      email: 'admin@acmecorp.com',
      password: 'HashedPassword123!',
      role: 'ORGANIZATION',
    });

    const testOrg1 = await Organization.create({
      name: 'Acme Corp',
      admin: orgUser1._id,
      description: 'Enterprise Tech Solutions',
    });
    orgUser1.organization = testOrg1._id;
    await orgUser1.save();

    const orgUser2 = await User.create({
      name: 'Beta Global Admin',
      email: 'admin@betaglobal.com',
      password: 'HashedPassword123!',
      role: 'ORGANIZATION',
    });

    const testOrg2 = await Organization.create({
      name: 'Beta Global',
      admin: orgUser2._id,
      description: 'Global Finance',
    });
    orgUser2.organization = testOrg2._id;
    await orgUser2.save();

    let createdSubscriptionId;
    let savedSecretKey;

    await describe('Suite 1: Webhook Subscription Lifecycle & Multi-Tenant Authorization', async () => {
      await it('Rejects subscription creation with invalid or missing target URL', async () => {
        totalTests++;
        const req = {
          user: { _id: orgUser1._id, id: String(orgUser1._id), role: 'ORGANIZATION', organization: testOrg1._id },
          body: { targetUrl: 'not-a-valid-url' },
        };
        const res = createMockRes();
        await webhookController.createSubscription(req, res);
        assert.strictEqual(res.statusCode, 400);
      });

      await it('Creates an active webhook subscription with generated secret key and records audit log', async () => {
        totalTests++;
        const targetUrl = `http://127.0.0.1:${testServerPort}/webhook-endpoint`;
        const req = {
          user: { _id: orgUser1._id, id: String(orgUser1._id), role: 'ORGANIZATION', organization: testOrg1._id },
          body: {
            targetUrl,
            events: ['application.created', 'hire.approved'],
            description: 'Acme ATS Integration',
          },
        };
        const res = createMockRes();
        await webhookController.createSubscription(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert(res.body.success, 'Success is true');
        assert(res.body.subscription.secretKey.startsWith('whsec_'), 'Secret key generated with whsec_ prefix');

        createdSubscriptionId = res.body.subscription._id;
        savedSecretKey = res.body.subscription.secretKey;

        const audit = await AuditLog.findOne({
          action: 'WEBHOOK_SUBSCRIPTION_CREATED',
          'resource.id': String(createdSubscriptionId),
        });
        assert(audit, 'AuditLog recorded for subscription creation');
      });

      await it('Lists subscriptions with masked secret keys for the organization', async () => {
        totalTests++;
        const req = {
          user: { _id: orgUser1._id, id: String(orgUser1._id), role: 'ORGANIZATION', organization: testOrg1._id },
          query: {},
        };
        const res = createMockRes();
        await webhookController.listSubscriptions(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.subscriptions.length, 1);
        assert(res.body.subscriptions[0].secretKey.startsWith('whsec_••••••••'), 'Secret key is masked');
      });

      await it('Blocks cross-tenant deletion of webhook subscription (403 Forbidden)', async () => {
        totalTests++;
        const req = {
          user: { _id: orgUser2._id, id: String(orgUser2._id), role: 'ORGANIZATION', organization: testOrg2._id },
          params: { id: createdSubscriptionId },
        };
        const res = createMockRes();
        await webhookController.deleteSubscription(req, res);
        assert.strictEqual(res.statusCode, 403);
      });
    });

    await describe('Suite 2: Cryptographic HMAC-SHA256 Signatures & End-to-End Delivery', async () => {
      await it('Delivers webhook payload with valid HMAC-SHA256 signature in X-Axiocruit-Signature', async () => {
        totalTests++;
        receivedWebhooks = [];

        const sub = await WebhookSubscription.findById(createdSubscriptionId);
        const testEvent = 'application.created';
        const testData = {
          applicationId: 'app-98765',
          candidateName: 'Ada Lovelace',
          jobTitle: 'Lead Compiler Engineer',
          aiScore: 98,
        };

        const deliveryResult = await deliverSingleWebhook(sub, testEvent, testData);
        assert.strictEqual(deliveryResult.success, true);
        assert.strictEqual(deliveryResult.statusCode, 200);

        // Verify receiver got the HTTP call
        assert.strictEqual(receivedWebhooks.length, 1);
        const received = receivedWebhooks[0];

        // Check Headers
        assert.strictEqual(received.headers['x-axiocruit-event'], testEvent);
        assert.strictEqual(received.headers['x-axiocruit-delivery'], deliveryResult.deliveryId);
        assert(received.headers['x-axiocruit-timestamp']);

        // Verify Cryptographic Signature
        const signatureHeader = received.headers['x-axiocruit-signature'];
        assert(signatureHeader && signatureHeader.startsWith('sha256='));

        const expectedSignature = computeHmacSignature(received.body, sub.secretKey);
        assert.strictEqual(signatureHeader, expectedSignature, 'Cryptographic HMAC matches payload exactly');

        // Check envelope body
        const parsedBody = JSON.parse(received.body);
        assert.strictEqual(parsedBody.event, testEvent);
        assert.strictEqual(parsedBody.data.candidateName, 'Ada Lovelace');

        // Check WebhookDelivery audit record in DB
        const deliveryLog = await WebhookDelivery.findOne({ subscriptionId: sub._id });
        assert(deliveryLog, 'Delivery log persisted');
        assert.strictEqual(deliveryLog.success, true);
        assert.strictEqual(deliveryLog.responseStatus, 200);
      });

      await it('Records delivery failure and error message when remote target endpoint returns 500', async () => {
        totalTests++;
        // Create failing subscription
        const failSub = await WebhookSubscription.create({
          organization: testOrg1._id,
          targetUrl: `http://127.0.0.1:${testServerPort}/fail`,
          secretKey: 'whsec_testfailsecret',
          events: ['all'],
          isActive: true,
        });

        const deliveryResult = await deliverSingleWebhook(failSub, 'hire.approved', { hireId: 'hire-1' });
        assert.strictEqual(deliveryResult.success, false);
        assert.strictEqual(deliveryResult.statusCode, 500);

        const failLog = await WebhookDelivery.findOne({ subscriptionId: failSub._id });
        assert(failLog, 'Failed delivery logged');
        assert.strictEqual(failLog.success, false);
        assert.strictEqual(failLog.responseStatus, 500);
        assert(failLog.error.includes('HTTP 500'));
      });
    });

    await describe('Suite 3: Asynchronous Fan-Out Dispatcher & Lifecycle Cleanup', async () => {
      await it('Dispatches events asynchronously to matching subscribers', async () => {
        totalTests++;
        receivedWebhooks = [];

        await dispatchWebhookEvent({
          organizationId: testOrg1._id,
          event: 'application.created',
          data: { asyncTest: true, applicant: 'Grace Hopper' },
        });

        // Wait up to 500ms for setImmediate async dispatch to deliver
        await new Promise((resolve) => setTimeout(resolve, 300));

        const matched = receivedWebhooks.find((w) => w.body.includes('Grace Hopper'));
        assert(matched, 'Async dispatcher executed and delivered payload to subscriber');
      });

      await it('Allows owner organization to delete subscription and cleans up delivery logs', async () => {
        totalTests++;
        const req = {
          user: { _id: orgUser1._id, id: String(orgUser1._id), role: 'ORGANIZATION', organization: testOrg1._id },
          params: { id: createdSubscriptionId },
        };
        const res = createMockRes();
        await webhookController.deleteSubscription(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);

        const checkSub = await WebhookSubscription.findById(createdSubscriptionId);
        assert.strictEqual(checkSub, null, 'Subscription deleted from database');

        const remainingDeliveries = await WebhookDelivery.find({ subscriptionId: createdSubscriptionId });
        assert.strictEqual(remainingDeliveries.length, 0, 'Associated delivery logs cascaded and removed');
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 12 INTEGRATION TESTS: ${totalTests}`);
    console.log(`PASSED: ${totalTests}`);
    console.log(`FAILED: 0`);
    console.log('========================================================================\n');
  } finally {
    if (testServer) {
      testServer.close();
    }
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase12Tests().catch((err) => {
  console.error('Fatal error running Phase 12 tests:', err);
  process.exit(1);
});
