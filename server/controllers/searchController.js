const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Complaint = require('../models/Complaint');
const ComplaintCategory = require('../models/ComplaintCategory');
const Department = require('../models/Department');
const Intervention = require('../models/Intervention');
const FAQ = require('../models/FAQ');
const { getSlaStatus } = require('../services/slaService');

/**
 * Global Search Controller with Strict Server-Side Role-Based Authorization
 */
exports.globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        query: q,
        total: 0,
        results: {
          students: [],
          complaints: [],
          subjects: [],
          interventions: [],
          departments: [],
          faqs: [],
          staff: []
        }
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const role = req.user.role;
    const userId = req.user._id;
    const regex = new RegExp(q, 'i');

    const results = {
      students: [],
      complaints: [],
      subjects: [],
      interventions: [],
      departments: [],
      faqs: [],
      staff: []
    };

    if (role === 'STUDENT') {
      // 1. Own complaints
      const complaints = await Complaint.find({
        student: userId,
        $or: [{ ticketId: regex }, { title: regex }, { description: regex }, { block: regex }, { room: regex }]
      }).populate('category', 'name').limit(limit);

      results.complaints = complaints.map(c => ({
        _id: c._id,
        ticketId: c.ticketId,
        title: c.title,
        status: c.status,
        slaStatus: getSlaStatus(c),
        category: c.category?.name,
        location: `${c.block} - ${c.room}`
      }));

      // 2. Own enrolled subjects
      const student = await Student.findOne({ user: userId });
      if (student) {
        const subjects = await Subject.find({
          course: student.course,
          semester: student.currentSemester,
          $or: [{ name: regex }, { code: regex }]
        }).populate('faculty', 'name');

        results.subjects = subjects.map(s => ({
          _id: s._id,
          name: s.name,
          code: s.code,
          faculty: s.faculty?.name || 'Assigned Faculty'
        }));
      }

      // 3. FAQs & Public Campus Info
      const faqs = await FAQ.find({
        $or: [{ question: regex }, { answer: regex }, { category: regex }]
      }).limit(limit);
      results.faqs = faqs.map(f => ({
        _id: f._id,
        question: f.question,
        category: f.category
      }));

      const depts = await Department.find({
        $or: [{ name: regex }, { code: regex }, { description: regex }]
      }, 'name code officeLocation contactEmail').limit(limit);
      results.departments = depts;

    } else if (role === 'FACULTY') {
      const faculty = await Faculty.findOne({ user: userId });
      const assignedSubjectIds = faculty?.assignedSubjects || [];

      // 1. Students in assigned cohort / course / subject
      let assignedCourseIds = [];
      let assignedSemesters = [];
      if (assignedSubjectIds.length > 0) {
        const subjects = await Subject.find({ _id: { $in: assignedSubjectIds } });
        assignedCourseIds = subjects.map(s => s.course);
        assignedSemesters = subjects.map(s => s.semester);
      }

      // Find students whose name or roll number matches
      const studentQuery = {
        $or: [
          { course: { $in: assignedCourseIds }, currentSemester: { $in: assignedSemesters } },
          { section: { $in: faculty?.assignedSections || [] } }
        ]
      };

      const students = await Student.find(studentQuery)
        .populate('user', 'name email')
        .populate('course', 'name code');

      const matchedStudents = students.filter(s =>
        (s.user?.name && regex.test(s.user.name)) ||
        (s.rollNumber && regex.test(s.rollNumber))
      ).slice(0, limit);

      results.students = matchedStudents.map(s => ({
        _id: s._id,
        name: s.user?.name,
        rollNumber: s.rollNumber,
        course: s.course?.name,
        semester: s.currentSemester,
        riskLevel: s.currentRiskLevel,
        riskScore: s.currentRiskScore
      }));

      // 2. Assigned interventions
      const interventions = await Intervention.find({
        faculty: userId,
        $or: [{ reason: regex }, { notes: regex }]
      }).populate('student').limit(limit);

      results.interventions = interventions.map(i => ({
        _id: i._id,
        title: i.reason,
        status: i.status,
        followUpDate: i.followUpDate
      }));

      // 3. Academic subjects taught
      const subjects = await Subject.find({
        $or: [
          { _id: { $in: assignedSubjectIds }, $or: [{ name: regex }, { code: regex }] },
          { faculty: userId, $or: [{ name: regex }, { code: regex }] }
        ]
      }).populate('course', 'name code').limit(limit);

      results.subjects = subjects.map(s => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        course: s.course?.name,
        semester: s.semester
      }));

    } else if (role === 'DEPARTMENT_STAFF') {
      const deptId = req.user.department;

      // 1. Complaints assigned to their department
      const complaints = await Complaint.find({
        department: deptId,
        $or: [{ ticketId: regex }, { title: regex }, { description: regex }, { block: regex }, { room: regex }]
      })
        .populate('student', 'name email')
        .populate('category', 'name')
        .limit(limit);

      results.complaints = complaints.map(c => ({
        _id: c._id,
        ticketId: c.ticketId,
        title: c.title,
        status: c.status,
        slaStatus: getSlaStatus(c),
        category: c.category?.name,
        location: `${c.block} - ${c.room}`,
        // Limited student context required for physical resolution only
        reportedBy: c.student?.name || 'Student'
      }));

      // 2. Categories in their department
      const categories = await ComplaintCategory.find({
        department: deptId,
        $or: [{ name: regex }, { code: regex }]
      }).limit(limit);
      results.departments = categories.map(c => ({ _id: c._id, name: c.name, code: c.code }));

    } else if (role === 'DEPARTMENT_HEAD') {
      const deptId = req.user.department;

      // 1. Department complaints
      const complaints = await Complaint.find({
        department: deptId,
        $or: [{ ticketId: regex }, { title: regex }, { description: regex }, { block: regex }, { room: regex }]
      })
        .populate('student', 'name email')
        .populate('assignedStaff', 'name email')
        .populate('category', 'name')
        .limit(limit);

      results.complaints = complaints.map(c => ({
        _id: c._id,
        ticketId: c.ticketId,
        title: c.title,
        status: c.status,
        slaStatus: getSlaStatus(c),
        assignedStaff: c.assignedStaff?.name || 'Unassigned',
        location: `${c.block} - ${c.room}`
      }));

      // 2. Department Staff members
      const staff = await User.find({
        department: deptId,
        role: 'DEPARTMENT_STAFF',
        $or: [{ name: regex }, { email: regex }]
      }, 'name email phone isActive').limit(limit);
      results.staff = staff;

    } else if (role === 'ADMIN') {
      // System-wide authorized search
      // 1. Students
      const students = await Student.find()
        .populate('user', 'name email')
        .populate('course', 'name code');
      const matched = students.filter(s =>
        (s.user?.name && regex.test(s.user.name)) ||
        (s.rollNumber && regex.test(s.rollNumber))
      ).slice(0, limit);
      results.students = matched.map(s => ({
        _id: s._id,
        name: s.user?.name,
        rollNumber: s.rollNumber,
        course: s.course?.name,
        riskLevel: s.currentRiskLevel,
        riskScore: s.currentRiskScore
      }));

      // 2. Complaints
      const complaints = await Complaint.find({
        $or: [{ ticketId: regex }, { title: regex }, { description: regex }, { block: regex }]
      }).populate('category', 'name').populate('department', 'name').limit(limit);
      results.complaints = complaints.map(c => ({
        _id: c._id,
        ticketId: c.ticketId,
        title: c.title,
        status: c.status,
        slaStatus: getSlaStatus(c),
        department: c.department?.name,
        location: `${c.block} - ${c.room}`
      }));

      // 3. Departments
      const depts = await Department.find({
        $or: [{ name: regex }, { code: regex }]
      }).limit(limit);
      results.departments = depts;

      // 4. Subjects
      const subjects = await Subject.find({
        $or: [{ name: regex }, { code: regex }]
      }).populate('course', 'name').limit(limit);
      results.subjects = subjects.map(s => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        course: s.course?.name
      }));
    }

    const totalCount =
      results.students.length +
      results.complaints.length +
      results.subjects.length +
      results.interventions.length +
      results.departments.length +
      results.faqs.length +
      results.staff.length;

    res.json({
      success: true,
      query: q,
      role,
      total: totalCount,
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
