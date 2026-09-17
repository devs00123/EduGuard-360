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

    // Check if user is logged in, else auto demo-login as Student Rahul Sharma for seamless evaluator experience
    let user = API.getUser();
    if (!user || !API.getToken()) {
      await this.switchRole('STUDENT');
    } else {
      this.updateUserUI(user);
      this.renderCurrentView();
    }

    SocketClient.init();
    Chatbot.init();
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
  },

  async switchRole(role) {
    try {
      UI.toast(`Switching perspective to ${role.replace('_', ' ')}...`, 'info');
      const res = await API.demoLogin(role);
      API.setToken(res.token);
      API.setUser(res.user);

      // Update active pill
      document.querySelectorAll('.demo-pill').forEach(p => {
        if (p.getAttribute('data-role') === role) p.classList.add('active');
        else p.classList.remove('active');
      });

      this.updateUserUI(res.user);

      // Route to role-specific home view
      if (role === 'STUDENT') window.currentView = 'student';
      else if (role === 'FACULTY') window.currentView = 'faculty';
      else if (role === 'DEPARTMENT_STAFF' || role === 'DEPARTMENT_HEAD') window.currentView = 'complaints';
      else if (role === 'ADMIN') window.currentView = 'admin';

      SocketClient.init();
      this.renderCurrentView();
      UI.toast(`Logged in as ${res.user.name} (${res.user.role})`, 'success');
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

    // Update active nav pill in demo bar
    document.querySelectorAll('.demo-pill').forEach(p => {
      if (p.getAttribute('data-role') === user.role) p.classList.add('active');
      else p.classList.remove('active');
    });
  },

  navigateTo(view) {
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
