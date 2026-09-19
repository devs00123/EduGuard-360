const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  resetUserPassword,
  toggleUserStatus,
  deleteUser,
  getDepartments,
  getCourses,
  createDepartment,
  getCategories,
  createCategory,
  getLocations,
  getSlaRules,
  updateSlaRule,
  getAuditLogs,
  getFaqs,
  getEmergencyContacts
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/users/:id/reset-password', resetUserPassword);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);
router.get('/departments', getDepartments);
router.get('/courses', getCourses);
router.post('/departments', createDepartment);
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.get('/locations', getLocations);
router.get('/sla-rules', getSlaRules);
router.patch('/sla-rules/:id', updateSlaRule);
router.get('/audit-logs', getAuditLogs);
router.get('/faqs', getFaqs);
router.get('/emergency-contacts', getEmergencyContacts);

module.exports = router;
