const express = require('express');
const router = express.Router();
const { applyWithCV, getRankedCandidates, getMyApplications, retryAiAnalysis } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadResume, validateUploadedFile } = require('../middleware/uploadMiddleware');

// GET /api/applications/my-applications — Candidate views their applications
router.get('/my-applications', protect, authorize('CANDIDATE'), getMyApplications);

// POST /api/applications/:applicationId/retry-ai — Recruiter or delegated freelancer manually retries AI parsing
router.post('/:applicationId/retry-ai', protect, authorize('RECRUITER', 'INTERVIEWER', 'freelancer', 'ORGANIZATION', 'ORG_ADMIN', 'ADMIN'), retryAiAnalysis);

// POST /api/applications/:jobId — Candidate applies with CV upload
router.post('/:jobId', protect, authorize('CANDIDATE'), uploadResume.single('resume'), validateUploadedFile, applyWithCV);

// GET /api/applications/:jobId/candidates — Recruiter views ranked candidates
router.get('/:jobId/candidates', protect, authorize('RECRUITER', 'INTERVIEWER', 'freelancer', 'ORGANIZATION', 'ORG_ADMIN', 'ADMIN'), getRankedCandidates);

module.exports = router;
