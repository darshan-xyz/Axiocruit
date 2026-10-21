/**
 * Enterprise Scorecard & Evaluation Controller
 * Author: Axiocruit Enterprise Integration Platform
 */

const InterviewScorecard = require('../models/InterviewScorecard');
const EvaluationRubric = require('../models/EvaluationRubric');
const Interview = require('../models/Interview');
const Organization = require('../models/Organization');
const calibrationService = require('../services/calibrationService');
const { logAuditEvent } = require('../utils/auditLogger');
const { isAdminRole, isOrgAdminRole } = require('../schemas/roleTaxonomy');

/**
 * Resolve organization ID
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
 * POST /api/scorecards
 * Submit or update a structured interview scorecard
 */
const submitScorecard = async (req, res) => {
  try {
    const {
      interviewId,
      ratings = [],
      overallRecommendation,
      candidateSummary = '',
      privateNotes = '',
      rubricId,
    } = req.body;

    if (!interviewId || !overallRecommendation) {
      return res.status(400).json({ message: 'interviewId and overallRecommendation are required' });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const calculatedScore = calibrationService.calculateWeightedScore(ratings);
    const interviewerId = req.user._id || req.user.id;

    const scorecard = await InterviewScorecard.findOneAndUpdate(
      { interviewId, interviewerId },
      {
        $set: {
          jobId: interview.jobId,
          candidateId: interview.candidateId,
          rubricId: rubricId || null,
          ratings,
          overallRecommendation,
          calculatedScore,
          candidateSummary,
          privateNotes,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    await logAuditEvent({
      req,
      action: 'SCORECARD_SUBMITTED',
      resource: { type: 'InterviewScorecard', id: scorecard._id },
      details: {
        interviewId,
        overallRecommendation,
        calculatedScore,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Interview scorecard saved successfully',
      scorecard,
    });
  } catch (err) {
    console.error('[Scorecard] submitScorecard error:', err);
    return res.status(500).json({ message: 'Failed to submit interview scorecard' });
  }
};

/**
 * GET /api/scorecards/interview/:interviewId
 * Retrieve scorecards for an interview
 */
const getInterviewScorecards = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const scorecards = await InterviewScorecard.find({ interviewId })
      .populate('interviewerId', 'name email role')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      scorecards,
    });
  } catch (err) {
    console.error('[Scorecard] getInterviewScorecards error:', err);
    return res.status(500).json({ message: 'Failed to retrieve interview scorecards' });
  }
};

/**
 * GET /api/scorecards/consensus/:interviewId
 * Compute multi-stage calibrated consensus analytics
 */
const getConsensusAnalytics = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const scorecards = await InterviewScorecard.find({ interviewId });
    const consensus = calibrationService.evaluateConsensus(scorecards);

    return res.status(200).json({
      success: true,
      interviewId,
      consensus,
    });
  } catch (err) {
    console.error('[Scorecard] getConsensusAnalytics error:', err);
    return res.status(500).json({ message: 'Failed to compute consensus analytics' });
  }
};

/**
 * GET /api/scorecards/packet/:jobId/:candidateId
 * Assemble multi-stage candidate dossier packet
 */
const getCandidatePacket = async (req, res) => {
  try {
    const { jobId, candidateId } = req.params;
    const packet = await calibrationService.buildCandidatePacket(jobId, candidateId);

    return res.status(200).json({
      success: true,
      packet,
    });
  } catch (err) {
    console.error('[Scorecard] getCandidatePacket error:', err);
    return res.status(500).json({ message: err.message || 'Failed to assemble candidate dossier packet' });
  }
};

/**
 * GET /api/scorecards/rubrics
 * List evaluation rubrics for the organization
 */
const listRubrics = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.query.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const rubrics = await EvaluationRubric.find({ organization: orgId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, rubrics });
  } catch (err) {
    console.error('[Scorecard] listRubrics error:', err);
    return res.status(500).json({ message: 'Failed to retrieve evaluation rubrics' });
  }
};

/**
 * POST /api/scorecards/rubrics
 * Create a new evaluation rubric
 */
const createRubric = async (req, res) => {
  try {
    const orgId = await resolveOrgId(req.user, req.body.organizationId);
    if (!orgId) {
      return res.status(400).json({ message: 'User is not associated with an organization' });
    }

    const { title, description = '', criteria = [], isDefault = false } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Rubric title is required' });
    }

    const rubric = await EvaluationRubric.create({
      organization: orgId,
      title: title.trim(),
      description: description.trim(),
      criteria,
      isDefault,
    });

    await logAuditEvent({
      req,
      action: 'EVALUATION_RUBRIC_CREATED',
      resource: { type: 'EvaluationRubric', id: rubric._id },
      details: { title: rubric.title, criteriaCount: rubric.criteria.length },
    });

    return res.status(201).json({
      success: true,
      message: 'Evaluation rubric created successfully',
      rubric,
    });
  } catch (err) {
    console.error('[Scorecard] createRubric error:', err);
    return res.status(500).json({ message: 'Failed to create evaluation rubric' });
  }
};

module.exports = {
  submitScorecard,
  getInterviewScorecards,
  getConsensusAnalytics,
  getCandidatePacket,
  listRubrics,
  createRubric,
};
