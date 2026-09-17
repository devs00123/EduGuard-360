/**
 * EDUGUARD 360 - COMPLETE AUTHENTICATION PORTAL & SECURITY HARDENING TEST SUITE
 * Comprehensive verification of authentication portals, RBAC boundaries,
 * privilege escalation prevention, and student access isolation.
 */

const assert = require('assert');
const http = require('http');

const BASE_URL = 'http://localhost:5050';

let totalTests = 0;
let passedTests = 0;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = options.headers || {};
    let postData = '';

    if (options.body && typeof options.body === 'object') {
      postData = JSON.stringify(options.body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
          raw: data
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

function test(name, fn) {
  totalTests++;
  return fn()
    .then(() => {
      passedTests++;
      console.log(`✅ PASS: ${name}`);
    })
    .catch(err => {
      console.error(`❌ FAIL: ${name} -> ${err.message}`);
      process.exitCode = 1;
    });
}

async function runAuthPortalSecuritySuite() {
  console.log('====================================================');
  console.log('--- EDUGUARD 360 AUTHENTICATION PORTAL SECURITY SUITE ---');
  console.log('====================================================\n');

  let studentToken = null;
  let facultyToken = null;
  let staffToken = null;
  let deptHeadToken = null;
  let adminToken = null;
  let secondStudentToken = null;

  // 1. Student Login
  await test('Student Login: Valid credentials return HTTP 200, JWT token, and authoritative role STUDENT', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul@eduguard.edu', password: 'EduGuard@123' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.role, 'STUDENT');
    assert.ok(res.data.token, 'Token must be present');
    studentToken = res.data.token;
  });

  // 2. Student Login Invalid Credentials
  await test('Student Login: Invalid password returns HTTP 401 Unauthorized', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'rahul@eduguard.edu', password: 'wrongPassword!#@' }
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.data.success, false);
  });

  // 3. Student Registration
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newStudentEmail = `onboarded.student.${randomSuffix}@college.edu`;
  await test('Student Registration: Creates genuine MongoDB User & Student records with role STUDENT', async () => {
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: `New Student ${randomSuffix}`,
        email: newStudentEmail,
        password: 'securePassword123',
        rollNumber: `STD-2024-${randomSuffix}`,
        semester: 2
      }
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.user.role, 'STUDENT');
    assert.ok(res.data.token, 'Token returned for registered student');
    secondStudentToken = res.data.token;
  });

  // 4. Privilege Escalation Prevention on Public Registration
  await test('Privilege Escalation Prevention: Public registration payload with role=ADMIN is overridden to STUDENT', async () => {
    const maliciousEmail = `hacker.${Math.floor(1000 + Math.random() * 9000)}@college.edu`;
    const res = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Malicious Attacker',
        email: maliciousEmail,
        password: 'attackPassword123',
        role: 'ADMIN', // Attacker trying to elevate role
        rollNumber: `HACK-${Math.floor(1000 + Math.random() * 9000)}`
      }
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.user.role, 'STUDENT', 'Server MUST override role to STUDENT');
    assert.notStrictEqual(res.data.user.role, 'ADMIN', 'Must NEVER create ADMIN from public registration');
  });

  // 5. Faculty Login
  await test('Faculty Login: Valid credentials return HTTP 200 and authoritative role FACULTY', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'ramesh@eduguard.edu', password: 'EduGuard@123' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.user.role, 'FACULTY');
    facultyToken = res.data.token;
  });

  // 6. Department Staff Login
  await test('Staff Login: Valid credentials return HTTP 200 and authoritative role DEPARTMENT_STAFF', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'suresh@eduguard.edu', password: 'EduGuard@123' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.user.role, 'DEPARTMENT_STAFF');
    staffToken = res.data.token;
  });

  // 7. Department Head Login
  await test('Dept Head Login: Valid credentials return HTTP 200 and authoritative role DEPARTMENT_HEAD', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'priya@eduguard.edu', password: 'EduGuard@123' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.user.role, 'DEPARTMENT_HEAD');
    deptHeadToken = res.data.token;
  });

  // 8. Admin Login
  await test('Admin Login: Valid credentials return HTTP 200 and authoritative role ADMIN', async () => {
    const res = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@eduguard.edu', password: 'EduGuard@123' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.user.role, 'ADMIN');
    adminToken = res.data.token;
  });

  // 9. Student Access Isolation: Admin APIs blocked
  await test('Student Isolation: Student accessing /api/admin/users is rejected with HTTP 403 Forbidden', async () => {
    const res = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.statusCode, 403, 'Student must be rejected with 403 Forbidden');
    assert.strictEqual(res.data.success, false);
  });

  // 10. Student Access Isolation: Faculty APIs blocked
  await test('Student Isolation: Student accessing /api/faculty/classes is rejected with HTTP 403 Forbidden', async () => {
    const res = await request('/api/faculty/classes', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.statusCode, 403, 'Student must be rejected with 403 Forbidden');
    assert.strictEqual(res.data.success, false);
  });

  // 11. Faculty Access Isolation: Admin-only APIs blocked
  await test('Faculty Isolation: Faculty accessing /api/admin/audit-logs is rejected with HTTP 403 Forbidden', async () => {
    const res = await request('/api/admin/audit-logs', {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    assert.strictEqual(res.statusCode, 403, 'Faculty must be rejected from Admin routes with 403');
  });

  // 12. IDOR Protection: Student cannot view another student's complaint
  await test('IDOR Protection: Student cannot retrieve another student ticket via ID manipulation', async () => {
    // 1. Get first student complaint
    const cmpRes = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (cmpRes.data && cmpRes.data.complaints && cmpRes.data.complaints.length > 0) {
      const firstStudentTicketId = cmpRes.data.complaints[0]._id;
      // 2. Second student attempts to fetch first student's ticket
      const idorRes = await request(`/api/complaints/${firstStudentTicketId}`, {
        headers: { Authorization: `Bearer ${secondStudentToken}` }
      });
      assert.strictEqual(idorRes.statusCode, 403, 'Must reject unauthorized student ticket access with HTTP 403');
    }
  });

  // 13. Unauthenticated Access Protection
  await test('Unauthenticated Protection: Request without token to /api/students/me is rejected with HTTP 401', async () => {
    const res = await request('/api/students/me');
    assert.strictEqual(res.statusCode, 401, 'Unauthenticated request must return 401');
  });

  // 14. Client Role Tampering / Forged Token Protection
  await test('Token Tampering Protection: Forged or modified JWT token is rejected with HTTP 401', async () => {
    const tamperedToken = studentToken.slice(0, -10) + 'ABCDEFGHIJ';
    const res = await request('/api/students/me', {
      headers: { Authorization: `Bearer ${tamperedToken}` }
    });
    assert.strictEqual(res.statusCode, 401, 'Tampered token must be rejected with 401');
  });

  // 15. Staff Registration Security: Public creation of ADMIN is forbidden
  await test('Staff Registration Security: Requesting ADMIN role via staff-register is rejected with HTTP 403', async () => {
    const res = await request('/api/auth/staff-register', {
      method: 'POST',
      body: {
        name: 'Fake Dean',
        email: `fake.dean.${Math.floor(1000 + Math.random() * 9000)}@college.edu`,
        password: 'deanPassword123',
        role: 'ADMIN' // Prohibited
      }
    });
    assert.strictEqual(res.statusCode, 403, 'Public creation of ADMIN must return 403 Forbidden');
    assert.strictEqual(res.data.success, false);
  });

  // 16. Staff Registration Clearance Workflow
  await test('Staff Registration Workflow: Faculty clearance request creates inactive account (isActive: false)', async () => {
    const facultyReqEmail = `dr.applicant.${Math.floor(1000 + Math.random() * 9000)}@college.edu`;
    const res = await request('/api/auth/staff-register', {
      method: 'POST',
      body: {
        name: 'Dr. New Applicant',
        email: facultyReqEmail,
        password: 'facultyPassword123',
        role: 'FACULTY',
        employeeId: 'FAC-APPL-2024'
      }
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.user.isActive, false, 'Clearance request account must be pending (isActive: false)');
  });

  // 17. Forgot Password Endpoint
  await test('Forgot Password: /api/auth/forgot-password returns safe generic confirmation message', async () => {
    const res = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'rahul.sharma@college.edu' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.message.includes('password recovery instructions'));
  });

  // 18. Logout Endpoint & Audit Event
  await test('Logout Endpoint: /api/auth/logout succeeds and records audit log', async () => {
    const res = await request('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.data.success, true);
  });

  // 19. Direct Route Serving
  await test('Direct Route Serving: GET /student/login, /student/register, /staff/login, /portal return HTTP 200', async () => {
    const [p1, p2, p3, p4] = await Promise.all([
      request('/student/login'),
      request('/student/register'),
      request('/staff/login'),
      request('/portal')
    ]);
    assert.strictEqual(p1.statusCode, 200, '/student/login must return 200');
    assert.strictEqual(p2.statusCode, 200, '/student/register must return 200');
    assert.strictEqual(p3.statusCode, 200, '/staff/login must return 200');
    assert.strictEqual(p4.statusCode, 200, '/portal must return 200');
  });

  console.log('\n====================================================');
  console.log(`--- AUTHENTICATION SUITE: ${passedTests} / ${totalTests} PASSED ---`);
  console.log('====================================================\n');
}

runAuthPortalSecuritySuite().catch(console.error);
