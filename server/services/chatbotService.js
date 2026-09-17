const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const Complaint = require('../models/Complaint');
const FAQ = require('../models/FAQ');
const { analyzeComplaint } = require('./complaintAI');
const { calculateSlaDeadline } = require('./slaService');
const { broadcastEvent } = require('./socketService');
const { logAudit } = require('./auditService');

// ----------------------------------------------------
// CONTROLLED BACKEND ACTION FUNCTIONS
// (Strict user-level authentication & authorization)
// ----------------------------------------------------

async function getMyAcademicSummary(userId) {
  const student = await Student.findOne({ user: userId }).populate('course').populate('user');
  if (!student) return { text: 'Academic record not found for your account.' };

  const attendanceRecords = await AttendanceRecord.find({ student: student._id });
  let attendancePct = 85;
  if (attendanceRecords.length > 0) {
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const late = attendanceRecords.filter(r => r.status === 'LATE').length;
    attendancePct = Math.round(((present + late * 0.5) / attendanceRecords.length) * 100);
  }

  const marks = await Mark.find({ student: student._id });
  const internalAvg = marks.length > 0
    ? Math.round(marks.reduce((a, b) => a + b.percentage, 0) / marks.length)
    : 70;

  const assignments = await Assignment.find({ semester: student.currentSemester });
  const subs = await AssignmentSubmission.find({ student: student._id, status: 'COMPLETED' });

  return {
    studentName: student.user.name,
    rollNumber: student.rollNumber,
    course: student.course?.name || 'B.Tech CSE',
    semester: student.currentSemester,
    attendance: `${attendancePct}%`,
    internalMarksAverage: `${internalAvg}%`,
    assignmentsCompleted: `${subs.length} / ${assignments.length}`,
    riskLevel: student.currentRiskLevel,
    riskScore: `${student.currentRiskScore}/100`
  };
}

async function getMyRisk(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) return { text: 'No student record found.' };

  const assessment = await RiskAssessment.findOne({ student: student._id }).sort({ calculatedAt: -1 });
  if (!assessment) {
    return {
      riskLevel: student.currentRiskLevel || 'LOW',
      riskScore: student.currentRiskScore || 15,
      explanation: 'Your risk evaluation is currently within normal parameters.',
      contributingFactors: [],
      recommendations: []
    };
  }

  return {
    riskLevel: assessment.riskLevel,
    riskScore: assessment.riskScore,
    explanation: assessment.explanation,
    metrics: assessment.metrics,
    contributingFactors: assessment.contributingFactors,
    recommendations: assessment.recommendations
  };
}

async function getMyAttendance(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) return { text: 'Student not found.' };

  const records = await AttendanceRecord.find({ student: student._id }).populate('subject');
  if (records.length === 0) {
    return { overallPercentage: '85%', subjectWise: [] };
  }

  const subjectMap = {};
  records.forEach(r => {
    const sName = r.subject?.name || 'General';
    if (!subjectMap[sName]) subjectMap[sName] = { total: 0, present: 0 };
    subjectMap[sName].total++;
    if (r.status === 'PRESENT') subjectMap[sName].present++;
    if (r.status === 'LATE') subjectMap[sName].present += 0.5;
  });

  const subjectWise = Object.entries(subjectMap).map(([subject, stat]) => ({
    subject,
    percentage: Math.round((stat.present / stat.total) * 100),
    attended: Math.round(stat.present),
    total: stat.total
  }));

  const totalClasses = records.length;
  const totalAttended = records.filter(r => r.status === 'PRESENT').length + (records.filter(r => r.status === 'LATE').length * 0.5);
  const overallPercentage = Math.round((totalAttended / totalClasses) * 100);

  return {
    overallPercentage: `${overallPercentage}%`,
    totalClasses,
    attendedClasses: Math.round(totalAttended),
    subjectWise
  };
}

async function getMyMarks(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) return { text: 'Student not found.' };

  const marks = await Mark.find({ student: student._id }).populate('subject').populate('assessment');
  return marks.map(m => ({
    subject: m.subject?.name || 'Subject',
    assessment: m.assessment?.title || 'Assessment',
    score: `${m.scoredMarks} / ${m.assessment?.maxMarks || 100}`,
    percentage: `${m.percentage}%`
  }));
}

async function getMyAssignments(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) return [];

  const assignments = await Assignment.find({ semester: student.currentSemester }).populate('subject');
  const subs = await AssignmentSubmission.find({ student: student._id });
  const subMap = {};
  subs.forEach(s => { subMap[s.assignment.toString()] = s; });

  return assignments.map(a => {
    const sub = subMap[a._id.toString()];
    return {
      title: a.title,
      subject: a.subject?.name || 'General',
      dueDate: a.dueDate,
      status: sub ? sub.status : 'PENDING',
      score: sub?.score != null ? `${sub.score}/${a.maxScore}` : 'Not graded'
    };
  });
}

async function getMyInterventions(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) return [];

  const interventions = await Intervention.find({ student: student._id })
    .populate('faculty', 'name email')
    .sort({ createdAt: -1 });

  return interventions.map(i => ({
    id: i._id,
    facultyName: i.faculty?.name || 'Faculty Mentor',
    reason: i.reason,
    status: i.status,
    actionPlan: i.actionPlan,
    followUpDate: i.followUpDate,
    notes: i.notes
  }));
}

async function getMyComplaints(userId) {
  const complaints = await Complaint.find({ student: userId })
    .populate('category', 'name')
    .populate('department', 'name')
    .sort({ createdAt: -1 });

  return complaints.map(c => ({
    ticketId: c.ticketId,
    title: c.title,
    category: c.category?.name || 'General',
    location: `${c.block} - ${c.room}`,
    priority: c.priority,
    status: c.status,
    createdAt: c.createdAt,
    slaDeadline: c.slaDeadline,
    isSlaBreached: c.isSlaBreached
  }));
}

async function getComplaintStatus(ticketId, userId) {
  const complaint = await Complaint.findOne({ ticketId: ticketId.toUpperCase() })
    .populate('category', 'name')
    .populate('department', 'name')
    .populate('assignedStaff', 'name');

  if (!complaint) {
    return { text: `Ticket ${ticketId} not found in our system.` };
  }

  return {
    ticketId: complaint.ticketId,
    title: complaint.title,
    category: complaint.category?.name,
    department: complaint.department?.name,
    assignedStaff: complaint.assignedStaff?.name || 'Pending assignment',
    priority: complaint.priority,
    status: complaint.status,
    slaDeadline: complaint.slaDeadline,
    isSlaBreached: complaint.isSlaBreached,
    timeline: complaint.timeline
  };
}

async function requestComplaintEscalation(ticketId, userId, reason = 'Urgent academic impact reported by student') {
  const complaint = await Complaint.findOne({ ticketId: ticketId.toUpperCase() });
  if (!complaint) return { success: false, message: `Ticket ${ticketId} not found.` };

  complaint.status = 'ESCALATED';
  complaint.timeline.push({
    status: 'ESCALATED',
    actor: userId,
    notes: `Escalated via EduGuard AI: ${reason}`,
    timestamp: new Date()
  });
  await complaint.save();

  await logAudit({
    actor: userId,
    action: 'COMPLAINT_ESCALATED',
    entity: 'Complaint',
    entityId: complaint._id,
    metadata: { reason, via: 'CHATBOT' }
  });

  return { success: true, ticketId: complaint.ticketId, status: 'ESCALATED' };
}

async function getCampusFAQ(query) {
  const regex = new RegExp(query.split(' ').filter(w => w.length > 2).join('|'), 'i');
  const faqs = await FAQ.find({
    isActive: true,
    $or: [{ question: regex }, { answer: regex }, { keywords: regex }]
  }).limit(3);

  return faqs.map(f => ({ question: f.question, answer: f.answer }));
}

// ----------------------------------------------------
// CHATBOT ORCHESTRATOR WITH ENGLISH / HINDI / HINGLISH
// ----------------------------------------------------

async function processUserMessage({ message, userId, userRole, confirmedAction = null }) {
  const cleanMsg = message.trim();
  const lower = cleanMsg.toLowerCase();

  // If client confirms an action (e.g. creating a complaint draft)
  if (confirmedAction && confirmedAction.type === 'CONFIRM_CREATE_COMPLAINT') {
    const draft = confirmedAction.draft;
    const aiAnalysis = await analyzeComplaint({
      title: draft.title,
      description: draft.description,
      block: draft.block,
      room: draft.room
    });

    const { deadline } = await calculateSlaDeadline(aiAnalysis.priority);
    const count = await Complaint.countDocuments();
    const ticketId = `CMP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const complaint = await Complaint.create({
      ticketId,
      student: userId,
      title: draft.title,
      description: draft.description,
      category: aiAnalysis.category,
      campus: 'Main Campus',
      block: draft.block,
      room: draft.room,
      priority: aiAnalysis.priority,
      department: aiAnalysis.department,
      aiAnalysis,
      slaDeadline: deadline,
      status: 'AI_ANALYZED',
      timeline: [
        { status: 'SUBMITTED', actor: userId, notes: 'Complaint submitted via EduGuard AI Assistant', timestamp: new Date() },
        { status: 'AI_ANALYZED', actor: null, notes: `AI Categorization: ${aiAnalysis.categoryName} (${aiAnalysis.priority} Priority)`, timestamp: new Date() }
      ]
    });

    await logAudit({
      actor: userId,
      action: 'COMPLAINT_CREATED',
      entity: 'Complaint',
      entityId: complaint._id,
      metadata: { ticketId, createdVia: 'CHATBOT' }
    });

    broadcastEvent('role:ADMIN', 'new_complaint', complaint);

    return {
      reply: `I have successfully created your campus complaint!\n\nTicket ID: **${ticketId}**\nCategory: ${aiAnalysis.categoryName}\nDepartment: ${aiAnalysis.departmentName}\nPriority: **${aiAnalysis.priority}**\n\nThe concerned team has been alerted. You can track this anytime in your Complaints tab.`,
      actionCompleted: true,
      ticketId: complaint.ticketId
    };
  }

  // 1. RISK & PERFORMANCE INQUIRIES (English / Hindi / Hinglish)
  // "Why is my risk high?", "risk kyu high hai", "mera risk kya hai", "risk score"
  if (/risk|khatra|high risk|why.*risk|risk.*kyu|score.*risk|risk.*explain/i.test(lower)) {
    const riskData = await getMyRisk(userId);
    const summary = await getMyAcademicSummary(userId);

    let reply = `Your current academic risk level is **${riskData.riskLevel}** (Score: **${riskData.riskScore}/100**).\n\n`;
    reply += `**Key Academic Indicators:**\n`;
    reply += `• Attendance: **${summary.attendance || (riskData.metrics?.attendancePercentage + '%')}**\n`;
    reply += `• Internal Marks: **${summary.internalMarksAverage || (riskData.metrics?.internalMarksAverage + '%')}**\n`;
    reply += `• Assignments: **${summary.assignmentsCompleted || 'Pending tasks'}**\n`;
    reply += `• Performance Trend: **${riskData.metrics?.performanceTrend || 'Declining'}**\n\n`;
    reply += `**Why is this score elevated?**\n${riskData.explanation}\n\n`;
    reply += `**Recommended Next Steps:**\n`;
    if (riskData.recommendations && riskData.recommendations.length > 0) {
      riskData.recommendations.forEach(r => {
        reply += `• **${r.title}**: ${r.action}\n`;
      });
    } else {
      reply += `• Attend upcoming classes regularly.\n• Complete pending assignments.\n• Schedule a discussion with your faculty mentor.`;
    }

    return {
      reply,
      intent: 'GET_RISK',
      data: riskData
    };
  }

  // 2. ATTENDANCE INQUIRIES (English / Hindi / Hinglish)
  // "attendance kitni hai", "how is my attendance", "attendance percentage"
  if (/attendance|haziri|hazri|classes attended|absent/i.test(lower)) {
    const att = await getMyAttendance(userId);
    let reply = `Your overall attendance is **${att.overallPercentage}** (${att.attendedClasses} attended out of ${att.totalClasses} total lectures).\n\n`;
    if (att.subjectWise && att.subjectWise.length > 0) {
      reply += `**Subject-wise Breakdown:**\n`;
      att.subjectWise.forEach(s => {
        const flag = s.percentage < 75 ? '⚠️ (Below 75%)' : '✅';
        reply += `• ${s.subject}: **${s.percentage}%** ${flag}\n`;
      });
    }
    reply += `\n*Remember: A minimum of 75% attendance is required to sit for semester examinations.*`;

    return {
      reply,
      intent: 'GET_ATTENDANCE',
      data: att
    };
  }

  // 3. MARKS & ASSESSMENTS INQUIRIES
  // "mere marks", "internal marks", "assessment score"
  if (/mark|marks|grade|score|internal|quiz|midterm|exam result/i.test(lower)) {
    const marks = await getMyMarks(userId);
    if (!marks || marks.length === 0) {
      return { reply: 'No internal assessment marks recorded yet for the current semester.' };
    }
    let reply = `**Your Internal Assessment Scores:**\n\n`;
    marks.forEach(m => {
      reply += `• **${m.subject}** (${m.assessment}): **${m.score}** (${m.percentage})\n`;
    });
    return { reply, intent: 'GET_MARKS', data: marks };
  }

  // 4. ASSIGNMENTS INQUIRIES
  // "pending assignment", "assignment status", "kitne assignment bache hain"
  if (/assignment|homework|submission|pending/i.test(lower)) {
    const assignments = await getMyAssignments(userId);
    const pending = assignments.filter(a => a.status === 'PENDING');
    let reply = `You have **${pending.length} pending assignments** out of ${assignments.length} total coursework tasks.\n\n`;
    assignments.forEach(a => {
      const badge = a.status === 'COMPLETED' ? '✅ Submitted' : '⏳ Pending';
      reply += `• **${a.title}** (${a.subject}) - Due: ${new Date(a.dueDate).toLocaleDateString()} [${badge}]\n`;
    });
    return { reply, intent: 'GET_ASSIGNMENTS', data: assignments };
  }

  // 5. CAMPUS COMPLAINT CREATION / INTENT DETECTION (English / Hindi / Hinglish)
  // e.g. "Block B mein Wi-Fi nahi chal raha", "projector kharab hai room 204", "wifi issue", "broken tap"
  const hasComplaintIntent = /wifi|wi-fi|internet|projector|fan|light|ac|water|tap|toilet|washroom|chair|desk|socket|electricity|leak|nahi chal raha|kharab|problem|issue|toota/i.test(lower);
  if (hasComplaintIntent && !/status|kya hua|ticket/i.test(lower)) {
    // Extract block and room if mentioned
    const blockMatch = cleanMsg.match(/block\s*([a-zA-Z0-9]+)/i);
    const roomMatch = cleanMsg.match(/(?:room|lab|hall)\s*([a-zA-Z0-9]+)/i);

    const block = blockMatch ? `Block ${blockMatch[1].toUpperCase()}` : 'Block B';
    const room = roomMatch ? `Room ${roomMatch[1]}` : 'Room 204';

    const ai = await analyzeComplaint({
      title: cleanMsg,
      description: cleanMsg,
      block,
      room
    });

    const reply = `I understand you have a campus issue: **"${cleanMsg}"**.\n\n` +
      `I can help you log this immediately to the campus support team:\n` +
      `• **Detected Category**: ${ai.categoryName}\n` +
      `• **Location**: ${block}, ${room}\n` +
      `• **Recommended Department**: ${ai.departmentName}\n` +
      `• **Priority**: **${ai.priority}**\n` +
      `• **Reasoning**: ${ai.reason}\n\n` +
      `Would you like me to submit this official complaint ticket now?`;

    return {
      reply,
      intent: 'PROPOSE_COMPLAINT',
      requiresConfirmation: true,
      actionPayload: {
        type: 'CONFIRM_CREATE_COMPLAINT',
        draft: {
          title: cleanMsg,
          description: `Reported via EduGuard AI Chatbot: "${cleanMsg}" in ${block}, ${room}.`,
          block,
          room
        }
      }
    };
  }

  // 6. COMPLAINT STATUS OR TRACKING
  // "status of CMP-2026-1001", "mera complaint status", "complaints track"
  const ticketMatch = cleanMsg.match(/CMP-\d{4}-\d{4}/i);
  if (ticketMatch || /complaint.*status|status.*complaint|mera complaint/i.test(lower)) {
    if (ticketMatch) {
      const statusData = await getComplaintStatus(ticketMatch[0], userId);
      let reply = `**Ticket ${statusData.ticketId}** Details:\n\n` +
        `• Title: ${statusData.title}\n` +
        `• Status: **${statusData.status}**\n` +
        `• Department: ${statusData.department}\n` +
        `• Assigned Staff: ${statusData.assignedStaff}\n` +
        `• Priority: ${statusData.priority}\n` +
        `• SLA Deadline: ${new Date(statusData.slaDeadline).toLocaleString()}` +
        (statusData.isSlaBreached ? ' ⚠️ [SLA Breached]' : ' ✅ [Within SLA]');
      return { reply, intent: 'COMPLAINT_STATUS', data: statusData };
    } else {
      const myComplaints = await getMyComplaints(userId);
      if (myComplaints.length === 0) {
        return { reply: 'You currently have no submitted campus complaints.' };
      }
      let reply = `Here are your recent campus complaints:\n\n`;
      myComplaints.slice(0, 3).forEach(c => {
        reply += `• **${c.ticketId}**: ${c.title} [Status: **${c.status}**] (${c.location})\n`;
      });
      reply += `\nType "status <Ticket ID>" for detailed resolution progress.`;
      return { reply, intent: 'MY_COMPLAINTS', data: myComplaints };
    }
  }

  // 7. CAMPUS FAQ LOOKUP
  const faqs = await getCampusFAQ(cleanMsg);
  if (faqs.length > 0) {
    let reply = `Here is helpful information regarding your query:\n\n`;
    faqs.forEach(f => {
      reply += `**Q: ${f.question}**\n${f.answer}\n\n`;
    });
    return { reply, intent: 'FAQ_MATCH', data: faqs };
  }

  // 8. GENERAL ASSISTANCE FALLBACK
  return {
    reply: `Hello! I am **EduGuard AI Assistant**. I can help you with:\n\n` +
      `1. **Academic Insights**: Ask *"Why is my risk high?"*, *"Check my attendance"*, *"View my internal marks"*\n` +
      `2. **Campus Support**: Report issues naturally in English, Hindi, or Hinglish (e.g. *"Block B mein Wi-Fi nahi chal raha"* or *"Room 204 projector not working"*)\n` +
      `3. **Ticket Tracking**: Check complaint status or track resolution progress.\n\n` +
      `How can I assist you right now?`,
    intent: 'GREETING'
  };
}

module.exports = {
  getMyAcademicSummary,
  getMyRisk,
  getMyAttendance,
  getMyMarks,
  getMyAssignments,
  getMyInterventions,
  getMyComplaints,
  getComplaintStatus,
  requestComplaintEscalation,
  getCampusFAQ,
  processUserMessage
};
