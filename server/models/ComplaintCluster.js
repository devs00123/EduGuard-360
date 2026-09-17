const mongoose = require('mongoose');

const complaintClusterSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ComplaintCategory',
    required: true
  },
  location: {
    block: String,
    building: String,
    floor: String,
    room: String
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'HIGH'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INVESTIGATING', 'RESOLVED'],
    default: 'ACTIVE'
  },
  relatedComplaints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Complaint'
  }],
  aiSimilarityScore: {
    type: Number,
    default: 0.85
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplaintCluster', complaintClusterSchema);
