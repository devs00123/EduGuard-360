const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const Assessment = require('../models/Assessment');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const Complaint = require('../models/Complaint');
const { calculateStudentRisk } = require('../services/riskEngine');
const { sendNotification } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

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

    let students = await Student.find(query)
      .populate('user', 'name email avatar phone')
      .populate('course', 'name code')
      .sort({ currentRiskScore: -1 });

    if (search) {
      const sLower = search.toLowerCase();
      students = students.filter(s =>
        (s.user?.name && s.user.name.toLowerCase().includes(sLower)) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(sLower))
      );
    }

    // Attach latest active intervention status for each student
    const studentIds = students.map(s => s._id);
    const activeInterventions = await Intervention.find({
      student: { $in: studentIds },
      status: { $in: ['PLANNED', 'ACTIVE'] }
    });

    const interventionMap = {};
    activeInterventions.forEach(i => {
      interventionMap[i.student.toString()] = i;
    });

    const formatted = students.map(s => ({
      _id: s._id,
      name: s.user?.name,
      email: s.user?.email,
      rollNumber: s.rollNumber,
      course: s.course?.name,
      semester: s.currentSemester,
      section: s.section,
      riskLevel: s.currentRiskLevel,
      riskScore: s.currentRiskScore,
      lastAssessed: s.lastRiskAssessment,
      activeIntervention: interventionMap[s._id.toString()] || null
    }));

    res.json({
      success: true,
      count: formatted.length,
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

    // Recalculate Risk
    await calculateStudentRisk(studentId);

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordMarks = async (req, res) => {
  try {
    const { studentId, assessmentId, subjectId, scoredMarks, remarks } = req.body;
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });

    const percentage = Math.round((scoredMarks / assessment.maxMarks) * 100);

    const mark = await Mark.findOneAndUpdate(
      { student: studentId, assessment: assessmentId },
      {
        student: studentId,
        assessment: assessmentId,
        subject: subjectId,
        scoredMarks,
        percentage,
        remarks,
        enteredBy: req.user._id
      },
      { upsert: true, new: true }
    );

    // Recalculate Risk
    await calculateStudentRisk(studentId);

    res.json({ success: true, mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
