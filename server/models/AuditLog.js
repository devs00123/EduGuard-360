const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true // e.g. "USER_LOGIN", "COMPLAINT_CREATED", "RISK_CALCULATED", "INTERVENTION_CREATED", "STATUS_CHANGE", "ADMIN_OVERRIDE"
  },
  entity: {
    type: String,
    required: true,
    index: true // e.g. "User", "Complaint", "RiskAssessment", "Intervention"
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
