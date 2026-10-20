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
const ssoController = require('../controllers/ssoController');
const roleController = require('../controllers/roleController');

// All routes require authentication + organization role
router.use(protect, authorize('ORGANIZATION', 'ADMIN'));

router.get('/details', getOrganizationDetails);
router.put('/details', updateOrganizationDetails);
router.get('/jobs', getOrgJobs);
router.get('/recruiters', getRecruiters);
router.post('/recruiters/invite', inviteRecruiter);
router.delete('/recruiters/:id', removeRecruiter);
router.get('/sso', ssoController.getOrgSsoSettings);
router.put('/sso', ssoController.updateOrgSsoSettings);

// RBAC custom roles & permissions
router.get('/permissions', roleController.listPermissions);
router.get('/roles', roleController.listCustomRoles);
router.post('/roles', roleController.createCustomRole);
router.put('/roles/:id', roleController.updateCustomRole);
router.delete('/roles/:id', roleController.deleteCustomRole);
router.post('/members/:id/role', roleController.assignMemberRole);

module.exports = router;
