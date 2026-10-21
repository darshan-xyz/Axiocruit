/**
 * Enterprise SIEM Management Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const siemController = require('../controllers/siemController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('ADMIN'));

router.get('/', siemController.getSiemConfig);
router.put('/', siemController.updateSiemConfig);
router.post('/test', siemController.testSiemConnection);

module.exports = router;
