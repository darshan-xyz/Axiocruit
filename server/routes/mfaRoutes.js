/**
 * Enterprise Multi-Factor Authentication (MFA / 2FA) Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const mfaController = require('../controllers/mfaController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints (used during login 2FA challenge via mfaToken)
router.post('/verify', mfaController.verifyLogin);
router.post('/recover', mfaController.recoverLogin);

// Authenticated endpoints (MFA configuration and management)
router.get('/status', protect, mfaController.getMfaStatus);
router.post('/setup', protect, mfaController.setupMfa);
router.post('/verify-setup', protect, mfaController.verifySetup);
router.post('/disable', protect, mfaController.disableMfa);
router.post('/regenerate-codes', protect, mfaController.regenerateRecoveryCodes);

module.exports = router;
