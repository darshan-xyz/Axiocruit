const express = require('express');
const router = express.Router();
const multer = require('multer');
const { applyWithCV, getRankedCandidates, getMyApplications, retryAiAnalysis } = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Multer in-memory storage for PDF uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
});

// GET /api/applications/my-applications — Candidate views their applications
router.get('/my-applications', protect, authorize('CANDIDATE'), getMyApplications);

// POST /api/applications/:applicationId/retry-ai — Recruiter or delegated freelancer manually retries AI parsing
router.post('/:applicationId/retry-ai', protect, authorize('RECRUITER', 'INTERVIEWER', 'freelancer', 'ORGANIZATION', 'ORG_ADMIN', 'ADMIN'), retryAiAnalysis);

// POST /api/applications/:jobId — Candidate applies with CV upload
router.post('/:jobId', protect, authorize('CANDIDATE'), upload.single('resume'), applyWithCV);

// GET /api/applications/:jobId/candidates — Recruiter views ranked candidates
router.get('/:jobId/candidates', protect, authorize('RECRUITER', 'INTERVIEWER', 'freelancer', 'ORGANIZATION', 'ORG_ADMIN', 'ADMIN'), getRankedCandidates);

module.exports = router;
