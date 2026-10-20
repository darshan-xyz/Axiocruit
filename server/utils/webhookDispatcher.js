/**
 * Enterprise Webhook Dispatcher Engine
 * Author: Axiocruit Enterprise Integration Platform
 */

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const WebhookSubscription = require('../models/WebhookSubscription');
const WebhookDelivery = require('../models/WebhookDelivery');

/**
 * Compute cryptographic HMAC-SHA256 signature for payload verification
 */
const computeHmacSignature = (payloadString, secretKey) => {
  return 'sha256=' + crypto.createHmac('sha256', secretKey).update(payloadString).digest('hex');
};

/**
 * Internal HTTP POST dispatcher with strict 5-second timeout
 */
const postWebhookPayload = (targetUrl, payloadString, headers) => {
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
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadString),
          'User-Agent': 'Axiocruit-Webhook-Engine/2.0',
          ...headers,
        },
        timeout: 5000,
      };

      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          if (body.length < 2048) {
            body += chunk.toString();
          }
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: body.slice(0, 1024),
            success: res.statusCode >= 200 && res.statusCode < 300,
            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: 408,
          body: '',
          success: false,
          error: 'Connection timed out (5000ms SLA)',
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: 0,
          body: '',
          success: false,
          error: err.message,
        });
      });

      req.write(payloadString);
      req.end();
    } catch (err) {
      resolve({
        statusCode: 0,
        body: '',
        success: false,
        error: `Malformed URL or dispatcher error: ${err.message}`,
      });
    }
  });
};

/**
 * Deliver payload to a single subscription and record delivery audit
 */
const deliverSingleWebhook = async (subscription, event, data) => {
  const deliveryId = crypto.randomUUID();
  const timestamp = Date.now();

  const envelope = {
    id: deliveryId,
    event,
    timestamp,
    organizationId: String(subscription.organization),
    data,
  };

  const payloadString = JSON.stringify(envelope);
  const signature = computeHmacSignature(payloadString, subscription.secretKey);

  const headers = {
    'X-Axiocruit-Event': event,
    'X-Axiocruit-Delivery': deliveryId,
    'X-Axiocruit-Timestamp': String(timestamp),
    'X-Axiocruit-Signature': signature,
  };

  const startTime = Date.now();
  const result = await postWebhookPayload(subscription.targetUrl, payloadString, headers);
  const durationMs = Date.now() - startTime;

  let deliveryRecord = null;
  try {
    deliveryRecord = await WebhookDelivery.create({
      subscriptionId: subscription._id,
      organization: subscription.organization,
      event,
      payload: envelope,
      targetUrl: subscription.targetUrl,
      responseStatus: result.statusCode,
      responseBody: result.body,
      deliveryDurationMs: durationMs,
      attempt: 1,
      success: result.success,
      error: result.error,
    });
  } catch (logErr) {
    console.warn('[WebhookDispatcher] Failed to write delivery audit:', logErr.message);
  }

  return {
    deliveryId,
    success: result.success,
    statusCode: result.statusCode,
    durationMs,
    error: result.error,
    deliveryRecord,
  };
};

/**
 * High-performance non-blocking fan-out dispatcher
 * Safely dispatches events to all active matching subscriptions for an organization
 */
const dispatchWebhookEvent = async ({ organizationId, event, data }) => {
  if (!organizationId || !event) return;

  // Process asynchronously without blocking caller
  setImmediate(async () => {
    try {
      const subscriptions = await WebhookSubscription.find({
        organization: organizationId,
        isActive: true,
        events: { $in: ['all', event] },
      });

      if (!subscriptions || subscriptions.length === 0) return;

      for (const sub of subscriptions) {
        try {
          await deliverSingleWebhook(sub, event, data);
        } catch (subErr) {
          console.warn(`[WebhookDispatcher] Delivery failed to ${sub.targetUrl}:`, subErr.message);
        }
      }
    } catch (err) {
      console.error('[WebhookDispatcher] dispatchWebhookEvent error:', err.message);
    }
  });
};

module.exports = {
  computeHmacSignature,
  deliverSingleWebhook,
  dispatchWebhookEvent,
};
