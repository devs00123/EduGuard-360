const mongoose = require('mongoose');

const performanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  semester: {
    type: Number,
    required: true
  },
  sgpa: {
    type: Number,
    required: true
  },
  cgpa: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  trend: {
    type: String,
    enum: ['IMPROVING', 'STABLE', 'DECLINING'],
    default: 'STABLE'
  },
  remarks: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

performanceRecordSchema.index({ student: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('PerformanceRecord', performanceRecordSchema);
