const Student = require('../models/Student');
const RiskAssessment = require('../models/RiskAssessment');
const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Intervention = require('../models/Intervention');
const Complaint = require('../models/Complaint');
const ComplaintCategory = require('../models/ComplaintCategory');
const Department = require('../models/Department');

exports.getAcademicAnalytics = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const lowRiskCount = await Student.countDocuments({ currentRiskLevel: 'LOW' });
    const mediumRiskCount = await Student.countDocuments({ currentRiskLevel: 'MEDIUM' });
    const highRiskCount = await Student.countDocuments({ currentRiskLevel: 'HIGH' });
    const criticalRiskCount = await Student.countDocuments({ currentRiskLevel: 'CRITICAL' });

    // Attendance stats
    const attendanceRecords = await AttendanceRecord.find();
    let overallAttendance = 82;
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const late = attendanceRecords.filter(r => r.status === 'LATE').length;
      overallAttendance = Math.round(((present + late * 0.5) / attendanceRecords.length) * 100);
    }

    // Marks stats
    const marks = await Mark.find();
    let averageMarks = 68;
    if (marks.length > 0) {
      averageMarks = Math.round(marks.reduce((a, b) => a + b.percentage, 0) / marks.length);
    }

    // Assignment stats
    const assignments = await Assignment.find();
    const submissions = await AssignmentSubmission.find();
    let assignmentCompletion = 78;
    if (assignments.length > 0) {
      const expectedTotal = assignments.length * Math.max(1, totalStudents);
      const completed = submissions.filter(s => s.status === 'COMPLETED').length;
      assignmentCompletion = Math.min(100, Math.round((completed / expectedTotal) * 100));
    }

    // Interventions
    const totalInterventions = await Intervention.countDocuments();
    const activeInterventions = await Intervention.countDocuments({ status: { $in: ['PLANNED', 'ACTIVE'] } });
    const completedInterventions = await Intervention.countDocuments({ status: 'COMPLETED' });

    res.json({
      success: true,
      summary: {
        totalStudents,
        riskDistribution: {
          low: lowRiskCount,
          medium: mediumRiskCount,
          high: highRiskCount,
          critical: criticalRiskCount
        },
        atRiskPercentage: totalStudents > 0 ? Math.round(((highRiskCount + criticalRiskCount) / totalStudents) * 100) : 0,
        overallAttendance,
        averageMarks,
        assignmentCompletion,
        interventions: {
          total: totalInterventions,
          active: activeInterventions,
          completed: completedInterventions
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCampusAnalytics = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const openCount = await Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED'] } });
    const inProgressCount = await Complaint.countDocuments({ status: { $in: ['ACKNOWLEDGED', 'IN_PROGRESS'] } });
    const resolvedCount = await Complaint.countDocuments({ status: { $in: ['RESOLVED', 'STUDENT_CONFIRMED'] } });
    const criticalCount = await Complaint.countDocuments({ priority: 'CRITICAL' });
    const breachedCount = await Complaint.countDocuments({ isSlaBreached: true });

    // Category Distribution
    const complaints = await Complaint.find().populate('category', 'name').populate('department', 'name');
    const categoryStats = {};
    complaints.forEach(c => {
      const name = c.category?.name || 'General';
      categoryStats[name] = (categoryStats[name] || 0) + 1;
    });

    // Department Distribution
    const departmentStats = {};
    complaints.forEach(c => {
      const name = c.department?.name || 'Unassigned';
      departmentStats[name] = (departmentStats[name] || 0) + 1;
    });

    // Priority Distribution
    const priorityStats = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    complaints.forEach(c => {
      if (priorityStats[c.priority] !== undefined) priorityStats[c.priority]++;
    });

    // SLA Performance
    const nonBreached = totalComplaints - breachedCount;
    const slaComplianceRate = totalComplaints > 0 ? Math.round((nonBreached / totalComplaints) * 100) : 100;

    res.json({
      success: true,
      summary: {
        totalComplaints,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        critical: criticalCount,
        slaBreached: breachedCount,
        slaComplianceRate
      },
      categoryStats,
      departmentStats,
      priorityStats
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCombinedSupportInsights = async (req, res) => {
  try {
    const atRiskStudents = await Student.find({ currentRiskLevel: { $in: ['HIGH', 'CRITICAL'] } }).populate('user');
    const studentUserIds = atRiskStudents.map(s => s.user?._id).filter(Boolean);

    // Active complaints by at-risk students
    const activeComplaints = await Complaint.find({
      student: { $in: studentUserIds },
      status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] }
    }).populate('student', 'name email').populate('category', 'name');

    res.json({
      success: true,
      atRiskCount: atRiskStudents.length,
      complaintsFromAtRiskStudents: activeComplaints.length,
      insights: activeComplaints.map(c => ({
        ticketId: c.ticketId,
        studentName: c.student?.name,
        issue: c.title,
        category: c.category?.name,
        location: `${c.block} - ${c.room}`,
        academicImpact: c.aiAnalysis?.academicImpact || 'NONE'
      })),
      contextNote: 'Contextual support indicators displayed without causal inference.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportAcademicReportCsv = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email')
      .populate('course', 'name')
      .sort({ currentRiskScore: -1 });

    let csv = 'Roll Number,Student Name,Email,Course,Semester,Risk Level,Risk Score,CGPA\n';
    students.forEach(s => {
      csv += `"${s.rollNumber}","${s.user?.name || ''}","${s.user?.email || ''}","${s.course?.name || ''}",${s.currentSemester},"${s.currentRiskLevel}",${s.currentRiskScore},${s.cgpa}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="eduguard_academic_risk_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportCampusComplaintsCsv = async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('student', 'name email')
      .populate('category', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    let csv = 'Ticket ID,Title,Student,Category,Department,Block,Room,Priority,Status,SLA Breached,Created At\n';
    complaints.forEach(c => {
      csv += `"${c.ticketId}","${c.title.replace(/"/g, '""')}","${c.student?.name || ''}","${c.category?.name || ''}","${c.department?.name || ''}","${c.block}","${c.room}","${c.priority}","${c.status}",${c.isSlaBreached},"${c.createdAt.toISOString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="eduguard_campus_complaints_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
