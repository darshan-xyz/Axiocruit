/**
 * Axiocruit Challenger 7.2 Adversarial Route, Authorization, and Invariants Suite
 * Empirical verification of:
 * 1. Live HTTP authentication (401 on missing/invalid token, 200 on valid credentials, 400/401 on bad credentials)
 * 2. Live HTTP role authorization boundaries (403 on role privilege violations)
 * 3. Route ordering and parameter safety (no route shadowing, no 500 on invalid IDs)
 * 4. Organization Admin oversight and multi-tenant isolation
 * 5. Role workflow invariants (Candidate apply, Recruiter schedule, Host completion)
 * 6. Transaction invariants and cascade deletion completeness
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5001/api';

async function request(path, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('========================================================================');
  console.log(' CHALLENGER 7.2: ADVANCED ADVERSARIAL INVARIANTS & RBAC HARNESS');
  console.log('========================================================================\n');

  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  const defects = [];

  function assert(condition, testName, details = '', severity = 'HIGH') {
    totalChecks++;
    if (condition) {
      passed++;
      console.log(`  ✔ PASS: ${testName}`);
    } else {
      failed++;
      console.error(`  ✖ FAIL [${severity}]: ${testName}`);
      if (details) console.error(`         Details: ${details}`);
      defects.push({ testName, details, severity });
    }
  }

  // --- SECTION 1: AUTHENTICATION MATRIX (401 ENFORCEMENT) ---
  console.log('--- Section 1: Authentication & Credential Boundaries (401 Checks) ---');

  const unauthenticatedEndpoints = [
    { path: '/users/profile', method: 'GET', desc: 'Anonymous GET /users/profile' },
    { path: '/jobs/my-jobs', method: 'GET', desc: 'Anonymous GET /jobs/my-jobs' },
    { path: '/jobs/applications/received', method: 'GET', desc: 'Anonymous GET /jobs/applications/received' },
    { path: '/organization/recruiters', method: 'GET', desc: 'Anonymous GET /organization/recruiters' },
    { path: '/organization/jobs', method: 'GET', desc: 'Anonymous GET /organization/jobs' },
    { path: '/admin/stats', method: 'GET', desc: 'Anonymous GET /admin/stats' },
    { path: '/admin/users', method: 'GET', desc: 'Anonymous GET /admin/users' },
    { path: '/interviews/my-interviews', method: 'GET', desc: 'Anonymous GET /interviews/my-interviews' },
    { path: '/interviews/eligible-candidates', method: 'GET', desc: 'Anonymous GET /interviews/eligible-candidates' },
    { path: '/applications/my-applications', method: 'GET', desc: 'Anonymous GET /applications/my-applications' },
    { path: '/freelancers/services', method: 'GET', desc: 'Anonymous GET /freelancers/services' },
    { path: '/freelancers/gigs/open', method: 'GET', desc: 'Anonymous GET /freelancers/gigs/open' },
    { path: '/messages/my-messages', method: 'GET', desc: 'Anonymous GET /messages/my-messages' },
    { path: '/messages/conversations', method: 'GET', desc: 'Anonymous GET /messages/conversations' },
  ];

  for (const ep of unauthenticatedEndpoints) {
    const res = await request(ep.path, ep.method);
    assert(res.status === 401, `${ep.desc} returns 401 Unauthorized`, `Status: ${res.status}`);
  }

  // Malformed & Invalid Tokens
  const invalidTokenRes = await request('/users/profile', 'GET', null, 'this.is.an.invalid.jwt.token');
  assert(invalidTokenRes.status === 401, 'Malformed JWT token returns 401', `Status: ${invalidTokenRes.status}`);

  const emptyBearerRes = await fetch(`${BASE_URL}/users/profile`, {
    headers: { 'Authorization': 'Bearer ' }
  });
  assert(emptyBearerRes.status === 401, 'Empty Bearer token returns 401', `Status: ${emptyBearerRes.status}`);

  const badPrefixRes = await fetch(`${BASE_URL}/users/profile`, {
    headers: { 'Authorization': 'Token 12345' }
  });
  assert(badPrefixRes.status === 401, 'Non-Bearer auth header returns 401', `Status: ${badPrefixRes.status}`);

  // Invalid Login Credentials (returns 400 as per authController design)
  const badLoginRes = await request('/auth/login', 'POST', {
    email: 'admin@axiocruit.com',
    password: 'WrongPassword999!',
  });
  assert(badLoginRes.status === 400 || badLoginRes.status === 401, 'Invalid password returns 400/401 credential failure', `Status: ${badLoginRes.status}`);

  const nonexistentLoginRes = await request('/auth/login', 'POST', {
    email: 'doesnotexist_99999@axiocruit.com',
    password: 'Password123!',
  });
  assert(nonexistentLoginRes.status === 400 || nonexistentLoginRes.status === 401, 'Non-existent email returns 400/401 credential failure', `Status: ${nonexistentLoginRes.status}`);


  // --- SECTION 2: CANONICAL ROLE AUTHENTICATION (200 ENFORCEMENT) ---
  console.log('\n--- Section 2: Canonical Role Authentication (200 Login Checks) ---');

  const credentials = {
    ADMIN: { email: 'admin@axiocruit.com', password: 'Password123!' },
    ORGANIZATION: { email: 'org@axiocruit.com', password: 'Password123!' },
    RECRUITER: { email: 'recruiter@axiocruit.com', password: 'Password123!' },
    INTERVIEWER: { email: 'interviewer@axiocruit.com', password: 'Password123!' },
    CANDIDATE: { email: 'candidate@axiocruit.com', password: 'Password123!' },
  };

  const tokens = {};
  const users = {};

  for (const [role, creds] of Object.entries(credentials)) {
    const res = await request('/auth/login', 'POST', creds);
    assert(res.status === 200 && res.data.token, `Role ${role} logs in with HTTP 200 and receives JWT`, `Status: ${res.status}`);
    tokens[role] = res.data.token;
    users[role] = res.data.user || res.data;
  }


  // --- SECTION 3: AUTHORIZATION BOUNDARIES & RBAC VIOLATIONS (403 ENFORCEMENT) ---
  console.log('\n--- Section 3: Role Authorization Boundaries (403 RBAC Checks) ---');

  // Candidate unauthorized access attempts
  const candAdminStats = await request('/admin/stats', 'GET', null, tokens.CANDIDATE);
  assert(candAdminStats.status === 403, 'CANDIDATE -> /api/admin/stats returns 403 Forbidden', `Status: ${candAdminStats.status}`);

  const candAdminUsers = await request('/admin/users', 'GET', null, tokens.CANDIDATE);
  assert(candAdminUsers.status === 403, 'CANDIDATE -> /api/admin/users returns 403 Forbidden', `Status: ${candAdminUsers.status}`);

  const candAdminJobs = await request('/admin/jobs', 'GET', null, tokens.CANDIDATE);
  assert(candAdminJobs.status === 403, 'CANDIDATE -> /api/admin/jobs returns 403 Forbidden', `Status: ${candAdminJobs.status}`);

  const candOrgRecruiters = await request('/organization/recruiters', 'GET', null, tokens.CANDIDATE);
  assert(candOrgRecruiters.status === 403, 'CANDIDATE -> /api/organization/recruiters returns 403 Forbidden', `Status: ${candOrgRecruiters.status}`);

  const candOrgJobs = await request('/organization/jobs', 'GET', null, tokens.CANDIDATE);
  assert(candOrgJobs.status === 403, 'CANDIDATE -> /api/organization/jobs returns 403 Forbidden', `Status: ${candOrgJobs.status}`);

  const candMyJobs = await request('/jobs/my-jobs', 'GET', null, tokens.CANDIDATE);
  assert(candMyJobs.status === 403, 'CANDIDATE -> /api/jobs/my-jobs returns 403 Forbidden', `Status: ${candMyJobs.status}`);

  const candCreateJob = await request('/jobs', 'POST', { title: 'Unauthorized Job' }, tokens.CANDIDATE);
  assert(candCreateJob.status === 403, 'CANDIDATE -> POST /api/jobs returns 403 Forbidden', `Status: ${candCreateJob.status}`);

  const candEligible = await request('/interviews/eligible-candidates', 'GET', null, tokens.CANDIDATE);
  assert(candEligible.status === 403, 'CANDIDATE -> /api/interviews/eligible-candidates returns 403 Forbidden', `Status: ${candEligible.status}`);

  // Recruiter unauthorized access attempts
  const recAdminStats = await request('/admin/stats', 'GET', null, tokens.RECRUITER);
  assert(recAdminStats.status === 403, 'RECRUITER -> /api/admin/stats returns 403 Forbidden', `Status: ${recAdminStats.status}`);

  const recAdminUsers = await request('/admin/users', 'GET', null, tokens.RECRUITER);
  assert(recAdminUsers.status === 403, 'RECRUITER -> /api/admin/users returns 403 Forbidden', `Status: ${recAdminUsers.status}`);

  const recOrgRecruiters = await request('/organization/recruiters', 'GET', null, tokens.RECRUITER);
  assert(recOrgRecruiters.status === 403, 'RECRUITER -> /api/organization/recruiters returns 403 Forbidden', `Status: ${recOrgRecruiters.status}`);

  const recOrgInvite = await request('/organization/recruiters/invite', 'POST', { name: 'X', email: 'x@x.com', password: 'Password123!' }, tokens.RECRUITER);
  assert(recOrgInvite.status === 403, 'RECRUITER -> POST /api/organization/recruiters/invite returns 403 Forbidden', `Status: ${recOrgInvite.status}`);

  // Interviewer unauthorized access attempts
  const intAdminStats = await request('/admin/stats', 'GET', null, tokens.INTERVIEWER);
  assert(intAdminStats.status === 403, 'INTERVIEWER -> /api/admin/stats returns 403 Forbidden', `Status: ${intAdminStats.status}`);

  const intOrgRecruiters = await request('/organization/recruiters', 'GET', null, tokens.INTERVIEWER);
  assert(intOrgRecruiters.status === 403, 'INTERVIEWER -> /api/organization/recruiters returns 403 Forbidden', `Status: ${intOrgRecruiters.status}`);

  const intCreateJob = await request('/jobs', 'POST', { title: 'Unauthorized Job' }, tokens.INTERVIEWER);
  assert(intCreateJob.status === 403, 'INTERVIEWER -> POST /api/jobs returns 403 Forbidden', `Status: ${intCreateJob.status}`);

  const intMyJobs = await request('/jobs/my-jobs', 'GET', null, tokens.INTERVIEWER);
  assert(intMyJobs.status === 403, 'INTERVIEWER -> /api/jobs/my-jobs returns 403 Forbidden', `Status: ${intMyJobs.status}`);

  // Organization unauthorized access attempts
  const orgAdminStats = await request('/admin/stats', 'GET', null, tokens.ORGANIZATION);
  assert(orgAdminStats.status === 403, 'ORGANIZATION -> /api/admin/stats returns 403 Forbidden', `Status: ${orgAdminStats.status}`);

  const orgAdminUsers = await request('/admin/users', 'GET', null, tokens.ORGANIZATION);
  assert(orgAdminUsers.status === 403, 'ORGANIZATION -> /api/admin/users returns 403 Forbidden', `Status: ${orgAdminUsers.status}`);

  const orgAdminJobs = await request('/admin/jobs', 'GET', null, tokens.ORGANIZATION);
  assert(orgAdminJobs.status === 403, 'ORGANIZATION -> /api/admin/jobs returns 403 Forbidden', `Status: ${orgAdminJobs.status}`);

  // Candidate apply endpoint: Recruiter, Interviewer, Org cannot apply as candidate
  const recApplyRes = await request('/jobs/507f1f77bcf86cd799439011/apply', 'POST', {}, tokens.RECRUITER);
  assert(recApplyRes.status === 403, 'RECRUITER -> POST /api/jobs/:id/apply returns 403 Forbidden', `Status: ${recApplyRes.status}`);

  const intApplyRes = await request('/jobs/507f1f77bcf86cd799439011/apply', 'POST', {}, tokens.INTERVIEWER);
  assert(intApplyRes.status === 403, 'INTERVIEWER -> POST /api/jobs/:id/apply returns 403 Forbidden', `Status: ${intApplyRes.status}`);

  const orgApplyRes = await request('/jobs/507f1f77bcf86cd799439011/apply', 'POST', {}, tokens.ORGANIZATION);
  assert(orgApplyRes.status === 403, 'ORGANIZATION -> POST /api/jobs/:id/apply returns 403 Forbidden', `Status: ${orgApplyRes.status}`);


  // --- SECTION 4: ROUTE ORDERING & PARAMETER SAFETY INVARIANTS ---
  console.log('\n--- Section 4: Route Ordering & Parameter Safety Invariants ---');

  // Verify static named paths are not shadowed by /:id
  const myJobsRes = await request('/jobs/my-jobs', 'GET', null, tokens.RECRUITER);
  assert(myJobsRes.status === 200 && Array.isArray(myJobsRes.data), 'GET /api/jobs/my-jobs routes cleanly to literal handler (not shadowed)', `Status: ${myJobsRes.status}`);

  const receivedAppsRes = await request('/jobs/applications/received', 'GET', null, tokens.RECRUITER);
  assert(receivedAppsRes.status === 200 && Array.isArray(receivedAppsRes.data), 'GET /api/jobs/applications/received routes cleanly (not shadowed)', `Status: ${receivedAppsRes.status}`);

  const reviewingDelRes = await request('/jobs/delegations/reviewing', 'GET', null, tokens.RECRUITER);
  assert(reviewingDelRes.status === 200 && Array.isArray(reviewingDelRes.data), 'GET /api/jobs/delegations/reviewing routes cleanly (not shadowed)', `Status: ${reviewingDelRes.status}`);

  const newHiringsRes = await request('/jobs/hirings/new', 'GET', null, tokens.RECRUITER);
  assert(newHiringsRes.status === 200 && Array.isArray(newHiringsRes.data), 'GET /api/jobs/hirings/new routes cleanly (not shadowed)', `Status: ${newHiringsRes.status}`);

  const pastJobsRes = await request('/jobs/past-jobs', 'GET', null, tokens.RECRUITER);
  assert(pastJobsRes.status === 200 && Array.isArray(pastJobsRes.data), 'GET /api/jobs/past-jobs routes cleanly (not shadowed)', `Status: ${pastJobsRes.status}`);

  const myInterviewsRes = await request('/interviews/my-interviews', 'GET', null, tokens.RECRUITER);
  assert(myInterviewsRes.status === 200, 'GET /api/interviews/my-interviews routes cleanly (not shadowed)', `Status: ${myInterviewsRes.status}`);

  const eligibleRes = await request('/interviews/eligible-candidates', 'GET', null, tokens.RECRUITER);
  assert(eligibleRes.status === 200 && Array.isArray(eligibleRes.data), 'GET /api/interviews/eligible-candidates routes cleanly (not shadowed)', `Status: ${eligibleRes.status}`);

  const myMessagesRes = await request('/messages/my-messages', 'GET', null, tokens.CANDIDATE);
  assert(myMessagesRes.status === 200 && Array.isArray(myMessagesRes.data), 'GET /api/messages/my-messages routes cleanly (not shadowed)', `Status: ${myMessagesRes.status}`);

  const conversationsRes = await request('/messages/conversations', 'GET', null, tokens.CANDIDATE);
  assert(conversationsRes.status === 200 && Array.isArray(conversationsRes.data), 'GET /api/messages/conversations routes cleanly (not shadowed)', `Status: ${conversationsRes.status}`);

  // Parameter Safety: Invalid parameter sink should return 404 cleanly without crashing server
  const invalidJobIdRes = await request('/jobs/non-existent-object-id-12345', 'GET');
  assert(invalidJobIdRes.status === 404, 'Invalid string param on GET /api/jobs/:id returns 404 (no 500 crash)', `Status: ${invalidJobIdRes.status}`);

  const validFormatNonExistentJobRes = await request('/jobs/507f1f77bcf86cd799439011', 'GET');
  assert(validFormatNonExistentJobRes.status === 404, 'Non-existent valid ObjectId on GET /api/jobs/:id returns 404', `Status: ${validFormatNonExistentJobRes.status}`);

  const pathTraversalJobRes = await request('/jobs/..%2F..%2Fetc%2Fpasswd', 'GET');
  assert(pathTraversalJobRes.status === 404, 'Path traversal parameter on GET /api/jobs/:id returns 404', `Status: ${pathTraversalJobRes.status}`);

  const xssParamJobRes = await request('/jobs/%3Cscript%3Ealert(1)%3C%2Fscript%3E', 'GET');
  assert(xssParamJobRes.status === 404, 'XSS script injection on GET /api/jobs/:id returns 404', `Status: ${xssParamJobRes.status}`);

  const invalidInterviewIdRes = await request('/interviews/non-existent-interview-id', 'GET', null, tokens.CANDIDATE);
  assert(invalidInterviewIdRes.status === 404, 'Invalid ID parameter on GET /api/interviews/:id returns 404 (no 500 crash)', `Status: ${invalidInterviewIdRes.status}`);

  const invalidMessageUserIdRes = await request('/messages/non-existent-user-id', 'GET', null, tokens.CANDIDATE);
  assert(invalidMessageUserIdRes.status === 404, 'Invalid userId on GET /api/messages/:userId returns 404 (no 500 crash)', `Status: ${invalidMessageUserIdRes.status}`);

  const invalidAppIdRes = await request('/applications/non-existent-app-id/status', 'PUT', { status: 'Shortlisted' }, tokens.RECRUITER);
  assert(invalidAppIdRes.status === 404 || invalidAppIdRes.status === 400, 'Invalid appId parameter returns 404/400 (no 500 crash)', `Status: ${invalidAppIdRes.status}`);


  // --- SECTION 5: ORGANIZATION ADMIN FULL OVERSIGHT ---
  console.log('\n--- Section 5: Organization Admin Full Oversight & Tenancy Scope ---');

  // Org Admin oversight of company recruiters
  const orgRecruiters = await request('/organization/recruiters', 'GET', null, tokens.ORGANIZATION);
  assert(orgRecruiters.status === 200 && Array.isArray(orgRecruiters.data), 'Org Admin can retrieve company recruiters', `Status: ${orgRecruiters.status}`);

  // Org Admin oversight of company jobs
  const orgJobs = await request('/organization/jobs', 'GET', null, tokens.ORGANIZATION);
  assert(orgJobs.status === 200 && Array.isArray(orgJobs.data), 'Org Admin can retrieve all company jobs via /api/organization/jobs', `Status: ${orgJobs.status}`);

  // Org Admin oversight of company jobs via /api/jobs/my-jobs
  const orgMyJobs = await request('/jobs/my-jobs', 'GET', null, tokens.ORGANIZATION);
  assert(orgMyJobs.status === 200 && Array.isArray(orgMyJobs.data), 'Org Admin can retrieve company jobs via /api/jobs/my-jobs', `Status: ${orgMyJobs.status}`);

  // Org Admin oversight of company applications received
  const orgReceivedApps = await request('/jobs/applications/received', 'GET', null, tokens.ORGANIZATION);
  assert(orgReceivedApps.status === 200 && Array.isArray(orgReceivedApps.data), 'Org Admin can retrieve company received applications', `Status: ${orgReceivedApps.status}`);

  // Org Admin oversight of company team interviews
  const orgInterviews = await request('/interviews/my-interviews', 'GET', null, tokens.ORGANIZATION);
  assert(orgInterviews.status === 200, 'Org Admin can retrieve team interviews via /api/interviews/my-interviews', `Status: ${orgInterviews.status}`);

  // Org Admin oversight of eligible candidates across company jobs
  const orgEligible = await request('/interviews/eligible-candidates', 'GET', null, tokens.ORGANIZATION);
  assert(orgEligible.status === 200 && Array.isArray(orgEligible.data), 'Org Admin can retrieve eligible candidates for company jobs', `Status: ${orgEligible.status}`);


  // --- SECTION 6: MULTI-TENANT ISOLATION & PRIVILEGE CHECKS ---
  console.log('\n--- Section 6: Multi-Tenant Isolation & Cross-Org Protection ---');

  // Recruiter creates a job
  const jobPayload = {
    title: 'Adversarial Verification Lead',
    description: 'Verify platform security invariants',
    requirements: 'Node.js, Express, Security Testing',
    company: 'Acme Corp',
    location: 'Remote',
    type: 'Full-time',
    skills: ['Node.js', 'Security', 'QA']
  };
  const createJobRes = await request('/jobs', 'POST', jobPayload, tokens.RECRUITER);
  assert(createJobRes.status === 201 && createJobRes.data._id, 'Recruiter creates job for interview test', `Status: ${createJobRes.status}`);
  const testJobId = createJobRes.data?._id;

  if (testJobId) {
    // Schedule an interview
    const candId = users.CANDIDATE._id || users.CANDIDATE.id;
    const futureDate = new Date(Date.now() + 172800000).toISOString();
    const schedRes = await request('/interviews/schedule', 'POST', {
      candidateId: candId,
      jobId: testJobId,
      scheduledTime: futureDate,
      notes: 'Adversarial round'
    }, tokens.RECRUITER);

    assert(schedRes.status === 201 && schedRes.data._id, 'Recruiter schedules interview room', `Status: ${schedRes.status}`);
    const testInterviewId = schedRes.data?._id;

    if (testInterviewId) {
      // Recruiter checks room
      const recRoomRes = await request(`/interviews/${testInterviewId}`, 'GET', null, tokens.RECRUITER);
      assert(recRoomRes.status === 200 && recRoomRes.data.isUserHost === true, 'Recruiter joins room as verified host', `isUserHost: ${recRoomRes.data?.isUserHost}`);

      // Candidate checks room
      const candRoomRes = await request(`/interviews/${testInterviewId}`, 'GET', null, tokens.CANDIDATE);
      assert(candRoomRes.status === 200 && candRoomRes.data.isUserHost === false, 'Candidate joins room as participant (isUserHost: false)', `isUserHost: ${candRoomRes.data?.isUserHost}`);

      // Org Admin checks room (same company)
      const orgRoomRes = await request(`/interviews/${testInterviewId}`, 'GET', null, tokens.ORGANIZATION);
      assert(orgRoomRes.status === 200 && orgRoomRes.data.isUserHost === true, 'Organization Admin joins room as verified host (full oversight)', `isUserHost: ${orgRoomRes.data?.isUserHost}`);

      // Interviewer (not assigned to this interview) tries to access room -> should be 403 Forbidden!
      const unassignedIntRoomRes = await request(`/interviews/${testInterviewId}`, 'GET', null, tokens.INTERVIEWER);
      assert(unassignedIntRoomRes.status === 403, 'Unassigned third-party Interviewer gets 403 Forbidden to private room', `Status: ${unassignedIntRoomRes.status}`);

      // Clean up test interview
      await request(`/interviews/${testInterviewId}`, 'DELETE', null, tokens.RECRUITER);
    }
  }

  // --- SECTION 7: STATIC CODE ANALYSIS OF TRANSACTION INVARIANTS & CASCADE DELETIONS ---
  console.log('\n--- Section 7: Transaction Invariants & Cascade Deletion Static Analysis ---');

  const adminCtrlSrc = fs.readFileSync(path.resolve('server/controllers/adminController.js'), 'utf8');
  const orgCtrlSrc = fs.readFileSync(path.resolve('server/controllers/organizationController.js'), 'utf8');
  const freelancerCtrlSrc = fs.readFileSync(path.resolve('server/controllers/freelancerController.js'), 'utf8');

  // Freelancer transactions
  assert(freelancerCtrlSrc.includes('mongoose.startSession()') || freelancerCtrlSrc.includes('startSession()'),
    'freelancerController uses startSession() for multi-document mutations');
  assert(freelancerCtrlSrc.includes('abortTransaction()'),
    'freelancerController handles transaction rollback via abortTransaction()');
  assert(freelancerCtrlSrc.includes('commitTransaction()'),
    'freelancerController explicitly commits transactions via commitTransaction()');

  // Admin cascade deletions
  assert(adminCtrlSrc.includes('Job.deleteMany'), 'adminController.deleteUser cascades to Job deletions');
  assert(adminCtrlSrc.includes('Application.deleteMany'), 'adminController.deleteUser cascades to Application deletions');
  assert(adminCtrlSrc.includes('Interview.deleteMany'), 'adminController.deleteUser cascades to Interview deletions');
  assert(adminCtrlSrc.includes('FreelancerService.deleteMany'), 'adminController.deleteUser cascades to FreelancerService deletions');
  assert(adminCtrlSrc.includes('Availability.deleteMany'), 'adminController.deleteUser cascades to Availability deletions');
  assert(adminCtrlSrc.includes('InterviewGig.deleteMany'), 'adminController.deleteUser cascades to InterviewGig deletions');
  assert(adminCtrlSrc.includes('TestSession.deleteMany'), 'adminController.deleteUser cascades to TestSession deletions');
  assert(adminCtrlSrc.includes('Message.deleteMany'), 'adminController.deleteUser cascades to Message deletions');

  // Organization cascade deletions on recruiter removal
  assert(orgCtrlSrc.includes('Application.deleteMany'), 'organizationController.removeRecruiter cascades to Application deletions');
  assert(orgCtrlSrc.includes('Interview.deleteMany'), 'organizationController.removeRecruiter cascades to Interview deletions');
  assert(orgCtrlSrc.includes('Job.deleteMany'), 'organizationController.removeRecruiter cascades to Job deletions');
  assert(orgCtrlSrc.includes('InterviewGig.deleteMany'), 'organizationController.removeRecruiter cascades to InterviewGig deletions');
  assert(orgCtrlSrc.includes('Message.deleteMany'), 'organizationController.removeRecruiter cascades to Message deletions');


  // --- SECTION 8: SUMMARY & VERDICT ---
  console.log('\n========================================================================');
  console.log(' CHALLENGER 7.2 EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log(`Total Checks Executed : ${totalChecks}`);
  console.log(`Passed                : ${passed}`);
  console.log(`Failed / Deficiencies : ${failed}`);
  console.log('------------------------------------------------------------------------');

  if (defects.length > 0) {
    console.log('DEFECT CATALOG:');
    defects.forEach((d, i) => {
      console.log(`[${i + 1}] [${d.severity}] ${d.testName}`);
      console.log(`    ${d.details}`);
    });
  }

  console.log('========================================================================');
  const verdict = failed > 0 ? 'REQUEST_CHANGES' : 'APPROVE';
  console.log(`FINAL CHALLENGER VERDICT: ${verdict}`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
