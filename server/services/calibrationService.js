/**
 * Enterprise Calibration & Multi-Stage Scoring Engine
 * Computes weighted scores, detects interviewer variance, and builds hiring dossiers
 * Author: Axiocruit Enterprise Integration Platform
 */

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const TestSession = require('../models/TestSession');
const InterviewScorecard = require('../models/InterviewScorecard');

class CalibrationService {
  /**
   * Calculate normalized 0-100 score from criteria ratings
   */
  calculateWeightedScore(ratings = []) {
    if (!Array.isArray(ratings) || ratings.length === 0) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const r of ratings) {
      const score = Math.max(1, Math.min(5, Number(r.score) || 3));
      const weight = Math.max(0.1, Number(r.weight) || 1.0);
      weightedSum += (score / 5) * 100 * weight;
      totalWeight += weight;
    }

    if (totalWeight === 0) return 0;
    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * Evaluate consensus and flag calibration variance across panel scorecards
   */
  evaluateConsensus(scorecards = []) {
    if (!Array.isArray(scorecards) || scorecards.length === 0) {
      return {
        totalScorecards: 0,
        averageScore: 0,
        consensusRecommendation: 'Pending Review',
        calibrationNeeded: false,
        reasons: ['No scorecards submitted yet'],
        criteriaBreakdown: {},
        recommendationCounts: {},
      };
    }

    let sumScore = 0;
    let minScore = 100;
    let maxScore = 0;
    const recommendationCounts = {
      'Strong Hire': 0,
      'Hire': 0,
      'Weak Hire': 0,
      'No Hire': 0,
      'Strong No Hire': 0,
    };

    const criteriaTotals = {}; // criteriaName -> { sum, count }

    for (const sc of scorecards) {
      const score = sc.calculatedScore || 0;
      sumScore += score;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;

      if (sc.overallRecommendation && recommendationCounts[sc.overallRecommendation] !== undefined) {
        recommendationCounts[sc.overallRecommendation]++;
      }

      if (Array.isArray(sc.ratings)) {
        for (const r of sc.ratings) {
          if (!criteriaTotals[r.criteriaName]) {
            criteriaTotals[r.criteriaName] = { sum: 0, count: 0 };
          }
          criteriaTotals[r.criteriaName].sum += Number(r.score) || 0;
          criteriaTotals[r.criteriaName].count++;
        }
      }
    }

    const averageScore = Math.round((sumScore / scorecards.length) * 10) / 10;
    const scoreSpread = maxScore - minScore;

    // Detect conflicts & calibration triggers
    const reasons = [];
    let calibrationNeeded = false;

    // 1. Significant score spread (> 25 points on 100-pt scale)
    if (scorecards.length > 1 && scoreSpread >= 25) {
      calibrationNeeded = true;
      reasons.push(`Score spread between interviewers is ${scoreSpread} points (exceeds 25pt tolerance)`);
    }

    // 2. Polar opposite recommendations (e.g. Strong Hire vs No Hire)
    const hasStrongHire = recommendationCounts['Strong Hire'] > 0;
    const hasReject = recommendationCounts['No Hire'] > 0 || recommendationCounts['Strong No Hire'] > 0;
    if (hasStrongHire && hasReject) {
      calibrationNeeded = true;
      reasons.push('Conflicting hiring recommendations detected (Strong Hire vs No Hire/Strong No Hire)');
    }

    // Average per criteria
    const criteriaBreakdown = {};
    for (const [cName, data] of Object.entries(criteriaTotals)) {
      criteriaBreakdown[cName] = Math.round((data.sum / data.count) * 10) / 10;
    }

    // Determine consensus recommendation
    let consensusRecommendation = 'Hire';
    if (averageScore >= 85 && !hasReject) {
      consensusRecommendation = 'Strong Hire';
    } else if (averageScore < 50 || recommendationCounts['Strong No Hire'] > 0) {
      consensusRecommendation = 'Strong No Hire';
    } else if (averageScore < 65 || (recommendationCounts['No Hire'] >= Math.ceil(scorecards.length / 2))) {
      consensusRecommendation = 'No Hire';
    } else if (averageScore < 72) {
      consensusRecommendation = 'Weak Hire';
    }

    return {
      totalScorecards: scorecards.length,
      averageScore,
      scoreSpread,
      consensusRecommendation,
      calibrationNeeded,
      reasons,
      recommendationCounts,
      criteriaBreakdown,
    };
  }

  /**
   * Build complete candidate dossier packet across all recruitment stages
   */
  async buildCandidatePacket(jobId, candidateId) {
    const [candidate, job, application, testSessions, interviews, scorecards] = await Promise.all([
      User.findById(candidateId).select('-password').lean(),
      Job.findById(jobId).lean(),
      Application.findOne({ job: jobId, candidate: candidateId }).lean(),
      TestSession.find({ jobId, candidateId }).lean(),
      Interview.find({ jobId, candidateId }).lean(),
      InterviewScorecard.find({ jobId, candidateId }).populate('interviewerId', 'name email role').lean(),
    ]);

    if (!candidate || !job) {
      throw new Error('Candidate or Job requisition not found');
    }

    const consensus = this.evaluateConsensus(scorecards);

    // Proctor summary across interviews
    let totalProctorAnomalies = 0;
    const proctorFlags = [];
    for (const inv of interviews) {
      if (Array.isArray(inv.proctorLog)) {
        totalProctorAnomalies += inv.proctorLog.length;
        for (const log of inv.proctorLog) {
          proctorFlags.push({ type: log.type, timestamp: log.timestamp });
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      candidate: {
        id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills || [],
        experience: candidate.experience || [],
        resumeUrl: candidate.resumeUrl,
      },
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
      },
      application: {
        id: application?._id,
        status: application?.status || 'N/A',
        aiScore: application?.aiScore || null,
        matchedKeywords: application?.matchedKeywords || [],
        appliedAt: application?.appliedAt,
      },
      assessments: (testSessions || []).map((ts) => ({
        id: ts._id,
        status: ts.status,
        score: ts.score,
        startedAt: ts.startedAt,
        completedAt: ts.completedAt,
      })),
      interviews: (interviews || []).map((inv) => ({
        id: inv._id,
        meetingId: inv.meetingId,
        scheduledTime: inv.scheduledTime,
        status: inv.status,
        feedback: inv.feedback,
        aiEvaluation: inv.aiEvaluation,
      })),
      scorecards: (scorecards || []).map((sc) => ({
        id: sc._id,
        interviewer: sc.interviewerId?.name || 'Interviewer',
        overallRecommendation: sc.overallRecommendation,
        calculatedScore: sc.calculatedScore,
        ratings: sc.ratings,
        candidateSummary: sc.candidateSummary,
        submittedAt: sc.submittedAt,
      })),
      consensusAnalysis: consensus,
      securityAndProctoring: {
        totalAnomalies: totalProctorAnomalies,
        flags: proctorFlags.slice(0, 20),
      },
    };
  }
}

const calibrationService = new CalibrationService();

module.exports = calibrationService;
