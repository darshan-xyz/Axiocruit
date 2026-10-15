import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout, DashboardLayout } from '@/core/Layouts';
import { AdminLayout } from '@/core/AdminLayout';
import { ThemeProvider } from '@/core/ThemeContext';
import { ErrorBoundary, AuthProvider } from '@/core';

// Loading fallback
const RouteLoadingSpinner: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Loading...</span>
  </div>
);

// Lazy-loaded route components
const HomePage = lazy(() => import('@/features/public').then(m => ({ default: m.HomePage })));
const AuthPage = lazy(() => import('@/features/auth').then(m => ({ default: m.AuthPage })));

// Admin pages
const AdminOverview = lazy(() => import('../../pages/Admin').then(m => ({ default: m.AdminOverview })));
const AdminUsers = lazy(() => import('../../pages/Admin').then(m => ({ default: m.AdminUsers })));
const AdminJobs = lazy(() => import('../../pages/Admin').then(m => ({ default: m.AdminJobs })));
const AdminApprovals = lazy(() => import('../../pages/Admin').then(m => ({ default: m.AdminApprovals })));

// Org pages
const OrgAdminDashboard = lazy(() => import('../../pages/OrgAdmin').then(m => ({ default: m.OrgAdminDashboard })));
const OrgSettings = lazy(() => import('../../pages/OrgAdmin').then(m => ({ default: m.OrgSettings })));
const OrgTeam = lazy(() => import('../../pages/OrgTeam').then(m => ({ default: m.OrgTeam })));
const OrgJobsList = lazy(() => import('../../pages/OrgJobsList').then(m => ({ default: m.OrgJobsList })));

// Recruiter feature components
const RecruiterDashboard = lazy(() => import('@/features/recruiter').then(m => ({ default: m.RecruiterDashboard })));
const MyJobs = lazy(() => import('@/features/recruiter').then(m => ({ default: m.MyJobs })));
const Applicants = lazy(() => import('@/features/recruiter').then(m => ({ default: m.Applicants })));
const RecruiterProfile = lazy(() => import('@/features/recruiter').then(m => ({ default: m.RecruiterProfile })));
const ServiceMarketplace = lazy(() => import('@/features/recruiter').then(m => ({ default: m.ServiceMarketplace })));
const RecruiterInterviews = lazy(() => import('@/features/recruiter').then(m => ({ default: m.RecruiterInterviews })));
const CompletedDelegations = lazy(() => import('@/features/recruiter').then(m => ({ default: m.CompletedDelegations })));
const NewHirings = lazy(() => import('@/features/recruiter').then(m => ({ default: m.NewHirings })));
const PastJobs = lazy(() => import('@/features/recruiter').then(m => ({ default: m.PastJobs })));

// Candidate feature components
const CandidateDashboard = lazy(() => import('@/features/candidates').then(m => ({ default: m.CandidateDashboard })));
const CandidateJobs = lazy(() => import('@/features/candidates').then(m => ({ default: m.CandidateJobs })));
const CandidateProfile = lazy(() => import('@/features/candidates').then(m => ({ default: m.CandidateProfile })));
const CandidateApplications = lazy(() => import('@/features/candidates').then(m => ({ default: m.CandidateApplications })));
const CandidateInterviews = lazy(() => import('@/features/candidates').then(m => ({ default: m.CandidateInterviews })));
const RankedCandidates = lazy(() => import('@/features/candidates').then(m => ({ default: m.RankedCandidates })));

// Interviewer feature components
const InterviewerDashboard = lazy(() => import('@/features/interviewer').then(m => ({ default: m.InterviewerDashboard })));
const InterviewerProfile = lazy(() => import('@/features/interviewer').then(m => ({ default: m.InterviewerProfile })));
const InterviewerInterviews = lazy(() => import('@/features/interviewer').then(m => ({ default: m.InterviewerInterviews })));
const InterviewerRequests = lazy(() => import('@/features/interviewer').then(m => ({ default: m.InterviewerRequests })));
const FreelancerServiceManager = lazy(() => import('@/features/interviewer').then(m => ({ default: m.FreelancerServiceManager })));
const DelegatedProjects = lazy(() => import('@/features/interviewer').then(m => ({ default: m.DelegatedProjects })));
const InterviewerApplicants = lazy(() => import('@/features/interviewer').then(m => ({ default: m.InterviewerApplicants })));

// Standalone session pages
const InterviewRoom = lazy(() => import('@/features/interview-room').then(m => ({ default: m.InterviewRoom })));
const CodingTestPage = lazy(() => import('../../pages/CodingTestPage'));
const AdaptiveResultReview = lazy(() => import('../../pages/AdaptiveResultReview'));
const CodingAssessment = lazy(() => import('../../pages/CodingAssessment'));
const FreelancerGigBoard = lazy(() => import('@/components/FreelancerGigBoard'));
const SubmitFeedback = lazy(() => import('../../pages/SubmitFeedback'));
const MessagesTab = lazy(() => import('@/components/MessagesTab'));

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200">
            <Router>
              <Suspense fallback={<RouteLoadingSpinner />}>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                  </Route>

                  <Route path="/login" element={<AuthPage type="login" />} />
                  <Route path="/signup" element={<AuthPage type="signup" />} />

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AdminOverview />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="jobs" element={<AdminJobs />} />
                    <Route path="approvals" element={<AdminApprovals />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>

                  {/* Org Admin Routes */}
                  <Route path="/org" element={<Navigate to="/organization/dashboard" replace />} />
                  <Route path="/org/*" element={<Navigate to="/organization/dashboard" replace />} />
                  <Route path="/organization" element={<DashboardLayout role="ORGANIZATION" />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<OrgAdminDashboard />} />
                    <Route path="jobs" element={<OrgJobsList />} />
                    <Route path="team" element={<OrgTeam />} />
                    <Route path="settings" element={<OrgSettings />} />
                    <Route path="*" element={<Navigate to="/organization/dashboard" replace />} />
                  </Route>

                  {/* Recruiter Routes */}
                  <Route path="/recruiter" element={<DashboardLayout role="RECRUITER" />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<RecruiterDashboard />} />
                    <Route path="jobs" element={<MyJobs />} />
                    <Route path="applicants" element={<RankedCandidates />} />
                    <Route path="candidates" element={<RankedCandidates />} />
                    <Route path="applications-list" element={<Applicants />} />
                    <Route path="hire-interviewer" element={<ServiceMarketplace />} />
                    <Route path="schedule" element={<RecruiterInterviews />} />
                    <Route path="profile" element={<RecruiterProfile />} />
                    <Route path="ranked/:jobId" element={<RankedCandidates />} />
                    <Route path="review-hires" element={<CompletedDelegations />} />
                    <Route path="new-hirings" element={<NewHirings />} />
                    <Route path="past-jobs" element={<PastJobs />} />
                    <Route path="messages" element={<MessagesTab />} />
                    <Route path="*" element={<Navigate to="/recruiter/dashboard" replace />} />
                  </Route>

                  {/* Candidate Routes */}
                  <Route path="/candidate" element={<DashboardLayout role="CANDIDATE" />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<CandidateDashboard />} />
                    <Route path="jobs" element={<CandidateJobs />} />
                    <Route path="profile" element={<CandidateProfile />} />
                    <Route path="applications" element={<CandidateApplications />} />
                    <Route path="interviews" element={<CandidateInterviews />} />
                    <Route path="messages" element={<MessagesTab />} />
                    <Route path="*" element={<Navigate to="/candidate/dashboard" replace />} />
                  </Route>

                  {/* Interviewer Routes */}
                  <Route path="/interviewer" element={<DashboardLayout role="INTERVIEWER" />}>
                    <Route index element={<InterviewerDashboard />} />
                    <Route path="dashboard" element={<Navigate to="/interviewer" replace />} />
                    <Route path="gigs" element={<FreelancerGigBoard />} />
                    <Route path="services" element={<FreelancerServiceManager />} />
                    <Route path="projects" element={<DelegatedProjects />} />
                    <Route path="pipeline" element={<InterviewerApplicants />} />
                    <Route path="ranked/:jobId" element={<RankedCandidates />} />
                    <Route path="schedule" element={<InterviewerInterviews />} />
                    <Route path="requests" element={<InterviewerRequests />} />
                    <Route path="profile" element={<InterviewerProfile />} />
                    <Route path="feedback/:id" element={<SubmitFeedback />} />
                    <Route path="messages" element={<MessagesTab />} />
                    <Route path="*" element={<Navigate to="/interviewer" replace />} />
                  </Route>

                  {/* Interview Room (Standalone — full-screen) */}
                  <Route path="/interview/room/:id" element={<InterviewRoom />} />

                  {/* Coding Test Room (Standalone — full-screen) */}
                  <Route path="/coding-test/:jobId" element={<CodingTestPage />} />

                  {/* Live Interview Coding Assessment (Standalone — full-screen IDE) */}
                  <Route path="/interview/code/:sessionId" element={<CodingAssessment />} />

                  {/* Adaptive Test Result Review (Standalone) */}
                  <Route path="/recruiter/coding-test-result/:jobId/candidate/:candidateId" element={
                    <div className="bg-[#0a001a] min-h-screen w-full text-white p-6">
                      <AdaptiveResultReview />
                    </div>
                  } />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </Router>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
