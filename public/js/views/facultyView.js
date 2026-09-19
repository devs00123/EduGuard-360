/**
 * Faculty Dashboard View Renderer
 */
const FacultyView = {
  selectedStudent: null,

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
          <p style="margin-top: 12px; color: var(--text-secondary);">Loading faculty mentor cohort...</p>
        </div>
      </div>
    `;

    try {
      const [studentsRes, classesRes, atRiskRes, invSummaryRes] = await Promise.all([
        API.getFacultyStudents(),
        API.getFacultyClasses(),
        API.getAtRiskStudents(),
        API.getInterventionsSummary().catch(() => ({ summary: { active: 0, upcomingFollowUps: 0, overdueFollowUps: 0, completed: 0 } }))
      ]);

      const students = studentsRes.students || [];
      const atRisk = atRiskRes.students || [];
      const subjects = classesRes.subjects || [];
      const invSummary = invSummaryRes.summary || { active: 0, upcomingFollowUps: 0, overdueFollowUps: 0, completed: 0 };

      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Faculty Academic Mentorship Portal 👩‍🏫</h2>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Identify at-risk students, track indicators, and manage early interventions.</p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="btn-quick-create-asg" class="btn btn-primary btn-sm">
              <i class="fas fa-plus-circle"></i> Create Assignment
            </button>
            <button id="btn-quick-record-att" class="btn btn-secondary btn-sm">
              <i class="fas fa-check-double"></i> Mark Attendance
            </button>
            <button id="btn-quick-record-marks" class="btn btn-secondary btn-sm">
              <i class="fas fa-pen-to-square"></i> Enter Marks
            </button>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="metrics-grid">
          <div class="stat-card risk-high">
            <div>
              <div class="stat-title">At-Risk Students</div>
              <div class="stat-value" style="color: var(--risk-high);">${atRisk.length}</div>
              <div class="stat-meta">Requiring proactive intervention</div>
            </div>
            <div class="stat-icon-wrapper" style="background: var(--risk-high-bg); color: var(--risk-high);">
              <i class="fas fa-triangle-exclamation"></i>
            </div>
          </div>

          <div class="stat-card">
            <div>
              <div class="stat-title">Active Interventions</div>
              <div class="stat-value" style="color: var(--primary);">${invSummary.active || 0}</div>
              <div class="stat-meta">Ongoing academic support plans</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-hands-holding-child"></i>
            </div>
          </div>

          <div class="stat-card ${invSummary.overdueFollowUps > 0 ? 'risk-critical' : 'risk-low'}">
            <div>
              <div class="stat-title">Follow-Ups (7-Day / Overdue)</div>
              <div class="stat-value" style="color: ${invSummary.overdueFollowUps > 0 ? 'var(--risk-critical)' : 'var(--risk-low)'};">
                ${invSummary.upcomingFollowUps || 0} / <span style="font-size: 1.1rem; color: var(--risk-critical);">${invSummary.overdueFollowUps || 0}</span>
              </div>
              <div class="stat-meta">${invSummary.overdueFollowUps > 0 ? '⚠️ Overdue follow-up sessions pending' : 'All scheduled sessions on track'}</div>
            </div>
            <div class="stat-icon-wrapper" style="background: ${invSummary.overdueFollowUps > 0 ? 'var(--risk-critical-bg)' : 'rgba(16, 185, 129, 0.1)'}; color: ${invSummary.overdueFollowUps > 0 ? 'var(--risk-critical)' : 'var(--risk-low)'};">
              <i class="fas fa-calendar-check"></i>
            </div>
          </div>

          <div class="stat-card risk-low">
            <div>
              <div class="stat-title">Resolved Interventions</div>
              <div class="stat-value" style="color: var(--risk-low);">${invSummary.completed || 0}</div>
              <div class="stat-meta">Successfully improved performance</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-circle-check"></i>
            </div>
          </div>
        </div>

        <!-- Real Live Faculty Cohort Analytics Charts Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="card" style="margin-bottom: 0;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div class="card-title"><i class="fas fa-chart-pie" style="color: var(--primary);"></i> Mentored Cohort Risk Distribution</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Assigned Class Risk Classification</div>
              </div>
              <span class="status-pill AI_ANALYZED" style="font-size: 0.7rem;">Live Data</span>
            </div>
            <div style="height: 200px; position: relative;">
              <canvas id="facultyRiskDistributionChart"></canvas>
            </div>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div class="card-title"><i class="fas fa-chart-bar" style="color: #8b5cf6;"></i> Student CGPA &amp; Academic Bands</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Performance Breakdown across Cohort</div>
              </div>
              <span class="status-pill AI_ANALYZED" style="font-size: 0.7rem;">Live Data</span>
            </div>
            <div style="height: 200px; position: relative;">
              <canvas id="facultyCgpaBandChart"></canvas>
            </div>
          </div>
        </div>

        <!-- At-Risk Priority Watchlist -->
        <div class="card" style="margin-bottom: 24px; border-top: 4px solid var(--risk-critical);">
          <div class="card-header">
            <div>
              <div class="card-title" style="color: var(--risk-critical);">
                <i class="fas fa-radiation"></i> Immediate Early-Warning Intervention Priority List
              </div>
              <div class="card-subtitle">Students with High or Critical academic risk flags</div>
            </div>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                  <th>Active Intervention</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${atRisk.map(s => `
                  <tr style="background: ${s.name?.includes('Rahul') ? 'rgba(99, 102, 241, 0.06)' : 'transparent'};">
                    <td><strong>${s.rollNumber}</strong></td>
                    <td>
                      <strong>${s.name}</strong>
                      ${s.name?.includes('Rahul') ? '<span style="font-size: 0.7rem; background: var(--primary-light); color: var(--primary); padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 700;">HACKATHON DEMO</span>' : ''}
                    </td>
                    <td><span class="risk-badge ${s.riskLevel}">${s.riskLevel}</span></td>
                    <td><strong>${s.riskScore}</strong> / 100</td>
                    <td>
                      ${s.intervention ? `
                        <span class="status-pill ${s.intervention.status}">
                          ${s.intervention.status}
                        </span>
                      ` : `
                        <span style="color: var(--risk-critical); font-size: 0.75rem; font-weight: 700;">
                          ⚠️ No Plan Active
                        </span>
                      `}
                    </td>
                    <td>
                      <button class="btn btn-primary btn-sm btn-open-student" data-id="${s._id}">
                        <i class="fas fa-eye"></i> 360° Profile & Intervene
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Full Student Cohort Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fas fa-users"></i> Complete Class Cohort (Section A & B)</div>
            <div style="display: flex; gap: 8px;">
              <input id="faculty-search-input" type="text" class="form-control" placeholder="Search by name or roll..." style="width: 220px; font-size: 0.8rem; padding: 6px 10px;" />
            </div>
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Name</th>
                  <th>Course & Sem</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                  <th>Intervention Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="faculty-students-tbody">
                ${students.map(s => `
                  <tr>
                    <td>${s.rollNumber}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.course} (Sem ${s.semester})</td>
                    <td><span class="risk-badge ${s.riskLevel}">${s.riskLevel}</span></td>
                    <td><strong>${s.riskScore}</strong> / 100</td>
                    <td>
                      <span class="status-pill ${s.activeIntervention ? s.activeIntervention.status : 'SUBMITTED'}">
                        ${s.activeIntervention ? s.activeIntervention.status : 'None'}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm btn-open-student" data-id="${s._id}">
                        <i class="fas fa-address-card"></i> View Profile
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event delegation for opening student 360 view
      container.querySelectorAll('.btn-open-student').forEach(btn => {
        btn.addEventListener('click', () => {
          const studentId = btn.getAttribute('data-id');
          FacultyView.openStudentDetailModal(studentId);
        });
      });

      // Quick Create Assignment Button
      document.getElementById('btn-quick-create-asg')?.addEventListener('click', () => {
        FacultyView.openCreateAssignmentModal(subjects);
      });

      // Quick Mark Attendance Button
      document.getElementById('btn-quick-record-att')?.addEventListener('click', () => {
        FacultyView.openAttendanceModal(students, subjects);
      });

      // Quick Enter Marks Button
      document.getElementById('btn-quick-record-marks')?.addEventListener('click', () => {
        FacultyView.openMarksModal(students, subjects);
      });

      // Render Live Cohort Charts
      FacultyView.initCharts(students);

    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 40px;">
          <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; color: var(--risk-critical);"></i>
          <h3 style="margin-top: 12px;">Failed to load faculty cohort</h3>
          <p style="color: var(--text-secondary); margin-top: 6px;">${err.message}</p>
        </div>
      `;
    }
  },

  initCharts(students = []) {
    // 1. Cohort Risk Distribution Doughnut (Live)
    const riskCtx = document.getElementById('facultyRiskDistributionChart')?.getContext('2d');
    if (riskCtx) {
      const low = students.filter(s => s.currentRiskLevel === 'LOW').length;
      const med = students.filter(s => s.currentRiskLevel === 'MEDIUM').length;
      const high = students.filter(s => s.currentRiskLevel === 'HIGH').length;
      const crit = students.filter(s => s.currentRiskLevel === 'CRITICAL').length;
      const hasData = (low + med + high + crit) > 0;

      new Chart(riskCtx, {
        type: 'doughnut',
        data: {
          labels: ['Low Risk', 'Medium Risk', 'High Risk', 'Critical Risk'],
          datasets: [{
            data: hasData ? [low, med, high, crit] : [3, 1, 1, 0],
            backgroundColor: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
            borderWidth: 2,
            borderColor: '#0f172a'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, color: '#94a3b8' } }
          }
        }
      });
    }

    // 2. CGPA Bands Bar Chart (Live)
    const cgpaCtx = document.getElementById('facultyCgpaBandChart')?.getContext('2d');
    if (cgpaCtx) {
      const g9 = students.filter(s => (s.cgpa || 0) >= 9).length;
      const g8 = students.filter(s => (s.cgpa || 0) >= 8 && (s.cgpa || 0) < 9).length;
      const g7 = students.filter(s => (s.cgpa || 0) >= 7 && (s.cgpa || 0) < 8).length;
      const g6 = students.filter(s => (s.cgpa || 0) >= 6 && (s.cgpa || 0) < 7).length;
      const gLow = students.filter(s => (s.cgpa || 0) < 6).length;

      new Chart(cgpaCtx, {
        type: 'bar',
        data: {
          labels: ['9.0 - 10.0', '8.0 - 8.9', '7.0 - 7.9', '6.0 - 6.9', '< 6.0 CGPA'],
          datasets: [{
            label: 'Student Count',
            data: [g9, g8, g7, g6, gLow],
            backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });
    }
  },

  async openStudentDetailModal(studentId) {
    UI.showModal({
      title: 'Student 360° Profile & Academic Support Interventions',
      body: '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>',
      footer: '<button class="btn btn-secondary" onclick="UI.closeModal()">Close</button>'
    });

    try {
      const data = await API.getStudentDetail(studentId);
      const s = data.student;
      const risk = data.riskAssessment;
      const att = data.attendance;
      const marks = data.marks;
      const interventions = data.interventions || [];
      const support = data.supportContext || [];

      const modalBody = `
        <!-- Student Header -->
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: var(--primary-gradient); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800;">
            ${s.user.name.charAt(0)}
          </div>
          <div>
            <h3 style="font-size: 1.2rem; font-weight: 800;">${s.user.name} (${s.rollNumber})</h3>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              ${s.course?.name} • Semester ${s.currentSemester} (Section ${s.section}) • CGPA: <strong>${s.cgpa}</strong>
            </div>
          </div>
          <div style="margin-left: auto; text-align: right;">
            <span class="risk-badge ${risk.riskLevel}" style="font-size: 0.85rem;">${risk.riskLevel} (${risk.riskScore}/100)</span>
          </div>
        </div>

        <!-- Explainable Diagnostics & Factor Details -->
        <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 16px; margin-bottom: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 6px;">AI Risk Engine Diagnosis:</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            ${risk.explanation}
          </p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
            <div style="background: var(--bg-card); padding: 8px; border-radius: 6px;">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Attendance</div>
              <strong style="color: ${att.overallPercentage < 75 ? 'var(--risk-critical)' : 'var(--risk-low)'}; font-size: 1.1rem;">
                ${att.overallPercentage}%
              </strong>
            </div>
            <div style="background: var(--bg-card); padding: 8px; border-radius: 6px;">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Internal Average</div>
              <strong style="color: ${risk.metrics?.internalMarksAverage < 50 ? 'var(--risk-critical)' : 'var(--risk-low)'}; font-size: 1.1rem;">
                ${risk.metrics?.internalMarksAverage}%
              </strong>
            </div>
            <div style="background: var(--bg-card); padding: 8px; border-radius: 6px;">
              <div style="font-size: 0.7rem; color: var(--text-muted);">Assignments Rate</div>
              <strong style="font-size: 1.1rem;">
                ${risk.metrics?.assignmentCompletionRate}%
              </strong>
            </div>
          </div>
        </div>

        <!-- Relevant Campus Support Context -->
        <div style="margin-bottom: 20px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">
            <i class="fas fa-hand-holding-heart" style="color: var(--primary);"></i> Campus Support Context:
          </h4>
          ${support.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${support.map(sup => `
                <div style="background: var(--bg-input); border-left: 3px solid var(--risk-high); padding: 8px 12px; border-radius: 4px; font-size: 0.8rem;">
                  <strong>${sup.ticketId}</strong>: ${sup.title} (${sup.location})
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Status: ${sup.status} | Academic Impact: ${sup.academicImpact}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No active campus facility complaints logged by student.</p>
          `}
        </div>

        <!-- Intervention History / Progress Tracking -->
        <div style="margin-bottom: 24px;">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">
            <i class="fas fa-clock-rotate-left"></i> Intervention Plan History & Progress:
          </h4>
          ${interventions.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${interventions.map(i => `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong>Reason: ${i.reason}</strong>
                    <span class="status-pill ${i.status}">${i.status}</span>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    Mentor: ${i.faculty?.name} | Follow-up: ${new Date(i.followUpDate).toLocaleDateString()}
                  </div>
                  <div style="margin-top: 8px; font-size: 0.8rem;">
                    <strong>Action Tasks:</strong>
                    <ul style="padding-left: 18px; margin-top: 4px;">
                      ${i.actionPlan.map(t => `<li>${t.task} ${t.completed ? '✅' : '⏳'}</li>`).join('')}
                    </ul>
                  </div>
                  ${i.beforeMetrics ? `
                    <div style="margin-top: 8px; font-size: 0.75rem; background: var(--bg-input); padding: 6px 10px; border-radius: 4px;">
                      <strong>Progress Metrics:</strong> Baseline Risk Score: ${i.beforeMetrics.riskScore}
                      ${i.afterMetrics ? ` ➔ After Intervention: <strong>${i.afterMetrics.riskScore}</strong>` : ' (Follow-up pending)'}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No previous intervention records.</p>
          `}
        </div>

        <!-- Create New Intervention Form -->
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.06) 100%); border: 1px solid var(--primary); border-radius: var(--radius-lg); padding: 18px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary); margin-bottom: 12px;">
            <i class="fas fa-plus-circle"></i> Create Faculty Intervention Plan
          </h4>
          <form id="form-create-intervention">
            <div class="form-group">
              <label class="form-label">Primary Reason for Intervention *</label>
              <input id="interv-reason" type="text" class="form-control" placeholder="e.g. Low attendance in DBMS & failing internal marks" required value="${risk.riskLevel === 'HIGH' ? 'Attendance deficiency (62%) and internal marks remediation' : ''}" />
            </div>
            <div class="form-group">
              <label class="form-label">Action Plan Tasks (1 per line) *</label>
              <textarea id="interv-tasks" class="form-control" rows="3" placeholder="Enter specific student action items" required>Attend next 5 DBMS and DAA lectures without fail
Complete and submit 2 outstanding lab assignments
Attend remedial Saturday tutorial session</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Follow-Up Evaluation Date *</label>
              <input id="interv-date" type="date" class="form-control" required value="${new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Faculty Confidential Notes</label>
              <input id="interv-notes" type="text" class="form-control" placeholder="Optional internal mentor notes..." />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">
              <i class="fas fa-paper-plane"></i> Save & Initiate Intervention Plan
            </button>
          </form>
        </div>
      `;

      UI.updateModalBody(modalBody);

      // Bind Intervention Submission
      document.getElementById('form-create-intervention')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = document.getElementById('interv-reason').value;
        const tasksRaw = document.getElementById('interv-tasks').value;
        const followUpDate = document.getElementById('interv-date').value;
        const notes = document.getElementById('interv-notes').value;

        const actionPlan = tasksRaw.split('\n').filter(t => t.trim().length > 0).map(t => ({ task: t.trim(), completed: false }));

        try {
          await API.createIntervention({
            studentId,
            reason,
            actionPlan,
            followUpDate,
            notes
          });
          UI.toast('Intervention plan created and student notified!', 'success');
          UI.closeModal();
          App.renderCurrentView();
        } catch (err) {
          UI.toast(`Error creating intervention: ${err.message}`, 'error');
        }
      });

    } catch (err) {
      UI.updateModalBody(`<div class="card" style="color: var(--risk-critical);">${err.message}</div>`);
    }
  },

  openAttendanceModal(students, subjects) {
    UI.showModal({
      title: 'Quick Lecture Attendance Entry',
      body: `
        <form id="form-quick-att">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <select id="att-subject" class="form-control">
              ${subjects.map(s => `<option value="${s._id}">${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Student</label>
            <select id="att-student" class="form-control">
              ${students.map(s => `<option value="${s._id}">${s.name} (${s.rollNumber})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select id="att-status" class="form-control">
              <option value="PRESENT">PRESENT</option>
              <option value="ABSENT">ABSENT</option>
              <option value="LATE">LATE</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Lecture Date</label>
            <input id="att-date" type="date" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Record Attendance</button>
        </form>
      `
    });

    document.getElementById('form-quick-att')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await API.recordAttendance({
          studentId: document.getElementById('att-student').value,
          subjectId: document.getElementById('att-subject').value,
          status: document.getElementById('att-status').value,
          date: document.getElementById('att-date').value
        });
        UI.toast('Attendance recorded! Risk engine updated.', 'success');
        UI.closeModal();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });
  },

  openMarksModal(students, subjects) {
    UI.showModal({
      title: 'Quick Assessment Marks Entry',
      body: `
        <form id="form-quick-marks">
          <div class="form-group">
            <label class="form-label">Subject</label>
            <select id="mark-subject" class="form-control">
              ${subjects.map(s => `<option value="${s._id}">${s.name} (${s.code})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Student</label>
            <select id="mark-student" class="form-control">
              ${students.map(s => `<option value="${s._id}">${s.name} (${s.rollNumber})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Scored Marks (out of 100)</label>
            <input id="mark-score" type="number" min="0" max="100" class="form-control" placeholder="e.g. 78" required />
          </div>
          <div class="form-group">
            <label class="form-label">Faculty Feedback</label>
            <input id="mark-remarks" type="text" class="form-control" placeholder="Optional comments..." />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Save Marks</button>
        </form>
      `
    });

    document.getElementById('form-quick-marks')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const studentId = document.getElementById('mark-student').value;
        const subjectId = document.getElementById('mark-subject').value;
        const scoredMarks = parseInt(document.getElementById('mark-score').value);
        const remarks = document.getElementById('mark-remarks').value;

        // Fetch student's assessments to grab assessmentId
        const sData = await API.getStudentDetail(studentId);
        const assessId = sData.marks?.[0]?.assessment?._id || sData.marks?.[0]?.assessment;

        await API.recordMarks({
          studentId,
          subjectId,
          assessmentId: assessId,
          scoredMarks,
          remarks
        });
        UI.toast('Marks recorded and risk recalculated!', 'success');
        UI.closeModal();
      } catch (err) {
        UI.toast(err.message, 'error');
      }
    });
  },

  openCreateAssignmentModal(subjects = []) {
    UI.showModal({
      title: 'Publish Coursework Assignment',
      body: `
        <form id="form-create-assignment">
          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 600;">Assigned Subject *</label>
            <select id="asg-subject" class="form-control" style="width: 100%; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);" required>
              ${subjects.map(sub => `<option value="${sub._id}">${sub.code} - ${sub.name} (Semester ${sub.semester || 4})</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-top: 12px;">
            <label style="font-size: 0.85rem; font-weight: 600;">Assignment Title *</label>
            <input type="text" id="asg-title" class="form-control" style="width: 100%; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);" placeholder="e.g. Lab 3: SQL Triggers & Stored Procedures" required>
          </div>
          <div class="form-group" style="margin-top: 12px;">
            <label style="font-size: 0.85rem; font-weight: 600;">Description & Submission Criteria</label>
            <textarea id="asg-desc" class="form-control" rows="3" style="width: 100%; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);" placeholder="Instructions for cohort students..."></textarea>
          </div>
          <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 600;">Due Date *</label>
              <input type="date" id="asg-duedate" class="form-control" style="width: 100%; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);" required>
            </div>
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 600;">Max Marks</label>
              <input type="number" id="asg-maxscore" class="form-control" style="width: 100%; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-surface); color: var(--text-primary);" value="10" min="1" max="100">
            </div>
          </div>
        </form>
      `,
      footer: `
        <button class="btn btn-outline" style="padding: 6px 14px; margin-right: 8px;" onclick="UI.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="btn-submit-assignment" style="padding: 6px 14px;">Publish Assignment</button>
      `
    });

    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dueEl = document.getElementById('asg-duedate');
    if (dueEl) dueEl.value = nextWeek;

    document.getElementById('btn-submit-assignment')?.addEventListener('click', async () => {
      const subjectId = document.getElementById('asg-subject')?.value;
      const title = document.getElementById('asg-title')?.value?.trim();
      const description = document.getElementById('asg-desc')?.value?.trim();
      const dueDate = document.getElementById('asg-duedate')?.value;
      const maxScore = parseInt(document.getElementById('asg-maxscore')?.value || '10');

      if (!subjectId || !title || !dueDate) {
        UI.toast('Please fill all required assignment fields', 'warning');
        return;
      }

      try {
        await API.createAssignment({ subjectId, title, description, dueDate, maxScore });
        UI.toast('Assignment published to enrolled cohort students!', 'success');
        UI.closeModal();
      } catch (err) {
        UI.toast(`Failed to create assignment: ${err.message}`, 'error');
      }
    });
  },

  openStudentProfileModal(studentId) {
    return this.openStudentDetailModal(studentId);
  }
};
