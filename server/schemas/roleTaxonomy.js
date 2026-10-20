/**
 * Canonical Role Taxonomy for Axiocruit Platform
 * Author: Axiocruit Core Engineering
 */

const CanonicalRoles = Object.freeze({
  ADMIN: 'ADMIN',
  ORGANIZATION: 'ORGANIZATION',
  RECRUITER: 'RECRUITER',
  INTERVIEWER: 'INTERVIEWER',
  CANDIDATE: 'CANDIDATE',
});

/**
 * Normalizes any legacy or case-variant role string into standard CanonicalRoles.
 * @param {string} role - Raw incoming role string
 * @returns {string} - Canonical uppercase role
 */
const normalizeRole = (role) => {
  if (!role) return CanonicalRoles.CANDIDATE;
  const upper = String(role).trim().toUpperCase();
  if (upper === 'ORGANIZATION' || upper === 'ORG_ADMIN') return CanonicalRoles.ORGANIZATION;
  if (upper === 'FREELANCER') return CanonicalRoles.INTERVIEWER;
  if (upper === 'INTERVIEWER') return CanonicalRoles.INTERVIEWER;
  if (upper === 'RECRUITER') return CanonicalRoles.RECRUITER;
  if (upper === 'ADMIN') return CanonicalRoles.ADMIN;
  if (upper === 'CANDIDATE') return CanonicalRoles.CANDIDATE;
  if (upper === 'HOST') return CanonicalRoles.RECRUITER;
  return upper;
};

/**
 * Checks if a given role has host privileges in interview rooms.
 * @param {string} role
 * @returns {boolean}
 */
const isHostRole = (role) => {
  const norm = normalizeRole(role);
  return (
    norm === CanonicalRoles.RECRUITER ||
    norm === CanonicalRoles.ORGANIZATION ||
    norm === CanonicalRoles.INTERVIEWER ||
    norm === CanonicalRoles.ADMIN ||
    norm === 'HOST'
  );
};

module.exports = {
  CanonicalRoles,
  normalizeRole,
  isHostRole,
  isAdminRole: (role) => normalizeRole(role) === CanonicalRoles.ADMIN,
  isOrgAdminRole: (role) => normalizeRole(role) === CanonicalRoles.ORGANIZATION || normalizeRole(role) === CanonicalRoles.ADMIN,
};
