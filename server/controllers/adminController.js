const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const ComplaintCategory = require('../models/ComplaintCategory');
const Location = require('../models/Location');
const SlaRule = require('../models/SlaRule');
const AuditLog = require('../models/AuditLog');
const FAQ = require('../models/FAQ');
const EmergencyContact = require('../models/EmergencyContact');

exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const query = {};
    if (role && role !== 'ALL') query.role = role;
    if (search) {
      const s = search.toLowerCase().trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } }
      ];
    }

    const users = await User.find(query).populate('department', 'name code').sort({ createdAt: -1 }).lean();

    // Enrich with student rollNumber/course or faculty employeeId
    const userIds = users.map(u => u._id);
    const [students, facultyList] = await Promise.all([
      Student.find({ user: { $in: userIds } }).populate('course', 'name code').lean(),
      Faculty.find({ user: { $in: userIds } }).lean()
    ]);

    const studentMap = {};
    students.forEach(s => { studentMap[s.user.toString()] = s; });
    const facultyMap = {};
    facultyList.forEach(f => { facultyMap[f.user.toString()] = f; });

    const enriched = users.map(u => {
      const s = studentMap[u._id.toString()];
      const f = facultyMap[u._id.toString()];
      return {
        ...u,
        studentProfile: s ? {
          rollNumber: s.rollNumber,
          course: s.course?.name || '',
          courseCode: s.course?.code || '',
          semester: s.currentSemester,
          batch: s.batch,
          riskLevel: s.currentRiskLevel,
          riskScore: s.currentRiskScore
        } : null,
        facultyProfile: f ? {
          employeeId: f.employeeId,
          designation: f.designation,
          specialization: f.specialization
        } : null
      };
    });

    res.json({ success: true, count: enriched.length, users: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().populate('head', 'name email').sort({ name: 1 });
    res.json({ success: true, departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('department', 'name code').sort({ name: 1 });
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, department: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await ComplaintCategory.find().populate('defaultDepartment', 'name code').sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const cat = await ComplaintCategory.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ block: 1, room: 1 });
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSlaRules = async (req, res) => {
  try {
    const rules = await SlaRule.find().sort({ maxResolutionHours: 1 });
    res.json({ success: true, rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSlaRule = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await SlaRule.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFaqs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getEmergencyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find().sort({ department: 1 });
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      phone,
      rollNumber,
      course,
      currentSemester,
      section,
      batch,
      employeeId,
      designation,
      specialization
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: `User with email ${cleanEmail} already exists` });
    }

    const initialPassword = (password && password.trim().length >= 6)
      ? password.trim()
      : `Campus@${Math.floor(100000 + Math.random() * 900000)}`;

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: initialPassword,
      role,
      department: department || null,
      phone: phone || ''
    });

    let studentProfile = null;
    let facultyProfile = null;

    if (role === 'STUDENT') {
      const cleanRoll = (rollNumber || `STU${Date.now().toString().slice(-6)}`).toUpperCase().trim();
      let assignedCourse = course;
      if (!assignedCourse) {
        const defaultCourse = await Course.findOne();
        assignedCourse = defaultCourse?._id;
      }
      studentProfile = await Student.create({
        user: user._id,
        rollNumber: cleanRoll,
        course: assignedCourse,
        currentSemester: Number(currentSemester) || 1,
        section: section || 'A',
        batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`
      });
    } else if (role === 'FACULTY') {
      const cleanEmpId = (employeeId || `FAC${Date.now().toString().slice(-5)}`).toUpperCase().trim();
      let assignedDept = department;
      if (!assignedDept) {
        const defaultDept = await Department.findOne();
        assignedDept = defaultDept?._id;
      }
      facultyProfile = await Faculty.create({
        user: user._id,
        employeeId: cleanEmpId,
        department: assignedDept,
        designation: designation || 'Assistant Professor',
        specialization: specialization || ''
      });
    }

    await AuditLog.create({
      action: 'USER_CREATED',
      entity: 'USER',
      entityId: user._id,
      actor: req.user?._id,
      metadata: { role, email: user.email, name: user.name }
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      initialPassword,
      user: {
        ...userObj,
        studentProfile,
        facultyProfile
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    let { newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!newPassword || newPassword.trim().length < 6) {
      newPassword = `Campus@${Math.floor(100000 + Math.random() * 900000)}`;
    } else {
      newPassword = newPassword.trim();
    }

    user.password = newPassword;
    await user.save();

    await AuditLog.create({
      action: 'PASSWORD_RESET_BY_ADMIN',
      entity: 'USER',
      entityId: user._id,
      actor: req.user?._id,
      metadata: { targetUser: user.email, targetRole: user.role }
    });

    res.json({
      success: true,
      message: `Password for ${user.name} (${user.email}) has been successfully updated`,
      newPassword,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own administrative account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.create({
      action: 'USER_STATUS_TOGGLED',
      entity: 'USER',
      entityId: user._id,
      actor: req.user?._id,
      metadata: { targetUser: user.email, isActive: user.isActive }
    });

    res.json({
      success: true,
      message: `Account for ${user.name} is now ${user.isActive ? 'Active' : 'Deactivated'}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own administrative account' });
    }

    if (user.role === 'STUDENT') {
      await Student.deleteOne({ user: user._id });
    } else if (user.role === 'FACULTY') {
      await Faculty.deleteOne({ user: user._id });
    }

    await User.deleteOne({ _id: user._id });

    await AuditLog.create({
      action: 'USER_DELETED',
      entity: 'USER',
      entityId: user._id,
      actor: req.user?._id,
      metadata: { deletedUser: user.email, role: user.role }
    });

    res.json({
      success: true,
      message: `User ${user.name} (${user.email}) has been deleted`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
