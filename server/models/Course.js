const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  durationYears: {
    type: Number,
    default: 4
  },
  totalSemesters: {
    type: Number,
    default: 8
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
