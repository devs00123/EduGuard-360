/**
 * EduGuard 360 API Client
 */
const API = {
  getToken() {
    return localStorage.getItem('eduguard_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('eduguard_token', token);
    else localStorage.removeItem('eduguard_token');
  },
  getUser() {
    const raw = localStorage.getItem('eduguard_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    if (user) localStorage.setItem('eduguard_user', JSON.stringify(user));
    else localStorage.removeItem('eduguard_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      if (options.body && typeof options.body === 'object') {
        options.body = JSON.stringify(options.body);
      }
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && !endpoint.includes('/api/auth/')) {
          this.setToken(null);
          this.setUser(null);
          if (window.App && typeof window.App.switchRole === 'function') {
            window.App.switchRole('STUDENT');
          }
        }
        throw new Error(data.message || `API Request failed with status ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      if (!endpoint.includes('/api/auth/')) {
        UI.toast(err.message, 'error');
      }
      throw err;
    }
  },

  // Auth
  login(email, password) {
    return this.request('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  demoLogin(role) {
    return this.request('/api/auth/demo-login', { method: 'POST', body: { role } });
  },
  getMe() {
    return this.request('/api/auth/me');
  },
  logout() {
    this.setToken(null);
    this.setUser(null);
    window.location.reload();
  },

  // Student
  getStudentAttendance() {
    return this.request('/api/students/me/attendance');
  },
  getStudentMarks() {
    return this.request('/api/students/me/marks');
  },
  getStudentAssignments() {
    return this.request('/api/students/me/assignments');
  },
  getStudentPerformance() {
    return this.request('/api/students/me/performance');
  },
  getStudentRisk(refresh = false) {
    return this.request(`/api/students/me/risk${refresh ? '?refresh=true' : ''}`);
  },
  getMyRiskHistory(page = 1, limit = 20) {
    return this.request(`/api/students/me/risk-history?page=${page}&limit=${limit}`);
  },
  getStudentSupportInsights() {
    return this.request('/api/students/me/support-insights');
  },

  // Faculty
  getFacultyClasses() {
    return this.request('/api/faculty/classes');
  },
  getFacultyStudents(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/api/faculty/students?${q}`);
  },
  getAtRiskStudents() {
    return this.request('/api/faculty/at-risk');
  },
  getStudentDetail(studentId) {
    return this.request(`/api/faculty/students/${studentId}`);
  },
  getFacultyStudentRiskHistory(studentId, page = 1, limit = 20) {
    return this.request(`/api/faculty/students/${studentId}/risk-history?page=${page}&limit=${limit}`);
  },
  getInterventionsSummary() {
    return this.request('/api/faculty/interventions-summary');
  },
  recordAttendance(data) {
    return this.request('/api/faculty/attendance', { method: 'POST', body: data });
  },
  recordMarks(data) {
    return this.request('/api/faculty/marks', { method: 'POST', body: data });
  },
  createAssignment(data) {
    return this.request('/api/faculty/assignments', { method: 'POST', body: data });
  },
  updateAssignmentSubmission(submissionId, data) {
    return this.request(`/api/faculty/assignments/submissions/${submissionId}`, { method: 'PATCH', body: data });
  },

  // Interventions
  createIntervention(data) {
    return this.request('/api/interventions', { method: 'POST', body: data });
  },
  updateIntervention(id, data) {
    return this.request(`/api/interventions/${id}`, { method: 'PATCH', body: data });
  },

  // Global Search
  search(query, page = 1, limit = 20) {
    return this.request(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  },

  // Complaints
  getComplaints(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/api/complaints?${q}`);
  },
  getComplaint(id) {
    return this.request(`/api/complaints/${id}`);
  },
  createComplaint(formData) {
    return this.request('/api/complaints', { method: 'POST', body: formData });
  },
  assignComplaint(id, staffId) {
    return this.request(`/api/complaints/${id}/assign`, { method: 'PATCH', body: { staffId } });
  },
  updateComplaintStatus(id, status, notes) {
    return this.request(`/api/complaints/${id}/status`, { method: 'PATCH', body: { status, notes } });
  },
  resolveComplaint(id, formData) {
    return this.request(`/api/complaints/${id}/resolve`, { method: 'POST', body: formData });
  },
  confirmComplaintResolution(id, rating, comment) {
    return this.request(`/api/complaints/${id}/confirm`, { method: 'POST', body: { rating, comment } });
  },
  reopenComplaint(id, reason) {
    return this.request(`/api/complaints/${id}/reopen`, { method: 'POST', body: { reason } });
  },
  escalateComplaint(id, reason) {
    return this.request(`/api/complaints/${id}/escalate`, { method: 'POST', body: { reason } });
  },
  adminOverrideComplaint(id, priority, departmentId, overrideReason) {
    return this.request(`/api/complaints/${id}/override`, { method: 'PATCH', body: { priority, departmentId, overrideReason } });
  },
  getComplaintClusters() {
    return this.request('/api/complaints/clusters');
  },

  // AI & Chat
  sendChatMessage(message, confirmedAction = null) {
    return this.request('/api/ai/chat', { method: 'POST', body: { message, confirmedAction } });
  },
  analyzeComplaintPreview(title, description, block, room) {
    return this.request('/api/ai/analyze-complaint', { method: 'POST', body: { title, description, block, room } });
  },

  // Analytics
  getAcademicAnalytics() {
    return this.request('/api/analytics/academic');
  },
  getCampusAnalytics() {
    return this.request('/api/analytics/campus');
  },
  getSupportInsightsAnalytics() {
    return this.request('/api/analytics/support');
  },

  // Notifications
  getNotifications() {
    return this.request('/api/notifications');
  },
  markNotificationRead(id) {
    return this.request(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },
  markAllNotificationsRead() {
    return this.request('/api/notifications/read-all', { method: 'POST' });
  },

  // Admin
  getAdminUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users?${q}`);
  },
  createAdminUser(data) {
    return this.request('/api/admin/users', { method: 'POST', body: data });
  },
  resetAdminUserPassword(userId, newPassword = null) {
    return this.request(`/api/admin/users/${userId}/reset-password`, { method: 'POST', body: { newPassword } });
  },
  toggleAdminUserStatus(userId) {
    return this.request(`/api/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
  },
  deleteAdminUser(userId) {
    return this.request(`/api/admin/users/${userId}`, { method: 'DELETE' });
  },
  getAdminDepartments() {
    return this.request('/api/admin/departments');
  },
  getAdminCourses() {
    return this.request('/api/admin/courses');
  },
  getAdminCategories() {
    return this.request('/api/admin/categories');
  },
  getAdminLocations() {
    return this.request('/api/admin/locations');
  },
  getAdminSlaRules() {
    return this.request('/api/admin/sla-rules');
  },
  updateSlaRule(id, data) {
    return this.request(`/api/admin/sla-rules/${id}`, { method: 'PATCH', body: data });
  },
  getAdminAuditLogs() {
    return this.request('/api/admin/audit-logs');
  },
  getFaqs() {
    return this.request('/api/admin/faqs');
  },
  getEmergencyContacts() {
    return this.request('/api/admin/emergency-contacts');
  }
};
