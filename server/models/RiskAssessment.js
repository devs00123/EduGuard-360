const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    required: true,
    index: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  previousRiskScore: {
    type: Number,
    default: null
  },
  previousRiskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', null],
    default: null
  },
  riskTrend: {
    type: String,
    enum: ['INCREASED', 'DECREASED', 'UNCHANGED', 'NEW'],
    default: 'NEW'
  },
  metrics: {
    attendancePercentage: {
      type: Number,
      required: true
    },
    internalMarksAverage: {
      type: Number,
      required: true
    },
    assignmentCompletionRate: {
      type: Number,
      required: true
    },
    pendingAssignmentsCount: {
      type: Number,
      default: 0
    },
    performanceTrend: {
      type: String,
      enum: ['IMPROVING', 'STABLE', 'DECLINING'],
      default: 'STABLE'
    },
    cgpa: {
      type: Number,
      default: 0
    }
  },
  contributingFactors: [{
    factor: {
      type: String,
      required: true // e.g. "Attendance below 75% threshold"
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    impactScore: {
      type: Number // points contributed to risk
    },
    detail: {
      type: String
    }
  }],
  explanation: {
    type: String,
    required: true
  },
  recommendations: [{
    category: {
      type: String, // 'ATTENDANCE', 'ASSIGNMENTS', 'ACADEMIC_STUDY', 'FACULTY_GUIDANCE'
      required: true
    },
    title: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    targetMetric: {
      type: String
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM'
    }
  }],
  aiMetadata: {
    engine: {
      type: String,
      default: 'DETERMINISTIC_EXPLAINABLE_V1'
    },
    model: {
      type: String,
      default: 'builtin-rule-v1'
    },
    confidence: {
      type: Number,
      default: 0.95
    },
    isFallback: {
      type: Boolean,
      default: false
    }
  },
  calculatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
