/**
 * Enterprise Interview Scorecard Model
 * Tracks structured, calibrated ratings and recommendation per interviewer
 * Author: Axiocruit Enterprise Integration Platform
 */

const mongoose = require('mongoose');

const interviewScorecardSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true,
    index: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  interviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  rubricId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EvaluationRubric',
    default: null,
  },
  ratings: [
    {
      criteriaName: { type: String, required: true },
      score: { type: Number, required: true, min: 1, max: 5 },
      weight: { type: Number, default: 1.0 },
      notes: { type: String, default: '' },
    },
  ],
  overallRecommendation: {
    type: String,
    enum: ['Strong Hire', 'Hire', 'Weak Hire', 'No Hire', 'Strong No Hire'],
    required: true,
  },
  calculatedScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  candidateSummary: {
    type: String,
    default: '',
  },
  privateNotes: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

interviewScorecardSchema.index({ interviewId: 1, interviewerId: 1 }, { unique: true });
interviewScorecardSchema.index({ candidateId: 1, jobId: 1 });

module.exports = mongoose.model('InterviewScorecard', interviewScorecardSchema);
