require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const AttendanceRecord = require('../models/AttendanceRecord');
const Assessment = require('../models/Assessment');
const Mark = require('../models/Mark');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const PerformanceRecord = require('../models/PerformanceRecord');
const RiskAssessment = require('../models/RiskAssessment');
const Intervention = require('../models/Intervention');
const ComplaintCategory = require('../models/ComplaintCategory');
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');
const Location = require('../models/Location');
const SlaRule = require('../models/SlaRule');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const FAQ = require('../models/FAQ');
const EmergencyContact = require('../models/EmergencyContact');

async function seed() {
  console.log('[Seed] Connecting to database...');
  await connectDB();

  console.log('[Seed] Clearing previous collections...');
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    AcademicSession.deleteMany({}),
    Student.deleteMany({}),
    Faculty.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Assessment.deleteMany({}),
    Mark.deleteMany({}),
    Assignment.deleteMany({}),
    AssignmentSubmission.deleteMany({}),
    PerformanceRecord.deleteMany({}),
    RiskAssessment.deleteMany({}),
    Intervention.deleteMany({}),
    ComplaintCategory.deleteMany({}),
    Complaint.deleteMany({}),
    ComplaintCluster.deleteMany({}),
    Location.deleteMany({}),
    SlaRule.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    FAQ.deleteMany({}),
    EmergencyContact.deleteMany({})
  ]);

  console.log('[Seed] 1. Creating Departments...');
  const deptCSE = await Department.create({
    name: 'Computer Science & Engineering',
    code: 'CSE',
    type: 'ACADEMIC',
    description: 'Academic department for CSE undergraduate and postgraduate studies.'
  });

  const deptIT = await Department.create({
    name: 'IT & Campus Network',
    code: 'IT',
    type: 'FACILITY_SUPPORT',
    description: 'Campus Wi-Fi, LAN, server infrastructure, and network support.'
  });

  const deptAV = await Department.create({
    name: 'Audio-Visual & Smart Classrooms',
    code: 'IT_AV',
    type: 'FACILITY_SUPPORT',
    description: 'Projectors, smart podiums, microphones, and digital displays.'
  });

  const deptElectrical = await Department.create({
    name: 'Electrical & Power Systems',
    code: 'ELECTRICAL',
    type: 'FACILITY_SUPPORT',
    description: 'Power distribution, lighting, air conditioning, and electrical fixtures.'
  });

  const deptMaintenance = await Department.create({
    name: 'Estate Maintenance & Plumbing',
    code: 'MAINTENANCE',
    type: 'FACILITY_SUPPORT',
    description: 'Water coolers, plumbing fixtures, furniture, and structural repairs.'
  });

  const deptSanitation = await Department.create({
    name: 'Campus Sanitation & Hygiene',
    code: 'SANITATION',
    type: 'FACILITY_SUPPORT',
    description: 'Waste management, washroom cleanliness, and campus pest control.'
  });

  const deptSecurity = await Department.create({
    name: 'Campus Security & Safety',
    code: 'SECURITY',
    type: 'FACILITY_SUPPORT',
    description: 'Surveillance, gate access, student safety, and incident management.'
  });

  console.log('[Seed] 2. Creating Users across 5 Roles...');
  // Password for all seeded accounts: "EduGuard@123"
  const adminUser = await User.create({
    name: 'Dr. Vikram Seth (Dean Admin)',
    email: 'admin@eduguard.edu',
    password: 'EduGuard@123',
    role: 'ADMIN',
    phone: '+91 98765 43210'
  });

  const facultyUser = await User.create({
    name: 'Dr. Ramesh Kumar',
    email: 'ramesh@eduguard.edu',
    password: 'EduGuard@123',
    role: 'FACULTY',
    department: deptCSE._id,
    phone: '+91 98765 43211'
  });

  const itHeadUser = await User.create({
    name: 'Priya Nair (IT Operations Head)',
    email: 'priya@eduguard.edu',
    password: 'EduGuard@123',
    role: 'DEPARTMENT_HEAD',
    department: deptIT._id,
    phone: '+91 98765 43212'
  });
  deptIT.head = itHeadUser._id;
  await deptIT.save();

  const itStaffUser = await User.create({
    name: 'Suresh Patel (Senior Network Tech)',
    email: 'suresh@eduguard.edu',
    password: 'EduGuard@123',
    role: 'DEPARTMENT_STAFF',
    department: deptIT._id,
    phone: '+91 98765 43213'
  });

  // Primary Hackathon Student (Rahul Sharma)
  const studentRahulUser = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul@eduguard.edu',
    password: 'EduGuard@123',
    role: 'STUDENT',
    phone: '+91 98765 43214'
  });

  // Cohort Student 2 (Ananya Verma - Low Risk)
  const studentAnanyaUser = await User.create({
    name: 'Ananya Verma',
    email: 'ananya@eduguard.edu',
    password: 'EduGuard@123',
    role: 'STUDENT',
    phone: '+91 98765 43215'
  });

  // Cohort Student 3 (Rohan Das - Critical Risk)
  const studentRohanUser = await User.create({
    name: 'Rohan Das',
    email: 'rohan@eduguard.edu',
    password: 'EduGuard@123',
    role: 'STUDENT',
    phone: '+91 98765 43216'
  });

  console.log('[Seed] 3. Creating Academic Session, Course & Subjects...');
  const session = await AcademicSession.create({
    name: '2025-2026 Even Semester',
    year: '2025-2026',
    semesterType: 'EVEN',
    isCurrent: true,
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-06-15')
  });

  const course = await Course.create({
    name: 'B.Tech in Computer Science & Engineering',
    code: 'BTECH-CSE',
    department: deptCSE._id,
    durationYears: 4,
    totalSemesters: 8
  });

  const subDBMS = await Subject.create({
    name: 'Database Management Systems',
    code: 'CS401',
    course: course._id,
    semester: 4,
    credits: 4,
    faculty: facultyUser._id
  });

  const subOS = await Subject.create({
    name: 'Operating Systems',
    code: 'CS402',
    course: course._id,
    semester: 4,
    credits: 4,
    faculty: facultyUser._id
  });

  const subCN = await Subject.create({
    name: 'Computer Networks',
    code: 'CS403',
    course: course._id,
    semester: 4,
    credits: 4,
    faculty: facultyUser._id
  });

  const subDAA = await Subject.create({
    name: 'Design & Analysis of Algorithms',
    code: 'CS404',
    course: course._id,
    semester: 4,
    credits: 4,
    faculty: facultyUser._id
  });

  const subSE = await Subject.create({
    name: 'Software Engineering',
    code: 'CS405',
    course: course._id,
    semester: 4,
    credits: 3,
    faculty: facultyUser._id
  });

  const allSubjects = [subDBMS, subOS, subCN, subDAA, subSE];

  // Faculty Profile
  await Faculty.create({
    user: facultyUser._id,
    employeeId: 'EMP-CSE-104',
    department: deptCSE._id,
    designation: 'Associate Professor & Academic Mentor',
    assignedSubjects: allSubjects.map(s => s._id),
    assignedSections: ['A', 'B']
  });

  console.log('[Seed] 4. Creating Student Profiles...');
  const studentRahul = await Student.create({
    user: studentRahulUser._id,
    rollNumber: 'CS2023-042',
    course: course._id,
    currentSemester: 4,
    section: 'A',
    batch: '2023-2027',
    academicSession: session._id,
    mentorFaculty: facultyUser._id,
    cgpa: 7.03,
    currentRiskLevel: 'HIGH',
    currentRiskScore: 70
  });

  const studentAnanya = await Student.create({
    user: studentAnanyaUser._id,
    rollNumber: 'CS2023-015',
    course: course._id,
    currentSemester: 4,
    section: 'A',
    batch: '2023-2027',
    academicSession: session._id,
    mentorFaculty: facultyUser._id,
    cgpa: 8.85,
    currentRiskLevel: 'LOW',
    currentRiskScore: 12
  });

  const studentRohan = await Student.create({
    user: studentRohanUser._id,
    rollNumber: 'CS2023-088',
    course: course._id,
    currentSemester: 4,
    section: 'B',
    batch: '2023-2027',
    academicSession: session._id,
    mentorFaculty: facultyUser._id,
    cgpa: 5.62,
    currentRiskLevel: 'CRITICAL',
    currentRiskScore: 89
  });

  console.log('[Seed] 5. Creating Attendance Records for Rahul (Target: exactly 62%)...');
  // Generate 50 lecture sessions: 31 Present, 19 Absent -> 31 / 50 = 62%
  const today = new Date();
  let lectureIdx = 0;
  for (let i = 49; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const subject = allSubjects[lectureIdx % allSubjects.length];
    lectureIdx++;

    // 31 Present, 19 Absent
    const status = i < 19 ? 'ABSENT' : 'PRESENT';

    await AttendanceRecord.create({
      student: studentRahul._id,
      subject: subject._id,
      faculty: facultyUser._id,
      date,
      status,
      semester: 4,
      notes: status === 'ABSENT' ? 'Unexcused absence' : ''
    });
  }

  // Attendance for Ananya (92%)
  for (let i = 24; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const subject = allSubjects[i % allSubjects.length];
    await AttendanceRecord.create({
      student: studentAnanya._id,
      subject: subject._id,
      faculty: facultyUser._id,
      date,
      status: i === 5 || i === 12 ? 'ABSENT' : 'PRESENT',
      semester: 4
    });
  }

  console.log('[Seed] 6. Creating Assessments & Marks for Rahul (Target: exactly 48% average)...');
  // Internal 1 Assessment for each subject
  const assessDBMS = await Assessment.create({ title: 'Internal Assessment 1 - Relational Algebra & SQL', subject: subDBMS._id, type: 'INTERNAL_1', semester: 4, maxMarks: 100, passingMarks: 40 });
  const assessOS = await Assessment.create({ title: 'Internal Assessment 1 - CPU Scheduling & Concurrency', subject: subOS._id, type: 'INTERNAL_1', semester: 4, maxMarks: 100, passingMarks: 40 });
  const assessCN = await Assessment.create({ title: 'Internal Assessment 1 - OSI Layers & TCP/IP', subject: subCN._id, type: 'INTERNAL_1', semester: 4, maxMarks: 100, passingMarks: 40 });
  const assessDAA = await Assessment.create({ title: 'Internal Assessment 1 - Asymptotic Analysis & Graphs', subject: subDAA._id, type: 'INTERNAL_1', semester: 4, maxMarks: 100, passingMarks: 40 });
  const assessSE = await Assessment.create({ title: 'Internal Assessment 1 - Agile & Software Modeling', subject: subSE._id, type: 'INTERNAL_1', semester: 4, maxMarks: 100, passingMarks: 40 });

  // Rahul Marks: DBMS 44%, OS 48%, CN 52%, DAA 42%, SE 54% -> Average = (44+48+52+42+54)/5 = 240 / 5 = 48%!
  await Mark.create({ student: studentRahul._id, assessment: assessDBMS._id, subject: subDBMS._id, scoredMarks: 44, percentage: 44, enteredBy: facultyUser._id, remarks: 'Struggles with normalized queries and joins' });
  await Mark.create({ student: studentRahul._id, assessment: assessOS._id, subject: subOS._id, scoredMarks: 48, percentage: 48, enteredBy: facultyUser._id, remarks: 'Needs revision in synchronization primitives' });
  await Mark.create({ student: studentRahul._id, assessment: assessCN._id, subject: subCN._id, scoredMarks: 52, percentage: 52, enteredBy: facultyUser._id, remarks: 'Average understanding of subnetting' });
  await Mark.create({ student: studentRahul._id, assessment: assessDAA._id, subject: subDAA._id, scoredMarks: 42, percentage: 42, enteredBy: facultyUser._id, remarks: 'Weak in recurrence relations and divide & conquer' });
  await Mark.create({ student: studentRahul._id, assessment: assessSE._id, subject: subSE._id, scoredMarks: 54, percentage: 54, enteredBy: facultyUser._id, remarks: 'Acceptable grasp of requirements engineering' });

  // Ananya Marks (Distinction)
  await Mark.create({ student: studentAnanya._id, assessment: assessDBMS._id, subject: subDBMS._id, scoredMarks: 92, percentage: 92, enteredBy: facultyUser._id });
  await Mark.create({ student: studentAnanya._id, assessment: assessOS._id, subject: subOS._id, scoredMarks: 86, percentage: 86, enteredBy: facultyUser._id });

  console.log('[Seed] 7. Creating Assignments (Target: 10 assignments, 6 completed, 4 pending -> 60% completion)...');
  const assignments = [];
  const titles = [
    { title: 'Assignment 1: SQL Schema Design & B+ Trees', subject: subDBMS },
    { title: 'Assignment 2: Transaction ACIDity & Locking Protocols', subject: subDBMS },
    { title: 'Assignment 3: Process Fork & Semaphore Implementation', subject: subOS },
    { title: 'Assignment 4: Virtual Memory Page Replacement Algorithms', subject: subOS },
    { title: 'Assignment 5: Socket Programming in C/Python', subject: subCN },
    { title: 'Assignment 6: Distance Vector Routing Simulation', subject: subCN },
    { title: 'Assignment 7: Divide-and-Conquer Recurrence Proofs', subject: subDAA },
    { title: 'Assignment 8: Dynamic Programming - Knapsack Variants', subject: subDAA },
    { title: 'Assignment 9: SRS Document for Smart Campus System', subject: subSE },
    { title: 'Assignment 10: UML Class & Sequence Diagrams', subject: subSE }
  ];

  for (let idx = 0; idx < titles.length; idx++) {
    const item = titles[idx];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (idx < 6 ? -5 : 7)); // First 6 were due, last 4 upcoming/late

    const asg = await Assignment.create({
      title: item.title,
      subject: item.subject._id,
      faculty: facultyUser._id,
      dueDate,
      maxScore: 10,
      semester: 4
    });
    assignments.push(asg);

    // Rahul submitted first 6, remaining 4 are PENDING (60% completed!)
    if (idx < 6) {
      await AssignmentSubmission.create({
        assignment: asg._id,
        student: studentRahul._id,
        subject: item.subject._id,
        status: 'COMPLETED',
        submissionDate: new Date(),
        score: idx < 3 ? 8 : 7,
        feedback: 'Good submission'
      });
    } else {
      await AssignmentSubmission.create({
        assignment: asg._id,
        student: studentRahul._id,
        subject: item.subject._id,
        status: 'PENDING'
      });
    }

    // Ananya submitted all 10
    await AssignmentSubmission.create({
      assignment: asg._id,
      student: studentAnanya._id,
      subject: item.subject._id,
      status: 'COMPLETED',
      submissionDate: new Date(),
      score: 9.5
    });
  }

  console.log('[Seed] 8. Creating Performance History for Rahul (Declining Trend)...');
  await PerformanceRecord.create({
    student: studentRahul._id,
    semester: 1,
    sgpa: 7.8,
    cgpa: 7.8,
    percentage: 74,
    trend: 'STABLE',
    remarks: 'Satisfactory foundation year'
  });
  await PerformanceRecord.create({
    student: studentRahul._id,
    semester: 2,
    sgpa: 7.2,
    cgpa: 7.5,
    percentage: 68,
    trend: 'DECLINING',
    remarks: 'Minor drop in core theoretical papers'
  });
  await PerformanceRecord.create({
    student: studentRahul._id,
    semester: 3,
    sgpa: 6.1,
    cgpa: 7.03,
    percentage: 58,
    trend: 'DECLINING',
    remarks: 'Notable decline in midterms and lab evaluations'
  });

  console.log('[Seed] 9. Creating Explainable Risk Assessment for Rahul (70/100, HIGH)...');
  await RiskAssessment.create({
    student: studentRahul._id,
    riskLevel: 'HIGH',
    riskScore: 70,
    metrics: {
      attendancePercentage: 62,
      internalMarksAverage: 48,
      assignmentCompletionRate: 60,
      pendingAssignmentsCount: 4,
      performanceTrend: 'DECLINING',
      cgpa: 7.03
    },
    contributingFactors: [
      {
        factor: 'Attendance below 75% threshold',
        severity: 'HIGH',
        impactScore: 25,
        detail: 'Current attendance is 62%. Mandatory minimum requirement is 75% to sit for university examinations.'
      },
      {
        factor: 'Internal marks below passing benchmark',
        severity: 'HIGH',
        impactScore: 20,
        detail: 'Average internal assessment score is 48% (below the 50% passing threshold), with critical weakness in DAA (42%) and DBMS (44%).'
      },
      {
        factor: 'Pending assignments backlog',
        severity: 'MEDIUM',
        impactScore: 13,
        detail: '4 incomplete assignments remaining across semester modules (60% completion rate).'
      },
      {
        factor: 'Performance trend: Declining',
        severity: 'MEDIUM',
        impactScore: 12,
        detail: 'SGPA has steadily dropped from 7.8 (Sem 1) to 7.2 (Sem 2) and 6.1 (Sem 3).'
      }
    ],
    explanation: 'Academic risk is elevated (70/100 - HIGH) because attendance is 62% (below the required 75% threshold), internal marks average is 48%, 4 course assignments are currently pending, and recent performance shows a consistent downward trend. Early intervention and targeted mentoring are strongly advised.',
    recommendations: [
      {
        category: 'ATTENDANCE',
        title: 'Improve Lecture Attendance',
        action: 'Attend upcoming scheduled classes consistently to bring overall attendance from 62% towards the 75% benchmark.',
        targetMetric: '75% Attendance',
        priority: 'HIGH'
      },
      {
        category: 'ASSIGNMENTS',
        title: 'Complete Pending Coursework',
        action: 'Submit the 4 pending assignments in DAA, CN, and SE within the next 7 days.',
        targetMetric: '100% Submission',
        priority: 'HIGH'
      },
      {
        category: 'ACADEMIC_STUDY',
        title: 'Targeted Review in Weak Subjects',
        action: 'Focus on core concepts in Design & Analysis of Algorithms (42%) and Database Management Systems (44%).',
        targetMetric: 'Score >= 60% in Retest',
        priority: 'HIGH'
      },
      {
        category: 'FACULTY_GUIDANCE',
        title: 'Schedule Faculty Mentoring Session',
        action: 'Meet assigned faculty mentor Dr. Ramesh Kumar to establish an individualized academic recovery plan.',
        targetMetric: '1 Mentoring Session',
        priority: 'HIGH'
      }
    ],
    aiMetadata: {
      engine: 'DETERMINISTIC_EXPLAINABLE_V1',
      model: 'eduguard-risk-engine-v1',
      confidence: 0.96,
      isFallback: false
    },
    calculatedAt: new Date()
  });

  console.log('[Seed] 10. Creating SLA Rules...');
  await SlaRule.create([
    { priority: 'CRITICAL', maxResolutionHours: 4, warningThresholdHours: 1, description: 'Safety hazards, power blackout, active exam interruption' },
    { priority: 'HIGH', maxResolutionHours: 12, warningThresholdHours: 3, description: 'Classroom AV failure, major Wi-Fi outage in academic block' },
    { priority: 'MEDIUM', maxResolutionHours: 24, warningThresholdHours: 6, description: 'Non-critical equipment repair, plumbing tap leak, AC cooling' },
    { priority: 'LOW', maxResolutionHours: 48, warningThresholdHours: 12, description: 'Furniture adjustment, general cosmetic repairs, non-urgent sanitation' }
  ]);

  console.log('[Seed] 11. Creating Complaint Categories...');
  const catWiFi = await ComplaintCategory.create({
    name: 'Wi-Fi & Network',
    code: 'NET',
    defaultDepartment: deptIT._id,
    defaultPriority: 'HIGH',
    keywords: ['wifi', 'wi-fi', 'internet', 'lan', 'network', 'router', 'slow internet'],
    description: 'Campus internet connectivity, Wi-Fi access points, LAN cables'
  });

  const catAV = await ComplaintCategory.create({
    name: 'Classroom Equipment',
    code: 'AV',
    defaultDepartment: deptAV._id,
    defaultPriority: 'HIGH',
    keywords: ['projector', 'screen', 'hdmi', 'mic', 'microphone', 'audio', 'speaker', 'smart board'],
    description: 'Classroom presentation projectors, audio systems, digital screens'
  });

  const catElectrical = await ComplaintCategory.create({
    name: 'Electrical',
    code: 'ELEC',
    defaultDepartment: deptElectrical._id,
    defaultPriority: 'MEDIUM',
    keywords: ['light', 'fan', 'switch', 'socket', 'power', 'ac', 'cooler', 'spark'],
    description: 'Power outlets, fans, lighting, air conditioners, circuit breakers'
  });

  const catPlumbing = await ComplaintCategory.create({
    name: 'Plumbing & Water',
    code: 'PLUMB',
    defaultDepartment: deptMaintenance._id,
    defaultPriority: 'MEDIUM',
    keywords: ['water', 'tap', 'leak', 'washroom', 'flush', 'toilet', 'drinking water'],
    description: 'Drinking water coolers, washroom plumbing, taps, pipelines'
  });

  const catSanitation = await ComplaintCategory.create({
    name: 'Sanitation',
    code: 'SAN',
    defaultDepartment: deptSanitation._id,
    defaultPriority: 'LOW',
    keywords: ['clean', 'dirty', 'garbage', 'waste', 'smell', 'dustbin'],
    description: 'Classroom cleanliness, dustbin clearing, campus hygiene'
  });

  const catSecurity = await ComplaintCategory.create({
    name: 'Campus Security',
    code: 'SEC',
    defaultDepartment: deptSecurity._id,
    defaultPriority: 'HIGH',
    keywords: ['security', 'guard', 'lock', 'stolen', 'gate', 'id card'],
    description: 'Campus surveillance, safety personnel, access control'
  });

  console.log('[Seed] 12. Creating Campus Locations...');
  await Location.create([
    { campus: 'Main Campus', block: 'Block A', building: 'Engineering Block 1', floor: '1st Floor', room: 'Room 101' },
    { campus: 'Main Campus', block: 'Block A', building: 'Engineering Block 1', floor: '1st Floor', room: 'Room 102' },
    { campus: 'Main Campus', block: 'Block B', building: 'Academic Complex', floor: '2nd Floor', room: 'Room 204' },
    { campus: 'Main Campus', block: 'Block B', building: 'Academic Complex', floor: '2nd Floor', room: 'Computer Lab 3' },
    { campus: 'Main Campus', block: 'Block B', building: 'Academic Complex', floor: '3rd Floor', room: 'Room 302' },
    { campus: 'Main Campus', block: 'Block C', building: 'Central Library & Admin', floor: 'Ground Floor', room: 'Library Reading Hall' }
  ]);

  console.log('[Seed] 13. Creating Sample Complaints (including existing Block B issue for clustering)...');
  // 1. Existing Block B Wi-Fi complaint (for duplicate detection test)
  const existingComplaint = await Complaint.create({
    ticketId: 'CMP-2026-1001',
    student: studentAnanyaUser._id,
    title: 'Block B Wi-Fi is down and disconnecting frequently',
    description: 'The Wi-Fi access point in Block B 2nd floor drops connection every few minutes.',
    category: catWiFi._id,
    campus: 'Main Campus',
    block: 'Block B',
    room: 'Room 204',
    floor: '2nd Floor',
    priority: 'HIGH',
    department: deptIT._id,
    assignedStaff: itStaffUser._id,
    status: 'IN_PROGRESS',
    slaDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
    aiAnalysis: {
      detectedCategory: 'Wi-Fi & Network',
      suggestedPriority: 'HIGH',
      suggestedDepartment: 'IT & Campus Network',
      academicImpact: 'MODERATE',
      summary: 'Wi-Fi connectivity failure in Block B Room 204',
      reason: 'Network outage affects classroom activities and digital coursework.',
      confidence: 0.94
    },
    timeline: [
      { status: 'SUBMITTED', actor: studentAnanyaUser._id, notes: 'Complaint submitted by student', timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
      { status: 'AI_ANALYZED', actor: null, notes: 'Classified as HIGH priority network issue', timestamp: new Date(Date.now() - 3 * 3600 * 1000) },
      { status: 'ASSIGNED', actor: itHeadUser._id, notes: 'Assigned to Suresh Patel', timestamp: new Date(Date.now() - 2 * 3600 * 1000) },
      { status: 'IN_PROGRESS', actor: itStaffUser._id, notes: 'Checking switch port and AP gateway', timestamp: new Date(Date.now() - 1 * 3600 * 1000) }
    ]
  });

  // Cluster for Block B Wi-Fi
  const cluster = await ComplaintCluster.create({
    incidentId: 'INC-2026-0001',
    title: 'Block B Wireless Access Point Disruption',
    category: catWiFi._id,
    location: { block: 'Block B', building: 'Academic Complex', floor: '2nd Floor', room: 'Room 204' },
    priority: 'HIGH',
    status: 'ACTIVE',
    relatedComplaints: [existingComplaint._id],
    aiSimilarityScore: 0.9
  });
  existingComplaint.cluster = cluster._id;
  await existingComplaint.save();

  // 2. A complaint submitted by Rahul in the past that is active (gives Rahul campus support context!)
  await Complaint.create({
    ticketId: 'CMP-2026-1002',
    student: studentRahulUser._id,
    title: 'Projector HDMI port damaged in Room 204',
    description: 'Cannot connect laptop for DBMS seminar presentation. Cable seems loose.',
    category: catAV._id,
    campus: 'Main Campus',
    block: 'Block B',
    room: 'Room 204',
    floor: '2nd Floor',
    priority: 'HIGH',
    department: deptAV._id,
    status: 'SUBMITTED',
    slaDeadline: new Date(Date.now() + 10 * 60 * 60 * 1000),
    aiAnalysis: {
      detectedCategory: 'Classroom Equipment',
      suggestedPriority: 'HIGH',
      suggestedDepartment: 'Audio-Visual & Smart Classrooms',
      academicImpact: 'SIGNIFICANT',
      summary: 'Projector display failure affecting classroom presentation in Block B Room 204',
      reason: 'Academic presentations and lecture delivery are directly impeded.',
      confidence: 0.96
    },
    timeline: [
      { status: 'SUBMITTED', actor: studentRahulUser._id, notes: 'Complaint submitted via web portal', timestamp: new Date(Date.now() - 2 * 3600 * 1000) }
    ]
  });

  console.log('[Seed] 14. Creating FAQs & Emergency Contacts...');
  await FAQ.create([
    { question: 'What is the minimum attendance requirement for semester exams?', answer: 'As per academic regulations, students must maintain a minimum of 75% attendance in each registered course to be eligible for end-semester examinations.', category: 'ACADEMIC', keywords: ['attendance', 'exam', 'debarred', '75%'] },
    { question: 'How do I connect to Campus High-Speed Wi-Fi?', answer: 'Connect to "EduGuard-Campus-5G", enter your student roll number as identity and your portal password. For device MAC registration, visit the IT Helpdesk in Block C.', category: 'CAMPUS_FACILITY', keywords: ['wifi', 'wi-fi', 'internet', 'password'] },
    { question: 'What should I do if my internal assessment marks are low?', answer: 'EduGuard 360 automatically computes your risk factors and suggests personalized action plans. Contact your assigned faculty mentor to request remedial guidance or re-evaluations.', category: 'ACADEMIC', keywords: ['marks', 'internal', 'fail', 'retest', 'mentor'] },
    { question: 'How do I escalate an unresolved campus complaint?', answer: 'Open the complaint details in your portal or ask EduGuard AI to escalate the ticket if the SLA deadline has elapsed or urgent academic activity is affected.', category: 'CAMPUS_FACILITY', keywords: ['escalate', 'complaint', 'sla', 'delay'] }
  ]);

  await EmergencyContact.create([
    { title: 'Campus Security Control Room', department: 'Security', phone: '+91 11 2345 6789', location: 'Main Gate Booth', is24x7: true },
    { title: 'Campus Medical Health Centre', department: 'Healthcare', phone: '+91 11 2345 6790', location: 'Block A Ground Floor', is24x7: true },
    { title: 'IT & Network Emergency Helpdesk', department: 'IT Support', phone: '+91 11 2345 6791', location: 'Block C Room 102', is24x7: false },
    { title: 'Anti-Ragging & Student Grievance Cell', department: 'Student Welfare', phone: '+91 1800 180 5522', location: 'Administrative Block', is24x7: true }
  ]);

  console.log('======================================================');
  console.log(' SEEDING COMPLETE SUCCESSFULLY!');
  console.log(' Demo Accounts Created (Password: EduGuard@123):');
  console.log(' 1. Student (Rahul - HIGH RISK): rahul@eduguard.edu');
  console.log(' 2. Student (Ananya - LOW RISK): ananya@eduguard.edu');
  console.log(' 3. Faculty:                     ramesh@eduguard.edu');
  console.log(' 4. IT Dept Staff:               suresh@eduguard.edu');
  console.log(' 5. IT Dept Head:                priya@eduguard.edu');
  console.log(' 6. Administrator:               admin@eduguard.edu');
  console.log('======================================================');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
