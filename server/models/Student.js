const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  currentSemester: {
    type: Number,
    required: true,
    default: 1
  },
  section: {
    type: String,
    default: 'A',
    uppercase: true
  },
  batch: {
    type: String,
    required: true // e.g. "2023-2027"
  },
  academicSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicSession'
  },
  mentorFaculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  cgpa: {
    type: Number,
    default: 0
  },
  currentRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  currentRiskScore: {
    type: Number,
    default: 0
  },
  previousRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null],
    default: null
  },
  previousRiskScore: {
    type: Number,
    default: null
  },
  riskTrend: {
    type: String,
    enum: ['INCREASED', 'DECREASED', 'UNCHANGED', 'NEW'],
    default: 'NEW'
  },
  lastRiskAssessment: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
