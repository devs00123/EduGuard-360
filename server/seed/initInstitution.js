/**
 * Idempotent Institutional Master Data Initializer
 * Safe for live production: Seeds required campus departments, courses,
 * complaint categories, SLA rules, and emergency contacts ONLY if missing.
 * Does NOT delete or overwrite existing users, students, or tickets.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const Department = require('../models/Department');
const Course = require('../models/Course');
const ComplaintCategory = require('../models/ComplaintCategory');
const SlaRule = require('../models/SlaRule');
const EmergencyContact = require('../models/EmergencyContact');
const User = require('../models/User');

async function initInstitution() {
  console.log('====================================================');
  console.log(' EDUGUARD 360 - INSTITUTIONAL MASTER DATA SETUP');
  console.log('====================================================');
  
  await connectDB();

  // 1. Master Departments
  console.log('\n[1/6] Verifying Campus Departments...');
  const defaultDepartments = [
    { name: 'Computer Science & Engineering', code: 'CSE', type: 'ACADEMIC', description: 'Undergraduate & Postgraduate CSE studies.' },
    { name: 'Information Technology', code: 'IT_ACAD', type: 'ACADEMIC', description: 'Department of Information Technology.' },
    { name: 'Electronics & Communication', code: 'ECE', type: 'ACADEMIC', description: 'Department of ECE.' },
    { name: 'Campus IT & Network Operations', code: 'IT', type: 'FACILITY_SUPPORT', description: 'Campus Wi-Fi, LAN, and server infrastructure.' },
    { name: 'Audio-Visual & Smart Classrooms', code: 'IT_AV', type: 'FACILITY_SUPPORT', description: 'Projectors, smart podiums, digital displays.' },
    { name: 'Electrical & Power Systems', code: 'ELECTRICAL', type: 'FACILITY_SUPPORT', description: 'Power supply, lighting, and HVAC systems.' },
    { name: 'Estate Maintenance & Plumbing', code: 'MAINTENANCE', type: 'FACILITY_SUPPORT', description: 'Water coolers, plumbing fixtures, furniture.' },
    { name: 'Campus Sanitation & Hygiene', code: 'SANITATION', type: 'FACILITY_SUPPORT', description: 'Washroom hygiene, waste management, campus cleanliness.' },
    { name: 'Dean of Student Welfare & Proctor', code: 'ADMIN', type: 'FACILITY_SUPPORT', description: 'Campus administration, student grievances, and security.' }
  ];

  const deptMap = {};
  for (const d of defaultDepartments) {
    let existing = await Department.findOne({ code: d.code });
    if (!existing) {
      existing = await Department.create(d);
      console.log(`  + Created department: [${d.code}] ${d.name}`);
    } else {
      console.log(`  ✓ Verified department: [${d.code}] ${d.name}`);
    }
    deptMap[d.code] = existing;
  }

  // 2. Master Courses
  console.log('\n[2/6] Verifying Academic Degree Courses...');
  const defaultCourses = [
    { name: 'Bachelor of Technology (Computer Science & Engineering)', code: 'BTECH_CSE', department: deptMap['CSE']?._id, durationYears: 4, totalSemesters: 8 },
    { name: 'Bachelor of Technology (Information Technology)', code: 'BTECH_IT', department: deptMap['IT_ACAD']?._id, durationYears: 4, totalSemesters: 8 },
    { name: 'Bachelor of Technology (Electronics & Communication)', code: 'BTECH_ECE', department: deptMap['ECE']?._id, durationYears: 4, totalSemesters: 8 }
  ];

  for (const c of defaultCourses) {
    const existing = await Course.findOne({ code: c.code });
    if (!existing && c.department) {
      await Course.create(c);
      console.log(`  + Created course: [${c.code}] ${c.name}`);
    } else {
      console.log(`  ✓ Verified course: [${c.code}]`);
    }
  }

  // 3. Complaint Categories
  console.log('\n[3/6] Verifying Campus Support Ticket Categories...');
  const defaultCategories = [
    { name: 'Wi-Fi & Internet Connectivity', code: 'WIFI', defaultDepartment: deptMap['IT']?._id, defaultPriority: 'HIGH', keywords: ['wifi', 'internet', 'network', 'lan', 'connection', 'slow'] },
    { name: 'Smart Class & Projector Equipment', code: 'SMART_CLASS', defaultDepartment: deptMap['IT_AV']?._id, defaultPriority: 'MEDIUM', keywords: ['projector', 'hdmi', 'mic', 'screen', 'audio', 'podium'] },
    { name: 'Electrical & Air Conditioning', code: 'ELECTRICAL', defaultDepartment: deptMap['ELECTRICAL']?._id, defaultPriority: 'HIGH', keywords: ['fan', 'light', 'switch', 'power', 'ac', 'cooling', 'socket'] },
    { name: 'Water Coolers & Plumbing', code: 'PLUMBING', defaultDepartment: deptMap['MAINTENANCE']?._id, defaultPriority: 'HIGH', keywords: ['water', 'cooler', 'leak', 'tap', 'washroom', 'drainage', 'filter'] },
    { name: 'Campus Sanitation & Washroom Hygiene', code: 'SANITATION', defaultDepartment: deptMap['SANITATION']?._id, defaultPriority: 'HIGH', keywords: ['washroom', 'dirty', 'clean', 'trash', 'dustbin', 'smell'] },
    { name: 'General Campus Infrastructure', code: 'INFRASTRUCTURE', defaultDepartment: deptMap['MAINTENANCE']?._id, defaultPriority: 'MEDIUM', keywords: ['bench', 'desk', 'window', 'door', 'chair', 'broken'] }
  ];

  for (const cat of defaultCategories) {
    const existing = await ComplaintCategory.findOne({ code: cat.code });
    if (!existing && cat.defaultDepartment) {
      await ComplaintCategory.create(cat);
      console.log(`  + Created complaint category: [${cat.code}] ${cat.name}`);
    } else {
      console.log(`  ✓ Verified complaint category: [${cat.code}]`);
    }
  }

  // 4. SLA Policies
  console.log('\n[4/6] Verifying Resolution SLA Policies...');
  const defaultSla = [
    { priority: 'CRITICAL', maxResolutionHours: parseInt(process.env.SLA_CRITICAL_HOURS) || 4, escalationHours: 2 },
    { priority: 'HIGH', maxResolutionHours: parseInt(process.env.SLA_HIGH_HOURS) || 12, escalationHours: 6 },
    { priority: 'MEDIUM', maxResolutionHours: parseInt(process.env.SLA_MEDIUM_HOURS) || 24, escalationHours: 12 },
    { priority: 'LOW', maxResolutionHours: parseInt(process.env.SLA_LOW_HOURS) || 48, escalationHours: 24 }
  ];

  for (const s of defaultSla) {
    const existing = await SlaRule.findOne({ priority: s.priority });
    if (!existing) {
      await SlaRule.create(s);
      console.log(`  + Created SLA policy: Priority ${s.priority} -> Max ${s.maxResolutionHours}h (Escalate at ${s.escalationHours}h)`);
    } else {
      console.log(`  ✓ Verified SLA policy: Priority ${s.priority} (Max ${existing.maxResolutionHours}h)`);
    }
  }

  // 5. Emergency SOS Contacts
  console.log('\n[5/6] Verifying Campus Emergency Helplines...');
  const defaultContacts = [
    { title: 'Campus Central Security Control Room', department: 'Security', phone: process.env.CAMPUS_HELPLINE || '+91-11-23456789', is24x7: true, location: 'Gate No. 1 Security Complex' },
    { title: 'Campus Health Center & Emergency Ambulance', department: 'Medical Centre', phone: '102', is24x7: true, location: 'Health Centre Block' },
    { title: 'National Emergency Response (Police / Fire)', department: 'National Services', phone: '112', is24x7: true },
    { title: 'UGC National Anti-Ragging Helpline', department: 'Anti-Ragging Helpline', phone: process.env.ANTI_RAGGING_HELPLINE || '1800-180-5522', is24x7: true },
    { title: 'Dean of Student Welfare & Proctor Office', department: 'Student Welfare', phone: '+91-11-23456790', is24x7: false, location: 'Administrative Block Room 104' }
  ];

  for (const ec of defaultContacts) {
    const existing = await EmergencyContact.findOne({ title: ec.title });
    if (!existing) {
      await EmergencyContact.create(ec);
      console.log(`  + Created emergency helpline: ${ec.title} (${ec.phone})`);
    } else {
      console.log(`  ✓ Verified emergency helpline: ${ec.title}`);
    }
  }

  // 6. Institutional Administrator Account
  console.log('\n[6/6] Verifying Institutional Executive Account...');
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (!existingAdmin) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@eduguard.edu';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'EduGuard@Admin2026!';

    await User.create({
      name: 'Institutional Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN',
      department: deptMap['ADMIN']?._id || null,
      isActive: true
    });

    console.log('  ★ Initial Super Administrator Provisioned:');
    console.log(`    Email:    ${adminEmail}`);
    console.log(`    Password: ${adminPassword}`);
    console.log('    [IMPORTANT] Please sign in and change this password immediately in production.');
  } else {
    console.log(`  ✓ Active Administrator account confirmed: ${existingAdmin.email}`);
  }

  console.log('\n====================================================');
  console.log(' INSTITUTIONAL INITIALIZATION COMPLETE & VERIFIED');
  console.log(' EduGuard 360 is ready for campus deployment.');
  console.log('====================================================\n');

  await mongoose.disconnect();
}

if (require.main === module) {
  initInstitution().catch(err => {
    console.error('[Init Error] Institutional setup failed:', err);
    process.exit(1);
  });
}

module.exports = initInstitution;
