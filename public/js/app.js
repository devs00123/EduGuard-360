/**
 * EduGuard 360 Main Application Controller
 */

window.currentView = 'student';

const UI = {
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check'
      : type === 'error' ? 'fa-circle-exclamation'
      : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info';

    toast.innerHTML = `
      <i class="fas ${icon}" style="font-size: 1.1rem; color: ${type === 'success' ? 'var(--risk-low)' : type === 'error' ? 'var(--risk-critical)' : 'var(--primary)'};"></i>
      <div style="flex-grow: 1; font-size: 0.85rem;">${message}</div>
      <button style="background: none; border: none; color: var(--text-muted); cursor: pointer;" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  showModal({ title, body, footer = '' }) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (titleEl) titleEl.innerText = title;
    if (bodyEl) bodyEl.innerHTML = body;
    if (footerEl) footerEl.innerHTML = footer;

    if (overlay) overlay.classList.add('active');
  },

  updateModalBody(html) {
    const bodyEl = document.getElementById('modal-body');
    if (bodyEl) bodyEl.innerHTML = html;
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  incrementNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.style.display = 'flex';
      const current = parseInt(badge.innerText || '0');
      badge.innerText = current + 1;
    }
  },

  promptModal({ title, message, defaultValue = '', placeholder = '', confirmText = 'Submit', onConfirm }) {
    UI.showModal({
      title,
      body: `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin: 0;">${message}</p>
          <textarea id="prompt-modal-input" class="form-control" rows="3" style="width: 100%; border-radius: var(--radius-md); padding: 0.6rem; border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary); font-family: inherit;" placeholder="${placeholder}">${defaultValue}</textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-md); margin-right: 0.5rem;" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-prompt-modal-submit" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-md);">${confirmText}</button>
      `
    });

    document.getElementById('btn-prompt-modal-submit')?.addEventListener('click', async () => {
      const val = document.getElementById('prompt-modal-input')?.value?.trim();
      if (val && onConfirm) {
        await onConfirm(val);
      }
    });
  },

  openComplaintModal() {
    UI.showModal({
      title: 'Lodge Smart Campus Incident / Complaint',
      body: `
        <form id="form-submit-complaint" enctype="multipart/form-data">
          <div class="form-group">
            <label class="form-label">Issue Title *</label>
            <input id="cmp-title" name="title" type="text" class="form-control" placeholder="e.g. Wi-Fi dropping in Block B Room 204" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label">Campus Block *</label>
              <select id="cmp-block" name="block" class="form-control" required>
                <option value="Block B">Block B (Academic Complex)</option>
                <option value="Block A">Block A (Engineering)</option>
                <option value="Block C">Block C (Central Library)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Room / Lab *</label>
              <input id="cmp-room" name="room" type="text" class="form-control" placeholder="e.g. Room 204 or Lab 3" required value="Room 204" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Detailed Description *</label>
            <textarea id="cmp-desc" name="description" class="form-control" rows="3" placeholder="Describe the malfunction, equipment condition, or safety hazard..." required></textarea>
          </div>

          <!-- Live AI Diagnostic Preview Box -->
          <div id="ai-live-preview" style="display: none; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px dashed var(--primary); border-radius: var(--radius-md); padding: 12px; margin-bottom: 16px;">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--primary);">
              <i class="fas fa-robot"></i> AI Instant Diagnosis:
            </div>
            <div id="ai-preview-content" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Photo Attachment (Optional)</label>
            <input id="cmp-files" name="attachments" type="file" class="form-control" accept="image/*,application/pdf" />
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%;">
            <i class="fas fa-paper-plane"></i> Submit Issue to Campus Support
          </button>
        </form>
      `
    });

    // Real-time AI preview debounced
    const titleInput = document.getElementById('cmp-title');
    const descInput = document.getElementById('cmp-desc');
    let previewTimeout = null;

    const runPreview = () => {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(async () => {
        const title = titleInput.value.trim();
        const desc = descInput.value.trim();
        if (title.length > 5) {
          try {
            const res = await API.analyzeComplaintPreview(title, desc, 'Block B', 'Room 204');
            const ai = res.analysis;
            const previewEl = document.getElementById('ai-live-preview');
            const contentEl = document.getElementById('ai-preview-content');
            if (previewEl && contentEl) {
              previewEl.style.display = 'block';
              contentEl.innerHTML = `
                Detected Category: <strong>${ai.categoryName}</strong> | Suggested Priority: <strong style="color: var(--risk-high);">${ai.priority}</strong><br>
                Department: <strong>${ai.departmentName}</strong> | Academic Impact: <strong>${ai.academicImpact}</strong><br>
                <em>"${ai.reason}"</em>
              `;
            }
          } catch (e) {}
        }
      }, 600);
    };

    titleInput?.addEventListener('input', runPreview);
    descInput?.addEventListener('input', runPreview);

    // Form Submission
    document.getElementById('form-submit-complaint')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = document.getElementById('form-submit-complaint');
      const formData = new FormData(form);

      try {
        const res = await API.createComplaint(formData);
        UI.toast(`Complaint ${res.complaint?.ticketId} submitted successfully!`, 'success');
        UI.closeModal();
        App.refreshCurrentView();
      } catch (err) {
        UI.toast(`Submission failed: ${err.message}`, 'error');
      }
    });
  }
};

const App = {
  async init() {
    this.setupTheme();
    this.bindGlobalEvents();

    // Role-based initial view routing from path
    const path = window.location.pathname;
    if (path.includes('/faculty/dashboard')) window.currentView = 'faculty';
    else if (path.includes('/staff/dashboard')) window.currentView = 'complaints';
    else if (path.includes('/admin/dashboard')) window.currentView = 'admin';
    else window.currentView = 'student';

    // Check if user is logged in and token is valid
    let user = API.getUser();
    let token = API.getToken();
    if (!user || !token) {
      // In demo mode, fallback to student demo role
      await this.switchRole('STUDENT');
    } else {
      try {
        const meRes = await API.getMe();
        if (meRes && meRes.user) {
          user = meRes.user;
          API.setUser(user);
          this.updateUserUI(user);

          // Route to proper dashboard view based on authoritative server role
          if (user.role === 'STUDENT') {
            if (window.currentView === 'faculty' || window.currentView === 'admin') window.currentView = 'student';
          } else if (user.role === 'FACULTY') {
            if (window.currentView === 'admin') window.currentView = 'faculty';
          }

          this.renderCurrentView();
        } else {
          await this.switchRole('STUDENT');
        }
      } catch (err) {
        console.warn('[App] Session expired or database reseeded:', err.message);
        await this.switchRole('STUDENT');
      }
    }

    SocketClient.init();
    Emergency.init();
    Chatbot.init();
  },

  async handleLogout() {
    const user = API.getUser();
    const role = user?.role || 'STUDENT';
    UI.toast('Signing out of EduGuard 360...', 'info');

    try {
      await API.request('/api/auth/logout', { method: 'POST' });
    } catch (_) {}

    API.setToken(null);
    API.setUser(null);

    // Redirect to the appropriate portal
    if (role === 'STUDENT') {
      window.location.href = '/student/login';
    } else {
      window.location.href = '/staff/login';
    }
  },

  setupTheme() {
    const savedTheme = localStorage.getItem('eduguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('eduguard_theme', next);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  },

  bindGlobalEvents() {
    // Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => this.toggleTheme());

    // Logout buttons
    const doLogout = () => this.handleLogout();
    document.getElementById('sidebar-logout-btn')?.addEventListener('click', doLogout);
    document.getElementById('topbar-logout-btn')?.addEventListener('click', doLogout);

    // Mobile Sidebar toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      const sidebar = document.querySelector('.app-sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });

    // Close Modal button & backdrop
    document.getElementById('modal-close-btn')?.addEventListener('click', () => UI.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') UI.closeModal();
    });

    // Top Demo Role Switcher Buttons
    document.querySelectorAll('.demo-pill').forEach(pill => {
      pill.addEventListener('click', async () => {
        const role = pill.getAttribute('data-role');
        await this.switchRole(role);
      });
    });

    // Sidebar Navigation items
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Notifications toggle
    document.getElementById('notif-toggle-btn')?.addEventListener('click', () => this.toggleNotificationsDrawer());

    // Initialize Global Search
    this.initGlobalSearch();
  },

  initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('global-search-dropdown');
    if (!searchInput || !searchDropdown) return;

    let debounceTimeout = null;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimeout);
      const query = e.target.value.trim();
      if (query.length < 2) {
        searchDropdown.style.display = 'none';
        searchDropdown.innerHTML = '';
        return;
      }

      debounceTimeout = setTimeout(async () => {
        try {
          const res = await API.search(query);
          const r = res.results || {};
          let html = '';

          // Complaints
          if (r.complaints && r.complaints.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">Complaints (${r.complaints.length})</div>`;
            r.complaints.forEach(c => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color);" onclick="ComplaintsView.openDetailsModal('${c._id}'); document.getElementById('global-search-dropdown').style.display='none';">
                  <div>
                    <div style="font-weight: 600; font-size: 0.82rem;">${c.ticketId}: ${c.title}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${c.location || ''} &bull; ${c.status}</div>
                  </div>
                  <span class="badge ${c.slaStatus === 'OVERDUE' ? 'badge-critical' : c.slaStatus === 'DUE_SOON' ? 'badge-high' : 'badge-low'}" style="font-size: 0.65rem;">${c.slaStatus}</span>
                </div>`;
            });
          }

          // Students (for Faculty / Admin)
          if (r.students && r.students.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Students (${r.students.length})</div>`;
            r.students.forEach(s => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color);" onclick="FacultyView.openStudentProfileModal('${s._id}'); document.getElementById('global-search-dropdown').style.display='none';">
                  <div>
                    <div style="font-weight: 600; font-size: 0.82rem;">${s.name} (${s.rollNumber})</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${s.course || ''} &bull; Sem ${s.semester || ''}</div>
                  </div>
                  <span class="risk-badge risk-${(s.riskLevel || 'LOW').toLowerCase()}" style="font-size: 0.65rem;">${s.riskLevel} (${s.riskScore})</span>
                </div>`;
            });
          }

          // Subjects
          if (r.subjects && r.subjects.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Subjects (${r.subjects.length})</div>`;
            r.subjects.forEach(sub => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.82rem;">${sub.code} - ${sub.name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${sub.faculty || sub.course || ''}</div>
                </div>`;
            });
          }

          // Interventions
          if (r.interventions && r.interventions.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Interventions (${r.interventions.length})</div>`;
            r.interventions.forEach(inv => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.82rem;">${inv.title}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">Status: ${inv.status}</div>
                </div>`;
            });
          }

          // FAQs
          if (r.faqs && r.faqs.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Campus FAQs (${r.faqs.length})</div>`;
            r.faqs.forEach(f => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.82rem;">${f.question}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">Category: ${f.category}</div>
                </div>`;
            });
          }

          // Departments
          if (r.departments && r.departments.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Departments (${r.departments.length})</div>`;
            r.departments.forEach(d => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.82rem;">${d.name} (${d.code || ''})</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${d.officeLocation || d.contactEmail || ''}</div>
                </div>`;
            });
          }

          // Staff
          if (r.staff && r.staff.length > 0) {
            html += `<div style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 8px 0 4px;">Staff Members (${r.staff.length})</div>`;
            r.staff.forEach(st => {
              html += `
                <div class="search-item" style="padding: 6px 8px; border-radius: 4px; border-bottom: 1px solid var(--border-color);">
                  <div style="font-weight: 600; font-size: 0.82rem;">${st.name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${st.email}</div>
                </div>`;
            });
          }

          if (!html) {
            html = '<div style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 0.82rem;">No matching records found for your role.</div>';
          }

          searchDropdown.innerHTML = html;
          searchDropdown.style.display = 'block';
        } catch (err) {
          console.error('Search error:', err);
        }
      }, 300);
    });

    // Keyboard shortcuts (Ctrl+K or Cmd+K to focus, Escape to dismiss)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      if (e.key === 'Escape' && searchDropdown.style.display !== 'none') {
        searchDropdown.style.display = 'none';
        searchInput.blur();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.style.display = 'none';
      }
    });
  },

  async switchRole(role) {
    try {
      UI.toast(`Switching perspective to ${role.replace('_', ' ')}...`, 'info');
      const res = await API.demoLogin(role);
      API.setToken(res.token);
      API.setUser(res.user);

      this.updateUserUI(res.user);
      this.refreshCurrentView();
      UI.toast(`Perspective active: ${res.user.name} (${res.user.role})`, 'success');
    } catch (err) {
      UI.toast(`Role switch failed: ${err.message}`, 'error');
    }
  },

  updateUserUI(user) {
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const avatarEl = document.getElementById('current-user-avatar');

    if (nameEl) nameEl.innerText = user.name;
    if (roleEl) roleEl.innerText = user.role.replace('_', ' ');
    if (avatarEl) avatarEl.innerText = user.name.charAt(0);

    const topNameEl = document.getElementById('topbar-user-name');
    const topRoleEl = document.getElementById('topbar-user-role');
    const topAvatarEl = document.getElementById('topbar-user-avatar');

    if (topNameEl) topNameEl.innerText = user.name;
    if (topRoleEl) topRoleEl.innerText = user.role.replace('_', ' ');
    if (topAvatarEl) topAvatarEl.innerText = user.name.charAt(0);

    // Dynamically render sidebar navigation to ensure student never has faculty mentorship
    this.renderSidebarNav(user);
  },

  renderSidebarNav(user) {
    const navEl = document.getElementById('sidebar-nav');
    if (!navEl) return;

    const role = user?.role || 'STUDENT';
    const currentView = window.currentView || 'student';

    let modulesHtml = '<div class="nav-section-title">Core Modules</div>';

    if (role === 'STUDENT') {
      modulesHtml += `
        <a class="nav-item ${currentView === 'student' ? 'active' : ''}" data-view="student" href="#student">
          <i class="fas fa-chart-pie"></i>
          <span>Student Academic Risk</span>
        </a>
        <a class="nav-item ${currentView === 'complaints' ? 'active' : ''}" data-view="complaints" href="#complaints">
          <i class="fas fa-headset"></i>
          <span>Campus Complaints</span>
        </a>
      `;
    } else if (role === 'FACULTY') {
      modulesHtml += `
        <a class="nav-item ${currentView === 'faculty' ? 'active' : ''}" data-view="faculty" href="#faculty">
          <i class="fas fa-user-doctor"></i>
          <span>Faculty Mentorship</span>
          <span class="nav-badge" style="background: var(--risk-critical);">At-Risk</span>
        </a>
        <a class="nav-item ${currentView === 'complaints' ? 'active' : ''}" data-view="complaints" href="#complaints">
          <i class="fas fa-headset"></i>
          <span>Campus Complaints</span>
        </a>
      `;
    } else if (role === 'DEPARTMENT_STAFF') {
      modulesHtml += `
        <a class="nav-item ${currentView === 'complaints' ? 'active' : ''}" data-view="complaints" href="#complaints">
          <i class="fas fa-headset"></i>
          <span>Campus Complaints</span>
        </a>
      `;
    } else if (role === 'DEPARTMENT_HEAD') {
      modulesHtml += `
        <a class="nav-item ${currentView === 'complaints' ? 'active' : ''}" data-view="complaints" href="#complaints">
          <i class="fas fa-headset"></i>
          <span>Campus Complaints</span>
        </a>
        <a class="nav-item ${currentView === 'admin' ? 'active' : ''}" data-view="admin" href="#admin">
          <i class="fas fa-sliders"></i>
          <span>Executive Analytics</span>
        </a>
      `;
    } else if (role === 'ADMIN') {
      modulesHtml += `
        <a class="nav-item ${currentView === 'faculty' ? 'active' : ''}" data-view="faculty" href="#faculty">
          <i class="fas fa-user-doctor"></i>
          <span>Faculty Mentorship</span>
          <span class="nav-badge" style="background: var(--risk-critical);">At-Risk</span>
        </a>
        <a class="nav-item ${currentView === 'complaints' ? 'active' : ''}" data-view="complaints" href="#complaints">
          <i class="fas fa-headset"></i>
          <span>Campus Complaints</span>
        </a>
        <a class="nav-item ${currentView === 'admin' ? 'active' : ''}" data-view="admin" href="#admin">
          <i class="fas fa-sliders"></i>
          <span>Executive Analytics</span>
        </a>
      `;
    }

    modulesHtml += `
      <div class="nav-section-title">Smart Features</div>
      <a class="nav-item" onclick="Chatbot.openWithMessage('Why is my risk high?'); return false;" href="#">
        <i class="fas fa-robot"></i>
        <span>EduGuard AI Bot</span>
      </a>
      <a class="nav-item" onclick="UI.openComplaintModal(); return false;" href="#">
        <i class="fas fa-bullhorn"></i>
        <span>Report Facility Issue</span>
      </a>
      <a class="nav-item nav-item-sos" onclick="Emergency.open(); return false;" href="#" style="color: #ef4444;">
        <i class="fas fa-shield-heart" style="color: #ef4444;"></i>
        <span>Emergency Help (SOS)</span>
        <span class="nav-badge" style="background: #ef4444; color: #fff;">112</span>
      </a>
    `;

    navEl.innerHTML = modulesHtml;

    // Rebind click events
    navEl.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigateTo(view);
      });
    });
  },

  navigateTo(view) {
    const user = API.getUser();
    // Prevent student from accessing faculty mentorship or admin
    if (user && user.role === 'STUDENT' && (view === 'faculty' || view === 'admin')) {
      UI.toast('Access Denied: Students are not authorized to access administrative workspaces.', 'error');
      view = 'student';
    } else if (user && user.role === 'FACULTY' && (view === 'admin' || view === 'student')) {
      UI.toast('Access Denied: This workspace is not available for Faculty.', 'error');
      view = 'faculty';
    } else if (user && user.role === 'ADMIN' && view === 'student') {
      UI.toast('Redirected to Campus Operations.', 'info');
      view = 'complaints';
    } else if (user && (user.role === 'DEPARTMENT_STAFF' || user.role === 'DEPARTMENT_HEAD') && (view === 'faculty' || view === 'student')) {
      if (view === 'admin' && user.role === 'DEPARTMENT_HEAD') {
        // allow department head into admin analytics
      } else {
        UI.toast('Redirected to Department Complaint Operations.', 'info');
        view = 'complaints';
      }
    }
    window.currentView = view;
    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
      if (item.getAttribute('data-view') === view) item.classList.add('active');
      else item.classList.remove('active');
    });

    // Close mobile sidebar if open
    document.querySelector('.app-sidebar')?.classList.remove('open');
    this.renderCurrentView();
  },

  renderCurrentView() {
    const container = document.getElementById('main-view-container');
    const viewTitle = document.getElementById('topbar-view-title');
    if (!container) return;

    if (window.currentView === 'student') {
      if (viewTitle) viewTitle.innerText = 'Student Academic & Campus Portal';
      StudentView.render(container);
    } else if (window.currentView === 'faculty') {
      if (viewTitle) viewTitle.innerText = 'Faculty Academic Mentorship & Intervention';
      FacultyView.render(container);
    } else if (window.currentView === 'complaints') {
      if (viewTitle) viewTitle.innerText = 'Smart Campus Complaints & Resolution';
      ComplaintsView.render(container);
    } else if (window.currentView === 'admin') {
      if (viewTitle) viewTitle.innerText = 'Campus Executive Analytics & Administration';
      AdminView.render(container);
    }
  },

  refreshCurrentView() {
    this.renderCurrentView();
  },

  async toggleNotificationsDrawer() {
    const badge = document.getElementById('notif-badge');
    if (badge) badge.style.display = 'none';

    UI.showModal({
      title: 'Real-Time Notification Feed',
      body: '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i></div>'
    });

    try {
      const res = await API.getNotifications();
      const notifs = res.notifications || [];

      let content = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">${notifs.length} total alerts</span>
          <button id="btn-mark-all-read" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">Mark all as read</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto;">
          ${notifs.map(n => `
            <div style="background: var(--bg-input); border-left: 3px solid ${n.isRead ? 'var(--text-muted)' : 'var(--primary)'}; border-radius: 4px; padding: 10px; font-size: 0.8rem;">
              <div style="display: flex; justify-content: space-between; font-weight: 700;">
                <span>${n.title}</span>
                <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">${new Date(n.createdAt).toLocaleTimeString()}</span>
              </div>
              <div style="color: var(--text-secondary); margin-top: 2px;">${n.message}</div>
            </div>
          `).join('')}
          ${notifs.length === 0 ? '<div style="text-align: center; color: var(--text-muted); padding: 20px;">No notifications yet.</div>' : ''}
        </div>
      `;

      UI.updateModalBody(content);

      document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
        await API.markAllNotificationsRead();
        UI.toast('All notifications marked as read', 'success');
        UI.closeModal();
      });

    } catch (e) {
      UI.updateModalBody(`<div style="color: var(--risk-critical);">${e.message}</div>`);
    }
  }
};

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
