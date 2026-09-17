const AttendanceRecord = require('../models/AttendanceRecord');
const Mark = require('../models/Mark');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');
const PerformanceRecord = require('../models/PerformanceRecord');
const RiskAssessment = require('../models/RiskAssessment');
const Student = require('../models/Student');
const { sendNotification } = require('./socketService');

/**
 * Deterministic Explainable Academic Risk Calculation
 * Weight distribution:
 * - Attendance: 35%
 * - Internal Marks: 30%
 * - Assignment Completion: 20%
 * - Previous Performance / Trend: 15%
 *
 * Risk Thresholds:
 * - LOW: 0 - 25
 * - MEDIUM: 26 - 50
 * - HIGH: 51 - 75
 * - CRITICAL: 76 - 100
 */
async function calculateStudentRisk(studentId, forceRecalculate = false) {
  try {
    const student = await Student.findById(studentId).populate('user').populate('course');
    if (!student) throw new Error('Student not found');

    // 1. Fetch Attendance Records
    const attendanceRecords = await AttendanceRecord.find({ student: studentId }).populate('subject');
    let attendancePct = 85;
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length;
      const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
      attendancePct = Math.round(((presentCount + (lateCount * 0.5)) / attendanceRecords.length) * 100);
    }

    // 2. Fetch Marks & Assessments
    const marks = await Mark.find({ student: studentId }).populate('subject').populate('assessment');
    let internalMarksAvg = 75;
    const weakSubjects = [];
    if (marks.length > 0) {
      const totalPercentage = marks.reduce((acc, m) => acc + (m.percentage || (m.scoredMarks / (m.assessment?.maxMarks || 100) * 100)), 0);
      internalMarksAvg = Math.round(totalPercentage / marks.length);

      const subjectMap = {};
      marks.forEach(m => {
        const sName = m.subject?.name || 'Subject';
        const pct = m.percentage || (m.scoredMarks / (m.assessment?.maxMarks || 100) * 100);
        if (!subjectMap[sName]) subjectMap[sName] = [];
        subjectMap[sName].push(pct);
      });
      for (const [sName, pcts] of Object.entries(subjectMap)) {
        const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
        if (avg < 50) {
          weakSubjects.push({ subject: sName, average: Math.round(avg) });
        }
      }
    }

    // 3. Fetch Assignments & Submissions
    const assignments = await Assignment.find({ semester: student.currentSemester });
    const submissions = await AssignmentSubmission.find({ student: studentId });
    let assignmentCompletionRate = 80;
    let pendingAssignmentsCount = 0;
    if (assignments.length > 0) {
      const completedCount = submissions.filter(s => s.status === 'COMPLETED').length;
      assignmentCompletionRate = Math.round((completedCount / assignments.length) * 100);
      pendingAssignmentsCount = assignments.length - completedCount;
    }

    // 4. Fetch Previous Performance & Trend
    const performanceHistory = await PerformanceRecord.find({ student: studentId }).sort({ semester: -1 });
    let performanceTrend = 'STABLE';
    let cgpa = student.cgpa || 7.5;
    if (performanceHistory.length >= 2) {
      const recent = performanceHistory[0].sgpa;
      const previous = performanceHistory[1].sgpa;
      if (recent < previous - 0.3) performanceTrend = 'DECLINING';
      else if (recent > previous + 0.3) performanceTrend = 'IMPROVING';
      cgpa = performanceHistory[0].cgpa || cgpa;
    } else if (performanceHistory.length === 1) {
      performanceTrend = performanceHistory[0].trend || 'STABLE';
      cgpa = performanceHistory[0].cgpa || cgpa;
    }

    // 5. Compute Weighted Risk Points (0 - 100)
    const contributingFactors = [];

    // --- Component A: Attendance (Weight: 35 points max) ---
    // Benchmark is 75% minimum required by university rules
    let attendancePoints = 0;
    if (attendancePct >= 85) {
      attendancePoints = 0;
    } else if (attendancePct >= 80) {
      attendancePoints = 5;
    } else if (attendancePct >= 75) {
      attendancePoints = 12;
      contributingFactors.push({
        factor: 'Attendance near minimum threshold',
        severity: 'MEDIUM',
        impactScore: 12,
        detail: `Current attendance is ${attendancePct}%, close to the 75% exam cutoff.`
      });
    } else if (attendancePct >= 70) {
      attendancePoints = 16;
      contributingFactors.push({
        factor: 'Attendance below mandatory 75% threshold',
        severity: 'HIGH',
        impactScore: 16,
        detail: `Current attendance is ${attendancePct}%. Debarment warning.`
      });
    } else if (attendancePct >= 60) {
      attendancePoints = 25;
      contributingFactors.push({
        factor: 'Significant attendance shortage',
        severity: 'HIGH',
        impactScore: 25,
        detail: `Current attendance is ${attendancePct}%, failing 75% academic requirements.`
      });
    } else {
      attendancePoints = 35;
      contributingFactors.push({
        factor: 'Severe attendance deficiency',
        severity: 'CRITICAL',
        impactScore: 35,
        detail: `Critical attendance deficit (${attendancePct}%). Immediate intervention needed.`
      });
    }

    // --- Component B: Internal Marks (Weight: 30 points max) ---
    // Benchmark is 50% passing target
    let marksPoints = 0;
    if (internalMarksAvg >= 75) {
      marksPoints = 0;
    } else if (internalMarksAvg >= 65) {
      marksPoints = 6;
    } else if (internalMarksAvg >= 55) {
      marksPoints = 10;
      contributingFactors.push({
        factor: 'Moderate assessment scores',
        severity: 'MEDIUM',
        impactScore: 10,
        detail: `Average internal marks: ${internalMarksAvg}%.`
      });
    } else if (internalMarksAvg >= 50) {
      marksPoints = 14;
      contributingFactors.push({
        factor: 'Borderline internal passing performance',
        severity: 'MEDIUM',
        impactScore: 14,
        detail: `Average internal score: ${internalMarksAvg}%. Weak in fundamentals.`
      });
    } else if (internalMarksAvg >= 40) {
      marksPoints = 20;
      contributingFactors.push({
        factor: 'Internal marks below 50% passing threshold',
        severity: 'HIGH',
        impactScore: 20,
        detail: `Average internal score: ${internalMarksAvg}%. Weak performance in ${weakSubjects.map(w => w.subject).join(', ') || 'core modules'}.`
      });
    } else {
      marksPoints = 30;
      contributingFactors.push({
        factor: 'Critical academic failure in internal assessments',
        severity: 'CRITICAL',
        impactScore: 30,
        detail: `Average internal score is critically low (${internalMarksAvg}%).`
      });
    }

    // --- Component C: Assignment Completion (Weight: 20 points max) ---
    let assignmentPoints = 0;
    if (assignmentCompletionRate >= 90) {
      assignmentPoints = 0;
    } else if (assignmentCompletionRate >= 80) {
      assignmentPoints = 4;
    } else if (assignmentCompletionRate >= 70) {
      assignmentPoints = 8;
      contributingFactors.push({
        factor: 'Pending assignments backlog',
        severity: 'MEDIUM',
        impactScore: 8,
        detail: `${pendingAssignmentsCount} coursework assignments incomplete.`
      });
    } else if (assignmentCompletionRate >= 55) {
      assignmentPoints = 13;
      contributingFactors.push({
        factor: 'High volume of incomplete assignments',
        severity: 'HIGH',
        impactScore: 13,
        detail: `${pendingAssignmentsCount} assignments pending (${assignmentCompletionRate}% completion rate).`
      });
    } else {
      assignmentPoints = 20;
      contributingFactors.push({
        factor: 'Severe coursework backlog',
        severity: 'CRITICAL',
        impactScore: 20,
        detail: `Coursework completion rate is only ${assignmentCompletionRate}%.`
      });
    }

    // --- Component D: Previous Performance & Trend (Weight: 15 points max) ---
    let trendPoints = 0;
    if (performanceTrend === 'IMPROVING') {
      trendPoints = 0;
    } else if (performanceTrend === 'STABLE') {
      trendPoints = cgpa < 6.5 ? 4 : 2;
    } else if (performanceTrend === 'DECLINING') {
      trendPoints = 12;
      contributingFactors.push({
        factor: 'Persistent downward academic trajectory',
        severity: 'MEDIUM',
        impactScore: 12,
        detail: 'SGPA shows declining trend across successive semesters.'
      });
    }

    // Mathematical Total Score (0 - 100)
    const riskScore = Math.min(100, Math.max(0, Math.round(attendancePoints + marksPoints + assignmentPoints + trendPoints)));

    // Exact Threshold Classification (LOW: 0-25, MEDIUM: 26-50, HIGH: 51-75, CRITICAL: 76-100)
    let riskLevel = 'LOW';
    if (riskScore >= 76) riskLevel = 'CRITICAL';
    else if (riskScore >= 51) riskLevel = 'HIGH';
    else if (riskScore >= 26) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // 6. Generate Explainable Narrative
    let explanation = '';
    if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
      const reasons = [];
      if (attendancePct < 75) reasons.push(`attendance is ${attendancePct}% (below the 75% requirement)`);
      if (internalMarksAvg < 50) reasons.push(`internal marks average is ${internalMarksAvg}%`);
      if (pendingAssignmentsCount > 0) reasons.push(`${pendingAssignmentsCount} assignments are currently pending`);
      if (performanceTrend === 'DECLINING') reasons.push('recent semester performance shows a downward trend');
      explanation = `Academic risk is elevated (${riskScore}/100 - ${riskLevel}) because ${reasons.join(', ')}. Proactive faculty mentorship and structured study hours are advised.`;
    } else if (riskLevel === 'MEDIUM') {
      explanation = `Student is at moderate academic risk (${riskScore}/100). Key areas for attention include maintaining consistent attendance and finishing remaining assignments before deadlines.`;
    } else {
      explanation = `Student is in good academic standing (${riskScore}/100 - LOW RISK). Attendance (${attendancePct}%) and assessment scores are comfortably on track.`;
    }

    // 7. Generate Personalized Recommendations
    const recommendations = [];
    if (attendancePct < 75) {
      recommendations.push({
        category: 'ATTENDANCE',
        title: 'Improve Lecture Attendance',
        action: `Attend upcoming scheduled classes consistently to bring attendance from ${attendancePct}% to at least 75%.`,
        targetMetric: '75% Attendance',
        priority: 'HIGH'
      });
    }
    if (pendingAssignmentsCount > 0) {
      recommendations.push({
        category: 'ASSIGNMENTS',
        title: 'Complete Pending Coursework',
        action: `Complete and submit ${pendingAssignmentsCount} pending assignments within the next 7 days.`,
        targetMetric: '100% Submission',
        priority: 'HIGH'
      });
    }
    if (weakSubjects.length > 0) {
      weakSubjects.forEach(ws => {
        recommendations.push({
          category: 'ACADEMIC_STUDY',
          title: `Remedial Revision in ${ws.subject}`,
          action: `Review recent assessment topics and lecture notes for ${ws.subject} (current average: ${ws.average}%).`,
          targetMetric: 'Score >= 60%',
          priority: 'HIGH'
        });
      });
    } else if (internalMarksAvg < 60) {
      recommendations.push({
        category: 'ACADEMIC_STUDY',
        title: 'Structured Subject Revision',
        action: 'Attend faculty tutorial sessions and review core syllabus modules.',
        targetMetric: 'Improve Marks by 15%',
        priority: 'MEDIUM'
      });
    }
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      recommendations.push({
        category: 'FACULTY_GUIDANCE',
        title: 'Meet Assigned Faculty Mentor',
        action: 'Schedule an academic guidance session with your faculty mentor for an individualized study plan.',
        targetMetric: '1 Mentoring Session',
        priority: 'HIGH'
      });
    }

    // 8. Fetch Latest Risk Assessment to check for duplication & compute trend
    const latestAssessment = await RiskAssessment.findOne({ student: studentId }).sort({ calculatedAt: -1 });

    // Deduplication check: Avoid inserting redundant duplicates if inputs and score are identical
    if (
      !forceRecalculate &&
      latestAssessment &&
      latestAssessment.riskScore === riskScore &&
      latestAssessment.riskLevel === riskLevel &&
      latestAssessment.metrics.attendancePercentage === attendancePct &&
      latestAssessment.metrics.internalMarksAverage === internalMarksAvg &&
      latestAssessment.metrics.assignmentCompletionRate === assignmentCompletionRate &&
      latestAssessment.metrics.performanceTrend === performanceTrend
    ) {
      return latestAssessment;
    }

    // Determine Trend relative to previous assessment
    let previousRiskScore = null;
    let previousRiskLevel = null;
    let riskTrend = 'NEW';

    if (latestAssessment) {
      previousRiskScore = latestAssessment.riskScore;
      previousRiskLevel = latestAssessment.riskLevel;
      if (riskScore > previousRiskScore) riskTrend = 'INCREASED';
      else if (riskScore < previousRiskScore) riskTrend = 'DECREASED';
      else riskTrend = 'UNCHANGED';
    }

    // Save fresh historical RiskAssessment
    const riskAssessment = await RiskAssessment.create({
      student: studentId,
      riskLevel,
      riskScore,
      previousRiskScore,
      previousRiskLevel,
      riskTrend,
      metrics: {
        attendancePercentage: attendancePct,
        internalMarksAverage: internalMarksAvg,
        assignmentCompletionRate,
        pendingAssignmentsCount,
        performanceTrend,
        cgpa
      },
      contributingFactors,
      explanation,
      recommendations,
      aiMetadata: {
        engine: 'DETERMINISTIC_EXPLAINABLE_V1',
        model: 'eduguard-risk-engine-v1',
        confidence: 0.96,
        isFallback: false
      },
      calculatedAt: new Date()
    });

    // Update Student current cached risk snapshot
    student.currentRiskLevel = riskLevel;
    student.currentRiskScore = riskScore;
    student.previousRiskLevel = previousRiskLevel;
    student.previousRiskScore = previousRiskScore;
    student.riskTrend = riskTrend;
    student.lastRiskAssessment = new Date();
    await student.save();

    // Trigger Notification only on meaningful risk level transition
    if (previousRiskLevel && previousRiskLevel !== riskLevel && student.user?._id) {
      await sendNotification({
        recipientId: student.user._id,
        title: `Academic Risk Level Updated: ${riskLevel}`,
        message: `Your academic risk level has changed from ${previousRiskLevel} to ${riskLevel} (Score: ${riskScore}/100). Check recommendations.`,
        type: 'RISK_UPDATED',
        data: { link: '#student' }
      });
    }

    return riskAssessment;
  } catch (err) {
    console.error(`[RiskEngine] Error calculating risk for student ${studentId}:`, err.message);
    // Return graceful fallback without corrupting caller data
    return null;
  }
}

module.exports = {
  calculateStudentRisk
};
