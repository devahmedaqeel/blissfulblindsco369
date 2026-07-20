const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  user: {
    type: String,
    default: 'System' // e.g. 'Customer', 'Admin', 'System'
  },
  details: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
