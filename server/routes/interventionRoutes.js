const express = require('express');
const router = express.Router();
const {
  createIntervention,
  updateIntervention,
  getInterventionsForStudent
} = require('../controllers/interventionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('FACULTY', 'ADMIN'), createIntervention);
router.patch('/:id', authorize('FACULTY', 'ADMIN'), updateIntervention);
router.get('/student/:studentId', getInterventionsForStudent);

module.exports = router;
