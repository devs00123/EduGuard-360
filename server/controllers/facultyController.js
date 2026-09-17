const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const Assessment = require('../models/Assessment');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const Complaint = require('../models/Complaint');
const { calculateStudentRisk } = require('../services/riskEngine');
const { sendNotification } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

/**
 * Server-side faculty subject ownership validator
 */
async function validateFacultySubject(user, subjectId) {
  if (user.role === 'ADMIN') return true;
  const faculty = await Faculty.findOne({ user: user._id });
  if (!faculty) return false;
  const isAssigned = faculty.assignedSubjects.some(s => s.toString() === subjectId.toString());
  if (isAssigned) return true;
  const subject = await Subject.findById(subjectId);
  if (subject && subject.faculty && subject.faculty.toString() === user._id.toString()) return true;
  return false;
}

exports.getAssignedClasses = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id })
      .populate({
        path: 'assignedSubjects',
        populate: { path: 'course', select: 'name code' }
      });

    if (!faculty) {
      // If admin viewing faculty routes
      const allSubjects = await Subject.find().populate('course', 'name code');
      return res.json({ success: true, subjects: allSubjects });
    }

    res.json({
      success: true,
      subjects: faculty.assignedSubjects,
      sections: faculty.assignedSections
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentsList = async (req, res) => {
  try {
    const { riskLevel, search, semester } = req.query;
    const query = {};

    if (riskLevel && riskLevel !== 'ALL') {
      query.currentRiskLevel = riskLevel;
    }
    if (semester) {
      query.currentSemester = parseInt(semester);
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    let studentsQuery = Student.find(query)
      .populate('user', 'name email avatar phone')
      .populate('course', 'name code')
      .sort({ currentRiskScore: -1 });

    let students = await studentsQuery;

    if (search) {
      const sLower = search.toLowerCase();
      students = students.filter(s =>
        (s.user?.name && s.user.name.toLowerCase().includes(sLower)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(sLower))
      );
    }

    const total = students.length;
    const paginated = students.slice(skip, skip + limit);

    // Attach latest active intervention status for each student
    const studentIds = paginated.map(s => s._id);
    const activeInterventions = await Intervention.find({
      student: { $in: studentIds },
      status: { $in: ['PLANNED', 'ACTIVE'] }
    });

    const interventionMap = {};
    activeInterventions.forEach(i => {
      interventionMap[i.student.toString()] = i;
    });

    const formatted = paginated.map(s => ({
      _id: s._id,
      name: s.user?.name,
      email: s.user?.email,
      rollNumber: s.rollNumber,
      course: s.course?.name,
      semester: s.currentSemester,
      section: s.section,
      riskLevel: s.currentRiskLevel,
      riskScore: s.currentRiskScore,
      previousRiskLevel: s.previousRiskLevel,
      previousRiskScore: s.previousRiskScore,
      riskTrend: s.riskTrend,
      lastAssessed: s.lastRiskAssessment,
      activeIntervention: interventionMap[s._id.toString()] || null
    }));

    res.json({
      success: true,
      count: formatted.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      students: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAtRiskStudents = async (req, res) => {
  try {
    const students = await Student.find({
      currentRiskLevel: { $in: ['HIGH', 'CRITICAL'] }
    })
      .populate('user', 'name email avatar')
      .populate('course', 'name code')
      .sort({ currentRiskScore: -1 });

    const studentIds = students.map(s => s._id);
    const interventions = await Intervention.find({
      student: { $in: studentIds }
    }).populate('faculty', 'name');

    const interventionMap = {};
    interventions.forEach(i => {
      interventionMap[i.student.toString()] = i;
    });

    const atRiskList = students.map(s => ({
      _id: s._id,
      name: s.user?.name,
      email: s.user?.email,
      rollNumber: s.rollNumber,
      course: s.course?.name,
      semester: s.currentSemester,
      riskLevel: s.currentRiskLevel,
      riskScore: s.currentRiskScore,
      previousRiskLevel: s.previousRiskLevel,
      previousRiskScore: s.previousRiskScore,
      riskTrend: s.riskTrend,
      intervention: interventionMap[s._id.toString()] || null
    }));

    res.json({
      success: true,
      count: atRiskList.length,
      students: atRiskList
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id)
      .populate('user', 'name email avatar phone')
      .populate('course')
      .populate('academicSession')
      .populate('mentorFaculty', 'name email');

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // 1. Calculate / Fetch Latest Risk Assessment
    let risk = await RiskAssessment.findOne({ student: id }).sort({ calculatedAt: -1 });
    if (!risk) {
      risk = await calculateStudentRisk(id);
    }

    // 2. Attendance Summary & Subject Breakdown
    const attendanceRecords = await AttendanceRecord.find({ student: id }).populate('subject', 'name code');
    const totalAtt = attendanceRecords.length;
    const presentAtt = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const lateAtt = attendanceRecords.filter(r => r.status === 'LATE').length;
    const overallAttendance = totalAtt > 0 ? Math.round(((presentAtt + lateAtt * 0.5) / totalAtt) * 100) : 0;

    const subjectAttMap = {};
    attendanceRecords.forEach(r => {
      const sName = r.subject?.name || 'General';
      if (!subjectAttMap[sName]) subjectAttMap[sName] = { total: 0, attended: 0 };
      subjectAttMap[sName].total++;
      if (r.status === 'PRESENT') subjectAttMap[sName].attended++;
      if (r.status === 'LATE') subjectAttMap[sName].attended += 0.5;
    });
    const subjectAttendance = Object.entries(subjectAttMap).map(([subject, stat]) => ({
      subject,
      total: stat.total,
      attended: Math.round(stat.attended),
      percentage: Math.round((stat.attended / stat.total) * 100)
    }));

    // 3. Marks & Assessment Breakdown
    const marks = await Mark.find({ student: id })
      .populate('subject', 'name code')
      .populate('assessment', 'title type maxMarks');

    // 4. Interventions
    const interventions = await Intervention.find({ student: id })
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    // 5. Relevant Campus Support Context
    const campusComplaints = await Complaint.find({
      student: student.user._id,
      status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] }
    }).populate('category', 'name');

    res.json({
      success: true,
      student,
      riskAssessment: risk,
      attendance: {
        overallPercentage: overallAttendance,
        totalClasses: totalAtt,
        presentClasses: presentAtt,
        lateClasses: lateAtt,
        subjectWise: subjectAttendance
      },
      marks,
      interventions,
      supportContext: campusComplaints.map(c => ({
        ticketId: c.ticketId,
        title: c.title,
        category: c.category?.name,
        location: `${c.block} - ${c.room}`,
        status: c.status,
        academicImpact: c.aiAnalysis?.academicImpact || 'NONE'
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordAttendance = async (req, res) => {
  try {
    const { studentId, subjectId, date, status, notes } = req.body;

    if (!studentId || !subjectId || !date || !status) {
      return res.status(400).json({ success: false, message: 'Missing required attendance fields.' });
    }

    // Server-side subject ownership validation
    const isAuthorized = await validateFacultySubject(req.user, subjectId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to mark attendance for this subject.'
      });
    }

    const record = await AttendanceRecord.findOneAndUpdate(
      { student: studentId, subject: subjectId, date: new Date(date).setHours(0, 0, 0, 0) },
      {
        student: studentId,
        subject: subjectId,
        faculty: req.user._id,
        date: new Date(date).setHours(0, 0, 0, 0),
        status,
        semester: 4,
        notes
      },
      { upsert: true, new: true }
    );

    // Safe Risk Recalculation Flow (catch errors to never fail the attendance save)
    let updatedRisk = null;
    try {
      updatedRisk = await calculateStudentRisk(studentId);
    } catch (riskErr) {
      console.error(`[FacultyController] Safe risk recalculation error for student ${studentId}:`, riskErr.message);
    }

    res.json({ success: true, record, updatedRisk });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordMarks = async (req, res) => {
  try {
    const { studentId, assessmentId, subjectId, scoredMarks, remarks } = req.body;
    if (!studentId || !assessmentId || scoredMarks === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required marks fields.' });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const targetSubject = subjectId || assessment.subject;

    // Server-side subject ownership validation
    const isAuthorized = await validateFacultySubject(req.user, targetSubject);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to record marks for this subject.'
      });
    }

    const percentage = Math.round((scoredMarks / assessment.maxMarks) * 100);

    const mark = await Mark.findOneAndUpdate(
      { student: studentId, assessment: assessmentId },
      {
        student: studentId,
        assessment: assessmentId,
        subject: targetSubject,
        scoredMarks,
        percentage,
        remarks,
        enteredBy: req.user._id
      },
      { upsert: true, new: true }
    );

    // Safe Risk Recalculation Flow
    let updatedRisk = null;
    try {
      updatedRisk = await calculateStudentRisk(studentId);
    } catch (riskErr) {
      console.error(`[FacultyController] Safe risk recalculation error for student ${studentId}:`, riskErr.message);
    }

    res.json({ success: true, mark, updatedRisk });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { subjectId, title, description, dueDate, maxScore, semester } = req.body;

    if (!subjectId || !title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Subject, title, and due date are required.' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ success: false, message: 'Subject not found.' });

    // Server-side ownership validation
    const isAuthorized = await validateFacultySubject(req.user, subjectId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to create assignments for this subject.'
      });
    }

    const targetSemester = semester || subject.semester;

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description || '',
      subject: subject._id,
      faculty: req.user._id,
      dueDate: new Date(dueDate),
      maxScore: maxScore || 10,
      semester: targetSemester
    });

    // Auto-create PENDING submissions for enrolled cohort students
    const cohortStudents = await Student.find({ currentSemester: targetSemester, course: subject.course });
    if (cohortStudents.length > 0) {
      const submissionDocs = cohortStudents.map(s => ({
        assignment: assignment._id,
        student: s._id,
        subject: subject._id,
        status: 'PENDING'
      }));
      await AssignmentSubmission.insertMany(submissionDocs, { ordered: false }).catch(() => {});
    }

    await logAudit({
      actor: req.user._id,
      action: 'ASSIGNMENT_CREATED',
      entity: 'Assignment',
      entityId: assignment._id,
      metadata: { title, subject: subject.name, semester: targetSemester }
    });

    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateAssignmentSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, score, feedback } = req.body;

    const submission = await AssignmentSubmission.findById(id).populate('assignment');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Assignment submission record not found.' });
    }

    const subjectId = submission.subject || submission.assignment?.subject;

    // Server-side ownership validation
    const isAuthorized = await validateFacultySubject(req.user, subjectId);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to grade assignments for this subject.'
      });
    }

    if (status) submission.status = status;
    if (score !== undefined) submission.score = score;
    if (feedback !== undefined) submission.feedback = feedback;
    if (status === 'COMPLETED' && !submission.submissionDate) {
      submission.submissionDate = new Date();
    }

    await submission.save();

    // Safe Risk Recalculation Flow
    let updatedRisk = null;
    try {
      updatedRisk = await calculateStudentRisk(submission.student);
    } catch (riskErr) {
      console.error(`[FacultyController] Safe risk recalculation error:`, riskErr.message);
    }

    const updatedStudent = await Student.findById(submission.student, 'currentRiskScore currentRiskLevel previousRiskScore previousRiskLevel riskTrend');

    res.json({
      success: true,
      submission,
      updatedRisk,
      studentSnapshot: updatedStudent
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInterventionsSummary = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const query = req.user.role === 'ADMIN' ? {} : { faculty: req.user._id };

    const all = await Intervention.find(query);
    const active = all.filter(i => ['PLANNED', 'ACTIVE'].includes(i.status)).length;
    const completed = all.filter(i => i.status === 'COMPLETED').length;
    const upcomingFollowUps = all.filter(i =>
      ['PLANNED', 'ACTIVE'].includes(i.status) &&
      i.followUpDate &&
      new Date(i.followUpDate) >= now &&
      new Date(i.followUpDate) <= next7Days
    ).length;
    const overdueFollowUps = all.filter(i =>
      ['PLANNED', 'ACTIVE'].includes(i.status) &&
      i.followUpDate &&
      new Date(i.followUpDate) < now
    ).length;

    res.json({
      success: true,
      summary: {
        total: all.length,
        active,
        completed,
        upcomingFollowUps,
        overdueFollowUps
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentRiskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const total = await RiskAssessment.countDocuments({ student: id });
    const history = await RiskAssessment.find({ student: id })
      .sort({ calculatedAt: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      studentId: id,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
