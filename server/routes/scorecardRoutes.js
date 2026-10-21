/**
 * Enterprise Scorecard & Evaluation Routes
 * Author: Axiocruit Enterprise Integration Platform
 */

const express = require('express');
const router = express.Router();
const scorecardController = require('../controllers/scorecardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Scorecards (Interviewer / Recruiter / Org Admin / Platform Admin)
router.post('/', authorize('RECRUITER', 'INTERVIEWER', 'ORGANIZATION', 'ADMIN'), scorecardController.submitScorecard);
router.get('/interview/:interviewId', authorize('RECRUITER', 'INTERVIEWER', 'ORGANIZATION', 'ADMIN'), scorecardController.getInterviewScorecards);
router.get('/consensus/:interviewId', authorize('RECRUITER', 'INTERVIEWER', 'ORGANIZATION', 'ADMIN'), scorecardController.getConsensusAnalytics);
router.get('/packet/:jobId/:candidateId', authorize('RECRUITER', 'ORGANIZATION', 'ADMIN'), scorecardController.getCandidatePacket);

// Evaluation Rubrics
router.get('/rubrics', authorize('RECRUITER', 'ORGANIZATION', 'ADMIN'), scorecardController.listRubrics);
router.post('/rubrics', authorize('ORGANIZATION', 'ADMIN'), scorecardController.createRubric);

module.exports = router;
