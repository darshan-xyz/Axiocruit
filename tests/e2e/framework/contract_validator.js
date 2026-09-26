/**
 * Axiocruit E2E Test Suite - Interface & Microservices Contract Validator
 * Validates TypeScript interfaces, REST endpoints, WebRTC events, and Microservices contracts
 */

import fs from 'fs';
import path from 'path';

export const EXPECTED_REST_ENDPOINTS = [
  // Health & Readiness (2)
  { method: 'GET', path: '/api/health', auth: false, module: 'healthRoutes' },
  { method: 'GET', path: '/api/ready', auth: false, module: 'healthRoutes' },

  // Auth Routes (7)
  { method: 'POST', path: '/api/auth/register-org', auth: false, module: 'authRoutes' },
  { method: 'POST', path: '/api/auth/register-freelancer', auth: false, module: 'authRoutes' },
  { method: 'POST', path: '/api/auth/register-candidate', auth: false, module: 'authRoutes' },
  { method: 'POST', path: '/api/auth/login', auth: false, module: 'authRoutes' },
  { method: 'POST', path: '/api/auth/register-recruiter', auth: true, module: 'authRoutes' },
  { method: 'GET', path: '/api/auth/recruiters', auth: true, module: 'authRoutes' },
  { method: 'POST', path: '/api/auth/change-password', auth: true, module: 'authRoutes' },

  // User Routes (8)
  { method: 'GET', path: '/api/users/profile', auth: true, module: 'userRoutes' },
  { method: 'PUT', path: '/api/users/profile', auth: true, module: 'userRoutes' },
  { method: 'POST', path: '/api/users/profile-picture', auth: true, module: 'userRoutes' },
  { method: 'GET', path: '/api/users/interviewers', auth: false, module: 'userRoutes' },
  { method: 'GET', path: '/api/users/candidates', auth: false, module: 'userRoutes' },
  { method: 'GET', path: '/api/users/by-id/:id', auth: false, module: 'userRoutes' },
  { method: 'GET', path: '/api/users/:email', auth: false, module: 'userRoutes' },
  { method: 'POST', path: '/api/users/resume', auth: true, module: 'userRoutes' },

  // Job Routes (12)
  { method: 'GET', path: '/api/jobs/', auth: false, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/my-jobs', auth: true, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/applications/received', auth: true, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/delegations/reviewing', auth: true, module: 'jobRoutes' },
  { method: 'PUT', path: '/api/jobs/delegations/:jobId/approve', auth: true, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/hirings/new', auth: true, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/past-jobs', auth: true, module: 'jobRoutes' },
  { method: 'GET', path: '/api/jobs/:id', auth: false, module: 'jobRoutes' },
  { method: 'POST', path: '/api/jobs/', auth: true, module: 'jobRoutes' },
  { method: 'POST', path: '/api/jobs/:id/apply', auth: true, module: 'jobRoutes' },
  { method: 'POST', path: '/api/jobs/:jobId/delegate', auth: true, module: 'jobRoutes' },
  { method: 'PUT', path: '/api/jobs/applications/:id/status', auth: true, module: 'jobRoutes' },

  // Application Routes (4)
  { method: 'POST', path: '/api/applications/:applicationId/retry-ai', auth: true, module: 'applicationRoutes' },
  { method: 'POST', path: '/api/applications/:jobId', auth: true, module: 'applicationRoutes' },
  { method: 'GET', path: '/api/applications/my-applications', auth: true, module: 'applicationRoutes' },
  { method: 'GET', path: '/api/applications/:jobId/candidates', auth: true, module: 'applicationRoutes' },

  // Interview Routes (15)
  { method: 'POST', path: '/api/interviews/schedule', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/my-interviews', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/eligible-candidates', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/:id', auth: true, module: 'interviewRoutes' },
  { method: 'PATCH', path: '/api/interviews/:id/status', auth: true, module: 'interviewRoutes' },
  { method: 'DELETE', path: '/api/interviews/:id', auth: true, module: 'interviewRoutes' },
  { method: 'POST', path: '/api/interviews/:id/feedback', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/:id/proctor-log', auth: true, module: 'interviewRoutes' },
  { method: 'POST', path: '/api/interviews/:id/proctor-log', auth: true, module: 'interviewRoutes' },
  { method: 'POST', path: '/api/interviews/:id/complete', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/my-messages', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/conversations', auth: true, module: 'interviewRoutes' },
  { method: 'GET', path: '/api/interviews/messages/:userId', auth: true, module: 'interviewRoutes' },
  { method: 'PUT', path: '/api/interviews/messages/read/:userId', auth: true, module: 'interviewRoutes' },
  { method: 'POST', path: '/api/interviews/message', auth: true, module: 'interviewRoutes' },

  // Coding Assessment Routes (7)
  { method: 'POST', path: '/api/coding-test/start', auth: true, module: 'codingTestRoutes' },
  { method: 'GET', path: '/api/coding-test/next-question', auth: true, module: 'codingTestRoutes' },
  { method: 'GET', path: '/api/coding-test/:sessionId/next', auth: true, module: 'codingTestRoutes' },
  { method: 'POST', path: '/api/coding-test/:sessionId/submit', auth: true, module: 'codingTestRoutes' },
  { method: 'POST', path: '/api/coding-test/:sessionId/end', auth: true, module: 'codingTestRoutes' },
  { method: 'GET', path: '/api/coding-test/:sessionId/result', auth: true, module: 'codingTestRoutes' },
  { method: 'GET', path: '/api/coding-test/job/:jobId/candidate/:candidateId', auth: true, module: 'codingTestRoutes' },

  // Freelancer & Gig Routes (15)
  { method: 'GET', path: '/api/freelancers/services', auth: false, module: 'freelancerRoutes' },
  { method: 'POST', path: '/api/freelancers/services', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/services/:serviceId', auth: true, module: 'freelancerRoutes' },
  { method: 'DELETE', path: '/api/freelancers/services/:serviceId', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/requests/:id/accept', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/requests/:id/reject', auth: true, module: 'freelancerRoutes' },
  { method: 'GET', path: '/api/freelancers/delegations', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/delegations/:jobId/accept', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/delegations/:jobId/reject', auth: true, module: 'freelancerRoutes' },
  { method: 'POST', path: '/api/freelancers/delegations/:jobId/propose/:candidateId', auth: true, module: 'freelancerRoutes' },
  { method: 'GET', path: '/api/freelancers/gigs/open', auth: true, module: 'freelancerRoutes' },
  { method: 'POST', path: '/api/freelancers/gigs/accept/:gigId', auth: true, module: 'freelancerRoutes' },
  { method: 'PUT', path: '/api/freelancers/profile', auth: true, module: 'freelancerRoutes' },
  { method: 'GET', path: '/api/freelancers/availability', auth: true, module: 'freelancerRoutes' },
  { method: 'POST', path: '/api/freelancers/availability', auth: true, module: 'freelancerRoutes' },

  // Recruiter Marketplace (3)
  { method: 'GET', path: '/api/recruiter/services', auth: true, module: 'recruiterServiceRoutes' },
  { method: 'GET', path: '/api/recruiter/freelancers/:id', auth: true, module: 'recruiterServiceRoutes' },
  { method: 'POST', path: '/api/recruiter/services/:serviceId/book', auth: true, module: 'recruiterServiceRoutes' },

  // Admin Routes (7)
  { method: 'GET', path: '/api/admin/stats', auth: true, module: 'adminRoutes' },
  { method: 'GET', path: '/api/admin/users', auth: true, module: 'adminRoutes' },
  { method: 'DELETE', path: '/api/admin/users/:id', auth: true, module: 'adminRoutes' },
  { method: 'GET', path: '/api/admin/jobs', auth: true, module: 'adminRoutes' },
  { method: 'DELETE', path: '/api/admin/jobs/:id', auth: true, module: 'adminRoutes' },
  { method: 'GET', path: '/api/admin/freelancers/pending', auth: true, module: 'adminRoutes' },
  { method: 'PATCH', path: '/api/admin/freelancers/:id/approve', auth: true, module: 'adminRoutes' },

  // Organization Routes (4)
  { method: 'GET', path: '/api/organization/jobs', auth: true, module: 'organizationRoutes' },
  { method: 'GET', path: '/api/organization/recruiters', auth: true, module: 'organizationRoutes' },
  { method: 'POST', path: '/api/organization/recruiters/invite', auth: true, module: 'organizationRoutes' },
  { method: 'DELETE', path: '/api/organization/recruiters/:id', auth: true, module: 'organizationRoutes' },

  // Payment / Stripe Routes (2)
  { method: 'POST', path: '/api/payments/webhook', auth: false, module: 'stripeRoutes' },
  { method: 'POST', path: '/api/payments/create-checkout-session', auth: true, module: 'stripeRoutes' },
];

export const EXPECTED_WEBRTC_EVENTS = [
  'join-room',
  'waiting-for-host',
  'admitted',
  'admission-denied',
  'admission-request',
  'admission-canceled',
  'admit-user',
  'deny-user',
  'room-users',
  'user-connected',
  'offer',
  'answer',
  'ice-candidate',
  'user-disconnected',
  'code-change',
  'language-change',
  'proctor-event',
  'kick-user'
];

export class ContractValidator {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
  }

  validateBackendRoutesMounted() {
    const serverIndexPath = path.join(this.rootPath, 'server', 'index.js');
    if (!fs.existsSync(serverIndexPath)) {
      throw new Error(`Server entry file not found: ${serverIndexPath}`);
    }
    const content = fs.readFileSync(serverIndexPath, 'utf-8');
    const mountedModules = [];

    const expectedMounts = [
      { prefix: '/api', file: 'healthRoutes' },
      { prefix: '/api/auth', file: 'authRoutes' },
      { prefix: '/api/users', file: 'userRoutes' },
      { prefix: '/api/jobs', file: 'jobRoutes' },
      { prefix: '/api/applications', file: 'applicationRoutes' },
      { prefix: '/api/interviews', file: 'interviewRoutes' },
      { prefix: '/api/coding-test', file: 'codingTestRoutes' },
      { prefix: '/api/freelancers', file: 'freelancerRoutes' },
      { prefix: '/api/recruiter', file: 'recruiterServiceRoutes' },
      { prefix: '/api/admin', file: 'adminRoutes' },
      { prefix: '/api/organization', file: 'organizationRoutes' },
      { prefix: '/api/payments', file: 'stripeRoutes' },
    ];

    for (const mount of expectedMounts) {
      const hasMount = content.includes(mount.prefix);
      mountedModules.push({
        prefix: mount.prefix,
        module: mount.file,
        mounted: hasMount
      });
    }

    return mountedModules;
  }

  validateWebRTCEventHandlers() {
    const serverIndexPath = path.join(this.rootPath, 'server', 'index.js');
    if (!fs.existsSync(serverIndexPath)) {
      throw new Error(`Server entry file not found: ${serverIndexPath}`);
    }
    const content = fs.readFileSync(serverIndexPath, 'utf-8');
    const events = [];

    for (const evt of EXPECTED_WEBRTC_EVENTS) {
      const hasEvent = content.includes(`'${evt}'`) || content.includes(`"${evt}"`);
      events.push({
        event: evt,
        handled: hasEvent
      });
    }

    return events;
  }

  validateProctoringMicroserviceProtocol() {
    const proctorMainPath = path.join(this.rootPath, 'proctoring-service', 'main.py');
    if (!fs.existsSync(proctorMainPath)) {
      return { status: 'missing', file: proctorMainPath };
    }
    const content = fs.readFileSync(proctorMainPath, 'utf-8');
    return {
      status: 'present',
      hasHealthEndpoint: content.includes('/health'),
      hasWebSocketEndpoint: content.includes('/ws/proctor'),
      hasGazeDetection: content.includes('gaze') || content.includes('FaceLandmarker'),
      hasLandmarkerTask: fs.existsSync(path.join(this.rootPath, 'proctoring-service', 'face_landmarker.task'))
    };
  }

  validateAIMicroserviceProtocol() {
    const aiMainPath = path.join(this.rootPath, 'ai-service', 'main.py');
    if (!fs.existsSync(aiMainPath)) {
      return { status: 'missing', file: aiMainPath };
    }
    const content = fs.readFileSync(aiMainPath, 'utf-8');
    return {
      status: 'present',
      hasHealthEndpoint: content.includes('/health'),
      hasParseCVEndpoint: content.includes('/api/ai/parse-cv'),
      hasSentenceTransformer: content.includes('SentenceTransformer') || content.includes('all-MiniLM-L6-v2'),
      hasEvaluateInterview: content.includes('/api/ai/evaluate-interview')
    };
  }
}

export const defaultContractValidator = new ContractValidator();
