/**
 * Admin Analytics & Management View Renderer
 */
const AdminView = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
          <p style="margin-top: 12px; color: var(--text-secondary);">Loading Campus-Wide Executive Dashboard...</p>
        </div>
      </div>
    `;

    try {
      const [academicRes, campusRes, auditRes, complaintsRes] = await Promise.all([
        API.getAcademicAnalytics(),
        API.getCampusAnalytics(),
        API.getAdminAuditLogs(),
        API.getComplaints()
      ]);

      const acad = academicRes.summary;
      const camp = campusRes.summary;
      const logs = auditRes.logs || [];
      const allComplaints = complaintsRes.complaints || [];

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Institution Executive Command Center 🛡️</h2>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Comprehensive analytics across student academic health and smart campus facilities.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="/api/analytics/export/academic" target="_blank" class="btn btn-secondary btn-sm">
              <i class="fas fa-file-csv"></i> Export Academic CSV
            </a>
            <a href="/api/analytics/export/campus" target="_blank" class="btn btn-secondary btn-sm">
              <i class="fas fa-file-excel"></i> Export Complaints CSV
            </a>
          </div>
        </div>

        <!-- 4 Global KPI Cards -->
        <div class="metrics-grid">
          <div class="stat-card">
            <div>
              <div class="stat-title">Total Enrolled Students</div>
              <div class="stat-value">${acad.totalStudents}</div>
              <div class="stat-meta">Attendance Avg: ${acad.overallAttendance}%</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-graduation-cap"></i>
            </div>
          </div>

          <div class="stat-card risk-high">
            <div>
              <div class="stat-title">At-Risk Cohort Ratio</div>
              <div class="stat-value" style="color: var(--risk-high);">${acad.atRiskPercentage}%</div>
              <div class="stat-meta">${acad.riskDistribution.high + acad.riskDistribution.critical} students flagged</div>
            </div>
            <div class="stat-icon-wrapper" style="background: var(--risk-high-bg); color: var(--risk-high);">
              <i class="fas fa-chart-pie"></i>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-title">Campus Complaints</div>
              <div class="stat-value">${camp.totalComplaints}</div>
              <div class="stat-meta">${camp.open} Open, ${camp.inProgress} In-Progress</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-city"></i>
            </div>
          </div>

          <div class="stat-card risk-low">
            <div>
              <div class="stat-title">SLA Compliance Rate</div>
              <div class="stat-value" style="color: var(--risk-low);">${camp.slaComplianceRate}%</div>
              <div class="stat-meta">${camp.slaBreached} breaches recorded</div>
            </div>
            <div class="stat-icon-wrapper" style="background: var(--risk-low-bg); color: var(--risk-low);">
              <i class="fas fa-award"></i>
            </div>
          </div>
        </div>

        <!-- Analytics Charts Grid -->
        <div class="grid-2">
          <!-- Academic Risk Cohort Distribution -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fas fa-pie-chart" style="color: var(--primary);"></i> Student Risk Distribution</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Cohort Breakdown</div>
            </div>
            <div style="height: 250px; display: flex; align-items: center; justify-content: center;">
              <canvas id="adminRiskDistributionChart"></canvas>
            </div>
          </div>

          <!-- Campus Complaints by Category -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fas fa-chart-bar" style="color: var(--risk-high);"></i> Complaints by Facility Category</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Campus Infrastructure</div>
            </div>
            <div style="height: 250px;">
              <canvas id="adminComplaintsCategoryChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Campus Location Matrix Visualizer -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="fas fa-map-location-dot" style="color: var(--primary);"></i> Campus Issue Spatial Visualizer</div>
              <div class="card-subtitle">Active reported incidents mapped across campus academic blocks</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            ${['Block A', 'Block B', 'Block C'].map(block => {
              const blockComplaints = allComplaints.filter(c => c.block === block);
              const activeCount = blockComplaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'STUDENT_CONFIRMED').length;
              return `
                <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong style="font-size: 1.05rem;">${block}</strong>
                    <span class="status-pill ${activeCount > 0 ? 'IN_PROGRESS' : 'RESOLVED'}">
                      ${activeCount} Active Issues
                    </span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${blockComplaints.slice(0, 3).map(c => `
                      <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; font-size: 0.75rem; display: flex; justify-content: space-between;">
                        <span>${c.room}: <strong>${c.title}</strong></span>
                        <span class="risk-badge ${c.priority}" style="padding: 1px 6px; font-size: 0.65rem;">${c.priority}</span>
                      </div>
                    `).join('')}
                    ${blockComplaints.length === 0 ? '<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">All facilities operating normally.</div>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Audit Trail Explorer -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="fas fa-clock-rotate-left"></i> Real-Time System Audit Log</div>
              <div class="card-subtitle">Immutable compliance records of logins, risk evaluations, and complaint lifecycle events</div>
            </div>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                ${logs.slice(0, 15).map(l => `
                  <tr>
                    <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(l.timestamp).toLocaleTimeString()}</td>
                    <td><span class="status-pill AI_ANALYZED" style="font-size: 0.7rem;">${l.action}</span></td>
                    <td>${l.entity}</td>
                    <td><strong>${l.actor?.name || 'System / AI'}</strong></td>
                    <td style="font-size: 0.75rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;">
                      ${JSON.stringify(l.metadata || {})}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Campus Emergency & Safety Contacts Configuration (Admin Mode) -->
        <div class="card" id="admin-emergency-contacts-card" style="border-top: 3px solid #ef4444;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <div class="card-title" style="color: #ef4444; font-size: 1.15rem; font-weight: 800;">
                <i class="fas fa-shield-heart"></i> Campus Emergency Response &amp; Safety Contacts Configuration
              </div>
              <div class="card-subtitle">
                Configure verified campus doctor, medical center, fire safety, campus security, and national ERSS 112 services for all users
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button id="btn-admin-reset-contacts" class="btn btn-secondary btn-sm" title="Restore defaults">
                <i class="fas fa-rotate-left"></i> Reset Defaults
              </button>
              <button id="btn-admin-add-contact" class="btn btn-primary btn-sm" style="background: #ef4444; border-color: #ef4444;">
                <i class="fas fa-plus"></i> Add Emergency Contact
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Contact Name</th>
                  <th>Department / Role</th>
                  <th>Phone Number</th>
                  <th>Availability</th>
                  <th>Campus Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="admin-emergency-contacts-tbody">
                <!-- Rendered dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Render Charts & Emergency Contacts
      AdminView.initCharts(acad.riskDistribution, campusRes.categoryStats || {});
      AdminView.renderEmergencyContacts();

    } catch (err) {
      container.innerHTML = `<div class="card" style="padding: 40px; text-align: center; color: var(--risk-critical);">${err.message}</div>`;
    }
  },

  initCharts(riskDist, catStats) {
    // 1. Risk Distribution Doughnut
    const riskCtx = document.getElementById('adminRiskDistributionChart')?.getContext('2d');
    if (riskCtx) {
      new Chart(riskCtx, {
        type: 'doughnut',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
          datasets: [{
            data: [riskDist.low || 1, riskDist.medium || 0, riskDist.high || 1, riskDist.critical || 1],
            backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
            borderWidth: 2,
            borderColor: '#111827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12 } }
          }
        }
      });
    }

    // 2. Complaints by Category Bar Chart
    const catCtx = document.getElementById('adminComplaintsCategoryChart')?.getContext('2d');
    if (catCtx) {
      const labels = Object.keys(catStats);
      const values = Object.values(catStats);

      new Chart(catCtx, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['Wi-Fi & Network', 'Classroom Equipment', 'Electrical'],
          datasets: [{
            label: 'Complaints',
            data: values.length > 0 ? values : [2, 1, 0],
            backgroundColor: '#6366f1',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  },

  renderEmergencyContacts() {
    const tbody = document.getElementById('admin-emergency-contacts-tbody');
    if (!tbody || typeof Emergency === 'undefined') return;

    const contacts = Emergency.contacts || [];

    tbody.innerHTML = contacts.map(c => `
      <tr>
        <td>
          <span class="emergency-admin-badge ${c.isActive ? 'active' : 'inactive'}">
            <i class="fas ${c.icon || 'fa-phone'}"></i> ${c.badge || c.category}
          </span>
        </td>
        <td><strong>${c.name}</strong></td>
        <td>${c.role}</td>
        <td><code style="color: #ef4444; font-weight: 700;">${c.phone}</code></td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${c.availability}</td>
        <td style="font-size: 0.8rem;">${c.location}</td>
        <td>
          <button class="btn btn-sm ${c.isActive ? 'btn-success' : 'btn-outline'}" style="font-size: 0.72rem; padding: 2px 8px;" onclick="AdminView.toggleContactStatus('${c.id}')">
            ${c.isActive ? '🟢 Active' : '⚪ Disabled'}
          </button>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 4px 8px;" onclick="AdminView.openEditContactModal('${c.id}')">
            <i class="fas fa-pen-to-square"></i> Edit
          </button>
        </td>
      </tr>
    `).join('');

    // Bind Add button
    document.getElementById('btn-admin-add-contact')?.addEventListener('click', () => {
      AdminView.openEditContactModal(null);
    });

    // Bind Reset button
    document.getElementById('btn-admin-reset-contacts')?.addEventListener('click', () => {
      if (confirm('Reset emergency contacts to campus institutional defaults?')) {
        Emergency.contacts = [...Emergency.defaultContacts];
        Emergency.saveContacts();
        AdminView.renderEmergencyContacts();
        Emergency.renderEmergencyPanel();
        UI.toast('Emergency contacts reset to defaults', 'success');
      }
    });
  },

  toggleContactStatus(id) {
    if (typeof Emergency === 'undefined') return;
    const contact = Emergency.contacts.find(c => c.id === id);
    if (contact) {
      contact.isActive = !contact.isActive;
      Emergency.saveContacts();
      AdminView.renderEmergencyContacts();
      Emergency.renderEmergencyPanel();
      UI.toast(`Contact "${contact.name}" is now ${contact.isActive ? 'Active' : 'Disabled'}`, 'info');
    }
  },

  openEditContactModal(contactId) {
    if (typeof Emergency === 'undefined') return;
    const contact = contactId ? Emergency.contacts.find(c => c.id === contactId) : null;
    const isNew = !contact;

    UI.showModal({
      title: isNew ? 'Add Campus Emergency Contact' : `Edit Contact: ${contact.name}`,
      body: `
        <form id="form-edit-emergency-contact" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="ec-category" class="form-control" style="background: var(--bg-card); color: var(--text-primary);">
              <option value="MEDICAL" ${contact?.category === 'MEDICAL' ? 'selected' : ''}>Campus Doctor / Medical</option>
              <option value="AMBULANCE" ${contact?.category === 'AMBULANCE' ? 'selected' : ''}>Campus Ambulance</option>
              <option value="SECURITY" ${contact?.category === 'SECURITY' ? 'selected' : ''}>Campus Security / QRT</option>
              <option value="FIRE" ${contact?.category === 'FIRE' ? 'selected' : ''}>Fire & Hazard Safety</option>
              <option value="NATIONAL_EMERGENCY" ${contact?.category === 'NATIONAL_EMERGENCY' ? 'selected' : ''}>National Emergency (112)</option>
              <option value="POLICE" ${contact?.category === 'POLICE' ? 'selected' : ''}>Police Assistance</option>
              <option value="SAFETY_CELL" ${contact?.category === 'SAFETY_CELL' ? 'selected' : ''}>Student Safety Helpline</option>
              <option value="OTHER" ${contact?.category === 'OTHER' ? 'selected' : ''}>Other Emergency Contact</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Contact Name *</label>
            <input type="text" id="ec-name" class="form-control" value="${contact?.name || ''}" placeholder="e.g. Dr. Ananya Sen" required />
          </div>

          <div class="form-group">
            <label class="form-label">Department / Official Role *</label>
            <input type="text" id="ec-role" class="form-control" value="${contact?.role || ''}" placeholder="e.g. Campus Medical Officer" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div class="form-group">
              <label class="form-label">Emergency Phone Number *</label>
              <input type="text" id="ec-phone" class="form-control" value="${contact?.phone || ''}" placeholder="e.g. +91 11-2345-6789 or 112" required />
            </div>
            <div class="form-group">
              <label class="form-label">Availability Hours *</label>
              <input type="text" id="ec-avail" class="form-control" value="${contact?.availability || ''}" placeholder="e.g. 24/7 or 8 AM - 8 PM" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Campus Physical Location *</label>
            <input type="text" id="ec-loc" class="form-control" value="${contact?.location || ''}" placeholder="e.g. Health Centre, Ground Floor, Block A" required />
          </div>

          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <input type="checkbox" id="ec-active" ${contact?.isActive !== false ? 'checked' : ''} />
            <label for="ec-active" style="font-size: 0.85rem; cursor: pointer;">Active (Visible to students & staff)</label>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-save-emergency-contact" style="background: #ef4444; border-color: #ef4444;">
          ${isNew ? 'Create Contact' : 'Save Changes'}
        </button>
      `
    });

    document.getElementById('btn-save-emergency-contact')?.addEventListener('click', () => {
      const name = document.getElementById('ec-name')?.value?.trim();
      const role = document.getElementById('ec-role')?.value?.trim();
      const phone = document.getElementById('ec-phone')?.value?.trim();
      const avail = document.getElementById('ec-avail')?.value?.trim();
      const loc = document.getElementById('ec-loc')?.value?.trim();
      const cat = document.getElementById('ec-category')?.value;
      const isActive = document.getElementById('ec-active')?.checked;

      if (!name || !phone) {
        UI.toast('Please provide contact name and phone number', 'error');
        return;
      }

      if (isNew) {
        const newContact = {
          id: 'contact-' + Date.now(),
          category: cat,
          name,
          role,
          phone,
          availability: avail || '24/7',
          location: loc || 'Campus Facility',
          isActive: isActive !== false,
          badge: cat.replace('_', ' '),
          icon: cat === 'MEDICAL' ? 'fa-user-doctor' : cat === 'FIRE' ? 'fa-fire' : cat === 'SECURITY' ? 'fa-shield-dog' : 'fa-phone'
        };
        Emergency.contacts.push(newContact);
      } else {
        contact.name = name;
        contact.role = role;
        contact.phone = phone;
        contact.availability = avail;
        contact.location = loc;
        contact.category = cat;
        contact.isActive = isActive;
        contact.badge = cat.replace('_', ' ');
      }

      Emergency.saveContacts();
      AdminView.renderEmergencyContacts();
      Emergency.renderEmergencyPanel();
      UI.toast(`Emergency contact ${name} saved successfully`, 'success');
      UI.closeModal();
    });
  }
};
