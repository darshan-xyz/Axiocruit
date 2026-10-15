const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resume: { type: String }, // Snapshot of resume at time of application
    resumeUrl: { type: String }, // Permanent URL to the uploaded CV file

    // Snapshots of Profile State
    experience: [],
    education: [],
    skills: [],

    // AI CV Analysis Results
    aiScore: { type: Number, default: null }, // null = not yet scored
    matchedKeywords: [String],
    missingKeywords: [String],

    status: {
        type: String,
        enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Rejected', 'Pending AI', 'Proposed', 'Hired'],
        default: 'Applied'
    },
    appliedAt: { type: Date, default: Date.now }
});

// Prevent duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ candidate: 1, appliedAt: -1 });
applicationSchema.index({ candidate: 1 });

module.exports = mongoose.model('Application', applicationSchema);
