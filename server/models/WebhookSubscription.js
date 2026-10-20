/**
 * Enterprise Webhook Subscription Model
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const webhookSubscriptionSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  targetUrl: {
    type: String,
    required: true,
    trim: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  events: [
    {
      type: String,
      enum: [
        'all',
        'application.created',
        'assessment.completed',
        'interview.scheduled',
        'interview.completed',
        'proctoring.flagged',
        'hire.approved',
      ],
      default: 'all',
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

webhookSubscriptionSchema.index({ organization: 1, isActive: 1 });

module.exports = mongoose.model('WebhookSubscription', webhookSubscriptionSchema);
