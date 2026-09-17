const mongoose = require('mongoose');

const academicSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true // e.g. "2025-2026 Even Semester"
  },
  year: {
    type: String,
    required: true // e.g. "2025-2026"
  },
  semesterType: {
    type: String,
    enum: ['ODD', 'EVEN'],
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicSession', academicSessionSchema);
