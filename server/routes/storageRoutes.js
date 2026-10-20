/**
 * Enterprise Storage Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const storageController = require('../controllers/storageController');
const { protect } = require('../middleware/authMiddleware');

// Presigned URL generation
router.post('/presigned-upload', protect, storageController.requestPresignedUpload);
router.post('/presigned-download', protect, storageController.requestPresignedDownload);

// Local streaming endpoints (token-authorized)
router.post('/local-upload/:token', storageController.handleLocalUpload);
router.get('/local-download/:token', storageController.handleLocalDownload);

module.exports = router;
