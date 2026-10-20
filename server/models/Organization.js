const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  website: { type: String },
  description: { type: String },
  recruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Enterprise Single Sign-On (SSO) & IdP Federation ───────────────────────
  ssoConfig: {
    enabled: { type: Boolean, default: false },
    enforceSso: { type: Boolean, default: false },
    provider: {
      type: String,
      enum: ['oidc', 'saml', 'okta', 'azure_ad', 'google'],
      default: 'oidc',
    },
    domains: [{ type: String, lowercase: true, trim: true }],
    issuer: { type: String, trim: true },
    clientId: { type: String, trim: true },
    clientSecret: { type: String, trim: true },
    authorizationUrl: { type: String, trim: true },
    tokenUrl: { type: String, trim: true },
    userInfoUrl: { type: String, trim: true },
    samlEntryPoint: { type: String, trim: true },
    samlCert: { type: String, trim: true },
    defaultRole: {
      type: String,
      enum: ['RECRUITER', 'INTERVIEWER'],
      default: 'RECRUITER',
    },
    jitProvisioning: { type: Boolean, default: true },
  },

  createdAt: { type: Date, default: Date.now },
});

organizationSchema.index({ 'ssoConfig.domains': 1 });

module.exports = mongoose.model('Organization', organizationSchema);
