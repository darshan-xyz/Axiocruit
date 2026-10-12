/**
 * User & Profile Routes
 * Author: Axiocruit Core Engineering
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const userController = require('../controllers/userController');

// Backwards-compatible verifyToken alias
const verifyToken = protect;

// User Profile Endpoints
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile-picture', protect, upload.single('profilePicture'), upload.validateUploadedFile, userController.uploadProfilePicture);

// User Discovery & Directory Endpoints
router.get('/interviewers', protect, userController.getInterviewers);
router.get('/candidates', protect, authorize('RECRUITER', 'INTERVIEWER', 'ORGANIZATION', 'ADMIN'), userController.getCandidates);
router.get('/by-id/:id', protect, userController.getUserById);
router.get('/:email', protect, userController.getUserByEmail);

// Resume Upload Endpoint
router.post('/resume', protect, upload.single('resume'), upload.validateUploadedFile, userController.uploadResume);

module.exports = router;
