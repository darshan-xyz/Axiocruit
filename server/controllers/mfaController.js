/**
 * Enterprise Multi-Factor Authentication (MFA / 2FA) Controller
 * TOTP verification, challenge management, and disaster recovery codes
 * Author: Axiocruit Enterprise Integration Platform
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');
const User = require('../models/User');
const mfaService = require('../services/mfaService');
const { issueSessionTokens } = require('./authController');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @desc    Get current user MFA status and recovery codes count
 * @route   GET /api/auth/mfa/status
 * @access  Private
 */
exports.getMfaStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const enabled = Boolean(user.mfa && user.mfa.enabled);
    const remainingRecoveryCodes = user.mfa?.recoveryCodes
      ? user.mfa.recoveryCodes.filter((c) => !c.used).length
      : 0;

    res.json({
      success: true,
      enabled,
      remainingRecoveryCodes,
    });
  } catch (err) {
    console.error('[mfaController.getMfaStatus] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve MFA status', error: err.message });
  }
};

/**
 * @desc    Initiate MFA setup: generate tempSecret and otpauth URI
 * @route   POST /api/auth/mfa/setup
 * @access  Private
 */
exports.setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate random Base32 secret
    const secret = mfaService.generateSecret();
    const otpauthUri = mfaService.generateOtpAuthUri({
      secret,
      email: user.email,
      issuer: 'Axiocruit',
    });

    if (!user.mfa) {
      user.mfa = {};
    }
    user.mfa.tempSecret = secret;
    await user.save();

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'MFA_SETUP_INITIATED',
      resource: { type: 'USER', id: user._id },
      details: {},
    });

    res.json({
      success: true,
      secret,
      otpauthUri,
    });
  } catch (err) {
    console.error('[mfaController.setupMfa] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate MFA setup', error: err.message });
  }
};

/**
 * @desc    Verify initial TOTP token, activate MFA, and issue recovery codes
 * @route   POST /api/auth/mfa/verify-setup
 * @access  Private
 */
exports.verifySetup = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Authentication code is required' });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.mfa || !user.mfa.tempSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA setup has not been initiated. Please call /setup first.',
      });
    }

    const isValid = mfaService.verifyTotp(user.mfa.tempSecret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authentication code. Please check your authenticator app and system clock.',
      });
    }

    // Generate 10 backup recovery codes
    const { plainCodes, hashedCodes } = mfaService.generateRecoveryCodes(10);

    user.mfa.secret = user.mfa.tempSecret;
    user.mfa.tempSecret = null;
    user.mfa.enabled = true;
    user.mfa.recoveryCodes = hashedCodes;

    await user.save();

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'MFA_ENABLED',
      resource: { type: 'USER', id: user._id },
      details: { recoveryCodesGenerated: 10 },
    });

    res.json({
      success: true,
      message: 'Two-factor authentication successfully enabled',
      recoveryCodes: plainCodes,
    });
  } catch (err) {
    console.error('[mfaController.verifySetup] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify MFA setup', error: err.message });
  }
};

/**
 * @desc    Verify TOTP during login challenge and issue session tokens
 * @route   POST /api/auth/mfa/verify
 * @access  Public (mfaToken challenge required)
 */
exports.verifyLogin = async (req, res) => {
  try {
    const { mfaToken, token } = req.body;

    if (!mfaToken || !token) {
      return res.status(400).json({ success: false, message: 'mfaToken and TOTP token are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, getJwtSecret());
    } catch (err) {
      return res.status(401).json({ success: false, message: 'MFA challenge expired or invalid. Please sign in again.' });
    }

    if (decoded.type !== 'mfa_challenge') {
      return res.status(400).json({ success: false, message: 'Invalid token type for MFA verification' });
    }

    const user = await User.findById(decoded.id).populate('organization').populate('profile');
    if (!user || !user.mfa || !user.mfa.enabled || !user.mfa.secret) {
      return res.status(400).json({ success: false, message: 'MFA is not enabled or user not found' });
    }

    const isValid = mfaService.verifyTotp(user.mfa.secret, token);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid authentication code' });
    }

    const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'USER_LOGIN_MFA',
      resource: { type: 'USER', id: user._id },
      details: { method: 'totp' },
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      profile: user.profile,
      approvalStatus: user.approvalStatus,
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error('[mfaController.verifyLogin] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete 2FA login', error: err.message });
  }
};

/**
 * @desc    Authenticate via one-time backup recovery code during login challenge
 * @route   POST /api/auth/mfa/recover
 * @access  Public (mfaToken challenge required)
 */
exports.recoverLogin = async (req, res) => {
  try {
    const { mfaToken, recoveryCode } = req.body;

    if (!mfaToken || !recoveryCode) {
      return res.status(400).json({ success: false, message: 'mfaToken and recoveryCode are required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, getJwtSecret());
    } catch (err) {
      return res.status(401).json({ success: false, message: 'MFA challenge expired or invalid. Please sign in again.' });
    }

    if (decoded.type !== 'mfa_challenge') {
      return res.status(400).json({ success: false, message: 'Invalid token type for MFA recovery' });
    }

    const user = await User.findById(decoded.id).populate('organization').populate('profile');
    if (!user || !user.mfa || !user.mfa.enabled) {
      return res.status(400).json({ success: false, message: 'MFA is not enabled for this user' });
    }

    const { valid, codeIndex } = mfaService.verifyRecoveryCode(recoveryCode, user.mfa.recoveryCodes);
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or already used backup recovery code' });
    }

    // Mark code as used
    user.mfa.recoveryCodes[codeIndex].used = true;
    user.mfa.recoveryCodes[codeIndex].usedAt = new Date();
    await user.save();

    const remainingCodes = user.mfa.recoveryCodes.filter((c) => !c.used).length;

    const { accessToken, refreshToken } = await issueSessionTokens(user, req, res);

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'MFA_RECOVERY_USED',
      resource: { type: 'USER', id: user._id },
      details: { remainingCodes },
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      profile: user.profile,
      approvalStatus: user.approvalStatus,
      token: accessToken,
      accessToken,
      refreshToken,
      remainingRecoveryCodes: remainingCodes,
    });
  } catch (err) {
    console.error('[mfaController.recoverLogin] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to recover via backup code', error: err.message });
  }
};

/**
 * @desc    Disable MFA (requires password confirmation)
 * @route   POST /api/auth/mfa/disable
 * @access  Private
 */
exports.disableMfa = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required to disable MFA' });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    user.mfa = {
      enabled: false,
      secret: null,
      tempSecret: null,
      recoveryCodes: [],
    };
    await user.save();

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'MFA_DISABLED',
      resource: { type: 'USER', id: user._id },
      details: {},
    });

    res.json({
      success: true,
      message: 'Two-factor authentication successfully disabled',
    });
  } catch (err) {
    console.error('[mfaController.disableMfa] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to disable MFA', error: err.message });
  }
};

/**
 * @desc    Regenerate new backup recovery codes (requires password)
 * @route   POST /api/auth/mfa/regenerate-codes
 * @access  Private
 */
exports.regenerateRecoveryCodes = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password confirmation is required' });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user || !user.mfa || !user.mfa.enabled) {
      return res.status(400).json({ success: false, message: 'MFA is not enabled on this account' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect password' });
    }

    const { plainCodes, hashedCodes } = mfaService.generateRecoveryCodes(10);
    user.mfa.recoveryCodes = hashedCodes;
    await user.save();

    await logAuditEvent({
      req,
      actor: { id: user._id, email: user.email, role: user.role },
      action: 'MFA_RECOVERY_CODES_REGENERATED',
      resource: { type: 'USER', id: user._id },
      details: { codesCount: 10 },
    });

    res.json({
      success: true,
      message: 'New backup recovery codes generated',
      recoveryCodes: plainCodes,
    });
  } catch (err) {
    console.error('[mfaController.regenerateRecoveryCodes] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to regenerate recovery codes', error: err.message });
  }
};
