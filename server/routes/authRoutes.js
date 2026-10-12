const express = require('express');
const router = express.Router();
const {
  registerOrg,
  addRecruiter,
  registerFreelancer,
  registerCandidate,
  login,
  refresh,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Public Authentication & Dual-Token Routes
router.post('/register-org', registerOrg);
router.post('/register-freelancer', registerFreelancer);
router.post('/register-candidate', registerCandidate);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', optionalAuth, logout);

// Protected Identity & Management Routes
router.get('/me', protect, getMe);
router.post('/change-password', protect, require('../controllers/authController').changePassword);

// Organization Admin Routes
router.post('/register-recruiter', protect, checkRole('ORGANIZATION'), addRecruiter);
router.get('/recruiters', protect, checkRole('ORGANIZATION'), require('../controllers/authController').getRecruiters);

module.exports = router;
