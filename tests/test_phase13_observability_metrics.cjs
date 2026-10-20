/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 13: Enterprise Observability & Prometheus Metrics Exporter
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const metricsCollector = require('../server/utils/metricsCollector');
const { normalizePath } = require('../server/middleware/metricsMiddleware');
const metricsController = require('../server/controllers/metricsController');

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
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function runPhase13Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 13: ENTERPRISE METRICS & OBSERVABILITY TEST HARNESS   ');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    await describe('Suite 1: Metrics Registry Core Engine (Counters, Gauges, Histograms)', async () => {
      metricsCollector.reset();

      await it('Increments counters with dimensional labels accurately', async () => {
        totalTests++;
        metricsCollector.incCounter('axiocruit_http_requests_total', { method: 'POST', route: '/api/jobs', status: '201' }, 1);
        metricsCollector.incCounter('axiocruit_http_requests_total', { method: 'POST', route: '/api/jobs', status: '201' }, 2);

        const rendered = metricsCollector.renderPrometheusText();
        assert(rendered.includes('axiocruit_http_requests_total{method="POST",route="/api/jobs",status="201"} 3'));
      });

      await it('Sets, increments, and decrements gauge values', async () => {
        totalTests++;
        metricsCollector.setGauge('axiocruit_active_websocket_connections', { type: 'realtime' }, 5);
        metricsCollector.incGauge('axiocruit_active_websocket_connections', { type: 'realtime' }, 2);
        metricsCollector.decGauge('axiocruit_active_websocket_connections', { type: 'realtime' }, 1);

        const rendered = metricsCollector.renderPrometheusText();
        assert(rendered.includes('axiocruit_active_websocket_connections{type="realtime"} 6'));
      });

      await it('Computes histogram cumulative buckets, count, and sum correctly', async () => {
        totalTests++;
        metricsCollector.observeHistogram('axiocruit_http_request_duration_ms', { method: 'GET', route: '/api/health' }, 20);
        metricsCollector.observeHistogram('axiocruit_http_request_duration_ms', { method: 'GET', route: '/api/health' }, 120);

        const rendered = metricsCollector.renderPrometheusText();
        assert(rendered.includes('axiocruit_http_request_duration_ms_count{method="GET",route="/api/health"} 2'));
        assert(rendered.includes('axiocruit_http_request_duration_ms_sum{method="GET",route="/api/health"} 140'));
        assert(rendered.includes('axiocruit_http_request_duration_ms_bucket{le="+Inf",method="GET",route="/api/health"} 2'));
      });
    });

    await describe('Suite 2: Route Normalization & Telemetry Sanitation', async () => {
      await it('Normalizes MongoDB ObjectIds to prevent cardinality explosion', async () => {
        totalTests++;
        const rawUrl = '/api/jobs/65f49ab12cd890ef12345678?filter=active';
        const normalized = normalizePath(rawUrl);
        assert.strictEqual(normalized, '/api/jobs/:id');
      });

      await it('Normalizes email parameters to :email', async () => {
        totalTests++;
        const rawUrl = '/api/users/candidate.tester@axiocruit.com';
        const normalized = normalizePath(rawUrl);
        assert.strictEqual(normalized, '/api/users/:email');
      });

      await it('Normalizes UUID identifiers to :id', async () => {
        totalTests++;
        const rawUrl = '/api/webhooks/a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
        const normalized = normalizePath(rawUrl);
        assert.strictEqual(normalized, '/api/webhooks/:id');
      });
    });

    await describe('Suite 3: Prometheus Exposition & Health Probes', async () => {
      await it('Exposes Prometheus plaintext format with Content-Type text/plain', async () => {
        totalTests++;
        const req = { headers: {} };
        const res = createMockRes();

        metricsController.getPrometheusMetrics(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert(res.headers['content-type'].includes('text/plain'));
        assert(res.body.includes('# HELP axiocruit_http_requests_total'));
        assert(res.body.includes('# TYPE axiocruit_http_requests_total counter'));
      });

      await it('Returns structured JSON summary for platform Admin dashboard', async () => {
        totalTests++;
        const req = {};
        const res = createMockRes();

        metricsController.getMetricsSummary(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert(res.body.metrics.memory.heapUsedMB > 0);
        assert(typeof res.body.metrics.uptimeSeconds === 'number');
      });

      await it('Liveness probe returns alive with process uptime', async () => {
        totalTests++;
        const req = {};
        const res = createMockRes();

        metricsController.getLivenessProbe(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.status, 'alive');
        assert(res.body.uptimeSeconds >= 0);
      });

      await it('Readiness probe validates MongoDB connection and memory status (200 Ready)', async () => {
        totalTests++;
        const req = {};
        const res = createMockRes();

        metricsController.getReadinessProbe(req, res);
        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.body.status, 'ready');
        assert.strictEqual(res.body.checks.mongodb.status, 'connected');
        assert.strictEqual(res.body.checks.mongodb.healthy, true);
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 13 INTEGRATION TESTS: ${totalTests}`);
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

runPhase13Tests().catch((err) => {
  console.error('Fatal error running Phase 13 tests:', err);
  process.exit(1);
});
