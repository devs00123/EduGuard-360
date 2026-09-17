const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const ComplaintCategory = require('../models/ComplaintCategory');
const Department = require('../models/Department');
const User = require('../models/User');
const { analyzeComplaint, checkAndClusterDuplicates } = require('../services/complaintAI');
const { calculateSlaDeadline } = require('../services/slaService');
const { sendNotification, broadcastEvent } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

exports.createComplaint = async (req, res) => {
  try {
    const { title, description, categoryId, block, building, floor, room, latitude, longitude } = req.body;

    // Process attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        attachments.push({
          fileName: f.originalname,
          filePath: `/uploads/${f.filename}`,
          fileType: f.mimetype
        });
      });
    }

    // Run AI Analysis
    const aiAnalysis = await analyzeComplaint({
      title,
      description,
      block,
      room,
      floor
    });

    // Compute SLA Deadline
    const { deadline, hours } = await calculateSlaDeadline(aiAnalysis.priority);

    // Generate unique Ticket ID
    const count = await Complaint.countDocuments();
    const ticketId = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const complaint = await Complaint.create({
      ticketId,
      student: req.user._id,
      title,
      description,
      category: categoryId || aiAnalysis.category,
      campus: 'Main Campus',
      block,
      building: building || 'Academic Complex',
      floor: floor || 'Ground Floor',
      room,
      gpsLocation: latitude && longitude ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) } : null,
      attachments,
      aiAnalysis,
      priority: aiAnalysis.priority,
      department: aiAnalysis.department,
      status: 'AI_ANALYZED',
      slaDeadline: deadline,
      timeline: [
        {
          status: 'SUBMITTED',
          actor: req.user._id,
          notes: 'Complaint submitted by student',
          timestamp: new Date()
        },
        {
          status: 'AI_ANALYZED',
          actor: null,
          notes: `AI Classified: ${aiAnalysis.categoryName} (${aiAnalysis.priority} Priority, ${aiAnalysis.departmentName}). SLA: ${hours}h. Reason: ${aiAnalysis.reason}`,
          timestamp: new Date()
        }
      ]
    });

    // Check for duplicate incident clustering
    const cluster = await checkAndClusterDuplicates(complaint);
    if (cluster) {
      complaint.timeline.push({
        status: 'AI_ANALYZED',
        actor: null,
        notes: `Linked to active incident cluster ${cluster.incidentId} (${cluster.relatedComplaints.length} reports in ${block})`,
        timestamp: new Date()
      });
      await complaint.save();
    }

    // Real-time notifications
    broadcastEvent('role:ADMIN', 'new_complaint', complaint);
    if (aiAnalysis.department) {
      broadcastEvent(`dept:${aiAnalysis.department}`, 'new_complaint', complaint);
    }

    // Audit log
    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_CREATED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { ticketId, priority: aiAnalysis.priority, department: aiAnalysis.departmentName }
    });

    res.status(201).json({
      success: true,
      complaint,
      clusterFound: !!cluster
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { status, priority, category, department, block, search } = req.query;
    const query = {};

    // Role-based visibility
    if (req.user.role === 'STUDENT') {
      query.student = req.user._id;
    } else if (req.user.role === 'DEPARTMENT_STAFF') {
      query.$or = [{ assignedStaff: req.user._id }, { department: req.user.department }];
    } else if (req.user.role === 'DEPARTMENT_HEAD') {
      if (req.user.department) query.department = req.user.department;
    }

    if (status && status !== 'ALL') query.status = status;
    if (priority && priority !== 'ALL') query.priority = priority;
    if (category && category !== 'ALL') query.category = category;
    if (department && department !== 'ALL') query.department = department;
    if (block && block !== 'ALL') query.block = block;

    let complaints = await Complaint.find(query)
      .populate('student', 'name email')
      .populate('category', 'name code icon')
      .populate('department', 'name code')
      .populate('assignedStaff', 'name email phone')
      .populate('cluster')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      complaints = complaints.filter(c =>
        c.ticketId.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.block.toLowerCase().includes(s) ||
        c.room.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('category', 'name code icon')
      .populate('department', 'name code')
      .populate('assignedStaff', 'name email phone')
      .populate('cluster')
      .populate('timeline.actor', 'name role');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Authorization check
    if (req.user.role === 'STUDENT' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden. You cannot view another student\'s ticket.' });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignComplaint = async (req, res) => {
  try {
    const { staffId } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const staff = await User.findById(staffId);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    complaint.assignedStaff = staff._id;
    complaint.status = 'ASSIGNED';
    complaint.timeline.push({
      status: 'ASSIGNED',
      actor: req.user._id,
      notes: `Ticket assigned to technician ${staff.name}`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify staff
    await sendNotification({
      recipientId: staff._id,
      title: 'New Complaint Assignment',
      message: `You have been assigned ticket ${complaint.ticketId}: "${complaint.title}" in ${complaint.block}`,
      type: 'COMPLAINT_ASSIGNED',
      data: { complaintId: complaint._id, ticketId: complaint.ticketId, link: '#complaints' }
    });

    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_ASSIGNED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { staffId: staff._id, staffName: staff.name }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    complaint.status = status;
    complaint.timeline.push({
      status,
      actor: req.user._id,
      notes: notes || `Status updated to ${status}`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify student of progress
    await sendNotification({
      recipientId: complaint.student,
      title: `Update on Ticket ${complaint.ticketId}`,
      message: `Your complaint is now ${status.replace('_', ' ')}. Notes: ${notes || 'Work in progress'}`,
      type: status === 'IN_PROGRESS' ? 'COMPLAINT_STARTED' : 'COMPLAINT_ACKNOWLEDGED',
      data: { complaintId: complaint._id, ticketId: complaint.ticketId }
    });

    await logAudit({
      actor: req.user._id,
      action: `COMPLAINT_STATUS_${status}`,
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { newStatus: status, notes }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { notes } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    let proofFilePath = '';
    if (req.file) {
      proofFilePath = `/uploads/${req.file.filename}`;
    }

    complaint.status = 'RESOLVED';
    complaint.resolutionProof = {
      filePath: proofFilePath,
      notes: notes || 'Resolution completed by technician.',
      resolvedAt: new Date()
    };
    complaint.timeline.push({
      status: 'RESOLVED',
      actor: req.user._id,
      notes: `Marked resolved: ${notes || 'Resolution verified by staff.'}`,
      timestamp: new Date()
    });

    await complaint.save();

    // Notify student for confirmation
    await sendNotification({
      recipientId: complaint.student,
      title: `Issue Resolved: ${complaint.ticketId}`,
      message: `The campus support team has marked your issue as resolved. Please review and confirm.`,
      type: 'COMPLAINT_RESOLVED',
      data: { complaintId: complaint._id, ticketId: complaint.ticketId }
    });

    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_RESOLVED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { notes, proof: proofFilePath }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.confirmResolution = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    if (complaint.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the reporting student can confirm resolution.' });
    }

    complaint.status = 'STUDENT_CONFIRMED';
    complaint.studentFeedback = {
      rating: rating ? parseInt(rating) : 5,
      comment: comment || 'Resolution confirmed by student.',
      submittedAt: new Date()
    };
    complaint.timeline.push({
      status: 'STUDENT_CONFIRMED',
      actor: req.user._id,
      notes: `Student confirmed resolution with ${rating || 5}-star rating: "${comment || 'Satisfied'}"`,
      timestamp: new Date()
    });

    await complaint.save();

    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_CONFIRMED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { rating, comment }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.reopenComplaint = async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    complaint.status = 'REOPENED';
    complaint.timeline.push({
      status: 'REOPENED',
      actor: req.user._id,
      notes: `Reopened by student: ${reason || 'Issue persists.'}`,
      timestamp: new Date()
    });

    await complaint.save();

    // Alert department head & admin
    broadcastEvent('role:ADMIN', 'complaint_reopened', complaint);
    if (complaint.department) {
      broadcastEvent(`dept:${complaint.department}`, 'complaint_reopened', complaint);
    }

    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_REOPENED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { reason }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.escalateComplaint = async (req, res) => {
  try {
    const { reason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    complaint.status = 'ESCALATED';
    complaint.timeline.push({
      status: 'ESCALATED',
      actor: req.user._id,
      notes: `Escalated: ${reason || 'Urgent resolution requested.'}`,
      timestamp: new Date()
    });

    await complaint.save();

    broadcastEvent('role:ADMIN', 'complaint_escalated', complaint);

    await logAudit({
      actor: req.user._id,
      action: 'COMPLAINT_ESCALATED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { reason }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminOverride = async (req, res) => {
  try {
    const { priority, departmentId, overrideReason } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const prevPriority = complaint.priority;
    if (priority) complaint.priority = priority;
    if (departmentId) complaint.department = departmentId;

    complaint.adminOverride = {
      isOverridden: true,
      previousPriority: prevPriority,
      overrideReason: overrideReason || 'Manual administrative adjustment',
      overriddenBy: req.user._id,
      overriddenAt: new Date()
    };

    complaint.timeline.push({
      status: complaint.status,
      actor: req.user._id,
      notes: `Admin Override: Priority changed from ${prevPriority} to ${complaint.priority}. Reason: ${overrideReason}`,
      timestamp: new Date()
    });

    await complaint.save();

    await logAudit({
      actor: req.user._id,
      action: 'ADMIN_OVERRIDE_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { prevPriority, newPriority: complaint.priority, overrideReason }
    });

    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getClusters = async (req, res) => {
  try {
    const clusters = await ComplaintCluster.find()
      .populate('category', 'name code')
      .populate({
        path: 'relatedComplaints',
        select: 'ticketId title block room priority status createdAt'
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, clusters });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
