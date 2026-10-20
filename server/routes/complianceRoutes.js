/**
 * Compliance & GDPR / CCPA Routing Layer
 * Author: Axiocruit Enterprise Security & Compliance
 */

const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GDPR Data Subject Access Requests (DSAR)
router.post('/gdpr/export', protect, complianceController.exportUserData);
router.post('/gdpr/anonymize', protect, complianceController.anonymizeCandidate);

// Data Retention Policy Management
router.get('/retention-policies', protect, complianceController.getRetentionPolicies);
router.put('/retention-policies', protect, authorize('ADMIN'), complianceController.updateRetentionPolicies);
router.post('/retention/execute-purge', protect, authorize('ADMIN'), complianceController.executeRetentionPurge);

module.exports = router;
