const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'RISK_UPDATED',
      'INTERVENTION_CREATED',
      'INTERVENTION_FOLLOWUP',
      'ACTION_PLAN_UPDATED',
      'COMPLAINT_CREATED',
      'COMPLAINT_ASSIGNED',
      'COMPLAINT_ACKNOWLEDGED',
      'COMPLAINT_STARTED',
      'COMPLAINT_RESOLVED',
      'COMPLAINT_REOPENED',
      'COMPLAINT_ESCALATED',
      'SLA_WARNING',
      'SLA_BREACHED',
      'SYSTEM'
    ],
    required: true,
    index: true
  },
  data: {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint'
    },
    ticketId: String,
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    interventionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intervention'
    },
    link: String
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
