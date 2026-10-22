
export type CanonicalRole = 'ADMIN' | 'ORGANIZATION' | 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER';
export type UserRole = CanonicalRole | 'organization' | 'freelancer' | 'recruiter' | 'candidate' | 'interviewer' | 'admin' | 'ORG_ADMIN';

export const normalizeRole = (role?: string | null): CanonicalRole => {
  if (!role) return 'CANDIDATE';
  const upper = String(role).trim().toUpperCase();
  if (upper === 'ADMIN') return 'ADMIN';
  if (upper === 'ORGANIZATION' || upper === 'ORG_ADMIN') return 'ORGANIZATION';
  if (upper === 'RECRUITER') return 'RECRUITER';
  if (upper === 'INTERVIEWER' || upper === 'FREELANCER') return 'INTERVIEWER';
  return 'CANDIDATE';
};

export const isHostRole = (role?: string | null): boolean => {
  const norm = normalizeRole(role);
  return norm === 'ADMIN' || norm === 'ORGANIZATION' || norm === 'RECRUITER' || norm === 'INTERVIEWER';
};

export const getRoleHome = (role?: string | null): string => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'ADMIN': return '/admin/dashboard';
    case 'ORGANIZATION': return '/organization/dashboard';
    case 'RECRUITER': return '/recruiter/dashboard';
    case 'INTERVIEWER': return '/interviewer';
    case 'CANDIDATE':
    default:
      return '/candidate/dashboard';
  }
};

export interface Experience {
  company: string;
  designation: string;
  from: string;
  to: string;
  work: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  from: string;
  to: string;
}

export interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  profilePicture?: string;

  // Candidate Fields
  headline?: string;
  bio?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  resume?: string;
  resumeUrl?: string;

  // Recruiter Fields
  companyName?: string;
  website?: string;
  companyDescription?: string;

  // Interviewer Fields
  hourlyRate?: string;
  yearsOfExperience?: string;
  availability?: string;

  // Freelancer Approval Status & Organization Link
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  organization?: string;
  mfa?: { enabled: boolean };

  profile?: any;
  createdAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Remote';
  salary?: string;
  skills?: string[];
  postedBy?: string | User;
  createdAt?: string;
  // Delegated Interviewer / Freelancer
  delegatedFreelancerId?: string | User;
  freelancerFee?: number;
  delegationStatus?: 'none' | 'pending' | 'accepted' | 'reviewing' | 'completed';
  assignedAt?: string;
  completedAt?: string;
  paymentStatus?: 'unpaid' | 'paid';
  status?: 'Active' | 'Closed' | string;
  applicantCount?: number;
  applicants?: any;
  proposedCandidateId?: string | User;
  freelancerFinalReport?: string;
  aiEvaluationSummary?: string;
}

export interface Application {
  _id: string;
  job: any;
  candidate: any;
  resume?: string;
  resumeUrl?: string;
  aiScore?: number | null;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Pending AI' | 'Proposed' | 'Hired';
  appliedAt: string;
}

export interface Interview {
  _id: string;
  candidateId: any;
  recruiterId: any;
  interviewerId?: any;
  jobId?: any;
  scheduledTime: string;
  meetingId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Paid';
  notes?: string;
  aiGenerating?: boolean;
  proctorLog?: Array<{
    type: 'tab_switch' | 'copy' | 'paste' | 'gaze' | 'face_lost' | 'multiple_faces' | 'screenshot';
    detail: string;
    timestamp: string;
  }>;
  feedback?: {
    technicalScore: number;
    communicationScore: number;
    detailedFeedback: string;
    recommendation: 'Strong Hire' | 'Hire' | 'No Hire';
  };
  // AI Post-Interview Evaluation
  codingTestSessionId?: string;
  codingTestConducted?: boolean;
  interviewerRemarks?: string;
  aiEvaluation?: {
    suitabilityScore: number;
    strengths: string[];
    weaknesses: string[];
    redFlags: string[];
    codingScore: number;
    evaluatedAt: string;
  };
  // Legacy compat
  date?: string;
  time?: string;
  meetingLink?: string;
  createdAt?: string;
}

export interface Message {
  _id: string;
  senderId: string | User;
  receiverId: string | User;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
}

export interface CodingQuestion {
  _id: string;
  title: string;
  description: string;
  starterCode?: string;
  starterTemplates?: {
    python?: string;
    javascript?: string;
    typescript?: string;
    java?: string;
    cpp?: string;
  };
  functionName?: string;
  difficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  category: 'basics' | 'oop' | 'dsa';
  visibleTestCases: CodingTestCase[];
  hiddenTestCases?: CodingTestCase[];
  createdAt?: string;
}

export interface TestResponse {
  questionId: string | CodingQuestion;
  submittedCode: string;
  language?: string;
  passed: boolean;
  score: number;
  aiAnalysis?: {
    logicScore: number;
    accuracyFeedback: string;
    efficiencyFeedback: string;
    model?: string;
  };
}

export interface TestSession {
  _id: string;
  candidateId: string | User;
  jobId?: string | Job;
  questionsAsked: (string | CodingQuestion)[];
  responses: TestResponse[];
  currentDifficulty: 'very_easy' | 'easy' | 'medium' | 'hard';
  currentCategory: 'basics' | 'oop' | 'dsa' | null;
  status: 'in_progress' | 'completed';
  finalScore: number;
  startedAt: string;
  completedAt?: string;
}

