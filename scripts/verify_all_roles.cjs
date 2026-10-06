// Verification script for live runtime testing across all 5 roles
// Executed against live running server on http://localhost:5001

const http = require('http');

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
  const data = isJson ? await res.json() : await res.text();
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('====================================================');
  console.log(' Axiocruit Live Runtime Verification (All 5 Roles)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, detail = '') {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message} - ${detail}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('/health');
  assert(health.status === 200, 'GET /api/health returned 200', JSON.stringify(health.data));

  // 2. Candidate role
  console.log('\n--- Testing Role: CANDIDATE ---');
  const candLogin = await request('/auth/login', 'POST', {
    email: 'candidate@axiocruit.com',
    password: 'Password123!',
  });
  assert(candLogin.status === 200 && candLogin.data.token, 'Candidate login succeeds', JSON.stringify(candLogin.data));
  const candToken = candLogin.data.token;

  const candProfile = await request('/users/profile', 'GET', null, candToken);
  assert(candProfile.status === 200, 'Candidate can fetch /api/users/profile', candProfile.status);

  const candJobs = await request('/jobs', 'GET', null, candToken);
  assert(candJobs.status === 200 && Array.isArray(candJobs.data), 'Candidate can browse /api/jobs', candJobs.status);

  const candApps = await request('/applications/my-applications', 'GET', null, candToken);
  assert(candApps.status === 200 && Array.isArray(candApps.data), 'Candidate can fetch /api/applications/my-applications', candApps.status);

  const candInterviews = await request('/interviews/my-interviews', 'GET', null, candToken);
  assert(candInterviews.status === 200, 'Candidate can fetch /api/interviews/my-interviews', candInterviews.status);

  // 3. Recruiter role
  console.log('\n--- Testing Role: RECRUITER ---');
  const recLogin = await request('/auth/login', 'POST', {
    email: 'recruiter@axiocruit.com',
    password: 'Password123!',
  });
  assert(recLogin.status === 200 && recLogin.data.token, 'Recruiter login succeeds', JSON.stringify(recLogin.data));
  const recToken = recLogin.data.token;

  const recJobs = await request('/jobs/my-jobs', 'GET', null, recToken);
  assert(recJobs.status === 200 && Array.isArray(recJobs.data), 'Recruiter can fetch /api/jobs/my-jobs', recJobs.status);

  const recApps = await request('/jobs/applications/received', 'GET', null, recToken);
  assert(recApps.status === 200 && Array.isArray(recApps.data), 'Recruiter can fetch /api/jobs/applications/received', recApps.status);

  const recInterviews = await request('/interviews/my-interviews', 'GET', null, recToken);
  assert(recInterviews.status === 200, 'Recruiter can fetch /api/interviews/my-interviews', recInterviews.status);

  const recEligible = await request('/interviews/eligible-candidates', 'GET', null, recToken);
  assert(recEligible.status === 200 && Array.isArray(recEligible.data), 'Recruiter can fetch /api/interviews/eligible-candidates', recEligible.status);

  // Recruiter creates a job
  const newJob = await request('/jobs', 'POST', {
    title: 'Senior TypeScript Engineer',
    description: 'Build enterprise platforms with React and Node',
    requirements: 'TypeScript, Node.js, React',
    company: 'Axiocruit Core',
    location: 'Remote',
    type: 'Full-time',
    salary: '$140k - $180k',
    skills: ['TypeScript', 'React', 'Node.js'],
  }, recToken);
  assert(newJob.status === 201 && newJob.data._id, 'Recruiter can create job /api/jobs', JSON.stringify(newJob.data));
  const createdJobId = newJob.data?._id;

  // 4. Interviewer role
  console.log('\n--- Testing Role: INTERVIEWER ---');
  const intLogin = await request('/auth/login', 'POST', {
    email: 'interviewer@axiocruit.com',
    password: 'Password123!',
  });
  assert(intLogin.status === 200 && intLogin.data.token, 'Interviewer login succeeds', JSON.stringify(intLogin.data));
  const intToken = intLogin.data.token;

  const intServices = await request('/freelancers/services', 'GET', null, intToken);
  assert(intServices.status === 200, 'Interviewer can fetch /api/freelancers/services', intServices.status);

  const intGigs = await request('/freelancers/gigs/open', 'GET', null, intToken);
  assert(intGigs.status === 200 && Array.isArray(intGigs.data), 'Interviewer can fetch /api/freelancers/gigs/open', intGigs.status);

  const intInterviews = await request('/interviews/my-interviews', 'GET', null, intToken);
  assert(intInterviews.status === 200, 'Interviewer can fetch /api/interviews/my-interviews', intInterviews.status);

  // 5. Organization role
  console.log('\n--- Testing Role: ORGANIZATION ---');
  const orgLogin = await request('/auth/login', 'POST', {
    email: 'org@axiocruit.com',
    password: 'Password123!',
  });
  assert(orgLogin.status === 200 && orgLogin.data.token, 'Organization login succeeds', JSON.stringify(orgLogin.data));
  assert(orgLogin.data.role === 'ORGANIZATION', 'Role is ORGANIZATION', orgLogin.data.role);
  const orgToken = orgLogin.data.token;

  const orgRecruiters = await request('/organization/recruiters', 'GET', null, orgToken);
  assert(orgRecruiters.status === 200 && Array.isArray(orgRecruiters.data), 'Organization can fetch /api/organization/recruiters', orgRecruiters.status);

  const orgJobs = await request('/organization/jobs', 'GET', null, orgToken);
  assert(orgJobs.status === 200 && Array.isArray(orgJobs.data), 'Organization can fetch /api/organization/jobs', orgJobs.status);

  // Verify our newly added Organization capabilities
  const orgMyJobs = await request('/jobs/my-jobs', 'GET', null, orgToken);
  assert(orgMyJobs.status === 200 && Array.isArray(orgMyJobs.data), 'Organization can query /api/jobs/my-jobs', orgMyJobs.status);

  const orgReceivedApps = await request('/jobs/applications/received', 'GET', null, orgToken);
  assert(orgReceivedApps.status === 200 && Array.isArray(orgReceivedApps.data), 'Organization can query /api/jobs/applications/received', orgReceivedApps.status);

  const orgMyInterviews = await request('/interviews/my-interviews', 'GET', null, orgToken);
  assert(orgMyInterviews.status === 200, 'Organization can query /api/interviews/my-interviews', orgMyInterviews.status);

  const orgEligible = await request('/interviews/eligible-candidates', 'GET', null, orgToken);
  assert(orgEligible.status === 200 && Array.isArray(orgEligible.data), 'Organization can query /api/interviews/eligible-candidates', orgEligible.status);

  // 6. Admin role
  console.log('\n--- Testing Role: ADMIN ---');
  const adminLogin = await request('/auth/login', 'POST', {
    email: 'admin@axiocruit.com',
    password: 'Password123!',
  });
  assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login succeeds', JSON.stringify(adminLogin.data));
  const adminToken = adminLogin.data.token;

  const adminStats = await request('/admin/stats', 'GET', null, adminToken);
  assert(adminStats.status === 200 && adminStats.data.success, 'Admin can fetch /api/admin/stats', adminStats.status);

  const adminOverview = await request('/admin/overview', 'GET', null, adminToken);
  assert(adminOverview.status === 200 && adminOverview.data.success, 'Admin can fetch /api/admin/overview', adminOverview.status);

  const adminUsers = await request('/admin/users', 'GET', null, adminToken);
  assert(adminUsers.status === 200 && Array.isArray(adminUsers.data.users), 'Admin can fetch /api/admin/users', adminUsers.status);

  const adminJobs = await request('/admin/jobs', 'GET', null, adminToken);
  assert(adminJobs.status === 200 && Array.isArray(adminJobs.data.jobs), 'Admin can fetch /api/admin/jobs', adminJobs.status);

  // 7. End-to-End Interview & Coding Test Workflow
  console.log('\n--- Testing End-to-End Workflow: Interview Room & Code Test ---');
  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const scheduleRes = await request('/interviews/schedule', 'POST', {
    candidateId: candLogin.data.user?._id || candLogin.data._id,
    jobId: createdJobId,
    scheduledTime: futureDate,
    notes: 'Live technical round',
  }, recToken);
  assert(scheduleRes.status === 201 && scheduleRes.data._id, 'Recruiter schedules interview room', scheduleRes.status);
  const interviewId = scheduleRes.data?._id;

  if (interviewId) {
    // Candidate verifies room
    const candRoom = await request(`/interviews/${interviewId}`, 'GET', null, candToken);
    assert(candRoom.status === 200 && candRoom.data.isUserHost === false, 'Candidate joins room as non-host participant', candRoom.status);

    // Recruiter verifies room
    const recRoom = await request(`/interviews/${interviewId}`, 'GET', null, recToken);
    assert(recRoom.status === 200 && recRoom.data.isUserHost === true, 'Recruiter joins room as verified host', recRoom.status);

    // Org Admin verifies room
    const orgRoom = await request(`/interviews/${interviewId}`, 'GET', null, orgToken);
    assert(orgRoom.status === 200 && orgRoom.data.isUserHost === true, 'Organization Admin can join room as verified host', orgRoom.status);

    // Start coding test session
    const testSessionRes = await request('/coding-test/start', 'POST', {
      jobId: createdJobId,
    }, candToken);
    assert(testSessionRes.status === 200 || testSessionRes.status === 201, 'Coding test session starts', testSessionRes.status);
    const testSessionId = testSessionRes.data?.sessionId;

    if (testSessionId && testSessionRes.data?.question) {
      const qId = testSessionRes.data.question._id;
      // Submit simple Python solution
      const submitRes = await request(`/coding-test/${testSessionId}/submit`, 'POST', {
        questionId: qId,
        submittedCode: 'def solution(*args):\n    return True\n',
      }, candToken);
      assert(submitRes.status === 200 && typeof submitRes.data.score === 'number', 'Python execution engine runs and evaluates code', submitRes.status);
    }

    // Complete interview
    const completeRes = await request(`/interviews/${interviewId}/complete`, 'POST', {
      interviewerRemarks: 'Demonstrated strong proficiency in core architecture.',
    }, recToken);
    assert(completeRes.status === 200 && completeRes.data.status === 'Completed', 'Host completes interview successfully', completeRes.status);
  }

  console.log('\n====================================================');
  console.log(` Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
