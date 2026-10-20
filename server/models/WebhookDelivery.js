/**
 * Enterprise Webhook Delivery Audit Log Model
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const webhookDeliverySchema = new mongoose.Schema({
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WebhookSubscription',
    required: true,
    index: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  event: {
    type: String,
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  targetUrl: {
    type: String,
    required: true,
  },
  responseStatus: {
    type: Number,
  },
  responseBody: {
    type: String,
  },
  deliveryDurationMs: {
    type: Number,
  },
  attempt: {
    type: Number,
    default: 1,
  },
  deliveredAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  success: {
    type: Boolean,
    required: true,
    index: true,
  },
  error: {
    type: String,
  },
});

webhookDeliverySchema.index({ organization: 1, deliveredAt: -1 });

module.exports = mongoose.model('WebhookDelivery', webhookDeliverySchema);
