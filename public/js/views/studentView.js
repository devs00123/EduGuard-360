/**
 * Student Dashboard View Renderer
 */
const StudentView = {
  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
          <p style="margin-top: 12px; color: var(--text-secondary);">Loading your academic 360 profile...</p>
        </div>
      </div>
    `;

    try {
      const [riskRes, attRes, marksRes, asgRes, insightsRes] = await Promise.all([
        API.getStudentRisk(),
        API.getStudentAttendance(),
        API.getStudentMarks(),
        API.getStudentAssignments(),
        API.getStudentSupportInsights()
      ]);

      const assessment = riskRes.assessment;
      const attStats = attRes.stats;
      const marksStats = marksRes;
      const asgStats = asgRes.stats;
      const insights = insightsRes;

      const riskColor = assessment.riskLevel === 'LOW' ? 'var(--risk-low)'
        : assessment.riskLevel === 'MEDIUM' ? 'var(--risk-medium)'
        : assessment.riskLevel === 'HIGH' ? 'var(--risk-high)' : 'var(--risk-critical)';

      container.innerHTML = `
        <!-- Top Action Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Welcome back, ${API.getUser()?.name || 'Student'}! 👋</h2>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Your real-time academic risk evaluation & campus support overview.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="btn-recalculate-risk" class="btn btn-secondary btn-sm" title="Re-evaluate academic risk engine">
              <i class="fas fa-sync-alt"></i> Recalculate Risk
            </button>
            <button id="btn-open-complaint-modal" class="btn btn-primary btn-sm">
              <i class="fas fa-bullhorn"></i> Report Campus Issue
            </button>
            <button id="btn-quick-ask-ai" class="btn btn-secondary btn-sm" style="background: var(--primary-gradient); color: #fff; border: none;">
              <i class="fas fa-robot"></i> Ask EduGuard AI
            </button>
          </div>
        </div>

        <!-- Academic Risk Hero Gauge Card -->
        <div class="risk-hero-card">
          <div class="risk-gauge-container">
            <div class="risk-gauge-wrapper">
              <canvas id="riskGaugeChart"></canvas>
              <div class="risk-gauge-center">
                <div class="risk-score-number" style="color: ${riskColor};">${assessment.riskScore}</div>
                <div class="risk-score-denom">/ 100</div>
              </div>
            </div>
            <div class="risk-badge ${assessment.riskLevel}">
              <i class="fas fa-shield-alt"></i> ${assessment.riskLevel} RISK
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 6px;">
              Engine: <strong>${assessment.aiMetadata?.engine || 'Explainable AI'}</strong>
            </div>
          </div>

          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px;">Explainable Risk Diagnostic</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px;">
              ${assessment.explanation}
            </p>

            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${assessment.contributingFactors.map(f => `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: ${f.severity === 'CRITICAL' ? 'var(--risk-critical)' : f.severity === 'HIGH' ? 'var(--risk-high)' : 'var(--risk-medium)'};"></span>
                    <div>
                      <div style="font-size: 0.825rem; font-weight: 600;">${f.factor}</div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">${f.detail || ''}</div>
                    </div>
                  </div>
                  <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">+${f.impactScore} pts</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- 4 Key Academic Indicator Cards -->
        <div class="metrics-grid">
          <div class="stat-card ${attStats.overallPercentage < 75 ? 'risk-high' : 'risk-low'}">
            <div>
              <div class="stat-title">Overall Attendance</div>
              <div class="stat-value" style="color: ${attStats.overallPercentage < 75 ? 'var(--risk-high)' : 'var(--risk-low)'};">
                ${attStats.overallPercentage}%
              </div>
              <div class="stat-meta">
                ${attStats.present} Present / ${attStats.total} Total lectures
              </div>
            </div>
            <div class="stat-icon-wrapper" style="background: ${attStats.overallPercentage < 75 ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)'}; color: ${attStats.overallPercentage < 75 ? 'var(--risk-high)' : 'var(--risk-low)'};">
              <i class="fas fa-calendar-check"></i>
            </div>
          </div>

          <div class="stat-card ${marksStats.average < 50 ? 'risk-high' : 'risk-low'}">
            <div>
              <div class="stat-title">Internal Marks Avg</div>
              <div class="stat-value" style="color: ${marksStats.average < 50 ? 'var(--risk-high)' : 'var(--risk-low)'};">
                ${marksStats.average}%
              </div>
              <div class="stat-meta">Across ${marksStats.totalAssessments} subjects</div>
            </div>
            <div class="stat-icon-wrapper" style="background: ${marksStats.average < 50 ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)'}; color: ${marksStats.average < 50 ? 'var(--risk-high)' : 'var(--risk-low)'};">
              <i class="fas fa-chart-line"></i>
            </div>
          </div>

          <div class="stat-card ${asgStats.completionRate < 75 ? 'risk-high' : 'risk-low'}">
            <div>
              <div class="stat-title">Assignments Rate</div>
              <div class="stat-value" style="color: ${asgStats.completionRate < 75 ? 'var(--risk-high)' : 'var(--risk-low)'};">
                ${asgStats.completionRate}%
              </div>
              <div class="stat-meta">${asgStats.completed} Completed, ${asgStats.pending} Pending</div>
            </div>
            <div class="stat-icon-wrapper" style="background: ${asgStats.completionRate < 75 ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)'}; color: ${asgStats.completionRate < 75 ? 'var(--risk-high)' : 'var(--risk-low)'};">
              <i class="fas fa-tasks"></i>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-title">Performance Trend</div>
              <div class="stat-value" style="font-size: 1.35rem; color: ${assessment.metrics?.performanceTrend === 'DECLINING' ? 'var(--risk-high)' : 'var(--risk-low)'};">
                ${assessment.metrics?.performanceTrend || 'STABLE'}
              </div>
              <div class="stat-meta">CGPA: ${assessment.metrics?.cgpa || '7.03'}</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas ${assessment.metrics?.performanceTrend === 'DECLINING' ? 'fa-arrow-trend-down' : 'fa-arrow-trend-up'}"></i>
            </div>
          </div>
        </div>

        <!-- Combined Student Success & Support Context -->
        <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--primary);">
          <div class="card-header">
            <div>
              <div class="card-title">
                <i class="fas fa-hand-holding-heart" style="color: var(--primary);"></i> Student Success & Campus Support Context
              </div>
              <div class="card-subtitle">Synthesizing academic health with your campus environment</div>
            </div>
            <span class="status-pill AI_ANALYZED">Contextual View</span>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 14px;">
            ${insights.campusSupportContext.contextSummary}
          </p>

          ${insights.campusSupportContext.issues.length > 0 ? `
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              ${insights.campusSupportContext.issues.map(iss => `
                <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px 14px; font-size: 0.8rem; display: flex; align-items: center; gap: 10px;">
                  <i class="fas fa-tools" style="color: var(--risk-high);"></i>
                  <div>
                    <strong>${iss.ticketId}</strong>: ${iss.title} (${iss.location})
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Status: ${iss.status} | Academic Impact: ${iss.academicImpact}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">
              No unresolved campus facility complaints associated with your active academic locations.
            </div>
          `}
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px;">
            ℹ️ <em>Note: Campus facility incidents are presented strictly as relevant support context.</em>
          </div>
        </div>

        <!-- Personalized Action Plan Checklist -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="fas fa-clipboard-check" style="color: var(--risk-low);"></i> Personalized Improvement Plan</div>
              <div class="card-subtitle">AI-recommended steps tailored to your academic gaps</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${assessment.recommendations.map((rec, idx) => `
              <div style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8rem; flex-shrink: 0;">
                  ${idx + 1}
                </div>
                <div style="flex-grow: 1;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.875rem;">${rec.title}</strong>
                    <span style="font-size: 0.7rem; background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 2px 8px; border-radius: 12px; font-weight: 600;">
                      ${rec.category}
                    </span>
                  </div>
                  <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-top: 4px;">${rec.action}</p>
                  ${rec.targetMetric ? `<div style="font-size: 0.75rem; color: var(--risk-low); font-weight: 600; margin-top: 4px;">🎯 Goal: ${rec.targetMetric}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Charts: Subject Attendance & Internal Marks Breakdown -->
        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fas fa-chart-bar" style="color: var(--primary);"></i> Subject Attendance Analysis</div>
              <div style="font-size: 0.75rem; color: var(--risk-critical); font-weight: 600;">75% Benchmark Target</div>
            </div>
            <div style="height: 260px;">
              <canvas id="studentAttendanceChart"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fas fa-chart-column" style="color: #8b5cf6;"></i> Internal Assessment Scores</div>
              <div style="font-size: 0.75rem; color: var(--risk-critical); font-weight: 600;">Passing: 50%</div>
            </div>
            <div style="height: 260px;">
              <canvas id="studentMarksChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Assignments List Table -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-book-open" style="color: var(--primary);"></i> Coursework & Assignment Submissions</div>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${asgStats.pending} tasks pending</span>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Assignment Title</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                ${asgRes.assignments.map(a => `
                  <tr>
                    <td><strong>${a.title}</strong></td>
                    <td>${a.subject?.name || 'CSE Core'}</td>
                    <td>${new Date(a.dueDate).toLocaleDateString()}</td>
                    <td>
                      <span class="status-pill ${a.submissionStatus}">
                        ${a.submissionStatus}
                      </span>
                    </td>
                    <td>${a.score != null ? `${a.score} / 10` : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Render Charts
      this.initCharts(assessment, attRes.subjectWise, marksRes.marks);

      // Event Listeners
      document.getElementById('btn-recalculate-risk')?.addEventListener('click', async () => {
        UI.toast('Recalculating academic risk with latest data...', 'info');
        await API.getStudentRisk(true);
        StudentView.render(container);
        UI.toast('Risk recalculated successfully!', 'success');
      });

      document.getElementById('btn-open-complaint-modal')?.addEventListener('click', () => {
        UI.openComplaintModal();
      });

      document.getElementById('btn-quick-ask-ai')?.addEventListener('click', () => {
        Chatbot.openWithMessage('Why is my risk high?');
      });

    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--risk-critical); margin-bottom: 16px;"></i>
          <h3>Failed to load student dashboard</h3>
          <p style="color: var(--text-secondary); margin-top: 8px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.renderCurrentView()" style="margin-top: 16px;">Retry</button>
        </div>
      `;
    }
  },

  initCharts(assessment, subjectWiseAtt = [], marks = []) {
    // 1. Semi-Doughnut Risk Gauge
    const gaugeCtx = document.getElementById('riskGaugeChart')?.getContext('2d');
    if (gaugeCtx) {
      const score = assessment.riskScore;
      const remainder = 100 - score;
      const riskColor = assessment.riskLevel === 'LOW' ? '#10b981'
        : assessment.riskLevel === 'MEDIUM' ? '#f59e0b'
        : assessment.riskLevel === 'HIGH' ? '#f97316' : '#ef4444';

      new Chart(gaugeCtx, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [score, remainder],
            backgroundColor: [riskColor, 'rgba(148, 163, 184, 0.2)'],
            borderWidth: 0,
            circumference: 240,
            rotation: 240
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '80%',
          plugins: {
            tooltip: { enabled: false }
          }
        }
      });
    }

    // 2. Attendance Bar Chart
    const attCtx = document.getElementById('studentAttendanceChart')?.getContext('2d');
    if (attCtx && subjectWiseAtt.length > 0) {
      new Chart(attCtx, {
        type: 'bar',
        data: {
          labels: subjectWiseAtt.map(s => s.subjectCode || s.subjectName.split(' ')[0]),
          datasets: [
            {
              label: 'Attendance %',
              data: subjectWiseAtt.map(s => s.percentage),
              backgroundColor: subjectWiseAtt.map(s => s.percentage < 75 ? '#f97316' : '#6366f1'),
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 3. Internal Marks Bar Chart
    const marksCtx = document.getElementById('studentMarksChart')?.getContext('2d');
    if (marksCtx && marks.length > 0) {
      new Chart(marksCtx, {
        type: 'bar',
        data: {
          labels: marks.map(m => m.subject?.code || 'CS'),
          datasets: [{
            label: 'Score %',
            data: marks.map(m => m.percentage),
            backgroundColor: marks.map(m => m.percentage < 50 ? '#ef4444' : '#10b981'),
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(255,255,255,0.05)' }
            },
            x: {
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }
};
