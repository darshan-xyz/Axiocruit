/**
 * Enterprise Metrics & Telemetry Registry
 * Prometheus 0.0.4 text format compatible metrics collector
 * Author: Axiocruit Enterprise Integration Platform
 */

const os = require('os');

class MetricsRegistry {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.defaultBuckets = [5, 15, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

    // Track event loop lag
    this.lastCheck = Date.now();
    this.eventLoopLagMs = 0;
    this._startLagMonitor();
  }

  _startLagMonitor() {
    const interval = 2000;
    setInterval(() => {
      const now = Date.now();
      const drift = now - this.lastCheck - interval;
      this.eventLoopLagMs = Math.max(0, drift);
      this.lastCheck = now;
      this.setGauge('axiocruit_event_loop_lag_ms', {}, this.eventLoopLagMs);
    }, interval).unref();
  }

  _formatLabels(labels = {}) {
    const keys = Object.keys(labels);
    if (keys.length === 0) return '';
    const formatted = keys
      .sort()
      .map((k) => `${k}="${String(labels[k]).replace(/"/g, '\\"')}"`)
      .join(',');
    return `{${formatted}}`;
  }

  _getKey(name, labels = {}) {
    return `${name}${this._formatLabels(labels)}`;
  }

  /**
   * Increment a counter
   */
  incCounter(name, labels = {}, value = 1) {
    const key = this._getKey(name, labels);
    const current = this.counters.get(key) || { name, labels, value: 0 };
    current.value += value;
    this.counters.set(key, current);
  }

  /**
   * Set a gauge value
   */
  setGauge(name, labels = {}, value = 0) {
    const key = this._getKey(name, labels);
    this.gauges.set(key, { name, labels, value: Number(value) });
  }

  /**
   * Increment a gauge
   */
  incGauge(name, labels = {}, value = 1) {
    const key = this._getKey(name, labels);
    const current = this.gauges.get(key) || { name, labels, value: 0 };
    current.value += value;
    this.gauges.set(key, current);
  }

  /**
   * Decrement a gauge
   */
  decGauge(name, labels = {}, value = 1) {
    const key = this._getKey(name, labels);
    const current = this.gauges.get(key) || { name, labels, value: 0 };
    current.value -= value;
    this.gauges.set(key, current);
  }

  /**
   * Observe a value in a histogram
   */
  observeHistogram(name, labels = {}, value, buckets = this.defaultBuckets) {
    const baseKey = this._getKey(name, labels);
    let hist = this.histograms.get(baseKey);

    if (!hist) {
      hist = {
        name,
        labels,
        buckets: buckets.sort((a, b) => a - b),
        counts: new Array(buckets.length).fill(0),
        sum: 0,
        count: 0,
      };
      this.histograms.set(baseKey, hist);
    }

    hist.count += 1;
    hist.sum += value;

    for (let i = 0; i < hist.buckets.length; i++) {
      if (value <= hist.buckets[i]) {
        hist.counts[i] += 1;
      }
    }
  }

  /**
   * Collect system metrics (memory, CPU, uptime)
   */
  _collectSystemMetrics() {
    const mem = process.memoryUsage();
    this.setGauge('axiocruit_node_memory_bytes', { type: 'rss' }, mem.rss);
    this.setGauge('axiocruit_node_memory_bytes', { type: 'heapTotal' }, mem.heapTotal);
    this.setGauge('axiocruit_node_memory_bytes', { type: 'heapUsed' }, mem.heapUsed);
    this.setGauge('axiocruit_node_memory_bytes', { type: 'external' }, mem.external);

    this.setGauge('axiocruit_node_uptime_seconds', {}, Math.floor(process.uptime()));
    this.setGauge('axiocruit_system_cpu_cores', {}, os.cpus().length);
  }

  /**
   * Render metrics in Prometheus 0.0.4 text format
   */
  renderPrometheusText() {
    this._collectSystemMetrics();

    const lines = [];

    // Metadata & HELP documentation
    lines.push('# HELP axiocruit_http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE axiocruit_http_requests_total counter');
    lines.push('# HELP axiocruit_http_request_duration_ms HTTP request latency in milliseconds');
    lines.push('# TYPE axiocruit_http_request_duration_ms histogram');
    lines.push('# HELP axiocruit_active_websocket_connections Active real-time WebSocket sessions');
    lines.push('# TYPE axiocruit_active_websocket_connections gauge');
    lines.push('# HELP axiocruit_candidate_applications_total Total candidate job applications by status');
    lines.push('# TYPE axiocruit_candidate_applications_total counter');
    lines.push('# HELP axiocruit_coding_assessments_total Total coding assessments conducted');
    lines.push('# TYPE axiocruit_coding_assessments_total counter');
    lines.push('# HELP axiocruit_proctoring_anomalies_total Total proctoring anomalies detected');
    lines.push('# TYPE axiocruit_proctoring_anomalies_total counter');
    lines.push('# HELP axiocruit_webhooks_dispatched_total Total outbound enterprise webhooks dispatched');
    lines.push('# TYPE axiocruit_webhooks_dispatched_total counter');
    lines.push('# HELP axiocruit_circuit_breaker_state Circuit breaker status (0=CLOSED, 1=HALF_OPEN, 2=OPEN)');
    lines.push('# TYPE axiocruit_circuit_breaker_state gauge');
    lines.push('# HELP axiocruit_node_memory_bytes Node.js process memory consumption in bytes');
    lines.push('# TYPE axiocruit_node_memory_bytes gauge');
    lines.push('# HELP axiocruit_node_uptime_seconds Node.js process uptime in seconds');
    lines.push('# TYPE axiocruit_node_uptime_seconds gauge');
    lines.push('# HELP axiocruit_event_loop_lag_ms Event loop latency drift in milliseconds');
    lines.push('# TYPE axiocruit_event_loop_lag_ms gauge');

    // Counters
    for (const [key, item] of this.counters.entries()) {
      lines.push(`${key} ${item.value}`);
    }

    // Gauges
    for (const [key, item] of this.gauges.entries()) {
      lines.push(`${key} ${item.value}`);
    }

    // Histograms
    for (const [_, hist] of this.histograms.entries()) {
      let cumulative = 0;
      for (let i = 0; i < hist.buckets.length; i++) {
        cumulative += hist.counts[i];
        const bucketLabels = { ...hist.labels, le: String(hist.buckets[i]) };
        lines.push(`${hist.name}_bucket${this._formatLabels(bucketLabels)} ${cumulative}`);
      }
      const infLabels = { ...hist.labels, le: '+Inf' };
      lines.push(`${hist.name}_bucket${this._formatLabels(infLabels)} ${hist.count}`);
      lines.push(`${hist.name}_count${this._formatLabels(hist.labels)} ${hist.count}`);
      lines.push(`${hist.name}_sum${this._formatLabels(hist.labels)} ${hist.sum}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Return a summary object for Admin JSON dashboards
   */
  getSummary() {
    this._collectSystemMetrics();

    const summary = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      eventLoopLagMs: this.eventLoopLagMs,
      memory: {
        rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      requestsTotal: 0,
      activeWebsockets: 0,
      webhooksDispatched: 0,
      proctoringViolations: 0,
    };

    for (const [key, item] of this.counters.entries()) {
      if (item.name === 'axiocruit_http_requests_total') {
        summary.requestsTotal += item.value;
      }
      if (item.name === 'axiocruit_webhooks_dispatched_total') {
        summary.webhooksDispatched += item.value;
      }
      if (item.name === 'axiocruit_proctoring_anomalies_total') {
        summary.proctoringViolations += item.value;
      }
    }

    for (const [key, item] of this.gauges.entries()) {
      if (item.name === 'axiocruit_active_websocket_connections') {
        summary.activeWebsockets += item.value;
      }
    }

    return summary;
  }

  /**
   * Clear all stored metrics (primarily for test isolation)
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

const metricsCollector = new MetricsRegistry();

module.exports = metricsCollector;
