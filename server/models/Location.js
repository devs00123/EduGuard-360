const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  campus: {
    type: String,
    required: true,
    default: 'Main Campus'
  },
  block: {
    type: String,
    required: true // e.g. "Block A", "Block B", "Block C"
  },
  building: {
    type: String,
    default: 'Academic Complex'
  },
  floor: {
    type: String,
    default: 'Ground Floor' // "Ground Floor", "1st Floor", "2nd Floor", etc.
  },
  room: {
    type: String,
    required: true // e.g. "Room 204", "Lab 3", "Library Hall"
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Location', locationSchema);
