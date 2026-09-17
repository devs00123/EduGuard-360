const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  scoredMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

markSchema.index({ student: 1, assessment: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
