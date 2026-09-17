const express = require('express');
const router = express.Router();
const {
  getAcademicAnalytics,
  getCampusAnalytics,
  getCombinedSupportInsights,
  exportAcademicReportCsv,
  exportCampusComplaintsCsv
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/academic', authorize('FACULTY', 'DEPARTMENT_HEAD', 'ADMIN'), getAcademicAnalytics);
router.get('/campus', authorize('DEPARTMENT_STAFF', 'DEPARTMENT_HEAD', 'ADMIN'), getCampusAnalytics);
router.get('/support', authorize('FACULTY', 'DEPARTMENT_HEAD', 'ADMIN'), getCombinedSupportInsights);
router.get('/export/academic', authorize('FACULTY', 'ADMIN'), exportAcademicReportCsv);
router.get('/export/campus', authorize('DEPARTMENT_HEAD', 'ADMIN'), exportCampusComplaintsCsv);

module.exports = router;
