/**
 * Smart Campus Complaints & Resolution View
 */
const ComplaintsView = {
  currentFilter: 'ALL',

  async render(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 400px;">
        <div style="text-align: center;">
          <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
          <p style="margin-top: 12px; color: var(--text-secondary);">Loading Smart Campus Resolution Center...</p>
        </div>
      </div>
    `;

    try {
      const user = API.getUser();
      const [complaintsRes, clustersRes] = await Promise.all([
        API.getComplaints(),
        API.getComplaintClusters()
      ]);

      const complaints = complaintsRes.complaints || [];
      const clusters = clustersRes.clusters || [];

      container.innerHTML = `
        <!-- Top Title Bar -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em;">Smart Campus Complaint & Resolution Center 🏢</h2>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">AI-assisted issue logging, SLA tracking, incident clustering, and lifecycle resolution.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="btn-lodge-complaint" class="btn btn-primary btn-sm">
              <i class="fas fa-plus"></i> Submit New Issue
            </button>
            <button id="btn-ask-ai-complaint" class="btn btn-secondary btn-sm">
              <i class="fas fa-robot"></i> Report via AI Chat
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="metrics-grid">
          <div class="stat-card">
            <div>
              <div class="stat-title">Total Active Complaints</div>
              <div class="stat-value">${complaints.length}</div>
              <div class="stat-meta">${complaints.filter(c => c.status === 'RESOLVED' || c.status === 'STUDENT_CONFIRMED').length} Resolved</div>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fas fa-clipboard-list"></i>
            </div>
          </div>

          <div class="stat-card risk-critical">
            <div>
              <div class="stat-title">Critical Urgency</div>
              <div class="stat-value" style="color: var(--risk-critical);">
                ${complaints.filter(c => c.priority === 'CRITICAL').length}
              </div>
              <div class="stat-meta">Safety or Academic Blocking</div>
            </div>
            <div class="stat-icon-wrapper" style="background: var(--risk-critical-bg); color: var(--risk-critical);">
              <i class="fas fa-fire"></i>
            </div>
          </div>

          <div class="stat-card risk-high">
            <div>
              <div class="stat-title">Incident Duplicate Clusters</div>
              <div class="stat-value" style="color: var(--risk-high);">${clusters.length}</div>
              <div class="stat-meta">Grouped multi-user incidents</div>
            </div>
            <div class="stat-icon-wrapper" style="background: var(--risk-high-bg); color: var(--risk-high);">
              <i class="fas fa-layer-group"></i>
            </div>
          </div>

          <div class="stat-card risk-low">
            <div>
              <div class="stat-title">SLA Breached</div>
              <div class="stat-value" style="color: ${complaints.filter(c => c.isSlaBreached).length > 0 ? 'var(--risk-critical)' : 'var(--risk-low)'};">
                ${complaints.filter(c => c.isSlaBreached).length}
              </div>
              <div class="stat-meta">Overdue target deadlines</div>
            </div>
            <div class="stat-icon-wrapper" style="background: ${complaints.filter(c => c.isSlaBreached).length > 0 ? 'var(--risk-critical-bg)' : 'var(--risk-low-bg)'}; color: ${complaints.filter(c => c.isSlaBreached).length > 0 ? 'var(--risk-critical)' : 'var(--risk-low)'};">
              <i class="fas fa-stopwatch"></i>
            </div>
          </div>
        </div>

        <!-- Incident Clusters Notice (if any) -->
        ${clusters.length > 0 ? `
          <div class="card" style="margin-bottom: 24px; border-left: 4px solid var(--risk-high); background: rgba(249, 115, 22, 0.04);">
            <div class="card-header">
              <div class="card-title" style="color: var(--risk-high);">
                <i class="fas fa-diagram-project"></i> Active Campus Incident Clusters (Duplicate Detection Engine)
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${clusters.map(cl => `
                <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <strong style="color: var(--risk-high);">${cl.incidentId}</strong>: ${cl.title}
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                      Location: <strong>${cl.location?.block} - ${cl.location?.room}</strong> • Related Complaints: <strong>${cl.relatedComplaints?.length || 0}</strong> • AI Similarity: <strong>${Math.round((cl.aiSimilarityScore || 0.85) * 100)}%</strong>
                    </div>
                  </div>
                  <span class="status-pill IN_PROGRESS">${cl.status}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Filter Pills Bar -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-secondary filter-pill active" data-filter="ALL">All (${complaints.length})</button>
          <button class="btn btn-sm btn-secondary filter-pill" data-filter="SUBMITTED">Submitted (${complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'AI_ANALYZED').length})</button>
          <button class="btn btn-sm btn-secondary filter-pill" data-filter="IN_PROGRESS">In Progress (${complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'ACKNOWLEDGED').length})</button>
          <button class="btn btn-sm btn-secondary filter-pill" data-filter="RESOLVED">Resolved (${complaints.filter(c => c.status === 'RESOLVED' || c.status === 'STUDENT_CONFIRMED').length})</button>
          <button class="btn btn-sm btn-secondary filter-pill" data-filter="CRITICAL">Critical Priority (${complaints.filter(c => c.priority === 'CRITICAL').length})</button>
          <button class="btn btn-sm btn-secondary filter-pill" data-filter="BREACHED">SLA Breached (${complaints.filter(c => c.isSlaBreached).length})</button>
        </div>

        <!-- Complaints Table / Cards -->
        <div class="card">
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title & Location</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>SLA Remaining</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="complaints-tbody">
                ${ComplaintsView.generateTableRows(complaints, user)}
              </tbody>
            </table>
          </div>
        </div>
      `;

      // Event Bindings
      document.getElementById('btn-lodge-complaint')?.addEventListener('click', () => {
        UI.openComplaintModal();
      });

      document.getElementById('btn-ask-ai-complaint')?.addEventListener('click', () => {
        Chatbot.openWithMessage('Block B mein Wi-Fi nahi chal raha');
      });

      // Filter clicks
      container.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          container.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          const filter = pill.getAttribute('data-filter');
          let filtered = complaints;
          if (filter === 'SUBMITTED') filtered = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'AI_ANALYZED');
          else if (filter === 'IN_PROGRESS') filtered = complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'ACKNOWLEDGED');
          else if (filter === 'RESOLVED') filtered = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'STUDENT_CONFIRMED');
          else if (filter === 'CRITICAL') filtered = complaints.filter(c => c.priority === 'CRITICAL');
          else if (filter === 'BREACHED') filtered = complaints.filter(c => c.isSlaBreached);

          document.getElementById('complaints-tbody').innerHTML = ComplaintsView.generateTableRows(filtered, user);
          ComplaintsView.bindRowActions(container);
        });
      });

      ComplaintsView.bindRowActions(container);

    } catch (err) {
      container.innerHTML = `<div class="card" style="padding: 40px; text-align: center; color: var(--risk-critical);">${err.message}</div>`;
    }
  },

  generateTableRows(complaints, user) {
    if (complaints.length === 0) {
      return `<tr><td colspan="8" style="text-align: center; padding: 30px; color: var(--text-muted);">No complaints found matching criteria.</td></tr>`;
    }

    return complaints.map(c => {
      // Dynamic SLA Status Badge
      const slaStatus = c.slaStatus || (c.isSlaBreached ? 'OVERDUE' : 'ON_TRACK');
      let slaBadge = '';
      if (slaStatus === 'RESOLVED') {
        slaBadge = `<span class="badge badge-low" style="font-size: 0.72rem; padding: 2px 8px;"><i class="fas fa-check-circle"></i> RESOLVED</span>`;
      } else if (slaStatus === 'OVERDUE') {
        slaBadge = `<span class="badge badge-critical" style="font-size: 0.72rem; padding: 2px 8px;"><i class="fas fa-triangle-exclamation"></i> OVERDUE</span>`;
      } else if (slaStatus === 'DUE_SOON') {
        slaBadge = `<span class="badge badge-high" style="font-size: 0.72rem; padding: 2px 8px;"><i class="fas fa-hourglass-half"></i> DUE SOON</span>`;
      } else {
        slaBadge = `<span class="badge badge-low" style="font-size: 0.72rem; padding: 2px 8px;"><i class="fas fa-clock"></i> ON TRACK</span>`;
      }

      return `
        <tr>
          <td><strong>${c.ticketId}</strong></td>
          <td>
            <strong>${c.title}</strong>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              📍 ${c.block} - ${c.room} (${c.floor || 'Ground'})
              ${c.cluster ? '<span style="color: var(--risk-high); margin-left: 6px;">[Clustered]</span>' : ''}
            </div>
          </td>
          <td>${c.category?.name || 'General'}</td>
          <td>${c.department?.name || 'Facilities'}</td>
          <td><span class="risk-badge ${c.priority}">${c.priority}</span></td>
          <td><span class="status-pill ${c.status}">${c.status.replace('_', ' ')}</span></td>
          <td>${slaBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm btn-view-complaint" data-id="${c._id}">
              <i class="fas fa-info-circle"></i> Details
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  bindRowActions(container) {
    container.querySelectorAll('.btn-view-complaint').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        ComplaintsView.openDetailModal(id);
      });
    });
  },

  async openDetailModal(complaintId) {
    UI.showModal({
      title: 'Complaint Details & Workflow Resolution',
      body: '<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin fa-2x"></i></div>'
    });

    try {
      const res = await API.getComplaint(complaintId);
      const c = res.complaint;
      const user = API.getUser();

      const modalBody = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">TICKET ID: ${c.ticketId}</div>
            <h3 style="font-size: 1.15rem; font-weight: 800; margin: 4px 0;">${c.title}</h3>
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
              Reported by: <strong>${c.student?.name || 'Student'}</strong> • Location: <strong>${c.block} - ${c.room}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="status-pill ${c.status}">${c.status}</span>
            <div style="margin-top: 4px;"><span class="risk-badge ${c.priority}">${c.priority} PRIORITY</span></div>
          </div>
        </div>

        <!-- AI Analysis Breakdown -->
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%); border: 1px solid var(--primary); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 0.85rem; font-weight: 700; color: var(--primary); margin-bottom: 6px;">
            <i class="fas fa-brain"></i> AI Complaint Analysis:
          </div>
          <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">
            ${c.aiAnalysis?.reason || 'Automatically classified by EduGuard Complaint AI.'}
          </p>
          <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
            <div>Academic Impact: <strong>${c.aiAnalysis?.academicImpact || 'NONE'}</strong></div>
            <div>Confidence: <strong>${Math.round((c.aiAnalysis?.confidence || 0.9) * 100)}%</strong></div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 4px;">Description:</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); background: var(--bg-input); padding: 10px; border-radius: var(--radius-md);">
            ${c.description}
          </p>
        </div>

        ${c.resolutionProof?.notes ? `
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid var(--risk-low); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--risk-low); display: flex; align-items: center; gap: 6px;">
              <i class="fas fa-check-circle"></i> Resolution Proof & Maintenance Notes:
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.5;">${c.resolutionProof.notes}</p>
            ${c.resolutionProof.filePath ? `
              <div style="margin-top: 10px;">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">Uploaded Proof Photo:</div>
                <a href="${c.resolutionProof.filePath}" target="_blank" title="Click to view full image">
                  <img src="${c.resolutionProof.filePath}" style="max-width: 100%; max-height: 260px; border-radius: var(--radius-md); border: 1px solid var(--border-color); object-fit: cover; box-shadow: var(--shadow-sm); display: block;" alt="Resolution proof image" />
                </a>
                <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: inline-block;">
                  <i class="fas fa-search-plus"></i> Click image to open full resolution
                </span>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${c.studentFeedback?.comment ? `
          <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 10px; margin-bottom: 16px;">
            <div style="font-size: 0.8rem; font-weight: 700;">Student Feedback: ⭐ ${c.studentFeedback.rating}/5</div>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">"${c.studentFeedback.comment}"</p>
          </div>
        ` : ''}

        <!-- Workflow Actions based on Role -->
        <div style="border-top: 1px solid var(--border-color); padding-top: 16px; margin-top: 16px;">
          <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px;">Workflow Actions:</h4>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${(user?.role === 'DEPARTMENT_STAFF' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN') && c.status === 'ASSIGNED' ? `
              <button id="btn-start-work" class="btn btn-primary btn-sm"><i class="fas fa-play"></i> Start Work (In Progress)</button>
            ` : ''}

            ${(user?.role === 'DEPARTMENT_STAFF' || user?.role === 'DEPARTMENT_HEAD' || user?.role === 'ADMIN') && (c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'SUBMITTED' || c.status === 'AI_ANALYZED') ? `
              <button id="btn-resolve-issue" class="btn btn-success btn-sm"><i class="fas fa-check-circle"></i> Resolve & Upload Proof Photo</button>
            ` : ''}

            ${user?.role === 'STUDENT' && c.status === 'RESOLVED' ? `
              <button id="btn-confirm-res" class="btn btn-success btn-sm"><i class="fas fa-thumbs-up"></i> Confirm Resolution (Rate 5★)</button>
              <button id="btn-reopen-res" class="btn btn-danger btn-sm"><i class="fas fa-rotate-left"></i> Reopen Issue</button>
            ` : ''}

            <button id="btn-escalate-issue" class="btn btn-secondary btn-sm"><i class="fas fa-arrow-up"></i> Escalate Complaint</button>
          </div>
        </div>
      `;

      UI.updateModalBody(modalBody);

      // Bind actions
      document.getElementById('btn-start-work')?.addEventListener('click', async () => {
        await API.updateComplaintStatus(c._id, 'IN_PROGRESS', 'Technician arrived on site and started diagnostic.');
        UI.toast('Complaint status updated to IN PROGRESS', 'success');
        UI.closeModal();
        App.renderCurrentView();
      });

      document.getElementById('btn-resolve-issue')?.addEventListener('click', () => {
        UI.showModal({
          title: `Resolve Incident: ${c.ticketId}`,
          body: `
            <form id="form-resolve-complaint" style="display: flex; flex-direction: column; gap: 14px;">
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                Mark this campus facility issue as completed, provide maintenance remarks, and optionally attach a photo of the resolved facility for student confirmation.
              </p>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Resolution Notes / Summary *</label>
                <textarea id="resolve-notes" class="form-control" rows="3" required placeholder="e.g. Replaced faulty Wi-Fi access point, tested connectivity with 250Mbps throughput." style="width: 100%; border-radius: var(--radius-md); padding: 0.6rem; font-family: inherit;">Hardware repaired, replaced and tested operational on site.</textarea>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label" style="font-size: 0.8rem; font-weight: 700;">Upload Resolution Proof Photo (Optional)</label>
                <input type="file" id="resolve-proof-file" class="form-control" accept="image/*" style="padding: 6px;" />
                <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: block;">Supports JPG, PNG, WEBP (Max 5MB)</span>
                <div id="resolve-preview-container" style="margin-top: 8px; display: none;">
                  <img id="resolve-preview-img" style="max-height: 160px; max-width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-color); object-fit: cover;" alt="Preview" />
                </div>
              </div>
            </form>
          `,
          footer: `
            <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-md); margin-right: 0.5rem;" onclick="UI.closeModal()">Cancel</button>
            <button class="btn btn-success" id="btn-submit-resolution" style="padding: 0.4rem 0.8rem; border-radius: var(--radius-md);">
              <i class="fas fa-check"></i> Submit & Mark Resolved
            </button>
          `
        });

        const fileInput = document.getElementById('resolve-proof-file');
        const previewContainer = document.getElementById('resolve-preview-container');
        const previewImg = document.getElementById('resolve-preview-img');

        fileInput?.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              previewImg.src = re.target.result;
              previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
          } else {
            previewContainer.style.display = 'none';
          }
        });

        document.getElementById('btn-submit-resolution')?.addEventListener('click', async () => {
          const notes = document.getElementById('resolve-notes')?.value?.trim();
          if (!notes) {
            UI.toast('Please provide resolution notes.', 'warning');
            return;
          }
          const submitBtn = document.getElementById('btn-submit-resolution');
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

          try {
            const formData = new FormData();
            formData.append('notes', notes);
            const file = fileInput?.files?.[0];
            if (file) {
              formData.append('resolutionProof', file);
            }

            await API.resolveComplaint(c._id, formData);
            UI.toast('Issue marked RESOLVED! Student notified for confirmation.', 'success');
            UI.closeModal();
            App.renderCurrentView();
          } catch (err) {
            UI.toast(err.message || 'Failed to resolve complaint', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Submit & Mark Resolved';
          }
        });
      });

      document.getElementById('btn-confirm-res')?.addEventListener('click', async () => {
        await API.confirmComplaintResolution(c._id, 5, 'Verified working perfectly. Thank you!');
        UI.toast('Resolution confirmed! Thank you for your feedback.', 'success');
        UI.closeModal();
        App.renderCurrentView();
      });

      document.getElementById('btn-reopen-res')?.addEventListener('click', () => {
        UI.promptModal({
          title: `Reopen Incident: ${c.ticketId}`,
          message: 'Please state the reason why the resolution is unsatisfactory:',
          defaultValue: 'Issue is still persisting on site.',
          confirmText: 'Reopen Ticket',
          onConfirm: async (reason) => {
            await API.reopenComplaint(c._id, reason);
            UI.toast('Complaint reopened and escalated to department head!', 'warning');
            UI.closeModal();
            App.renderCurrentView();
          }
        });
      });

      document.getElementById('btn-escalate-issue')?.addEventListener('click', () => {
        UI.promptModal({
          title: `Escalate Incident: ${c.ticketId}`,
          message: 'Enter justification for urgent SLA escalation to department head:',
          defaultValue: 'Urgent academic impact reported on site.',
          confirmText: 'Escalate Now',
          onConfirm: async (reason) => {
            await API.escalateComplaint(c._id, reason);
            UI.toast('Complaint escalated!', 'warning');
            UI.closeModal();
            App.renderCurrentView();
          }
        });
      });

    } catch (err) {
      UI.updateModalBody(`<div style="color: var(--risk-critical);">${err.message}</div>`);
    }
  }
};
