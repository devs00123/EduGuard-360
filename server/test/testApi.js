const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('--- STARTING EDUGUARD 360 HARDENING TEST SUITE ---');
  console.log('====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
      failCount++;
    }
  }

  // --- 1. HEALTH CHECK SECURITY ---
  console.log('\n[1/9] Testing Health Endpoint Security (/api/health)...');
  const health = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/health',
    method: 'GET'
  });
  assert(health.status === 200, 'Health check returns HTTP 200');
  assert(health.data?.database === 'connected', 'Database reports connected');
  assert(!health.data?.MONGODB_URI && !health.data?.JWT_SECRET && !health.data?.GEMINI_API_KEY, 'Never exposes credentials or secrets');

  // --- 2. DEMO MODE & AUTHENTICATION ---
  console.log('\n[2/9] Testing Demo Mode & Authentication...');
  const demoLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/demo-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { role: 'STUDENT' });
  if (demoLogin.status === 200) {
    assert(demoLogin.status === 200, 'Demo login verified (DEMO_MODE=true)', `User: ${demoLogin.data?.user?.name}`);
  } else {
    assert(demoLogin.status === 403, 'Demo login safely blocked in production (DEMO_MODE=false)');
  }

  // Standard student login
  const studentLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'rahul@eduguard.edu', password: 'EduGuard@123' });
  assert(studentLogin.status === 200 && studentLogin.data?.user?.role === 'STUDENT', 'Student credentials login valid');
  const studentToken = studentLogin.data?.token || demoLogin.data?.token;

  // --- 3. DETERMINISTIC MATHEMATICAL RISK ENGINE ---
  console.log('\n[3/9] Testing Deterministic Academic Risk Calculation...');
  const studentRisk = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/risk',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const risk = studentRisk.data?.assessment;
  assert(studentRisk.status === 200, 'Student risk calculation endpoint HTTP 200');
  assert(risk?.riskScore >= 51 && risk?.riskScore <= 75, 'Score falls into HIGH risk band (51-75)', `Score: ${risk?.riskScore}`);
  assert(risk?.riskLevel === 'HIGH', 'Risk level correctly classified as HIGH', `Level: ${risk?.riskLevel}`);
  assert(risk?.metrics?.attendancePercentage === 62, 'Attendance matches seed data (62%)');
  assert(risk?.metrics?.internalMarksAverage === 48, 'Internal marks matches seed data (48%)');
  assert(risk?.metrics?.performanceTrend === 'DECLINING', 'Performance trend matches seed data (DECLINING)');
  assert(Array.isArray(risk?.contributingFactors) && risk?.contributingFactors.length > 0, 'Explainable contributing factors generated');

  // --- 4. RISK HISTORY & RECALCULATION DEDUPLICATION ---
  console.log('\n[4/9] Testing Risk History & Deduplication...');
  const riskHistory = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/risk-history?page=1&limit=20',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(riskHistory.status === 200, 'Student risk history endpoint HTTP 200');
  assert(Array.isArray(riskHistory.data?.history), 'Returns risk history array', `Count: ${riskHistory.data?.history?.length}`);
  assert(typeof riskHistory.data?.total === 'number', 'Returns pagination metadata total');

  // Idempotent recalculation test: retry should not duplicate identical history
  const initialHistoryCount = riskHistory.data?.history?.length;
  await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/risk',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const afterHistory = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/risk-history',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(afterHistory.data?.history?.length === initialHistoryCount, 'Deduplication works: identical retry did not add duplicate assessment');

  // --- 5. CHATBOT IMPROVEMENT ADVICE & HINGLISH COMPLAINT ---
  console.log('\n[5/9] Testing AI Assistant & Hinglish Intents...');
  const tipsQuery = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { message: 'How can I improve my performance?' });
  assert(tipsQuery.data?.intent === 'GET_IMPROVEMENT_TIPS', 'Chatbot recognized improvement recommendations intent');

  const myComplaintsQuery = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { message: 'Show my complaints' });
  assert(myComplaintsQuery.data?.intent === 'MY_COMPLAINTS', 'Chatbot recognized complaints query intent without creating draft');

  const hinglishQuery = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { message: 'Block B mein Wi-Fi nahi chal raha' });
  assert(hinglishQuery.data?.intent === 'PROPOSE_COMPLAINT', 'Chatbot recognized facility issue in Hinglish');
  assert(hinglishQuery.data?.requiresConfirmation === true, 'Chatbot requires confirmation before creating complaint');

  // --- 6. FACULTY ASSIGNMENT OWNERSHIP & MANAGEMENT ---
  console.log('\n[6/9] Testing Faculty Assignment Ownership & Interventions...');
  const facultyLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'ramesh@eduguard.edu', password: 'EduGuard@123' });
  const facultyToken = facultyLogin.data?.token;

  const facultyClasses = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/faculty/classes',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  const assignedSubject = facultyClasses.data?.subjects?.[0];
  assert(!!assignedSubject, 'Faculty assigned classes retrieved', `Subject: ${assignedSubject?.name} (${assignedSubject?.code})`);

  // Create Assignment
  const createAsg = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/faculty/assignments',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${facultyToken}` }
  }, {
    subjectId: assignedSubject?._id,
    title: 'Test Hardening Assignment: Normalization',
    description: 'Solve 3NF and BCNF exercises',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxScore: 10
  });
  assert(createAsg.status === 201, 'Faculty successfully created assignment for assigned subject');

  // Unauthorized assignment creation attempt (fake subject)
  const fakeAsg = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/faculty/assignments',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${facultyToken}` }
  }, {
    subjectId: '507f1f77bcf86cd799439011',
    title: 'Illegal Assignment',
    dueDate: new Date().toISOString()
  });
  assert(fakeAsg.status === 404 || fakeAsg.status === 403, 'Server rejected assignment creation for unauthorized subject', `HTTP ${fakeAsg.status}`);

  // Faculty Interventions Summary
  const invSummary = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/faculty/interventions-summary',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(invSummary.status === 200, 'Faculty interventions summary endpoint HTTP 200');
  assert(typeof invSummary.data?.summary?.active === 'number', 'Summary has active interventions count');
  assert(typeof invSummary.data?.summary?.upcomingFollowUps === 'number', 'Summary has upcoming follow-ups count');

  // --- 7. SERVER-SIDE ROLE-FILTERED SEARCH (/api/search) ---
  console.log('\n[7/9] Testing Server-Side Role-Based Global Search...');
  // Student search: can find own complaints, subjects, FAQs
  const studentSearch = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/search?q=Wi-Fi',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  assert(studentSearch.status === 200, 'Student global search HTTP 200');
  assert(studentSearch.data?.results?.students?.length === 0, 'Security verified: Students CANNOT search student records');

  // Faculty search: can search students in assigned cohort
  const facultySearch = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/search?q=Rahul',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(facultySearch.status === 200, 'Faculty global search HTTP 200');
  assert(facultySearch.data?.results?.students?.length > 0, 'Faculty found assigned cohort student', `Found: ${facultySearch.data?.results?.students?.[0]?.name}`);

  // Staff search: cannot search student academic records
  const staffLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'suresh@eduguard.edu', password: 'EduGuard@123' });
  const staffToken = staffLogin.data?.token;

  const staffSearch = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/search?q=Rahul',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  assert(staffSearch.status === 200, 'Staff search HTTP 200');
  assert(staffSearch.data?.results?.students?.length === 0, 'Security verified: Department Staff CANNOT search academic student database');

  // --- 8. PAGINATION & SLA STATUS TAGS ---
  console.log('\n[8/9] Testing Pagination & Dynamic SLA Status...');
  const complaintsPaginated = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/complaints?page=1&limit=5',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  assert(complaintsPaginated.status === 200, 'Complaints endpoint HTTP 200');
  assert(complaintsPaginated.data?.page === 1, 'Complaints returns current page');
  assert(complaintsPaginated.data?.complaints?.length <= 5, 'Complaints obeys limit parameter (<= 5)');
  const sampleComplaint = complaintsPaginated.data?.complaints?.[0];
  assert(!!sampleComplaint?.slaStatus, 'Complaint includes dynamically computed slaStatus tag', `SLA: ${sampleComplaint?.slaStatus}`);

  // --- 9. RATE LIMITING HEADERS ---
  console.log('\n[9/10] Testing Rate Limiting Protection...');
  const rateLimitCheck = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'test@eduguard.edu', password: 'wrong' });
  assert(!!rateLimitCheck.headers['ratelimit-limit'], 'RateLimit-Limit header present', `Limit: ${rateLimitCheck.headers['ratelimit-limit']}`);

  // --- 10. ADMIN USER MANAGEMENT & ON-DEMAND PASSWORD RESET ---
  console.log('\n[10/10] Testing Admin User Management & On-Demand Password Reset...');
  const adminLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@eduguard.edu', password: 'EduGuard@123' });
  assert(adminLogin.status === 200 && adminLogin.data?.user?.role === 'ADMIN', 'Admin login successful');
  const adminToken = adminLogin.data?.token;

  // 1. Admin creates a new student
  const testStudentEmail = `test.student.${Date.now()}@eduguard.edu`;
  const createStudentRes = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/admin/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, {
    name: 'New Test Student',
    email: testStudentEmail,
    role: 'STUDENT',
    rollNumber: `STU${Date.now().toString().slice(-5)}`,
    currentSemester: 2
  });
  assert(createStudentRes.status === 201, 'Admin successfully created new student account');
  assert(!!createStudentRes.data?.user?._id, 'Student created with valid database ID');
  const createdStudentId = createStudentRes.data?.user?._id;

  // 2. Admin resets student's password
  const newSecretPassword = 'SecureBrandNew2026!';
  const resetPwRes = await request({
    host: 'localhost',
    port: 5050,
    path: `/api/admin/users/${createdStudentId}/reset-password`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }
  }, { newPassword: newSecretPassword });
  assert(resetPwRes.status === 200, 'Admin successfully reset student password');

  // 3. Student can log in with new password
  const newLoginRes = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testStudentEmail, password: newSecretPassword });
  assert(newLoginRes.status === 200, 'Student successfully authenticated with admin-reset password');

  // 4. Non-admin forbidden check
  const nonAdminTry = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/admin/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { name: 'Hacker', email: 'hack@test.com', role: 'ADMIN' });
  assert(nonAdminTry.status === 403, 'Non-admin strictly forbidden from admin user management (HTTP 403)');

  // 5. Cleanup test user
  await request({
    host: 'localhost',
    port: 5050,
    path: `/api/admin/users/${createdStudentId}`,
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  console.log('\n====================================================');
  console.log(`--- TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED ---`);
  console.log('====================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
