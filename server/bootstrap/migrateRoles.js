/**
 * Startup Role Migration Script
 * Automatically normalizes legacy MongoDB user roles to canonical uppercase values:
 * 'freelancer' -> 'INTERVIEWER'
 * 'organization' / 'org_admin' -> 'ORGANIZATION'
 * 'candidate' -> 'CANDIDATE'
 * 'recruiter' -> 'RECRUITER'
 * 'admin' -> 'ADMIN'
 */

const mongoose = require('mongoose');

const migrateRoles = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { totalMigrated: 0, skipped: true, reason: 'Database connection not ready' };
    }

    const db = mongoose.connection.db;
    if (!db) {
      return { totalMigrated: 0, skipped: true, reason: 'Database instance unavailable' };
    }

    const usersCollection = db.collection('users');

    // Perform safe bulk updates directly on raw collection to bypass any Mongoose casting discrepancies
    const updates = [
      {
        filter: { role: { $in: ['freelancer', 'Freelancer', 'FREELANCER'] } },
        update: { $set: { role: 'INTERVIEWER' } },
        label: 'freelancer -> INTERVIEWER',
      },
      {
        filter: { role: { $in: ['organization', 'Organization', 'org_admin', 'ORG_ADMIN'] } },
        update: { $set: { role: 'ORGANIZATION' } },
        label: 'organization -> ORGANIZATION',
      },
      {
        filter: { role: { $in: ['candidate', 'Candidate'] } },
        update: { $set: { role: 'CANDIDATE' } },
        label: 'candidate -> CANDIDATE',
      },
      {
        filter: { role: { $in: ['recruiter', 'Recruiter'] } },
        update: { $set: { role: 'RECRUITER' } },
        label: 'recruiter -> RECRUITER',
      },
      {
        filter: { role: { $in: ['admin', 'Admin'] } },
        update: { $set: { role: 'ADMIN' } },
        label: 'admin -> ADMIN',
      },
    ];

    let totalMigrated = 0;
    for (const step of updates) {
      const res = await usersCollection.updateMany(step.filter, step.update);
      if (res.modifiedCount > 0) {
        totalMigrated += res.modifiedCount;
        console.log(`[RoleMigration] Migrated ${res.modifiedCount} records for: ${step.label}`);
      }
    }

    if (totalMigrated > 0) {
      console.log(`[RoleMigration] Completed canonical role normalization. Total updated: ${totalMigrated}`);
    }

    return { totalMigrated, success: true };
  } catch (err) {
    console.warn('[RoleMigration] Non-fatal migration error:', err.message);
    return { error: err.message, success: false };
  }
};

module.exports = migrateRoles;
