const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Department = require('../models/Department');
const { logAudit } = require('../services/auditService');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, department: user.department },
    process.env.JWT_SECRET || 'eduguard360_super_secret_jwt_key_hackathon_2026_secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, rollNumber, courseId, semester = 1, batch = '2023-2027', departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
    }

    // MANDATORY SECURITY REQUIREMENT: Public registration must ALWAYS force STUDENT role.
    // Client-side role tampering (e.g. role: 'ADMIN') is strictly ignored.
    const role = 'STUDENT';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    let resolvedDept = departmentId;
    if (!resolvedDept) {
      const defaultDept = await Department.findOne();
      if (defaultDept) resolvedDept = defaultDept._id;
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: resolvedDept || null
    });

    let resolvedCourse = courseId;
    if (!resolvedCourse) {
      const defaultCourse = await Course.findOne();
      if (defaultCourse) resolvedCourse = defaultCourse._id;
    }

    const studentRoll = rollNumber || `STD-${Math.floor(100000 + Math.random() * 900000)}`;
    await Student.create({
      user: user._id,
      rollNumber: studentRoll,
      course: resolvedCourse,
      currentSemester: parseInt(semester) || 1,
      batch
    });

    const token = generateToken(user);

    await logAudit({
      actor: user._id,
      action: 'USER_REGISTER',
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.staffRegister = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, departmentId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, institutional email, and password.' });
    }

    // Zero Privilege Escalation: Public creation of ADMIN is strictly forbidden
    if (role === 'ADMIN' || !role) {
      return res.status(403).json({
        success: false,
        message: 'Security Policy: Administrator accounts can only be provisioned directly by the System Dean.'
      });
    }

    const allowedRoles = ['FACULTY', 'DEPARTMENT_STAFF', 'DEPARTMENT_HEAD'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role requested. Allowed roles are: ${allowedRoles.join(', ')}.`
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this institutional email already exists.' });
    }

    let resolvedDept = departmentId;
    if (!resolvedDept) {
      const defaultDept = await Department.findOne();
      if (defaultDept) resolvedDept = defaultDept._id;
    }

    // Staff registration is created in pending clearance mode (isActive: false)
    const user = await User.create({
      name,
      email,
      password,
      role,
      department: resolvedDept || null,
      isActive: false
    });

    await logAudit({
      actor: user._id,
      action: 'STAFF_ACCESS_REQUESTED',
      entity: 'User',
      entityId: user._id,
      metadata: { requestedRole: role, employeeId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      message: `Institutional clearance requested for ${role.replace('_', ' ')}. Your account is pending Institutional Dean verification.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered institutional email.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      await logAudit({
        actor: user._id,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'User',
        entityId: user._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    // Generic safe message prevents email enumeration
    res.json({
      success: true,
      message: 'If an active account matches that email address, security password recovery instructions have been dispatched.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await logAudit({
      actor: user._id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      return res.status(403).json({
        success: false,
        message: 'Demo role switching is disabled in production mode. Please sign in with valid credentials.'
      });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role parameter required for demo login.' });
    }

    const user = await User.findOne({ role, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: `No active user found for role ${role}. Please run seed first.` });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    await logAudit({
      actor: user._id,
      action: 'DEMO_LOGIN',
      entity: 'User',
      entityId: user._id,
      metadata: { demoRole: role }
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    let studentData = null;
    let facultyData = null;

    if (req.user.role === 'STUDENT') {
      studentData = await Student.findOne({ user: req.user._id })
        .populate('course')
        .populate('academicSession')
        .populate('mentorFaculty', 'name email');
    } else if (req.user.role === 'FACULTY') {
      facultyData = await Faculty.findOne({ user: req.user._id })
        .populate('department')
        .populate('assignedSubjects');
    }

    res.json({
      success: true,
      user: req.user,
      studentData,
      facultyData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  if (req.user) {
    await logAudit({
      actor: req.user._id,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: req.user._id
    });
  }
  res.json({ success: true, message: 'Logged out successfully.' });
};
