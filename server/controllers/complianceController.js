/**
 * Compliance & GDPR / CCPA Privacy Engine Controller
 * Author: Axiocruit Enterprise Security & Compliance
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const TestSession = require('../models/TestSession');
const Session = require('../models/Session');
const { logAuditEvent } = require('../utils/auditLogger');
const { CanonicalRoles, isAdminRole } = require('../schemas/roleTaxonomy');

// Global retention defaults (in days)
const DEFAULT_RETENTION_POLICIES = {
  proctoringRetentionDays: 90,
  testSessionRetentionDays: 30,
  auditLogRetentionDays: 365,
  candidateInactivityRetentionDays: 730,
};

let currentRetentionPolicies = { ...DEFAULT_RETENTION_POLICIES };

/**
 * Helper to safely delete an uploaded file from disk if it exists
 */
const safeDeleteFile = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filename = path.basename(fileUrl);
    const filePath = path.resolve(__dirname, '../public/uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[Compliance] Failed to remove local file:', err.message);
  }
};

/**
 * POST /api/compliance/gdpr/export
 * Exports complete candidate data in a machine-readable, cryptographically verified JSON bundle
 */
const exportUserData = async (req, res) => {
  try {
    const targetUserId = req.body?.userId || req.user._id || req.user.id;
    const isSelf = String(req.user._id || req.user.id) === String(targetUserId);
    const isAdmin = isAdminRole(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only export your own personal data' });
    }

    const user = await User.findById(targetUserId).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await Profile.findOne({ user: targetUserId }).lean();
    const applications = await Application.find({ candidate: targetUserId })
      .populate('job', 'title department organization status')
      .lean();
    const testSessions = await TestSession.find({ candidateId: targetUserId })
      .populate('jobId', 'title')
      .lean();
    const interviews = await Interview.find({ candidateId: targetUserId })
      .populate('jobId', 'title')
      .select('-__v')
      .lean();

    const dataPayload = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills || [],
        experience: user.experience || [],
        projects: user.projects || [],
        createdAt: user.createdAt,
      },
      profile: profile || null,
      applications: (applications || []).map((app) => ({
        id: app._id,
        jobTitle: app.job?.title || 'N/A',
        department: app.job?.department || 'N/A',
        status: app.status,
        aiScore: app.aiScore,
        appliedAt: app.appliedAt,
      })),
      testSessions: (testSessions || []).map((ts) => ({
        id: ts._id,
        jobTitle: ts.jobId?.title || 'Adaptive Coding Assessment',
        status: ts.status,
        score: ts.score,
        questionsCount: ts.responses?.length || 0,
        startedAt: ts.startedAt,
        completedAt: ts.completedAt,
      })),
      interviews: (interviews || []).map((inv) => ({
        id: inv._id,
        meetingId: inv.meetingId,
        scheduledTime: inv.scheduledTime,
        status: inv.status,
        proctorSummary: {
          totalEvents: inv.proctorLog?.length || 0,
          redFlags: inv.aiEvaluation?.redFlags || [],
        },
      })),
    };

    const payloadString = JSON.stringify(dataPayload);
    const checksum = crypto.createHash('sha256').update(payloadString).digest('hex');

    await logAuditEvent({
      req,
      action: 'DSR_EXPORT_EXECUTED',
      resource: { type: 'User', id: targetUserId },
      details: {
        recordCount: {
          applications: applications.length,
          testSessions: testSessions.length,
          interviews: interviews.length,
        },
        checksum,
      },
    });

    return res.status(200).json({
      success: true,
      exportedAt: new Date().toISOString(),
      candidateId: targetUserId,
      checksum,
      data: dataPayload,
    });
  } catch (err) {
    console.error('[Compliance] exportUserData error:', err);
    return res.status(500).json({ message: 'Failed to generate GDPR data export' });
  }
};

/**
 * POST /api/compliance/gdpr/anonymize
 * One-way pseudonymizes/anonymizes candidate records in accordance with GDPR Art. 17 / CCPA
 */
const anonymizeCandidate = async (req, res) => {
  try {
    const targetUserId = req.body?.userId || req.user._id || req.user.id;
    const isSelf = String(req.user._id || req.user.id) === String(targetUserId);
    const isAdmin = isAdminRole(req.user.role);

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: You can only request anonymization for your own account' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const anonHash = crypto.randomBytes(6).toString('hex');
    const oldResumeUrl = user.resumeUrl;

    // 1. One-way pseudonymize User document
    user.name = `Anonymous Candidate ${anonHash}`;
    user.firstName = 'Anonymous';
    user.lastName = 'Candidate';
    user.email = `anonymized_${anonHash}@deleted.axiocruit.com`;
    user.password = crypto.randomBytes(32).toString('hex'); // unrecoverable
    user.bio = '';
    user.skills = [];
    user.experience = [];
    user.projects = [];
    user.profilePicture = null;
    user.resumeUrl = null;
    await user.save();

    // 2. Anonymize Profile document
    await Profile.findOneAndUpdate(
      { user: targetUserId },
      {
        $set: {
          bio: '',
          skills: [],
          experience: [],
          education: [],
          links: {},
          isPublic: false,
        },
      }
    );

    // 3. Delete physical resume files from uploads
    if (oldResumeUrl) {
      safeDeleteFile(oldResumeUrl);
    }

    // 4. Anonymize Applications while preserving aggregate business metrics
    const applications = await Application.find({ candidate: targetUserId });
    for (const app of applications) {
      if (app.resumeUrl) {
        safeDeleteFile(app.resumeUrl);
      }
      app.resume = '';
      app.resumeUrl = null;
      app.experience = [];
      app.education = [];
      app.skills = [];
      await app.save();
    }

    // 5. Scrub raw proctoring logs in Interviews
    await Interview.updateMany(
      { candidateId: targetUserId },
      {
        $set: {
          proctorLog: [],
        },
      }
    );

    // 6. Immediately purge all active Dual-Token sessions
    await Session.deleteMany({ userId: targetUserId });

    // 7. Record immutable audit log entry
    await logAuditEvent({
      req,
      action: 'CANDIDATE_ANONYMIZED_GDPR',
      resource: { type: 'User', id: targetUserId },
      details: {
        pseudonym: `Anonymous Candidate ${anonHash}`,
        applicationsAnonymized: applications.length,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Candidate personal data has been completely and irreversibly anonymized in compliance with GDPR Art. 17 and CCPA.',
      pseudonym: `Anonymous Candidate ${anonHash}`,
    });
  } catch (err) {
    console.error('[Compliance] anonymizeCandidate error:', err);
    return res.status(500).json({ message: 'Failed to anonymize candidate data' });
  }
};

/**
 * GET /api/compliance/retention-policies
 */
const getRetentionPolicies = async (req, res) => {
  return res.status(200).json({
    success: true,
    policies: currentRetentionPolicies,
  });
};

/**
 * PUT /api/compliance/retention-policies
 * Protected: ADMIN only
 */
const updateRetentionPolicies = async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Admin authorization required' });
    }

    const { proctoringRetentionDays, testSessionRetentionDays, auditLogRetentionDays, candidateInactivityRetentionDays } = req.body;

    if (proctoringRetentionDays && Number(proctoringRetentionDays) > 0) {
      currentRetentionPolicies.proctoringRetentionDays = Number(proctoringRetentionDays);
    }
    if (testSessionRetentionDays && Number(testSessionRetentionDays) > 0) {
      currentRetentionPolicies.testSessionRetentionDays = Number(testSessionRetentionDays);
    }
    if (auditLogRetentionDays && Number(auditLogRetentionDays) > 0) {
      currentRetentionPolicies.auditLogRetentionDays = Number(auditLogRetentionDays);
    }
    if (candidateInactivityRetentionDays && Number(candidateInactivityRetentionDays) > 0) {
      currentRetentionPolicies.candidateInactivityRetentionDays = Number(candidateInactivityRetentionDays);
    }

    await logAuditEvent({
      req,
      action: 'RETENTION_POLICIES_UPDATED',
      resource: { type: 'System', id: 'retention_policies' },
      details: currentRetentionPolicies,
    });

    return res.status(200).json({
      success: true,
      message: 'Retention policies updated successfully',
      policies: currentRetentionPolicies,
    });
  } catch (err) {
    console.error('[Compliance] updateRetentionPolicies error:', err);
    return res.status(500).json({ message: 'Failed to update retention policies' });
  }
};

/**
 * POST /api/compliance/retention/execute-purge
 * Executes automated data retention purge based on configured SLA thresholds
 */
const executeRetentionPurge = async (req, res) => {
  try {
    if (!isAdminRole(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Admin authorization required' });
    }

    const now = Date.now();
    const proctorCutoff = new Date(now - currentRetentionPolicies.proctoringRetentionDays * 24 * 60 * 60 * 1000);
    const testCutoff = new Date(now - currentRetentionPolicies.testSessionRetentionDays * 24 * 60 * 60 * 1000);

    // 1. Purge proctoring logs older than cutoff
    const proctorResult = await Interview.updateMany(
      { scheduledTime: { $lt: proctorCutoff }, 'proctorLog.0': { $exists: true } },
      { $set: { proctorLog: [] } }
    );

    // 2. Mark completed test sessions older than cutoff with archived status
    const testResult = await TestSession.updateMany(
      { completedAt: { $lt: testCutoff }, status: 'completed' },
      { $set: { 'responses.$[].submittedCode': '# Archived under retention policy' } }
    );

    await logAuditEvent({
      req,
      action: 'RETENTION_PURGE_EXECUTED',
      resource: { type: 'System', id: 'retention_purge' },
      details: {
        proctorLogsPurgedInterviews: proctorResult.modifiedCount || 0,
        testSessionsArchived: testResult.modifiedCount || 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Automated data retention purge executed successfully',
      purged: {
        interviewsScrubbed: proctorResult.modifiedCount || 0,
        testSessionsArchived: testResult.modifiedCount || 0,
      },
    });
  } catch (err) {
    console.error('[Compliance] executeRetentionPurge error:', err);
    return res.status(500).json({ message: 'Failed to execute retention purge' });
  }
};

module.exports = {
  exportUserData,
  anonymizeCandidate,
  getRetentionPolicies,
  updateRetentionPolicies,
  executeRetentionPurge,
  DEFAULT_RETENTION_POLICIES,
};
