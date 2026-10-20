/**
 * Enterprise Webhook Routing Layer
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('ORGANIZATION', 'ADMIN'), webhookController.listSubscriptions);
router.post('/', protect, authorize('ORGANIZATION', 'ADMIN'), webhookController.createSubscription);
router.delete('/:id', protect, authorize('ORGANIZATION', 'ADMIN'), webhookController.deleteSubscription);
router.post('/:id/test', protect, authorize('ORGANIZATION', 'ADMIN'), webhookController.testSubscription);
router.get('/deliveries', protect, authorize('ORGANIZATION', 'ADMIN'), webhookController.listDeliveries);

module.exports = router;
