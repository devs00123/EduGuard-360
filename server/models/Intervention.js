const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  actionPlan: [{
    task: {
      type: String,
      required: true
    },
    targetDate: {
      type: Date
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PLANNED',
    index: true
  },
  outcome: {
    type: String,
    default: ''
  },
  beforeMetrics: {
    attendance: Number,
    marks: Number,
    assignmentCompletion: Number,
    riskScore: Number
  },
  afterMetrics: {
    attendance: Number,
    marks: Number,
    assignmentCompletion: Number,
    riskScore: Number
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Intervention', interventionSchema);
