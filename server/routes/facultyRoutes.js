const express = require('express');
const router = express.Router();
const {
  getAssignedClasses,
  getStudentsList,
  getAtRiskStudents,
  getStudentDetail,
  recordAttendance,
  recordMarks
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('FACULTY', 'ADMIN'));

router.get('/classes', getAssignedClasses);
router.get('/students', getStudentsList);
router.get('/at-risk', getAtRiskStudents);
router.get('/students/:id', getStudentDetail);
router.post('/attendance', recordAttendance);
router.post('/marks', recordMarks);

module.exports = router;
