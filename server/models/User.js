const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Common Fields
  name: { type: String, required: true }, // Full name
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ADMIN', 'ORGANIZATION', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'],
    default: 'CANDIDATE',
    set: (v) => {
      if (!v) return 'CANDIDATE';
      const upper = String(v).trim().toUpperCase();
      if (upper === 'ORGANIZATION') return 'ORGANIZATION';
      if (upper === 'FREELANCER' || upper === 'INTERVIEWER') return 'INTERVIEWER';
      if (upper === 'RECRUITER') return 'RECRUITER';
      if (upper === 'ADMIN') return 'ADMIN';
      return 'CANDIDATE';
    },
  },

  // Freelancer / Interviewer specifics embedded directly
  skills: [String],
  hourlyRate: { type: Number },
  bio: { type: String },
  averageRating: { type: Number, default: 0 },
  experience: [
    {
      designation: { type: String, required: true },
      company: { type: String, required: true },
      from: { type: String, required: true },
      to: { type: String }, // empty indicates "Present"
      work: { type: String },
    },
  ],
  projects: [
    {
      title: { type: String, required: true },
      role: { type: String },
      link: { type: String },
      description: { type: String },
    },
  ],

  // Organization Link (For Org Admin & Recruiters)
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  // Profile Link
  profile: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },

  // Freelancer Approval Status
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: function () {
      const r = (this.role || '').toUpperCase();
      return (r === 'INTERVIEWER' || r === 'FREELANCER') ? 'PENDING' : 'APPROVED';
    },
  },

  profilePicture: { type: String, default: null },
  resumeUrl: { type: String }, // Store resume URL directly on User model
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('validate', function (next) {
  if (this.role) {
    const upper = String(this.role).trim().toUpperCase();
    if (upper === 'FREELANCER' || upper === 'INTERVIEWER') {
      this.role = 'INTERVIEWER';
    } else if (upper === 'ORGANIZATION') {
      this.role = 'ORGANIZATION';
    } else if (['ADMIN', 'RECRUITER', 'CANDIDATE'].includes(upper)) {
      this.role = upper;
    } else {
      this.role = 'CANDIDATE';
    }
  }
  if (typeof next === 'function') {
    next();
  }
});

module.exports = mongoose.model('User', userSchema);
