/**
 * Enterprise Role Guard Middleware for Procruit
 */

const { normalizeRole, CanonicalRoles } = require('../schemas/roleTaxonomy');

/**
 * Enforces role-based route authorization using standardized canonical roles.
 * @param  {...string} allowedRoles
 */
const requireRole = (...allowedRoles) => {
  const flattened = allowedRoles.flat().map((r) => normalizeRole(r));
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const userRole = normalizeRole(req.user.role);
    if (!flattened.includes(userRole)) {
      return res.status(403).json({
        message: `Role ${req.user.role || 'ANONYMOUS'} is not authorized to access this resource`,
      });
    }
    next();
  };
};

module.exports = {
  requireRole,
  CanonicalRoles,
  normalizeRole,
};
