const express = require('express');
const router = express.Router();
const {
  getAssignedClasses,
  getStudentsList,
  getAtRiskStudents,
  getStudentDetail,
  recordAttendance,
  recordMarks,
  createAssignment,
  updateAssignmentSubmission,
  getInterventionsSummary,
  getStudentRiskHistory
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('FACULTY', 'ADMIN'));

router.get('/classes', getAssignedClasses);
router.get('/students', getStudentsList);
router.get('/at-risk', getAtRiskStudents);
router.get('/students/:id', getStudentDetail);
router.get('/students/:id/risk-history', getStudentRiskHistory);
router.get('/interventions-summary', getInterventionsSummary);

router.post('/attendance', recordAttendance);
router.post('/marks', recordMarks);

router.post('/assignments', createAssignment);
router.patch('/assignments/submissions/:id', updateAssignmentSubmission);

module.exports = router;
