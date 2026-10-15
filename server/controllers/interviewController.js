/**
 * Interview Domain Controller
 * Author: Axiocruit Core Engineering
 */

const { v4: uuidv4 } = require('uuid');
const Interview = require('../models/Interview');
const TestSession = require('../models/TestSession');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const HttpClient = require('../utils/httpClient');

// AI Service URL from environment (defaults to port 8002 for microservice isolation)
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8002';

/**
 * Enterprise post-interview evaluation using HttpClient with Circuit Breaker
 */
const evaluateInterviewWithAI = async (aiPayload, options = {}) => {
  return HttpClient.executeWithBreaker(
    'ai-service',
    async () => {
      const response = await HttpClient.postJson(`${AI_SERVICE_URL}/api/ai/evaluate-interview`, aiPayload, {
        timeoutMs: options.timeoutMs || 10000,
        maxRetries: options.maxRetries !== undefined ? options.maxRetries : 1,
      });
      return response;
    },
    async (err) => {
      console.warn(`[evaluateInterviewWithAI] AI evaluation service unavailable (${err.message}). Using fallback evaluation.`);
      return {
        suitabilityScore: aiPayload.codingTestConducted ? Math.max(aiPayload.codingScore || 0, 10) : 50,
        strengths: ['Interview completed successfully', 'Candidate demonstrated technical engagement'],
        weaknesses: ['AI detailed analysis unavailable — evaluation generated from metrics via circuit breaker fallback'],
        redFlags: [],
        isFallback: true,
      };
    },
    options
  );
};

// ============================
// Helper: Build red flags from a proctorLog array (rule-based, no LLM)
// ============================
function buildRedFlagsFromLog(proctorLog = []) {
  const counts = {};
  for (const e of proctorLog) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }

  const flags = [];

  if (counts.tab_switch > 0) {
    flags.push(
      `Candidate switched browser tabs ${counts.tab_switch} time(s) during the interview — potential use of external resources.`
    );
  }
  if (counts.copy > 0 || counts.paste > 0) {
    const c = counts.copy || 0;
    const p = counts.paste || 0;
    flags.push(
      `Clipboard activity detected: ${c} copy and ${p} paste event(s) — may indicate code was sourced externally.`
    );
  }
  if (counts.face_lost > 0) {
    flags.push(
      `Camera presence lost ${counts.face_lost} time(s) — candidate may have left the screen or covered the webcam.`
    );
  }
  if (counts.multiple_faces > 0) {
    flags.push(
      `Multiple faces detected ${counts.multiple_faces} time(s) — candidate may not have been alone during interview.`
    );
  }
  if (counts.gaze > 0) {
    flags.push(
      `Off-screen gaze detected ${counts.gaze} time(s) — candidate's attention appeared to divert from the screen.`
    );
  }
  if (counts.screenshot > 0) {
    flags.push(
      `Screenshot attempt detected ${counts.screenshot} time(s) — candidate may have tried to capture interview content.`
    );
  }

  return flags;
}

/**
 * Helper: Verify if an organization admin has authority over a target user
 * (e.g. recruiter or interviewer) belonging to the same organization.
 */
const isOrgAdminOfTarget = async (reqUser, targetUserId) => {
  if (!reqUser || !targetUserId) return false;
  const roleUpper = (reqUser.role || '').toUpperCase();
  if (roleUpper !== 'ORGANIZATION' && roleUpper !== 'ORG_ADMIN') return false;

  const currentUserId = (reqUser._id || reqUser.id).toString();
  const targetIdStr = (targetUserId._id || targetUserId).toString();
  if (currentUserId === targetIdStr) return true;

  const [orgUser, targetUser] = await Promise.all([
    User.findById(currentUserId).select('organization role'),
    User.findById(targetIdStr).select('organization'),
  ]);

  return Boolean(
    orgUser?.organization &&
    targetUser?.organization &&
    orgUser.organization.toString() === targetUser.organization.toString()
  );
};

// @desc    Get eligible candidates for scheduling (only those who applied to recruiter's jobs)
// @route   GET /api/interviews/eligible-candidates
// @access  Private (Recruiter / Admin / Org Admin)
exports.getEligibleCandidates = async (req, res) => {
  try {
    let recruiterJobQuery = { postedBy: req.user._id };
    const roleUpper = (req.user.role || '').toUpperCase();
    if (roleUpper === 'ORGANIZATION' || roleUpper === 'ORG_ADMIN') {
      let posterIds = [req.user._id];
      if (req.user.organization) {
        const teamUsers = await User.find({ organization: req.user.organization }).select('_id');
        posterIds = teamUsers.map((u) => u._id);
      }
      recruiterJobQuery = { postedBy: { $in: posterIds } };
    } else if (roleUpper === 'ADMIN') {
      recruiterJobQuery = {};
    }
    const recruiterJobs = await Job.find(recruiterJobQuery).select('_id');
    const jobIds = recruiterJobs.map((job) => job._id);

    if (jobIds.length === 0) {
      return res.json([]);
    }

    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'name email profilePicture');

    const candidateMap = new Map();

    for (const app of applications) {
      if (!app.candidate || !app.candidate._id) continue;

      const candidateIdStr = app.candidate._id.toString();
      if (candidateMap.has(candidateIdStr)) {
        candidateMap.get(candidateIdStr).appliedJobIds.push(app.job.toString());
      } else {
        candidateMap.set(candidateIdStr, {
          _id: app.candidate._id,
          name: app.candidate.name,
          email: app.candidate.email,
          profilePicture: app.candidate.profilePicture || null,
          appliedJobIds: [app.job.toString()],
        });
      }
    }

    res.json(Array.from(candidateMap.values()));
  } catch (err) {
    console.error('[InterviewController][getEligibleCandidates] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch eligible candidates' });
  }
};

// @desc    Schedule an Interview
// @route   POST /api/interviews/schedule
// @access  Private (Recruiter / Interviewer)
exports.scheduleInterview = async (req, res) => {
  try {
    const { candidateId, recruiterId, interviewerId, jobId, scheduledTime, notes, isDirectBooking } = req.body;

    const scheduledDate = new Date(scheduledTime);
    if (!scheduledTime || isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      return res.status(400).json({ message: 'scheduledTime must be a valid future date' });
    }

    let targetRecruiterId = req.user._id;

    if (jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }

      const isOwner = job.postedBy && job.postedBy.toString() === req.user._id.toString();
      const isDelegated = job.delegatedFreelancerId && job.delegatedFreelancerId.toString() === req.user._id.toString();
      const isOrgAdminOfJob = await isOrgAdminOfTarget(req.user, job.postedBy);

      if (!isOwner && !isDelegated && !isOrgAdminOfJob && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Not authorized to schedule for this job' });
      }

      targetRecruiterId = job.postedBy;
    } else if (req.user.role === 'freelancer' || req.user.role === 'INTERVIEWER') {
      return res.status(400).json({ message: 'Job ID is required for delegated scheduling' });
    }

    if (!candidateId && !isDirectBooking) {
      return res.status(400).json({ message: 'candidateId is required' });
    }

    const isFreelancer = req.user.role === 'freelancer' || req.user.role === 'INTERVIEWER';

    const interviewData = {
      recruiterId: targetRecruiterId,
      candidateId: candidateId,
      jobId: jobId || undefined,
      interviewerId: isFreelancer ? req.user._id : (interviewerId || undefined),
      scheduledTime: new Date(scheduledTime),
      notes: notes || '',
    };

    if (isDirectBooking) {
      interviewData.status = 'Pending';
      interviewData.meetingId = `temp-${uuidv4()}`;
    } else {
      interviewData.meetingId = uuidv4();
      interviewData.status = 'Scheduled';
    }

    const newInterview = new Interview(interviewData);
    await newInterview.save();

    const populated = await Interview.findById(newInterview._id)
      .populate('candidateId', 'name email profilePicture')
      .populate('recruiterId', 'name email profilePicture')
      .populate('interviewerId', 'name email profilePicture')
      .populate('jobId', 'title company');

    res.status(201).json(populated);
  } catch (error) {
    console.error('[InterviewController][scheduleInterview] Error:', error.message);
    res.status(500).json({ message: 'Failed to schedule', error: error.message });
  }
};

// @desc    Get My Interviews
// @route   GET /api/interviews/my-interviews
// @access  Private
exports.getMyInterviews = async (req, res) => {
  try {
    let query = {};
    const role = (req.user.role || '').toUpperCase();

    if (role === 'RECRUITER') {
      query = { recruiterId: req.user._id };
    } else if (role === 'CANDIDATE') {
      query = { candidateId: req.user._id };
    } else if (role === 'ORGANIZATION' || role === 'ORG_ADMIN') {
      let posterIds = [req.user._id];
      if (req.user.organization) {
        const teamUsers = await User.find({ organization: req.user.organization }).select('_id');
        posterIds = teamUsers.map((u) => u._id);
      }
      query = {
        $or: [
          { recruiterId: { $in: posterIds } },
          { interviewerId: { $in: posterIds } },
        ],
      };
    } else {
      query = {
        $or: [
          { recruiterId: req.user._id },
          { candidateId: req.user._id },
          { interviewerId: req.user._id },
        ],
      };
    }

    const interviews = await Interview.find(query)
      .populate('candidateId', 'name firstName lastName email profilePicture')
      .populate('recruiterId', 'name firstName lastName email profilePicture companyName')
      .populate('interviewerId', 'name firstName lastName email profilePicture')
      .populate('jobId', 'title company status delegationStatus')
      .sort({ scheduledTime: -1 });

    const now = new Date();
    const activeInterviews = [];
    const pastInterviews = [];

    interviews.forEach((interview) => {
      const isPastTime = new Date(interview.scheduledTime) < now;
      const isJobClosed =
        interview.jobId?.status === 'Closed' || interview.jobId?.delegationStatus === 'completed';
      const isStatusTerminal = ['Completed', 'Cancelled'].includes(interview.status);

      if (isPastTime || isJobClosed || isStatusTerminal) {
        pastInterviews.push(interview);
      } else {
        activeInterviews.push(interview);
      }
    });

    res.json({ activeInterviews, pastInterviews });
  } catch (err) {
    console.error('[InterviewController][getMyInterviews] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};

// @desc    Get Single Interview
// @route   GET /api/interviews/:id
// @access  Private
exports.getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await Interview.findOne({
      $or: [
        ...(id.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: id }] : []),
        { meetingId: id },
      ],
    })
      .populate('candidateId', 'name email profilePicture')
      .populate('recruiterId', 'name email profilePicture')
      .populate('interviewerId', 'name email profilePicture')
      .populate('jobId', 'title company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = req.user._id.toString();
    const isRecruiter = interview.recruiterId?._id?.toString() === userId;
    const isCandidate = interview.candidateId?._id?.toString() === userId;
    const isInterviewer = interview.interviewerId?._id?.toString() === userId || interview.interviewerId?.toString() === userId;
    const isOrgAdminOfInterview = await isOrgAdminOfTarget(req.user, interview.recruiterId?._id || interview.recruiterId);
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isRecruiter && !isCandidate && !isInterviewer && !isOrgAdminOfInterview && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to join this interview' });
    }

    const isUserHost = isRecruiter || isInterviewer || isOrgAdminOfInterview || isAdmin;

    res.json({ ...interview.toObject(), isUserHost });
  } catch (err) {
    console.error('[InterviewController][getInterviewById] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch interview' });
  }
};

// @desc    Update Interview Status
// @route   PATCH /api/interviews/:id/status
// @access  Private
exports.updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Accepted', 'Rejected', 'Scheduled', 'InProgress', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = req.user._id.toString();
    const isRecruiter = interview.recruiterId.toString() === userId;
    const isCandidate = interview.candidateId.toString() === userId;
    const isInterviewer = interview.interviewerId?.toString() === userId;
    const isOrgAdminOfInterview = await isOrgAdminOfTarget(req.user, interview.recruiterId);

    if (!isRecruiter && !isCandidate && !isInterviewer && !isOrgAdminOfInterview && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this interview' });
    }

    interview.status = status;

    if (status === 'Accepted' && (!interview.meetingId || interview.meetingId.startsWith('temp-'))) {
      interview.status = 'Scheduled';
      interview.meetingId = uuidv4();
    }

    await interview.save();

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email profilePicture')
      .populate('recruiterId', 'name email profilePicture')
      .populate('interviewerId', 'name email profilePicture')
      .populate('jobId', 'title company');

    res.json(populated);
  } catch (err) {
    console.error('[InterviewController][updateInterviewStatus] Error:', err.message);
    res.status(500).json({ message: 'Failed to update interview status' });
  }
};

// @desc    Cancel Interview (Soft Delete)
// @route   DELETE /api/interviews/:id
// @access  Private (Recruiter / Admin / Org Admin)
exports.cancelInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const isOwner = interview.recruiterId.toString() === req.user._id.toString();
    const isOrgAdminOfInterview = await isOrgAdminOfTarget(req.user, interview.recruiterId);

    if (!isOwner && !isOrgAdminOfInterview && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to cancel this interview' });
    }

    interview.status = 'Cancelled';
    await interview.save();

    res.json({ message: 'Interview cancelled successfully', interview });
  } catch (err) {
    console.error('[InterviewController][cancelInterview] Error:', err.message);
    res.status(500).json({ message: 'Failed to cancel interview' });
  }
};

// @desc    Submit Interview Feedback
// @route   POST /api/interviews/:id/feedback
// @access  Private (Interviewer / Recruiter / Admin)
exports.submitFeedback = async (req, res) => {
  try {
    const { technicalScore, communicationScore, detailedFeedback, recommendation } = req.body;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    const isInterviewer = interview.interviewerId?.toString() === userId;
    const isRecruiter = interview.recruiterId?.toString() === userId;

    if (!isInterviewer && !isRecruiter && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to submit feedback for this interview' });
    }

    let normRecommendation = recommendation;
    if (typeof recommendation === 'string') {
      const lower = recommendation.trim().toLowerCase().replace(/[_\s-]+/g, ' ');
      if (lower === 'strong hire') normRecommendation = 'Strong Hire';
      else if (lower === 'hire') normRecommendation = 'Hire';
      else if (lower === 'no hire') normRecommendation = 'No Hire';
    }

    interview.feedback = {
      technicalScore: Number(technicalScore),
      communicationScore: Number(communicationScore),
      detailedFeedback,
      recommendation: normRecommendation,
    };
    interview.status = 'Completed';

    await interview.save();

    res.json(interview);
  } catch (err) {
    console.error('[InterviewController][submitFeedback] Error:', err.message);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

// @desc    Retrieve proctoring events
// @route   GET /api/interviews/:id/proctor-log
// @access  Private (Recruiter / Interviewer / Admin)
exports.getProctorLog = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = req.user._id.toString();
    const isRecruiter = interview.recruiterId?._id?.toString() === userId;
    const isInterviewer = interview.interviewerId?.toString() === userId;
    const isOrgAdminOfInterview = await isOrgAdminOfTarget(req.user, interview.recruiterId?._id || interview.recruiterId);
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isRecruiter && !isInterviewer && !isOrgAdminOfInterview && !isAdmin) {
      return res.status(403).json({ message: 'Only the recruiter, interviewer, or admin may view proctor logs' });
    }

    res.json({
      interviewId: interview._id,
      candidateName: interview.candidateId?.name || 'Unknown',
      totalEvents: interview.proctorLog?.length || 0,
      events: interview.proctorLog || [],
    });
  } catch (err) {
    console.error('[InterviewController][getProctorLog] Error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve proctor log' });
  }
};

// @desc    Persist proctoring events
// @route   POST /api/interviews/:id/proctor-log
// @access  Private (Participant)
exports.saveProctorLog = async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'No events provided' });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = req.user._id.toString();
    const isParticipant =
      interview.recruiterId.toString() === userId ||
      interview.candidateId.toString() === userId ||
      (interview.interviewerId && interview.interviewerId.toString() === userId);

    if (!isParticipant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized for this interview' });
    }

    const ALLOWED_PROCTOR_TYPES = ['tab_switch', 'copy', 'paste', 'gaze', 'face_lost', 'multiple_faces', 'screenshot'];
    const validEvents = events.filter((e) => e && ALLOWED_PROCTOR_TYPES.includes(e.type));
    if (validEvents.length === 0) {
      return res.status(400).json({ message: 'No valid proctoring events provided' });
    }

    const mappedEvents = validEvents.map((e) => ({
      type: e.type,
      detail: typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail || ''),
      timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
    }));

    interview.proctorLog.push(...mappedEvents);
    await interview.save();

    res.json({ saved: mappedEvents.length, total: interview.proctorLog.length });
  } catch (err) {
    console.error('[InterviewController][saveProctorLog] Error:', err.message);
    res.status(500).json({ message: 'Failed to save proctor log' });
  }
};

// @desc    Complete Interview — AI Report Pipeline (Coordinator)
// @route   POST /api/interviews/:id/complete
// @access  Private (Host)
exports.completeInterview = async (req, res) => {
  try {
    const { interviewerRemarks, codingTestSessionId, liveCode } = req.body;

    console.log(`[InterviewController][Complete] Starting interview completion for ${req.params.id}`);

    // Step 1: Fetch and validate interview
    const interview = await Interview.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .populate('interviewerId', 'name email')
      .populate('jobId', 'title company');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    const userId = req.user._id.toString();
    const isRecruiter = interview.recruiterId?._id?.toString() === userId;
    const isInterviewer = interview.interviewerId?._id?.toString() === userId;
    const isOrgAdminOfInterview = await isOrgAdminOfTarget(req.user, interview.recruiterId?._id || interview.recruiterId);
    const isAdmin = (req.user.role || '').toUpperCase() === 'ADMIN';

    if (!isRecruiter && !isInterviewer && !isOrgAdminOfInterview && !isAdmin) {
      return res.status(403).json({ message: 'Only the host (recruiter/interviewer) can complete this interview' });
    }

    // Step 2: End any active coding test session
    let codingScore = 0;
    let codingTestConducted = interview.codingTestConducted || false;
    let candidateCode = '';

    const directSessionId = codingTestSessionId || interview.codingTestSessionId;
    let testSession = null;

    if (directSessionId) {
      testSession = await TestSession.findById(directSessionId);
    }

    if (!testSession && interview.jobId?._id && interview.candidateId?._id) {
      testSession = await TestSession.findOne({
        candidateId: interview.candidateId._id,
        jobId: interview.jobId._id,
      }).sort({ startedAt: -1 });
    }

    if (testSession) {
      codingTestConducted = true;
      if (testSession.status === 'in_progress') {
        const totalScore = testSession.responses.reduce((sum, r) => sum + (r.score || 0), 0);
        testSession.finalScore =
          testSession.responses.length > 0
            ? Math.round(totalScore / testSession.responses.length)
            : 0;
        testSession.status = 'completed';
        testSession.completedAt = new Date();
        await testSession.save();
      }

      codingScore = testSession.finalScore || 0;
      interview.codingTestSessionId = testSession._id;
      interview.codingTestConducted = true;

      candidateCode = testSession.responses
        .map((r, i) => `// --- Question ${i + 1} (score: ${r.score}%) ---\n${r.submittedCode || '// No code submitted'}`)
        .join('\n\n');
    }

    // Fall back to live collaborative code if no test session answers exist
    if (!candidateCode && liveCode) {
      candidateCode = String(liveCode);
      codingTestConducted = true;
    }

    // Step 3: Save interview as Completed + aiGenerating immediately
    interview.interviewerRemarks = interviewerRemarks || '';
    interview.status = 'Completed';
    interview.aiGenerating = true;
    interview.codingTestConducted = codingTestConducted;

    await interview.save();

    // Step 4: Respond immediately to client
    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'name email profilePicture')
      .populate('recruiterId', 'name email profilePicture')
      .populate('interviewerId', 'name email profilePicture')
      .populate('jobId', 'title company');

    res.json(populated);

    // Step 5: Background AI evaluation with unhandled rejection guard
    (async () => {
      console.log(`[Complete-BG] Starting background AI evaluation for ${req.params.id}...`);
      let aiResult = null;

      // Re-fetch proctorLog with buffer before dispatching to AI service
      await new Promise((r) => setTimeout(r, 2500));

      let freshLog = interview.proctorLog || [];
      try {
        const freshInterview = await Interview.findById(interview._id).select('proctorLog');
        if (freshInterview?.proctorLog) {
          freshLog = freshInterview.proctorLog;
        }
      } catch (rfErr) {}

      // Construct AI payload with fresh proctorLog
      const aiPayload = {
        interviewId: interview._id.toString(),
        candidateCode: candidateCode,
        codingScore: codingScore,
        codingTestConducted: codingTestConducted,
        proctorEvents: freshLog.map((e) => ({
          type: e.type,
          detail: e.detail || '',
          timestamp: e.timestamp ? e.timestamp.toISOString() : '',
        })),
        interviewerNotes: interviewerRemarks || interview.notes || '',
      };

      // Invoke evaluateInterviewWithAI with Circuit Breaker and deterministic fallback
      aiResult = await evaluateInterviewWithAI(aiPayload);

      const finalRedFlags = buildRedFlagsFromLog(freshLog);

      // Update interview record
      await Interview.findByIdAndUpdate(interview._id, {
        aiEvaluation: {
          suitabilityScore: aiResult.suitabilityScore,
          strengths: aiResult.strengths || [],
          weaknesses: aiResult.weaknesses || [],
          redFlags: finalRedFlags,
          codingScore: codingScore,
          evaluatedAt: new Date(),
        },
        aiGenerating: false,
      });

      console.log(`[Complete-BG] Evaluation saved for ${req.params.id}. aiGenerating=false`);
    })().catch(async (bgErr) => {
      console.error(`[Complete-BG] Critical unhandled error in AI evaluation for ${req.params.id}:`, bgErr.message);
      try {
        await Interview.findByIdAndUpdate(interview._id, { aiGenerating: false });
      } catch (_) {}
    });
  } catch (err) {
    console.error('[InterviewController][completeInterview] Error:', err.message);
    res.status(500).json({ message: 'Failed to complete interview', error: err.message });
  }
};

exports.evaluateInterviewWithAI = evaluateInterviewWithAI;
exports.evaluateInterview = evaluateInterviewWithAI;
