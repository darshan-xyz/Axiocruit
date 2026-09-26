/**
 * Role Middleware for Axiocruit
 * Enforces role checks using canonical role taxonomy with backward-compatibility.
 */

const { normalizeRole, CanonicalRoles } = require('../schemas/roleTaxonomy');

const checkRole = (role) => {
    return (req, res, next) => {
        const userRole = normalizeRole(req.user?.role);
        const targetRole = normalizeRole(role);
        if (userRole && (userRole === targetRole || userRole === CanonicalRoles.ADMIN)) {
            next();
        } else {
            res.status(403).json({ message: 'Not authorized as ' + role });
        }
    };
};

module.exports = { checkRole, normalizeRole, CanonicalRoles };
