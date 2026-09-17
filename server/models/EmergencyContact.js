const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true // e.g. "Campus Security Control Room"
  },
  department: {
    type: String,
    required: true // e.g. "Security", "Medical Centre", "IT Helpdesk", "Anti-Ragging Helpline"
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  is24x7: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
