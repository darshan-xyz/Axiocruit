/**
 * Axiocruit Enterprise Integration Test Harness
 * Phase 18: Enterprise Structured Candidate Feedback, Multi-Stage Calibration & Rubric Engine
 */

const path = require('path');
module.paths.push(path.resolve(__dirname, '../server/node_modules'));

const assert = require('assert');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../server/models/User');
const Organization = require('../server/models/Organization');
const Job = require('../server/models/Job');
const Interview = require('../server/models/Interview');
const Application = require('../server/models/Application');
const EvaluationRubric = require('../server/models/EvaluationRubric');
const InterviewScorecard = require('../server/models/InterviewScorecard');
const AuditLog = require('../server/models/AuditLog');

const calibrationService = require('../server/services/calibrationService');
const scorecardController = require('../server/controllers/scorecardController');

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

async function runPhase18Tests() {
  console.log('========================================================================');
  console.log('  AXIOCRUIT PHASE 18: SCORECARDS & MULTI-STAGE CALIBRATION HARNESS       ');
  console.log('========================================================================');

  let mongoServer;

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('[Setup] In-memory MongoDB connected successfully.');

    // Seed test users & records
    const orgUser = await User.create({
      name: 'Google Engineering Lead',
      email: 'lead@google.com',
      password: 'HashedPassword123!',
      role: 'ORGANIZATION',
    });

    const org = await Organization.create({
      name: 'Google LLC',
      admin: orgUser._id,
    });
    orgUser.organization = org._id;
    await orgUser.save();

    const interviewer1 = await User.create({
      name: 'Senior Interviewer 1',
      email: 'int1@google.com',
      password: 'HashedPassword123!',
      role: 'INTERVIEWER',
    });

    const interviewer2 = await User.create({
      name: 'Staff Architect 2',
      email: 'int2@google.com',
      password: 'HashedPassword123!',
      role: 'INTERVIEWER',
    });

    const candidate = await User.create({
      name: 'Linus Torvalds',
      email: 'linus@kernel.org',
      password: 'HashedPassword123!',
      role: 'CANDIDATE',
      skills: ['C', 'Linux', 'Operating Systems', 'Git'],
    });

    const job = await Job.create({
      title: 'Principal Systems Architect',
      company: 'Google LLC',
      location: 'Mountain View, CA',
      description: 'Lead kernel and distributed systems architecture',
      postedBy: orgUser._id,
      organization: org._id,
      status: 'Active',
    });

    const application = await Application.create({
      job: job._id,
      candidate: candidate._id,
      status: 'Interview',
      aiScore: 96,
    });

    const interview = await Interview.create({
      candidateId: candidate._id,
      recruiterId: orgUser._id,
      interviewerId: interviewer1._id,
      jobId: job._id,
      scheduledTime: new Date(Date.now() + 86400000),
      status: 'Completed',
      meetingId: 'mtg-calib-101',
      proctorLog: [{ type: 'gaze', timestamp: Date.now() }],
    });

    let createdRubricId;

    await describe('Suite 1: Structured Evaluation Rubrics', async () => {
      await it('Creates an evaluation rubric with competency weights and levels', async () => {
        totalTests++;
        const req = {
          user: orgUser,
          body: {
            title: 'L6 Systems Engineering Rubric',
            criteria: [
              { name: 'Algorithmic Efficiency', weight: 2.0, description: 'Time & space optimization' },
              { name: 'System Scalability', weight: 2.0, description: 'Distributed consensus & fault tolerance' },
              { name: 'Communication', weight: 1.0, description: 'Clarity and articulation' },
            ],
            isDefault: true,
          },
        };
        const res = createMockRes();
        await scorecardController.createRubric(req, res);

        assert.strictEqual(res.statusCode, 201);
        assert(res.body.success);
        assert.strictEqual(res.body.rubric.title, 'L6 Systems Engineering Rubric');
        assert.strictEqual(res.body.rubric.criteria.length, 3);
        createdRubricId = res.body.rubric._id;

        const audit = await AuditLog.findOne({
          action: 'EVALUATION_RUBRIC_CREATED',
          'resource.id': String(createdRubricId),
        });
        assert(audit, 'Audit log recorded for rubric creation');
      });

      await it('Calculates weighted score normalized to 0-100 percentage', async () => {
        totalTests++;
        const ratings = [
          { criteriaName: 'Algorithmic Efficiency', score: 5, weight: 2.0 }, // (5/5)*100 * 2 = 200
          { criteriaName: 'System Scalability', score: 4, weight: 2.0 },      // (4/5)*100 * 2 = 160
          { criteriaName: 'Communication', score: 4, weight: 1.0 },           // (4/5)*100 * 1 = 80
        ]; // Total weighted sum = 440, Total weight = 5.0 -> Score = 88.0%

        const score = calibrationService.calculateWeightedScore(ratings);
        assert.strictEqual(score, 88.0);
      });
    });

    await describe('Suite 2: Scorecard Submission & Deduplication', async () => {
      await it('Submits scorecard for interviewer and computes score automatically', async () => {
        totalTests++;
        const req = {
          user: interviewer1,
          body: {
            interviewId: interview._id,
            rubricId: createdRubricId,
            overallRecommendation: 'Strong Hire',
            ratings: [
              { criteriaName: 'Algorithmic Efficiency', score: 5, weight: 2.0 },
              { criteriaName: 'System Scalability', score: 5, weight: 2.0 },
              { criteriaName: 'Communication', score: 4, weight: 1.0 },
            ], // Score = ((100*2) + (100*2) + (80*1)) / 5 = 480 / 5 = 96.0%
            candidateSummary: 'Exceptional systems architect with deep OS understanding.',
            privateNotes: 'Top 1% candidate.',
          },
        };
        const res = createMockRes();
        await scorecardController.submitScorecard(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert(res.body.success);
        assert.strictEqual(res.body.scorecard.overallRecommendation, 'Strong Hire');
        assert.strictEqual(res.body.scorecard.calculatedScore, 96.0);
      });

      await it('Upserts scorecard on resubmission without duplicate document creation', async () => {
        totalTests++;
        const req = {
          user: interviewer1,
          body: {
            interviewId: interview._id,
            overallRecommendation: 'Strong Hire',
            ratings: [
              { criteriaName: 'Algorithmic Efficiency', score: 5, weight: 1.0 },
              { criteriaName: 'System Scalability', score: 5, weight: 1.0 },
            ],
            candidateSummary: 'Updated review.',
          },
        };
        const res = createMockRes();
        await scorecardController.submitScorecard(req, res);

        assert.strictEqual(res.statusCode, 200);

        const count = await InterviewScorecard.countDocuments({
          interviewId: interview._id,
          interviewerId: interviewer1._id,
        });
        assert.strictEqual(count, 1, 'Only 1 scorecard persisted per interviewer');
      });
    });

    await describe('Suite 3: Multi-Stage Consensus & Calibration Conflict Detection', async () => {
      await it('Flags calibration required when interviewers have polar opposite recommendations or large score spread', async () => {
        totalTests++;
        // Interviewer 2 submits low score / No Hire
        const req2 = {
          user: interviewer2,
          body: {
            interviewId: interview._id,
            overallRecommendation: 'No Hire',
            ratings: [
              { criteriaName: 'Algorithmic Efficiency', score: 2, weight: 1.0 },
              { criteriaName: 'System Scalability', score: 2, weight: 1.0 },
            ], // Score = 40.0%
            candidateSummary: 'Not aligned with team style.',
          },
        };
        const res2 = createMockRes();
        await scorecardController.submitScorecard(req2, res2);
        assert.strictEqual(res2.statusCode, 200);

        // Fetch consensus analytics
        const consensusReq = { user: orgUser, params: { interviewId: interview._id } };
        const consensusRes = createMockRes();
        await scorecardController.getConsensusAnalytics(consensusReq, consensusRes);

        assert.strictEqual(consensusRes.statusCode, 200);
        const analysis = consensusRes.body.consensus;

        assert.strictEqual(analysis.totalScorecards, 2);
        assert.strictEqual(analysis.calibrationNeeded, true, 'Calibration flagged due to conflict');
        assert(analysis.reasons.length >= 1, 'Specific calibration variance reasons provided');
      });

      await it('Assembles comprehensive multi-stage candidate dossier packet', async () => {
        totalTests++;
        const packetReq = { user: orgUser, params: { jobId: job._id, candidateId: candidate._id } };
        const packetRes = createMockRes();
        await scorecardController.getCandidatePacket(packetReq, packetRes);

        assert.strictEqual(packetRes.statusCode, 200);
        const packet = packetRes.body.packet;

        assert.strictEqual(packet.candidate.name, 'Linus Torvalds');
        assert.strictEqual(packet.job.title, 'Principal Systems Architect');
        assert.strictEqual(packet.scorecards.length, 2);
        assert(packet.consensusAnalysis, 'Consensus evaluation included in packet');
        assert.strictEqual(packet.securityAndProctoring.totalAnomalies, 1);
      });
    });

    console.log('\n========================================================================');
    console.log(`TOTAL PHASE 18 INTEGRATION TESTS: ${totalTests}`);
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

runPhase18Tests().catch((err) => {
  console.error('Fatal error running Phase 18 tests:', err);
  process.exit(1);
});
