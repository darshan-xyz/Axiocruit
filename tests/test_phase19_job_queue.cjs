/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 19: Enterprise Distributed Background Job Queue & Dead-Letter Queue (DLQ)
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const BackgroundJob = require('../server/models/BackgroundJob');
const jobQueueService = require('../server/services/jobQueueService');
const queueController = require('../server/controllers/queueController');
const User = require('../server/models/User');

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

async function runPhase19Tests() {
  console.log('========================================================================');
  console.log(' Axiocruit CI Phase 19: Distributed Background Job Queue & DLQ Suite');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    let adminUser;

    await describe('1. Setup & Environment Initialization', async () => {
      await it('should initialize models and test admin user', async () => {
        adminUser = await User.create({
          name: 'Platform Admin',
          email: 'admin-queue@axiocruit.com',
          password: 'Password123!',
          role: 'ADMIN',
        });
        assert.ok(adminUser._id);
      });
    });

    await describe('2. Job Enqueuing, Priority & Delay Semantics', async () => {
      await it('should enqueue jobs with priority ordering', async () => {
        const jobLow = await jobQueueService.enqueueJob('email_digest', { userId: 'u1' }, { priority: 1 });
        const jobHigh = await jobQueueService.enqueueJob('email_digest', { userId: 'u2' }, { priority: 10 });
        const jobNormal = await jobQueueService.enqueueJob('email_digest', { userId: 'u3' }, { priority: 5 });

        assert.strictEqual(jobLow.status, 'queued');
        assert.strictEqual(jobHigh.priority, 10);

        // When acquiring next job, jobHigh should be leased first
        const nextJob = await jobQueueService.acquireNextJob('worker-test-1');
        assert.ok(nextJob);
        assert.strictEqual(String(nextJob._id), String(jobHigh._id));
        assert.strictEqual(nextJob.status, 'processing');
        assert.strictEqual(nextJob.lockedBy, 'worker-test-1');
        assert.ok(nextJob.lockedUntil > new Date());
      });

      await it('should respect scheduledAt delay semantics', async () => {
        // Enqueue delayed job (future)
        const delayedJob = await jobQueueService.enqueueJob('delayed_task', { task: 1 }, { delayMs: 60000 });
        assert.ok(delayedJob.scheduledAt > new Date());

        // Should not be acquired because scheduledAt > now
        const acquired = await jobQueueService.acquireNextJob('worker-test-delay');
        // If acquired is not null, it must NOT be the delayed job
        if (acquired) {
          assert.notStrictEqual(String(acquired._id), String(delayedJob._id));
        }
      });
    });

    await describe('3. Worker Execution & Handler Lifecycle', async () => {
      await BackgroundJob.deleteMany({});

      await it('should register handler and successfully execute job', async () => {
        let executedPayload = null;

        jobQueueService.registerHandler('test_success_job', async (payload) => {
          executedPayload = payload;
          return { done: true };
        });

        const job = await jobQueueService.enqueueJob('test_success_job', { action: 'send_report', count: 42 });
        const acquired = await jobQueueService.acquireNextJob('worker-exec-1');
        assert.strictEqual(String(acquired._id), String(job._id));

        const result = await jobQueueService.executeJob(acquired, 'worker-exec-1');
        assert.strictEqual(result.success, true);
        assert.deepStrictEqual(executedPayload, { action: 'send_report', count: 42 });

        const updatedJob = await BackgroundJob.findById(job._id);
        assert.strictEqual(updatedJob.status, 'completed');
        assert.ok(updatedJob.completedAt);
        assert.strictEqual(updatedJob.lockedUntil, null);
      });

      await it('should move jobs with missing handlers directly to dead_letter', async () => {
        const job = await jobQueueService.enqueueJob('unknown_unregistered_job', { foo: 'bar' });
        const acquired = await jobQueueService.acquireNextJob('worker-exec-2');
        assert.strictEqual(String(acquired._id), String(job._id));

        const result = await jobQueueService.executeJob(acquired);
        assert.strictEqual(result.success, false);

        const updatedJob = await BackgroundJob.findById(job._id);
        assert.strictEqual(updatedJob.status, 'dead_letter');
        assert.ok(updatedJob.failedReason.includes('No registered worker handler'));
      });
    });

    await describe('4. Retries, Exponential Backoff & Dead-Letter Queue (DLQ)', async () => {
      await it('should retry on failure with exponential backoff', async () => {
        let callCount = 0;
        jobQueueService.registerHandler('flaky_job', async () => {
          callCount++;
          throw new Error('Temporary 3rd-party outage');
        });

        const job = await jobQueueService.enqueueJob('flaky_job', {}, { maxAttempts: 3 });
        const acquired = await jobQueueService.acquireNextJob('worker-flaky');
        assert.strictEqual(String(acquired._id), String(job._id));
        assert.strictEqual(acquired.attempts, 1);

        const result = await jobQueueService.executeJob(acquired);
        assert.strictEqual(result.success, false);

        const failedJob = await BackgroundJob.findById(job._id);
        assert.strictEqual(failedJob.status, 'failed');
        assert.strictEqual(failedJob.attempts, 1);
        assert.ok(failedJob.failedReason.includes('Temporary 3rd-party outage'));
        // Backoff scheduledAt should be in the future (2^1 = 2 seconds)
        assert.ok(failedJob.scheduledAt > new Date());
      });

      await it('should transition to dead_letter when maxAttempts is reached', async () => {
        const job = await BackgroundJob.create({
          type: 'flaky_job',
          status: 'queued',
          attempts: 2, // will become attempt 3
          maxAttempts: 3,
          scheduledAt: new Date(Date.now() - 1000),
        });

        const acquired = await jobQueueService.acquireNextJob('worker-dlq');
        assert.strictEqual(String(acquired._id), String(job._id));
        assert.strictEqual(acquired.attempts, 3);

        const result = await jobQueueService.executeJob(acquired);
        assert.strictEqual(result.success, false);

        const dlqJob = await BackgroundJob.findById(job._id);
        assert.strictEqual(dlqJob.status, 'dead_letter');
      });
    });

    await describe('5. Admin Queue Controller & DLQ Recovery Endpoints', async () => {
      await it('should retrieve queue stats via getQueueStats', async () => {
        const req = { user: adminUser };
        const res = createMockRes();

        await queueController.getQueueStats(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(typeof res.body.stats.total === 'number');
        assert.ok(res.body.stats.dead_letter >= 2);
      });

      await it('should list jobs with pagination and status filters', async () => {
        const req = {
          user: adminUser,
          query: { status: 'dead_letter', page: 1, limit: 10 },
        };
        const res = createMockRes();

        await queueController.listJobs(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.ok(Array.isArray(res.body.jobs));
        assert.ok(res.body.jobs.every((j) => j.status === 'dead_letter'));
      });

      await it('should re-enqueue a dead-letter job via retryJob endpoint', async () => {
        const dlqJob = await BackgroundJob.findOne({ status: 'dead_letter' });
        assert.ok(dlqJob);

        const req = {
          user: adminUser,
          params: { id: String(dlqJob._id) },
        };
        const res = createMockRes();

        await queueController.retryJob(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.job.status, 'queued');
        assert.strictEqual(res.body.job.attempts, 0);

        const refreshed = await BackgroundJob.findById(dlqJob._id);
        assert.strictEqual(refreshed.status, 'queued');
      });

      await it('should delete a job via deleteJob endpoint', async () => {
        const testJob = await jobQueueService.enqueueJob('to_delete', {});
        const req = {
          user: adminUser,
          params: { id: String(testJob._id) },
        };
        const res = createMockRes();

        await queueController.deleteJob(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.success, true);

        const deleted = await BackgroundJob.findById(testJob._id);
        assert.strictEqual(deleted, null);
      });

      await it('should enqueue a job via enqueueJob endpoint', async () => {
        const req = {
          user: adminUser,
          body: {
            type: 'admin_bulk_export',
            payload: { exportType: 'pdf_reports' },
            priority: 5,
          },
        };
        const res = createMockRes();

        await queueController.enqueueJob(req, res);
        assert.strictEqual(res.statusCode, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.job.type, 'admin_bulk_export');
        assert.strictEqual(res.body.job.priority, 5);
      });
    });

    console.log(`\n========================================================================`);
    console.log(`  ALL ${totalTests} PHASE 19 TESTS PASSED WITHOUT REGRESSIONS!`);
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

runPhase19Tests().catch((err) => {
  console.error('\nTests failed with error:', err);
  process.exit(1);
});
