const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect all admin routes
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats);
router.get('/overview', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Job Management
router.get('/jobs', adminController.getAllJobs);
router.delete('/jobs/:id', adminController.deleteJob);

// Freelancer Approvals
router.get('/freelancers/pending', adminController.getPendingFreelancers);
router.patch('/freelancers/:id/approve', adminController.approveFreelancer);

// Audit Logging
router.get('/audit-logs', adminController.getAuditLogs);

// SIEM Real-time Security Stream
router.use('/siem', require('./siemRoutes'));

// Background Job Queue & Dead-Letter Queue (DLQ)
router.use('/queue', require('./queueRoutes'));
router.use('/background-jobs', require('./queueRoutes'));

module.exports = router;
