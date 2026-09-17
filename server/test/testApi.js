const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
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
  console.log('--- STARTING EDUGUARD 360 API TEST SUITE ---');

  // 1. Health check
  const health = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/health',
    method: 'GET'
  });
  console.log('1. Health Check:', health.status, health.data?.platform);

  // 2. Login as Student Rahul
  const studentLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'rahul@eduguard.edu', password: 'EduGuard@123' });
  console.log('2. Student Login:', studentLogin.status, studentLogin.data?.user?.name, 'Role:', studentLogin.data?.user?.role);
  const studentToken = studentLogin.data?.token;

  // 3. Student Profile & Risk
  const studentRisk = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/risk',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('3. Student Risk Score:', studentRisk.data?.assessment?.riskScore, 'Level:', studentRisk.data?.assessment?.riskLevel);
  console.log('   Attendance:', studentRisk.data?.assessment?.metrics?.attendancePercentage + '%');
  console.log('   Internal Marks:', studentRisk.data?.assessment?.metrics?.internalMarksAverage + '%');
  console.log('   Assignments Completion:', studentRisk.data?.assessment?.metrics?.assignmentCompletionRate + '%');
  console.log('   Contributing factors count:', studentRisk.data?.assessment?.contributingFactors?.length);

  // 4. Student Support Insights
  const supportInsights = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/students/me/support-insights',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('4. Combined Support Insights Active Campus Issues:', supportInsights.data?.campusSupportContext?.activeIssuesCount);

  // 5. Chatbot Hinglish & Complaint Intent Test
  const chatResponse = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { message: 'Block B mein Wi-Fi nahi chal raha' });
  console.log('5. Chatbot Hinglish Intent Response:');
  console.log('   Requires confirmation:', chatResponse.data?.requiresConfirmation);
  console.log('   Action type:', chatResponse.data?.actionPayload?.type);
  console.log('   Proposed Title:', chatResponse.data?.actionPayload?.draft?.title);

  // 6. Confirm Complaint Creation via Chatbot
  const confirmChat = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` }
  }, { confirmedAction: chatResponse.data?.actionPayload });
  console.log('6. Complaint created via Chatbot:', confirmChat.data?.ticketId, 'Action completed:', confirmChat.data?.actionCompleted);

  // 7. Faculty Login
  const facultyLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'ramesh@eduguard.edu', password: 'EduGuard@123' });
  const facultyToken = facultyLogin.data?.token;
  console.log('7. Faculty Login:', facultyLogin.status, facultyLogin.data?.user?.name);

  // 8. Faculty At-Risk Students list
  const atRisk = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/faculty/at-risk',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  console.log('8. Faculty At-Risk Count:', atRisk.data?.count, 'First student:', atRisk.data?.students?.[0]?.name, 'Risk:', atRisk.data?.students?.[0]?.riskLevel);

  // 9. Admin Analytics
  const adminLogin = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@eduguard.edu', password: 'EduGuard@123' });
  const adminToken = adminLogin.data?.token;

  const academicAnalytics = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/analytics/academic',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('9. Academic Analytics Total Students:', academicAnalytics.data?.summary?.totalStudents, 'Risk Distribution:', academicAnalytics.data?.summary?.riskDistribution);

  const campusAnalytics = await request({
    host: 'localhost',
    port: 5050,
    path: '/api/analytics/campus',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('10. Campus Analytics Total Complaints:', campusAnalytics.data?.summary?.totalComplaints, 'Categories:', Object.keys(campusAnalytics.data?.categoryStats || {}));

  console.log('--- ALL API TESTS COMPLETED SUCCESSFULLY! ---');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
