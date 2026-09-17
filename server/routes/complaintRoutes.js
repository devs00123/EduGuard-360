const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateStatus,
  resolveComplaint,
  confirmResolution,
  reopenComplaint,
  escalateComplaint,
  adminOverride,
  getClusters
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', upload.array('attachments', 3), createComplaint);
router.get('/', getComplaints);
router.get('/clusters', getClusters);
router.get('/:id', getComplaintById);
router.patch('/:id/assign', authorize('DEPARTMENT_HEAD', 'ADMIN'), assignComplaint);
router.patch('/:id/status', authorize('DEPARTMENT_STAFF', 'DEPARTMENT_HEAD', 'ADMIN'), updateStatus);
router.post('/:id/resolve', authorize('DEPARTMENT_STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'FACULTY'), upload.single('resolutionProof'), resolveComplaint);
router.post('/:id/confirm', authorize('STUDENT'), confirmResolution);
router.post('/:id/reopen', authorize('STUDENT', 'ADMIN'), reopenComplaint);
router.post('/:id/escalate', escalateComplaint);
router.patch('/:id/override', authorize('ADMIN'), adminOverride);

module.exports = router;
