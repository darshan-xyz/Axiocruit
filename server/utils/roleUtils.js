/**
 * Canonical Role Utilities for Axiocruit Platform
 * Provides backward-compatible role normalization, matching, and permission checks.
 */

const { CanonicalRoles, normalizeRole, isHostRole } = require('../schemas/roleTaxonomy');

/**
 * Checks if a user's role matches any of the target roles.
 * Supports legacy strings (e.g. 'freelancer' matches 'INTERVIEWER', 'organization' matches 'ORGANIZATION').
 *
 * @param {string} userRole - Current role of user
 * @param {string|string[]} targetRoles - Role(s) required
 * @returns {boolean}
 */
const matchesRole = (userRole, targetRoles) => {
  if (!userRole) return false;
  const normalizedUser = normalizeRole(userRole);

  const targets = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
  const normalizedTargets = targets.flat().map(normalizeRole);

  return normalizedTargets.includes(normalizedUser) || normalizedUser === CanonicalRoles.ADMIN;
};

/**
 * Validates whether a given string is a recognized canonical or legacy role.
 * @param {string} role
 * @returns {boolean}
 */
const isValidRole = (role) => {
  if (!role || typeof role !== 'string') return false;
  const upper = role.trim().toUpperCase();
  return [
    'ADMIN',
    'ORGANIZATION',
    'ORG_ADMIN',
    'RECRUITER',
    'INTERVIEWER',
    'FREELANCER',
    'CANDIDATE',
    'HOST',
  ].includes(upper);
};

module.exports = {
  CanonicalRoles,
  normalizeRole,
  isHostRole,
  matchesRole,
  isValidRole,
};
