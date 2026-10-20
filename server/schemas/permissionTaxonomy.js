/**
 * Enterprise RBAC Permission Taxonomy & Resolver
 * Author: Axiocruit Enterprise Integration Platform
 */

const Permissions = Object.freeze({
  WILDCARD: '*',

  // Jobs
  JOBS_CREATE: 'jobs:create',
  JOBS_READ: 'jobs:read',
  JOBS_UPDATE: 'jobs:update',
  JOBS_DELETE: 'jobs:delete',
  JOBS_DELEGATE: 'jobs:delegate',

  // Applications
  APPLICATIONS_READ: 'applications:read',
  APPLICATIONS_UPDATE_STATUS: 'applications:update_status',
  APPLICATIONS_EXPORT: 'applications:export',

  // Interviews
  INTERVIEWS_SCHEDULE: 'interviews:schedule',
  INTERVIEWS_CONDUCT: 'interviews:conduct',
  INTERVIEWS_REVIEW: 'interviews:review',
  INTERVIEWS_PAY: 'interviews:pay',

  // Coding Assessments
  ASSESSMENTS_CREATE: 'assessments:create',
  ASSESSMENTS_GRADE: 'assessments:grade',
  ASSESSMENTS_VIEW_CODE: 'assessments:view_code',

  // Candidates
  CANDIDATES_READ: 'candidates:read',
  CANDIDATES_EXPORT: 'candidates:export',
  CANDIDATES_ANONYMIZE: 'candidates:anonymize',

  // Organization Administration
  ORG_MANAGE_TEAM: 'organization:manage_team',
  ORG_MANAGE_SSO: 'organization:manage_sso',
  ORG_MANAGE_WEBHOOKS: 'organization:manage_webhooks',
  ORG_VIEW_BILLING: 'organization:view_billing',

  // Governance & Security
  COMPLIANCE_MANAGE: 'compliance:manage',
  AUDIT_LOGS_READ: 'audit_logs:read',
});

const DEFAULT_ROLE_PERMISSIONS = Object.freeze({
  ADMIN: [Permissions.WILDCARD],
  ORGANIZATION: [
    'jobs:*',
    'applications:*',
    'interviews:*',
    'assessments:*',
    'candidates:read',
    'candidates:export',
    'organization:*',
    'compliance:manage',
    'audit_logs:read',
  ],
  RECRUITER: [
    Permissions.JOBS_CREATE,
    Permissions.JOBS_READ,
    Permissions.JOBS_UPDATE,
    Permissions.JOBS_DELEGATE,
    Permissions.APPLICATIONS_READ,
    Permissions.APPLICATIONS_UPDATE_STATUS,
    Permissions.INTERVIEWS_SCHEDULE,
    Permissions.INTERVIEWS_REVIEW,
    Permissions.INTERVIEWS_PAY,
    Permissions.ASSESSMENTS_CREATE,
    Permissions.ASSESSMENTS_GRADE,
    Permissions.CANDIDATES_READ,
  ],
  INTERVIEWER: [
    Permissions.JOBS_READ,
    Permissions.INTERVIEWS_CONDUCT,
    Permissions.INTERVIEWS_REVIEW,
    Permissions.ASSESSMENTS_GRADE,
    Permissions.ASSESSMENTS_VIEW_CODE,
  ],
  CANDIDATE: [
    Permissions.JOBS_READ,
    Permissions.APPLICATIONS_READ,
    Permissions.INTERVIEWS_CONDUCT,
  ],
});

/**
 * Checks if a granted permission string satisfies a required permission.
 * Supports exact matches and wildcard patterns (e.g. '*' or 'jobs:*')
 */
const matchesPermission = (granted, required) => {
  if (granted === Permissions.WILDCARD) return true;
  if (granted === required) return true;

  if (granted.endsWith(':*')) {
    const prefix = granted.slice(0, -2);
    return required.startsWith(`${prefix}:`);
  }

  return false;
};

/**
 * Checks if an array of granted permissions satisfies a required permission
 */
const hasGrantedPermission = (grantedList = [], required) => {
  if (!Array.isArray(grantedList) || grantedList.length === 0) return false;
  return grantedList.some((g) => matchesPermission(g, required));
};

/**
 * Aggregate all granted permissions for a user (base canonical role + custom role grants)
 */
const getUserPermissions = (user, customRoleDoc = null) => {
  if (!user) return [];
  const baseRole = String(user.role || '').toUpperCase();
  const basePermissions = DEFAULT_ROLE_PERMISSIONS[baseRole] || [];

  const customPermissions = [];
  const roleObj = customRoleDoc || user.customRole;
  if (roleObj && Array.isArray(roleObj.permissions)) {
    customPermissions.push(...roleObj.permissions);
  }

  return Array.from(new Set([...basePermissions, ...customPermissions]));
};

module.exports = {
  Permissions,
  DEFAULT_ROLE_PERMISSIONS,
  matchesPermission,
  hasGrantedPermission,
  getUserPermissions,
};
