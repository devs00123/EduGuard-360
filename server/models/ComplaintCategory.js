const mongoose = require('mongoose');

const complaintCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  defaultDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  defaultPriority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'alert-circle'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ComplaintCategory', complaintCategorySchema);
