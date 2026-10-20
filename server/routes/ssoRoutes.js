/**
 * Enterprise Single Sign-On (SSO) Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/ssoController');

// Corporate domain lookup (public)
router.get('/lookup', ssoController.lookupSsoDomain);

// Initiate SSO login flow
router.post('/initiate', ssoController.initiateSso);

// IdP authorization callback & JIT session exchange
router.post('/callback', ssoController.handleSsoCallback);

module.exports = router;
