/**
 * Procruit Feature Modules Aggregation Barrel
 * Exposes feature domain namespaces and discrete subcomponents.
 */

// Feature Domain Namespaces
import * as admin from './admin';
import * as assessments from './assessments';
import * as auth from './auth';
import * as candidates from './candidates';
import * as feedback from './feedback';
import * as interviewRoom from './interview-room';
import * as interviewer from './interviewer';
import * as organization from './organization';
import * as publicFeatures from './public';
import * as recruiter from './recruiter';

export {
  admin,
  assessments,
  auth,
  candidates,
  feedback,
  interviewRoom,
  interviewer,
  organization,
  publicFeatures,
  recruiter,
};

// Re-export named exports from each feature domain
export * from './admin';
export * from './assessments';
export * from './auth';
export * from './candidates';
export * from './feedback';
export * from './interview-room';
export * from './interviewer';
export * from './organization';
export * from './public';
export * from './recruiter';
