const express = require('express');
const router = express.Router();
const { register, staffRegister, forgotPassword, login, demoLogin, googleAuth, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/staff-register', staffRegister);
router.post('/forgot-password', forgotPassword);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/google', googleAuth);
router.post('/google-login', googleAuth);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
