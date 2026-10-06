/**
 * Interview Domain Routes
 * Author: Axiocruit Core Engineering
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const interviewController = require('../controllers/interviewController');
const messageController = require('../controllers/messageController');

// ==========================================
// 1. Specific Named Routes (Must precede /:id)
// ==========================================

// Scheduling
router.post(
  '/schedule',
  protect,
  authorize('RECRUITER', 'INTERVIEWER', 'freelancer', 'ADMIN', 'ORGANIZATION', 'ORG_ADMIN'),
  interviewController.scheduleInterview
);

// My Interviews Listing
router.get('/my-interviews', protect, interviewController.getMyInterviews);

// Eligible Candidates (Recruiter / Admin / Org Admin)
router.get(
  '/eligible-candidates',
  protect,
  authorize('RECRUITER', 'ADMIN', 'ORGANIZATION', 'ORG_ADMIN'),
  interviewController.getEligibleCandidates
);

// Backward Compatibility: Messaging Endpoints under /api/interviews
router.get('/my-messages', protect, messageController.getMyMessages);
router.get('/conversations', protect, messageController.getConversations);
router.get('/messages/:userId', protect, messageController.getMessagesWithUser);
router.put('/messages/read/:userId', protect, messageController.markMessagesRead);
router.post('/message', protect, messageController.sendMessage);

// ==========================================
// 2. Parametric Routes (/:id)
// ==========================================

// Single Interview Room Verification & Details
router.get('/:id', protect, interviewController.getInterviewById);

// Update Status (Accept / Reject / Reschedule)
router.patch('/:id/status', protect, interviewController.updateInterviewStatus);

// Cancel Interview (Soft Delete)
router.delete(
  '/:id',
  protect,
  authorize('RECRUITER', 'ADMIN', 'ORGANIZATION', 'ORG_ADMIN'),
  interviewController.cancelInterview
);

// Feedback Submission
router.post(
  '/:id/feedback',
  protect,
  authorize('INTERVIEWER', 'freelancer', 'ADMIN', 'RECRUITER'),
  interviewController.submitFeedback
);

// Proctoring Telemetry Log Retrieval & Ingestion
router.get('/:id/proctor-log', protect, interviewController.getProctorLog);
router.post('/:id/proctor-log', protect, interviewController.saveProctorLog);

// Complete Interview & Trigger Background AI Evaluation
router.post('/:id/complete', protect, interviewController.completeInterview);

module.exports = router;
