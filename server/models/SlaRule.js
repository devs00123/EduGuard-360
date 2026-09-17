const mongoose = require('mongoose');

const slaRuleSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    required: true,
    unique: true
  },
  maxResolutionHours: {
    type: Number,
    required: true // e.g. 4, 12, 24, 48
  },
  warningThresholdHours: {
    type: Number,
    required: true // e.g. 1, 3, 6, 12 before deadline
  },
  escalationRole: {
    type: String,
    default: 'DEPARTMENT_HEAD'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SlaRule', slaRuleSchema);
