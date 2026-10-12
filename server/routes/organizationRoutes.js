const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getRecruiters,
    inviteRecruiter,
    removeRecruiter,
    getOrgJobs,
    getOrganizationDetails,
    updateOrganizationDetails
} = require('../controllers/organizationController');

// All routes require authentication + organization role
router.use(protect, authorize('ORGANIZATION', 'ADMIN'));

router.get('/details', getOrganizationDetails);
router.put('/details', updateOrganizationDetails);
router.get('/jobs', getOrgJobs);
router.get('/recruiters', getRecruiters);
router.post('/recruiters/invite', inviteRecruiter);
router.delete('/recruiters/:id', removeRecruiter);

module.exports = router;
