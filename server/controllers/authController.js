const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
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
    const { name, email, password, role = 'STUDENT', rollNumber, courseId, semester = 1, batch = '2023-2027', departmentId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department: departmentId || null
    });

    if (role === 'STUDENT') {
      await Student.create({
        user: user._id,
        rollNumber: rollNumber || `STD-${Math.floor(100000 + Math.random() * 900000)}`,
        course: courseId,
        currentSemester: semester,
        batch
      });
    }

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
