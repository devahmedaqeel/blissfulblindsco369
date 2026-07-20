const mongoose = require('mongoose');

const AttemptSchema = new mongoose.Schema({
  attemptNumber: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, required: true },
  errorMsg: { type: String, default: '' }
});

const NotificationLogSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    index: true
  },
  notificationType: {
    type: String,
    required: true,
    enum: ['EmailConfirmation', 'EmailOwner', 'WhatsAppText', 'WhatsAppPDF']
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Sent', 'Failed'],
    default: 'Pending'
  },
  attempts: [AttemptSchema],
  deliveredAt: {
    type: Date
  },
  failuresCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);
