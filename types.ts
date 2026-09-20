
export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER' | 'organization' | 'freelancer';

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
  delegationStatus?: 'none' | 'pending' | 'accepted' | 'completed';
  assignedAt?: string;
  completedAt?: string;
  paymentStatus?: 'unpaid' | 'paid';
  status?: 'Active' | 'Closed' | string;
  applicantCount?: number;
  applicants?: any;
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
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected' | 'Pending AI';
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
  proctorLog?: Array<{
    type: 'tab_switch' | 'copy' | 'paste' | 'gaze' | 'face_lost';
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
