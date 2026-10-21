/**
 * Enterprise SIEM & Real-Time Audit Stream Exporter
 * Formats and streams security audit logs to Splunk, Datadog, ElasticSearch, and Syslog
 * Author: Axiocruit Enterprise Integration Platform
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

class SiemService {
  constructor() {
    this.config = {
      enabled: process.env.SIEM_ENABLED === 'true',
      format: (process.env.SIEM_FORMAT || 'ecs').toLowerCase(), // 'ecs', 'cef', 'json'
      transport: (process.env.SIEM_TRANSPORT || 'stdout').toLowerCase(), // 'http', 'stdout'
      endpointUrl: process.env.SIEM_ENDPOINT_URL || '',
      authToken: process.env.SIEM_AUTH_TOKEN || '',
      customHeaders: {},
      batchSize: parseInt(process.env.SIEM_BATCH_SIZE || '10', 10),
      flushIntervalMs: parseInt(process.env.SIEM_FLUSH_INTERVAL_MS || '1000', 10),
    };

    this.queue = [];
    this.flushTimer = null;
    this.deliveryStats = {
      totalDispatched: 0,
      totalDelivered: 0,
      totalFailed: 0,
      lastDeliveryTime: null,
      lastError: null,
    };

    this._startFlushInterval();
  }

  _startFlushInterval() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        this.flushQueue().catch((err) => {
          console.warn('[SIEM] Background flush error:', err.message);
        });
      }
    }, this.config.flushIntervalMs);
    this.flushTimer.unref();
  }

  /**
   * Update SIEM configuration dynamically (e.g. from Platform Admin API)
   */
  updateConfig(newConfig = {}) {
    if (typeof newConfig.enabled === 'boolean') this.config.enabled = newConfig.enabled;
    if (newConfig.format) this.config.format = newConfig.format.toLowerCase();
    if (newConfig.transport) this.config.transport = newConfig.transport.toLowerCase();
    if (newConfig.endpointUrl !== undefined) this.config.endpointUrl = newConfig.endpointUrl.trim();
    if (newConfig.authToken !== undefined) this.config.authToken = newConfig.authToken.trim();
    if (newConfig.customHeaders) this.config.customHeaders = newConfig.customHeaders;
    if (newConfig.batchSize) this.config.batchSize = parseInt(newConfig.batchSize, 10);

    return this.getConfig();
  }

  /**
   * Retrieve active configuration (masking secrets)
   */
  getConfig() {
    return {
      enabled: this.config.enabled,
      format: this.config.format,
      transport: this.config.transport,
      endpointUrl: this.config.endpointUrl,
      authToken: this.config.authToken ? `••••••••${this.config.authToken.slice(-4)}` : null,
      batchSize: this.config.batchSize,
      flushIntervalMs: this.config.flushIntervalMs,
      stats: { ...this.deliveryStats },
    };
  }

  /**
   * Determine ECS category and severity from action string
   */
  _classifyAction(action = '') {
    const act = action.toUpperCase();
    if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('AUTH')) {
      return { category: 'authentication', severity: 3, type: 'access' };
    }
    if (act.includes('GDPR') || act.includes('DSR') || act.includes('RETENTION') || act.includes('ANONYMIZED')) {
      return { category: 'compliance', severity: 4, type: 'privacy' };
    }
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('REUSE') || act.includes('REVOKE')) {
      return { category: 'iam', severity: 5, type: 'security_alert' };
    }
    if (act.includes('ROLE') || act.includes('PERMISSION') || act.includes('SSO')) {
      return { category: 'configuration', severity: 4, type: 'policy' };
    }
    return { category: 'audit', severity: 2, type: 'admin' };
  }

  /**
   * Serialize audit entry into Elastic Common Schema (ECS)
   */
  formatEcs(entry) {
    const classification = this._classifyAction(entry.action);
    return {
      '@timestamp': entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString(),
      event: {
        id: entry._id ? String(entry._id) : undefined,
        action: entry.action,
        category: [classification.category],
        type: [classification.type],
        severity: classification.severity,
        outcome: entry.action.includes('FAIL') ? 'failure' : 'success',
      },
      user: {
        id: entry.actor?.id ? String(entry.actor.id) : undefined,
        email: entry.actor?.email,
        roles: entry.actor?.role ? [entry.actor.role] : [],
      },
      client: {
        ip: entry.ip || undefined,
      },
      user_agent: {
        original: entry.userAgent || undefined,
      },
      axiocruit: {
        resource: entry.resource,
        details: entry.details,
      },
    };
  }

  /**
   * Serialize audit entry into Common Event Format (CEF)
   */
  formatCef(entry) {
    const classification = this._classifyAction(entry.action);
    const timestamp = entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString();
    const actorEmail = entry.actor?.email || 'system';
    const actorId = entry.actor?.id || 'unknown';
    const ip = entry.ip || '127.0.0.1';
    const detailsStr = entry.details ? JSON.stringify(entry.details).replace(/\|/g, '\\|') : '';

    return `CEF:0|Axiocruit|Axiocruit-Platform|2.0|${entry.action}|${entry.action}|${classification.severity}|rt=${timestamp} suser=${actorEmail} suid=${actorId} src=${ip} msg=${detailsStr}`;
  }

  /**
   * Serialize an entry according to the active format
   */
  formatEntry(entry) {
    if (this.config.format === 'cef') {
      return this.formatCef(entry);
    }
    if (this.config.format === 'json') {
      return { ...entry, formattedAt: new Date().toISOString() };
    }
    // Default: ECS
    return this.formatEcs(entry);
  }

  /**
   * Ingest an audit event into the SIEM queue
   */
  dispatch(auditEntry) {
    if (!this.config.enabled && this.config.transport !== 'test') {
      return;
    }

    this.deliveryStats.totalDispatched++;
    this.queue.push(auditEntry);

    if (this.queue.length >= this.config.batchSize) {
      setImmediate(() => {
        this.flushQueue().catch((err) => {
          console.warn('[SIEM] Immediate flush warning:', err.message);
        });
      });
    }
  }

  /**
   * Flush queued events to target SIEM transport
   */
  async flushQueue() {
    if (this.queue.length === 0) return { count: 0, success: true };

    const batch = this.queue.splice(0, this.config.batchSize);
    const serialized = batch.map((item) => this.formatEntry(item));

    if (this.config.transport === 'stdout') {
      for (const line of serialized) {
        console.log('[SIEM-LOG]', typeof line === 'string' ? line : JSON.stringify(line));
      }
      this.deliveryStats.totalDelivered += batch.length;
      this.deliveryStats.lastDeliveryTime = new Date().toISOString();
      return { count: batch.length, success: true };
    }

    if (this.config.transport === 'http' && this.config.endpointUrl) {
      const payloadString = this.config.format === 'cef'
        ? serialized.join('\n')
        : JSON.stringify(serialized);

      const headers = {
        'Content-Type': this.config.format === 'cef' ? 'text/plain' : 'application/json',
        'User-Agent': 'Axiocruit-SIEM-Exporter/2.0',
        ...this.config.customHeaders,
      };

      if (this.config.authToken) {
        headers['Authorization'] = `Bearer ${this.config.authToken}`;
      }

      try {
        const result = await this._postHttpPayload(this.config.endpointUrl, payloadString, headers);
        if (result.success) {
          this.deliveryStats.totalDelivered += batch.length;
          this.deliveryStats.lastDeliveryTime = new Date().toISOString();
          return { count: batch.length, success: true, statusCode: result.statusCode };
        } else {
          this.deliveryStats.totalFailed += batch.length;
          this.deliveryStats.lastError = result.error;
          console.warn('[SIEM] HTTP dispatch failed:', result.error);
          return { count: batch.length, success: false, error: result.error };
        }
      } catch (err) {
        this.deliveryStats.totalFailed += batch.length;
        this.deliveryStats.lastError = err.message;
        return { count: batch.length, success: false, error: err.message };
      }
    }

    return { count: batch.length, success: true };
  }

  /**
   * Internal HTTP POST helper
   */
  _postHttpPayload(targetUrl, payloadString, headers) {
    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(targetUrl);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            ...headers,
            'Content-Length': Buffer.byteLength(payloadString),
          },
          timeout: 4000,
        };

        const req = client.request(options, (res) => {
          let body = '';
          res.on('data', (d) => {
            if (body.length < 512) body += d.toString();
          });
          res.on('end', () => {
            resolve({
              statusCode: res.statusCode,
              success: res.statusCode >= 200 && res.statusCode < 300,
              body,
              error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
            });
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({ statusCode: 408, success: false, error: 'Connection timed out (4s SLA)' });
        });

        req.on('error', (err) => {
          resolve({ statusCode: 0, success: false, error: err.message });
        });

        req.write(payloadString);
        req.end();
      } catch (err) {
        resolve({ statusCode: 0, success: false, error: `Invalid URL: ${err.message}` });
      }
    });
  }

  /**
   * Send a test probe event to verify SIEM endpoint connectivity
   */
  async testConnection(targetUrl, authToken, format = 'ecs') {
    const probeEntry = {
      action: 'SIEM_CONNECTION_TEST',
      actor: { email: 'admin@axiocruit.com', role: 'ADMIN' },
      resource: { type: 'SIEM', id: 'probe-1' },
      details: { test: true, timestamp: Date.now() },
      ip: '127.0.0.1',
      userAgent: 'Axiocruit Probe Engine',
      timestamp: new Date(),
    };

    const prevFormat = this.config.format;
    this.config.format = format;
    const formatted = this.formatEntry(probeEntry);
    this.config.format = prevFormat;

    const payloadString = format === 'cef' ? formatted : JSON.stringify([formatted]);
    const headers = {
      'Content-Type': format === 'cef' ? 'text/plain' : 'application/json',
      'User-Agent': 'Axiocruit-SIEM-Probe/2.0',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    return await this._postHttpPayload(targetUrl, payloadString, headers);
  }
}

const siemService = new SiemService();

module.exports = siemService;
