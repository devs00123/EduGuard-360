const express = require('express');
const router = express.Router();
const { register, staffRegister, forgotPassword, login, demoLogin, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/staff-register', staffRegister);
router.post('/forgot-password', forgotPassword);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
