const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCategory',
    required: true,
    index: true
  },
  campus: {
    type: String,
    default: 'Main Campus'
  },
  block: {
    type: String,
    required: true
  },
  building: {
    type: String,
    default: 'Academic Complex'
  },
  floor: {
    type: String,
    default: 'Ground Floor'
  },
  room: {
    type: String,
    required: true
  },
  gpsLocation: {
    latitude: Number,
    longitude: Number
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiAnalysis: {
    detectedCategory: String,
    suggestedPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    suggestedDepartment: String,
    academicImpact: {
      type: String,
      enum: ['NONE', 'MINOR', 'MODERATE', 'SIGNIFICANT'],
      default: 'NONE'
    },
    summary: String,
    reason: String,
    confidence: Number
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    index: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
    index: true
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: [
      'SUBMITTED',
      'AI_ANALYZED',
      'ASSIGNED',
      'ACKNOWLEDGED',
      'IN_PROGRESS',
      'RESOLVED',
      'STUDENT_CONFIRMED',
      'REOPENED',
      'ESCALATED',
      'CANCELLED'
    ],
    default: 'SUBMITTED',
    index: true
  },
  cluster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCluster',
    default: null
  },
  slaDeadline: {
    type: Date,
    required: true
  },
  isSlaBreached: {
    type: Boolean,
    default: false
  },
  slaBreachedAt: {
    type: Date,
    default: null
  },
  resolutionProof: {
    filePath: String,
    notes: String,
    resolvedAt: Date
  },
  studentFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  adminOverride: {
    isOverridden: {
      type: Boolean,
      default: false
    },
    previousPriority: String,
    overrideReason: String,
    overriddenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    overriddenAt: Date
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
