const Intervention = require('../models/Intervention');
const Student = require('../models/Student');
const RiskAssessment = require('../models/RiskAssessment');
const { calculateStudentRisk } = require('../services/riskEngine');
const { sendNotification } = require('../services/socketService');
const { logAudit } = require('../services/auditService');

exports.createIntervention = async (req, res) => {
  try {
    const { studentId, reason, actionPlan, followUpDate, notes } = req.body;

    const student = await Student.findById(studentId).populate('user');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Fetch current metrics as baseline
    const currentRisk = await RiskAssessment.findOne({ student: studentId }).sort({ calculatedAt: -1 });

    const beforeMetrics = {
      attendance: currentRisk?.metrics?.attendancePercentage || 65,
      marks: currentRisk?.metrics?.internalMarksAverage || 50,
      assignmentCompletion: currentRisk?.metrics?.assignmentCompletionRate || 60,
      riskScore: student.currentRiskScore || 70
    };

    const parsedActionPlan = Array.isArray(actionPlan)
      ? actionPlan.map(task => typeof task === 'string' ? { task, completed: false } : task)
      : [{ task: actionPlan || 'Complete remedial sessions', completed: false }];

    const intervention = await Intervention.create({
      student: studentId,
      faculty: req.user._id,
      riskLevel: student.currentRiskLevel,
      reason,
      actionPlan: parsedActionPlan,
      followUpDate: new Date(followUpDate),
      notes: notes || '',
      status: 'ACTIVE',
      beforeMetrics
    });

    // Notify the student
    await sendNotification({
      recipientId: student.user._id,
      title: 'New Faculty Academic Support Plan',
      message: `Your faculty mentor (${req.user.name}) has initiated a personalized intervention plan. Reason: ${reason}`,
      type: 'INTERVENTION_CREATED',
      data: { interventionId: intervention._id, link: '#academics' }
    });

    await logAudit({
      actor: req.user._id,
      action: 'INTERVENTION_CREATED',
      entity: 'Intervention',
      entityId: intervention._id,
      metadata: { studentId, riskLevel: student.currentRiskLevel }
    });

    res.status(201).json({ success: true, intervention });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionPlan, notes, outcome, followUpDate } = req.body;

    const intervention = await Intervention.findById(id).populate('student');
    if (!intervention) return res.status(404).json({ success: false, message: 'Intervention not found.' });

    if (status) intervention.status = status;
    if (actionPlan) intervention.actionPlan = actionPlan;
    if (notes !== undefined) intervention.notes = notes;
    if (outcome !== undefined) intervention.outcome = outcome;
    if (followUpDate) intervention.followUpDate = new Date(followUpDate);

    if (status === 'COMPLETED') {
      intervention.completedAt = new Date();
      // Re-evaluate student's fresh metrics
      const freshAssessment = await calculateStudentRisk(intervention.student._id);
      intervention.afterMetrics = {
        attendance: freshAssessment.metrics?.attendancePercentage || 75,
        marks: freshAssessment.metrics?.internalMarksAverage || 65,
        assignmentCompletion: freshAssessment.metrics?.assignmentCompletionRate || 85,
        riskScore: freshAssessment.riskScore
      };
    }

    await intervention.save();

    await logAudit({
      actor: req.user._id,
      action: 'INTERVENTION_UPDATED',
      entity: 'Intervention',
      entityId: intervention._id,
      metadata: { status: intervention.status }
    });

    res.json({ success: true, intervention });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getInterventionsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const interventions = await Intervention.find({ student: studentId })
      .populate('faculty', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, interventions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
