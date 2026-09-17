const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  getMyAttendance,
  getMyMarks,
  getMyAssignments,
  getMyPerformance,
  getMyRisk,
  getMySupportInsights
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('STUDENT'));

router.get('/me', getMyProfile);
router.get('/me/attendance', getMyAttendance);
router.get('/me/marks', getMyMarks);
router.get('/me/assignments', getMyAssignments);
router.get('/me/performance', getMyPerformance);
router.get('/me/risk', getMyRisk);
router.get('/me/support-insights', getMySupportInsights);

module.exports = router;
