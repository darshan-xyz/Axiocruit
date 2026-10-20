/**
 * Enterprise Custom Roles & Permissions Controller
 * Author: Axiocruit Enterprise Integration Platform
 */

const CustomRole = require('../models/CustomRole');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { Permissions } = require('../schemas/permissionTaxonomy');
const { logAuditEvent } = require('../utils/auditLogger');
const { isAdminRole } = require('../schemas/roleTaxonomy');

/**
 * Resolve organization ID for current actor
 */
const resolveOrgId = async (user, requestedOrgId) => {
  if (isAdminRole(user.role) && requestedOrgId) {
    return requestedOrgId;
  }
  if (user.organization) {
    return String(user.organization);
  }
  const org = await Organization.findOne({ admin: user._id || user.id });
  return org ? String(org._id) : null;
};

/**
 * GET /api/organization/permissions
 * List all standard permissions supported by Axiocruit RBAC
 */
const listPermissions = (req, res) => {
  const categorized = {
    jobs: [
      Permissions.JOBS_CREATE,
      Permissions.JOBS_READ,
      Permissions.JOBS_UPDATE,
      Permissions.JOBS_DELETE,
      Permissions.JOBS_DELEGATE,
    ],
    applications: [
      Permissions.APPLICATIONS_READ,
      Permissions.APPLICATIONS_UPDATE_STATUS,
      Permissions.APPLICATIONS_EXPORT,
    ],
    interviews: [
      Permissions.INTERVIEWS_SCHEDULE,
      Permissions.INTERVIEWS_CONDUCT,
      Permissions.INTERVIEWS_REVIEW,
      Permissions.INTERVIEWS_PAY,
    ],
    assessments: [
      Permissions.ASSESSMENTS_CREATE,
      Permissions.ASSESSMENTS_GRADE,
      Permissions.ASSESSMENTS_VIEW_CODE,
    ],
    candidates: [
      Permissions.CANDIDATES_READ,
      Permissions.CANDIDATES_EXPORT,
      Permissions.CANDIDATES_ANONYMIZE,
    ],
    organization: [
      Permissions.ORG_MANAGE_TEAM,
      Permissions.ORG_MANAGE_SSO,
      Permissions.ORG_MANAGE_WEBHOOKS,
      Permissions.ORG_VIEW_BILLING,
    ],
    governance: [
      Permissions.COMPLIANCE_MANAGE,
      Permissions.AUDIT_LOGS_READ,
    ],
  };

  return res.status(200).json({
    success: true,
    permissions: Object.values(Permissions),
    categorized,
  });
};

/**
 * GET /api/organization/roles
 * List custom roles defined for the organization
 */
const listCustomRoles = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.query.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const roles = await CustomRole.find({ organization: orgId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      roles,
    });
  } catch (err) {
    console.error('[RBAC] listCustomRoles error:', err);
    return res.status(500).json({ message: 'Failed to retrieve custom roles' });
  }
};

/**
 * POST /api/organization/roles
 * Create a new custom role
 */
const createCustomRole = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.body.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const { name, description = '', permissions = [] } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Role name is required' });
    }

    const cleanName = name.trim();

    // Check unique name in organization
    const existing = await CustomRole.findOne({ organization: orgId, name: cleanName });
    if (existing) {
      return res.status(409).json({ message: `A custom role with name '${cleanName}' already exists` });
    }

    const role = await CustomRole.create({
      organization: orgId,
      name: cleanName,
      description: description.trim(),
      permissions: Array.isArray(permissions) ? permissions : [],
    });

    await logAuditEvent({
      req,
      action: 'CUSTOM_ROLE_CREATED',
      resource: { type: 'CustomRole', id: role._id },
      details: { name: role.name, permissionsCount: role.permissions.length },
    });

    return res.status(201).json({
      success: true,
      message: 'Custom role created successfully',
      role,
    });
  } catch (err) {
    console.error('[RBAC] createCustomRole error:', err);
    return res.status(500).json({ message: 'Failed to create custom role' });
  }
};

/**
 * PUT /api/organization/roles/:id
 * Update an existing custom role
 */
const updateCustomRole = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user);
    const role = await CustomRole.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Custom role not found' });
    }

    if (!isAdminRole(req.user.role) && String(role.organization) !== String(orgId)) {
      return res.status(403).json({ message: 'Forbidden: You do not own this role' });
    }

    const { name, description, permissions } = req.body;
    if (name) {
      const cleanName = name.trim();
      const existing = await CustomRole.findOne({
        _id: { $ne: role._id },
        organization: role.organization,
        name: cleanName,
      });
      if (existing) {
        return res.status(409).json({ message: `Another role already uses the name '${cleanName}'` });
      }
      role.name = cleanName;
    }

    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;
    role.updatedAt = new Date();

    await role.save();

    await logAuditEvent({
      req,
      action: 'CUSTOM_ROLE_UPDATED',
      resource: { type: 'CustomRole', id: role._id },
      details: { name: role.name, permissionsCount: role.permissions.length },
    });

    return res.status(200).json({
      success: true,
      message: 'Custom role updated successfully',
      role,
    });
  } catch (err) {
    console.error('[RBAC] updateCustomRole error:', err);
    return res.status(500).json({ message: 'Failed to update custom role' });
  }
};

/**
 * DELETE /api/organization/roles/:id
 * Delete a custom role and unassign from team members
 */
const deleteCustomRole = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user);
    const role = await CustomRole.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: 'Custom role not found' });
    }

    if (!isAdminRole(req.user.role) && String(role.organization) !== String(orgId)) {
      return res.status(403).json({ message: 'Forbidden: You do not own this role' });
    }

    await CustomRole.findByIdAndDelete(req.params.id);

    // Unassign from any members assigned to this role
    await User.updateMany({ customRole: req.params.id }, { $set: { customRole: null } });

    await logAuditEvent({
      req,
      action: 'CUSTOM_ROLE_DELETED',
      resource: { type: 'CustomRole', id: req.params.id },
      details: { name: role.name },
    });

    return res.status(200).json({
      success: true,
      message: 'Custom role deleted and unassigned from team members',
    });
  } catch (err) {
    console.error('[RBAC] deleteCustomRole error:', err);
    return res.status(500).json({ message: 'Failed to delete custom role' });
  }
};

/**
 * POST /api/organization/members/:id/role
 * Assign canonical role or custom role to an employee
 */
const assignMemberRole = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'Member user not found' });
    }

    if (!isAdminRole(req.user.role) && String(targetUser.organization) !== String(orgId)) {
      return res.status(403).json({ message: 'Forbidden: Member does not belong to your organization' });
    }

    const { role, customRoleId } = req.body;

    if (role) {
      targetUser.role = role;
    }

    if (customRoleId !== undefined) {
      if (customRoleId === null || customRoleId === '') {
        targetUser.customRole = null;
      } else {
        const customRole = await CustomRole.findById(customRoleId);
        if (!customRole) {
          return res.status(404).json({ message: 'Custom role not found' });
        }
        if (!isAdminRole(req.user.role) && String(customRole.organization) !== String(orgId)) {
          return res.status(403).json({ message: 'Forbidden: Custom role belongs to another organization' });
        }
        targetUser.customRole = customRole._id;
      }
    }

    await targetUser.save();

    await logAuditEvent({
      req,
      action: 'MEMBER_ROLE_ASSIGNED',
      resource: { type: 'User', id: targetUser._id },
      details: { role: targetUser.role, customRoleId: targetUser.customRole },
    });

    return res.status(200).json({
      success: true,
      message: 'Member roles updated successfully',
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        customRole: targetUser.customRole,
      },
    });
  } catch (err) {
    console.error('[RBAC] assignMemberRole error:', err);
    return res.status(500).json({ message: 'Failed to assign role to member' });
  }
};

module.exports = {
  listPermissions,
  listCustomRoles,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  assignMemberRole,
};
