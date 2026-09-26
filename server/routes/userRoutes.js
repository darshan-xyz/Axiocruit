/**
 * User & Profile Routes
 * Author: Axiocruit Core Engineering
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Configure Multer Storage for file uploads
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Backwards-compatible verifyToken alias
const verifyToken = protect;

// User Profile Endpoints
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/profile-picture', protect, upload.single('profilePicture'), userController.uploadProfilePicture);

// User Discovery & Directory Endpoints
router.get('/interviewers', protect, userController.getInterviewers);
router.get('/candidates', protect, userController.getCandidates);
router.get('/by-id/:id', protect, userController.getUserById);
router.get('/:email', userController.getUserByEmail);

// Resume Upload Endpoint
router.post('/resume', protect, upload.single('resume'), userController.uploadResume);

module.exports = router;
