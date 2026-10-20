/**
 * Enterprise RBAC Permission Authorization Middleware
 * Author: Axiocruit Enterprise Integration Platform
 */

const CustomRole = require('../models/CustomRole');
const {
  hasGrantedPermission,
  getUserPermissions,
} = require('../schemas/permissionTaxonomy');
const { isAdminRole } = require('../schemas/roleTaxonomy');

/**
 * Express middleware to enforce one or more granular permissions
 * Usage: router.post('/jobs', protect, requirePermission('jobs:create'), createJob);
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Platform ADMIN bypasses all permission checks
      if (isAdminRole(req.user.role)) {
        return next();
      }

      let customRoleDoc = null;
      if (req.user.customRole) {
        if (typeof req.user.customRole === 'object' && Array.isArray(req.user.customRole.permissions)) {
          customRoleDoc = req.user.customRole;
        } else {
          customRoleDoc = await CustomRole.findById(req.user.customRole).lean();
        }
      }

      const grantedPermissions = getUserPermissions(req.user, customRoleDoc);

      for (const required of requiredPermissions) {
        if (!hasGrantedPermission(grantedPermissions, required)) {
          return res.status(403).json({
            message: `Forbidden: You do not have the required permission (${required})`,
            requiredPermission: required,
          });
        }
      }

      req.userPermissions = grantedPermissions;
      next();
    } catch (err) {
      console.error('[RBAC] requirePermission error:', err);
      return res.status(500).json({ message: 'Authorization error checking permissions' });
    }
  };
};

module.exports = {
  requirePermission,
};
