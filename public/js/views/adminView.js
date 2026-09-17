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
      `;

      // Render Charts
      AdminView.initCharts(acad.riskDistribution, campusRes.categoryStats || {});

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
  }
};
