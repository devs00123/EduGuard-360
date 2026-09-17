const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const PerformanceRecord = require('../models/PerformanceRecord');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const Complaint = require('../models/Complaint');
const { calculateStudentRisk } = require('../services/riskEngine');

exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('user', 'name email avatar phone')
      .populate('course')
      .populate('academicSession')
      .populate('mentorFaculty', 'name email');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const records = await AttendanceRecord.find({ student: student._id })
      .populate('subject', 'name code credits')
      .sort({ date: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'PRESENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const overallPercentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 100;

    // Subject breakdown
    const subjectMap = {};
    records.forEach(r => {
      const sId = r.subject?._id.toString() || 'unknown';
      const sName = r.subject?.name || 'General Subject';
      const sCode = r.subject?.code || '';
      if (!subjectMap[sId]) {
        subjectMap[sId] = { subjectId: sId, subjectName: sName, subjectCode: sCode, total: 0, present: 0, late: 0, absent: 0 };
      }
      subjectMap[sId].total++;
      if (r.status === 'PRESENT') subjectMap[sId].present++;
      else if (r.status === 'LATE') subjectMap[sId].late++;
      else subjectMap[sId].absent++;
    });

    const subjectWise = Object.values(subjectMap).map(s => ({
      ...s,
      percentage: Math.round(((s.present + s.late * 0.5) / s.total) * 100)
    }));

    res.json({
      success: true,
      stats: {
        total,
        present,
        late,
        absent,
        overallPercentage
      },
      subjectWise,
      recentRecords: records.slice(0, 30)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyMarks = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const marks = await Mark.find({ student: student._id })
      .populate('subject', 'name code')
      .populate('assessment', 'title type maxMarks passingMarks');

    const totalPercentage = marks.reduce((acc, m) => acc + m.percentage, 0);
    const average = marks.length > 0 ? Math.round(totalPercentage / marks.length) : 0;

    res.json({
      success: true,
      average,
      totalAssessments: marks.length,
      marks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const assignments = await Assignment.find({ semester: student.currentSemester })
      .populate('subject', 'name code')
      .populate('faculty', 'name')
      .sort({ dueDate: 1 });

    const submissions = await AssignmentSubmission.find({ student: student._id });
    const subMap = {};
    submissions.forEach(s => { subMap[s.assignment.toString()] = s; });

    const result = assignments.map(a => {
      const sub = subMap[a._id.toString()];
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        subject: a.subject,
        faculty: a.faculty,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        submissionStatus: sub ? sub.status : 'PENDING',
        score: sub ? sub.score : null,
        submissionDate: sub ? sub.submissionDate : null
      };
    });

    const completed = result.filter(r => r.submissionStatus === 'COMPLETED').length;
    const pending = result.filter(r => r.submissionStatus === 'PENDING').length;
    const late = result.filter(r => r.submissionStatus === 'LATE').length;
    const completionRate = result.length > 0 ? Math.round((completed / result.length) * 100) : 100;

    res.json({
      success: true,
      stats: {
        total: result.length,
        completed,
        pending,
        late,
        completionRate
      },
      assignments: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyPerformance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const history = await PerformanceRecord.find({ student: student._id }).sort({ semester: 1 });
    res.json({
      success: true,
      currentCgpa: student.cgpa,
      history
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyRisk = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    let assessment = await RiskAssessment.findOne({ student: student._id }).sort({ calculatedAt: -1 });
    if (!assessment || req.query.refresh === 'true') {
      assessment = await calculateStudentRisk(student._id);
    }

    res.json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Combined Student Success & Support Insights
 * Combines academic indicators with relevant campus support context
 */
exports.getMySupportInsights = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Latest Risk Assessment
    let risk = await RiskAssessment.findOne({ student: student._id }).sort({ calculatedAt: -1 });
    if (!risk) {
      risk = await calculateStudentRisk(student._id);
    }

    // Active Interventions
    const activeInterventions = await Intervention.find({
      student: student._id,
      status: { $in: ['PLANNED', 'ACTIVE'] }
    }).populate('faculty', 'name email');

    // Active Campus Complaints submitted by this student
    const activeComplaints = await Complaint.find({
      student: req.user._id,
      status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] }
    }).populate('category', 'name');

    // Summarize contextual support information
    const supportContext = activeComplaints.map(c => ({
      ticketId: c.ticketId,
      title: c.title,
      category: c.category?.name || 'Campus Issue',
      location: `${c.block} - ${c.room}`,
      academicImpact: c.aiAnalysis?.academicImpact || 'NONE',
      status: c.status
    }));

    res.json({
      success: true,
      academicSummary: {
        riskLevel: risk.riskLevel,
        riskScore: risk.riskScore,
        attendance: risk.metrics?.attendancePercentage,
        marksAverage: risk.metrics?.internalMarksAverage,
        pendingAssignments: risk.metrics?.pendingAssignmentsCount,
        trend: risk.metrics?.performanceTrend
      },
      interventionsCount: activeInterventions.length,
      activeInterventions,
      campusSupportContext: {
        activeIssuesCount: activeComplaints.length,
        contextSummary: activeComplaints.length > 0
          ? `${activeComplaints.length} active campus issue(s) recorded in student area.`
          : 'No active campus facility issues affecting student.',
        issues: supportContext
      },
      note: 'Campus complaint records are presented strictly as relevant support context.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
