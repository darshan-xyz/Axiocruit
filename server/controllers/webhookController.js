/**
 * Enterprise Webhook Management Controller
 * Author: Axiocruit Enterprise Integration Platform
 */

const crypto = require('crypto');
const WebhookSubscription = require('../models/WebhookSubscription');
const WebhookDelivery = require('../models/WebhookDelivery');
const Organization = require('../models/Organization');
const { logAuditEvent } = require('../utils/auditLogger');
const { deliverSingleWebhook } = require('../utils/webhookDispatcher');
const { isAdminRole, isOrgAdminRole } = require('../schemas/roleTaxonomy');

/**
 * Helper to resolve user's organization ID
 */
const resolveOrgId = async (user, requestedOrgId) => {
  if (isAdminRole(user.role) && requestedOrgId) {
    return requestedOrgId;
  }
  if (user.organization) {
    return String(user.organization);
  }
  const org = await Organization.findOne({ admin: user._id || user.id });
  return org ? String(org._id) : null;
};

/**
 * GET /api/webhooks
 * List all active subscriptions for the organization
 */
const listSubscriptions = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.query.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const subscriptions = await WebhookSubscription.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .lean();

    const masked = subscriptions.map((sub) => ({
      ...sub,
      secretKey: sub.secretKey
        ? `whsec_••••••••${sub.secretKey.slice(-4)}`
        : null,
    }));

    return res.status(200).json({ success: true, subscriptions: masked });
  } catch (err) {
    console.error('[Webhooks] listSubscriptions error:', err);
    return res.status(500).json({ message: 'Failed to retrieve webhook subscriptions' });
  }
};

/**
 * POST /api/webhooks
 * Create a new webhook subscription
 */
const createSubscription = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.body.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const { targetUrl, events, description } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.match(/^https?:\/\//i)) {
      return res.status(400).json({ message: 'Valid targetUrl starting with http:// or https:// is required' });
    }

    const secretKey = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const cleanEvents = Array.isArray(events) && events.length > 0 ? events : ['all'];

    const subscription = await WebhookSubscription.create({
      organization: orgId,
      targetUrl: targetUrl.trim(),
      secretKey,
      events: cleanEvents,
      description: description?.trim() || '',
      isActive: true,
    });

    await logAuditEvent({
      req,
      action: 'WEBHOOK_SUBSCRIPTION_CREATED',
      resource: { type: 'WebhookSubscription', id: subscription._id },
      details: { targetUrl, events: cleanEvents },
    });

    return res.status(201).json({
      success: true,
      message: 'Webhook subscription created successfully. Store your secret key securely.',
      subscription,
    });
  } catch (err) {
    console.error('[Webhooks] createSubscription error:', err);
    return res.status(500).json({ message: 'Failed to create webhook subscription' });
  }
};

/**
 * DELETE /api/webhooks/:id
 * Remove a webhook subscription
 */
const deleteSubscription = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user);
    const subscription = await WebhookSubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }

    if (!isAdminRole(req.user.role) && String(subscription.organization) !== String(orgId)) {
      return res.status(403).json({ message: 'Forbidden: You do not own this webhook subscription' });
    }

    await WebhookSubscription.findByIdAndDelete(req.params.id);
    await WebhookDelivery.deleteMany({ subscriptionId: req.params.id });

    await logAuditEvent({
      req,
      action: 'WEBHOOK_SUBSCRIPTION_DELETED',
      resource: { type: 'WebhookSubscription', id: req.params.id },
      details: { targetUrl: subscription.targetUrl },
    });

    return res.status(200).json({ success: true, message: 'Webhook subscription and delivery logs deleted' });
  } catch (err) {
    console.error('[Webhooks] deleteSubscription error:', err);
    return res.status(500).json({ message: 'Failed to delete webhook subscription' });
  }
};

/**
 * POST /api/webhooks/:id/test
 * Trigger an instant test delivery
 */
const testSubscription = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user);
    const subscription = await WebhookSubscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Webhook subscription not found' });
    }

    if (!isAdminRole(req.user.role) && String(subscription.organization) !== String(orgId)) {
      return res.status(403).json({ message: 'Forbidden: You do not own this webhook subscription' });
    }

    const testData = {
      message: 'Ping from Axiocruit Enterprise Webhook Engine',
      environment: process.env.NODE_ENV || 'production',
      subscriptionId: String(subscription._id),
      testTimestamp: new Date().toISOString(),
    };

    const deliveryResult = await deliverSingleWebhook(subscription, 'ping', testData);

    return res.status(200).json({
      success: true,
      message: deliveryResult.success ? 'Test webhook delivered successfully' : 'Test webhook delivery encountered an error',
      delivery: {
        deliveryId: deliveryResult.deliveryId,
        statusCode: deliveryResult.statusCode,
        durationMs: deliveryResult.durationMs,
        success: deliveryResult.success,
        error: deliveryResult.error,
      },
    });
  } catch (err) {
    console.error('[Webhooks] testSubscription error:', err);
    return res.status(500).json({ message: 'Failed to dispatch test webhook' });
  }
};

/**
 * GET /api/webhooks/deliveries
 * Retrieve recent delivery history
 */
const listDeliveries = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.query.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const query = { organization: orgId };
    if (req.query.subscriptionId) {
      query.subscriptionId = req.query.subscriptionId;
    }

    const deliveries = await WebhookDelivery.find(query)
      .sort({ deliveredAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, deliveries });
  } catch (err) {
    console.error('[Webhooks] listDeliveries error:', err);
    return res.status(500).json({ message: 'Failed to retrieve webhook delivery history' });
  }
};

module.exports = {
  listSubscriptions,
  createSubscription,
  deleteSubscription,
  testSubscription,
  listDeliveries,
};
