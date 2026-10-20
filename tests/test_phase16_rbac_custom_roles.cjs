/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 16: Enterprise RBAC Granular Permissions Engine & Custom Roles
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Organization = require('../server/models/Organization');
const CustomRole = require('../server/models/CustomRole');
const AuditLog = require('../server/models/AuditLog');

const {
  Permissions,
  matchesPermission,
  hasGrantedPermission,
  getUserPermissions,
} = require('../server/schemas/permissionTaxonomy');
const { requirePermission } = require('../server/middleware/permissionMiddleware');
const roleController = require('../server/controllers/roleController');

let totalTests = 0;

const it = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✔ PASS: ${name}`);
  } catch (err) {
    console.error(`  ✖ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
};

const describe = async (name, fn) => {
  console.log(`\n● Suite: ${name}`);
  await fn();
};

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

async function runPhase16Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 16: ENTERPRISE RBAC & CUSTOM ROLES TEST HARNESS       ');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // Seed test Organization & Users
    const orgAdmin = await User.create({
      name: 'Acme Org Admin',
      email: 'admin@acmecorp.com',
      password: 'HashedPassword123!',
      role: 'ORGANIZATION',
    });

    const testOrg = await Organization.create({
      name: 'Acme Corporation',
      admin: orgAdmin._id,
    });
    orgAdmin.organization = testOrg._id;
    await orgAdmin.save();

    const employee = await User.create({
      name: 'Jane Talent Ops',
      email: 'jane@acmecorp.com',
      password: 'HashedPassword123!',
      role: 'RECRUITER',
      organization: testOrg._id,
    });

    await describe('Suite 1: Permission Taxonomy & Matcher Resolver', async () => {
      await it('Exact permission matching resolves correctly', async () => {
        totalTests++;
        assert.strictEqual(matchesPermission('jobs:create', 'jobs:create'), true);
        assert.strictEqual(matchesPermission('jobs:create', 'jobs:delete'), false);
      });

      await it('Wildcard permission (*) grants all permissions', async () => {
        totalTests++;
        assert.strictEqual(matchesPermission('*', 'jobs:delete'), true);
        assert.strictEqual(matchesPermission('*', 'compliance:manage'), true);
      });

      await it('Namespace wildcard (jobs:*) grants all sub-actions', async () => {
        totalTests++;
        assert.strictEqual(matchesPermission('jobs:*', 'jobs:create'), true);
        assert.strictEqual(matchesPermission('jobs:*', 'jobs:delegate'), true);
        assert.strictEqual(matchesPermission('jobs:*', 'interviews:conduct'), false);
      });

      await it('Merges base canonical role permissions with custom role grants', async () => {
        totalTests++;
        const customRole = {
          permissions: ['compliance:manage', 'organization:manage_sso'],
        };
        const allPermissions = getUserPermissions(employee, customRole);
        assert(allPermissions.includes('jobs:create'), 'Has base recruiter permission');
        assert(allPermissions.includes('compliance:manage'), 'Has granted custom role permission');
      });
    });

    await describe('Suite 2: Custom Role Lifecycle & Multi-Tenant Isolation', async () => {
      let createdRoleId;

      await it('Creates a custom role and records audit log', async () => {
        totalTests++;
        const req = {
          user: { _id: orgAdmin._id, id: String(orgAdmin._id), role: 'ORGANIZATION', organization: testOrg._id },
          body: {
            name: 'Senior Hiring Auditor',
            description: 'Can review applications and manage compliance sweeps',
            permissions: ['applications:read', 'applications:export', 'compliance:manage'],
          },
        };
        const res = createMockRes();
        await roleController.createCustomRole(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert(res.body.success);
        assert.strictEqual(res.body.role.name, 'Senior Hiring Auditor');
        assert.strictEqual(res.body.role.permissions.length, 3);
        createdRoleId = res.body.role._id;

        const audit = await AuditLog.findOne({
          action: 'CUSTOM_ROLE_CREATED',
          'resource.id': String(createdRoleId),
        });
        assert(audit, 'Audit log recorded for role creation');
      });

      await it('Prevents duplicate role names within the same organization (409 Conflict)', async () => {
        totalTests++;
        const req = {
          user: { _id: orgAdmin._id, id: String(orgAdmin._id), role: 'ORGANIZATION', organization: testOrg._id },
          body: {
            name: 'Senior Hiring Auditor',
            permissions: ['jobs:read'],
          },
        };
        const res = createMockRes();
        await roleController.createCustomRole(req, res);

        assert.strictEqual(res.statusCode, 409);
      });

      await it('Assigns custom role to an organization member', async () => {
        totalTests++;
        const req = {
          user: { _id: orgAdmin._id, id: String(orgAdmin._id), role: 'ORGANIZATION', organization: testOrg._id },
          params: { id: employee._id },
          body: { customRoleId: createdRoleId },
        };
        const res = createMockRes();
        await roleController.assignMemberRole(req, res);

        assert.strictEqual(res.statusCode, 200);

        const updated = await User.findById(employee._id);
        assert.strictEqual(String(updated.customRole), String(createdRoleId));
      });

      await it('Deleting a custom role automatically unassigns it from all members', async () => {
        totalTests++;
        const req = {
          user: { _id: orgAdmin._id, id: String(orgAdmin._id), role: 'ORGANIZATION', organization: testOrg._id },
          params: { id: createdRoleId },
        };
        const res = createMockRes();
        await roleController.deleteCustomRole(req, res);

        assert.strictEqual(res.statusCode, 200);

        // Verify role is deleted
        const checkRole = await CustomRole.findById(createdRoleId);
        assert.strictEqual(checkRole, null);

        // Verify member has customRole cleared
        const memberCheck = await User.findById(employee._id);
        assert.strictEqual(memberCheck.customRole, null, 'Unassigned from member');
      });
    });

    await describe('Suite 3: RBAC Authorization Middleware (requirePermission)', async () => {
      await it('Allows Platform ADMIN to bypass any permission check', async () => {
        totalTests++;
        const adminUser = { role: 'ADMIN' };
        const req = { user: adminUser };
        const res = createMockRes();
        let nextCalled = false;

        const mw = requirePermission('compliance:manage', 'jobs:delete');
        await mw(req, res, () => {
          nextCalled = true;
        });

        assert.strictEqual(nextCalled, true);
      });

      await it('Blocks user missing required permission with HTTP 403 Forbidden', async () => {
        totalTests++;
        const candidateUser = { role: 'CANDIDATE', _id: 'cand-1' };
        const req = { user: candidateUser };
        const res = createMockRes();
        let nextCalled = false;

        const mw = requirePermission('jobs:create');
        await mw(req, res, () => {
          nextCalled = true;
        });

        assert.strictEqual(nextCalled, false);
        assert.strictEqual(res.statusCode, 403);
        assert.strictEqual(res.body.requiredPermission, 'jobs:create');
      });

      await it('Allows user whose canonical role grants required permission', async () => {
        totalTests++;
        const recruiterUser = { role: 'RECRUITER', _id: 'rec-1' };
        const req = { user: recruiterUser };
        const res = createMockRes();
        let nextCalled = false;

        const mw = requirePermission('jobs:create', 'applications:read');
        await mw(req, res, () => {
          nextCalled = true;
        });

        assert.strictEqual(nextCalled, true);
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 16 INTEGRATION TESTS: ${totalTests}`);
    console.log(`PASSED: ${totalTests}`);
    console.log(`FAILED: 0`);
    console.log('========================================================================\n');
  } finally {
    if (mongoose.connection) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
}

runPhase16Tests().catch((err) => {
  console.error('Fatal error running Phase 16 tests:', err);
  process.exit(1);
});
