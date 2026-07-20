const mongoose = require('mongoose');

const OrderTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['New', 'Pending', 'Confirmed', 'Completed', 'Cancelled']
  },
  comment: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customer: {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true }
  },
  product: {
    name: { type: String, required: true, trim: true }, // e.g. Perfect Fit Venetian Blind
    blindType: { type: String, required: true, trim: true }, // e.g. Venetian
    colour: { type: String, required: true, trim: true },
    fabric: { type: String, required: true, trim: true },
    width: { type: Number, required: true }, // in cm
    height: { type: Number, required: true }, // in cm
    quantity: { type: Number, required: true, min: 1 },
    room: { type: String, required: true, trim: true },
    fittingType: { type: String, required: true, enum: ['Inside Recess', 'Outside Recess'] },
    installationRequired: { type: Boolean, default: false }
  },
  scheduling: {
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true }, // e.g. Morning, Afternoon
    specialNotes: { type: String, trim: true, default: '' }
  },
  pricing: {
    subtotal: { type: Number, required: true },
    vat: { type: Number, required: true }, // 20%
    grandTotal: { type: Number, required: true }
  },
  metadata: {
    ipAddress: { type: String, default: '' },
    browser: { type: String, default: '' },
    userAgent: { type: String, default: '' }
  },
  status: {
    type: String,
    required: true,
    enum: ['New', 'Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'New'
  },
  timeline: [OrderTimelineSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
